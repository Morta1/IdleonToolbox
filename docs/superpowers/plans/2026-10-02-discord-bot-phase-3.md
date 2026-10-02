# Discord Bot Phase 3 (`/guild`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `/guild <name>` to the Idleon Toolbox Discord bot: guild-name autocomplete, then a PNG card (rank, weekly rank change, total GP, GP this week vs last week, active members, top 3 contributors) inside a Components V2 container, with links to the site's guild page.

**Architecture:** Only the bot and the site change; the guild-history Worker already serves everything (`/api/guilds` index, `/api/guilds/<id>` detail). The bot caches the ~350 KB index per isolate for 5 minutes for autocomplete and name resolution, fetches the detail on demand, computes the card fields with pure helpers, and renders with the Satori + resvg pipeline built in phase 2. The site gains a `#contributors` anchor that scrolls once the guild has loaded.

**Tech Stack:** Cloudflare Workers (TypeScript, Wrangler 4), Vitest 3 with `@cloudflare/vitest-pool-workers` (`fetchMock`), `satori@0.32.0` + `@resvg/resvg-wasm@2.6.2` (already installed), Next.js 16 static export + Vitest/jsdom on the site.

**Spec:** `IdleonToolbox/docs/superpowers/specs/2026-10-01-discord-bot-design.md` (sections "/profile and /guild: card image", "/guild", "Site prerequisites" item 2, "Errors").

## Global Constraints

- Every link: `utm_source=discord_bot&utm_medium=guild&utm_content=<target>` (built by the existing `siteUrl(env, path, 'guild', content)`); site origin `https://idleontoolbox.com`.
- Funnel rule: the reply shows rank, weekly numbers and the top 3 contributors only; never the member list, GP history or roster changes.
- Replies are Components V2 (`flags: 32768`) through the existing `v2Message`/`ephemeral` helpers (they set `allowed_mentions: { parse: [] }`); errors are ephemeral one-liners; echoed user input goes through `quoteInput`; game text in markdown goes through `escapeMarkdown`.
- Guild accent `0x5DCAA5`. Card 800x330 rendered at 2x (1600 wide), background `#242429`, boxes `#2f3036`, nothing smaller than 20px, about 8px outer padding, no footer inside the image. Same palette object as the profile card.
- Guild names are stored with underscores for spaces (`Hangover_Gang`): display them with spaces everywhere (card, text, autocomplete). Member names are shown as stored.
- Upstream calls: 5s timeout (2.5s for autocomplete, which must answer within Discord's 3s). Only successful (2xx) upstream responses are cached (`cf.cacheTtlByStatus`), never 404/5xx.
- Not public: commands are registered to the test server only (the GitHub Action does this on push). No global registration, no install link.
- No commit steps: the user commits. No em dashes in user-facing copy. No site patch note unless the user approves one.
- Bot repo: `C:\Dev\idleon\toolbox\it-cloudflare-bot`. Site repo: `C:\Dev\idleon\toolbox\IdleonToolbox`. Keep `npx vitest run` and `npx tsc --noEmit` green in the bot after every task.

## Verified facts (2026-10-02)

- `GET https://guild-history.idleontoolbox.workers.dev/api/guilds` → `{ week: "2026-09-26", captured_at: 1790924447704, guilds: [...] }`, 1,002 guilds, 348 KB, `Cache-Control: public, max-age=300`. Row: `{ guild_id: "fdaEWwmHyoc3extC5JzL", guild_name: "Idle", guild_icon: 87, total_gp: 32784501, gp_this_week: 89280, vs_last_wk_pct: -0.0114, rank: 1, rank_delta_2w: 0, members_count: 208, total_gp_history: [...] }`. Guild names are unique in the current index, max 16 chars.
- `GET /api/guilds/<id>` → `{ guild_id, guild_name, rank, total_gp, members_count, total_gp_history, current_week: { week, gp_this_week, timeseries: [{ captured_at, total_gp }], members: [{ member_name, gp_earned, gp_lifetime, weekly_history, joined_weeks_ago, last_contributed_at, member_rank }] }, last_week: { week, timeseries }, rank_history: [{ captured_at, rank }] (31 daily points), roster_diff }`. Unknown id → 404. Members are NOT sorted.
- `guild_icon` is an index: the site renders `${SITE_URL}/data/G2icon<n>.png` (34x34; 124 files, `G2icon0`..`G2icon123`). Fallback `${SITE_URL}/etc/Guild.png` (25x21).
- Crowns: `${SITE_URL}/etc/GuildRank<n>.png` for `member_rank` 0 (King, 15x17) and 1 (Leader, 16x14); the site shows a crown only for ranks 0-4 and labels 0 King, 1 Leader. The card shows crowns for 0 and 1 only (spec).
- Level: `parsers/guild.ts:109` `getGuildLevel(points)` = first `n` (0..99) with `points < 100*(n+1)*1.21^n`, result `min(n+1, 45)`; max members `30 + 4*level`.
- Site "vs last week" on `/guilds/detail` is NOT the index's `vs_last_wk_pct`: `pages/guilds/detail.jsx` `computeVsLastWeekPct` compares this week's GP with last week's timeseries point at-or-before `latest.captured_at - 7 days`, shown as `+0.9% vs last week` (`toFixed(1)`, minus sign `−` for negative). The card must show the same number as the page it links to, so it ports that function.
- Site guild list route: `/guilds`; detail: `/guilds/detail?id=<guild_id>`. The detail page has no `id` anchors or hash handling today; `navBarHeight` (70) is exported from `@components/constants`.

## File Structure

Site (`IdleonToolbox`):

| File | Responsibility |
|---|---|
| `pages/guilds/detail.jsx` (modify) | `id="contributors"` on the contributors Paper, scroll to it once data loads when the hash asks |
| `__test__/pages/guild-detail-contributors-hash.test.jsx` (new) | jsdom test of the anchor |

Bot (`it-cloudflare-bot`):

| File | Responsibility |
|---|---|
| `src/guild-data.ts` (new) | guild-history client: `fetchGuildIndex` (isolate memo), `fetchGuildDetail` |
| `src/guild-stats.ts` (new) | pure: `displayGuildName`, `guildLevel`, `maxMembers`, `searchGuilds`, `resolveGuildRow`, `weeklyRankChange`, `vsLastWeekPct`, `formatVsLastWeek`, `topContributors`, `activeMembers`, `rankChangeText`, `updatedAgo` |
| `src/card/ui.ts` (new) | shared Satori helpers moved out of `profile-card.ts`: `el`, `C`, `SatoriNode`, `rankText`, `pngSize`, `toDataUri`, `scaledIcon` |
| `src/card/profile-card.ts` (modify) | import the shared helpers (no visual change) |
| `src/card/guild-card.ts` (new) | pure `guildCardTree(card)`, `GUILD_CARD_WIDTH` 800, `GUILD_CARD_HEIGHT` 330 |
| `src/guild.ts` (new) | `guildChoices`, `guildMessage`, `guildCard`, `handleGuild` |
| `src/card/dev.ts`, `src/index.ts` (modify) | `/dev/guild-card?id=` preview route (DEV_ROUTES only) |
| `src/types.ts`, `src/interactions.ts`, `src/commands.mjs`, `wrangler.toml` (modify) | wiring: `GUILDS_API`, `GUILD_LIMITER`, `/guild` command |
| `test/guild-stats.test.ts`, `test/guild-data.test.ts`, `test/guild-card.test.ts`, `test/guild.test.ts` (new); `test/commands.test.ts`, `test/render.test.ts`, `test/profile-card.test.ts` (modify) | tests |

---

### Task 1: `#contributors` anchor on the guild detail page (site)

**Files:**
- Modify: `IdleonToolbox/pages/guilds/detail.jsx`
- Test: `IdleonToolbox/__test__/pages/guild-detail-contributors-hash.test.jsx`

**Interfaces:**
- Produces: `/guilds/detail?id=<guild_id>#contributors` scrolls to the "Top contributors this week" section once the guild has loaded. The bot's "All contributors" button links there.

Facts: the page renders `<SimpleLoader/>` until `useGuildDetail(id)` resolves, so the browser's own hash scroll finds nothing. The hash is not part of `router.query`; read `window.location.hash` in an effect (never during render: static export hydration rule in CLAUDE.md). The fixed app bar is `navBarHeight` px tall.

- [ ] **Step 1: Write the failing test**

```jsx
// __test__/pages/guild-detail-contributors-hash.test.jsx
// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import darkTheme from '../../styles/theme/darkTheme';

const routerState = { isReady: true, query: { id: 'g1' }, push: vi.fn(), replace: vi.fn(), asPath: '/guilds/detail?id=g1', pathname: '/guilds/detail' };
vi.mock('next/router', () => ({ useRouter: () => routerState }));
vi.mock('next-seo', () => ({ NextSeo: () => null }));
// Charts pull in nivo, which jsdom cannot lay out; they are irrelevant to the anchor.
vi.mock('@components/guilds/WeeklyProgressChart', () => ({ default: () => null }));
vi.mock('@components/guilds/TrendChart', () => ({ default: () => null }));
vi.mock('@components/guilds/RankHistoryChart', () => ({ default: () => null }));

const detail = {
  guild_id: 'g1', guild_name: 'Test_Guild', rank: 4, total_gp: 1000000, members_count: 10, total_gp_history: [],
  current_week: { week: '2026-09-26', gp_this_week: 500, timeseries: [{ captured_at: 1790924447704, total_gp: 500 }], members: [{ member_name: 'A', gp_earned: 300, gp_lifetime: 900, member_rank: 0 }] },
  last_week: { week: '2026-09-19', timeseries: [] }, rank_history: [], roster_diff: { joined: [], left: [] }
};
const fetchGuildDetail = vi.fn(async () => detail);
vi.mock('../../services/guild-history', () => ({ fetchGuildDetail, fetchGuildIndex: vi.fn(), fetchGlobalSnapshots: vi.fn(), GUILD_HISTORY_BASE: 'http://x' }));

const scrollIntoView = vi.fn();
Element.prototype.scrollIntoView = scrollIntoView;

const { AppContext } = await import('@components/common/context/AppProvider');
const GuildDetail = (await import('../../pages/guilds/detail')).default;

const renderPage = () => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <ThemeProvider theme={darkTheme}>
      <AppContext.Provider value={{ state: {} }}>
        <GuildDetail/>
      </AppContext.Provider>
    </ThemeProvider>
  </QueryClientProvider>
);

beforeEach(() => window.history.replaceState(null, '', '/guilds/detail?id=g1'));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('guild detail #contributors', () => {
  it('scrolls to the contributors section once the guild has loaded', async () => {
    window.history.replaceState(null, '', '/guilds/detail?id=g1#contributors');
    const { container } = renderPage();
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(1));
    expect(scrollIntoView.mock.contexts[0]).toBe(container.querySelector('#contributors'));
  });

  it('does not scroll without the hash', async () => {
    const { container } = renderPage();
    await waitFor(() => expect(container.querySelector('#contributors')).not.toBeNull());
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
```

If the page needs other providers (check `pages/guilds/detail.jsx` imports: `useReportPageLoading` comes from `PageLoadingProvider`, `useFormatDate` may read a preferences context), wrap or mock minimally and note it in the report. Do not use the global `screen` export.

- [ ] **Step 2: Run to verify it fails**

Run (in `IdleonToolbox`): `npx vitest run __test__/pages/guild-detail-contributors-hash.test.jsx`
Expected: first test FAILS (no `#contributors` element, no scroll); second test FAILS on the `#contributors` lookup.

- [ ] **Step 3: Implement**

In `pages/guilds/detail.jsx`:

1. Add imports: `import { useEffect, useRef } from 'react';` and `import { navBarHeight } from '@components/constants';`
2. Inside `GuildDetail`, directly after `useReportPageLoading(isLoading || !id);` (hooks must stay above the early returns):

```jsx
  // /guilds/detail?id=...#contributors (the Discord bot links here). The page renders a loader
  // first, so the browser's own hash scroll finds nothing: scroll once the guild is in.
  const scrolledToHash = useRef(false);
  useEffect(() => {
    if (!data || scrolledToHash.current || window.location.hash !== '#contributors') return;
    scrolledToHash.current = true;
    document.getElementById('contributors')?.scrollIntoView({ block: 'start' });
  }, [data]);
```

3. Give the contributors Paper the anchor and clear the fixed app bar:

```jsx
    <Paper id="contributors" sx={{ p: 2, mb: 3, scrollMarginTop: `${navBarHeight + 16}px` }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Top contributors this week</Typography>
      <ContributorLeaderboard members={current_week?.members} />
    </Paper>
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run __test__/pages/guild-detail-contributors-hash.test.jsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Static export safety**

Run: `npx vitest run __test__/no-nossr.test.js __test__/page-seo.test.js` (both pass). The machine OOMs with the default worker count on full runs: use `--maxWorkers=3` for any full-suite run.

---

### Task 2: Guild stats and the guild-history client (bot)

**Files:**
- Create: `it-cloudflare-bot/src/guild-stats.ts`, `src/guild-data.ts`, `test/guild-stats.test.ts`, `test/guild-data.test.ts`
- Modify: `src/types.ts`, `wrangler.toml`

**Interfaces:**
- Produces (`src/guild-data.ts`):
  - `interface GuildRow { guild_id: string; guild_name: string; guild_icon: number | null; total_gp: number; gp_this_week: number; rank: number; members_count: number }`
  - `interface GuildIndex { capturedAt: number | null; guilds: GuildRow[] }`
  - `interface GuildMember { member_name: string; gp_earned: number; member_rank: number | null }`
  - `interface GuildDetail { guild_id: string; members: GuildMember[]; rankHistory: { captured_at: number; rank: number }[]; thisWeek: { captured_at: number; total_gp: number }[]; lastWeek: { captured_at: number; total_gp: number }[]; gpThisWeek: number }`
  - `fetchGuildIndex(env: Env, options?: { timeoutMs?: number }): Promise<GuildIndex>` (throws on failure; memoized per isolate for 300s)
  - `fetchGuildDetail(env: Env, id: string): Promise<GuildDetail | null>` (null on 404, throws on other failures)
  - `resetGuildIndexCache(): void` (tests only)
- Produces (`src/guild-stats.ts`): `displayGuildName(name)`, `guildLevel(totalGp)`, `maxMembers(level)`, `searchGuilds(guilds, q, limit = 25)`, `resolveGuildRow(guilds, value)`, `weeklyRankChange(rankHistory, currentRank)`, `vsLastWeekPct(thisWeek, lastWeek, gpThisWeek)`, `formatVsLastWeek(pct)`, `topContributors(members, n = 3)`, `activeMembers(members)`, `rankChangeText(change)`, `updatedAgo(capturedAt, now = Date.now())`. Signatures in Step 3.
- Env gains `GUILDS_API: string` (`"https://guild-history.idleontoolbox.workers.dev/api"`).

- [ ] **Step 1: Write the failing tests**

```ts
// test/guild-stats.test.ts
import { describe, expect, it } from 'vitest';
import {
  activeMembers, displayGuildName, formatVsLastWeek, guildLevel, maxMembers, rankChangeText, resolveGuildRow,
  searchGuilds, topContributors, updatedAgo, vsLastWeekPct, weeklyRankChange
} from '../src/guild-stats';
import type { GuildRow } from '../src/guild-data';

const row = (guild_id: string, guild_name: string, rank: number): GuildRow =>
  ({ guild_id, guild_name, guild_icon: 1, total_gp: 1000, gp_this_week: 10, rank, members_count: 5 });
const guilds = [row('a', 'Idle', 1), row('b', 'Hangover_Gang', 4), row('c', 'Idle_Kings', 9), row('d', 'The_Idlers', 20), row('e', 'Wisy_Ducky', 501)];
const DAY = 86_400_000;

describe('names', () => {
  it('shows underscores as spaces', () => expect(displayGuildName('Hangover_Gang')).toBe('Hangover Gang'));
});

describe('level', () => {
  // Same closed form as parsers/guild.ts getGuildLevel: thresholds 100, 242, 439.23, ...
  it('matches the site formula', () => {
    expect(guildLevel(0)).toBe(1);
    expect(guildLevel(99)).toBe(1);
    expect(guildLevel(100)).toBe(2);
    expect(guildLevel(242)).toBe(3);
    expect(guildLevel(32784501)).toBe(45);
    expect(maxMembers(45)).toBe(210);
  });
});

describe('searchGuilds', () => {
  it('ranks exact, then prefix, then word prefix, then substring, then by guild rank', () => {
    expect(searchGuilds(guilds, 'idle').map((g) => g.guild_id)).toEqual(['a', 'c', 'd']);
  });
  it('treats spaces and underscores alike and ignores case', () => {
    expect(searchGuilds(guilds, 'hangover g').map((g) => g.guild_id)).toEqual(['b']);
  });
  it('returns the top guilds by rank for an empty query, capped at the limit', () => {
    expect(searchGuilds(guilds, '', 2).map((g) => g.guild_id)).toEqual(['a', 'b']);
  });
});

describe('resolveGuildRow', () => {
  it('prefers the id (what autocomplete sends), then an exact name, then the best search hit', () => {
    expect(resolveGuildRow(guilds, 'b')?.guild_id).toBe('b');
    expect(resolveGuildRow(guilds, 'hangover gang')?.guild_id).toBe('b');
    expect(resolveGuildRow(guilds, 'wisy')?.guild_id).toBe('e');
    expect(resolveGuildRow(guilds, 'zzz')).toBeNull();
  });
});

describe('weeklyRankChange', () => {
  const now = 1_790_924_447_704;
  const history = [
    { captured_at: now - 8 * DAY, rank: 20 },
    { captured_at: now - 7 * DAY + 3600_000, rank: 17 },
    { captured_at: now - 6 * DAY, rank: 15 },
    { captured_at: now, rank: 14 }
  ];
  it('compares with the point closest to 7 days before the latest (positive = climbed)', () => {
    expect(weeklyRankChange(history, 14)).toBe(3);
  });
  it('is null without a point within 2 days of a week ago', () => {
    expect(weeklyRankChange([{ captured_at: now - DAY, rank: 3 }, { captured_at: now, rank: 2 }], 2)).toBeNull();
    expect(weeklyRankChange([], 2)).toBeNull();
  });
  it('words the change', () => {
    expect(rankChangeText(3)).toBe('Up 3 this week');
    expect(rankChangeText(-2)).toBe('Down 2 this week');
    expect(rankChangeText(0)).toBe('Same rank as last week');
    expect(rankChangeText(null)).toBeNull();
  });
});

describe('vsLastWeekPct (port of pages/guilds/detail.jsx computeVsLastWeekPct)', () => {
  const now = 1_790_924_447_704;
  const thisWeek = [{ captured_at: now - DAY, total_gp: 400 }, { captured_at: now, total_gp: 500 }];
  it('compares with last week at the same point of the week', () => {
    const lastWeek = [{ captured_at: now - 7 * DAY - 3600_000, total_gp: 400 }, { captured_at: now - 7 * DAY + 3600_000, total_gp: 450 }];
    expect(vsLastWeekPct(thisWeek, lastWeek, 500)).toBeCloseTo(0.25);
    expect(formatVsLastWeek(0.25)).toBe('+25.0% vs last week');
    expect(formatVsLastWeek(-0.0114)).toBe('\u22121.1% vs last week');
  });
  it('is null when last week has no point at or before the target, or it is 0', () => {
    expect(vsLastWeekPct(thisWeek, [{ captured_at: now, total_gp: 1 }], 500)).toBeNull();
    expect(vsLastWeekPct(thisWeek, [{ captured_at: now - 8 * DAY, total_gp: 0 }], 500)).toBeNull();
    expect(vsLastWeekPct([], [], 500)).toBeNull();
  });
});

describe('members', () => {
  const members = [
    { member_name: 'C', gp_earned: 560, member_rank: 5 },
    { member_name: 'A', gp_earned: 620, member_rank: 1 },
    { member_name: 'Z', gp_earned: 0, member_rank: 0 },
    { member_name: 'B', gp_earned: 600, member_rank: 5 }
  ];
  it('takes the top contributors by GP earned this week', () => {
    expect(topContributors(members).map((m) => m.member_name)).toEqual(['A', 'B', 'C']);
  });
  it('never lists a member who earned nothing', () => {
    expect(topContributors([{ member_name: 'Z', gp_earned: 0, member_rank: 0 }])).toEqual([]);
  });
  it('counts members active this week', () => expect(activeMembers(members)).toBe(3));
});

describe('updatedAgo', () => {
  it('reads minutes, then hours', () => {
    expect(updatedAgo(1000 * 60 * 10, 1000 * 60 * 40)).toBe('updated 30 min ago');
    expect(updatedAgo(0, 1000 * 60 * 60 * 5)).toBe('updated 5 h ago');
    expect(updatedAgo(null)).toBeNull();
  });
});
```

```ts
// test/guild-data.test.ts
import { env, fetchMock } from 'cloudflare:test';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { fetchGuildDetail, fetchGuildIndex, resetGuildIndexCache } from '../src/guild-data';

beforeAll(() => { fetchMock.activate(); fetchMock.disableNetConnect(); });
beforeEach(() => resetGuildIndexCache());
afterEach(() => fetchMock.assertNoPendingInterceptors());

const origin = new URL(env.GUILDS_API).origin;
const base = new URL(env.GUILDS_API).pathname.replace(/\/$/, '');
const indexBody = {
  week: '2026-09-26', captured_at: 1790924447704,
  guilds: [
    { guild_id: 'a', guild_name: 'Idle', guild_icon: 87, total_gp: 5, gp_this_week: 1, vs_last_wk_pct: 0, rank: 1, rank_delta_2w: 0, members_count: 2, total_gp_history: [1, 2] },
    { guild_id: 7, guild_name: 'Broken' }
  ]
};

describe('fetchGuildIndex', () => {
  it('keeps valid rows only and memoizes per isolate', async () => {
    fetchMock.get(origin).intercept({ path: `${base}/guilds` }).reply(200, indexBody);
    const first = await fetchGuildIndex(env);
    expect(first.capturedAt).toBe(1790924447704);
    expect(first.guilds).toEqual([{ guild_id: 'a', guild_name: 'Idle', guild_icon: 87, total_gp: 5, gp_this_week: 1, rank: 1, members_count: 2 }]);
    // No second interceptor: a second upstream call would fail the test.
    expect(await fetchGuildIndex(env)).toBe(first);
  });

  it('throws on an upstream error', async () => {
    fetchMock.get(origin).intercept({ path: `${base}/guilds` }).reply(500, 'down');
    await expect(fetchGuildIndex(env)).rejects.toThrow();
  });
});

describe('fetchGuildDetail', () => {
  it('maps the detail and returns null on 404', async () => {
    fetchMock.get(origin).intercept({ path: `${base}/guilds/a` }).reply(200, {
      guild_id: 'a', current_week: { gp_this_week: 9, timeseries: [{ captured_at: 2, total_gp: 9 }], members: [{ member_name: 'M', gp_earned: 9, member_rank: 0, gp_lifetime: 1 }, { member_name: 5 }] },
      last_week: { timeseries: [{ captured_at: 1, total_gp: 3 }] }, rank_history: [{ captured_at: 2, rank: 1 }, { captured_at: 'x', rank: 1 }]
    });
    expect(await fetchGuildDetail(env, 'a')).toEqual({
      guild_id: 'a', gpThisWeek: 9,
      members: [{ member_name: 'M', gp_earned: 9, member_rank: 0 }],
      rankHistory: [{ captured_at: 2, rank: 1 }],
      thisWeek: [{ captured_at: 2, total_gp: 9 }],
      lastWeek: [{ captured_at: 1, total_gp: 3 }]
    });
    fetchMock.get(origin).intercept({ path: `${base}/guilds/missing` }).reply(404, 'nope');
    expect(await fetchGuildDetail(env, 'missing')).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run (in `it-cloudflare-bot`): `npx vitest run test/guild-stats.test.ts test/guild-data.test.ts`
Expected: FAIL (modules not found).

- [ ] **Step 3: Implement**

`wrangler.toml` `[vars]`: add `GUILDS_API = "https://guild-history.idleontoolbox.workers.dev/api"`. `src/types.ts` `Env`: add `GUILDS_API: string;`.

```ts
// src/guild-data.ts
// Client for the guild-history Worker. The index (~1,000 guilds, ~350 KB) feeds autocomplete on
// every keystroke, so it is memoized per isolate for the same 5 minutes the API caches it.
import type { Env } from './types';

export interface GuildRow { guild_id: string; guild_name: string; guild_icon: number | null; total_gp: number; gp_this_week: number; rank: number; members_count: number }
export interface GuildIndex { capturedAt: number | null; guilds: GuildRow[] }
export interface GuildMember { member_name: string; gp_earned: number; member_rank: number | null }
type Point = { captured_at: number; total_gp: number };
export interface GuildDetail { guild_id: string; members: GuildMember[]; rankHistory: { captured_at: number; rank: number }[]; thisWeek: Point[]; lastWeek: Point[]; gpThisWeek: number }

const INDEX_TTL_MS = 300_000;
let indexMemo: { at: number; index: GuildIndex } | null = null;
export const resetGuildIndexCache = () => { indexMemo = null; };

const num = (value: unknown) => typeof value === 'number' && Number.isFinite(value);
const cf = { cacheTtlByStatus: { '200-299': 300, '404': 0, '500-599': 0 } };

export async function fetchGuildIndex(env: Env, options: { timeoutMs?: number } = {}): Promise<GuildIndex> {
  if (indexMemo && Date.now() - indexMemo.at < INDEX_TTL_MS) return indexMemo.index;
  const res = await fetch(`${env.GUILDS_API}/guilds`, { signal: AbortSignal.timeout(options.timeoutMs ?? 5000), cf } as RequestInit);
  if (!res.ok) throw new Error(`guild index ${res.status}`);
  const body = await res.json() as { captured_at?: unknown; guilds?: unknown };
  const guilds = (Array.isArray(body.guilds) ? body.guilds : [])
    .filter((g: any) => typeof g?.guild_id === 'string' && typeof g?.guild_name === 'string' && num(g?.rank) && num(g?.total_gp))
    .map((g: any): GuildRow => ({
      guild_id: g.guild_id, guild_name: g.guild_name, guild_icon: num(g.guild_icon) ? g.guild_icon : null,
      total_gp: g.total_gp, gp_this_week: num(g.gp_this_week) ? g.gp_this_week : 0, rank: g.rank,
      members_count: num(g.members_count) ? g.members_count : 0
    }));
  const index = { capturedAt: num(body.captured_at) ? body.captured_at as number : null, guilds };
  indexMemo = { at: Date.now(), index };
  return index;
}

const points = (list: unknown): Point[] => (Array.isArray(list) ? list : [])
  .filter((p: any) => num(p?.captured_at) && num(p?.total_gp)).map((p: any) => ({ captured_at: p.captured_at, total_gp: p.total_gp }));

export async function fetchGuildDetail(env: Env, id: string): Promise<GuildDetail | null> {
  const res = await fetch(`${env.GUILDS_API}/guilds/${encodeURIComponent(id)}`, { signal: AbortSignal.timeout(5000), cf } as RequestInit);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`guild detail ${res.status}`);
  const body = await res.json() as any;
  const week = body?.current_week ?? {};
  return {
    guild_id: String(body?.guild_id ?? id),
    gpThisWeek: num(week.gp_this_week) ? week.gp_this_week : 0,
    members: (Array.isArray(week.members) ? week.members : [])
      .filter((m: any) => typeof m?.member_name === 'string' && num(m?.gp_earned))
      .map((m: any) => ({ member_name: m.member_name, gp_earned: m.gp_earned, member_rank: num(m.member_rank) ? m.member_rank : null })),
    rankHistory: (Array.isArray(body?.rank_history) ? body.rank_history : [])
      .filter((p: any) => num(p?.captured_at) && num(p?.rank)).map((p: any) => ({ captured_at: p.captured_at, rank: p.rank })),
    thisWeek: points(week.timeseries),
    lastWeek: points(body?.last_week?.timeseries)
  };
}
```

```ts
// src/guild-stats.ts
// Pure guild figures for the card and the text reply. Level and "vs last week" are ports of the
// site (parsers/guild.ts, pages/guilds/detail.jsx) so the card agrees with the page it links to.
import type { GuildDetail, GuildMember, GuildRow } from './guild-data';

const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;

export const displayGuildName = (name: string) => name.replace(/_/g, ' ').trim();
const normal = (value: string) => value.toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();

export function guildLevel(totalGp: number): number {
  for (let n = 0; n < 100; n++) {
    if (!(totalGp >= 100 * (n + 1) * Math.pow(1.21, n))) return Math.min(n + 1, 45);
  }
  return 1;
}
export const maxMembers = (level: number) => 30 + 4 * level;

export function searchGuilds(guilds: GuildRow[], q: string, limit = 25): GuildRow[] {
  const query = normal(q);
  const score = (g: GuildRow) => {
    const name = normal(g.guild_name);
    if (!query) return 0;
    if (name === query) return 0;
    if (name.startsWith(query)) return 1;
    if (name.split(' ').some((word) => word.startsWith(query))) return 2;
    if (name.includes(query)) return 3;
    return -1;
  };
  return guilds
    .map((g) => ({ g, s: score(g) }))
    .filter(({ s }) => s >= 0)
    .sort((a, b) => a.s - b.s || a.g.rank - b.g.rank)
    .slice(0, limit)
    .map(({ g }) => g);
}

export function resolveGuildRow(guilds: GuildRow[], value: string): GuildRow | null {
  const byId = guilds.find((g) => g.guild_id === value);
  if (byId) return byId;
  const wanted = normal(value);
  return guilds.find((g) => normal(g.guild_name) === wanted) ?? searchGuilds(guilds, value, 1)[0] ?? null;
}

// No API field holds last week's rank (rank_delta_2w spans two weeks), so read the daily history.
export function weeklyRankChange(history: GuildDetail['rankHistory'], currentRank: number): number | null {
  if (history.length < 2) return null;
  const latest = history.reduce((a, b) => (b.captured_at > a.captured_at ? b : a));
  const target = latest.captured_at - WEEK_MS;
  const closest = history.reduce((a, b) => (Math.abs(b.captured_at - target) < Math.abs(a.captured_at - target) ? b : a));
  if (Math.abs(closest.captured_at - target) > 2 * DAY_MS) return null;
  return closest.rank - currentRank;
}

export function rankChangeText(change: number | null): string | null {
  if (change == null) return null;
  if (change > 0) return `Up ${change} this week`;
  if (change < 0) return `Down ${-change} this week`;
  return 'Same rank as last week';
}

export function vsLastWeekPct(thisWeek: GuildDetail['thisWeek'], lastWeek: GuildDetail['lastWeek'], gpThisWeek: number): number | null {
  if (!thisWeek.length || !lastWeek.length) return null;
  const target = thisWeek[thisWeek.length - 1].captured_at - WEEK_MS;
  let match: GuildDetail['lastWeek'][number] | null = null;
  for (const p of lastWeek) {
    if (p.captured_at <= target) match = p;
    else break;
  }
  if (!match || match.total_gp <= 0) return null;
  return (gpThisWeek - match.total_gp) / match.total_gp;
}

export const formatVsLastWeek = (pct: number) => `${pct >= 0 ? '+' : '\u2212'}${Math.abs(pct * 100).toFixed(1)}% vs last week`;

export const topContributors = (members: GuildMember[], n = 3) =>
  members.filter((m) => m.gp_earned > 0).sort((a, b) => b.gp_earned - a.gp_earned).slice(0, n);

export const activeMembers = (members: GuildMember[]) => members.filter((m) => m.gp_earned > 0).length;

export function updatedAgo(capturedAt: number | null, now = Date.now()): string | null {
  if (capturedAt == null) return null;
  const minutes = Math.max(0, Math.round((now - capturedAt) / 60000));
  return minutes < 90 ? `updated ${minutes} min ago` : `updated ${Math.round(minutes / 60)} h ago`;
}
```

- [ ] **Step 4: Run to verify they pass**

Run: `npx vitest run test/guild-stats.test.ts test/guild-data.test.ts` → PASS. Then `npx vitest run` and `npx tsc --noEmit` (all green).

---

### Task 3: Shared card helpers and the guild card (bot)

**Files:**
- Create: `src/card/ui.ts`, `src/card/guild-card.ts`, `test/guild-card.test.ts`
- Modify: `src/card/profile-card.ts`, `test/render.test.ts`, `test/profile-card.test.ts` (imports only, if they import moved names)

**Interfaces:**
- Consumes: `renderPng(tree, width, height)` (phase 2, `src/card/render.ts`).
- Produces:
  - `src/card/ui.ts`: `type SatoriNode`, `el(type, style, children?, extra?)`, `C` (palette), `rankText(rank)`, `pngSize(bytes)`, `toDataUri(bytes)`, `type CardIcon = { dataUri: string; width: number; height: number }`, `scaledIcon(bytes: Uint8Array, opts: { scale?: number; height?: number }): CardIcon`.
  - `src/card/profile-card.ts` keeps exporting `profileCardTree`, `CARD_WIDTH`, `CARD_HEIGHT`, `ProfileCard`, and re-exports `pngSize`, `toDataUri` (existing importers keep working).
  - `src/card/guild-card.ts`: `GUILD_CARD_WIDTH = 800`, `GUILD_CARD_HEIGHT = 330`, `interface GuildCard`, `guildCardTree(card: GuildCard): SatoriNode`.

```ts
export interface GuildCard {
  name: string;                 // display name (spaces)
  icon: CardIcon | null;
  level: number;
  members: number;
  maxMembers: number;
  rank: number;
  rankChange: string | null;    // rankChangeText output
  rankChangeDirection: 'up' | 'down' | 'same' | null;
  totalGp: string;              // already formatted, e.g. "8,412,330"
  gpThisWeek: string;
  vsLastWeek: string | null;    // formatVsLastWeek output
  vsLastWeekUp: boolean | null;
  active: number;
  contributors: { name: string; gp: string; crown: CardIcon | null }[];
}
```

Layout (matches the approved mockup `guild5-800x330.png`): row 1 = icon box (96x96, `C.box`, 1px `C.boxBorder`, radius 12) + name (46px, 700) + `Level <l> · <members> / <max> members` (22px, `C.muted`); right side rank `#<rank>` (60px, 700, `C.gold`) with the rank change under it (24px, 700; up `C.teal`, down `#cf6679`, same `C.muted`). Row 2 = three equal boxes (`C.box`, radius 10, padding 10px 16px, gap 14): "Total GP" / value; "GP this week" / value / vs-last-week line (20px, 700, `#81c784` up or `#cf6679` down, omitted when null); "Active this week" / value / `of <members>` (20px, `C.muted`). Row 3 = label "Top contributors this week" (20px, `C.muted`) and chips (22px, 700, `#D3D1C7` on `C.box`, radius 8, padding 6px 14px, gap 12): optional crown image, name, GP in `#888780` weight 400. With no contributors, row 3 shows "No contributions yet this week" (22px, `C.muted`).

- [ ] **Step 1: Write the failing test**

```ts
// test/guild-card.test.ts
import { describe, expect, it } from 'vitest';
import { guildCardTree, GUILD_CARD_HEIGHT, GUILD_CARD_WIDTH, type GuildCard } from '../src/card/guild-card';
import { renderPng } from '../src/card/render';

const card: GuildCard = {
  name: 'Hangover Gang', icon: null, level: 42, members: 198, maxMembers: 198, rank: 14,
  rankChange: 'Up 3 this week', rankChangeDirection: 'up', totalGp: '8,412,330', gpThisWeek: '142,800',
  vsLastWeek: '+12.0% vs last week', vsLastWeekUp: true, active: 171,
  contributors: [{ name: 'Player1', gp: '9,120', crown: null }, { name: 'Player2', gp: '7,840', crown: null }, { name: 'Player3', gp: '6,505', crown: null }]
};

const texts = (node: unknown): string[] => {
  if (node == null || typeof node === 'boolean') return [];
  if (typeof node === 'string' || typeof node === 'number') return [String(node)];
  if (Array.isArray(node)) return node.flatMap(texts);
  return texts((node as { props?: { children?: unknown } }).props?.children);
};
const fontSizes = (node: any): number[] => !node || typeof node !== 'object' ? [] : Array.isArray(node) ? node.flatMap(fontSizes)
  : [...(typeof node.props?.style?.fontSize === 'number' ? [node.props.style.fontSize] : []), ...fontSizes(node.props?.children)];

describe('guildCardTree', () => {
  it('is 800x330 and carries every field', () => {
    const tree = guildCardTree(card);
    expect(tree.props.style).toMatchObject({ width: GUILD_CARD_WIDTH, height: GUILD_CARD_HEIGHT, backgroundColor: '#242429' });
    const all = texts(tree).join(' | ');
    for (const s of ['Hangover Gang', 'Level 42 · 198 / 198 members', '#14', 'Up 3 this week', 'Total GP', '8,412,330', 'GP this week', '142,800',
      '+12.0% vs last week', 'Active this week', '171', 'of 198', 'Top contributors this week', 'Player1', '9,120', 'Player3']) {
      expect(all).toContain(s);
    }
  });

  it('never uses a font under 20px', () => {
    expect(Math.min(...fontSizes(guildCardTree(card)))).toBeGreaterThanOrEqual(20);
  });

  it('drops optional lines and says so when nobody contributed', () => {
    const all = texts(guildCardTree({ ...card, rankChange: null, rankChangeDirection: null, vsLastWeek: null, vsLastWeekUp: null, contributors: [] })).join(' | ');
    expect(all).not.toContain('Up 3');
    expect(all).not.toContain('vs last week');
    expect(all).toContain('No contributions yet this week');
  });

  it('renders to a 1600x660 PNG', async () => {
    const png = await renderPng(guildCardTree(card), GUILD_CARD_WIDTH, GUILD_CARD_HEIGHT);
    expect(Array.from(png.slice(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    const view = new DataView(png.buffer, png.byteOffset);
    expect([view.getUint32(16), view.getUint32(20)]).toEqual([1600, 660]);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run test/guild-card.test.ts` → FAIL (module not found).

- [ ] **Step 3: Implement**

1. Create `src/card/ui.ts` by MOVING (not copying) from `src/card/profile-card.ts`: the `SatoriNode` type, `el`, the `C` palette, `rankText`, `pngSize`, `toDataUri`. Add `CardIcon` and:

```ts
// Game sprites are tiny (G2icon is 34x34): scale by a factor, or to a fixed height for inline chips.
export function scaledIcon(bytes: Uint8Array, opts: { scale?: number; height?: number }): CardIcon {
  const { width, height } = pngSize(bytes);
  if (opts.height) return { dataUri: toDataUri(bytes), width: Math.round((width * opts.height) / height), height: opts.height };
  const scale = opts.scale ?? 2;
  return { dataUri: toDataUri(bytes), width: width * scale, height: height * scale };
}
```

   `profile-card.ts` imports them from `./ui` and re-exports `pngSize` and `toDataUri` (`export { pngSize, toDataUri } from './ui';`). `profile.ts`'s `classIcon` may switch to `scaledIcon(bytes, { scale: 2 })`; behaviour must not change (existing profile tests stay green).

2. Create `src/card/guild-card.ts`:

```ts
// The /guild card as a Satori element tree. Pure, unit-tested directly; layout follows the approved
// mockup (spec "Guild card", 800x330) and shares the profile card's palette.
import { C, el, rankText, type CardIcon, type SatoriNode } from './ui';

export const GUILD_CARD_WIDTH = 800;
export const GUILD_CARD_HEIGHT = 330;
const UP = '#81c784';
const DOWN = '#cf6679';

export interface GuildCard {
  name: string;
  icon: CardIcon | null;
  level: number;
  members: number;
  maxMembers: number;
  rank: number;
  rankChange: string | null;
  rankChangeDirection: 'up' | 'down' | 'same' | null;
  totalGp: string;
  gpThisWeek: string;
  vsLastWeek: string | null;
  vsLastWeekUp: boolean | null;
  active: number;
  contributors: { name: string; gp: string; crown: CardIcon | null }[];
}

const img = (icon: CardIcon) => el('img', {}, undefined, { src: icon.dataUri, width: icon.width, height: icon.height });

export function guildCardTree(card: GuildCard): SatoriNode {
  const iconBox = el('div', { width: 96, height: 96, borderRadius: 12, backgroundColor: C.box, border: `1px solid ${C.boxBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    card.icon ? img(card.icon) : undefined);

  const identity = el('div', { display: 'flex', alignItems: 'center', gap: 20 }, [
    iconBox,
    el('div', { display: 'flex', flexDirection: 'column' }, [
      el('div', { fontSize: 46, fontWeight: 700, color: C.text, lineHeight: 1.1 }, card.name),
      el('div', { fontSize: 22, color: C.muted }, `Level ${card.level} · ${card.members} / ${card.maxMembers} members`)
    ])
  ]);

  const changeColor = card.rankChangeDirection === 'up' ? C.teal : card.rankChangeDirection === 'down' ? DOWN : C.muted;
  const headline = el('div', { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }, [
    el('div', { fontSize: 60, fontWeight: 700, color: C.gold, lineHeight: 1 }, rankText(card.rank)),
    ...(card.rankChange ? [el('div', { fontSize: 24, fontWeight: 700, color: changeColor }, card.rankChange)] : [])
  ]);

  const stat = (label: string, value: string, extra?: SatoriNode) =>
    el('div', { display: 'flex', flexDirection: 'column', flex: 1, padding: '10px 16px', borderRadius: 10, backgroundColor: C.box }, [
      el('div', { fontSize: 20, color: C.muted }, label),
      el('div', { fontSize: 32, fontWeight: 700, color: C.text, lineHeight: 1.2 }, value),
      ...(extra ? [extra] : [])
    ]);

  const stats = el('div', { display: 'flex', gap: 14 }, [
    stat('Total GP', card.totalGp),
    stat('GP this week', card.gpThisWeek, card.vsLastWeek
      ? el('div', { fontSize: 20, fontWeight: 700, color: card.vsLastWeekUp ? UP : DOWN }, card.vsLastWeek) : undefined),
    stat('Active this week', String(card.active), el('div', { fontSize: 20, color: C.muted }, `of ${card.members}`))
  ]);

  const chip = (c: GuildCard['contributors'][number]) =>
    el('div', { display: 'flex', alignItems: 'center', gap: 8, fontSize: 22, fontWeight: 700, color: '#D3D1C7', backgroundColor: C.box, padding: '6px 14px', borderRadius: 8 }, [
      ...(c.crown ? [img(c.crown)] : []),
      el('div', {}, c.name),
      el('div', { color: '#888780', fontWeight: 400 }, c.gp)
    ]);

  const contributors = el('div', { display: 'flex', flexDirection: 'column', gap: 8 }, [
    el('div', { fontSize: 20, color: C.muted }, 'Top contributors this week'),
    card.contributors.length
      ? el('div', { display: 'flex', gap: 12 }, card.contributors.map(chip))
      : el('div', { fontSize: 22, color: C.muted }, 'No contributions yet this week')
  ]);

  return el('div', {
    width: GUILD_CARD_WIDTH, height: GUILD_CARD_HEIGHT, backgroundColor: C.bg, display: 'flex', flexDirection: 'column',
    justifyContent: 'space-between', padding: '10px 8px', fontFamily: 'Inter', color: C.text
  }, [
    el('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, [identity, headline]),
    stats,
    contributors
  ]);
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run test/guild-card.test.ts test/profile-card.test.ts test/render.test.ts` → PASS; then `npx vitest run` and `npx tsc --noEmit`.

---

### Task 4: `/guild` command (bot)

**Files:**
- Create: `src/guild.ts`, `test/guild.test.ts`
- Modify: `src/interactions.ts`, `src/commands.mjs`, `src/types.ts`, `wrangler.toml`, `src/card/dev.ts`, `src/index.ts`, `test/commands.test.ts`

**Interfaces:**
- Consumes: Task 2 (`fetchGuildIndex`, `fetchGuildDetail`, all of `guild-stats`), Task 3 (`guildCardTree`, `GUILD_CARD_WIDTH/HEIGHT`, `scaledIcon`), phase 1-2 (`editOriginal`, `editOriginalWithFile`, `replaceWithEphemeral`, `quoteInput`, `UNAVAILABLE`, `siteUrl`, `v2Message`, `container`, `actionRow`, `linkButton`, `text`, `ephemeral`, `escapeMarkdown`, `renderPng`).
- Produces: `guildChoices(env, q)`, `guildMessage(env, view: GuildView, options: { withImage: boolean })`, `guildCard(env, view): Promise<GuildCard>`, `handleGuild(env, ctx, value, token, interactionId, userId)`, `interface GuildView { row: GuildRow; detail: GuildDetail; capturedAt: number | null }`. `Env.GUILD_LIMITER?: { limit(options: { key: string }): Promise<{ success: boolean }> }`.

Behaviour:
- Autocomplete: `searchGuilds(index.guilds, q)` (index fetched with `timeoutMs: 2500`; any failure returns no choices). Choice name `"<display name> (#<rank>)"` (max 100 chars), value `guild_id`.
- Command: rate-limit by Discord user id with `GUILD_LIMITER` (missing binding = allowed; limited → immediate ephemeral `Slow down, try again in a few seconds.`). Otherwise defer (type 5) and in `ctx.waitUntil`:
  1. `fetchGuildIndex(env)`, `resolveGuildRow(index.guilds, value)`; no row, or `fetchGuildDetail` returns null → `replaceWithEphemeral` with `'<quoteInput(value)>' isn't in the top ~1,000 tracked guilds.` and a "Browse guilds" button (`/guilds`, `utm_content=not_found`).
  2. Card PNG cached in `caches.default` under `https://card.cache/guild/<encoded guild_id>/<capturedAt ?? 'none'>` for 1800s (the cache write in its own try/catch, as in `profile.ts`); render on a miss.
  3. Rendered → `editOriginalWithFile` with the image message; render throws → `editOriginal` with the text message; either edit returning false → `replaceWithEphemeral(UNAVAILABLE)`. Any other throw → log `guild command`, interaction id, error; `replaceWithEphemeral(UNAVAILABLE)`.
- Icons: guild icon `${SITE_URL}/data/G2icon<guild_icon>.png` scaled 2x, falling back to `${SITE_URL}/etc/Guild.png` scaled 2x, then none. Crowns for `member_rank` 0 and 1: `${SITE_URL}/etc/GuildRank<n>.png` scaled to height 24. Every icon fetch: 5s timeout, failure = no icon.
- Numbers: `toLocaleString('en-US')` (8,412,330).
- Message (`guildMessage`): container accent `0x5DCAA5`.
  - With image: `{ type: 12, items: [{ media: { url: 'attachment://card.png' }, description: <alt> }] }`.
  - Text fallback: `## <escaped name>`, `-# Level <l> · <m> / <max> members`, `# #<rank>`, `-# <rank change>` (when not null), `**Total GP** <v> · **GP this week** <v>` + ` (<vs last week>)` when not null + ` · **Active** <n> of <m>`, then `### Top contributors this week` and one line per contributor `<i>. <escaped name> · <gp>` (or `No contributions yet this week`).
  - Then ActionRow: "Full history" → `siteUrl(env, '/guilds/detail?id=<encoded id>', 'guild', 'history')`; "All contributors" → `siteUrl(env, '/guilds/detail?id=<encoded id>', 'guild', 'contributors') + '#contributors'`.
  - Footer `-# idleontoolbox.com · <updatedAgo(capturedAt)>`, or `-# idleontoolbox.com` when null.
  - Alt text: `<name>, guild rank #<rank>, level <l>, <m> members. <total> total GP, <week> GP this week. Top contributors: <a>, <b>, <c>.` (max 1000 chars).

- [ ] **Step 1: Config and command**

`wrangler.toml` (namespace 2002: 2001 is PROFILE_LIMITER, the builds Worker uses 1001-1004):

```toml
[[ratelimits]]
name = "GUILD_LIMITER"
namespace_id = "2002"
simple = { limit = 3, period = 10 }
```

`src/types.ts` Env: `GUILD_LIMITER?: { limit(options: { key: string }): Promise<{ success: boolean }> };`

`src/commands.mjs`, after `profile`:

```js
  {
    name: 'guild',
    description: 'A guild\'s rank, weekly GP and top contributors',
    type: 1,
    ...everywhere,
    options: [{ type: 3, name: 'name', description: 'Guild name', required: true, autocomplete: true, max_length: 100 }]
  }
```

`test/commands.test.ts`: expected names become `['wiki', 'build', 'profile', 'guild']`.

- [ ] **Step 2: Write the failing tests**

`test/guild.test.ts` must cover (use `fetchMock` for the guild-history API, the site icons and Discord, as in `test/profile.test.ts`; call `resetGuildIndexCache()` in `beforeEach`; a 1x1 PNG constant like `profile.test.ts`'s `PIXEL` for icon replies):
1. `guildChoices(env, 'hang')` → `[{ name: 'Hangover Gang (#4)', value: 'b' }]` for an index with `Hangover_Gang` rank 4 id `b`; an upstream 500 → `[]`.
2. `guildMessage(..., { withImage: true })`: accent `0x5DCAA5`; first child type 12 with `attachment://card.png` and alt text containing `Hangover Gang` and `#4`; buttons "Full history" (exact URL `https://idleontoolbox.com/guilds/detail?id=b&utm_source=discord_bot&utm_medium=guild&utm_content=history`) and "All contributors" (exact URL `https://idleontoolbox.com/guilds/detail?id=b&utm_source=discord_bot&utm_medium=guild&utm_content=contributors#contributors`); last child starts with `-# idleontoolbox.com`.
3. Text fallback (`withImage: false`): contains `# #4`, `**Total GP**`, `### Top contributors this week` and the top contributor's name; no type 12; the name with `*` in it is escaped.
4. Endpoint: a `/guild` command with value `b` defers (`{ type: 5 }`), then a multipart PATCH reaches Discord (content-type starts with `multipart/form-data`); `assertNoPendingInterceptors` proves the index, detail, guild icon and crown fetches happened.
5. Endpoint: value `nowhere` with no match in the index → DELETE original + ephemeral POST with content `'nowhere' isn't in the top ~1,000 tracked guilds.` and a "Browse guilds" button URL `https://idleontoolbox.com/guilds?utm_source=discord_bot&utm_medium=guild&utm_content=not_found`.
6. Endpoint: index matches but detail 404 → same not-found reply.
7. Endpoint: detail 500 → ephemeral UNAVAILABLE follow-up.
8. Endpoint: with `{ ...env, GUILD_LIMITER: { limit: async () => ({ success: false }) } }` the command answers immediately with type 4, flags 64, content `Slow down, try again in a few seconds.`, and no fetch happens.
9. Autocomplete endpoint for `guild` returns choices from the index.
10. `guildCard(env, view)`: guild icon falls back to `etc/Guild.png` when `G2icon<n>.png` 404s; crowns only for `member_rank` 0 and 1.

- [ ] **Step 3: Run to verify they fail**

Run: `npx vitest run test/guild.test.ts test/commands.test.ts` → FAIL.

- [ ] **Step 4: Implement `src/guild.ts`**

```ts
import { guildCardTree, GUILD_CARD_HEIGHT, GUILD_CARD_WIDTH, type GuildCard } from './card/guild-card';
import { renderPng } from './card/render';
import { scaledIcon, type CardIcon } from './card/ui';
import { editOriginal, editOriginalWithFile, replaceWithEphemeral } from './discord';
import { fetchGuildDetail, fetchGuildIndex, type GuildDetail, type GuildRow } from './guild-data';
import {
  activeMembers, displayGuildName, formatVsLastWeek, guildLevel, maxMembers, rankChangeText, resolveGuildRow,
  searchGuilds, topContributors, updatedAgo, vsLastWeekPct, weeklyRankChange
} from './guild-stats';
import { quoteInput, UNAVAILABLE } from './replies';
import { ResponseType, type Component, type Env, type MessageBody } from './types';
import { actionRow, container, ephemeral, escapeMarkdown, linkButton, siteUrl, text, v2Message } from './v2';

const ACCENT = 0x5dcaa5;
const CARD_TTL = 1800;
const fmt = (n: number) => n.toLocaleString('en-US');

export interface GuildView { row: GuildRow; detail: GuildDetail; capturedAt: number | null }

export async function guildChoices(env: Env, q: string) {
  try {
    const index = await fetchGuildIndex(env, { timeoutMs: 2500 });
    return searchGuilds(index.guilds, q).map((g) => ({ name: `${displayGuildName(g.guild_name)} (#${fmt(g.rank)})`.slice(0, 100), value: g.guild_id }));
  } catch {
    return [];
  }
}

function figures(view: GuildView) {
  const { row, detail } = view;
  const level = guildLevel(row.total_gp);
  const change = weeklyRankChange(detail.rankHistory, row.rank);
  const pct = vsLastWeekPct(detail.thisWeek, detail.lastWeek, detail.gpThisWeek);
  return {
    name: displayGuildName(row.guild_name), level, max: maxMembers(level), change, pct,
    top: topContributors(detail.members), active: activeMembers(detail.members)
  };
}

function altText(view: GuildView): string {
  const f = figures(view);
  const top = f.top.map((m) => m.member_name).join(', ');
  return `${f.name}, guild rank #${fmt(view.row.rank)}, level ${f.level}, ${view.row.members_count} members. ${fmt(view.row.total_gp)} total GP, ${fmt(view.detail.gpThisWeek)} GP this week.${top ? ` Top contributors: ${top}.` : ''}`.slice(0, 1000);
}

export function guildMessage(env: Env, view: GuildView, options: { withImage: boolean }): MessageBody {
  const f = figures(view);
  const id = encodeURIComponent(view.row.guild_id);
  const buttons = [
    linkButton('Full history', siteUrl(env, `/guilds/detail?id=${id}`, 'guild', 'history')),
    linkButton('All contributors', `${siteUrl(env, `/guilds/detail?id=${id}`, 'guild', 'contributors')}#contributors`)
  ];
  const body: Component[] = options.withImage
    ? [{ type: 12, items: [{ media: { url: 'attachment://card.png' }, description: altText(view) }] }]
    : [text([
        `## ${escapeMarkdown(f.name)}`,
        `-# Level ${f.level} · ${view.row.members_count} / ${f.max} members`,
        `# #${fmt(view.row.rank)}`,
        ...(rankChangeText(f.change) ? [`-# ${rankChangeText(f.change)}`] : []),
        `**Total GP** ${fmt(view.row.total_gp)} · **GP this week** ${fmt(view.detail.gpThisWeek)}${f.pct != null ? ` (${formatVsLastWeek(f.pct)})` : ''} · **Active** ${f.active} of ${view.row.members_count}`,
        '### Top contributors this week',
        ...(f.top.length ? f.top.map((m, i) => `${i + 1}. ${escapeMarkdown(m.member_name)} · ${fmt(m.gp_earned)}`) : ['No contributions yet this week'])
      ].join('\n'))];
  const ago = updatedAgo(view.capturedAt);
  return v2Message([container(ACCENT, [...body, actionRow(buttons), text(ago ? `-# idleontoolbox.com · ${ago}` : '-# idleontoolbox.com')])]);
}

async function siteIcon(env: Env, path: string, opts: { scale?: number; height?: number }): Promise<CardIcon | null> {
  try {
    const res = await fetch(`${env.SITE_URL}${path}`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    return scaledIcon(new Uint8Array(await res.arrayBuffer()), opts);
  } catch {
    return null;
  }
}

export async function guildCard(env: Env, view: GuildView): Promise<GuildCard> {
  const f = figures(view);
  const icon = (view.row.guild_icon != null ? await siteIcon(env, `/data/G2icon${view.row.guild_icon}.png`, { scale: 2 }) : null)
    ?? await siteIcon(env, '/etc/Guild.png', { scale: 2 });
  const contributors = await Promise.all(f.top.map(async (m) => ({
    name: m.member_name,
    gp: fmt(m.gp_earned),
    crown: m.member_rank === 0 || m.member_rank === 1 ? await siteIcon(env, `/etc/GuildRank${m.member_rank}.png`, { height: 24 }) : null
  })));
  return {
    name: f.name, icon, level: f.level, members: view.row.members_count, maxMembers: f.max, rank: view.row.rank,
    rankChange: rankChangeText(f.change), rankChangeDirection: f.change == null ? null : f.change > 0 ? 'up' : f.change < 0 ? 'down' : 'same',
    totalGp: fmt(view.row.total_gp), gpThisWeek: fmt(view.detail.gpThisWeek),
    vsLastWeek: f.pct != null ? formatVsLastWeek(f.pct) : null, vsLastWeekUp: f.pct != null ? f.pct >= 0 : null,
    active: f.active, contributors
  };
}

async function cardPng(env: Env, view: GuildView): Promise<Uint8Array> {
  const key = new Request(`https://card.cache/guild/${encodeURIComponent(view.row.guild_id)}/${view.capturedAt ?? 'none'}`);
  const cached = await caches.default.match(key);
  if (cached) return new Uint8Array(await cached.arrayBuffer());
  const png = await renderPng(guildCardTree(await guildCard(env, view)), GUILD_CARD_WIDTH, GUILD_CARD_HEIGHT);
  // A cache write failure must not discard a good render.
  try {
    await caches.default.put(key, new Response(png, { headers: { 'content-type': 'image/png', 'cache-control': `max-age=${CARD_TTL}` } }));
  } catch (error) {
    console.error('guild card cache put', error);
  }
  return png;
}

async function resolveGuild(env: Env, value: string): Promise<GuildView | null> {
  const index = await fetchGuildIndex(env);
  const row = resolveGuildRow(index.guilds, value);
  if (!row) return null;
  const detail = await fetchGuildDetail(env, row.guild_id);
  return detail ? { row, detail, capturedAt: index.capturedAt } : null;
}

export async function handleGuild(env: Env, ctx: ExecutionContext, value: string, token: string, interactionId: string, userId: string): Promise<Response> {
  if (env.GUILD_LIMITER && userId) {
    const { success } = await env.GUILD_LIMITER.limit({ key: userId });
    if (!success) return Response.json({ type: ResponseType.Message, data: ephemeral('Slow down, try again in a few seconds.') });
  }

  ctx.waitUntil((async () => {
    try {
      const view = await resolveGuild(env, value);
      if (!view) {
        await replaceWithEphemeral(env, token, ephemeral(`'${quoteInput(value)}' isn't in the top ~1,000 tracked guilds.`,
          { label: 'Browse guilds', url: siteUrl(env, '/guilds', 'guild', 'not_found') }));
        return;
      }
      let edited: boolean;
      try {
        const png = await cardPng(env, view);
        edited = await editOriginalWithFile(env, token, guildMessage(env, view, { withImage: true }), { name: 'card.png', data: png });
      } catch (renderError) {
        console.error('guild card render', interactionId, renderError);
        edited = await editOriginal(env, token, guildMessage(env, view, { withImage: false }));
      }
      if (!edited) await replaceWithEphemeral(env, token, ephemeral(UNAVAILABLE));
    } catch (error) {
      console.error('guild command', interactionId, error);
      await replaceWithEphemeral(env, token, ephemeral(UNAVAILABLE));
    }
  })());
  return Response.json({ type: ResponseType.Deferred });
}
```

Adapt the exact signatures of `editOriginal`, `editOriginalWithFile`, `replaceWithEphemeral`, `ephemeral` to what `src/discord.ts` / `src/v2.ts` export today (`profile.ts` is the reference: same call shapes).

- [ ] **Step 5: Wire it**

`src/interactions.ts`: import `{ guildChoices, handleGuild } from './guild'`; in the autocomplete branch add `if (command === 'guild') return choices(await guildChoices(env, focusedValue(interaction)));`; in the command branch add `if (command === 'guild') return await handleGuild(env, ctx, optionValue(interaction, 'name'), interaction.token, interactionId, interaction.member?.user?.id ?? interaction.user?.id ?? '');` (same shape as the `profile` lines).

`src/card/dev.ts`: add

```ts
export async function devGuildCardResponse(env: Env, url: URL): Promise<Response> {
  const { fetchGuildIndex, fetchGuildDetail } = await import('../guild-data');
  const { resolveGuildRow } = await import('../guild-stats');
  const { guildCard } = await import('../guild');
  const { guildCardTree, GUILD_CARD_WIDTH, GUILD_CARD_HEIGHT } = await import('./guild-card');
  const index = await fetchGuildIndex(env);
  const row = resolveGuildRow(index.guilds, url.searchParams.get('id') ?? '');
  const detail = row ? await fetchGuildDetail(env, row.guild_id) : null;
  if (!row || !detail) return new Response('Guild not found', { status: 404 });
  const png = await renderPng(guildCardTree(await guildCard(env, { row, detail, capturedAt: index.capturedAt })), GUILD_CARD_WIDTH, GUILD_CARD_HEIGHT);
  return new Response(png, { headers: { 'content-type': 'image/png' } });
}
```

`src/index.ts`: next to the `/dev/card` route (same `DEV_ROUTES === '1'` and GET gate), route `/dev/guild-card` to `devGuildCardResponse`. Extend the existing negative test in `test/interactions.test.ts` (dev routes 404 without `DEV_ROUTES`) to cover `/dev/guild-card`.

- [ ] **Step 6: Run to verify**

Run: `npx vitest run` (all pass) and `npx tsc --noEmit` (clean).

- [ ] **Step 7: Visual check**

Run `npx wrangler dev --var DEV_ROUTES:1` (port free afterwards), open `http://localhost:8787/dev/guild-card?id=Hangover_Gang` and `?id=Idle`, save one PNG next to the task report, and compare against the approved mockup (`guild5-800x330.png` layout: icon, name, level line, rank + change, 3 boxes, contributor chips). Stop wrangler and confirm the port is free.

---

### Task 5: Deploy and verify end to end (manual, with the user)

1. Site: user commits and pushes `pages/guilds/detail.jsx` + the new test (GitHub Pages deploys). Check `https://idleontoolbox.com/guilds/detail?id=<id>#contributors` scrolls to "Top contributors this week".
2. Bot: user commits and pushes; the GitHub Action runs tests, deploys, and registers commands to the test server (now four: wiki, build, profile, guild). Check the run is green.
3. In the test server: `/guild` + type `hang` (suggestions), pick one (card), `/guild nowhere` (not-found reply), both buttons open the right page (the second lands on the contributors section).
4. Update the spec's `/guild` table: icon path `data/G2icon<n>.png` (fallback `etc/Guild.png`), crowns `etc/GuildRank<n>.png`, and "vs last week" ported from the detail page (not the index's `vs_last_wk_pct`).

## Self-Review Notes

- Spec coverage: autocomplete over the index with `"<name> (#<rank>)"` / `guild_id` (Task 4); card fields table: rank/total/members, level/max, weekly rank change from `rank_history`, GP this week vs last week, active members, top 3 with crowns for 0/1, icon with fallback (Tasks 2-4); buttons "Full history" and "All contributors" (Task 4); `#contributors` site prerequisite (Task 1); errors table rows for not found, upstream failure, render failure fallback, cooldown (Task 4); card cache keyed by refresh window, 30 min (Task 4).
- Deviation from the spec, on purpose: "vs last week" uses the detail page's same-point-of-week comparison instead of the index's `vs_last_wk_pct`, so the card matches the page its buttons open. Guild names show spaces instead of underscores.
- Type consistency: `GuildRow`, `GuildDetail`, `GuildMember`, `GuildIndex` (Task 2) are the only shapes Tasks 3-4 consume; `GuildCard` and `CardIcon` are defined in Task 3 and consumed in Task 4; `GuildView` is defined in Task 4.
