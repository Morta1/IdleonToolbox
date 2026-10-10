# Masterclass Leaderboard Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A new `masterclass` leaderboard tab grouping every masterclass board by class, plus four new boards (medallions, outposts, best outpost rate, best arcane map multi).

**Architecture:** Categories and sections are pure config in `it-cloudflare-leaderboards/src/consts.ts`; every run rebuilds `leaderboard_boards`, `board_tops`, `categories` and stats from `CATEGORIES` (`$out` / `replaceCollection` / `writeCategories` deletes stale categories), and `value_since` is keyed by metric only, so moving a board needs no data migration. Raw-save boards are Mongo expressions over `leaderboardData`; parser boards are computed on the site in `services/leaderboardInfo.js`, kept by `PARSED_DATA_KEYS` in `it-cloudflare-profiles`, and read as `$parsedData.<key>`. Two hard-coded tab lists (profiles `TAB_ORDER`, site `TABS`) must learn the new category.

**Tech Stack:** Cloudflare Workers (TS, vitest), MongoDB aggregation, Next.js site (vitest, `@parsers` alias).

**Spec:** Triage task 1558256914884726906 ("Make a whole new MC leaderboard tab") + the scoping in this session: one section per class, existing MC boards move (not duplicated), castle damage / Crop Scientist / Emperor-Prisma bubble deferred.

## Global Constraints

- Category key `masterclass`, tab label `Masterclass`.
- Sections, in this order: `Death Bringer`, `Wind Walker`, `Arcane Cultist`, `Royal Guardian`.
- New metric keys: `totalMedallions`, `totalOutposts`, `highestOutpostResourceRate`, `highestArcaneMapMulti`.
- `highestArcaneMapMulti` uses notation `multiplier` and stores the displayed factor `1 + value / 100` (same as the Tesseract Maps page).
- No em dashes, no apostrophes in UI copy or patch notes.
- No commits per task: per the fix-task skill, commits happen only when the user says "done" (one commit per repo).
- Never run the leaderboards worker's scheduled job locally: it `$out`s into production collections.

## Review Focus

- Account with no Royal Guardian (empty `royalGuardian.outposts`): `totalOutposts` 0 and `highestOutpostResourceRate` 0, never `-Infinity` (Task 3 test).
- Account with no tesseract data (`account.tesseract` missing): `highestArcaneMapMulti` 0, no throw; `getMaps` destructures `account?.tesseract` and would throw (Task 3 test).
- NaN / non-finite resource rates from the parser: treated as 0 (Task 3 test).
- Save with no `Compass` key or `Compass[3]` missing: `totalMedallions` 0, not a `$size` error (Task 1 test).
- Old links `?t=misc` / `?t=general` pointing at a moved board: the jump-to-board path resolves the board's new category from meta, so the board still opens (Task 4 test).

---

### Task 1: Leaderboards worker: masterclass category + raw medallions board

**Files:**
- Modify: `it-cloudflare-leaderboards/src/consts.ts` (CHARACTER_STATS ~L27, ACCOUNT_LIST ~L137-139, MISC_LIST ~L195-197, CATEGORIES ~L497, SECTIONS ~L573, NOTATION_OF ~L608)
- Modify: `it-cloudflare-leaderboards/src/leaderboard.ts` (account fields block ~L747-753, `createFromParsedData` ~L156)
- Test: `it-cloudflare-leaderboards/test/categories.test.ts`, new `it-cloudflare-leaderboards/test/masterclass.test.ts`

**Interfaces:**
- Produces: `CATEGORIES.masterclass: string[]`, `SECTIONS.masterclass`, metric keys from Global Constraints, `METRIC_META[highestArcaneMapMulti].notation === 'multiplier'`. Reads `$parsedData.totalOutposts|highestOutpostResourceRate|highestArcaneMapMulti` (written by Task 2/3).

- [ ] **Step 1: Write the failing test** `test/masterclass.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { CATEGORIES, METRIC_META, SECTIONS } from '../src/consts';

const MASTERCLASS_SECTIONS = {
	'Death Bringer': ['totalGrimoireUpgrades', 'totalBonesCollected'],
	'Wind Walker': ['totalCompassUpgrades', 'totalDustCollected', 'totalMedallions'],
	'Arcane Cultist': ['totalArcanistUpgrades', 'totalTachyonsCollected', 'highestArcaneMapMulti'],
	'Royal Guardian': ['totalRoyalArmoryUpgrades', 'totalRoyalResourceGrades', 'totalRoyalStatueLevels',
		'totalOutposts', 'highestOutpostResourceRate']
};

describe('masterclass category', () => {
	it('holds every masterclass board, one section per class', () => {
		expect(SECTIONS.masterclass).toEqual(MASTERCLASS_SECTIONS);
		expect(CATEGORIES.masterclass).toEqual(Object.values(MASTERCLASS_SECTIONS).flat());
	});

	it('moves boards rather than duplicating them', () => {
		const all = Object.values(CATEGORIES).flat();
		expect(new Set(all).size).toBe(all.length);
	});

	it('tags sections and the multiplier notation', () => {
		expect(METRIC_META.totalMedallions).toEqual({ label: 'Total Medallions', section: 'Wind Walker', notation: 'default' });
		expect(METRIC_META.highestArcaneMapMulti.notation).toBe('multiplier');
		expect(METRIC_META.totalRoyalStatueLevels.section).toBe('Royal Guardian');
	});
});
```

- [ ] **Step 2: Run it, expect FAIL** (`SECTIONS.masterclass` undefined)

Run: `cd it-cloudflare-leaderboards && npx vitest run test/masterclass.test.ts`

- [ ] **Step 3: Implement in `consts.ts`**

Add constants next to the other MC ones:

```ts
export const TOTAL_MEDALLIONS = 'totalMedallions';
export const TOTAL_OUTPOSTS = 'totalOutposts';
export const HIGHEST_OUTPOST_RESOURCE_RATE = 'highestOutpostResourceRate';
export const HIGHEST_ARCANE_MAP_MULTI = 'highestArcaneMapMulti';
```

Remove `TOTAL_ROYAL_ARMORY_UPGRADES`, `TOTAL_ROYAL_RESOURCE_GRADES`, `TOTAL_ROYAL_STATUE_LEVELS` from `ACCOUNT_LIST`, and `TOTAL_DUST_COLLECTED`, `TOTAL_BONES_COLLECTED`, `TOTAL_TACHYONS_COLLECTED` from `MISC_LIST`. Leave `ADDITIONAL_STATS` alone (it also feeds `createFromParsedData`), and drop the three upgrade totals from the character tab only:

```ts
const MASTERCLASS_UPGRADES = [TOTAL_GRIMOIRE_UPGRADES, TOTAL_COMPASS_UPGRADES, TOTAL_ARCANIST_UPGRADES];
export const CHARACTER_STATS = [
	...ALL_STATS,
	...ADDITIONAL_STATS.filter((stat) => !MASTERCLASS_UPGRADES.includes(stat))
];
```

Before `CATEGORIES`:

```ts
// One section per class; order here is the page order.
const MASTERCLASS_SECTIONS: Record<string, string[]> = {
	'Death Bringer': [TOTAL_GRIMOIRE_UPGRADES, TOTAL_BONES_COLLECTED],
	'Wind Walker': [TOTAL_COMPASS_UPGRADES, TOTAL_DUST_COLLECTED, TOTAL_MEDALLIONS],
	'Arcane Cultist': [TOTAL_ARCANIST_UPGRADES, TOTAL_TACHYONS_COLLECTED, HIGHEST_ARCANE_MAP_MULTI],
	'Royal Guardian': [TOTAL_ROYAL_ARMORY_UPGRADES, TOTAL_ROYAL_RESOURCE_GRADES, TOTAL_ROYAL_STATUE_LEVELS,
		TOTAL_OUTPOSTS, HIGHEST_OUTPOST_RESOURCE_RATE]
};
export const MASTERCLASS_LIST = Object.values(MASTERCLASS_SECTIONS).flat();
```

`CATEGORIES`: add `masterclass: MASTERCLASS_LIST,` after `misc`. `SECTIONS`: add `masterclass: MASTERCLASS_SECTIONS,`; delete the `'Masterclass Drops'` entry from `misc` and the three `totalRoyal*` keys from `general['Upgrades & Levels']`. `NOTATION_OF`: add `[HIGHEST_ARCANE_MAP_MULTI]: 'multiplier'`.

Check: `leaderboards` (`Object.values(CATEGORIES).flat()`) still lists every metric exactly once; grep `leaderboard.ts` for other uses of `ACCOUNT_LIST` / `MISC_LIST` that relied on the moved keys and switch them to `MASTERCLASS_LIST`.

- [ ] **Step 4: Implement the fields in `leaderboard.ts`**

Next to `[TOTAL_COMPASS_UPGRADES]` (~L748). `Compass[3]` is the acquired-medallions array (parser: `totalAcquiredMedallions: medallionsRaw?.length`):

```ts
		// Compass[3] = acquired medallions, one entry each (parser: totalAcquiredMedallions)
		[TOTAL_MEDALLIONS]: { $size: { $ifNull: [{ $arrayElemAt: ['$leaderboardData.Compass', 3] }, []] } },
```

If a live save shows `Compass[3]` stored as anything but an array (check in Step 6), wrap with `{ $cond: [{ $isArray: ... }, { $size: ... }, 0] }` instead.

Add `TOTAL_OUTPOSTS, HIGHEST_OUTPOST_RESOURCE_RATE, HIGHEST_ARCANE_MAP_MULTI` to the array in `createFromParsedData` (~L157). Import the four constants.

- [ ] **Step 5: Add a medallions expression test** to `test/masterclass.test.ts`. Find how existing tests read `leaderboardAddFields` (grep `test/` for `leaderboardAddFields`); if none do, assert the expression shape:

```ts
import { leaderboardAddFields } from '../src/leaderboard';

it('counts medallions from Compass[3], defaulting a missing array to empty', () => {
	expect(leaderboardAddFields.$addFields.totalMedallions).toEqual(
		{ $size: { $ifNull: [{ $arrayElemAt: ['$leaderboardData.Compass', 3] }, []] } });
	expect(leaderboardAddFields.$addFields.highestArcaneMapMulti).toEqual(
		{ $ifNull: [{ $toDouble: '$parsedData.highestArcaneMapMulti' }, 0] });
});
```

- [ ] **Step 6: Run the suite + a read-only live check**

Run: `cd it-cloudflare-leaderboards && npm test` → all PASS (fix any test that hard-codes general/misc/character membership of the moved keys).

Live (Mongo MCP `aggregate`, read only, NO `$out`/`$merge`) on the `profiles` collection: `[{ $match: { 'leaderboardData.Compass.3': { $exists: true } } }, { $limit: 5 }, { $project: { mainChar: 1, medallions: <the Step 4 expression> } }]`. Expect plausible counts (0 to ~100), no error. Compare one against that player's Compass page if a save is at hand.

---

### Task 2: Profiles worker: keep the new parsed values, add the tab

**Files:**
- Modify: `it-cloudflare-profiles/src/leaderboard-keys.ts` (`PARSED_DATA_KEYS` ~L75)
- Modify: `it-cloudflare-profiles/src/boards.ts:5` (`TAB_ORDER`)
- Test: the existing test for `extractParsedData` / `getMeta` under `it-cloudflare-profiles/test/` (grep `PARSED_DATA_KEYS|TAB_ORDER`)

**Interfaces:**
- Consumes: metric keys from Task 1.
- Produces: `parsedData.totalOutposts|highestOutpostResourceRate|highestArcaneMapMulti` stored on upload; meta lists `masterclass` after `misc`.

- [ ] **Step 1: Failing test** (add to the existing leaderboard-keys test, or create `test/leaderboard-keys.test.ts`):

```ts
import { describe, expect, it } from 'vitest';
import { extractParsedData } from '../src/leaderboard-keys';
import { TAB_ORDER } from '../src/boards';

describe('masterclass parsed keys', () => {
	it('keeps the masterclass parser values', () => {
		const parsed = { totalOutposts: 7, highestOutpostResourceRate: 12.5, highestArcaneMapMulti: 3.2, junk: 1 };
		expect(extractParsedData(parsed)).toEqual({ totalOutposts: 7, highestOutpostResourceRate: 12.5, highestArcaneMapMulti: 3.2 });
	});

	it('orders the masterclass tab after misc', () => {
		expect(TAB_ORDER).toEqual(['general', 'tasks', 'skills', 'character', 'misc', 'masterclass', 'caverns']);
	});
});
```

- [ ] **Step 2: Run, expect FAIL.** `cd it-cloudflare-profiles && npx vitest run`
- [ ] **Step 3: Implement**: append the three keys to `PARSED_DATA_KEYS`; `TAB_ORDER = ['general', 'tasks', 'skills', 'character', 'misc', 'masterclass', 'caverns']`. Grep the bot (`it-cloudflare-bot/src`) for a hard-coded category list and add `masterclass` there too if one exists.
- [ ] **Step 4: Run `npm test`, expect PASS.**

---

### Task 3: Site: compute the parser boards on upload

**Files:**
- Modify: `IdleonToolbox/services/leaderboardInfo.js`
- Test: new `IdleonToolbox/__test__/services/leaderboardInfo.test.js`

**Interfaces:**
- Consumes: `account.royalGuardian.outposts[]` (each has `resourceRate: number`, `parsers/class-specific/royalGuardian.ts:1342`), `getMaps(account, characters, character)` from `@parsers/class-specific/tesseract` (each map has `mapBonuses: { value: number }[]`, value is a percent; display factor is `1 + value / 100`).
- Produces: `expandLeaderboardInfo(...)` returns `totalOutposts`, `highestOutpostResourceRate`, `highestArcaneMapMulti` (numbers, 0 when absent).

- [ ] **Step 1: Failing test** for two pure exported helpers:

```js
import { describe, expect, it } from 'vitest';
import { highestArcaneMapMulti, outpostInfo } from '../../services/leaderboardInfo';

describe('outpostInfo', () => {
  it('counts outposts and takes the best rate', () => {
    expect(outpostInfo([{ resourceRate: 4 }, { resourceRate: 9.5 }, { resourceRate: NaN }]))
      .toEqual({ totalOutposts: 3, highestOutpostResourceRate: 9.5 });
  });
  it('is zero without a Royal Guardian', () => {
    expect(outpostInfo(undefined)).toEqual({ totalOutposts: 0, highestOutpostResourceRate: 0 });
    expect(outpostInfo([])).toEqual({ totalOutposts: 0, highestOutpostResourceRate: 0 });
  });
});

describe('highestArcaneMapMulti', () => {
  it('returns the best map bonus as a display factor', () => {
    const maps = [{ mapBonuses: [{ value: 50 }, { value: 120 }, { value: 0 }] }, { mapBonuses: [{ value: 80 }] }];
    expect(highestArcaneMapMulti([maps])).toBeCloseTo(2.2);
  });
  it('is zero with no maps', () => {
    expect(highestArcaneMapMulti([])).toBe(0);
    expect(highestArcaneMapMulti([[]])).toBe(0);
  });
});
```

- [ ] **Step 2: Run, expect FAIL.** `cd IdleonToolbox && npx vitest run __test__/services/leaderboardInfo.test.js`
  (The module imports parser graphs and website-data; if the import is too slow or fails in the node project, move the two helpers to a small `services/leaderboardMasterclass.js` with no parser imports and import them from there.)

- [ ] **Step 3: Implement** in `services/leaderboardInfo.js`:

```js
import { getMaps } from '@parsers/class-specific/tesseract';

export const outpostInfo = (outposts) => {
  const list = Array.isArray(outposts) ? outposts : [];
  const rates = list.map(({ resourceRate }) => withDefault(resourceRate));
  return { totalOutposts: list.length, highestOutpostResourceRate: rates.length ? Math.max(...rates) : 0 };
};

// One getMaps result per character: the bonus cap reads the active character's added talent levels.
export const highestArcaneMapMulti = (mapsPerCharacter) => {
  const values = mapsPerCharacter.flat().flatMap(({ mapBonuses }) => mapBonuses ?? []).map(({ value }) => withDefault(value));
  return values.length ? 1 + Math.max(...values) / 100 : 0;
};

const arcaneMaps = (account, characters) => {
  if (!account?.tesseract) return [];
  return characters.map((character) => getMaps(account, characters, character) ?? []);
};
```

In `expandLeaderboardInfo`, spread into the returned object:

```js
    ...outpostInfo(account?.royalGuardian?.outposts),
    highestArcaneMapMulti: highestArcaneMapMulti(arcaneMaps(account, characters)),
```

`withDefault` is a `const` declared at the bottom of the file; move it above the new helpers (TDZ).

- [ ] **Step 4: Run test, expect PASS.**
- [ ] **Step 5: Live check** in the Browser pane (dev server :3001, `?demo=true`): add a temporary `console.log` of the `expandLeaderboardInfo` result at its caller (`utility/helpers.js` or `pages/settings.jsx`), trigger it with the demo account, and compare the three values with the demo account's Royal Guardian page (outpost count, best rate) and Tesseract Maps page (best of the DR/EXP/AFK numbers). Remove the log.

---

### Task 4: Site: Masterclass tab + icons

**Files:**
- Modify: `IdleonToolbox/components/leaderboards/format.js:3` (`TABS`)
- Modify: `IdleonToolbox/utility/leaderboardIcons.js` (`METRIC_ICONS`)
- Test: `IdleonToolbox/__test__/components/leaderboards/format.test.js`, `CategoryTab.test.jsx`

**Interfaces:**
- Consumes: meta with category `masterclass` and the 4 sections (Task 1/2).

- [ ] **Step 1: Failing test** in `format.test.js`:

```js
import { TABS } from '../../../components/leaderboards/format';

it('has a Masterclass tab after Misc', () => {
  expect(TABS).toEqual(['Overview', 'General', 'Tasks', 'Skills', 'Character', 'Misc', 'Masterclass', 'Caverns']);
});
```

Plus a jump test: build the index from a meta fixture where `totalRoyalStatueLevels` sits in `masterclass` and assert `index.byKey.totalRoyalStatueLevels.category === 'masterclass'` (follow the fixture style already in `format.test.js`).

- [ ] **Step 2: Run, expect FAIL.** `npx vitest run __test__/components/leaderboards/format.test.js`
- [ ] **Step 3: Implement**: insert `'Masterclass'` after `'Misc'` in `TABS`. Add icons for the 4 new metrics in `METRIC_ICONS`, picked from sprites the class pages already use (grep `components/account/Misc/class-specific` for the medallion, outpost and `StatusArc` images; e.g. `highestArcaneMapMulti: 'data/StatusArc0'`). Check every path exists under `public/`.
- [ ] **Step 4: Run the leaderboards component tests**: `npx vitest run __test__/components/leaderboards` → PASS.

---

### Task 5: End-to-end verification and deploy order

- [ ] **Step 1:** Full suites: `npm test` in `it-cloudflare-leaderboards`, `it-cloudflare-profiles`; targeted vitest in `IdleonToolbox`.
- [ ] **Step 2:** Browser pane `/leaderboards?demo=true`: Overview still renders; the tab strip always shows every `TABS` entry (only Overview's `CategoryTiles` drop empty categories), so Masterclass appears at once. Screenshot.
- [ ] **Step 3:** Deploy order (user runs or approves each): profiles worker, then leaderboards worker (let one run finish), then the site right after. Reason: a site deployed first shows an empty Masterclass tab until the worker runs; a worker run before the site hides the moved boards from the old site until it deploys. The second window is the shorter one.
- [ ] **Step 4:** After the next leaderboards run: `/leaderboards?t=masterclass` shows 4 sections, 12 boards; parser boards fill as players re-upload. Screenshot for the final report.
- [ ] **Step 5:** Patch note proposal (ask first): "Leaderboards: new Masterclass tab with Death Bringer, Wind Walker, Arcane Cultist and Royal Guardian boards, plus new boards for medallions, outposts, best outpost rate and best arcane map multi"
