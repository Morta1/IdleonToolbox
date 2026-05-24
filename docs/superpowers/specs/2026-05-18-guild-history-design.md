# Guild History — Design Spec

**Date:** 2026-05-18
**Status:** Draft, awaiting review
**Validated by:** `guild-history-poc/` (auth + Firestore + RTDB reads end-to-end)

## Problem

`pages/guilds.jsx` shows a live, point-in-time guild leaderboard. There is no persistence layer, so:

- Players can't see week-over-week guild GP growth or rank movement
- Per-member weekly contributions (`m.e`) are lost the moment Idleon's weekly reset hits
- There's no "guild detail" experience beyond the current snapshot

The `.e` field on each member is server-maintained "GP earned this week" and resets weekly. If we capture snapshots on a cadence, we get a real history feed nothing else in the ecosystem has.

## Constraints

- **We don't own the Idleon Firebase project.** No service account possible — auth must be as a regular Firebase user with email/password.
- **Toolbox is statically exported (Next.js)** — no first-party server runtime. Background data collection must happen elsewhere.
- **Refresh token is a credential.** Must live in a server secret store, never client.
- **`_guildStat` and `_guild/*` paths are readable by any signed-in user** (validated in POC — see findings below).

## POC findings

`guild-history-poc/` ran the full auth + read pipeline against production Firebase:

| Step | Result | Latency |
|---|---|---|
| `securetoken.googleapis.com` exchange | ✅ fresh ID token | ~280ms |
| `firestore.googleapis.com/_guildStat` list | ✅ 300 docs | ~1.1s |
| RTDB `_guild/{id}` × 3 parallel | ✅ populated | ~390ms |

Key data observations:
- `.e` (GP earned this week) is populated with real values (e.g. 25104, 21685 on top contributors)
- `.p` is the **raw point balance**, not `totalGp`. The leaderboard's displayed total is `.p + sum(stat purchase costs)` — both pieces are already in `_guildStat`
- Guild count in `_guildStat`: 300 docs. The toolbox filters to top 150 and then `members.length > 10`

## Architecture

```
┌──────────────────────┐         ┌──────────────────────┐
│  Cloudflare Worker   │  cron   │  Firebase (idlemmo)  │
│  guild-history       │ ──30m──▶│  REST API as user    │
│                      │ ◀─JSON──│  _guildStat + _guild │
│  - scheduled handler │         └──────────────────────┘
│  - fetch handler     │
│         │            │         ┌──────────────────────┐
│         ├──UPSERT───▶│  Cloudflare D1       │
│         │            │  guild_snapshots     │
│         │            │  member_contributions│
│         │            └──────────────────────┘
│         │            │
│         └──GET /api──┼─────────┐
└──────────────────────┘         ▼
                          ┌──────────────────────┐
                          │  IdleonToolbox (web) │
                          │  /guilds + /guilds/  │
                          │  [id] read history   │
                          └──────────────────────┘
```

Three units, each independently understandable and testable:

1. **Worker** (`guild-history` repo, separate from toolbox) — collects snapshots on cron, exposes history via HTTP
2. **D1 database** — append-mostly snapshots, week-keyed
3. **Toolbox frontend** — replaces direct Firebase guild reads with worker API calls; adds `/guilds/[id]` page

## Component 1: Worker

### Repo layout

A new sibling repo `guild-history` (not in IdleonToolbox). Promotes the POC code:

```
guild-history/
├── src/
│   ├── worker.js          # entry: scheduled (branches on event.cron) + fetch handlers
│   ├── auth.js            # token refresh + caching (from POC)
│   ├── firebase.js        # REST clients (listGuildStats, readGuild + .w parsing)
│   ├── discover.js        # weekly full-scan → tracked cohort
│   ├── snapshot.js        # hourly snapshot of tracked cohort + .w bootstrap
│   ├── stat-cost.js       # calcStatCost (mirrors toolbox parsers/guild.ts)
│   ├── week-key.js        # Thursday-anchored ISO week
│   ├── api.js             # HTTP read routes
│   └── db.js              # D1 query helpers
├── migrations/
│   └── 0001_init.sql
├── wrangler.toml
└── package.json
```

### Scheduled handler — two crons, one worker

The worker has two scheduled jobs that share an entry point and branch on `event.cron`:

```js
export default {
  async scheduled(event, env, ctx) {
    const token = await getIdToken(env);
    if (event.cron === '0 4 * * 0') {
      // Weekly discovery — full scan to find top 1000 by stats cost
      await discoverCohort(env.DB, token);
    } else {
      // Hourly snapshot — read tracked cohort only
      await snapshotCohort(env.DB, token);
    }
  },
  async fetch(req, env, ctx) {
    return route(req, env);
  }
};
```

### Cron cadence

| Cron | Schedule | Purpose |
|---|---|---|
| Discovery | `0 4 * * 0` (Sunday 04:00 UTC) | Paginate all ~98k guilds in `_guildStat`, compute `statsCost`, sort, write top **1000** to `tracked_guilds` |
| Snapshot | `0 * * * *` (every hour) | For the 1000 tracked guilds only: read `_guildStat` + RTDB `_guild/{id}` for fresh stats and points; upsert snapshot, member contributions, timeseries |

**Why this split:** the toolbox currently scans all 98k guilds *every* page load. Doing that every 30 min on a cron would add millions of reads/day to Lavaflame's Firebase bill. The cohort of "top 1000 by `statsCost`" changes slowly — weekly refresh is plenty. Hourly cadence on the 1000 tracked guilds gives 168 timeseries points/week (more than enough for smooth charts) and tighter capture of peak `.e` before weekly reset.

**Cohort size — why 1000:** matches Workers Paid plan resource budget at $5/mo (no marginal D1 or Firebase cost), covers ~10× the toolbox's current top-150 leaderboard, future-proof if the game grows.

### `.w` bootstrap (first-time guild observation)

Idleon's RTDB `_guild/{id}` exposes a `.w` field — a map of `{uid → {a: name, b: gp_earned_last_week_final}}`. This is server-side history for the most recent reset.

When the snapshot cron first encounters a guild (i.e. `member_contributions` has no rows for that guild in the previous week), the worker seeds last week's `member_contributions` rows from `.w` data. This makes the "vs last wk" column work on **day 1** of operation instead of after 1–2 weeks of ramp-up.

`.w` only covers one week back; for "2 weeks ago" overlays on the detail page chart, our own historical snapshots are still required (no shortcut available).

### Auth model (validated in POC)

- One-time: human signs in via `accounts:signInWithPassword`, captures refresh token, stores as `wrangler secret put REFRESH_TOKEN`
- Per-cron: `POST securetoken.googleapis.com/v1/token` with refresh token → 1h ID token
- Cache the ID token in module-scope variable; reuse across cron invocations within the same isolate

```js
let cachedToken = { token: null, expiresAt: 0 };
async function getIdToken(env) {
  if (cachedToken.token && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }
  const fresh = await refresh(env.REFRESH_TOKEN);
  cachedToken = { token: fresh.id_token, expiresAt: Date.now() + 3600_000 };
  return fresh.id_token;
}
```

### Read API routes

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/guilds` | Current rankings + per-guild: `gp_this_week`, `gp_last_week_at_same_point`, `rank_now`, `rank_2_weeks_ago`. Powers the `/guilds` index columns. |
| GET | `/api/guilds/:id` | This week + last week + 2 weeks ago weekly GP curves at 30-min resolution, plus member rosters for those three weeks. Powers all three sections of the detail page. |

All responses cached at edge with `Cache-Control: public, max-age=300`. CORS allows `https://idleontoolbox.com` (and `localhost:3001` for dev).

No auth on these endpoints — same data the toolbox already shows publicly.

### Error handling

| Failure | Strategy |
|---|---|
| Refresh token rejected (user signed out / pwd changed) | Worker logs error, returns 500 from `scheduled`. CF cron alert fires. Human re-mints token. |
| Firestore 429 / 5xx | Exponential backoff, up to 3 retries. If still failing, skip this tick, alert on consecutive failures. |
| RTDB read failure for individual guild | Skip that guild only; record partial snapshot. |
| D1 write failure | Retry once; on second failure log + alert. Snapshots are write-once per (week, guild_id) so partial writes recover next tick. |
| Validation: snapshot shape obviously wrong (e.g. <50 guilds returned, all totalGp=0) | Abort write, alert. Protects against silent upstream changes. |

## Component 2: D1 schema

```sql
-- Persistent guild metadata (rarely changes)
CREATE TABLE guilds (
  guild_id      TEXT PRIMARY KEY,
  guild_name    TEXT NOT NULL,
  guild_icon    INTEGER,
  first_seen_at INTEGER NOT NULL,
  last_seen_at  INTEGER NOT NULL
);

-- The current "top 1000" cohort that the hourly snapshot tracks.
-- Refreshed once per week by the discovery cron.
CREATE TABLE tracked_guilds (
  guild_id           TEXT PRIMARY KEY,
  stats_cost         INTEGER NOT NULL,
  rank_at_discovery  INTEGER NOT NULL,
  discovered_at      INTEGER NOT NULL
);
CREATE INDEX idx_tracked_rank ON tracked_guilds(rank_at_discovery);

-- One row per (week, guild). Captures peak state during that week.
CREATE TABLE guild_snapshots (
  week          TEXT NOT NULL,         -- 'YYYY-Www', e.g. '2026-W20'
  guild_id      TEXT NOT NULL,
  total_gp      INTEGER NOT NULL,      -- .p + stats_cost (matches toolbox display)
  points_raw    INTEGER NOT NULL,      -- .p only
  stats_cost    INTEGER NOT NULL,      -- sum(stat purchase costs)
  members_count INTEGER NOT NULL,
  rank          INTEGER NOT NULL,      -- 1..150 within that week
  weekly_gp     INTEGER NOT NULL,      -- sum of all members' max .e this week
  captured_at   INTEGER NOT NULL,      -- ms epoch of latest update
  PRIMARY KEY (week, guild_id)
);
CREATE INDEX idx_snapshots_guild_week ON guild_snapshots(guild_id, week);
CREATE INDEX idx_snapshots_week_rank  ON guild_snapshots(week, rank);

-- One row per (week, guild, member). gp_earned is max .e seen this week.
CREATE TABLE member_contributions (
  week        TEXT NOT NULL,
  guild_id    TEXT NOT NULL,
  member_name TEXT NOT NULL,
  gp_earned   INTEGER NOT NULL,        -- max .e seen
  captured_at INTEGER NOT NULL,
  PRIMARY KEY (week, guild_id, member_name)
);
CREATE INDEX idx_members_guild_week ON member_contributions(guild_id, week);
```

### UPSERT logic (peak capture)

Every snapshot, for each (week, guild, member):

```sql
INSERT INTO member_contributions (week, guild_id, member_name, gp_earned, captured_at)
VALUES (?, ?, ?, ?, ?)
ON CONFLICT(week, guild_id, member_name)
DO UPDATE SET
  gp_earned   = MAX(gp_earned, excluded.gp_earned),
  captured_at = excluded.captured_at;
```

This is the core trick: regardless of exactly when reset hits, the highest `.e` observed within the week is preserved. After reset, new values start from 0 and don't overwrite the captured peak (because `MAX`).

`guild_snapshots.weekly_gp` uses the same UPSERT-MAX pattern on the sum.

### Storage size

- Snapshots: 150 guilds × 52 weeks/year ≈ 7.8k rows/year
- Members: 150 guilds × ~25 members × 52 weeks ≈ 200k rows/year

Both negligible. D1 free tier (5GB) is decades of headroom.

### Week key

`YYYY-Www-THU` format anchored to Idleon's reset boundary, **Thursday 00:00 UTC**. The week containing Thursday `T` is keyed by that Thursday's ISO date (e.g. `2026-W20-THU` = the week running Thu 2026-05-14 00:00 UTC → Thu 2026-05-21 00:00 UTC).

**Why Thursday 00:00 UTC:** the game's canonical weekly tick is `GlobalTime % 604800 == 0`. `GlobalTime` is Unix epoch seconds (proven in `parsers/misc.ts:256`), and Unix epoch 0 (1970-01-01) was a Thursday. This boundary is used throughout the game (Happy Hour, cooking spice circles, etc.) and is reflected in `parsers/dungeons.ts:14` which imports `isThursday`/`previousThursday`/`nextThursday` from `date-fns`. Guild GP reset is assumed to use the same un-offset boundary; this is verified during phase 1 via the observability check below.

**Observability check:** the worker logs a `weekly_reset_detected` event whenever the median `.e` across all observed guilds drops by >80% between consecutive ticks. If the detected reset moment doesn't fall on Thursday 00:00 UTC after 2 weeks of observation, the week-key boundary is corrected to match.

## Component 3: Toolbox frontend changes

**Design principle:** recency over season-long trends. Players check the guild a few times per week, mid-week. Every primary metric references *this week* or *vs last week at this point in the week*. Longer-term history is available but never the headline.

### `pages/guilds.jsx` (modified)

- Replace `getGuilds()` (direct Firebase) with `fetch('https://guild-history.workers.dev/api/guilds')`
- Existing 15-min sessionStorage cache stays
- Row click navigates to `/guilds/[id]` (new page)

**Existing columns kept:** rank (`#`), guild name + icon, total GP (cumulative all-time, matches today's display), members count / max.

**New columns:**

| Column | Source | Notes |
|---|---|---|
| **GP this week** | sum of all members' current `.e` | Live; updates each cron tick. |
| **vs last wk** | `(this_week_gp_at_point_in_week / last_week_gp_at_same_point_in_week) - 1`, expressed as `±N%` | Self-comparison normalizes for guild size and day-of-week. Requires history at the same point-in-week from last week; falls back to blank for guilds with insufficient history. |
| **Rank Δ (2-week)** | `rank_now - rank_2_weeks_ago` | Small signed integer with arrow glyph. Two weeks chosen as the shortest horizon that isn't dominated by single-week rank noise. |

No sparkline on the index page. No WoW absolute deltas (replaced by the pace-aware `vs last wk %`).

### `pages/guilds/[id].jsx` (new)

Three stacked sections, in order. Long-term history is intentionally absent — this page is about *this week*.

**Header**
- Guild icon, name, current rank, total GP, guild level (via existing `getGuildLevel`)
- Pace badge: `+18% pace` / `-7% pace` (same metric as the index column)

**Section 1 — This week's progress (headline)**
- Line chart, x-axis = days of the week (Thu → Wed, anchored to the Idleon reset boundary), y-axis = cumulative GP earned this week
- Three lines overlaid:
  - **Current week** (bold, primary color)
  - **Last week** (faded)
  - **Two weeks ago** (more faded)
- Reads at a glance as "ahead / behind / matching usual pace"
- Data points come from worker history at 30-min resolution; rendered as smoothed lines

**Section 2 — Top contributors this week**
- Sorted list of every guild member's `.e` for the current week, descending
- Bar visualization next to each row for quick scanning
- Updates every 30 min (next worker tick)
- Sortable by name / GP this week / GP last week
- This is the section guild members are expected to refresh repeatedly

**Section 3 — Roster changes this week**
- `+ joined: <names>` — members in current week not present in last week's roster
- `- left: <names>` — members in last week's roster not present in current
- Simple text list; if empty in either direction, omit that line

### Out of scope for v1 detail page

- Member contribution heatmap across N weeks (dropped — too zoomed out)
- Rank history chart over season (dropped — covered adequately by the 2-week Rank Δ on the index)
- Cross-guild comparisons
- "Carrying the guild" rolling top contributors (dropped — current-week leaderboard is enough)
- Hall-of-fame `/weeks/:week/top` view (dropped from v1; data is collected and can be exposed later)

### Routing

Add `/guilds/[id]` to PAGES in `components/constants.jsx` (per CLAUDE.md convention). Icon: reuse guilds icon.

### SEO

`NextSeo` per page with guild name in title. These are real shareable URLs and good organic targets ("Idleon guild [name]" searches).

## Data flow (single cron tick)

1. Worker wakes (CF Cron trigger)
2. `getIdToken()` — cached token if fresh, else refresh
3. `listGuildStats(token)` → 300 Firestore docs → parse → sort by stat cost desc → top 150
4. `batchReadGuilds(token, ids)` → 150 parallel RTDB `GET _guild/{id}.json` calls
5. Filter to `members.length > 10`
6. For each guild: `UPSERT guild_snapshots` and per-member `UPSERT member_contributions` (using MAX)
7. Update `guilds.last_seen_at`
8. Log timing + counts

Estimated total: 5–10s typical. Worker `scheduled` limit is 30s default.

## Testing strategy

- **Unit tests** (vitest in worker repo): Firestore REST shape parsing, week key computation, UPSERT SQL generation, totalGp math
- **Integration**: `wrangler dev` against real Firebase + local D1, verify a snapshot matches what `pages/guilds.jsx` currently displays for the same guild
- **Validation gate**: before every D1 write, assert basic shape (`>= 50 guilds`, `total_gp > 0`, `members_count > 0`). Drop the snapshot if invalid, alert.
- **Frontend**: existing Playwright tests for `/guilds` still pass after backend swap. New e2e for `/guilds/[id]` rendering with mock D1 data.

## Cost

| Item | Cost |
|---|---|
| CF Workers paid plan | $5/mo |
| CF D1 | free tier (well under 5GB, well under read/write quota) |
| Firebase Firestore reads | ~14k/day, free tier 50k/day |
| Firebase RTDB reads | bandwidth-billed; ~150 small docs × 48/day ≈ 3MB/day — negligible |
| Firebase Auth (token refresh) | 48/day — well within free tier |
| **Total** | **~$5/mo** |

## Repo & branch hygiene

- **Toolbox changes (this repo) stay on a local branch until explicitly approved for publication.** Do not push to `origin` or open a PR for any of the following without the owner's go-ahead:
  - `pages/guilds.jsx` modifications
  - new `pages/guilds/[id].jsx`
  - PAGES constant updates in `components/constants.jsx`
  - any other toolbox-side file added or modified for this feature
- The worker lives in a **separate, private repository** (`guild-history`, sibling to this one). It is independent of toolbox publication and can be deployed without exposing toolbox-side code.
- The POC at `guild-history-poc/` (sibling to the toolbox) also stays local and unpublished; treat it as throwaway scaffolding that informs the worker repo.

## Migration & rollout

History starts at deploy. **No backfill is possible** — the data doesn't exist anywhere outside Firebase live state.

Phased:

1. **Phase 1 (week 0):** Deploy worker, start collecting. No frontend changes. Validate data integrity for 2 weeks.
2. **Phase 2 (week ~2):** Ship modified `pages/guilds.jsx` reading from worker API. WoW Δ column shows blanks for guilds with <2 weeks of history (gracefully empty).
3. **Phase 3 (week ~3):** Ship `/guilds/[id]` page. By now there's enough history for charts to be meaningful.

This is also the rollback story: phase 2 frontend change is one PR that can be reverted independently of the worker.

## Decisions (previously open questions)

1. **Weekly reset boundary: Thursday 00:00 UTC.** Derived from the game's `GlobalTime % 604800 == 0` weekly tick (Unix epoch was a Thursday). Validated against `parsers/dungeons.ts` use of `isThursday`/`previousThursday`/`nextThursday` for the Happy Hour boundary, which shares the same anchor. The worker still emits a `weekly_reset_detected` log signal during phase 1 to confirm guild GP reset uses this same un-offset boundary (rather than one of the offset weekly events like vote ballot at +197860s or meritocracy at +543460s). If observation disagrees with Thursday 00:00 UTC, the week-key boundary is corrected before phase 2 ship.
2. **No auth or rate-limiting on read API endpoints** for v1. The data is equivalent to what's already public via `pages/guilds.jsx`. Revisit only if abuse appears.
3. **Skip guilds with `members.length <= 10`** — mirror the existing toolbox filter. Reasons: UX consistency (users don't see these guilds in today's leaderboard, so a detail page would be discoverable only by URL), low data quality (micro-guilds are usually one carrier with spiky/dead charts), and a clean future hatch (a per-guild "watchlist" feature could bypass the threshold for an opted-in guild ID without complicating v1).

## Out of scope

- Historical backfill (impossible)
- Real-time updates (cadence is 30 min)
- Per-character history outside guild context (covered by existing leaderboards)
- Guild chat / message history
- Cross-guild member tracking (which guilds a player has been in over time) — possible follow-up, not v1
- Notifications when a guild's rank changes — follow-up
- Long-term history views (>3 weeks back) — data is collected and stored; UI to expose it is deferred until there's demand
- Hall-of-fame weekly winners page — deferred
- Member contribution heatmap across multiple weeks — dropped from v1 (intra-week resolution serves the same need more concretely)

## Implementation order

1. Promote POC into proper worker repo, scheduled handler, token caching, D1 migrations
2. Implement collect + UPSERT logic (including 30-min granular intra-week snapshots, not just end-of-week aggregates — required for the day-by-day curves)
3. Deploy to staging Worker, monitor 1 week; confirm `weekly_reset_detected` log falls on Thursday 00:00 UTC
4. Implement read API + edge caching (`/api/guilds`, `/api/guilds/:id`)
5. Modify `pages/guilds.jsx` to consume API + add `GP this week`, `vs last wk %`, `Rank Δ (2-week)` columns
6. Build `/guilds/[id]` page: header + pace badge, this-week chart with last-2-weeks overlays, current-week contributor leaderboard, roster diff
7. If phase 1 observed reset doesn't fall on Thursday 00:00 UTC, correct week-key logic before public ship
