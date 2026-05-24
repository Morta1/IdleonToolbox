# Guild History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Cloudflare-Worker-based snapshot pipeline that captures Idleon guild GP history at 30-min resolution, and a recency-focused frontend (`/guilds` + new `/guilds/[id]`) that visualizes current-week progress vs prior weeks.

**Architecture:** Worker repo (`guild-history`, sibling to IdleonToolbox) runs **two crons**: a weekly **discovery** (Sunday 04:00 UTC) that paginates all ~98k guilds in `_guildStat`, computes `statsCost`, and writes the top **1000** into a `tracked_guilds` table; and an **hourly snapshot** that reads only the tracked 1000 (Firestore stats + RTDB) and writes to Cloudflare D1 with UPSERT-MAX semantics. First-time guild observations bootstrap last-week data from the RTDB `.w` field so the "vs last wk" column works on day 1. A read API on the same worker serves the toolbox frontend. The toolbox changes stay on a local branch until publicly approved.

**Tech Stack:** Cloudflare Workers (JS), Cloudflare D1 (SQLite), Firebase Auth REST + Firestore REST + RTDB REST, Next.js + MUI + `@nivo/line` for the frontend, vitest for tests on both sides.

**Spec:** `docs/superpowers/specs/2026-05-18-guild-history-design.md`

**Validation reference:** `guild-history-poc/` (working auth + reads end-to-end)

---

## Phase A: Worker (separate repo)

Repo lives at `C:\Dev\idleon\toolbox\guild-history` (sibling to `IdleonToolbox`). Self-contained — no toolbox-side changes in this phase.

### Task 1: Worker repo scaffolding

**Files:**
- Create: `C:\Dev\idleon\toolbox\guild-history\package.json`
- Create: `C:\Dev\idleon\toolbox\guild-history\wrangler.toml`
- Create: `C:\Dev\idleon\toolbox\guild-history\vitest.config.js`
- Create: `C:\Dev\idleon\toolbox\guild-history\.gitignore`
- Create: `C:\Dev\idleon\toolbox\guild-history\.dev.vars.example`

- [ ] **Step 1: Create the directory and init**

Run:
```powershell
mkdir C:\Dev\idleon\toolbox\guild-history
cd C:\Dev\idleon\toolbox\guild-history
git init
```

- [ ] **Step 2: Write package.json**

```json
{
  "name": "guild-history",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:migrate:local": "wrangler d1 migrations apply guild_history --local",
    "db:migrate:remote": "wrangler d1 migrations apply guild_history --remote"
  },
  "devDependencies": {
    "wrangler": "^3.90.0",
    "vitest": "^3.2.1",
    "@cloudflare/workers-types": "^4.20250101.0",
    "miniflare": "^3.20250101.0"
  }
}
```

- [ ] **Step 3: Write wrangler.toml**

```toml
name = "guild-history"
main = "src/worker.js"
compatibility_date = "2026-05-01"

[triggers]
# Two crons differentiated by event.cron inside the scheduled handler:
#   "0 4 * * 0" — weekly full-cohort discovery (Sunday 04:00 UTC)
#   "0 * * * *" — hourly snapshot of the tracked 1000
crons = ["0 4 * * 0", "0 * * * *"]

[[d1_databases]]
binding = "DB"
database_name = "guild_history"
database_id = "REPLACE_AFTER_CREATE"
migrations_dir = "migrations"

[observability]
enabled = true
```

The `database_id` placeholder gets filled in during Task 12 (deploy) — `wrangler d1 create guild_history` prints the real ID.

- [ ] **Step 4: Write vitest.config.js**

```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['tests/**/*.test.js']
  }
});
```

- [ ] **Step 5: Write .gitignore**

```
node_modules
.wrangler
.dev.vars
*.log
```

- [ ] **Step 6: Write .dev.vars.example**

```
REFRESH_TOKEN=
```

- [ ] **Step 7: Install dependencies**

Run:
```powershell
npm install
```

Expected: dependencies installed into `node_modules/`, `package-lock.json` created.

---

### Task 2: Week-key module (Thursday-anchored)

**Files:**
- Create: `C:\Dev\idleon\toolbox\guild-history\src\week-key.js`
- Create: `C:\Dev\idleon\toolbox\guild-history\tests\week-key.test.js`

**Background:** Idleon's weekly reset is at Thursday 00:00 UTC (derived from `GlobalTime % 604800 == 0`, where `GlobalTime` is Unix epoch seconds and Unix epoch 0 was a Thursday). Week keys must anchor to that Thursday so snapshots straddling a Sunday-Monday boundary stay in the same week, while a snapshot at Wed 23:59 UTC and one at Thu 00:01 UTC belong to different weeks.

- [ ] **Step 1: Write the failing test**

```js
// tests/week-key.test.js
import { describe, it, expect } from 'vitest';
import { weekKey, weekStartMs, pointInWeekMs } from '../src/week-key.js';

describe('weekKey', () => {
  it('returns the Thursday-anchored key for a Friday', () => {
    // Fri 2026-05-15 12:00 UTC → that week's anchor is Thu 2026-05-14
    const ms = Date.UTC(2026, 4, 15, 12, 0, 0);
    expect(weekKey(ms)).toBe('2026-W20-THU');
  });

  it('returns the previous Thursday key just before reset', () => {
    // Wed 2026-05-20 23:59 UTC is still in the week anchored to Thu 2026-05-14
    const ms = Date.UTC(2026, 4, 20, 23, 59, 0);
    expect(weekKey(ms)).toBe('2026-W20-THU');
  });

  it('rolls to the next key at Thursday 00:00 UTC', () => {
    // Thu 2026-05-21 00:00 UTC starts a new week
    const ms = Date.UTC(2026, 4, 21, 0, 0, 0);
    expect(weekKey(ms)).toBe('2026-W21-THU');
  });

  it('handles year boundary correctly', () => {
    // Thu 2027-01-07 is the first ISO-W01-aligned Thursday of 2027
    const ms = Date.UTC(2027, 0, 7, 12, 0, 0);
    expect(weekKey(ms)).toBe('2027-W01-THU');
  });
});

describe('weekStartMs', () => {
  it('returns Thursday 00:00 UTC of the containing week', () => {
    const ms = Date.UTC(2026, 4, 18, 15, 30, 0);  // Mon
    expect(weekStartMs(ms)).toBe(Date.UTC(2026, 4, 14, 0, 0, 0)); // Thu before
  });
});

describe('pointInWeekMs', () => {
  it('returns 0 at the start of week', () => {
    const start = Date.UTC(2026, 4, 14, 0, 0, 0);
    expect(pointInWeekMs(start)).toBe(0);
  });

  it('returns near-week-end millis on Wed 23:59', () => {
    const start = Date.UTC(2026, 4, 14, 0, 0, 0);
    const wed = Date.UTC(2026, 4, 20, 23, 59, 0);
    expect(pointInWeekMs(wed)).toBe(wed - start);
    expect(pointInWeekMs(wed)).toBeLessThan(7 * 24 * 3600 * 1000);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/week-key.test.js`
Expected: FAIL — `Cannot find module '../src/week-key.js'`

- [ ] **Step 3: Implement week-key.js**

```js
// src/week-key.js
const WEEK_MS = 7 * 24 * 3600 * 1000;
// Unix epoch (1970-01-01) was a Thursday, so epoch 0 IS a valid Thursday boundary
const THURSDAY_EPOCH_MS = 0;

export function weekStartMs(ms) {
  const offset = (ms - THURSDAY_EPOCH_MS) % WEEK_MS;
  return ms - offset;
}

export function pointInWeekMs(ms) {
  return (ms - THURSDAY_EPOCH_MS) % WEEK_MS;
}

export function weekKey(ms) {
  const start = weekStartMs(ms);
  const d = new Date(start);
  const year = d.getUTCFullYear();
  const week = isoWeekNumber(d);
  return `${year}-W${String(week).padStart(2, '0')}-THU`;
}

function isoWeekNumber(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/week-key.test.js`
Expected: PASS — all four `weekKey` cases + `weekStartMs` + `pointInWeekMs` tests pass.

---

### Task 3: Auth module (refresh token → ID token)

**Files:**
- Create: `C:\Dev\idleon\toolbox\guild-history\src\config.js`
- Create: `C:\Dev\idleon\toolbox\guild-history\src\auth.js`
- Create: `C:\Dev\idleon\toolbox\guild-history\tests\auth.test.js`

- [ ] **Step 1: Write config.js**

```js
// src/config.js
export const PROJECT_ID = 'idlemmo';
export const WEB_API_KEY = 'AIzaSyAU62kOE6xhSrFqoXQPv6_WHxYilmoUxDk';
export const RTDB_HOST = 'idlemmo.firebaseio.com';
export const ID_TOKEN_TTL_MS = 3600_000;
export const ID_TOKEN_RENEW_BUFFER_MS = 60_000;
```

- [ ] **Step 2: Write the failing test**

```js
// tests/auth.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAuth } from '../src/auth.js';

describe('createAuth', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('exchanges refresh token for ID token on first call', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id_token: 'token-1', refresh_token: 'refresh-x', expires_in: '3600' })
    });
    const auth = createAuth('refresh-x', { fetch: fetchMock, now: () => 1000 });

    const token = await auth.getIdToken();

    expect(token).toBe('token-1');
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toContain('securetoken.googleapis.com');
    expect(opts.body.toString()).toContain('grant_type=refresh_token');
    expect(opts.body.toString()).toContain('refresh_token=refresh-x');
  });

  it('caches the ID token across calls within TTL', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id_token: 'token-1', refresh_token: 'refresh-x', expires_in: '3600' })
    });
    const auth = createAuth('refresh-x', { fetch: fetchMock, now: () => 1000 });

    await auth.getIdToken();
    await auth.getIdToken();
    await auth.getIdToken();

    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('refreshes when token is about to expire', async () => {
    let nowVal = 1000;
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id_token: 'token-1', refresh_token: 'r', expires_in: '3600' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id_token: 'token-2', refresh_token: 'r', expires_in: '3600' }) });
    const auth = createAuth('r', { fetch: fetchMock, now: () => nowVal });

    expect(await auth.getIdToken()).toBe('token-1');

    nowVal += 3600_000 - 30_000;  // 30s before expiry → within renew buffer
    expect(await auth.getIdToken()).toBe('token-2');

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('throws a meaningful error when refresh fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: 'INVALID_REFRESH_TOKEN' } })
    });
    const auth = createAuth('bad', { fetch: fetchMock, now: () => 1000 });

    await expect(auth.getIdToken()).rejects.toThrow(/INVALID_REFRESH_TOKEN/);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- tests/auth.test.js`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement auth.js**

```js
// src/auth.js
import { WEB_API_KEY, ID_TOKEN_TTL_MS, ID_TOKEN_RENEW_BUFFER_MS } from './config.js';

export function createAuth(refreshToken, deps = {}) {
  const fetchFn = deps.fetch || globalThis.fetch;
  const now = deps.now || (() => Date.now());

  let cached = { token: null, expiresAt: 0 };

  async function getIdToken() {
    if (cached.token && now() < cached.expiresAt - ID_TOKEN_RENEW_BUFFER_MS) {
      return cached.token;
    }
    const res = await fetchFn(
      `https://securetoken.googleapis.com/v1/token?key=${WEB_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken })
      }
    );
    const data = await res.json();
    if (!res.ok) {
      throw new Error(`Token refresh failed: ${data?.error?.message || res.status}`);
    }
    cached = { token: data.id_token, expiresAt: now() + ID_TOKEN_TTL_MS };
    return cached.token;
  }

  return { getIdToken };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- tests/auth.test.js`
Expected: PASS — all four cases.

---

### Task 4: Firebase REST clients

**Files:**
- Create: `C:\Dev\idleon\toolbox\guild-history\src\firebase.js`
- Create: `C:\Dev\idleon\toolbox\guild-history\tests\firebase.test.js`

Produces functions to list `_guildStat` (Firestore REST) and read a single `_guild/{id}` (RTDB REST), parsing each into clean JS objects.

- [ ] **Step 1: Write the failing test**

```js
// tests/firebase.test.js
import { describe, it, expect, vi } from 'vitest';
import { listGuildStats, readGuild, batchReadGuilds } from '../src/firebase.js';

describe('listGuildStats', () => {
  it('parses Firestore REST document shape', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        documents: [
          {
            name: 'projects/idlemmo/databases/(default)/documents/_guildStat/abc123',
            fields: {
              n: { stringValue: 'TestGuild' },
              i: { integerValue: '7' },
              stats: {
                arrayValue: {
                  values: [
                    { integerValue: '5' },
                    { integerValue: '3' }
                  ]
                }
              }
            }
          }
        ]
      })
    });

    const result = await listGuildStats('id-token', { fetch: fetchMock });

    expect(result).toEqual([
      { id: 'abc123', guildName: 'TestGuild', guildIcon: 7, stats: [5, 3] }
    ]);
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toContain('firestore.googleapis.com');
    expect(url).toContain('_guildStat');
    expect(opts.headers.Authorization).toBe('Bearer id-token');
  });

  it('returns empty array when no documents', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    const result = await listGuildStats('id-token', { fetch: fetchMock });
    expect(result).toEqual([]);
  });

  it('throws when REST returns error', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ error: { message: 'PERMISSION_DENIED' } })
    });
    await expect(listGuildStats('id-token', { fetch: fetchMock }))
      .rejects.toThrow(/PERMISSION_DENIED/);
  });
});

describe('readGuild', () => {
  it('reads RTDB JSON and returns parsed shape including .w (previous week)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        p: 1500,
        m: {
          '0': { a: 'Alice', e: 5000, g: 0 },
          '1': { a: 'Bob', e: 2000, g: 1 }
        },
        w: {
          '0': { a: 'Alice', b: 8000 },
          '1': { a: 'Bob', b: 3500 }
        }
      })
    });

    const result = await readGuild('id-token', 'abc123', { fetch: fetchMock });

    expect(result).toEqual({
      points: 1500,
      members: [
        { name: 'Alice', e: 5000, rank: 0 },
        { name: 'Bob', e: 2000, rank: 1 }
      ],
      previousWeek: [
        { name: 'Alice', gpEarned: 8000 },
        { name: 'Bob', gpEarned: 3500 }
      ]
    });
    expect(fetchMock.mock.calls[0][0]).toContain('idlemmo.firebaseio.com/_guild/abc123.json');
  });

  it('handles missing members map and missing .w', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ p: 0 }) });
    const result = await readGuild('id-token', 'x', { fetch: fetchMock });
    expect(result).toEqual({ points: 0, members: [], previousWeek: [] });
  });
});

describe('batchReadGuilds', () => {
  it('reads multiple guilds in parallel', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ p: 100, m: {} })
    });
    const result = await batchReadGuilds('id-token', ['g1', 'g2', 'g3'], { fetch: fetchMock });
    expect(result).toHaveLength(3);
    expect(result[0].id).toBe('g1');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('returns nulls for individual failures without breaking the batch', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ p: 100, m: {} }) })
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ p: 200, m: {} }) });

    const result = await batchReadGuilds('id-token', ['g1', 'g2', 'g3'], { fetch: fetchMock });
    expect(result[0].guild).not.toBeNull();
    expect(result[1].guild).toBeNull();
    expect(result[1].error).toBeDefined();
    expect(result[2].guild).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/firebase.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement firebase.js**

```js
// src/firebase.js
import { PROJECT_ID, RTDB_HOST } from './config.js';

export async function listGuildStats(idToken, deps = {}) {
  const fetchFn = deps.fetch || globalThis.fetch;
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/_guildStat?pageSize=500`;
  const res = await fetchFn(url, { headers: { Authorization: `Bearer ${idToken}` } });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`listGuildStats failed: ${data?.error?.message || res.status}`);
  }
  return (data.documents || []).map(parseGuildStatDoc);
}

function parseGuildStatDoc(doc) {
  const id = doc.name.split('/').pop();
  const f = doc.fields || {};
  return {
    id,
    guildName: f.n?.stringValue,
    guildIcon: parseInt(f.i?.integerValue ?? '0', 10),
    stats: (f.stats?.arrayValue?.values || []).map(v => parseInt(v.integerValue ?? '0', 10))
  };
}

export async function readGuild(idToken, guildId, deps = {}) {
  const fetchFn = deps.fetch || globalThis.fetch;
  const url = `https://${RTDB_HOST}/_guild/${guildId}.json?auth=${idToken}`;
  const res = await fetchFn(url);
  if (!res.ok) {
    throw new Error(`readGuild ${guildId} failed: ${res.status}`);
  }
  const data = await res.json();
  return {
    points: data?.p ?? 0,
    members: Object.values(data?.m || {}).map(m => ({
      name: m.a,
      e: m.e ?? 0,
      rank: m.g
    })),
    // .w is Idleon's server-side snapshot of last week's final per-member GP earned
    previousWeek: Object.values(data?.w || {}).map(w => ({
      name: w.a,
      gpEarned: w.b ?? 0
    }))
  };
}

export async function batchReadGuilds(idToken, guildIds, deps = {}) {
  const results = await Promise.all(guildIds.map(async (id) => {
    try {
      const guild = await readGuild(idToken, id, deps);
      return { id, guild, error: null };
    } catch (err) {
      return { id, guild: null, error: err.message };
    }
  }));
  return results;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/firebase.test.js`
Expected: PASS — all 7 cases.

---

### Task 5: D1 schema migration

**Files:**
- Create: `C:\Dev\idleon\toolbox\guild-history\migrations\0001_init.sql`

- [ ] **Step 1: Write the migration**

```sql
-- migrations/0001_init.sql

CREATE TABLE guilds (
  guild_id      TEXT PRIMARY KEY,
  guild_name    TEXT NOT NULL,
  guild_icon    INTEGER,
  first_seen_at INTEGER NOT NULL,
  last_seen_at  INTEGER NOT NULL
);

-- The 1000-guild cohort the hourly snapshot tracks.
-- Refreshed once per week by the discovery cron.
CREATE TABLE tracked_guilds (
  guild_id           TEXT PRIMARY KEY,
  stats_cost         INTEGER NOT NULL,
  rank_at_discovery  INTEGER NOT NULL,
  discovered_at      INTEGER NOT NULL
);
CREATE INDEX idx_tracked_rank ON tracked_guilds(rank_at_discovery);

CREATE TABLE guild_snapshots (
  week          TEXT NOT NULL,
  guild_id      TEXT NOT NULL,
  total_gp      INTEGER NOT NULL,
  points_raw    INTEGER NOT NULL,
  stats_cost    INTEGER NOT NULL,
  members_count INTEGER NOT NULL,
  rank          INTEGER NOT NULL,
  weekly_gp     INTEGER NOT NULL,
  captured_at   INTEGER NOT NULL,
  PRIMARY KEY (week, guild_id)
);
CREATE INDEX idx_snapshots_guild_week ON guild_snapshots(guild_id, week);
CREATE INDEX idx_snapshots_week_rank  ON guild_snapshots(week, rank);

CREATE TABLE member_contributions (
  week        TEXT NOT NULL,
  guild_id    TEXT NOT NULL,
  member_name TEXT NOT NULL,
  gp_earned   INTEGER NOT NULL,
  captured_at INTEGER NOT NULL,
  PRIMARY KEY (week, guild_id, member_name)
);
CREATE INDEX idx_members_guild_week ON member_contributions(guild_id, week);

-- Intra-week timeseries for the day-by-day chart on the detail page.
-- One row per (week, guild, capture tick). Stores cumulative weekly_gp at that moment.
CREATE TABLE guild_timeseries (
  week        TEXT NOT NULL,
  guild_id    TEXT NOT NULL,
  captured_at INTEGER NOT NULL,
  weekly_gp   INTEGER NOT NULL,
  PRIMARY KEY (week, guild_id, captured_at)
);
CREATE INDEX idx_timeseries_guild_week ON guild_timeseries(guild_id, week);

-- Optional, but useful for the reset-detection observability check.
CREATE TABLE reset_events (
  detected_at  INTEGER NOT NULL,
  median_e_before INTEGER NOT NULL,
  median_e_after  INTEGER NOT NULL,
  PRIMARY KEY (detected_at)
);
```

- [ ] **Step 2: Create the local D1 database**

Run:
```powershell
npx wrangler d1 create guild_history
```

Expected output includes a database id. Copy it.

- [ ] **Step 3: Paste the database id into wrangler.toml**

Edit `wrangler.toml`, replace `REPLACE_AFTER_CREATE` with the real id.

- [ ] **Step 4: Apply migration locally**

Run:
```powershell
npm run db:migrate:local
```

Expected: "Migrations applied! 0001_init.sql".

- [ ] **Step 5: Verify schema**

Run:
```powershell
npx wrangler d1 execute guild_history --local --command="SELECT name FROM sqlite_master WHERE type='table';"
```

Expected: lists `guilds`, `tracked_guilds`, `guild_snapshots`, `member_contributions`, `guild_timeseries`, `reset_events`.

---

### Task 6: D1 query helpers

**Files:**
- Create: `C:\Dev\idleon\toolbox\guild-history\src\db.js`
- Create: `C:\Dev\idleon\toolbox\guild-history\tests\db.test.js`

Uses `miniflare` to provide an in-memory D1 for unit tests.

- [ ] **Step 1: Write the failing test**

```js
// tests/db.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { Miniflare } from 'miniflare';
import { readFileSync } from 'fs';
import {
  upsertGuild,
  upsertGuildSnapshot,
  upsertMemberContribution,
  insertTimeseriesPoint,
  getGuildIndex,
  getGuildDetail
} from '../src/db.js';

let mf;
let db;

async function freshDb() {
  mf = new Miniflare({
    modules: true,
    script: 'export default {};',
    d1Databases: { DB: ':memory:' }
  });
  db = await mf.getD1Database('DB');
  const sql = readFileSync('migrations/0001_init.sql', 'utf8');
  // D1's batch needs statements split
  const statements = sql.split(';').map(s => s.trim()).filter(Boolean);
  for (const stmt of statements) {
    await db.exec(stmt);
  }
}

beforeEach(async () => {
  await freshDb();
});

describe('upsertGuild + upsertGuildSnapshot', () => {
  it('inserts a new guild and snapshot', async () => {
    await upsertGuild(db, { id: 'g1', guildName: 'Test', guildIcon: 1 }, 1700000000000);
    await upsertGuildSnapshot(db, {
      week: '2026-W20-THU',
      guildId: 'g1',
      totalGp: 1000,
      pointsRaw: 800,
      statsCost: 200,
      membersCount: 12,
      rank: 5,
      weeklyGp: 500,
      capturedAt: 1700000000000
    });

    const detail = await getGuildDetail(db, 'g1', '2026-W20-THU');
    expect(detail.snapshot.weekly_gp).toBe(500);
    expect(detail.snapshot.rank).toBe(5);
  });

  it('takes MAX(weekly_gp) on conflict', async () => {
    await upsertGuild(db, { id: 'g1', guildName: 'Test', guildIcon: 1 }, 1700000000000);

    const base = {
      week: '2026-W20-THU', guildId: 'g1', totalGp: 1000, pointsRaw: 800,
      statsCost: 200, membersCount: 12, rank: 5, capturedAt: 1700000000000
    };
    await upsertGuildSnapshot(db, { ...base, weeklyGp: 500 });
    await upsertGuildSnapshot(db, { ...base, weeklyGp: 800, capturedAt: 1700000001000 });
    await upsertGuildSnapshot(db, { ...base, weeklyGp: 200, capturedAt: 1700000002000 });

    const detail = await getGuildDetail(db, 'g1', '2026-W20-THU');
    expect(detail.snapshot.weekly_gp).toBe(800);
  });
});

describe('upsertMemberContribution', () => {
  it('keeps the MAX gp_earned across writes', async () => {
    await upsertGuild(db, { id: 'g1', guildName: 'Test', guildIcon: 1 }, 1700000000000);
    await upsertMemberContribution(db, { week: '2026-W20-THU', guildId: 'g1', memberName: 'Alice', gpEarned: 100, capturedAt: 1 });
    await upsertMemberContribution(db, { week: '2026-W20-THU', guildId: 'g1', memberName: 'Alice', gpEarned: 250, capturedAt: 2 });
    await upsertMemberContribution(db, { week: '2026-W20-THU', guildId: 'g1', memberName: 'Alice', gpEarned: 50, capturedAt: 3 });

    const detail = await getGuildDetail(db, 'g1', '2026-W20-THU');
    const alice = detail.members.find(m => m.member_name === 'Alice');
    expect(alice.gp_earned).toBe(250);
  });
});

describe('insertTimeseriesPoint + getGuildDetail', () => {
  it('returns ordered timeseries for the week', async () => {
    await upsertGuild(db, { id: 'g1', guildName: 'Test', guildIcon: 1 }, 1700000000000);
    await insertTimeseriesPoint(db, { week: '2026-W20-THU', guildId: 'g1', capturedAt: 3000, weeklyGp: 300 });
    await insertTimeseriesPoint(db, { week: '2026-W20-THU', guildId: 'g1', capturedAt: 1000, weeklyGp: 100 });
    await insertTimeseriesPoint(db, { week: '2026-W20-THU', guildId: 'g1', capturedAt: 2000, weeklyGp: 200 });

    const detail = await getGuildDetail(db, 'g1', '2026-W20-THU');
    expect(detail.timeseries.map(t => t.captured_at)).toEqual([1000, 2000, 3000]);
    expect(detail.timeseries.map(t => t.weekly_gp)).toEqual([100, 200, 300]);
  });
});

describe('getGuildIndex', () => {
  it('returns one row per current-week guild ordered by rank', async () => {
    const now = 1700000000000;
    await upsertGuild(db, { id: 'g1', guildName: 'A', guildIcon: 1 }, now);
    await upsertGuild(db, { id: 'g2', guildName: 'B', guildIcon: 2 }, now);
    await upsertGuildSnapshot(db, {
      week: '2026-W20-THU', guildId: 'g1', totalGp: 1000, pointsRaw: 1000, statsCost: 0,
      membersCount: 15, rank: 2, weeklyGp: 500, capturedAt: now
    });
    await upsertGuildSnapshot(db, {
      week: '2026-W20-THU', guildId: 'g2', totalGp: 1500, pointsRaw: 1500, statsCost: 0,
      membersCount: 15, rank: 1, weeklyGp: 700, capturedAt: now
    });

    const rows = await getGuildIndex(db, '2026-W20-THU');
    expect(rows.map(r => r.guild_id)).toEqual(['g2', 'g1']);
    expect(rows[0].weekly_gp).toBe(700);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/db.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement db.js**

```js
// src/db.js

export async function upsertGuild(db, guild, capturedAt) {
  await db.prepare(`
    INSERT INTO guilds (guild_id, guild_name, guild_icon, first_seen_at, last_seen_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(guild_id) DO UPDATE SET
      guild_name = excluded.guild_name,
      guild_icon = excluded.guild_icon,
      last_seen_at = excluded.last_seen_at
  `).bind(guild.id, guild.guildName, guild.guildIcon, capturedAt, capturedAt).run();
}

export async function upsertGuildSnapshot(db, s) {
  await db.prepare(`
    INSERT INTO guild_snapshots
      (week, guild_id, total_gp, points_raw, stats_cost, members_count, rank, weekly_gp, captured_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(week, guild_id) DO UPDATE SET
      total_gp      = excluded.total_gp,
      points_raw    = excluded.points_raw,
      stats_cost    = excluded.stats_cost,
      members_count = excluded.members_count,
      rank          = excluded.rank,
      weekly_gp     = MAX(weekly_gp, excluded.weekly_gp),
      captured_at   = excluded.captured_at
  `).bind(
    s.week, s.guildId, s.totalGp, s.pointsRaw, s.statsCost,
    s.membersCount, s.rank, s.weeklyGp, s.capturedAt
  ).run();
}

export async function upsertMemberContribution(db, m) {
  await db.prepare(`
    INSERT INTO member_contributions (week, guild_id, member_name, gp_earned, captured_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(week, guild_id, member_name) DO UPDATE SET
      gp_earned   = MAX(gp_earned, excluded.gp_earned),
      captured_at = excluded.captured_at
  `).bind(m.week, m.guildId, m.memberName, m.gpEarned, m.capturedAt).run();
}

export async function insertTimeseriesPoint(db, t) {
  await db.prepare(`
    INSERT OR IGNORE INTO guild_timeseries (week, guild_id, captured_at, weekly_gp)
    VALUES (?, ?, ?, ?)
  `).bind(t.week, t.guildId, t.capturedAt, t.weeklyGp).run();
}

export async function getGuildIndex(db, week) {
  const { results } = await db.prepare(`
    SELECT s.guild_id, g.guild_name, g.guild_icon, s.total_gp, s.weekly_gp,
           s.rank, s.members_count
    FROM guild_snapshots s
    JOIN guilds g ON g.guild_id = s.guild_id
    WHERE s.week = ?
    ORDER BY s.rank ASC
  `).bind(week).all();
  return results;
}

export async function getGuildDetail(db, guildId, week) {
  const snapshot = await db.prepare(`
    SELECT * FROM guild_snapshots WHERE guild_id = ? AND week = ?
  `).bind(guildId, week).first();

  const members = await db.prepare(`
    SELECT member_name, gp_earned FROM member_contributions
    WHERE guild_id = ? AND week = ? ORDER BY gp_earned DESC
  `).bind(guildId, week).all();

  const timeseries = await db.prepare(`
    SELECT captured_at, weekly_gp FROM guild_timeseries
    WHERE guild_id = ? AND week = ? ORDER BY captured_at ASC
  `).bind(guildId, week).all();

  return {
    snapshot,
    members: members.results,
    timeseries: timeseries.results
  };
}

export async function getSnapshotForWeek(db, guildId, week) {
  return db.prepare(`
    SELECT * FROM guild_snapshots WHERE guild_id = ? AND week = ?
  `).bind(guildId, week).first();
}

export async function replaceTrackedCohort(db, cohort, discoveredAt) {
  // Atomic-ish swap: delete then bulk-insert. cohort = [{ id, statsCost, rank }]
  await db.prepare(`DELETE FROM tracked_guilds`).run();
  for (const g of cohort) {
    await db.prepare(`
      INSERT INTO tracked_guilds (guild_id, stats_cost, rank_at_discovery, discovered_at)
      VALUES (?, ?, ?, ?)
    `).bind(g.id, g.statsCost, g.rank, discoveredAt).run();
  }
}

export async function getTrackedGuildIds(db) {
  const { results } = await db.prepare(`
    SELECT guild_id FROM tracked_guilds ORDER BY rank_at_discovery ASC
  `).all();
  return results.map(r => r.guild_id);
}

export async function hasMemberContributionsForWeek(db, guildId, week) {
  const row = await db.prepare(`
    SELECT 1 AS x FROM member_contributions WHERE guild_id = ? AND week = ? LIMIT 1
  `).bind(guildId, week).first();
  return !!row;
}

export async function getMembersForWeek(db, guildId, week) {
  const { results } = await db.prepare(`
    SELECT member_name, gp_earned FROM member_contributions
    WHERE guild_id = ? AND week = ?
  `).bind(guildId, week).all();
  return results;
}

export async function getTimeseriesForWeek(db, guildId, week) {
  const { results } = await db.prepare(`
    SELECT captured_at, weekly_gp FROM guild_timeseries
    WHERE guild_id = ? AND week = ? ORDER BY captured_at ASC
  `).bind(guildId, week).all();
  return results;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/db.test.js`
Expected: PASS — all 4 describe blocks.

---

### Task 7: Stat-cost calculation

**Files:**
- Create: `C:\Dev\idleon\toolbox\guild-history\src\stat-cost.js`
- Create: `C:\Dev\idleon\toolbox\guild-history\tests\stat-cost.test.js`

Mirrors `calculateGuildBonusCost` from `IdleonToolbox/parsers/guild.ts:132-137`. The formula is a **linear progression** (not geometric): for each level beyond the first, you pay `baseCost + i*costPerLvl` where `i` is the 1-indexed level being purchased. The base `gpBaseCost` and `gpIncrease` values for all 18 bonus tracks are extracted from `IdleonToolbox/data/website-data.json` and inlined directly to keep the worker repo self-contained.

- [ ] **Step 1: Write the failing test**

```js
// tests/stat-cost.test.js
import { describe, it, expect } from 'vitest';
import { calcStatCost, calcUpgradeCost } from '../src/stat-cost.js';

describe('calcUpgradeCost (matches toolbox calculateGuildBonusCost)', () => {
  it('returns 0 for targetLvl 0', () => {
    expect(calcUpgradeCost(0, 10, 40)).toBe(0);
  });

  it('returns baseCost for targetLvl 1', () => {
    expect(calcUpgradeCost(1, 10, 40)).toBe(10);
  });

  it('matches the toolbox linear formula for targetLvl 3', () => {
    // cost = 10; i=1: +(10+40) = 60; i=2: +(10+80) = 150 → total 150
    // Reproducing the exact loop from IdleonToolbox/parsers/guild.ts
    expect(calcUpgradeCost(3, 10, 40)).toBe(150);
  });

  it('matches the toolbox linear formula for targetLvl 5 with base 20 / inc 60', () => {
    // cost = 20; +(20+60)=100; +(20+120)=240; +(20+180)=440; +(20+240)=700
    expect(calcUpgradeCost(5, 20, 60)).toBe(700);
  });
});

describe('calcStatCost', () => {
  it('returns 0 for all-zero stats array', () => {
    expect(calcStatCost([0, 0, 0, 0])).toBe(0);
  });

  it('returns gpBaseCost of track 0 for [1]', () => {
    expect(calcStatCost([1])).toBe(10);  // Guild_Gifts gpBaseCost = 10
  });

  it('sums costs across multiple tracks linearly', () => {
    const a = calcStatCost([1, 0, 0]);
    const b = calcStatCost([0, 1, 0]);
    const c = calcStatCost([0, 0, 1]);
    expect(calcStatCost([1, 1, 1])).toBe(a + b + c);
  });

  it('ignores stats beyond the known bonus count', () => {
    expect(calcStatCost([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5])).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/stat-cost.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement stat-cost.js**

```js
// src/stat-cost.js

// Inlined from IdleonToolbox/data/website-data.json `guildBonuses` array (18 entries).
// Each entry: { gpBaseCost, gpIncrease } — values used by calcUpgradeCost below.
// IMPORTANT: keep in sync if the game adds/changes guild bonus tracks.
const GUILD_BONUSES = [
  { gpBaseCost: 10, gpIncrease: 40 },   // 0  Guild_Gifts
  { gpBaseCost: 20, gpIncrease: 60 },   // 1  Stat_Runes
  { gpBaseCost: 20, gpIncrease: 70 },   // 2  Rucksack
  { gpBaseCost: 20, gpIncrease: 80 },   // 3  Power_of_Pow
  { gpBaseCost: 30, gpIncrease: 90 },   // 4  REM_Fighting
  { gpBaseCost: 30, gpIncrease: 100 },  // 5  Make_or_Break
  { gpBaseCost: 20, gpIncrease: 80 },   // 6  Multi_Tool
  { gpBaseCost: 30, gpIncrease: 90 },   // 7  Sleepy_Skiller
  { gpBaseCost: 30, gpIncrease: 120 },  // 8  Coin_Supercharger
  { gpBaseCost: 10, gpIncrease: 10 },   // 9  Bonus_GP_for_small_guilds
  { gpBaseCost: 20, gpIncrease: 60 },   // 10 Gold_Charm
  { gpBaseCost: 20, gpIncrease: 70 },   // 11 Star_Dazzle
  { gpBaseCost: 20, gpIncrease: 80 },   // 12 C2_Card_Spotter
  { gpBaseCost: 30, gpIncrease: 90 },   // 13 Bestone
  { gpBaseCost: 40, gpIncrease: 150 },  // 14 Skilley_Skillet
  { gpBaseCost: 20, gpIncrease: 80 },   // 15 Craps
  { gpBaseCost: 30, gpIncrease: 90 },   // 16 Anotha_One
  { gpBaseCost: 20, gpIncrease: 80 }    // 17 Wait_A_Minute
];

// Mirrors calculateGuildBonusCost in IdleonToolbox/parsers/guild.ts.
// Linear progression: cost = base; for i=1..targetLvl-1 add (base + i*costPerLvl).
export function calcUpgradeCost(targetLvl, baseCost, costPerLvl) {
  if (targetLvl === 0) return 0;
  let cost = baseCost;
  for (let i = 1; i < targetLvl; i++) {
    cost += baseCost + (i * costPerLvl);
  }
  return cost;
}

export function calcStatCost(stats) {
  let total = 0;
  for (let i = 0; i < stats.length; i++) {
    const bonus = GUILD_BONUSES[i];
    if (!bonus) continue;
    total += calcUpgradeCost(stats[i] || 0, bonus.gpBaseCost, bonus.gpIncrease);
  }
  return total;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/stat-cost.test.js`
Expected: PASS — all 7 cases.

---

### Task 8: Discovery + snapshot orchestration

Two modules. **`discover.js`** runs weekly: paginates all ~98k guilds in `_guildStat`, computes `statsCost`, writes the top 1000 to `tracked_guilds`. **`snapshot.js`** runs hourly: reads the tracked cohort's `_guildStat` (fresh stats) + RTDB `_guild/{id}` (live points + members + `.w`), upserts snapshot rows, member contributions, timeseries — and **bootstraps last-week's member contributions from `.w`** on first observation.

**Files:**
- Create: `C:\Dev\idleon\toolbox\guild-history\src\discover.js`
- Create: `C:\Dev\idleon\toolbox\guild-history\src\snapshot.js`
- Create: `C:\Dev\idleon\toolbox\guild-history\tests\discover.test.js`
- Create: `C:\Dev\idleon\toolbox\guild-history\tests\snapshot.test.js`
- Modify: `C:\Dev\idleon\toolbox\guild-history\src\firebase.js` — add `listAllGuildStats` (paginated) and `readGuildStat` (single-doc fetch by id)

#### 8.1 — Extend firebase.js with paginated list + single-doc fetch

- [ ] **Step 1: Add tests for the new functions**

Append to `tests/firebase.test.js`:

```js
import { listAllGuildStats, readGuildStat } from '../src/firebase.js';

describe('listAllGuildStats (paginated)', () => {
  it('follows nextPageToken until exhausted', async () => {
    const pages = [
      {
        documents: [{
          name: 'projects/idlemmo/databases/(default)/documents/_guildStat/a',
          fields: { n: { stringValue: 'A' }, i: { integerValue: '1' }, stats: { arrayValue: { values: [] } } }
        }],
        nextPageToken: 'tok1'
      },
      {
        documents: [{
          name: 'projects/idlemmo/databases/(default)/documents/_guildStat/b',
          fields: { n: { stringValue: 'B' }, i: { integerValue: '2' }, stats: { arrayValue: { values: [] } } }
        }]
      }
    ];
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => pages[0] })
      .mockResolvedValueOnce({ ok: true, json: async () => pages[1] });

    const result = await listAllGuildStats('id-token', { fetch: fetchMock });

    expect(result.map(g => g.id)).toEqual(['a', 'b']);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toContain('pageToken=tok1');
  });
});

describe('readGuildStat (single doc by id)', () => {
  it('fetches a single _guildStat document', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        name: 'projects/idlemmo/databases/(default)/documents/_guildStat/abc',
        fields: { n: { stringValue: 'Z' }, i: { integerValue: '7' }, stats: { arrayValue: { values: [{ integerValue: '3' }] } } }
      })
    });

    const result = await readGuildStat('id-token', 'abc', { fetch: fetchMock });

    expect(result).toEqual({ id: 'abc', guildName: 'Z', guildIcon: 7, stats: [3] });
    expect(fetchMock.mock.calls[0][0]).toContain('/_guildStat/abc');
  });

  it('returns null when document does not exist', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) });
    const result = await readGuildStat('id-token', 'missing', { fetch: fetchMock });
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/firebase.test.js`
Expected: FAIL — functions not exported.

- [ ] **Step 3: Add implementations to `src/firebase.js`**

Append (and reuse the existing `parseGuildStatDoc` helper from Task 4):

```js
export async function listAllGuildStats(idToken, deps = {}) {
  const fetchFn = deps.fetch || globalThis.fetch;
  const all = [];
  let pageToken = null;
  for (;;) {
    const params = new URLSearchParams({ pageSize: '1000' });
    if (pageToken) params.set('pageToken', pageToken);
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/_guildStat?${params}`;
    const res = await fetchFn(url, { headers: { Authorization: `Bearer ${idToken}` } });
    const data = await res.json();
    if (!res.ok) throw new Error(`listAllGuildStats failed: ${data?.error?.message || res.status}`);
    for (const doc of data.documents || []) all.push(parseGuildStatDoc(doc));
    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
  }
  return all;
}

export async function readGuildStat(idToken, guildId, deps = {}) {
  const fetchFn = deps.fetch || globalThis.fetch;
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/_guildStat/${guildId}`;
  const res = await fetchFn(url, { headers: { Authorization: `Bearer ${idToken}` } });
  if (res.status === 404) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(`readGuildStat ${guildId} failed: ${data?.error?.message || res.status}`);
  return parseGuildStatDoc(data);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/firebase.test.js`
Expected: PASS — both new describe blocks plus the existing ones.

#### 8.2 — Discovery module (weekly cohort selection)

- [ ] **Step 1: Write the failing test**

```js
// tests/discover.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Miniflare } from 'miniflare';
import { readFileSync } from 'fs';
import { discoverCohort } from '../src/discover.js';
import { getTrackedGuildIds } from '../src/db.js';

let mf, db;
async function freshDb() {
  mf = new Miniflare({ modules: true, script: 'export default {};', d1Databases: { DB: ':memory:' } });
  db = await mf.getD1Database('DB');
  const sql = readFileSync('migrations/0001_init.sql', 'utf8');
  for (const stmt of sql.split(';').map(s => s.trim()).filter(Boolean)) {
    await db.exec(stmt);
  }
}
beforeEach(async () => { await freshDb(); });

function mockFirestoreList(guildStatDocs) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      documents: guildStatDocs.map(g => ({
        name: `projects/idlemmo/databases/(default)/documents/_guildStat/${g.id}`,
        fields: {
          n: { stringValue: g.guildName },
          i: { integerValue: String(g.guildIcon) },
          stats: { arrayValue: { values: g.stats.map(s => ({ integerValue: String(s) })) } }
        }
      }))
    })
  });
}

describe('discoverCohort', () => {
  it('writes top-N guild IDs to tracked_guilds, ordered by statsCost desc', async () => {
    const guilds = [
      { id: 'tiny', guildName: 't', guildIcon: 1, stats: [1] },         // small cost
      { id: 'mid',  guildName: 'm', guildIcon: 1, stats: [10] },         // medium cost
      { id: 'big',  guildName: 'b', guildIcon: 1, stats: [50, 30] }      // largest cost
    ];
    const fetchMock = mockFirestoreList(guilds);

    await discoverCohort(db, {
      getIdToken: async () => 'tok',
      fetch: fetchMock,
      now: () => 1700000000000,
      topN: 2
    });

    const ids = await getTrackedGuildIds(db);
    expect(ids).toEqual(['big', 'mid']);   // top 2, biggest first
  });

  it('replaces previous cohort on subsequent discovery', async () => {
    // First discovery
    const first = [
      { id: 'a', guildName: 'A', guildIcon: 1, stats: [10] },
      { id: 'b', guildName: 'B', guildIcon: 1, stats: [5] }
    ];
    await discoverCohort(db, {
      getIdToken: async () => 'tok', fetch: mockFirestoreList(first),
      now: () => 1700000000000, topN: 10
    });
    expect(await getTrackedGuildIds(db)).toEqual(['a', 'b']);

    // Second discovery — 'b' is gone, 'c' is new
    const second = [
      { id: 'a', guildName: 'A', guildIcon: 1, stats: [10] },
      { id: 'c', guildName: 'C', guildIcon: 1, stats: [3] }
    ];
    await discoverCohort(db, {
      getIdToken: async () => 'tok', fetch: mockFirestoreList(second),
      now: () => 1700000001000, topN: 10
    });
    expect(await getTrackedGuildIds(db)).toEqual(['a', 'c']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/discover.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement discover.js**

```js
// src/discover.js
import { listAllGuildStats } from './firebase.js';
import { calcStatCost } from './stat-cost.js';
import { replaceTrackedCohort } from './db.js';

const DEFAULT_TOP_N = 1000;

export async function discoverCohort(db, deps) {
  const fetchFn = deps.fetch || globalThis.fetch;
  const now = deps.now ? deps.now() : Date.now();
  const topN = deps.topN ?? DEFAULT_TOP_N;

  const idToken = await deps.getIdToken();
  const all = await listAllGuildStats(idToken, { fetch: fetchFn });

  const ranked = all
    .map(g => ({ ...g, statsCost: calcStatCost(g.stats) }))
    .sort((a, b) => b.statsCost - a.statsCost)
    .slice(0, topN)
    .map((g, i) => ({ id: g.id, statsCost: g.statsCost, rank: i + 1 }));

  await replaceTrackedCohort(db, ranked, now);
  return { total: all.length, tracked: ranked.length };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/discover.test.js`
Expected: PASS — both cases.

#### 8.3 — Snapshot module (hourly, with `.w` bootstrap)

- [ ] **Step 1: Write the failing test**

```js
// tests/snapshot.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Miniflare } from 'miniflare';
import { readFileSync } from 'fs';
import { snapshotCohort } from '../src/snapshot.js';
import {
  getGuildIndex, getGuildDetail, replaceTrackedCohort, getMembersForWeek
} from '../src/db.js';
import { weekKey } from '../src/week-key.js';

let mf, db;
async function freshDb() {
  mf = new Miniflare({ modules: true, script: 'export default {};', d1Databases: { DB: ':memory:' } });
  db = await mf.getD1Database('DB');
  const sql = readFileSync('migrations/0001_init.sql', 'utf8');
  for (const stmt of sql.split(';').map(s => s.trim()).filter(Boolean)) {
    await db.exec(stmt);
  }
}
beforeEach(async () => { await freshDb(); });

function mockFirebase(guilds) {
  return vi.fn(async (url) => {
    // Per-document Firestore stat read
    const statMatch = url.match(/\/documents\/_guildStat\/([^?]+)$/);
    if (statMatch) {
      const g = guilds.find(x => x.id === statMatch[1]);
      if (!g) return { ok: false, status: 404, json: async () => ({}) };
      return {
        ok: true,
        json: async () => ({
          name: `projects/idlemmo/databases/(default)/documents/_guildStat/${g.id}`,
          fields: {
            n: { stringValue: g.guildName },
            i: { integerValue: String(g.guildIcon) },
            stats: { arrayValue: { values: g.stats.map(s => ({ integerValue: String(s) })) } }
          }
        })
      };
    }
    // RTDB read
    const rtdbMatch = url.match(/\/_guild\/([^.]+)\.json/);
    if (rtdbMatch) {
      const g = guilds.find(x => x.id === rtdbMatch[1]);
      return {
        ok: true,
        json: async () => ({
          p: g.points,
          m: Object.fromEntries(g.members.map((m, i) => [String(i), { a: m.name, e: m.e, g: i }])),
          w: g.previousWeek
            ? Object.fromEntries(g.previousWeek.map((m, i) => [String(i), { a: m.name, b: m.gpEarned }]))
            : undefined
        })
      };
    }
    throw new Error(`Unmocked URL: ${url}`);
  });
}

const NOW = Date.UTC(2026, 4, 15, 12, 0, 0);  // Fri W20
const THIS_WEEK = weekKey(NOW);
const LAST_WEEK = weekKey(NOW - 7 * 24 * 3600 * 1000);

async function seedTracked(...ids) {
  await replaceTrackedCohort(db, ids.map((id, i) => ({ id, statsCost: 1000 - i, rank: i + 1 })), NOW);
}

describe('snapshotCohort', () => {
  it('snapshots only the tracked cohort, ignoring untracked guilds', async () => {
    await seedTracked('tracked-1');

    const guilds = [
      {
        id: 'tracked-1', guildName: 'T1', guildIcon: 1, stats: [5], points: 1000,
        members: Array.from({ length: 12 }, (_, i) => ({ name: `m${i}`, e: i * 100 }))
      },
      {
        id: 'untracked', guildName: 'U', guildIcon: 1, stats: [5], points: 9999,
        members: Array.from({ length: 12 }, (_, i) => ({ name: `u${i}`, e: 9999 }))
      }
    ];
    const fetchMock = mockFirebase(guilds);

    await snapshotCohort(db, { fetch: fetchMock, getIdToken: async () => 't', now: () => NOW });

    const index = await getGuildIndex(db, THIS_WEEK);
    expect(index).toHaveLength(1);
    expect(index[0].guild_id).toBe('tracked-1');
  });

  it('applies UPSERT-MAX on a second tick within the same week', async () => {
    await seedTracked('g1');

    const guilds = [{
      id: 'g1', guildName: 'G', guildIcon: 1, stats: [5], points: 1000,
      members: Array.from({ length: 12 }, (_, i) => ({ name: `m${i}`, e: i * 100 }))
    }];
    let nowVal = NOW;
    const fetchMock = mockFirebase(guilds);

    await snapshotCohort(db, { fetch: fetchMock, getIdToken: async () => 't', now: () => nowVal });

    guilds[0].members = guilds[0].members.map((m) => ({ ...m, e: m.e + 500 }));
    nowVal += 3600_000;
    await snapshotCohort(db, { fetch: fetchMock, getIdToken: async () => 't', now: () => nowVal });

    // Simulate post-reset .e drop to 0; MAX preserves peak
    guilds[0].members = guilds[0].members.map(m => ({ ...m, e: 0 }));
    nowVal += 3600_000;
    await snapshotCohort(db, { fetch: fetchMock, getIdToken: async () => 't', now: () => nowVal });

    const detail = await getGuildDetail(db, 'g1', THIS_WEEK);
    const m11 = detail.members.find(m => m.member_name === 'm11');
    expect(m11.gp_earned).toBe(1600);  // 1100 + 500
    expect(detail.timeseries).toHaveLength(3);
  });

  it('skips guilds whose member count is below threshold', async () => {
    await seedTracked('small');

    const guilds = [{
      id: 'small', guildName: 'S', guildIcon: 1, stats: [1], points: 100,
      members: [{ name: 'solo', e: 50 }]   // only 1 member; below 11 threshold
    }];
    await snapshotCohort(db, { fetch: mockFirebase(guilds), getIdToken: async () => 't', now: () => NOW });

    const index = await getGuildIndex(db, THIS_WEEK);
    expect(index).toHaveLength(0);
  });

  it('bootstraps last-week member contributions from .w on first observation', async () => {
    await seedTracked('newcomer');

    const guilds = [{
      id: 'newcomer', guildName: 'N', guildIcon: 1, stats: [5], points: 5000,
      members: Array.from({ length: 12 }, (_, i) => ({ name: `m${i}`, e: i * 10 })),
      previousWeek: [
        { name: 'm0', gpEarned: 500 },
        { name: 'm1', gpEarned: 800 },
        { name: 'm2', gpEarned: 300 }
      ]
    }];

    await snapshotCohort(db, { fetch: mockFirebase(guilds), getIdToken: async () => 't', now: () => NOW });

    const lastWeekMembers = await getMembersForWeek(db, 'newcomer', LAST_WEEK);
    expect(lastWeekMembers).toHaveLength(3);
    const m1 = lastWeekMembers.find(m => m.member_name === 'm1');
    expect(m1.gp_earned).toBe(800);
  });

  it('does NOT overwrite existing last-week data when .w bootstrap would', async () => {
    await seedTracked('established');

    const guilds = [{
      id: 'established', guildName: 'E', guildIcon: 1, stats: [5], points: 5000,
      members: Array.from({ length: 12 }, (_, i) => ({ name: `m${i}`, e: 0 })),
      previousWeek: [
        { name: 'm0', gpEarned: 999999 }   // hot garbage that must NOT overwrite our real data
      ]
    }];

    // Pre-seed last week with a real value we'd lose if bootstrap overwrote
    const { upsertGuild, upsertMemberContribution } = await import('../src/db.js');
    await upsertGuild(db, { id: 'established', guildName: 'E', guildIcon: 1 }, NOW);
    await upsertMemberContribution(db, {
      week: LAST_WEEK, guildId: 'established', memberName: 'm0', gpEarned: 12345, capturedAt: NOW - 86400000
    });

    await snapshotCohort(db, { fetch: mockFirebase(guilds), getIdToken: async () => 't', now: () => NOW });

    const lastWeekMembers = await getMembersForWeek(db, 'established', LAST_WEEK);
    const m0 = lastWeekMembers.find(m => m.member_name === 'm0');
    expect(m0.gp_earned).toBe(12345);  // preserved
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/snapshot.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement snapshot.js**

```js
// src/snapshot.js
import { readGuildStat, readGuild } from './firebase.js';
import { weekKey } from './week-key.js';
import {
  getTrackedGuildIds,
  hasMemberContributionsForWeek,
  upsertGuild,
  upsertGuildSnapshot,
  upsertMemberContribution,
  insertTimeseriesPoint
} from './db.js';

const MIN_MEMBERS = 11;  // mirrors toolbox `members.length > 10`
const WEEK_MS = 7 * 24 * 3600 * 1000;

export async function snapshotCohort(db, deps) {
  const fetchFn = deps.fetch || globalThis.fetch;
  const now = deps.now ? deps.now() : Date.now();
  const week = weekKey(now);
  const lastWeek = weekKey(now - WEEK_MS);

  const idToken = await deps.getIdToken();
  const trackedIds = await getTrackedGuildIds(db);

  // Fetch each guild's Firestore stat + RTDB doc in parallel
  const results = await Promise.all(trackedIds.map(async (id) => {
    try {
      const [stat, rtdb] = await Promise.all([
        readGuildStat(idToken, id, { fetch: fetchFn }),
        readGuild(idToken, id, { fetch: fetchFn })
      ]);
      if (!stat || !rtdb) return null;
      return { id, stat, rtdb };
    } catch (err) {
      console.error(JSON.stringify({ kind: 'snapshot.guild_error', guildId: id, message: err.message }));
      return null;
    }
  }));

  const valid = results.filter(r => r && r.rtdb.members.length >= MIN_MEMBERS);

  // Need statsCost to rank by totalGp; import lazily to keep deps explicit
  const { calcStatCost } = await import('./stat-cost.js');

  const merged = valid.map(({ id, stat, rtdb }) => {
    const statsCost = calcStatCost(stat.stats);
    const weeklyGp = rtdb.members.reduce((s, m) => s + (m.e || 0), 0);
    const totalGp = rtdb.points + statsCost;
    return {
      id,
      guildName: stat.guildName,
      guildIcon: stat.guildIcon,
      points: rtdb.points,
      statsCost,
      totalGp,
      weeklyGp,
      members: rtdb.members,
      previousWeek: rtdb.previousWeek
    };
  }).sort((a, b) => b.totalGp - a.totalGp);

  let written = 0;
  for (let i = 0; i < merged.length; i++) {
    const g = merged[i];
    const rank = i + 1;

    await upsertGuild(db, { id: g.id, guildName: g.guildName, guildIcon: g.guildIcon }, now);

    await upsertGuildSnapshot(db, {
      week, guildId: g.id, totalGp: g.totalGp, pointsRaw: g.points, statsCost: g.statsCost,
      membersCount: g.members.length, rank, weeklyGp: g.weeklyGp, capturedAt: now
    });

    await insertTimeseriesPoint(db, { week, guildId: g.id, capturedAt: now, weeklyGp: g.weeklyGp });

    for (const m of g.members) {
      await upsertMemberContribution(db, {
        week, guildId: g.id, memberName: m.name, gpEarned: m.e || 0, capturedAt: now
      });
    }

    // .w bootstrap: if we have NO last-week data for this guild, seed from .w.
    // Skip if we already have data — never overwrite real history with .w (which is final values only).
    if (g.previousWeek && g.previousWeek.length > 0) {
      const alreadyHave = await hasMemberContributionsForWeek(db, g.id, lastWeek);
      if (!alreadyHave) {
        for (const pw of g.previousWeek) {
          await upsertMemberContribution(db, {
            week: lastWeek, guildId: g.id, memberName: pw.name, gpEarned: pw.gpEarned, capturedAt: now
          });
        }
      }
    }

    written++;
  }

  return { week, tracked: trackedIds.length, written };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/snapshot.test.js`
Expected: PASS — all 5 cases (cohort filter, MAX semantics, member-count threshold, `.w` bootstrap, no-overwrite).

---

### Task 9: Read API handlers

**Files:**
- Create: `C:\Dev\idleon\toolbox\guild-history\src\api.js`
- Create: `C:\Dev\idleon\toolbox\guild-history\tests\api.test.js`

The two endpoints from the spec: `/api/guilds` and `/api/guilds/:id`. Both compute the recency-focused derived fields (`gp_this_week`, `vs_last_wk_pct`, `rank_delta_2w`).

- [ ] **Step 1: Write the failing test**

```js
// tests/api.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { Miniflare } from 'miniflare';
import { readFileSync } from 'fs';
import { handleApiRequest } from '../src/api.js';
import {
  upsertGuild,
  upsertGuildSnapshot,
  upsertMemberContribution,
  insertTimeseriesPoint
} from '../src/db.js';

let mf, db;
async function freshDb() {
  mf = new Miniflare({ modules: true, script: 'export default {};', d1Databases: { DB: ':memory:' } });
  db = await mf.getD1Database('DB');
  const sql = readFileSync('migrations/0001_init.sql', 'utf8');
  for (const stmt of sql.split(';').map(s => s.trim()).filter(Boolean)) {
    await db.exec(stmt);
  }
}
beforeEach(async () => { await freshDb(); });

const W20 = '2026-W20-THU';
const W19 = '2026-W19-THU';
const W18 = '2026-W18-THU';

async function seed() {
  const now = Date.UTC(2026, 4, 15, 12, 0, 0);  // Fri week W20
  const lastWeekSamePoint = now - 7 * 24 * 3600 * 1000;

  for (const id of ['a', 'b']) {
    await upsertGuild(db, { id, guildName: `G${id}`, guildIcon: 1 }, now);
  }

  // W20 current
  await upsertGuildSnapshot(db, {
    week: W20, guildId: 'a', totalGp: 1000, pointsRaw: 1000, statsCost: 0,
    membersCount: 15, rank: 1, weeklyGp: 800, capturedAt: now
  });
  await upsertGuildSnapshot(db, {
    week: W20, guildId: 'b', totalGp: 800, pointsRaw: 800, statsCost: 0,
    membersCount: 15, rank: 2, weeklyGp: 400, capturedAt: now
  });

  // W19 — guild 'a' was at the same point with 600 weekly_gp; guild 'b' had 500
  await upsertGuildSnapshot(db, {
    week: W19, guildId: 'a', totalGp: 900, pointsRaw: 900, statsCost: 0,
    membersCount: 15, rank: 2, weeklyGp: 600, capturedAt: now - 7 * 24 * 3600 * 1000
  });
  await upsertGuildSnapshot(db, {
    week: W19, guildId: 'b', totalGp: 750, pointsRaw: 750, statsCost: 0,
    membersCount: 15, rank: 1, weeklyGp: 500, capturedAt: now - 7 * 24 * 3600 * 1000
  });

  // W18 — guild 'a' was rank 3; guild 'b' rank 1
  await upsertGuildSnapshot(db, {
    week: W18, guildId: 'a', totalGp: 800, pointsRaw: 800, statsCost: 0,
    membersCount: 15, rank: 3, weeklyGp: 500, capturedAt: now - 14 * 24 * 3600 * 1000
  });
  await upsertGuildSnapshot(db, {
    week: W18, guildId: 'b', totalGp: 700, pointsRaw: 700, statsCost: 0,
    membersCount: 15, rank: 1, weeklyGp: 400, capturedAt: now - 14 * 24 * 3600 * 1000
  });

  // Timeseries for guild 'a' current week — three points climbing
  await insertTimeseriesPoint(db, { week: W20, guildId: 'a', capturedAt: now - 7200_000, weeklyGp: 400 });
  await insertTimeseriesPoint(db, { week: W20, guildId: 'a', capturedAt: now - 3600_000, weeklyGp: 600 });
  await insertTimeseriesPoint(db, { week: W20, guildId: 'a', capturedAt: now, weeklyGp: 800 });

  // Last week timeseries, used to compute "same point in week" comparison
  await insertTimeseriesPoint(db, {
    week: W19, guildId: 'a', capturedAt: lastWeekSamePoint - 3600_000, weeklyGp: 450
  });
  await insertTimeseriesPoint(db, {
    week: W19, guildId: 'a', capturedAt: lastWeekSamePoint, weeklyGp: 600
  });

  return { now, lastWeekSamePoint };
}

describe('GET /api/guilds', () => {
  it('returns current rankings with vs-last-wk-pct and rank-delta-2w', async () => {
    const { now } = await seed();

    const req = new Request('https://x.dev/api/guilds');
    const res = await handleApiRequest(req, { DB: db }, { now: () => now });
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.week).toBe(W20);
    expect(data.guilds).toHaveLength(2);

    const a = data.guilds.find(g => g.guild_id === 'a');
    expect(a.gp_this_week).toBe(800);
    // last week at same point was 600 → pct = (800-600)/600 = +33.3%
    expect(a.vs_last_wk_pct).toBeCloseTo(33.33, 1);
    // 2 weeks ago rank was 3, current is 1 → delta = -2 (improved by 2)
    expect(a.rank_delta_2w).toBe(-2);
  });

  it('sets cache header and CORS', async () => {
    await seed();
    const req = new Request('https://x.dev/api/guilds');
    const res = await handleApiRequest(req, { DB: db }, { now: () => Date.UTC(2026, 4, 15, 12, 0, 0) });
    expect(res.headers.get('cache-control')).toContain('max-age=300');
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
  });
});

describe('GET /api/guilds/:id', () => {
  it('returns this week + last week + 2 weeks ago shapes', async () => {
    const { now } = await seed();

    const req = new Request('https://x.dev/api/guilds/a');
    const res = await handleApiRequest(req, { DB: db }, { now: () => now });
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.guild_id).toBe('a');
    expect(data.guild_name).toBe('Ga');
    expect(data.current_week.week).toBe(W20);
    expect(data.current_week.timeseries).toHaveLength(3);
    expect(data.last_week.week).toBe(W19);
    expect(data.last_week.timeseries.length).toBeGreaterThan(0);
    expect(data.two_weeks_ago.week).toBe(W18);
    expect(data.roster_diff.joined).toBeDefined();
    expect(data.roster_diff.left).toBeDefined();
  });

  it('returns 404 for unknown guild', async () => {
    await seed();
    const req = new Request('https://x.dev/api/guilds/unknown');
    const res = await handleApiRequest(req, { DB: db }, { now: () => Date.UTC(2026, 4, 15, 12, 0, 0) });
    expect(res.status).toBe(404);
  });
});

describe('OPTIONS preflight', () => {
  it('returns CORS preflight response', async () => {
    const req = new Request('https://x.dev/api/guilds', { method: 'OPTIONS' });
    const res = await handleApiRequest(req, { DB: db }, { now: () => Date.now() });
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/api.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement api.js**

```js
// src/api.js
import { weekKey } from './week-key.js';
import {
  getGuildIndex,
  getSnapshotForWeek,
  getMembersForWeek,
  getTimeseriesForWeek
} from './db.js';

const WEEK_MS = 7 * 24 * 3600 * 1000;

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, OPTIONS',
  'access-control-allow-headers': 'content-type'
};

export async function handleApiRequest(request, env, deps = {}) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(request.url);
  const path = url.pathname;

  if (path === '/api/guilds') {
    return handleGuildsIndex(env.DB, deps);
  }

  const detailMatch = path.match(/^\/api\/guilds\/([^/]+)$/);
  if (detailMatch) {
    return handleGuildDetail(env.DB, detailMatch[1], deps);
  }

  return new Response('not found', { status: 404, headers: CORS_HEADERS });
}

async function handleGuildsIndex(db, deps) {
  const now = deps.now ? deps.now() : Date.now();
  const week = weekKey(now);
  const lastWeek = weekKey(now - WEEK_MS);
  const twoWeeksAgo = weekKey(now - 2 * WEEK_MS);

  const currentRows = await getGuildIndex(db, week);

  const guilds = await Promise.all(currentRows.map(async (row) => {
    const lastWeekSamePoint = await samePointInWeekWeeklyGp(db, row.guild_id, lastWeek, now - WEEK_MS);
    const twoWeekAgoSnap = await getSnapshotForWeek(db, row.guild_id, twoWeeksAgo);

    const vsLastWkPct = lastWeekSamePoint != null && lastWeekSamePoint > 0
      ? ((row.weekly_gp - lastWeekSamePoint) / lastWeekSamePoint) * 100
      : null;
    const rankDelta2w = twoWeekAgoSnap?.rank != null
      ? row.rank - twoWeekAgoSnap.rank
      : null;

    return {
      guild_id: row.guild_id,
      guild_name: row.guild_name,
      guild_icon: row.guild_icon,
      total_gp: row.total_gp,
      gp_this_week: row.weekly_gp,
      vs_last_wk_pct: vsLastWkPct,
      rank: row.rank,
      rank_delta_2w: rankDelta2w,
      members_count: row.members_count
    };
  }));

  return jsonResponse({ week, guilds });
}

async function handleGuildDetail(db, guildId, deps) {
  const now = deps.now ? deps.now() : Date.now();
  const week = weekKey(now);
  const lastWeek = weekKey(now - WEEK_MS);
  const twoWeeksAgo = weekKey(now - 2 * WEEK_MS);

  const currentSnap = await getSnapshotForWeek(db, guildId, week);
  if (!currentSnap) {
    return new Response('guild not found', { status: 404, headers: CORS_HEADERS });
  }

  const [currentTs, lastTs, twoAgoTs] = await Promise.all([
    getTimeseriesForWeek(db, guildId, week),
    getTimeseriesForWeek(db, guildId, lastWeek),
    getTimeseriesForWeek(db, guildId, twoWeeksAgo)
  ]);

  const [currentMembers, lastMembers] = await Promise.all([
    getMembersForWeek(db, guildId, week),
    getMembersForWeek(db, guildId, lastWeek)
  ]);

  const currentNames = new Set(currentMembers.map(m => m.member_name));
  const lastNames = new Set(lastMembers.map(m => m.member_name));
  const joined = [...currentNames].filter(n => !lastNames.has(n));
  const left = [...lastNames].filter(n => !currentNames.has(n));

  return jsonResponse({
    guild_id: guildId,
    guild_name: currentSnap.guild_name ?? null,
    rank: currentSnap.rank,
    total_gp: currentSnap.total_gp,
    members_count: currentSnap.members_count,
    current_week: {
      week,
      gp_this_week: currentSnap.weekly_gp,
      timeseries: currentTs,
      members: currentMembers
    },
    last_week: {
      week: lastWeek,
      timeseries: lastTs
    },
    two_weeks_ago: {
      week: twoWeeksAgo,
      timeseries: twoAgoTs
    },
    roster_diff: { joined, left }
  });
}

async function samePointInWeekWeeklyGp(db, guildId, week, targetMs) {
  // Find the timeseries point closest to (but not after) targetMs within the given week.
  const ts = await getTimeseriesForWeek(db, guildId, week);
  if (ts.length === 0) return null;
  let best = null;
  for (const point of ts) {
    if (point.captured_at <= targetMs) best = point;
  }
  return best?.weekly_gp ?? null;
}

function jsonResponse(body) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'public, max-age=300',
      ...CORS_HEADERS
    }
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/api.test.js`
Expected: PASS — all 5 cases (index returns + cache header + detail returns + 404 + OPTIONS).

---

### Task 10: Weekly reset detection

**Files:**
- Create: `C:\Dev\idleon\toolbox\guild-history\src\reset-detect.js`
- Create: `C:\Dev\idleon\toolbox\guild-history\tests\reset-detect.test.js`

Computes median `.e` per tick, logs an event when the median drops by >80% tick-over-tick. Pure function over `members[]` arrays; the worker entry point feeds it the previous and current ticks.

- [ ] **Step 1: Write the failing test**

```js
// tests/reset-detect.test.js
import { describe, it, expect } from 'vitest';
import { detectReset } from '../src/reset-detect.js';

describe('detectReset', () => {
  it('returns false when no previous tick', () => {
    const r = detectReset(null, [100, 200, 300, 400]);
    expect(r.resetDetected).toBe(false);
  });

  it('detects an >80% drop in median', () => {
    const prev = [1000, 2000, 3000, 4000, 5000];
    const curr = [100, 200, 300, 400, 500];
    const r = detectReset(prev, curr);
    expect(r.resetDetected).toBe(true);
    expect(r.medianBefore).toBe(3000);
    expect(r.medianAfter).toBe(300);
  });

  it('does not detect on a 50% drop', () => {
    const prev = [1000, 2000, 3000];
    const curr = [500, 1000, 1500];
    const r = detectReset(prev, curr);
    expect(r.resetDetected).toBe(false);
  });

  it('does not detect when prev median is 0', () => {
    const r = detectReset([0, 0, 0], [0, 0, 0]);
    expect(r.resetDetected).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/reset-detect.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement reset-detect.js**

```js
// src/reset-detect.js
const DROP_THRESHOLD = 0.8;

export function detectReset(prevWeeklyGps, currWeeklyGps) {
  if (!prevWeeklyGps || prevWeeklyGps.length === 0) {
    return { resetDetected: false };
  }
  const medianBefore = median(prevWeeklyGps);
  const medianAfter = median(currWeeklyGps);
  if (medianBefore <= 0) {
    return { resetDetected: false, medianBefore, medianAfter };
  }
  const drop = (medianBefore - medianAfter) / medianBefore;
  return {
    resetDetected: drop > DROP_THRESHOLD,
    medianBefore,
    medianAfter,
    dropRatio: drop
  };
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/reset-detect.test.js`
Expected: PASS — all 4 cases.

---

### Task 11: Worker entry point

**Files:**
- Create: `C:\Dev\idleon\toolbox\guild-history\src\worker.js`

Wires `scheduled` (cron — branches on `event.cron`) and `fetch` (read API) handlers. Holds in-memory state for the auth cache and the previous tick's weekly_gp values (for reset detection).

- [ ] **Step 1: Write worker.js**

```js
// src/worker.js
import { createAuth } from './auth.js';
import { discoverCohort } from './discover.js';
import { snapshotCohort } from './snapshot.js';
import { handleApiRequest } from './api.js';
import { detectReset } from './reset-detect.js';
import { getGuildIndex } from './db.js';
import { weekKey } from './week-key.js';

const DISCOVERY_CRON = '0 4 * * 0';   // Sunday 04:00 UTC

let authInstance = null;
let prevWeeklyGps = null;

function auth(env) {
  if (!authInstance) {
    if (!env.REFRESH_TOKEN) throw new Error('REFRESH_TOKEN secret missing');
    authInstance = createAuth(env.REFRESH_TOKEN);
  }
  return authInstance;
}

export default {
  async scheduled(event, env, ctx) {
    const now = Date.now();
    const cron = event.cron;
    try {
      if (cron === DISCOVERY_CRON) {
        const result = await discoverCohort(env.DB, {
          getIdToken: () => auth(env).getIdToken(),
          now: () => now
        });
        console.log(JSON.stringify({ kind: 'discover.ok', total: result.total, tracked: result.tracked, ts: now }));
        return;
      }

      // Default: hourly snapshot
      const result = await snapshotCohort(env.DB, {
        getIdToken: () => auth(env).getIdToken(),
        now: () => now
      });
      console.log(JSON.stringify({ kind: 'snapshot.ok', week: result.week, tracked: result.tracked, written: result.written, ts: now }));

      // Reset detection runs only on snapshot ticks
      const rows = await getGuildIndex(env.DB, weekKey(now));
      const currWeeklyGps = rows.map(r => r.weekly_gp);
      const det = detectReset(prevWeeklyGps, currWeeklyGps);
      if (det.resetDetected) {
        console.log(JSON.stringify({
          kind: 'weekly_reset_detected',
          medianBefore: det.medianBefore,
          medianAfter: det.medianAfter,
          ts: now
        }));
        await env.DB.prepare(`
          INSERT OR IGNORE INTO reset_events (detected_at, median_e_before, median_e_after)
          VALUES (?, ?, ?)
        `).bind(now, det.medianBefore, det.medianAfter).run();
      }
      prevWeeklyGps = currWeeklyGps;
    } catch (err) {
      console.error(JSON.stringify({ kind: 'scheduled.error', cron, message: err.message, stack: err.stack, ts: now }));
      throw err;  // surfaces to CF observability
    }
  },

  async fetch(request, env, ctx) {
    return handleApiRequest(request, env);
  }
};
```

- [ ] **Step 2: Add a smoke test for the worker module shape**

```js
// tests/worker.test.js
import { describe, it, expect } from 'vitest';
import workerModule from '../src/worker.js';

describe('worker module shape', () => {
  it('exports default with scheduled + fetch handlers', () => {
    expect(typeof workerModule.scheduled).toBe('function');
    expect(typeof workerModule.fetch).toBe('function');
  });
});
```

- [ ] **Step 3: Run all tests**

Run: `npm test`
Expected: PASS — all suites green.

---

### Task 12: Local end-to-end smoke

**Files:**
- Modify: `C:\Dev\idleon\toolbox\guild-history\.dev.vars` (gitignored; create from `.dev.vars.example`)

- [ ] **Step 1: Copy `.dev.vars` and paste the POC's refresh token**

```powershell
copy .dev.vars.example .dev.vars
# Edit .dev.vars: paste REFRESH_TOKEN value from guild-history-poc/.env
```

- [ ] **Step 2: Start the worker locally**

Run:
```powershell
npx wrangler dev
```

Expected: starts at `http://localhost:8787`, prints "ready on http://localhost:8787".

- [ ] **Step 3: Manually trigger the discovery cron first**

The hourly snapshot reads from `tracked_guilds`, which is empty until discovery has run. Trigger discovery before snapshot:

```powershell
curl -X POST "http://localhost:8787/__scheduled?cron=0+4+*+*+0"
```

Expected: worker logs `discover.ok` with `total: ~98000` and `tracked: 1000`. Verify:

```powershell
npx wrangler d1 execute guild_history --local --command="SELECT COUNT(*) AS n FROM tracked_guilds;"
```

Expected: `n = 1000`.

Note: discovery takes ~2 minutes locally (paginating 98 pages of 1000 docs each through Firestore REST). This is expected.

- [ ] **Step 4: Manually trigger the snapshot cron**

```powershell
curl -X POST "http://localhost:8787/__scheduled?cron=0+*+*+*+*"
```

Expected: worker logs `snapshot.ok` with `tracked: 1000` and `written` close to 1000.

- [ ] **Step 5: Verify D1 was written**

Run:
```powershell
npx wrangler d1 execute guild_history --local --command="SELECT COUNT(*) AS n FROM guild_snapshots;"
npx wrangler d1 execute guild_history --local --command="SELECT COUNT(*) AS n FROM member_contributions;"
npx wrangler d1 execute guild_history --local --command="SELECT COUNT(*) AS n FROM guild_timeseries;"
```

Expected: snapshots ≈ 1000, member rows ≈ 25,000, timeseries ≈ 1000 (current week). Also expect last-week rows in `member_contributions` from the `.w` bootstrap (filter `WHERE week LIKE '%W19%'` or whatever the previous week-key is).

- [ ] **Step 6: Hit the read API**

Run:
```powershell
curl "http://localhost:8787/api/guilds"
```

Expected: JSON with `week` and `guilds` array (length ≈ 1000). Each guild has `gp_this_week`, `vs_last_wk_pct` (populated thanks to `.w` bootstrap of last-week data — not null), `rank_delta_2w` (will be `null` until we have ≥2 weeks of our own snapshots).

- [ ] **Step 7: Pick a guild id from the previous output and hit the detail endpoint**

Run (substitute the actual id):
```powershell
curl "http://localhost:8787/api/guilds/<some-guild-id>"
```

Expected: JSON with `current_week.timeseries` (1 point so far), `last_week.timeseries` (empty — `.w` only seeds member_contributions, not timeseries), `two_weeks_ago` (empty), and `roster_diff` (populated — current members vs bootstrapped last-week members).

- [ ] **Step 8: Trigger a second snapshot cron and verify timeseries grows**

```powershell
curl -X POST "http://localhost:8787/__scheduled?cron=0+*+*+*+*"
npx wrangler d1 execute guild_history --local --command="SELECT week, COUNT(*) AS points FROM guild_timeseries GROUP BY week;"
```

Expected: current week's timeseries point count went from 1000 to 2000.

---

### Task 13: Deploy to Cloudflare

**Files:**
- Modify: `C:\Dev\idleon\toolbox\guild-history\wrangler.toml` (database_id placeholder gets real value from Task 5; verify it's set)

- [ ] **Step 1: Authenticate wrangler**

Run:
```powershell
npx wrangler login
```

Follow browser flow. Confirms by printing the logged-in account.

- [ ] **Step 2: Apply migration to remote D1**

Run:
```powershell
npm run db:migrate:remote
```

Expected: "Migrations applied" against the real D1.

- [ ] **Step 3: Set the refresh token secret**

Run:
```powershell
npx wrangler secret put REFRESH_TOKEN
```

Paste the token value when prompted.

- [ ] **Step 4: Deploy the worker**

Run:
```powershell
npm run deploy
```

Expected: prints the deployed worker URL (e.g. `https://guild-history.<account>.workers.dev`).

- [ ] **Step 5: Manually trigger the first scheduled run via dashboard**

In Cloudflare dashboard → Workers → guild-history → Triggers → Send test event for cron. Verify logs show `collect.ok`.

- [ ] **Step 6: Verify production D1 received data**

Run:
```powershell
npx wrangler d1 execute guild_history --remote --command="SELECT COUNT(*) AS n FROM guild_snapshots;"
```

Expected: matches the deployed cron run count.

- [ ] **Step 7: Hit the deployed API endpoint**

Run:
```powershell
curl https://guild-history.<account>.workers.dev/api/guilds
```

Expected: JSON response matching the local smoke test.

---

### Phase A acceptance checklist

Before considering Phase A done:

- [ ] Discovery cron has run at least once and `tracked_guilds` has ~1000 rows
- [ ] Snapshot cron has been running for >=1 full week (gives `rank_delta_2w` enough data to begin populating on most guilds; `vs_last_wk_pct` works from day 1 thanks to `.w` bootstrap)
- [ ] `reset_events` table has at least one row, AND the `detected_at` timestamp falls within +/- 1 hour of a Thursday 00:00 UTC. If it doesn't, update `week-key.js` to align with the observed boundary before Phase B starts.
- [ ] No `scheduled.error` log entries (or all are explained, e.g. transient Firebase 500s with auto-recovery on next tick)
- [ ] Sample `/api/guilds` response shows plausible `vs_last_wk_pct` values (most guilds within ±50% — values present on day 1, point-in-week interpolation kicks in after ≥1 week of timeseries data)

---

## Phase B: Toolbox frontend integration

**Do not start until Phase A acceptance checklist passes.** The frontend needs real history data to render meaningfully; shipping it pointed at a worker with <2 weeks of data will produce mostly-blank charts.

All work in this phase stays on a **local feature branch** in the IdleonToolbox repo. Do not push to `origin` or open a PR without explicit owner approval (per spec's Repo & branch hygiene section).

### Task 14: Create local feature branch

- [ ] **Step 1: Create and switch to the branch**

```powershell
cd C:\Dev\idleon\toolbox\IdleonToolbox
git checkout -b feature/guild-history
```

- [ ] **Step 2: Verify branch is local-only**

```powershell
git branch -vv
```

Expected: `feature/guild-history` has no upstream marker (no `[origin/...]`).

---

### Task 15: Worker API client

**Files:**
- Create: `C:\Dev\idleon\toolbox\IdleonToolbox\services\guild-history.js`
- Create: `C:\Dev\idleon\toolbox\IdleonToolbox\__test__\services\guild-history.test.js`

- [ ] **Step 1: Write the failing test**

```js
// __test__/services/guild-history.test.js
import { describe, it, expect, vi } from 'vitest';
import { fetchGuildIndex, fetchGuildDetail, GUILD_HISTORY_BASE } from '../../services/guild-history.js';

describe('fetchGuildIndex', () => {
  it('hits /api/guilds and returns parsed JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ week: '2026-W20-THU', guilds: [{ guild_id: 'a' }] })
    });
    const result = await fetchGuildIndex({ fetch: fetchMock });
    expect(result.week).toBe('2026-W20-THU');
    expect(fetchMock).toHaveBeenCalledWith(`${GUILD_HISTORY_BASE}/api/guilds`);
  });

  it('throws on non-2xx', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    await expect(fetchGuildIndex({ fetch: fetchMock })).rejects.toThrow(/500/);
  });
});

describe('fetchGuildDetail', () => {
  it('hits /api/guilds/:id', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ guild_id: 'a', current_week: { timeseries: [] } })
    });
    const result = await fetchGuildDetail('a', { fetch: fetchMock });
    expect(result.guild_id).toBe('a');
    expect(fetchMock).toHaveBeenCalledWith(`${GUILD_HISTORY_BASE}/api/guilds/a`);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- __test__/services/guild-history.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement guild-history.js**

```js
// services/guild-history.js
export const GUILD_HISTORY_BASE =
  process.env.NEXT_PUBLIC_GUILD_HISTORY_BASE || 'https://guild-history.workers.dev';

export async function fetchGuildIndex(deps = {}) {
  const fetchFn = deps.fetch || globalThis.fetch;
  const res = await fetchFn(`${GUILD_HISTORY_BASE}/api/guilds`);
  if (!res.ok) throw new Error(`fetchGuildIndex failed: ${res.status}`);
  return res.json();
}

export async function fetchGuildDetail(guildId, deps = {}) {
  const fetchFn = deps.fetch || globalThis.fetch;
  const res = await fetchFn(`${GUILD_HISTORY_BASE}/api/guilds/${encodeURIComponent(guildId)}`);
  if (!res.ok) throw new Error(`fetchGuildDetail ${guildId} failed: ${res.status}`);
  return res.json();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- __test__/services/guild-history.test.js`
Expected: PASS.

- [ ] **Step 5: Set the env var for local dev**

Edit `.env.local`:
```
NEXT_PUBLIC_GUILD_HISTORY_BASE=https://guild-history.workers.dev
```

(or the actual worker URL from Phase A deploy)

---

### Task 16: react-query hooks

**Files:**
- Create: `C:\Dev\idleon\toolbox\IdleonToolbox\hooks\useGuildHistory.js`

The toolbox uses `@tanstack/react-query`; the leaderboards page is the existing pattern to follow (`pages/leaderboards.jsx` uses `useQuery`).

- [ ] **Step 1: Write useGuildHistory.js**

```js
// hooks/useGuildHistory.js
import { useQuery } from '@tanstack/react-query';
import { fetchGuildIndex, fetchGuildDetail } from '../services/guild-history';

const FIFTEEN_MIN = 15 * 60 * 1000;

export function useGuildIndex() {
  return useQuery({
    queryKey: ['guild-history', 'index'],
    queryFn: () => fetchGuildIndex(),
    staleTime: FIFTEEN_MIN,
    refetchOnWindowFocus: false
  });
}

export function useGuildDetail(guildId) {
  return useQuery({
    queryKey: ['guild-history', 'detail', guildId],
    queryFn: () => fetchGuildDetail(guildId),
    enabled: !!guildId,
    staleTime: FIFTEEN_MIN,
    refetchOnWindowFocus: false
  });
}
```

No tests for hooks at this layer — they're thin wrappers over the tested service functions. Behavior is validated via the page-level smoke in Task 22.

---

### Task 17: Add `@nivo/line` dependency

- [ ] **Step 1: Install the line chart package**

Run:
```powershell
cd C:\Dev\idleon\toolbox\IdleonToolbox
npm install @nivo/line@^0.99.0
```

Expected: `@nivo/line` appears in `package.json` dependencies. Same major version family as the existing `@nivo/bar` and `@nivo/pie`.

---

### Task 18: WeeklyProgressChart component

**Files:**
- Create: `C:\Dev\idleon\toolbox\IdleonToolbox\components\guilds\WeeklyProgressChart.jsx`
- Create: `C:\Dev\idleon\toolbox\IdleonToolbox\__test__\components\guilds\WeeklyProgressChart.test.jsx`

Renders three overlaid lines (this week, last week, 2 weeks ago) of cumulative GP over the day-of-week axis.

- [ ] **Step 1: Write the failing test**

```jsx
// __test__/components/guilds/WeeklyProgressChart.test.jsx
import { describe, it, expect } from 'vitest';
import { transformForChart } from '../../../components/guilds/WeeklyProgressChart';

describe('transformForChart', () => {
  it('returns three series labeled with their week keys', () => {
    const detail = {
      current_week: { week: '2026-W20-THU', timeseries: [
        { captured_at: Date.UTC(2026, 4, 14, 0, 0), weekly_gp: 0 },
        { captured_at: Date.UTC(2026, 4, 15, 0, 0), weekly_gp: 100 }
      ]},
      last_week: { week: '2026-W19-THU', timeseries: [
        { captured_at: Date.UTC(2026, 4, 7, 0, 0), weekly_gp: 0 },
        { captured_at: Date.UTC(2026, 4, 8, 0, 0), weekly_gp: 80 }
      ]},
      two_weeks_ago: { week: '2026-W18-THU', timeseries: [] }
    };

    const series = transformForChart(detail);
    expect(series).toHaveLength(3);
    expect(series[0].id).toBe('This week');
    expect(series[1].id).toBe('Last week');
    expect(series[2].id).toBe('2 weeks ago');

    // Each point's x is hours-into-week
    expect(series[0].data[0].x).toBe(0);
    expect(series[0].data[1].x).toBe(24);
    expect(series[0].data[1].y).toBe(100);
  });

  it('handles missing prior weeks gracefully', () => {
    const detail = {
      current_week: { week: 'a', timeseries: [{ captured_at: 0, weekly_gp: 0 }] },
      last_week: { week: 'b', timeseries: [] },
      two_weeks_ago: { week: 'c', timeseries: [] }
    };
    const series = transformForChart(detail);
    expect(series).toHaveLength(3);
    expect(series[1].data).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- __test__/components/guilds/WeeklyProgressChart.test.jsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement WeeklyProgressChart.jsx**

```jsx
// components/guilds/WeeklyProgressChart.jsx
import { ResponsiveLine } from '@nivo/line';
import { Box } from '@mui/material';

const WEEK_MS = 7 * 24 * 3600 * 1000;
const HOUR_MS = 3600 * 1000;

export function transformForChart(detail) {
  return [
    { id: 'This week',   data: pointsForSeries(detail.current_week?.timeseries) },
    { id: 'Last week',   data: pointsForSeries(detail.last_week?.timeseries) },
    { id: '2 weeks ago', data: pointsForSeries(detail.two_weeks_ago?.timeseries) }
  ];
}

function pointsForSeries(timeseries) {
  if (!timeseries || timeseries.length === 0) return [];
  const start = weekStartMs(timeseries[0].captured_at);
  return timeseries.map(p => ({
    x: (p.captured_at - start) / HOUR_MS,
    y: p.weekly_gp
  }));
}

function weekStartMs(ms) {
  return ms - (ms % WEEK_MS);
}

export default function WeeklyProgressChart({ detail }) {
  const series = transformForChart(detail);
  return (
    <Box sx={{ height: 320 }}>
      <ResponsiveLine
        data={series}
        margin={{ top: 20, right: 110, bottom: 40, left: 60 }}
        xScale={{ type: 'linear', min: 0, max: 168 }}
        yScale={{ type: 'linear', min: 0 }}
        axisBottom={{
          tickValues: [0, 24, 48, 72, 96, 120, 144, 168],
          format: (v) => ['Thu','Fri','Sat','Sun','Mon','Tue','Wed','Thu'][v / 24]
        }}
        axisLeft={{ format: (v) => v.toLocaleString() }}
        enablePoints={false}
        curve="monotoneX"
        useMesh
        legends={[{
          anchor: 'top-right', direction: 'column', translateX: 100,
          itemWidth: 90, itemHeight: 18, symbolSize: 12
        }]}
      />
    </Box>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- __test__/components/guilds/WeeklyProgressChart.test.jsx`
Expected: PASS — both cases.

---

### Task 19: ContributorLeaderboard component

**Files:**
- Create: `C:\Dev\idleon\toolbox\IdleonToolbox\components\guilds\ContributorLeaderboard.jsx`
- Create: `C:\Dev\idleon\toolbox\IdleonToolbox\__test__\components\guilds\ContributorLeaderboard.test.jsx`

- [ ] **Step 1: Write the failing test**

```jsx
// __test__/components/guilds/ContributorLeaderboard.test.jsx
import { describe, it, expect } from 'vitest';
import { sortedMembers } from '../../../components/guilds/ContributorLeaderboard';

describe('sortedMembers', () => {
  it('orders by gp_earned desc', () => {
    const members = [
      { member_name: 'A', gp_earned: 100 },
      { member_name: 'B', gp_earned: 500 },
      { member_name: 'C', gp_earned: 250 }
    ];
    expect(sortedMembers(members).map(m => m.member_name)).toEqual(['B', 'C', 'A']);
  });

  it('returns [] for null input', () => {
    expect(sortedMembers(null)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- __test__/components/guilds/ContributorLeaderboard.test.jsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement ContributorLeaderboard.jsx**

```jsx
// components/guilds/ContributorLeaderboard.jsx
import { Box, LinearProgress, Stack, Typography } from '@mui/material';
import { numberWithCommas } from '@utility/helpers';

export function sortedMembers(members) {
  if (!members) return [];
  return [...members].sort((a, b) => (b.gp_earned || 0) - (a.gp_earned || 0));
}

export default function ContributorLeaderboard({ members }) {
  const sorted = sortedMembers(members);
  const max = sorted[0]?.gp_earned || 1;

  return (
    <Stack spacing={1}>
      {sorted.map((m, i) => (
        <Stack key={m.member_name} direction="row" alignItems="center" gap={2}>
          <Box sx={{ minWidth: 24, textAlign: 'right' }}>
            <Typography variant="body2">{i + 1}</Typography>
          </Box>
          <Box sx={{ minWidth: 150 }}>
            <Typography variant="body2">{m.member_name}</Typography>
          </Box>
          <Box sx={{ minWidth: 100, textAlign: 'right' }}>
            <Typography variant="body2">{numberWithCommas(m.gp_earned)} GP</Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <LinearProgress
              variant="determinate"
              value={Math.min(100, (m.gp_earned / max) * 100)}
            />
          </Box>
        </Stack>
      ))}
    </Stack>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- __test__/components/guilds/ContributorLeaderboard.test.jsx`
Expected: PASS.

---

### Task 20: RosterDiff component

**Files:**
- Create: `C:\Dev\idleon\toolbox\IdleonToolbox\components\guilds\RosterDiff.jsx`

Simple display — no logic test needed; the diff is computed server-side in `api.js`.

- [ ] **Step 1: Implement RosterDiff.jsx**

```jsx
// components/guilds/RosterDiff.jsx
import { Stack, Typography } from '@mui/material';

export default function RosterDiff({ joined, left }) {
  if ((!joined || joined.length === 0) && (!left || left.length === 0)) {
    return <Typography variant="body2" color="text.secondary">No roster changes this week</Typography>;
  }
  return (
    <Stack spacing={1}>
      {joined?.length > 0 && (
        <Typography variant="body2">
          <span style={{ color: 'green' }}>+ joined:</span> {joined.join(', ')}
        </Typography>
      )}
      {left?.length > 0 && (
        <Typography variant="body2">
          <span style={{ color: '#cf6679' }}>− left:</span> {left.join(', ')}
        </Typography>
      )}
    </Stack>
  );
}
```

---

### Task 21: Modify `pages/guilds.jsx` to use the worker API

**Files:**
- Modify: `C:\Dev\idleon\toolbox\IdleonToolbox\pages\guilds.jsx`

Replace the direct Firebase `getGuilds()` fetch with `useGuildIndex()`. Add three new columns. Wire row click to `/guilds/[id]`.

- [ ] **Step 1: Replace the data layer**

Open `pages/guilds.jsx`. Replace the entire data-fetching block (the current file's `useState`, `parseGuildsData`, `handleGuildsUpdate`, `handleRefresh`, `subscribe`, and the `useEffect` — approximately lines 33–88) with:

```jsx
// at top of file, add imports:
import { useGuildIndex } from '@hooks/useGuildHistory';
import { useRouter } from 'next/router';

// inside Guilds(), the entire data block becomes:
const router = useRouter();
const { data, isLoading, error: queryError, refetch } = useGuildIndex();
const guilds = data?.guilds || null;
const snapshotDate = data ? Date.now() : null;
const error = queryError ? 'An unexpected error has occurred' : '';
const handleRefresh = () => refetch();
```

**Remove:** the `listener` state, all `sessionStorage` reads/writes, the direct-Firebase `getGuilds` import, the `getDuration`/`tryToParse` imports that became unused, the `openIndex` useState (no longer needed — we navigate instead of expanding rows), and the `parseGuildsData` helper.

**Keep:** the `useFormatDate` import, `NextSeo`, and the import of `getGuildLevel` from `'../parsers/guild'`.

Per `CLAUDE.md` React Compiler convention: do **not** wrap any of these in `useMemo`/`useCallback`.

- [ ] **Step 2: Add the new columns to the table head**

In the `<TableHead>`:

```jsx
<TableRow>
  <TableCell sx={{ width: '1px' }}></TableCell>
  <TableCell sx={{ width: 30 }}></TableCell>
  <TableCell>Guild Name</TableCell>
  <TableCell>Total GP</TableCell>
  <TableCell>GP this week</TableCell>
  <TableCell>vs last wk</TableCell>
  <TableCell>Rank Δ (2w)</TableCell>
  <TableCell>Guild Level</TableCell>
  <TableCell>Members</TableCell>
</TableRow>
```

- [ ] **Step 3: Render the new column cells**

In the `guilds?.map(...)` body, change the `<TableRow>` cells from:

```jsx
<TableCell>{numberWithCommas(totalGp)}</TableCell>
<TableCell>{leader?.a}</TableCell>
<TableCell>{guildLevel}</TableCell>
<TableCell>{membersCount} / {maxMembers}</TableCell>
```

to:

```jsx
<TableCell>{numberWithCommas(total_gp)}</TableCell>
<TableCell>{numberWithCommas(gp_this_week)}</TableCell>
<TableCell>
  {vs_last_wk_pct == null ? '—' : (
    <span style={{ color: vs_last_wk_pct >= 0 ? 'green' : '#cf6679' }}>
      {vs_last_wk_pct >= 0 ? '▲' : '▼'} {Math.abs(vs_last_wk_pct).toFixed(1)}%
    </span>
  )}
</TableCell>
<TableCell>
  {rank_delta_2w == null ? '—' : (
    <span style={{ color: rank_delta_2w < 0 ? 'green' : rank_delta_2w > 0 ? '#cf6679' : 'inherit' }}>
      {rank_delta_2w < 0 ? '▲' : rank_delta_2w > 0 ? '▼' : '▬'} {Math.abs(rank_delta_2w)}
    </span>
  )}
</TableCell>
<TableCell>{getGuildLevel(total_gp)}</TableCell>
<TableCell>{members_count} / {30 + 4 * getGuildLevel(total_gp)}</TableCell>
```

Update the destructured fields in the map to match the API response shape:

```jsx
{guilds?.map(({ guild_id, guild_name, guild_icon, total_gp, gp_this_week,
               vs_last_wk_pct, rank_delta_2w, members_count }, index) => {
```

- [ ] **Step 4: Wire row click to navigate to detail page**

Change the main `<TableRow>` (currently has the expand button) to:

```jsx
<TableRow
  sx={{ '& > *': { borderBottom: 'unset' }, cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
  onClick={() => router.push(`/guilds/${guild_id}`)}
>
```

Drop the entire expand-button `<TableCell>` (with the `KeyboardArrowDownIcon`/`KeyboardArrowUpIcon` `IconButton`) and the second `<TableRow>` with the `Collapse` + topContributors section. That content moves to the detail page.

Also update the caption text under "Last Updated": change `Updates every 15 minutes` to `Updates every 30 minutes` to match the worker cadence.

- [ ] **Step 5: Manual smoke**

Run:
```powershell
npm run dev
```

Navigate to `http://localhost:3001/guilds?demo=true`. Verify table renders with all 9 columns and rows are clickable.

---

### Task 22: New `pages/guilds/[id].jsx` detail page

**Files:**
- Create: `C:\Dev\idleon\toolbox\IdleonToolbox\pages\guilds\[id].jsx`

- [ ] **Step 1: Implement the page**

```jsx
// pages/guilds/[id].jsx
import { useRouter } from 'next/router';
import { useGuildDetail } from '@hooks/useGuildHistory';
import {
  CircularProgress,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  Typography
} from '@mui/material';
import { NextSeo } from 'next-seo';
import { numberWithCommas, prefix } from '@utility/helpers';
import { getGuildLevel } from '../../parsers/guild';
import WeeklyProgressChart from '@components/guilds/WeeklyProgressChart';
import ContributorLeaderboard from '@components/guilds/ContributorLeaderboard';
import RosterDiff from '@components/guilds/RosterDiff';

export default function GuildDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { data, isLoading, error } = useGuildDetail(id);

  if (isLoading || !id) return <Stack alignItems="center" sx={{ mt: 6 }}><CircularProgress /></Stack>;
  if (error) return <Typography color="error">Failed to load guild history</Typography>;
  if (!data) return null;

  const { guild_name, rank, total_gp, members_count, current_week, roster_diff } = data;
  const guildLevel = getGuildLevel(total_gp);
  const maxMembers = 30 + 4 * guildLevel;
  const gpThisWeek = current_week?.gp_this_week ?? 0;

  return <>
    <NextSeo
      title={`${guild_name} | Guild History | Idleon Toolbox`}
      description={`Weekly GP progress and contributors for guild ${guild_name}`}
    />

    <Stack direction="row" alignItems="center" gap={2} sx={{ mb: 3 }}>
      <Typography variant="h4">{guild_name}</Typography>
      <Typography variant="body2" color="text.secondary">
        Rank #{rank} · Total GP {numberWithCommas(total_gp)} · Level {guildLevel} · {members_count}/{maxMembers}
      </Typography>
    </Stack>

    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>This week's progress</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        GP earned: {numberWithCommas(gpThisWeek)}
      </Typography>
      <WeeklyProgressChart detail={data} />
    </Paper>

    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Top contributors this week</Typography>
      <ContributorLeaderboard members={current_week?.members} />
    </Paper>

    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Roster changes this week</Typography>
      <RosterDiff joined={roster_diff?.joined} left={roster_diff?.left} />
    </Paper>
  </>;
}
```

- [ ] **Step 2: PAGES constant check**

Open `components/constants.jsx`. The existing `PAGES.GENERAL.guilds = {}` entry already covers the top-level route. The detail page at `/guilds/[id]` is reached by clicking a row — **no nav entry needed**, no `PAGES` update required.

Per `CLAUDE.md` ("Every new page should have an icon"), the detail page inherits its icon from the parent `guilds` entry (it's not a nav target in its own right). If a separate icon is later wanted, fall back to `/data/ClassIconsNA2.png` as a temporary file per the CLAUDE.md guidance.

- [ ] **Step 3: Manual smoke**

Run:
```powershell
npm run dev
```

Navigate to `http://localhost:3001/guilds?demo=true`, click any row. Detail page should render with all three sections.

---

### Task 23: Update Playwright e2e

**Files:**
- Modify: any existing `e2e/` spec that covers `/guilds`

- [ ] **Step 1: Find existing guild tests**

Search `e2e/` for any spec referencing `/guilds`. If none exist, skip this task.

- [ ] **Step 2: Update assertions to match the new column shape**

If specs reference column count, leader name, or top-contributors-expanded panel, update them: the leader column is gone, top-contributors expansion is replaced by navigation to detail.

- [ ] **Step 3: Run e2e against demo data**

```powershell
npm run test:e2e
```

Expected: PASS (or pre-existing failures, unchanged).

---

### Phase B acceptance checklist

- [ ] `/guilds` renders with new columns populated from the worker API
- [ ] Row click navigates to `/guilds/[id]` which renders all three sections
- [ ] Weekly chart shows 1–3 lines depending on history depth (no JS errors on first week with only current-week data)
- [ ] No data is fetched from Firebase directly by the toolbox for guild lists (verify in browser devtools — only `guild-history.workers.dev` calls)
- [ ] All changes are on the local `feature/guild-history` branch only — no `origin` push

---

## Out-of-band tasks (not part of normal execution)

### When/if Phase A's reset observation disagrees with Thursday 00:00 UTC

If `reset_events.detected_at` consistently lands on a non-Thursday-aligned moment after 2 weeks of observation:

1. Determine the actual reset day-of-week and time from `SELECT detected_at FROM reset_events`.
2. Update `THURSDAY_EPOCH_MS` in `src/week-key.js` to the offset needed (e.g. `2 * 24 * 3600 * 1000` if reset is Saturday).
3. Re-run the test suite (`npm test`); add the observed boundary as a new test case in `tests/week-key.test.js`.
4. Schedule a one-time **data wipe** of partial-week snapshots written under the wrong boundary, then redeploy.

### When/if the refresh token is rejected by Firebase

1. Worker logs show `Token refresh failed: INVALID_REFRESH_TOKEN` from `auth.js`.
2. Re-run `signin.mjs` from the POC directory with the dedicated scraper account credentials.
3. Update the CF secret: `npx wrangler secret put REFRESH_TOKEN`, paste new value.
4. Manually trigger a cron run to verify recovery.

### When the toolbox is ready to publicly ship Phase B

Per the Repo & branch hygiene section of the spec, do not push the branch or open a PR until the owner explicitly approves. When approved:

1. Confirm worker has been collecting for >=2 weeks (so charts have meaningful overlays)
2. Confirm Phase A acceptance checklist still passes
3. Push branch and open PR
4. Deploy worker to its production URL if still on dev/staging
