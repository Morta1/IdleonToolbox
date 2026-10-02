# Discord Bot Phase 2 (`/profile`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `/profile <name>` to the Idleon Toolbox Discord bot: name autocomplete, global rank, the player's 3 best metrics, rendered as a PNG card inside a Components V2 container, with link buttons back to the site.

**Architecture:** Four repos change. The leaderboard Worker computes each player's best 3 metrics and main class during its 30-minute run and stores them on the `composite` documents. The profiles Worker exposes a name-search endpoint and returns the stored fields in the existing global lookup. The site gains `?player=` on `/leaderboards` so the bot can deep-link. The bot defers, fetches the player, renders a card with Satori + resvg-wasm, and edits the deferred reply with the PNG attached.

**Tech Stack:** Cloudflare Workers (TypeScript, Wrangler 4), MongoDB driver 6, Vitest 3 (`@cloudflare/vitest-pool-workers` in the bot, plain Vitest in the two data Workers), `satori@0.32.0` (exact), `@resvg/resvg-wasm@2.6.2` (exact), `@fontsource/inter` (WOFF), Next.js 16 static export + Vitest/jsdom on the site.

**Spec:** `IdleonToolbox/docs/superpowers/specs/2026-10-01-discord-bot-design.md`

## Global Constraints

- Every link: `utm_source=discord_bot&utm_medium=profile&utm_content=<target>`; site origin `https://idleontoolbox.com`.
- Funnel rule: the reply shows identity, global rank and 3 best metrics only; never the full rank list.
- Replies are Components V2 (`flags: 32768`) with `allowed_mentions: { parse: [] }`; errors are ephemeral (`flags: 64`) one-liners; echoed user input goes through `quoteInput`.
- Profile accent `0xFAC775`. Card 800×300 rendered at 2x (1600 wide), background `#242429`, boxes `#2f3036`, best box border `#854F0B` on `#2e2819`, nothing smaller than 20px, about 8px outer padding, no footer inside the image.
- Best metrics: ranked by the tie-averaged percentile (composite's formula), zero values skipped, `FILTERED_PLAYERS` respected, at most one metric per group, ties broken by rank then metric key.
- Anonymous players (`Anon#` ids) are never searched, shown or accepted.
- Upstream calls: 5s timeout (2.5s for autocomplete, which must answer within Discord's 3s).
- `satori` pinned to exactly `0.32.0` (0.33+ compiles wasm at runtime, which Workers forbid). Use `satori/standalone` and import `.wasm` files as modules.
- Not public: commands are registered to the test server only. No global registration, no install link.
- No commit steps: the user commits. No em dashes in user-facing copy. Do not add a site patch note (the controller asks the user first).

## File Structure

Site (`C:\Dev\idleon\toolbox\IdleonToolbox`):

| File | Responsibility |
|---|---|
| `pages/leaderboards.jsx` (modify) | read `?player=`, run the existing search once when the tab data is loaded |
| `__test__/pages/leaderboards-player-param.test.jsx` (new) | jsdom test of the deep link |

Leaderboards Worker (`C:\Dev\idleon\toolbox\it-cloudflare-leaderboards`):

| File | Responsibility |
|---|---|
| `package.json`, `vitest.config.ts` (new) | add Vitest (Node environment) |
| `src/best-metrics.ts` (new) | pure `computeBestMetrics` |
| `src/consts.ts` (modify) | `metricGroup` |
| `src/player-metrics.ts` (modify) | project `mainClass` from `CharacterClass_0` |
| `src/composite.ts` (modify) | store `bestMetrics` and `mainClass`; case-insensitive `mainChar` index |
| `test/best-metrics.test.ts`, `test/metric-groups.test.ts` (new) | unit tests |

Profiles Worker (`C:\Dev\idleon\toolbox\it-cloudflare-profiles`):

| File | Responsibility |
|---|---|
| `package.json`, `vitest.config.ts` (new) | add Vitest |
| `src/players.ts` (new) | pure name-search filter and player summary shape |
| `src/worker.ts` (modify) | `GET /api/leaderboards/names`; `player` block in the global user lookup |
| `test/players.test.ts` (new) | unit tests |

Bot (`C:\Dev\idleon\toolbox\it-cloudflare-bot`):

| File | Responsibility |
|---|---|
| `src/profile-data.ts` (new) | profiles API client: `searchPlayers`, `fetchPlayer` |
| `src/format.ts` (new) | metric labels and value notation |
| `src/modules.d.ts` (new) | typings for `.wasm` and `.woff` imports |
| `src/card/render.ts` (new) | Satori + resvg init and `renderPng` |
| `src/card/profile-card.ts` (new) | pure card tree builder + PNG size helper |
| `src/profile.ts` (new) | `/profile` autocomplete, message builders, handler |
| `src/discord.ts` (modify) | `editOriginalWithFile` (multipart) |
| `src/types.ts`, `src/interactions.ts`, `src/index.ts`, `src/commands.mjs`, `wrangler.toml`, `package.json` (modify) | wiring |
| `test/format.test.ts`, `test/profile-data.test.ts`, `test/profile-card.test.ts`, `test/render.test.ts`, `test/profile.test.ts` (new); `test/commands.test.ts`, `test/discord.test.ts` (modify) | tests |

---

### Task 1: `?player=` on the leaderboards page (site)

**Files:**
- Modify: `IdleonToolbox/pages/leaderboards.jsx`
- Test: `IdleonToolbox/__test__/pages/leaderboards-player-param.test.jsx`

**Interfaces:**
- Produces: `/leaderboards?player=<mainChar>` (optionally with `&t=<tab>`) fills the search field and runs the existing search once, after that tab's data has loaded. The bot links to `/leaderboards?player=<mainChar>` (global tab).

Facts about the current file: `handleUserSearch` (line ~177) reads the `inputValue` state, closes over `leaderboards` and `selectedTab`, and only appends when the tab's data is already cached. The search button calls it as `onClick={handleUserSearch}` (line ~239), which passes the click event. `router.query` is `{}` until `router.isReady` (static export); never seed `useState` from it.

- [ ] **Step 1: Write the failing test**

```jsx
// __test__/pages/leaderboards-player-param.test.jsx
// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import darkTheme from '../../styles/theme/darkTheme';

const routerState = { isReady: true, query: {}, push: vi.fn(), replace: vi.fn(), asPath: '/leaderboards', pathname: '/leaderboards' };
vi.mock('next/router', () => ({ useRouter: () => routerState }));
vi.mock('next-seo', () => ({ NextSeo: () => null }));

const globalData = {
  totalUsers: 10,
  createdAt: 1_700_000_000_000,
  global: {
    public: { globalRanking: [{ mainChar: 'Top', rank: 1, globalRanking: 900 }] },
    anonymous: { globalRanking: [{ mainChar: 'Top', rank: 1, globalRanking: 900 }] }
  }
};
const fetchLeaderboard = vi.fn(async () => globalData);
const fetchUserLeaderboards = vi.fn(async () => ({ globalRanking: [{ mainChar: 'Tester', rank: 7, globalRanking: 300 }] }));
vi.mock('../../services/profiles', () => ({ fetchLeaderboard, fetchUserLeaderboards }));

const { AppContext } = await import('@components/common/context/AppProvider');
const Leaderboards = (await import('../../pages/leaderboards')).default;

const renderPage = () => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <ThemeProvider theme={darkTheme}>
      <AppContext.Provider value={{ state: {} }}>
        <Leaderboards/>
      </AppContext.Provider>
    </ThemeProvider>
  </QueryClientProvider>
);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  routerState.query = {};
});

describe('leaderboards ?player= deep link', () => {
  it('fills the search field and searches the player once on the global tab', async () => {
    routerState.query = { player: 'Tester' };
    const { container } = renderPage();
    await waitFor(() => expect(fetchUserLeaderboards).toHaveBeenCalledWith('global', 'Tester'));
    expect(fetchUserLeaderboards).toHaveBeenCalledTimes(1);
    expect(container.querySelector('input[type="text"]').value).toBe('Tester');
  });

  it('does not search without the parameter', async () => {
    renderPage();
    await waitFor(() => expect(fetchLeaderboard).toHaveBeenCalled());
    expect(fetchUserLeaderboards).not.toHaveBeenCalled();
  });
});
```

If the page's input is not `type="text"` or other components need more router fields, adjust the selector/mock minimally and note it in the report. Do not use the global `screen` export.

- [ ] **Step 2: Run to verify it fails**

Run (in `IdleonToolbox`): `npx vitest run __test__/pages/leaderboards-player-param.test.jsx`
Expected: the first test FAILS (`fetchUserLeaderboards` never called); the second passes.

- [ ] **Step 3: Implement**

1. Add `useRef` to the React import: `import React, { useContext, useEffect, useRef, useState } from 'react';`
2. Replace `const { t } = router.query;` with:

```jsx
  const { t, player } = router.query;
```

3. Directly after the `selectedTab` line, add:

```jsx
  // ?player= deep link (the Discord bot links here). Derived during render like the tab: the
  // query is empty until isReady on the static export.
  const queryPlayer = router.isReady && typeof player === 'string' && player.trim() ? player.trim() : null;
  const handledPlayer = useRef(null);
```

4. Change `handleUserSearch` to take an optional name, so the deep link can pass it before `inputValue` state lands:

```jsx
  const handleUserSearch = async (name = inputValue) => {
    if (!name) return;
    const searchValue = name.trim();
    if (!searchValue) return;
```

(the rest of the function body is unchanged; it already uses `searchValue` everywhere after these lines).

5. Change the button to `onClick={() => handleUserSearch()}` so the click event is not passed as the name.
6. After the existing logged-user `useEffect` (the one ending `}, [leaderboards, loggedLeaderboardName]);`), add:

```jsx
  // Run the deep-linked search once, after this tab's data is cached: handleUserSearch only
  // appends to data that is already there.
  useEffect(() => {
    if (!queryPlayer || handledPlayer.current === queryPlayer) return;
    if (!leaderboards?.[selectedTab.toLowerCase()]) return;
    handledPlayer.current = queryPlayer;
    setInputValue(queryPlayer);
    handleUserSearch(queryPlayer);
  }, [queryPlayer, leaderboards, selectedTab]);
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run __test__/pages/leaderboards-player-param.test.jsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Static export safety**

Run: `npx vitest run __test__/no-nossr.test.js __test__/page-seo.test.js` (both must still pass). The `e2e/hydration.spec.js` route list already covers `/leaderboards`; it runs in the final verification task, not here.

---

### Task 2: Best metrics and metric groups (leaderboards Worker)

**Files:**
- Create: `it-cloudflare-leaderboards/vitest.config.ts`, `src/best-metrics.ts`, `test/best-metrics.test.ts`, `test/metric-groups.test.ts`
- Modify: `it-cloudflare-leaderboards/package.json`, `src/consts.ts`

**Interfaces:**
- Produces:
  - `MetricPick { metric: string; value: number; rank: number; topPercent: number }`
  - `computeBestMetrics(players: PlayerRow[], metrics: string[], groupOf: (metric: string) => string, filtered?: Record<string, string[]>): Map<string, MetricPick[]>` where `PlayerRow = { mainChar: string; [metric: string]: unknown }`
  - `metricGroup(metric: string): string` exported from `src/consts.ts`

Rules: total players N = `players.length` (the composite's denominator). Per metric: drop players listed in `filtered[metric]`, sort by value desc then `mainChar`, walk tie groups; a tie group spanning sorted positions i..j (0-based) gets score = average of `(1 - k/N) * 100` for k in i..j (exactly composite.ts's formula), rank = i + 1, `topPercent = max(0.1, round1(rank / N * 100))`. Skip tie groups whose value is ≤ 0. Per player, keep the best 24 candidates ordered by score desc, rank asc, metric asc; then pick up to 3 with distinct `groupOf(metric)`.

- [ ] **Step 1: Add Vitest**

In `package.json` add `"test": "vitest run"` to `scripts` and `"vitest": "^3.0.0"` to `devDependencies`, then run `npm install`. Create:

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({ test: { include: ['test/**/*.test.ts'] } });
```

- [ ] **Step 2: Write the failing tests**

```ts
// test/best-metrics.test.ts
import { describe, expect, it } from 'vitest';
import { computeBestMetrics } from '../src/best-metrics';

const groupOf = (metric: string) => (metric.endsWith('SaltRank') ? 'salts' : metric);

describe('computeBestMetrics', () => {
  const players = [
    { mainChar: 'A', farming: 100, cooking: 5, redoxSaltRank: 9, purpleSaltRank: 9, mining: 0 },
    { mainChar: 'B', farming: 50, cooking: 50, redoxSaltRank: 9, purpleSaltRank: 1, mining: 0 },
    { mainChar: 'C', farming: 10, cooking: 40, redoxSaltRank: 9, purpleSaltRank: 1, mining: 0 },
    { mainChar: 'D', farming: 1, cooking: 1, redoxSaltRank: 1, purpleSaltRank: 1, mining: 0 }
  ];
  const metrics = ['farming', 'cooking', 'redoxSaltRank', 'purpleSaltRank', 'mining'];
  const best = computeBestMetrics(players, metrics, groupOf);

  it('ranks a sole leader above a shared capped value', () => {
    // A is alone at the top of farming (score 100) and of purpleSaltRank (score 100),
    // but redoxSaltRank is a three-way tie (score (100+75+50)/3 = 75).
    expect(best.get('A')!.map((p) => p.metric)).toEqual(['farming', 'purpleSaltRank', 'cooking']);
  });

  it('keeps only one metric per group', () => {
    const metricsOfA = best.get('A')!.map((p) => p.metric);
    expect(metricsOfA.filter((m) => m.endsWith('SaltRank'))).toHaveLength(1);
  });

  it('reports competition rank and top percent', () => {
    expect(best.get('B')!.find((p) => p.metric === 'cooking')).toEqual({ metric: 'cooking', value: 50, rank: 1, topPercent: 25 });
    expect(best.get('C')!.find((p) => p.metric === 'redoxSaltRank')).toEqual({ metric: 'redoxSaltRank', value: 9, rank: 1, topPercent: 25 });
  });

  it('skips zero values', () => {
    for (const picks of best.values()) expect(picks.some((p) => p.metric === 'mining')).toBe(false);
  });

  it('respects FILTERED_PLAYERS', () => {
    const filtered = computeBestMetrics(players, metrics, groupOf, { farming: ['A'] });
    expect(filtered.get('A')!.some((p) => p.metric === 'farming')).toBe(false);
    expect(filtered.get('B')!.find((p) => p.metric === 'farming')).toMatchObject({ rank: 1 });
  });

  it('returns fewer than 3 when a player has fewer non-zero metrics', () => {
    const sparse = computeBestMetrics([{ mainChar: 'Z', farming: 3 }, { mainChar: 'Y', farming: 0 }], ['farming', 'mining'], groupOf);
    expect(sparse.get('Z')).toEqual([{ metric: 'farming', value: 3, rank: 1, topPercent: 50 }]);
    expect(sparse.get('Y')).toBeUndefined();
  });
});
```

```ts
// test/metric-groups.test.ts
import { describe, expect, it } from 'vitest';
import { leaderboards, metricGroup } from '../src/consts';

describe('metricGroup', () => {
  it('groups the families that would crowd a card', () => {
    expect(metricGroup('redoxSaltRank')).toBe('saltRanks');
    expect(metricGroup('anionicSaltRank')).toBe('saltRanks');
    expect(metricGroup('choppingMinigame')).toBe('minigames');
    expect(metricGroup('w3Colo')).toBe('colosseum');
    expect(metricGroup('copperSample')).toBe('samples');
    expect(metricGroup('agility')).toBe('coreStats');
    expect(metricGroup('bestSushiCombo')).toBe('sushi');
    expect(metricGroup('bestJellyDps')).toBe('jelly');
    expect(metricGroup('highestMegaFish')).toBe('megaFishing');
  });

  it('leaves every other metric in a group of its own', () => {
    expect(metricGroup('farming')).toBe('farming');
    expect(metricGroup('level')).toBe('level');
  });

  it('only names metrics that exist', () => {
    const grouped = leaderboards.filter((metric) => metricGroup(metric) !== metric);
    expect(grouped.length).toBeGreaterThanOrEqual(5 + 9 + 7 + 6 + 4 + 4 + 3 + 3);
  });
});
```

- [ ] **Step 3: Run to verify they fail**

Run (in `it-cloudflare-leaderboards`): `npx vitest run`
Expected: FAIL, `../src/best-metrics` not found and `metricGroup` not exported.

- [ ] **Step 4: Implement**

```ts
// src/best-metrics.ts
// Each player's 3 strongest leaderboards, for the Discord bot's profile card. The score is the
// composite's tie-averaged percentile, so a capped metric thousands of players share (and all
// show as "#1") cannot outrank a genuine top-1% result.
export interface MetricPick {
	metric: string;
	value: number;
	rank: number;
	topPercent: number;
}

interface Candidate extends MetricPick {
	score: number;
}

type PlayerRow = { mainChar: string; [metric: string]: unknown };

const KEEP = 24;
const PICKS = 3;

const better = (a: Candidate, b: Candidate) => b.score - a.score || a.rank - b.rank || a.metric.localeCompare(b.metric);

function keep(map: Map<string, Candidate[]>, mainChar: string, candidate: Candidate) {
	const list = map.get(mainChar) ?? [];
	if (!map.has(mainChar)) map.set(mainChar, list);
	if (list.length === KEEP && better(candidate, list[KEEP - 1]) >= 0) return;
	const at = list.findIndex((existing) => better(candidate, existing) < 0);
	list.splice(at === -1 ? list.length : at, 0, candidate);
	if (list.length > KEEP) list.pop();
}

export function computeBestMetrics(
	players: PlayerRow[],
	metrics: string[],
	groupOf: (metric: string) => string,
	filtered: Record<string, string[]> = {}
): Map<string, MetricPick[]> {
	const total = players.length;
	const candidates = new Map<string, Candidate[]>();

	for (const metric of metrics) {
		const excluded = new Set(filtered[metric] ?? []);
		const sorted = players
			.filter((player) => !excluded.has(player.mainChar))
			.map((player) => ({ mainChar: player.mainChar, value: Number(player[metric]) || 0 }))
			.sort((a, b) => b.value - a.value || a.mainChar.localeCompare(b.mainChar));

		let i = 0;
		while (i < sorted.length) {
			let j = i;
			while (j + 1 < sorted.length && sorted[j + 1].value === sorted[i].value) j++;
			if (sorted[i].value > 0) {
				let sum = 0;
				for (let k = i; k <= j; k++) sum += (1 - k / total) * 100;
				const score = sum / (j - i + 1);
				const rank = i + 1;
				const topPercent = Math.max(0.1, Math.round((rank / total) * 1000) / 10);
				for (let k = i; k <= j; k++) {
					keep(candidates, sorted[k].mainChar, { metric, value: sorted[k].value, rank, topPercent, score });
				}
			}
			i = j + 1;
		}
	}

	const result = new Map<string, MetricPick[]>();
	for (const [mainChar, list] of candidates) {
		const picks: MetricPick[] = [];
		const groups = new Set<string>();
		for (const { score, ...pick } of list) {
			const group = groupOf(pick.metric);
			if (groups.has(group)) continue;
			groups.add(group);
			picks.push(pick);
			if (picks.length === PICKS) break;
		}
		result.set(mainChar, picks);
	}
	return result;
}
```

Append to `src/consts.ts` (after the `leaderboards` export, using the file's tab indentation):

```ts
// Metric families that would otherwise fill a profile card with near-duplicates (nine salt
// ranks, seven minigames). Everything not listed is a group of its own.
const METRIC_GROUPS: Record<string, string[]> = {
	samples: SAMPLES,
	coreStats: ['strength', 'agility', 'wisdom', 'luck'],
	sushi: ['totalSushiStationUpgrades', 'totalSushiKnowledgeLevels', 'totalSushiPerfectos', 'bestSushiCombo'],
	jelly: ['bestJellyDps', 'totalJellyCellLevels', 'totalJellyUpgrades'],
	megaFishing: ['highestMegafeather', 'highestMegaFish', 'highestMegaFlesh']
};

export const metricGroup = (metric: string): string => {
	for (const [group, keys] of Object.entries(METRIC_GROUPS)) {
		if (keys.includes(metric)) return group;
	}
	if (/SaltRank$/.test(metric)) return 'saltRanks';
	if (/Minigame$/.test(metric)) return 'minigames';
	if (/^w\dColo$/.test(metric)) return 'colosseum';
	return metric;
};
```

- [ ] **Step 5: Run to verify they pass**

Run: `npx vitest run` then `npx tsc --noEmit`
Expected: PASS; tsc clean. If the metric-groups count test fails, a key in `METRIC_GROUPS` is misspelled versus `consts.ts`; fix the key, not the test.

---

### Task 3: Store best metrics and main class on `composite` (leaderboards Worker)

**Files:**
- Modify: `it-cloudflare-leaderboards/src/player-metrics.ts`, `src/composite.ts`

**Interfaces:**
- Consumes: `computeBestMetrics`, `MetricPick`, `metricGroup` (Task 2); `FILTERED_PLAYERS`, `leaderboards` from `consts.ts`.
- Produces: each `composite` document gains `bestMetrics: MetricPick[]` and `mainClass: number | null` (the raw `CharacterClass_0`, which equals the site's class index and the `ClassIcons<n>.png` number). A case-insensitive index `mainChar_ci` on `composite.mainChar` (collation `{ locale: 'en', strength: 2 }`).

- [ ] **Step 1: Project the main class into `player_metrics`**

In `src/player-metrics.ts` change the projection's type and seed so the computed field fits:

```ts
const metricsProjection = leaderboards.reduce<Record<string, 0 | 1 | string>>((acc, metric) => {
	acc[metric] = 1;
	return acc;
}, { mainChar: 1, _id: 0, anonId: 1, profileAccess: 1, mainClass: '$leaderboardData.CharacterClass_0' });
```

- [ ] **Step 2: Wire into `computeCompositeScores`**

In `src/composite.ts`:
1. Imports become:

```ts
import { Db } from 'mongodb';
import { FILTERED_PLAYERS, leaderboards, metricGroup } from './consts';
import { computeBestMetrics, MetricPick } from './best-metrics';
```

2. `CompositeEntry` gains `bestMetrics: MetricPick[];` and `mainClass: number | null;`.
3. Right after the existing per-metric scoring loop (before `// Build ranked results`), add:

```ts
	// The Discord bot's profile card: each player's 3 strongest metrics and main class.
	const bestMetrics = computeBestMetrics(allPlayers, leaderboards, metricGroup, FILTERED_PLAYERS);
	const mainClass = new Map<string, number | null>();
	for (const player of allPlayers) {
		const value = Number(player.mainClass);
		mainClass.set(player.mainChar, Number.isFinite(value) ? value : null);
	}
```

4. In the `ranked` map, add to each entry: `bestMetrics: bestMetrics.get(mainChar) ?? [],` and `mainClass: mainClass.get(mainChar) ?? null,`.
5. After the `insertMany` block, add:

```ts
	// Name search (profiles Worker, /api/leaderboards/names) is a case-insensitive prefix range.
	// deleteMany keeps indexes, and createIndex is a no-op when it already exists.
	await compositeCollection.createIndex({ mainChar: 1 }, { name: 'mainChar_ci', collation: { locale: 'en', strength: 2 } });
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit` and `npx vitest run`
Expected: tsc clean, tests still pass. The Mongo pipeline itself is verified live in Task 8.

---

### Task 4: Name search and player summary (profiles Worker)

**Files:**
- Create: `it-cloudflare-profiles/vitest.config.ts`, `src/players.ts`, `test/players.test.ts`
- Modify: `it-cloudflare-profiles/package.json`, `src/worker.ts`

**Interfaces:**
- Consumes: `composite` documents with `bestMetrics`, `mainClass`, `createdAt` (Task 3).
- Produces:
  - `GET /api/leaderboards/names?q=<prefix>` → `{ players: [{ mainChar: string, rank: number }] }`, at most 25, sorted by rank, case-insensitive prefix, never `Anon#` ids; empty `q` returns the top 25. Header `Cache-Control: public, max-age=300`.
  - `GET /api/leaderboards?leaderboard=global&leaderboardUser=<mainChar>` keeps `globalRanking` and adds `player: { mainChar, rank, compositeScore, profileAccess, mainClass, bestMetrics, totalUsers, createdAt }` where `totalUsers` = number of `composite` documents.

- [ ] **Step 1: Add Vitest**

`package.json`: add `"test": "vitest run"` and devDependency `"vitest": "^3.0.0"`; `npm install`. Create `vitest.config.ts` exactly as in Task 2.

- [ ] **Step 2: Write the failing test**

```ts
// test/players.test.ts
import { describe, expect, it } from 'vitest';
import { NAME_COLLATION, nameSearchFilter, playerSummary } from '../src/players';

describe('nameSearchFilter', () => {
  it('builds a prefix range that excludes anonymous ids', () => {
    expect(nameSearchFilter(' Mor ')).toEqual({ mainChar: { $gte: 'Mor', $lt: 'Mor\uffff', $not: /^Anon#/ } });
  });

  it('matches everyone public for an empty query', () => {
    expect(nameSearchFilter('')).toEqual({ mainChar: { $not: /^Anon#/ } });
  });

  it('uses a case-insensitive collation', () => {
    expect(NAME_COLLATION).toEqual({ locale: 'en', strength: 2 });
  });
});

describe('playerSummary', () => {
  it('shapes the composite document', () => {
    const doc = { mainChar: 'Mor', rank: 12, compositeScore: 9001.5, profileAccess: 'public', mainClass: 14,
      bestMetrics: [{ metric: 'farming', value: 5, rank: 3, topPercent: 0.1 }], createdAt: 1700000000000 };
    expect(playerSummary(doc, 4000)).toEqual({ ...doc, totalUsers: 4000 });
  });

  it('defaults fields older documents lack', () => {
    expect(playerSummary({ mainChar: 'Old', rank: 2, compositeScore: 1, profileAccess: 'public' }, 10))
      .toMatchObject({ mainClass: null, bestMetrics: [], createdAt: null });
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run (in `it-cloudflare-profiles`): `npx vitest run`
Expected: FAIL, `../src/players` not found.

- [ ] **Step 4: Implement `src/players.ts`**

```ts
// Shapes used by the Discord bot's /profile command.
export const NAME_SEARCH_LIMIT = 25;
export const NAME_COLLATION = { locale: 'en', strength: 2 };

export function nameSearchFilter(q: string) {
	const prefix = q.trim();
	if (!prefix) return { mainChar: { $not: /^Anon#/ } };
	return { mainChar: { $gte: prefix, $lt: `${prefix}\uffff`, $not: /^Anon#/ } };
}

export function playerSummary(doc: Record<string, any>, totalUsers: number) {
	return {
		mainChar: doc.mainChar,
		rank: doc.rank,
		compositeScore: doc.compositeScore,
		profileAccess: doc.profileAccess,
		mainClass: typeof doc.mainClass === 'number' ? doc.mainClass : null,
		bestMetrics: Array.isArray(doc.bestMetrics) ? doc.bestMetrics : [],
		totalUsers,
		createdAt: doc.createdAt ?? null
	};
}
```

- [ ] **Step 5: Wire into `src/worker.ts`**

1. Import: `import { NAME_COLLATION, NAME_SEARCH_LIMIT, nameSearchFilter, playerSummary } from './players';`
2. Add `path !== '/api/leaderboards/names'` to the allowed-path check (the `if (path !== '/api/profiles' && ...)` line).
3. Inside the `GET` branch, before `if (path.includes('leaderboards'))`, add:

```ts
				if (path === '/api/leaderboards/names') {
					const q = (url.searchParams.get('q') || '').slice(0, 100);
					const players = await client.db(getDbName(env)).collection('composite')
						.find(nameSearchFilter(q), {
							projection: { _id: 0, mainChar: 1, rank: 1 },
							sort: { rank: 1 },
							limit: NAME_SEARCH_LIMIT,
							collation: NAME_COLLATION
						})
						.toArray();
					return utils.toJSON({ players }, 200, { ...corsHeaders, 'Cache-Control': 'public, max-age=300' });
				}
```

4. In the global `leaderboardUser` branch, replace the final `return utils.toJSON({ globalRanking: ... }, 200, corsHeaders);` with:

```ts
							const totalUsers = await compositeCollection.countDocuments({});
							return utils.toJSON({
								globalRanking: neighbors.map(e => ({
									mainChar: e.mainChar,
									rank: e.rank,
									globalRanking: e.compositeScore
								})),
								player: playerSummary(userRank, totalUsers)
							}, 200, corsHeaders);
```

Check how `utils.toJSON` merges its third argument into the response headers; if it does not pass extra headers through, add the `Cache-Control` header on the returned Response instead and note it.

- [ ] **Step 6: Verify**

Run: `npx vitest run` and, if the repo has a tsconfig, `npx tsc --noEmit` (report pre-existing errors separately from new ones).
Expected: PASS.

---

### Task 5: Profiles client and number formatting (bot)

**Files:**
- Create: `it-cloudflare-bot/src/profile-data.ts`, `src/format.ts`, `test/profile-data.test.ts`, `test/format.test.ts`
- Modify: `it-cloudflare-bot/src/types.ts`, `wrangler.toml`

**Interfaces:**
- Consumes: Task 4's endpoints.
- Produces:
  - `Env.PROFILES_API: string` (wrangler var)
  - `MetricPick`, `PlayerSummary` types; `searchPlayers(env, q): Promise<{ mainChar: string; rank: number }[]>` (never throws, `[]` on any failure, 2.5s timeout); `fetchPlayer(env, mainChar): Promise<PlayerSummary | null>` (null on 404, throws on other failures or a malformed body, 5s timeout)
  - `metricLabel(key): string`, `formatValue(key, value): string`, `formatRank(n): string` (`#1,284`), `formatTop(percent): string` (`top 4.2%`)

- [ ] **Step 1: Config**

Find the profiles base URL in `C:\Dev\idleon\toolbox\IdleonToolbox\.env.production` (`NEXT_PUBLIC_PROFILES_URL`, which already ends in `/api`). Add to `wrangler.toml` `[vars]`: `PROFILES_API = "<that value>"`. Add `PROFILES_API: string;` to `Env` in `src/types.ts`.

- [ ] **Step 2: Write the failing tests**

```ts
// test/format.test.ts
import { describe, expect, it } from 'vitest';
import { formatRank, formatTop, formatValue, metricLabel } from '../src/format';

describe('metricLabel', () => {
  it('title-cases camel keys like the site', () => {
    expect(metricLabel('totalCards')).toBe('Total Cards');
    expect(metricLabel('farming')).toBe('Farming');
  });
  it('fixes the keys that read badly', () => {
    expect(metricLabel('w3Colo')).toBe('W3 Colosseum');
    expect(metricLabel('choppin')).toBe('Choppin');
    expect(metricLabel('highestVillagerExp/hr')).toBe('Highest Villager Exp/hr');
  });
});

describe('formatValue', () => {
  it('matches the site notation', () => {
    expect(formatValue('farming', 999)).toBe('999');
    expect(formatValue('farming', 1234)).toBe('1.24K');
    expect(formatValue('farming', 9400)).toBe('9.4K');
    expect(formatValue('farming', 48200)).toBe('48.2K');
    expect(formatValue('farming', 482000)).toBe('482K');
    expect(formatValue('farming', 1_200_000)).toBe('1.2M');
    expect(formatValue('farming', 3.5e12)).toBe('3.5T');
  });
  it('shows drop rate as a multiplier', () => {
    expect(formatValue('dropRate', 4.567)).toBe('4.57x');
  });
});

describe('rank and percent', () => {
  it('formats both', () => {
    expect(formatRank(1284)).toBe('#1,284');
    expect(formatTop(4.2)).toBe('top 4.2%');
    expect(formatTop(0.1)).toBe('top 0.1%');
  });
});
```

```ts
// test/profile-data.test.ts
import { env, fetchMock } from 'cloudflare:test';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { fetchPlayer, searchPlayers } from '../src/profile-data';

const origin = new URL(env.PROFILES_API).origin;
const base = new URL(env.PROFILES_API).pathname.replace(/\/$/, '');

beforeAll(() => {
  fetchMock.activate();
  fetchMock.disableNetConnect();
});
afterEach(() => fetchMock.assertNoPendingInterceptors());

const player = { mainChar: 'Mor', rank: 12, compositeScore: 1, profileAccess: 'public', mainClass: 14,
  bestMetrics: [{ metric: 'farming', value: 5, rank: 3, topPercent: 0.1 }], totalUsers: 4000, createdAt: 1700000000000 };

describe('searchPlayers', () => {
  it('returns the players list', async () => {
    fetchMock.get(origin).intercept({ path: `${base}/leaderboards/names?q=mo` }).reply(200, { players: [{ mainChar: 'Mor', rank: 12 }] });
    expect(await searchPlayers(env, 'mo')).toEqual([{ mainChar: 'Mor', rank: 12 }]);
  });
  it('returns [] on failure', async () => {
    fetchMock.get(origin).intercept({ path: `${base}/leaderboards/names?q=x` }).reply(500, 'no');
    expect(await searchPlayers(env, 'x')).toEqual([]);
  });
});

describe('fetchPlayer', () => {
  it('returns the player block', async () => {
    fetchMock.get(origin).intercept({ path: `${base}/leaderboards?leaderboard=global&leaderboardUser=Mor` }).reply(200, { globalRanking: [], player });
    expect(await fetchPlayer(env, 'Mor')).toEqual(player);
  });
  it('returns null on 404', async () => {
    fetchMock.get(origin).intercept({ path: `${base}/leaderboards?leaderboard=global&leaderboardUser=Nope` }).reply(404, { error: "User doesn't exist" });
    expect(await fetchPlayer(env, 'Nope')).toBeNull();
  });
  it('throws on a body without a player block', async () => {
    fetchMock.get(origin).intercept({ path: `${base}/leaderboards?leaderboard=global&leaderboardUser=Old` }).reply(200, { globalRanking: [] });
    await expect(fetchPlayer(env, 'Old')).rejects.toThrow();
  });
});
```

- [ ] **Step 3: Run to verify they fail**

Run: `npx vitest run test/format.test.ts test/profile-data.test.ts`
Expected: FAIL, modules not found.

- [ ] **Step 4: Implement**

```ts
// src/format.ts
// Labels and numbers as the site's leaderboards show them (camelToTitleCase in polyfills.js and
// notateNumber in utility/helpers.js), so a value reads the same in Discord and on the page.
const LABEL_OVERRIDES: Record<string, string> = {
  choppin: 'Choppin',
  'highestConstructExp/hr': 'Highest Construct Exp/hr',
  'highestVillagerExp/hr': 'Highest Villager Exp/hr',
  'totalVillagerExp/hr': 'Total Villager Exp/hr'
};

export function metricLabel(key: string): string {
  if (LABEL_OVERRIDES[key]) return LABEL_OVERRIDES[key];
  const colo = key.match(/^w(\d)Colo$/);
  if (colo) return `W${colo[1]} Colosseum`;
  const spaced = key.replace(/([A-Z0-9"])/g, ' $1');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

const UNITS: [number, string][] = [[1e3, 'K'], [1e6, 'M'], [1e9, 'B'], [1e12, 'T'], [1e15, 'Q'], [1e18, 'QQ']];

function notate(value: number): string {
  if (value < 1e3) return String(Math.floor(value));
  for (const [unit, suffix] of UNITS) {
    if (value < unit * 10) return `${Math.ceil(value / (unit / 100)) / 100}${suffix}`;
    if (value < unit * 100) return `${Math.ceil(value / (unit / 10)) / 10}${suffix}`;
    if (value < unit * 1000) return `${Math.ceil(value / unit)}${suffix}`;
  }
  const exponent = Math.floor(Math.log10(value));
  return `${Math.floor((value / 10 ** exponent) * 100) / 100}E${exponent}`;
}

export function formatValue(key: string, value: number): string {
  if (key === 'dropRate') return `${Math.round(value * 100) / 100}x`;
  return notate(value);
}

export const formatRank = (rank: number) => `#${rank.toLocaleString('en-US')}`;
export const formatTop = (percent: number) => `top ${percent}%`;
```

```ts
// src/profile-data.ts
import type { Env } from './types';

export interface MetricPick { metric: string; value: number; rank: number; topPercent: number }
export interface PlayerSummary {
  mainChar: string;
  rank: number;
  compositeScore: number;
  profileAccess: string;
  mainClass: number | null;
  bestMetrics: MetricPick[];
  totalUsers: number;
  createdAt: number | null;
}

// Autocomplete must answer inside Discord's 3s window; a slow search returns no suggestions
// rather than an error.
export async function searchPlayers(env: Env, q: string): Promise<{ mainChar: string; rank: number }[]> {
  try {
    const res = await fetch(`${env.PROFILES_API}/leaderboards/names?q=${encodeURIComponent(q.slice(0, 100))}`, {
      signal: AbortSignal.timeout(2500),
      cf: { cacheTtl: 300, cacheEverything: true }
    } as RequestInit);
    if (!res.ok) return [];
    const body = await res.json() as { players?: unknown };
    if (!Array.isArray(body.players)) return [];
    return body.players
      .filter((p): p is { mainChar: string; rank: number } => typeof p?.mainChar === 'string' && typeof p?.rank === 'number')
      .slice(0, 25);
  } catch {
    return [];
  }
}

export async function fetchPlayer(env: Env, mainChar: string): Promise<PlayerSummary | null> {
  const res = await fetch(`${env.PROFILES_API}/leaderboards?leaderboard=global&leaderboardUser=${encodeURIComponent(mainChar)}`, {
    signal: AbortSignal.timeout(5000),
    cf: { cacheTtl: 600, cacheEverything: true }
  } as RequestInit);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`profiles api ${res.status}`);
  const body = await res.json() as { player?: Partial<PlayerSummary> };
  const player = body.player;
  if (!player || typeof player.mainChar !== 'string' || typeof player.rank !== 'number' || typeof player.totalUsers !== 'number') {
    throw new Error('profiles api: no player block');
  }
  return {
    mainChar: player.mainChar,
    rank: player.rank,
    compositeScore: Number(player.compositeScore) || 0,
    profileAccess: String(player.profileAccess ?? ''),
    mainClass: typeof player.mainClass === 'number' ? player.mainClass : null,
    bestMetrics: Array.isArray(player.bestMetrics) ? player.bestMetrics.filter((m) => typeof m?.metric === 'string' && typeof m?.value === 'number' && typeof m?.rank === 'number' && typeof m?.topPercent === 'number').slice(0, 3) : [],
    totalUsers: player.totalUsers,
    createdAt: typeof player.createdAt === 'number' ? player.createdAt : null
  };
}
```

- [ ] **Step 5: Run to verify they pass**

Run: `npx vitest run` and `npx tsc`
Expected: PASS, tsc clean.

---

### Task 6: Card renderer (bot)

**Files:**
- Create: `it-cloudflare-bot/src/modules.d.ts`, `src/card/render.ts`, `src/card/profile-card.ts`, `test/profile-card.test.ts`, `test/render.test.ts`
- Modify: `it-cloudflare-bot/package.json`, `wrangler.toml`, `src/index.ts`, `src/types.ts`

**Interfaces:**
- Produces:
  - `ProfileCard { name: string; className: string | null; icon: { dataUri: string; width: number; height: number } | null; rank: number; topPercent: number; metrics: { label: string; value: string; rank: number; topPercent: number }[] }`
  - `profileCardTree(card: ProfileCard): SatoriNode` (pure, no wasm)
  - `pngSize(bytes: Uint8Array): { width: number; height: number }`
  - `toDataUri(bytes: Uint8Array): string`
  - `CARD_WIDTH = 800`, `CARD_HEIGHT = 300`
  - `renderPng(tree, width, height): Promise<Uint8Array>` (1600-wide PNG)
  - dev-only route `GET /dev/card?name=<mainChar>` when `env.DEV_ROUTES === '1'` (Task 7 fills the data path; this task returns a fixed sample card)

- [ ] **Step 1: Dependencies and config**

```bash
npm i satori@0.32.0 @resvg/resvg-wasm@2.6.2 --save-exact
```

```bash
npm i @fontsource/inter
```

Confirm `node_modules/@fontsource/inter/files/inter-latin-400-normal.woff` and `inter-latin-700-normal.woff` exist (the `.woff`, not `.woff2`). Add to `wrangler.toml`:

```toml
# Fonts for the card renderer (Satori needs TTF/OTF/WOFF bytes as ArrayBuffer).
[[rules]]
type = "Data"
globs = ["**/*.woff"]
fallthrough = true
```

Add `DEV_ROUTES?: string;` to `Env`. `DEV_ROUTES=1` is set only in the local `.dev.vars` by the user, never in `wrangler.toml`.

```ts
// src/modules.d.ts
declare module '*.wasm' {
  const module: WebAssembly.Module;
  export default module;
}
declare module '*.woff' {
  const data: ArrayBuffer;
  export default data;
}
```

- [ ] **Step 2: Write the failing tests**

```ts
// test/profile-card.test.ts
import { describe, expect, it } from 'vitest';
import { CARD_HEIGHT, CARD_WIDTH, pngSize, profileCardTree, toDataUri, type ProfileCard } from '../src/card/profile-card';

const card: ProfileCard = {
  name: 'PlayerName',
  className: 'Death Bringer',
  icon: { dataUri: 'data:image/png;base64,AAAA', width: 76, height: 72 },
  rank: 1284,
  topPercent: 4.2,
  metrics: [
    { label: 'Farming', value: '1.2M', rank: 37, topPercent: 0.3 },
    { label: 'Sneaking', value: '48.2K', rank: 112, topPercent: 0.9 },
    { label: 'Cooking', value: '9.4K', rank: 205, topPercent: 1.6 }
  ]
};

const texts = (node: any): string[] => {
  if (node == null || typeof node === 'boolean') return [];
  if (typeof node === 'string' || typeof node === 'number') return [String(node)];
  if (Array.isArray(node)) return node.flatMap(texts);
  return texts(node.props?.children);
};
const fontSizes = (node: any): number[] => {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(fontSizes);
  const own = typeof node.props?.style?.fontSize === 'number' ? [node.props.style.fontSize] : [];
  return [...own, ...fontSizes(node.props?.children)];
};

describe('profileCardTree', () => {
  const tree = profileCardTree(card) as any;

  it('is the card size on the Discord container colour', () => {
    expect(CARD_WIDTH).toBe(800);
    expect(CARD_HEIGHT).toBe(300);
    expect(tree.props.style).toMatchObject({ width: 800, height: 300, backgroundColor: '#242429', display: 'flex' });
  });

  it('shows name, class, rank, top percent and the three metrics', () => {
    const all = texts(tree).join(' | ');
    for (const part of ['PlayerName', 'Death Bringer', '#1,284', 'top 4.2%', 'Best ranks', 'Farming', '1.2M', '#37', 'top 0.3%', 'Sneaking', 'Cooking'])
      expect(all).toContain(part);
  });

  it('never goes below 20px', () => {
    expect(Math.min(...fontSizes(tree))).toBeGreaterThanOrEqual(20);
  });

  it('handles a player with no icon, no class and fewer metrics', () => {
    const sparse = profileCardTree({ ...card, icon: null, className: null, metrics: card.metrics.slice(0, 1) }) as any;
    const all = texts(sparse).join(' | ');
    expect(all).toContain('Farming');
    expect(all).not.toContain('Sneaking');
  });
});

describe('png helpers', () => {
  it('reads the IHDR size and builds a data URI', () => {
    const png = new Uint8Array(24);
    png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    png.set([0, 0, 0, 38, 0, 0, 0, 36], 16);
    expect(pngSize(png)).toEqual({ width: 38, height: 36 });
    expect(toDataUri(new Uint8Array([1, 2, 3]))).toBe('data:image/png;base64,AQID');
  });
});
```

```ts
// test/render.test.ts
import { describe, expect, it } from 'vitest';
import { renderPng } from '../src/card/render';

describe('renderPng', () => {
  it('renders a real PNG inside workerd', async () => {
    const png = await renderPng({ type: 'div', props: { style: { width: 100, height: 50, display: 'flex', backgroundColor: '#242429', color: '#fff', fontSize: 20 }, children: 'Hi' } }, 100, 50);
    expect([...png.slice(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47]);
  }, 30_000);
});
```

- [ ] **Step 3: Run to verify they fail**

Run: `npx vitest run test/profile-card.test.ts test/render.test.ts`
Expected: FAIL, modules not found.

- [ ] **Step 4: Implement `src/card/profile-card.ts`**

```ts
// The /profile card as a Satori element tree. Pure: no wasm, no fetch, so it is unit-tested
// directly. Layout and colours follow the spec's card rules (800x300, nothing under 20px,
// background equal to Discord's container so the card blends in).
export const CARD_WIDTH = 800;
export const CARD_HEIGHT = 300;

export interface ProfileCard {
  name: string;
  className: string | null;
  icon: { dataUri: string; width: number; height: number } | null;
  rank: number;
  topPercent: number;
  metrics: { label: string; value: string; rank: number; topPercent: number }[];
}

export type SatoriNode = { type: string; props: Record<string, unknown> & { style?: Record<string, unknown>; children?: unknown } };

const el = (type: string, style: Record<string, unknown>, children?: unknown, extra: Record<string, unknown> = {}): SatoriNode =>
  ({ type, props: { style, children, ...extra } });

const C = { bg: '#242429', box: '#2f3036', boxBorder: '#3a3b42', text: '#f1efe8', muted: '#b4b2a9', gold: '#FAC775', teal: '#5DCAA5', bestBg: '#2e2819', bestBorder: '#854F0B' };
const rankText = (rank: number) => `#${rank.toLocaleString('en-US')}`;

export function profileCardTree(card: ProfileCard): SatoriNode {
  const iconBox = el('div', { width: 96, height: 96, borderRadius: 12, backgroundColor: C.box, border: `1px solid ${C.boxBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    card.icon ? el('img', {}, undefined, { src: card.icon.dataUri, width: card.icon.width, height: card.icon.height }) : undefined);

  const identity = el('div', { display: 'flex', alignItems: 'center', gap: 20 }, [
    iconBox,
    el('div', { display: 'flex', flexDirection: 'column' }, [
      el('div', { fontSize: 46, fontWeight: 700, color: C.text, lineHeight: 1.1 }, card.name),
      ...(card.className ? [el('div', { fontSize: 22, color: C.muted }, card.className)] : [])
    ])
  ]);

  const headline = el('div', { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }, [
    el('div', { fontSize: 60, fontWeight: 700, color: C.gold, lineHeight: 1 }, rankText(card.rank)),
    el('div', { fontSize: 24, fontWeight: 700, color: C.teal }, `top ${card.topPercent}%`)
  ]);

  const box = (metric: ProfileCard['metrics'][number], best: boolean) =>
    el('div', { display: 'flex', flexDirection: 'column', flex: 1, padding: '10px 16px', borderRadius: 10, backgroundColor: best ? C.bestBg : C.box, border: `2px solid ${best ? C.bestBorder : C.box}` }, [
      el('div', { fontSize: 20, color: C.muted }, metric.label),
      el('div', { fontSize: 32, fontWeight: 700, color: C.text, lineHeight: 1.2 }, metric.value),
      el('div', { display: 'flex', gap: 8, fontSize: 22, fontWeight: 700 }, [
        el('div', { color: best ? C.gold : '#D3D1C7' }, rankText(metric.rank)),
        el('div', { color: C.teal }, `top ${metric.topPercent}%`)
      ])
    ]);

  const best = card.metrics.length
    ? el('div', { display: 'flex', flexDirection: 'column', gap: 8 }, [
        el('div', { fontSize: 20, color: C.muted }, 'Best ranks'),
        el('div', { display: 'flex', gap: 14 }, card.metrics.map((metric, i) => box(metric, i === 0)))
      ])
    : el('div', { fontSize: 22, color: C.muted }, 'No ranked metrics yet');

  return el('div', {
    width: CARD_WIDTH, height: CARD_HEIGHT, backgroundColor: C.bg, display: 'flex', flexDirection: 'column',
    justifyContent: 'space-between', padding: '10px 8px', fontFamily: 'Inter', color: C.text
  }, [
    el('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, [identity, headline]),
    best
  ]);
}

export function pngSize(bytes: Uint8Array): { width: number; height: number } {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

export function toDataUri(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `data:image/png;base64,${btoa(binary)}`;
}
```

- [ ] **Step 5: Implement `src/card/render.ts`**

```ts
// Satori (element tree -> SVG) and resvg (SVG -> PNG). Workers may not compile wasm from bytes at
// runtime, so both wasm files are imported as modules (wrangler turns .wasm imports into
// WebAssembly.Module) and satori is pinned to 0.32.0, the last release without harfbuzzjs.
import satori, { init as initYoga } from 'satori/standalone';
import { initWasm, Resvg } from '@resvg/resvg-wasm';
import yogaWasm from 'satori/yoga.wasm';
import resvgWasm from '@resvg/resvg-wasm/index_bg.wasm';
import inter400 from '@fontsource/inter/files/inter-latin-400-normal.woff';
import inter700 from '@fontsource/inter/files/inter-latin-700-normal.woff';

const fonts = [
  { name: 'Inter', data: inter400, weight: 400 as const, style: 'normal' as const },
  { name: 'Inter', data: inter700, weight: 700 as const, style: 'normal' as const }
];

let ready: Promise<void> | undefined;
// initWasm throws when called twice, so both inits run once per isolate.
const init = () => (ready ??= (async () => {
  await initYoga(yogaWasm);
  await initWasm(resvgWasm);
})());

export async function renderPng(tree: unknown, width: number, height: number): Promise<Uint8Array> {
  await init();
  const svg = await satori(tree as Parameters<typeof satori>[0], { width, height, fonts });
  // Satori has no image-rendering support; resvg honours the SVG attribute, which keeps
  // upscaled game sprites crisp. Verified visually through /dev/card.
  const crisp = svg.replace(/<image /g, '<image image-rendering="optimizeSpeed" ');
  const resvg = new Resvg(crisp, { fitTo: { mode: 'width', value: width * 2 } });
  const image = resvg.render();
  const png = image.asPng();
  image.free();
  resvg.free();
  return png;
}
```

If `satori/standalone` or the `.wasm` imports do not resolve under `@cloudflare/vitest-pool-workers` 0.8 or Wrangler, switch to dynamic imports inside `init` (`const { default: yoga } = await import('satori/yoga.wasm')`), keep the public `renderPng` signature, and record what was needed. Do not upgrade satori.

- [ ] **Step 6: Dev preview route**

In `src/index.ts`, before the 404, add a dev-only route that renders the fixed sample card from the test (Task 7 replaces the sample with live data):

```ts
    if (env.DEV_ROUTES === '1' && request.method === 'GET' && url.pathname === '/dev/card') {
      const { devCardResponse } = await import('./card/dev');
      return devCardResponse(env, url);
    }
```

Create `src/card/dev.ts` exporting `devCardResponse(env: Env, url: URL): Promise<Response>` that renders `profileCardTree` with the sample `ProfileCard` from `test/profile-card.test.ts` (icon `null`) and returns `new Response(png, { headers: { 'content-type': 'image/png' } })`. Test in `test/profile-card.test.ts` is not needed for this file; add one endpoint test: `GET /dev/card` returns 404 when `DEV_ROUTES` is unset.

- [ ] **Step 7: Run to verify**

Run: `npx vitest run` and `npx tsc`, then `npx wrangler deploy --dry-run --outdir dist-check` and report the total gzip size it prints (must stay under 10 MB; expect about 3 MB). Delete `dist-check` afterwards.
Expected: all PASS.

---

### Task 7: `/profile` command (bot)

**Files:**
- Create: `it-cloudflare-bot/src/profile.ts`, `test/profile.test.ts`
- Modify: `it-cloudflare-bot/src/discord.ts`, `src/types.ts`, `src/interactions.ts`, `src/commands.mjs`, `src/card/dev.ts`, `wrangler.toml`, `test/commands.test.ts`, `test/discord.test.ts`

**Interfaces:**
- Consumes: Tasks 5 and 6; `editOriginal`, `replaceWithEphemeral` (phase 1); `data/classes.json` (`{ key, name, slug, index }`).
- Produces:
  - `editOriginalWithFile(env, token, body: MessageBody, file: { name: string; data: Uint8Array }): Promise<boolean>`
  - `profileChoices(env, q)`, `profileMessage(env, player, options: { withImage: boolean })`, `handleProfile(env, ctx, value, token, interactionId, userId)`
  - Interaction gains `member?: { user?: { id: string } }; user?: { id: string }`; `Env.PROFILE_LIMITER?: { limit(options: { key: string }): Promise<{ success: boolean }> }`

Behaviour:
- Autocomplete: choices `"<mainChar> (#<rank>)"`, value `mainChar`.
- Command: rate-limit by Discord user id (missing binding = allowed); limited → immediate ephemeral "Slow down, try again in a few seconds.". Otherwise defer (type 5) and in `ctx.waitUntil`:
  1. `fetchPlayer(value)`; if null, `searchPlayers(value)[0]` then `fetchPlayer` of that; still null → `replaceWithEphemeral` with `No public leaderboard profile named '<quoteInput(value)>'.` and a "Browse leaderboards" button (`/leaderboards`, `utm_content=not_found`).
  2. Card: class from `classes.json` by `index === mainClass` (name, `ClassIcons<index>.png`); icon bytes fetched from `${SITE_URL}/data/ClassIcons<index>.png` (failure = no icon), scaled 2x via `pngSize`. Metrics from `bestMetrics` through `metricLabel`/`formatValue`. Top percent of the global rank = `max(0.1, round1(rank / totalUsers * 100))`.
  3. Cache the PNG in `caches.default` under `https://card.cache/profile/<encoded mainChar>/<createdAt>` for 1800s; render on a miss.
  4. Rendered → `editOriginalWithFile` with the image message; render throws → `editOriginal` with the text fallback message; either edit returns false → `replaceWithEphemeral(UNAVAILABLE)`. Any throw → log `profile command`, interaction id, error; `replaceWithEphemeral(UNAVAILABLE)`.
- Message (`profileMessage`): gold container; with image: MediaGallery `{ type: 12, items: [{ media: { url: 'attachment://card.png' }, description: <alt> }] }`; text fallback: `## <name>` + `# #<rank>` + `-# global rank · top <x>%` + `### Best ranks` + one line per metric (`**<label>** · <value>\n-# #<rank> · top <x>%`). Then ActionRow: "All ranks" → `/leaderboards?player=<mainChar>` (`utm_content=all_ranks`); "Full profile" → `/account/misc/general?profile=<mainChar>` (`utm_content=profile`) only when `profileAccess === 'public'`. Footer `-# idleontoolbox.com · refreshed <n> min ago` (n = minutes since `createdAt`; footer `-# idleontoolbox.com` when null). Alt text: `<name>, <class>. Global rank <#>, top <x>%. Best ranks: <label> #<rank>, ...`.
- Label is "All ranks" (not "All 165 ranks"): the leaderboard count changes over time.

- [ ] **Step 1: Config**

`wrangler.toml` (namespace 2001: the builds Worker already uses 1001-1004 and counters are per namespace id):

```toml
[[ratelimits]]
name = "PROFILE_LIMITER"
namespace_id = "2001"
simple = { limit = 3, period = 10 }
```

Add the `Interaction` and `Env` fields above to `src/types.ts`. Add to `src/commands.mjs`:

```js
  {
    name: 'profile',
    description: 'A player\'s global rank and best leaderboards',
    type: 1,
    ...everywhere,
    options: [{ type: 3, name: 'name', description: 'Player (main character name)', required: true, autocomplete: true, max_length: 100 }]
  }
```

and update `test/commands.test.ts` so the expected names are `['wiki', 'build', 'profile']`.

- [ ] **Step 2: Multipart edit in `src/discord.ts`**

Change the private `call` helper to accept an optional `headers` argument (default `{ 'content-type': 'application/json' }`; pass `undefined` for multipart so `fetch` sets the boundary), keeping the never-throw and fixed-label logging behaviour. Add:

```ts
// Attachments ride on a multipart PATCH: payload_json carries the message and lists the file in
// `attachments`, files[0] carries the bytes, and the message references it as attachment://<name>.
export function editOriginalWithFile(env: Env, token: string, body: MessageBody, file: { name: string; data: Uint8Array }) {
  const form = new FormData();
  form.append('payload_json', JSON.stringify({ ...body, attachments: [{ id: 0, filename: file.name }] }));
  form.append('files[0]', new Blob([file.data], { type: 'image/png' }), file.name);
  return call('PATCH', 'edit original with file', `${API}/webhooks/${env.DISCORD_APPLICATION_ID}/${token}/messages/@original`, { body: form }, null);
}
```

(adapt the exact `call` parameter list to the refactor; `null` here means "no content-type header".) Add a test to `test/discord.test.ts`: the PATCH goes to `/api/v10/webhooks/app1/<token>/messages/@original`, its content-type starts with `multipart/form-data`, the body contains `payload_json` with `"attachments":[{"id":0,"filename":"card.png"}]`, and it resolves `true` on 200.

- [ ] **Step 3: Write the failing tests**

`test/profile.test.ts` must cover (use `fetchMock` for the profiles API, the site icon and Discord, as in `test/build.test.ts`; inject or spy nothing in `renderPng` except where stated):
1. `profileChoices` maps search results to `"Mor (#12)"` / `"Mor"`.
2. `profileMessage(..., { withImage: true })`: container accent `0xFAC775`, first child type 12 with `attachment://card.png` and alt text containing the name and rank, buttons "All ranks" (exact URL `https://idleontoolbox.com/leaderboards?player=Mor&utm_source=discord_bot&utm_medium=profile&utm_content=all_ranks`) and "Full profile" (`https://idleontoolbox.com/account/misc/general?profile=Mor&utm_source=discord_bot&utm_medium=profile&utm_content=profile`), footer starts with `-# idleontoolbox.com`.
3. Same with `profileAccess: 'private'`: no "Full profile" button.
4. Text fallback (`withImage: false`) contains `# #12`, `### Best ranks` and each metric label; no type 12.
5. Endpoint: a `/profile` command defers (`{ type: 5 }`), then a multipart PATCH reaches Discord (assert content-type multipart); `assertNoPendingInterceptors` proves the profiles and icon fetches happened.
6. Endpoint: profiles API 404 and an empty names search → DELETE original + ephemeral POST with content `No public leaderboard profile named 'Ghost'.` and the "Browse leaderboards" button.
7. Endpoint: profiles API 500 → ephemeral UNAVAILABLE follow-up.
8. Endpoint: with a `PROFILE_LIMITER` stub that returns `{ success: false }` (pass `{ ...env, PROFILE_LIMITER: { limit: async () => ({ success: false }) } }`), the command answers immediately with type 4, flags 64, content `Slow down, try again in a few seconds.`, and no fetch happens.
9. Autocomplete endpoint for `profile` returns choices from the names endpoint.

- [ ] **Step 4: Run to verify they fail**

Run: `npx vitest run test/profile.test.ts test/commands.test.ts test/discord.test.ts`
Expected: FAIL (module missing; commands list; new discord test).

- [ ] **Step 5: Implement `src/profile.ts`**

```ts
// src/profile.ts
import classList from '../data/classes.json';
import { profileCardTree, pngSize, toDataUri, CARD_HEIGHT, CARD_WIDTH, type ProfileCard } from './card/profile-card';
import { renderPng } from './card/render';
import { editOriginal, editOriginalWithFile, replaceWithEphemeral } from './discord';
import { formatRank, formatTop, formatValue, metricLabel } from './format';
import { fetchPlayer, searchPlayers, type PlayerSummary } from './profile-data';
import { quoteInput, UNAVAILABLE } from './replies';
import { ResponseType, type Component, type Env, type MessageBody } from './types';
import { actionRow, container, ephemeral, escapeMarkdown, linkButton, siteUrl, text, v2Message } from './v2';

const ACCENT = 0xfac775;
const CLASSES = classList as { key: string; name: string; slug: string; index: number }[];
const CARD_TTL = 1800;

export const topOf = (rank: number, total: number) => Math.max(0.1, Math.round((rank / Math.max(total, 1)) * 1000) / 10);
const className = (index: number | null) => CLASSES.find((cls) => cls.index === index) ?? null;

export async function profileChoices(env: Env, q: string) {
  const players = await searchPlayers(env, q);
  return players.map((p) => ({ name: `${p.mainChar} (#${p.rank.toLocaleString('en-US')})`.slice(0, 100), value: p.mainChar }));
}

function altText(player: PlayerSummary): string {
  const cls = className(player.mainClass);
  const best = player.bestMetrics.map((m) => `${metricLabel(m.metric)} #${m.rank}`).join(', ');
  return `${player.mainChar}${cls ? `, ${cls.name}` : ''}. Global rank ${formatRank(player.rank)}, ${formatTop(topOf(player.rank, player.totalUsers))}.${best ? ` Best ranks: ${best}.` : ''}`.slice(0, 1000);
}

function footer(player: PlayerSummary): Component {
  if (player.createdAt == null) return text('-# idleontoolbox.com');
  const minutes = Math.max(0, Math.round((Date.now() - player.createdAt) / 60000));
  return text(`-# idleontoolbox.com · refreshed ${minutes} min ago`);
}

export function profileMessage(env: Env, player: PlayerSummary, options: { withImage: boolean }): MessageBody {
  const name = encodeURIComponent(player.mainChar);
  const buttons = [linkButton('All ranks', siteUrl(env, `/leaderboards?player=${name}`, 'profile', 'all_ranks'))];
  if (player.profileAccess === 'public') buttons.push(linkButton('Full profile', siteUrl(env, `/account/misc/general?profile=${name}`, 'profile', 'profile')));

  const body: Component[] = options.withImage
    ? [{ type: 12, items: [{ media: { url: 'attachment://card.png' }, description: altText(player) }] }]
    : [text([
        `## ${escapeMarkdown(player.mainChar)}`,
        `# ${formatRank(player.rank)}`,
        `-# global rank · ${formatTop(topOf(player.rank, player.totalUsers))}`,
        ...(player.bestMetrics.length ? ['### Best ranks', ...player.bestMetrics.map((m) =>
          `**${metricLabel(m.metric)}** · ${formatValue(m.metric, m.value)}\n-# ${formatRank(m.rank)} · ${formatTop(m.topPercent)}`)] : [])
      ].join('\n'))];

  return v2Message([container(ACCENT, [...body, actionRow(buttons), footer(player)])]);
}

async function classIcon(env: Env, index: number) {
  try {
    const res = await fetch(`${env.SITE_URL}/data/ClassIcons${index}.png`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    const { width, height } = pngSize(bytes);
    return { dataUri: toDataUri(bytes), width: width * 2, height: height * 2 };
  } catch {
    return null;
  }
}

export async function profileCard(env: Env, player: PlayerSummary): Promise<ProfileCard> {
  const cls = className(player.mainClass);
  return {
    name: player.mainChar,
    className: cls?.name ?? null,
    icon: cls ? await classIcon(env, cls.index) : null,
    rank: player.rank,
    topPercent: topOf(player.rank, player.totalUsers),
    metrics: player.bestMetrics.map((m) => ({ label: metricLabel(m.metric), value: formatValue(m.metric, m.value), rank: m.rank, topPercent: m.topPercent }))
  };
}

async function cardPng(env: Env, player: PlayerSummary): Promise<Uint8Array> {
  const key = new Request(`https://card.cache/profile/${encodeURIComponent(player.mainChar)}/${player.createdAt ?? 'none'}`);
  const cached = await caches.default.match(key);
  if (cached) return new Uint8Array(await cached.arrayBuffer());
  const png = await renderPng(profileCardTree(await profileCard(env, player)), CARD_WIDTH, CARD_HEIGHT);
  await caches.default.put(key, new Response(png, { headers: { 'content-type': 'image/png', 'cache-control': `max-age=${CARD_TTL}` } }));
  return png;
}

async function resolvePlayer(env: Env, value: string): Promise<PlayerSummary | null> {
  const exact = await fetchPlayer(env, value);
  if (exact) return exact;
  const first = (await searchPlayers(env, value))[0];
  return first ? fetchPlayer(env, first.mainChar) : null;
}

export async function handleProfile(env: Env, ctx: ExecutionContext, value: string, token: string, interactionId: string, userId: string): Promise<Response> {
  if (env.PROFILE_LIMITER && userId) {
    const { success } = await env.PROFILE_LIMITER.limit({ key: userId });
    if (!success) return Response.json({ type: ResponseType.Message, data: ephemeral('Slow down, try again in a few seconds.') });
  }

  ctx.waitUntil((async () => {
    try {
      const player = await resolvePlayer(env, value);
      if (!player) {
        await replaceWithEphemeral(env, token, ephemeral(`No public leaderboard profile named '${quoteInput(value)}'.`,
          { label: 'Browse leaderboards', url: siteUrl(env, '/leaderboards', 'profile', 'not_found') }));
        return;
      }
      let edited: boolean;
      try {
        const png = await cardPng(env, player);
        edited = await editOriginalWithFile(env, token, profileMessage(env, player, { withImage: true }), { name: 'card.png', data: png });
      } catch (renderError) {
        console.error('profile card render', interactionId, renderError);
        edited = await editOriginal(env, token, profileMessage(env, player, { withImage: false }));
      }
      if (!edited) await replaceWithEphemeral(env, token, ephemeral(UNAVAILABLE));
    } catch (error) {
      console.error('profile command', interactionId, error);
      await replaceWithEphemeral(env, token, ephemeral(UNAVAILABLE));
    }
  })());
  return Response.json({ type: ResponseType.Deferred });
}
```

- [ ] **Step 6: Route it in `src/interactions.ts`**

Autocomplete: `if (command === 'profile') return choices(await profileChoices(env, focusedValue(interaction)));`
Command: `if (command === 'profile') return await handleProfile(env, ctx, optionValue(interaction, 'name'), interaction.token, interactionId, interaction.member?.user?.id ?? interaction.user?.id ?? '');`

- [ ] **Step 7: Live data on the dev route**

Change `src/card/dev.ts` so `GET /dev/card?name=<mainChar>` (dev only) does `fetchPlayer` → `profileCard` → `renderPng` and returns the PNG (404 text when the player is unknown). This is how the card is checked visually before Discord.

- [ ] **Step 8: Run to verify**

Run: `npx vitest run` and `npx tsc`
Expected: all PASS.

---

### Task 8: Deploy and verify end to end (manual, with the user)

No new code. Deploy order matters: data first, then the bot.

- [ ] **Step 1: Leaderboards Worker.** `npm run deploy` in `it-cloudflare-leaderboards`. Wait for the next 30-minute run, or trigger it: `curl -X POST -H "Authorization: Bearer <ADMIN_SECRET>" https://leaderboards.<subdomain>.workers.dev/run-aggregation` (the user runs this; the secret stays with them). Logs (`npx wrangler tail leaderboards`) must show `✓ compositeScores`.
- [ ] **Step 2: Profiles Worker.** `npm run deploy` in `it-cloudflare-profiles`. Check: `curl "<PROFILES_API>/leaderboards/names?q=a"` returns up to 25 `{ mainChar, rank }` with no `Anon#`; `curl "<PROFILES_API>/leaderboards?leaderboard=global&leaderboardUser=<a public name>"` has a `player` block with 3 `bestMetrics` and a numeric `mainClass`. Spot-check `mainClass` against that player's real main class (the `ClassIcons<mainClass>.png` icon must be their class).
- [ ] **Step 3: Site.** Deploy as usual; open `/leaderboards?player=<a public name>`: the field is filled and the player's row appears in Global. Run `npm run test:e2e` once (hydration gate covers `/leaderboards`).
- [ ] **Step 4: Bot, local card check.** Add `DEV_ROUTES=1` to `.dev.vars`, `npm run dev`, open `http://localhost:8787/dev/card?name=<a public name>`. Check the sprite is crisp (not blurry), text fits, nothing under 20px. If the sprite is blurry, report it: the `image-rendering` attribute did not take, and a pre-scaled sprite set is the fallback.
- [ ] **Step 5: Bot deploy.** `npm run deploy`, then `npm run register` (test server only). In the test server: `/profile` autocomplete shows names with ranks; picking one posts the card with "All ranks" (and "Full profile" for public profiles) and the footer; a made-up name gives the private "No public leaderboard profile" reply; five quick `/profile` calls hit the "Slow down" reply. Check one card on a phone.

---

## Self-Review Notes

- Spec coverage: best-3 by tie-averaged percentile with groups and FILTERED_PLAYERS (2-3), main class (3), name search excluding anonymous with a case-insensitive index (3-4), `player` block in the global lookup (4), `?player=` prerequisite (1), labels and values ported from the site (5), card rules and pinned Satori (6), deferred flow with ephemeral errors, render fallback to text and per-user cooldown (7), Cache API card cache (7), not public (8).
- Rulings in this plan, to confirm with the user: the button reads "All ranks" instead of "All 165 ranks" (count changes); the card sub-line shows the class only (the leaderboard data has no character count); `PROFILE_LIMITER` uses namespace 2001 to avoid sharing the builds Worker's counters; the profiles/names fetches use `cf.cacheTtl` instead of a hand-rolled API cache.
- Not in this phase: the leaderboards redesign's `?player=` report card (the deep link reuses today's search), application emojis (the card draws icons itself).
