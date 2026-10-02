# Idleon Toolbox Discord bot

**Date:** 2026-10-01 (implementation details added 2026-10-02)
**Status:** Approved 2026-10-02
**Repos:**
- new `it-cloudflare-bot`: the interactions Worker
- `it-cloudflare-leaderboards`: best-3 metrics and main class per player
- `it-cloudflare-profiles`: player-name search endpoint, best-3 in the global lookup
- `IdleonToolbox`: bot wiki index at build time, `?player=` on leaderboards, contributors anchor on guild detail
- `guild-history` and `it-cloudflare-builds`: read only

**Mockups:** posted to a test webhook on 2026-10-01. The final versions are described in "Message format".

## Problem

Players ask Idleon questions in Discord ("where do I get X", "what's my rank", "how is our guild doing").
Answers there link other wikis or nothing at all. Toolbox has the data (wiki entity graph, 165 leaderboards,
guild history, community builds) but no presence where the questions are asked.

The risk is the opposite failure: a bot that answers fully in Discord takes visits, ad impressions and
search signals away from the site.

## Goals

1. Put Toolbox links in front of Discord players at the moment they need the data.
2. Every reply is a teaser plus links. The detail a player would act on stays on the site.
3. Measure it: every link carries UTM tags so GA shows whether the bot adds or takes traffic.
4. Reuse existing data and Workers. No new parsing of saves.

Non-goals: alerts and notifications (need save parsing and profile linking), calculators, anything
conversational or AI driven, per-user settings, `/compare`, `/report`.

## Funnel rule

Applies to every command, now and later:

- The reply shows identity and a headline (name, rank, one-line description, a few numbers).
- Tables, full rank lists, drop chances, recipes and stat blocks are never in the reply.
- Every reply has at least one link button to the page that holds the detail.
- Every link: `utm_source=discord_bot&utm_medium=<command>&utm_content=<target>`.

## Commands

Rollout order. Each phase ships on its own and is judged on its UTM numbers before the next.

| Phase | Command | Answers | Links to |
|---|---|---|---|
| 1 | `/wiki <name>` | what is this, where does it come from (counts only) | `/wiki/<kind>/<slug>` |
| 1 | `/build <class>` | the class's top community builds | `/tools/builds/<class-slug>` |
| 2 | `/profile <name>` | global rank and the player's 3 best metrics | `/leaderboards?player=`, `/account/misc/general?profile=` |
| 3 | `/guild <name>` | guild rank, weekly GP, top contributors | `/guilds/detail?id=<guild_id>` |
| 4 | `/subscribe`, `/unsubscribe` + announcements | Toolbox release highlights in opted-in channels | the features, `/patch-notes` |

`/rank` is folded into `/profile`: with the chosen format the two would show the same thing.

All name options use Discord autocomplete (`autocomplete: true`). The chosen suggestion's value is an exact
id (wiki node id, class key, `mainChar`, `guild_id`), so the command never has to guess. When a user ignores
the suggestions and submits free text, the bot runs the same search and takes the first hit; no hit is the
"not found" reply (see "Errors").

## Message format

All commands reply with a Components V2 message (`flags: 1 << 15`), never a classic embed. Tested
alternatives and why they lost:

- Classic embeds with fields: flat, inline fields squeeze into narrow columns, tiny thumbnails.
- All-native V2 text for profile and guild: readable but a long vertical list; the card image shows the
  same information better.
- Image in a classic embed: no room for buttons inside the card, and the image renders at about 400px.

Shared frame: one `Container` (type 17) with an accent colour, buttons inside it in an `ActionRow`, and a
last `TextDisplay` footer in subtext (`-# idleontoolbox.com · refreshed 12 min ago`).

Accent colours: profile gold `0xFAC775`, guild teal `0x5DCAA5`, wiki purple `0x7F77DD`, build `0xD85A30`,
announcements blue `0x378ADD`.

### `/profile` and `/guild`: card image inside the container

```
Container (accent)
  MediaGallery: card.png (800 wide, rendered at 2x), alt text = the card's facts in one sentence
  ActionRow: link buttons
  TextDisplay: -# footer
```

Profile card (800×300): class icon, player name, "<class>, <n> chars", global rank large with top-% under
it, a "Best ranks" label and 3 boxes (metric label, value, rank and top-%), the best box with a gold border.
Buttons:
- "All ranks" (no count: the leaderboard count changes over time): `/leaderboards?player=<mainChar>` (needs the site change in "Site prerequisites").
- "Full profile": `/account/misc/general?profile=<mainChar>`, the same link `components/Leaderboard.jsx`
  builds for each leaderboard row.

Guild card (800×330): guild icon, guild name, "Level <l> · <members> / <max> members", guild rank large with
the weekly rank change, 3 boxes (Total GP, GP this week with % vs last week, Active this week), "Top
contributors this week" with 3 chips (rank crown icon, name, GP). Buttons: "Full history"
(`/guilds/detail?id=<guild_id>`), "All contributors" (same URL with `#contributors`, see "Site
prerequisites").

Card rules learned from the test posts:

- Discord shows the image at about 560px wide inside a container, roughly 70% of its size, so nothing on
  the 800px card is smaller than 20px.
- Card background `#242429` (Discord's dark container colour) with about 8px outer padding, so the card
  blends into the container instead of drawing a second frame. Boxes `#2f3036`.
- Dark only. Light-theme users see a dark card on a light container; accepted.
- No footer or timestamp inside the image: the V2 footer carries it as real text.
- Check on a phone before launch; only desktop was tested.

### `/wiki`: native V2 text, no image

```
Container (purple)
  Section: TextDisplay("-# <Kind label> · <category>\n## [<Name>](<url>)\n<description>"), Thumbnail: icon
  Separator
  TextDisplay: source counts, e.g. "**Dropped by** 2 · **Reward from** 7" (only relations that exist)
  ActionRow: "View on wiki"
  TextDisplay: -# Idleon Toolbox wiki
```

No card image: about 5,250 entities of 32 kinds would need one template, and the content is mostly text.
Nodes without a description or sources drop those lines; nodes without an icon drop the thumbnail (a
`Section` needs an accessory, so the header becomes a plain `TextDisplay`).

### `/build`: native V2 text

```
Container (coral)
  Section: TextDisplay("## <Class name> builds\nTop community builds"), Thumbnail: class icon
  Separator
  TextDisplay: top 3 builds by likes, one per line: "[<title>](<build url>) · by <ownerName> · <likes> likes"
  ActionRow: "All <Class name> builds", "Create a build"
  TextDisplay: -# Idleon Toolbox builds
```

A class with no builds shows "No <Class name> builds yet" and only the "Create a build" button.

### Icons

- A thumbnail is drawn in a box of about 85px whatever the file size, so a bigger file does not make it
  smaller. Shrink an icon by padding it: the sprite at its own size, or an integer multiple, centred on a
  transparent 128×128 canvas, aiming for about 50px visible.
- Sprites are scaled by integer factors only, so pixels stay square.
- Thumbnails use the site's own asset URLs (`https://idleontoolbox.com/data/...`), padded copies produced
  at build time for the wiki index (see "Data").
- Inline icons in text (skill icons, guild crowns) are application emojis uploaded to the bot (limit 2,000).
  Inside card images they are drawn directly.

## Data

### `/wiki`

Source: `scripts/entity-graph/build.mjs`, which already runs in `prebuild` (`package.json`). It writes
`data/wiki-search-index.json` (about 5,251 entries: `id, kind, label, slug, icon`) and
`data/entity-graph.json` (`{ nodes, edges }`).

New output from the same script: `data/bot-wiki-index.json`, one entry per navigable node with a slug:

| Field | Source |
|---|---|
| `id`, `kind`, `label`, `slug`, `icon` | as in `wiki-search-index.json` |
| `kindLabel` | `KIND_LABELS` in `components/wiki/EntityPanel.jsx` (move the map to a data-free module both import) |
| `category` | `node.category`, humanised: split on `_`, sentence case (`GOLDEN_FOOD` → "Golden food"). Dropped when it equals the kind label, as the entity page does |
| `description` | `node.description`, first sentence or 200 characters |
| `sources` | counts per "where you get it" relation, the same relations `build.mjs` uses for `obtainedFrom`: `drops`, `rewards`, `sells`, `yields`, `produces`, `harvests`, `gathers` (item as `to`), `craftedFrom`, `refinedFrom` (item as `from`). Labels match the wiki's headings: "Dropped by", "Reward from", "Sold by", "Obtained from", "Produced at", "Caught in", "Gathered from", "Crafted from", "Refined from" |
| `obtainedFrom` | `node.obtainedFrom` when no source edge exists |

URL: `/wiki/<kind>/<slug>`. The author line links to `/wiki/<kind>` only for kinds in `LISTED_KINDS`
(`utility/wiki/kinds.mjs`); other kinds (quest, shop, map, spice, station) have no listing page.

The bot repo pulls this file from the site repo at deploy time and bundles it: no KV lookup in the 3s
autocomplete path. A wiki change reaches the bot on the bot's next deploy; a CI step that redeploys the bot
after a site deploy keeps them in step.

Autocomplete: case-insensitive prefix match on `label` first, then substring; within each group items and
monsters first, then the rest; max 25 choices; choice name `"<label> (<kindLabel>)"` (100 characters max);
value `id`.

### `/build`

- Class list: the 23 released classes from `data/website-data/classPromotions.json` (`released: true`),
  bundled. Class key → slug with the site's rule: `name.toLowerCase().replace(/_/g, '-')`
  (`utility/builds/class-paths.mjs`). Display name: underscores to spaces. Icon: `ClassIcons<index>.png`.
- Builds: `GET https://builds.idleontoolbox.workers.dev/api/builds?class=<ClassKey>&sort=top&limit=3`, no
  auth. `class` matches either the family or the subclass, as the class pages do. Response items carry
  `shortId, title, ownerName, likeCount`.
- The list response has no total count, so the reply shows no build count (decided 2026-10-02: not worth a
  second call).
- Never call the build detail endpoint: every detail GET bumps `viewCount`.
- Build links: `/tools/builds/view?id=<shortId>`. The slug pages (`<shortId>-<title-slug>`) only exist for
  builds published before the last site deploy (`fallback: false`), and the bot cannot know which those
  are; `view?id=` always works. The class link uses the slug page, which always exists.

### `/profile`

Today's API (`it-cloudflare-profiles`, `GET`, no auth):

- `?leaderboard=global&leaderboardUser=<mainChar>` → the player and two neighbours each side, with the true
  global `rank`. 404 when the name is not in `composite`.
- `?leaderboard=global` → `totalUsers` (cached in KV for 35 minutes). Percentile = `rank / totalUsers`.

What is missing, and the changes that add it:

1. **Best 3 metrics.** Per-metric percentiles exist only inside the loop in
   `it-cloudflare-leaderboards/src/composite.ts` and are summed, never stored. Extend that loop to keep, per
   player, every metric's tie-averaged percentile, value and rank (position in the all-players sort), then
   store the top 3 on the player's `composite` document as
   `bestMetrics: [{ metric, value, rank, topPercent }]`. `rank` is the competition rank (start of a tie); `topPercent` = `max(0.1, round1(end of the tie / N * 100))`, N = composite player count (the same N as the global "top x%"). Selection:
   - rank by the tie-averaged percentile, so a capped metric shared by many players does not outrank a real
     top-1% result;
   - skip zero values and metrics where `FILTERED_PLAYERS` excludes the player;
   - at most one metric per group, so the 3 are not near-duplicates. Groups are a new `METRIC_GROUPS` in
     `consts.ts`: samples (the existing `SAMPLES`), salt ranks (`*SaltRank`), minigames (`*Minigame`),
     colosseum (`w1Colo`..`w6Colo`), core stats (strength, agility, wisdom, luck), the four sushi metrics,
     the three jelly metrics, the three mega fishing metrics. Every other metric is its own group;
   - ties broken by rank, then metric key, for stability between runs.
   The global `leaderboardUser` response adds `bestMetrics` for the requested player (additive, the site
   ignores it).
2. **Main class.** `player_metrics` has no class. `profiles.leaderboardData` keeps `CharacterClass_0`
   (`leaderboard-keys.ts`); slot 0 is the main character (`mainChar = charNames[0]`). Add it to the
   `player_metrics` projection and store it on `composite` as `mainClass`. Verify during implementation that
   the stored value is the class index used by `ClassIcons<index>.png` and `classPromotions`.
3. **Name search for autocomplete.** No endpoint lists or searches names. New:
   `GET /api/leaderboards/names?q=<prefix>` in `it-cloudflare-profiles` (add the path to the allow-list).
   Query `composite` for `profileAccess: 'public'` and a case-insensitive anchored prefix on `mainChar`,
   sorted by rank, limit 25, returning `[{ mainChar, rank }]`. Needs an index on `composite.mainChar` with a
   case-insensitive collation; `composite` is rebuilt every run, so create the index in the run itself.
   `Cache-Control: max-age=300`.
4. **Labels and values.** There is no label map: the site derives labels with `camelToTitleCase`
   (`polyfills.js`) and formats values with `notateNumber` (`components/Leaderboard.jsx`). The bot ports
   both, plus a small override map for the keys that read badly (`w1Colo` → "W1 Colosseum", `choppin` →
   "Choppin", the `/hr` keys).

Anonymous players: `composite` stores them under their `Anon#` id, so a real name never resolves (404) and
the name search excludes them by `profileAccess`. The bot never shows or accepts `Anon#` ids.

### `/guild`

API: `https://guild-history.idleontoolbox.workers.dev`, `GET`, no auth, `cache-control: max-age=300`.

- `GET /api/guilds` → `{ week, captured_at, guilds[] }`, about 1,000 guilds ordered by rank, each with
  `guild_id, guild_name, guild_icon, total_gp, gp_this_week, vs_last_wk_pct, rank, rank_delta_2w,
  members_count`. Autocomplete filters this list (cached in the bot for 5 minutes). Names are not unique:
  choice name `"<guild_name> (#<rank>)"`, value `guild_id`.
- `GET /api/guilds/<guild_id>` → detail with `current_week.members[]` (`member_name, gp_earned,
  member_rank`), `rank_history[]` (one point per UTC day, 30 days). 404 when the guild is not in this week's
  snapshot.

Card fields:

| Field | Source |
|---|---|
| Rank, total GP, members | `rank`, `total_gp`, `members_count` |
| Level, max members | `getGuildLevel(total_gp)` and `30 + 4 × level`, ported from `parsers/guild` |
| Weekly rank change | `rank_history` point closest to 7 days before the latest, minus current rank. No field gives last week's rank directly (`rank_delta_2w` spans two weeks) |
| GP this week, vs last week | `current_week.gp_this_week`; the % ports the detail page's `computeVsLastWeekPct` (this week's GP vs the last-week timeseries point at or before latest minus 7 days), not the index's `vs_last_wk_pct`, so the card matches the page it links to |
| Active this week | members with `gp_earned > 0` (new, not shown on the site) |
| Top contributors | top 3 members by `gp_earned`; crown for `member_rank` 0 and 1 (`/etc/GuildRank0.png`, `/etc/GuildRank1.png`) |
| Icon | `guild_icon` rendered as `/data/G2icon<n>.png`; fall back to `/etc/Guild.png` |

Only the tracked top ~1,000 guilds exist in the API; see "Errors" for the rest.

### Site prerequisites

1. **`?player=` on `/leaderboards`** (before phase 2). `pages/leaderboards.jsx` reads only `?t=<tab>`;
   player search is the in-page field (`handleUserSearch`), which no URL can trigger. When `router.isReady`
   and `player` is a string, fill the field and run the same search once. Same parameter name the
   leaderboards redesign (2026-09-20 draft) plans, so the bot's links keep working when it lands.
2. **`#contributors` on `/guilds/detail`** (before phase 3). The contributors section has no id. Add
   `id="contributors"` and scroll to it once the guild data has loaded when the URL hash asks for it (the
   page renders a loader first, so the browser's own hash scroll finds nothing).
3. **Shared wiki labels** (phase 1). Move `KIND_LABELS` out of `EntityPanel.jsx` into a data-free module so
   `build.mjs` can import it.

## Errors

Every error is an ephemeral reply (flag 64, only the user sees it), one line, plus a link where useful.

| Case | Reply |
|---|---|
| `/wiki`: no match | "Nothing in the wiki matches '<text>'." + "Search the wiki" button (`/wiki`) |
| `/build`: no match | "No class matches '<text>'." + "Browse builds" button (`/tools/builds`) |
| `/profile`: not found (includes anonymous players) | "No public leaderboard profile named '<name>'." + "Browse leaderboards" button (`/leaderboards`, `utm_content=not_found`) |
| `/guild`: not found | "'<name>' isn't in the top ~1,000 tracked guilds." + "Browse guilds" button |
| An upstream API fails or times out (5s) | "Toolbox data is unavailable right now, try again in a few minutes." |
| Card render fails | Fall back to the all-native V2 text layout for that command, so the user still gets an answer |
| Cooldown hit | "Slow down, try again in a few seconds." |

Unhandled exceptions are logged with the interaction id; the user gets the "unavailable" reply.

## Architecture

```
Discord ──POST /interactions──▶ it-cloudflare-bot (Worker)
                                 ├─ verify Ed25519 signature (reject with 401)
                                 ├─ PING ─▶ PONG
                                 ├─ autocomplete ─▶ wiki index (bundled) / class list (bundled)
                                 │                  / profiles names API / guild index (cached)
                                 ├─ /wiki ─▶ reply directly (V2 text)
                                 ├─ /build ─▶ defer → builds API → edit original response (V2 text)
                                 ├─ /profile, /guild ─▶ defer → APIs → card → edit original response
                                 └─ /subscribe, /unsubscribe ─▶ D1
                                 card render: Satori + resvg-wasm, PNG cached with the Cache API
```

- One bot, one Worker, one interactions endpoint, routing by command name.
- No gateway connection: slash commands, autocomplete and link buttons all work over HTTP.
- `/build`, `/profile` and `/guild` answer with a deferred response (type 5), then fetch (and render) in
  `ctx.waitUntil` and PATCH the original response. `/wiki` answers directly (type 4) from the bundled
  index. Discord allows 3s for the first response and 15 minutes for the follow-up; any command that calls
  an upstream API with a 5s timeout must defer.
- Caches (Workers Cache API, `caches.default`): API responses and card PNGs, key
  `<kind>:<id>:<refresh window>`, TTL 30 minutes. A player or guild is fetched and rendered at most once
  per window per data centre. Free, no R2.
- Card templates are JSX for Satori, drawn from the mockup HTML. Fonts bundled: an open font with similar
  metrics to the mockups' Segoe UI (Noto Sans or Inter). Sprites fetched from the site's asset URLs.
- Upstream calls time out after 5 seconds.

## Discord application setup

- **A new application, not the triage bot's.** The `it-cloudflare-triage` application stays private and
  separate: it has the privileged Message Content intent and Manage Threads in the Toolbox server, which a
  public bot must not carry (verification past 100 servers requires justifying every privileged intent,
  and one leaked token would expose both). An application also has a single interactions endpoint, so
  sharing it would block slash commands for triage later.
- **Application:** "Idleon Toolbox" in the Developer Portal, marked Public Bot, with the avatar from
  "Identity". Interactions
  endpoint URL = the Worker's `/interactions`. Discord sends a PING on save; the Worker must answer it.
- **Install contexts:** both guild install and **user install**. A user-installed bot lets a player run
  `/wiki`, `/build` and `/profile` in any server or DM without an admin adding it, which directly attacks the
  distribution problem. Commands set `integration_types: [0, 1]` and `contexts: [0, 1, 2]`.
  `/subscribe` and `/unsubscribe` are guild-install only (`integration_types: [0]`, `contexts: [0]`).
- **Scopes and permissions:** `applications.commands` for everything interactive. Guild install adds the
  `bot` scope with Send Messages and Embed Links, needed only for announcements. `/subscribe` and
  `/unsubscribe` default to Manage Channels (`default_member_permissions`).
- **Install link:** Discord's default install link from the portal, shown on the site (footer or settings)
  and in the Toolbox server.
- **Config:** `DISCORD_APPLICATION_ID` and `DISCORD_PUBLIC_KEY` are public values and live in
  `wrangler.toml` `[vars]` (never also as secrets: a secret and a var with the same name conflict). The Worker
  needs no secret in phase 1: interaction replies are authorised by each interaction's own token.
  `DISCORD_BOT_TOKEN` lives only in the local `.dev.vars` for command registration, and becomes a
  `wrangler secret put` secret in phase 4, when announcements post as the bot.
- **Application emojis:** skill icons and guild crowns uploaded once with a script; their ids live in a
  generated JSON in the bot repo.

## Development and deploy

- **Repo:** `it-cloudflare-bot`, TypeScript, Wrangler, same layout as the other `it-cloudflare-*` Workers.
- **One application** (decided 2026-10-02). An application has one interactions endpoint, so while the
  endpoint points at a local tunnel the public bot is down. Acceptable: before launch nobody else uses it,
  and after launch most changes are verified by unit tests and deployed directly. A separate dev
  application can be added later if live testing ever needs to run alongside the public bot.
- **Local:** `wrangler dev` plus a Cloudflare Tunnel (`cloudflared tunnel --url http://localhost:8787`) as
  the interactions endpoint while developing. Discord needs a public HTTPS URL. Point it back at the
  deployed Worker when done.
- **Command registration:** a script that PUTs the command list. Dev: to a test server
  (`/applications/<id>/guilds/<guild>/commands`, instant). Production: global
  (`/applications/<id>/commands`), run manually (`npm run register -- --global`) when the command list changes, not on every deploy; global changes can take a while to reach clients.
- **Tests:** unit tests for signature verification, autocomplete ranking, best-3 selection (in the
  leaderboards repo), label formatting, and V2 payload builders against snapshot JSON. Card rendering gets a
  snapshot test of the PNG size and a smoke render per template.
- **Deploy:** `wrangler deploy` after pulling the latest `bot-wiki-index.json`. Optionally triggered by the
  site's deploy workflow.

## Cost

Runs on the existing Workers Paid plan ($5/month). Its quota is shared by every Worker on the account
(profiles, leaderboards, builds, triage, guild-history), so the bot has no budget of its own. Plan figures
below are from memory; check them against Cloudflare's current pricing page before launch.

Plan (as remembered): 10M requests and 30M CPU-ms per month included; about $0.30 per extra million
requests and $0.02 per extra million CPU-ms. 30s CPU per invocation, 10 MB compressed bundle.

Estimate at 1,000 `/wiki` and 300 card commands a day:

| Item | Per month | Share of included |
|---|---|---|
| Interactions incl. autocomplete (~8 keystrokes per command) | ~350k requests | ~3.5% |
| `/wiki` CPU (bundled index, 1-2 ms each) | ~60k CPU-ms | ~0.2% |
| Card renders (Satori + resvg, ~100-300 ms each, minus cache hits) | ~2-3M CPU-ms | ~7-10% |
| Calls to profiles, guild-history and builds APIs | ~20k requests | negligible |

10x this volume still fits. Notes:

- The bundle needs the paid plan: resvg WASM (~2.5 MB) plus fonts and the wiki index exceed the free
  plan's 3 MB compressed limit, but sit well under 10 MB.
- Name autocomplete is the one path that reaches MongoDB per keystroke. The endpoint's 5-minute cache and
  Discord's own debouncing keep it small; watch it after phase 2.
- The best-3 computation reuses the composite loop in the 30-minute run; marginal CPU.
- Before launch: set a billing notification.

Current usage (dashboards, 2026-10-01):

- Cloudflare, last 7 days: 141.57k Worker invocations (~600k/month, ~6% of the included 10M), CPU P90
  89 ms. The 52.85M "total requests" figure is zone traffic (the site through Cloudflare), not Workers, and
  is not billed against the Workers quota. The bot's ~350k requests/month brings the total to ~1M, still
  ~10% of included.
- CPU total is not on that dashboard (P90 is per invocation, not a sum). Read the monthly CPU-ms from
  Workers & Pages → Plans/Usage. Even if card renders push past the included 30M, overage is about $0.02
  per million CPU-ms: a few cents.
- MongoDB Atlas Flex (Frankfurt): ~1.3 reads/s, 3 / 500 connections, 757 MB / 5 GB. Flex is billed by
  operations per second; the bot adds well under 0.1 ops/s at the estimated volume, less with the caches.
  No tier change expected.

## Scaling to many servers

Cost follows command volume, not server count: 10 servers running 100 commands a day cost the same as one
server running 1,000. The Idleon player base caps total volume, so more servers mostly means the same
players spread across more places; the 10x headroom in "Cost" covers it.

Unchanged by server count:

- HTTP interactions keep no connection to any server. Discord posts each interaction to the Worker, so 5 or
  500 servers is the same setup. Gateway sharding (needed past 2,500 servers) never applies.

Changes as the bot spreads:

1. **Verification at 100 servers.** An unverified bot cannot join more than 100 servers. Verification runs
   through the Discord Developer Portal and includes an identity check on the owner. Start it as soon as the
   bot nears 75 servers; it takes time. User installs do not count toward this limit.
2. **Announcement fan-out.** Posting to N subscribed channels is N bot API calls under Discord's global limit
   of about 50 requests a second. See "Announcements".
3. **Spam protection.** One player spamming `/profile` would trigger renders and API calls. Per-user
   cooldown of a few seconds, through the Workers rate-limiting binding. Cached cards already absorb
   repeated lookups of the same player.
4. **Upstream load.** More servers means more distinct players looked up. The 30-minute API and card caches
   mean each player or guild is fetched at most once per refresh per data centre, however many servers ask.
5. **Admin control.** Large servers will want the bot in specific channels only. Discord's per-command
   permissions (Server Settings → Integrations) cover this with no bot work; say so in the bot's description
   and its install message.

## Announcements (phase 4)

- **Subscribe:** `/subscribe channel:<#channel>` (Manage Channels) stores `{ guild_id, channel_id,
  subscribed_by, created_at }` in D1, replacing any earlier channel for that server. `/unsubscribe` deletes
  it. Both reply ephemerally.
- **Trigger:** manual. An authenticated `POST /admin/announce` (shared secret header) with the V2 payload.
  The `/announce` skill drafts the highlights; a small script turns them into the payload and posts it, so
  publishing in the Toolbox server and to subscribers is one step.
- **Fan-out:** the admin endpoint enqueues one message per subscribed channel into a Cloudflare Queue; the
  consumer posts with the bot token at about 20 per second and respects `429` `retry_after`. A post that
  fails with Unknown Channel (10003) or Missing Access (50001) removes the subscription.
- **Format:** at most 3 highlights, each linking to the feature's own page (`utm_content=<feature>`);
  "+ N more changes" linking to `/patch-notes`; fixes only as a count unless one is notable. Footer:
  "-# This server subscribed to Toolbox updates · /unsubscribe to stop".

## Traffic impact

Expected net effect: positive but modest. The bot is a reach tool, not a major traffic source.

The bound on the downside: most site visits are players analysing their own account (dashboard, alerts,
optimizers, world pages). None of that fits in a Discord message and the bot does not try. Any traffic the
bot can take away comes only from the public pages: leaderboards, guilds, wiki. Check their share of
sessions in GA before launch; it is likely small next to the account pages.

| Command | Expected effect | Reasoning |
|---|---|---|
| `/wiki` | Positive | Catches questions that today get answered with other wikis' links. Some loss: "what does X do" is fully answered by the description and gets no click, but those players were probably not reaching Toolbox before. |
| `/build` | Positive | Points to the builds pages, the pages losing search traffic. Only titles and likes, never the build itself. |
| `/profile` | Neutral, least certain | Players who check their rank on the site may check it in Discord instead. Against that: bragging posts show Toolbox to new players, and the 3-best card leaves "All ranks" as the reason to click. |
| `/guild` | Slightly negative for guild pages, positive for reach | Members checking weekly GP may stop opening the detail page, but the command gets the bot into many guild servers, which is how `/wiki` reaches more players. |
| Announcements | Positive | Players outside the Toolbox server learn about new features, and each highlight links to the feature itself. |

`/wiki`, `/build` and announcements are built with confidence. `/profile` and `/guild` are experiments:
measured, and trimmed or switched off if they take more than they bring.

## Rollout and measurement

Decided 2026-10-02: no public launch per phase. Each phase is built, deployed and tested in the private test
server only (guild-registered commands); the bot is published once, when every command is done.

1. Launch (after phase 4): register commands globally, clear the test-server copies, publish the
   user-install link in the Toolbox server and on the site, then ask the IdleOn server mods and two or three
   large guild servers to add it. Distribution matters more than features.
2. After launch, track two numbers per command against the month before launch:
   - **Gain:** sessions with `utm_source=discord_bot`, split by `utm_medium` (command) and `utm_content`
     (click target).
   - **Loss:** leaderboards searches (`?player=` visits plus in-page searches), `/guilds/detail` and wiki
     entity page sessions that are not from the bot.
3. If the loss grows faster than the gain, trim what the reply shows (for example drop the best-ranks boxes
   from `/profile`) or disable the command. Each command can be switched off on its own; the phased rollout
   means only one command is ever at risk.
4. Flat gain with no loss points to distribution (not enough servers), not to the bot.

## Identity

- Name: **Idleon Toolbox**, same as the site, so every reply builds the same brand.
- Avatar: the site favicon (`public/data/Coins5.png`, the purple coin). The source is 21×21, so the avatar is
  a 512×512 render with the coin scaled by an integer factor (16x, 336px), centred on `#242429`, leaving
  margin for Discord's circular crop. Integer scaling keeps the pixels square.

## Open questions

1. Wiki page og tags: plain wiki URLs pasted in Discord do not unfurl (og tags were declined 2026-08-23).
   `og:title` + `og:image` on wiki pages alone would make every pasted link a preview. Worth revisiting
   separately.
2. Do the leaderboard podium posts in `it-cloudflare-leaderboards/src/discord.ts` (a webhook today) move to
   the bot identity?
