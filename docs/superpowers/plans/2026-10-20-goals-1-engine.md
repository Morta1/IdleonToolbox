# Goals 1: Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The data side of goals: goal records and their storage blob, a descriptor registry with the first six systems, and `resolve` / `evaluate` that turn a goal plus the parsed account into a view row.

**Architecture:** Pure functions under `utility/goals/`, no React. Each system is one descriptor file in `utility/goals/registry/`; everything else only talks to descriptors. A contract test runs every descriptor against the parsed fixtures so a game update that breaks one fails CI.

**Tech Stack:** JavaScript (utilities stay `.js`), TypeScript for the parser helper, vitest.

**Spec:** `docs/superpowers/specs/2026-10-20-dashboard-goals-design.md`

Plans in this series: **1 engine** (this), 2 UI, 3 import/export + material tracker, 4 system rollout.

## Global Constraints

- Branch `feat/dashboard-goals`; one commit per task; never `--no-verify`; no Co-Authored-By trailer.
- Parsers are `.ts`; utilities `.js`; components `.jsx`. No `useMemo` / `useCallback` (React Compiler).
- Goal keys come from game indexes or a stable `rawName`, never an array position of a filtered / sorted list, never a display name.
- Max is computed live, never stored. Placeholder caps are uncapped: masterclass `x4 === 999999`, armory `maxLevel === 999`.
- Goal record `v: 1`; blob `{ schema: 1, accounts: { [accountKey]: Goal[] } }`; cap 200 goals per account.
- Tests: extend an existing test file when it already covers the function; no hard-coded catalog counts; parse fixtures once (`parseFixture` from `__test__/helpers/parsed-fixtures.js`).
- No em dashes in any user-facing string.

## Review Focus

1. A stored blob that is not ours (garbage, old shape, `null`) must load as empty and never throw. Test in Task 2.
2. Logged-out visitor (`parseEmpty()` account) must resolve every goal to `missing` / empty rows without throwing. Test in Task 4.
3. A `percentOfMax` goal on an entry without a percent (non-decay bubble) is `missing`; an "every bubble" percent goal counts only entries that have a percent. Test in Task 4.
4. `target: 'max'` on an entry whose cap is placeholder / null resolves to `missing`, not "reached". Test in Task 4.
5. A character goal whose character no longer exists resolves to `missing`. Test in Task 4 (character descriptors arrive in plan 4; the test uses a stub descriptor).

---

### Task 1: Bubble effect percent helpers

The `% of max` maths lives inline in `pages/account/world-2/bubbles.jsx:356-410`. Extract it so the page and goals share one copy.

**Files:**
- Modify: `parsers/world-2/alchemy.ts` (next to `getMaxBonus`, ~line 925)
- Modify: `pages/account/world-2/bubbles.jsx:356-410` (use the helpers; behaviour unchanged)
- Modify: `pages/account/world-2/bubbles.jsx:102` (delete dead `bubblesGoals` state and its reads; `goalLevel` becomes `level`)
- Test: `__test__/bubbles-adddecay-threshold.test.ts` (extend)

**Interfaces:**
- Produces: `getBubbleEffectPercent(account: Account, bubble, level?: number): number | null` (default `level = bubble.level`; `null` when the bubble has no max bonus, i.e. `getMaxBonus` is null; applies the prisma multiplier exactly as the page does)
- Produces: `getBubbleLevelForPercent(account: Account, bubble, percent: number): number | null` (smallest integer level whose percent is `>= percent`; uses `findAddDecayThresholdLevel` for `addDECAY`, `percent / (100 - percent) * x2` rounded up otherwise; `null` when no max bonus)

- [ ] **Step 1: Write the failing tests** (add a `describe('bubble effect percent')` block)

```ts
const bubbles = parseFixture(latest).account.alchemy.bubblesFlat;
const decay = bubbles.find((b) => b.func === 'decay');
const add = bubbles.find((b) => b.func === 'add');
it('decay bubble at level x2 is 50%', () => {
  expect(getBubbleEffectPercent(account, decay, decay.x2)).toBeCloseTo(50, 9);
});
it('bubbles without a max bonus have no percent', () => {
  expect(getBubbleEffectPercent(account, add)).toBeNull();
  expect(getBubbleLevelForPercent(account, add, 90)).toBeNull();
});
it.each([50, 90, 99])('level for %i%% reaches the percent and one level less does not', (p) => {
  const lv = getBubbleLevelForPercent(account, decay, p);
  expect(getBubbleEffectPercent(account, decay, lv)).toBeGreaterThanOrEqual(p);
  expect(getBubbleEffectPercent(account, decay, lv - 1)).toBeLessThan(p);
});
```
Add the same `it.each` for the first `addDECAY` bubble in the fixture.

- [ ] **Step 2: Run** `npx vitest run __test__/bubbles-adddecay-threshold.test.ts` → FAIL (functions not exported).
- [ ] **Step 3: Implement both helpers in `alchemy.ts`**, then replace the inline maths in `bubbles.jsx` with them and delete `bubblesGoals`.
- [ ] **Step 4: Run** the test file → PASS. Open `http://localhost:3001/account/world-2/bubbles?demo=true` (Browser pane): percentages and the efficiency threshold filter show the same values as on `main`.
- [ ] **Step 5: Commit** `git add parsers/world-2/alchemy.ts pages/account/world-2/bubbles.jsx __test__/bubbles-adddecay-threshold.test.ts` / `Bubbles: share effect percent helpers`

---

### Task 2: Goal records and the storage blob

**Files:**
- Create: `utility/goals/store.js`
- Test: `__test__/utility/goals-store.test.js`

**Interfaces:**
- Produces constants: `GOALS_SCHEMA = 1`, `MAX_GOALS = 200`, `GOALS_STORAGE_KEY = 'goals'`
- Produces: `accountKeyOf({ uid, characters, demo, profile }): string | null` — `null` when `profile` is true or there is no account; `'demo'` for demo; else `uid ?? characters[0].name`
- Produces: `normalizeBlob(raw): Blob` — anything not `{ schema: 1, accounts: object }` becomes `{ schema: 1, accounts: {} }`; goals failing `isGoal` are dropped
- Produces: `isGoal(x): boolean` (has `v`, `id`, `kind` in `'entry'|'all'`, `system`, `metric`, `op` in `'>='|'<='`, `target` number or `'max'`)
- Produces: `createGoal(fields): Goal` — fills `v: 1`, `id` (`crypto.randomUUID()`), `createdAt: Date.now()`, defaults `scope: 'account'`, `op: '>='`, `unit: 'value'`, `note: ''`
- Produces: `sameGoal(a, b): boolean` — equal on `system, scope, key, group, metric, op, target, unit`
- Produces: `goalsOf(blob, accountKey): Goal[]`
- Produces: `upsertGoal(blob, accountKey, goal): { blob, rejected: 'cap' | null }` — replaces by `id`, otherwise replaces a `sameGoal` entry, otherwise appends; refuses beyond `MAX_GOALS`
- Produces: `removeGoal(blob, accountKey, id): Blob`; `removeReached(blob, accountKey, reachedIds: string[]): Blob`
- All functions return new objects; inputs are never mutated.

- [ ] **Step 1: Write the failing tests**

```js
it.each([[null], ['x'], [{ schema: 2, accounts: {} }], [{ accounts: [] }]])('normalizeBlob(%j) is empty', (raw) => {
  expect(normalizeBlob(raw)).toEqual({ schema: 1, accounts: {} });
});
it('drops malformed goals but keeps valid ones', () => { /* one valid + one {foo:1} under 'A' -> only valid */ });
it.each([
  [{ profile: true, characters: [{ name: 'A' }] }, null],
  [{ characters: [] }, null],
  [{ demo: true, characters: [{ name: 'A' }] }, 'demo'],
  [{ uid: 'u1', characters: [{ name: 'A' }] }, 'u1'],
  [{ characters: [{ name: 'A' }] }, 'A'],
])('accountKeyOf(%j) = %s', (state, key) => expect(accountKeyOf(state)).toBe(key));
it('upsert replaces an identical goal instead of duplicating', () => { /* two createGoal with same fields -> length 1 */ });
it('upsert refuses the 201st goal', () => { /* 200 distinct keys then one more -> rejected 'cap', length 200 */ });
it('does not mutate its input', () => { /* Object.freeze deep blob, upsert/remove do not throw */ });
```

- [ ] **Step 2: Run** `npx vitest run __test__/utility/goals-store.test.js` → FAIL.
- [ ] **Step 3: Implement** `utility/goals/store.js`.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `Goals: goal records and storage blob`

---

### Task 3: Registry, caps and the first six descriptors

**Files:**
- Create: `utility/goals/caps.js`
- Create: `utility/goals/registry/index.js`
- Create: `utility/goals/registry/bubble.js`, `stamp.js`, `grimoire.js`, `compass.js`, `tesseract.js`, `armory.js`
- Test: `__test__/utility/goals-registry.test.js` (the contract test)

**Interfaces:**
- Produces: `realCap(n, sentinel?): number | null` — `null` when `n` is nullish, negative, or equals `sentinel`
- Produces: `MASTERCLASS_UNCAPPED = 999999`, `ARMORY_UNCAPPED = 999`
- Produces: `DESCRIPTORS: Descriptor[]`, `getDescriptor(system): Descriptor | undefined`, `descriptorsForRoute(pathname): Descriptor[]`
- Descriptor shape (spec "Descriptor"): `{ system, label, entryLabel, scope, route, groups?, list(ctx), key(row), name(row), icon(row), metrics }`; `ctx = { account, characters, character? }`; `icon` returns a path relative to `public/` without extension (e.g. `'data/aUpgradesO0'`)
- Metric shape: `{ label, value(row, ctx), max?(row, ctx), percentOfMax?(row, ctx), tiers?, boolean?, steps? }`

| system | route | list | key | metrics | groups |
|---|---|---|---|---|---|
| `bubble` | `/account/world-2/bubbles` | `account.alchemy.bubblesFlat` | `bubbleIndex` | `level` (no max, `percentOfMax` via `getBubbleEffectPercent`, `steps: [100, 1000]`) | Cauldron: `row.cauldron`, names Power / Quicc / High-IQ / Kazam |
| `stamp` | `/account/world-1/stamps` | `account.stamps.{combat,skills,misc}` flattened | `` `${category}:${rawName}` `` | `level` (max = `maxLevel`, the current cap), `steps: [10, 50]` | Category: combat / skills / misc |
| `grimoire` | `/account/class-specific/grimoire` | `account.grimoire.upgrades` | `String(index)` | `level` (max `realCap(x4, MASTERCLASS_UNCAPPED)`, `steps: [5, 10]`) | none |
| `compass` | `/account/class-specific/compass` | `account.compass.upgrades` minus `description === 'Titan_doesnt_exist'` | `String(index)` | same as grimoire | none |
| `tesseract` | `/account/class-specific/tesseract` | `account.tesseract.upgrades` | `String(index)` | same as grimoire | none |
| `armory` | `/account/class-specific/royal-armory` | `account.royalGuardian.armory.upgrades` | `String(index)` | `level` (max `realCap(maxLevel, ARMORY_UNCAPPED)`) | none |

Icons: bubble `data/${rawName}`; stamp `data/${rawName}`; grimoire `data/GrimoireUpg${index}`; compass `data/CompassUpg${baseIconIndex >= 0 ? baseIconIndex + 106 : index}`; tesseract `data/ArcaneUpg${index}`; armory `data/${costResourceRawName}`. Names: bubble `cleanUnderscore(bubbleName)`; stamp `displayName`; grimoire / compass / tesseract use `cleanUpgradeName` (move the existing local function from `components/account/Misc/class-specific/MasterclassUpgradeCard.jsx:7` to `utility/goals/registry/names.js`, export it, and import it back into the card; the Grimoire page's inline copy at `Grimoire/Upgrades.jsx:98` switches to it too); armory `cleanText(name)`.

Also modify: `components/account/Misc/class-specific/MasterclassUpgradeCard.jsx`, `components/account/Misc/class-specific/Grimoire/Upgrades.jsx` (import `cleanUpgradeName`; no visual change).

- [ ] **Step 1: Write the failing contract test**

```js
const fixtures = { latest, highend, fresh };
describe.each(DESCRIPTORS.map((d) => [d.system, d]))('%s descriptor', (system, d) => {
  it.each(Object.entries(fixtures))('%s: rows have unique non-empty keys and finite values', (_, fx) => {
    const { account, characters } = parseFixture(fx);
    const rows = d.list({ account, characters });
    const keys = rows.map(d.key);
    expect(keys.every((k) => typeof k === 'string' && k.length > 0)).toBe(true);
    expect(new Set(keys).size).toBe(keys.length);
    for (const [name, m] of Object.entries(d.metrics)) {
      for (const row of rows) {
        expect(Number.isFinite(m.value(row, { account, characters })), `${name} ${d.key(row)}`).toBe(true);
        const max = m.max?.(row, { account, characters }) ?? null;
        expect(max === null || Number.isFinite(max)).toBe(true);
      }
    }
  });
  it('every icon exists under public/', () => { /* fs.existsSync(`public/${d.icon(row)}.png`) for latest rows */ });
  it('route is a page', () => { /* fs.existsSync(`pages${d.route}.jsx`) || `pages${d.route}/index.jsx` */ });
  it('empty account lists without throwing', () => { expect(() => d.list(parseEmpty())).not.toThrow(); });
});
it('system ids are unique', () => { expect(new Set(DESCRIPTORS.map((d) => d.system)).size).toBe(DESCRIPTORS.length); });
it.each([[999999, 999999, null], [200, 999999, 200], [null, undefined, null], [-1, undefined, null]])('realCap(%j, %j) = %j', (n, s, out) => expect(realCap(n, s)).toBe(out));
```

- [ ] **Step 2: Run** `npx vitest run __test__/utility/goals-registry.test.js` → FAIL.
- [ ] **Step 3: Implement** `caps.js`, `names.js`, the six descriptors and `registry/index.js`. `descriptorsForRoute` matches `pathname` exactly.
- [ ] **Step 4: Run** → PASS on all fixtures.
- [ ] **Step 5: Commit** `Goals: registry with bubbles, stamps and masterclass upgrades`

---

### Task 4: Resolve and evaluate

**Files:**
- Create: `utility/goals/resolve.js`
- Test: `__test__/utility/goals-resolve.test.js`

**Interfaces:**
- Consumes: `getDescriptor`, `Goal` from Tasks 2-3
- Produces: `resolveGoal(goal, { account, characters }): View`
  - entry goal View: `{ id, kind: 'entry', system, label, name, icon, route, value, max, target, targetValue, unit, progress, status }`
  - all goal View: `{ id, kind: 'all', system, label, name, icon, route, target, unit, met, total, short: EntryView[], status }` where `name` reads e.g. `All bubbles` / `Power cauldron` (group name), `icon` is the first row's icon, `short` is the unmet rows sorted by progress ascending (first 5; `shortCount` = all unmet)
  - `status`: `'reached' | 'ok' | 'missing'`
- Produces: `resolveGoals(goals, ctx): View[]`, sorted: groups by `system` in registry order; inside a group `ok` before `reached` before `missing`, then `createdAt`
- Rules (spec "Resolution"):
  - `missing` when: unknown system; character scope and no character with that name; key not found; `unit: 'percentOfMax'` and the metric has no percent for the row; `target: 'max'` and the row's max is null.
  - `targetValue` = the live max when `target === 'max'`, else `target`.
  - `>=`: `progress = clamp(value / targetValue, 0, 1)`, reached at `value >= targetValue`. `<=`: reached while `value <= targetValue`, `progress` 1 when reached else `targetValue / value`.
  - Percent goals compare `percentOfMax(row)` to `target`.
  - All goals: rows where the comparison is impossible (no percent / no max) are excluded from `total`; `reached` when `met === total && total > 0`; `missing` when `total === 0`.
  - Never throws: any exception inside a descriptor call makes that goal `missing`.

- [ ] **Step 1: Write the failing tests** (fixture `latest`, real descriptors, plus one stub character descriptor registered through a test-only `withDescriptors(list, fn)` helper exported from `registry/index.js`)

```js
it('entry goal below target is ok with fractional progress', () => { /* bubble key k, target = level*2 -> status ok, progress 0.5 */ });
it('entry goal at target is reached', () => { /* target = level */ });
it("'max' follows the live cap", () => { /* grimoire row with real cap: targetValue === max */ });
it("'max' on a placeholder cap is missing", () => { /* grimoire row with x4 999999 */ });
it('percent goal on a bubble without a percent is missing', () => {});
it('every-bubble percent goal counts only bubbles with a percent', () => {
  // total === bubblesFlat.filter(b => getBubbleEffectPercent(account, b) !== null).length
});
it('group goal counts only that cauldron', () => {});
it('<= goal is reached while value stays at or below target', () => {});
it.each([['unknown system'], ['unknown key'], ['deleted character']])('%s is missing', () => {});
it('logged-out account resolves everything to missing without throwing', () => { /* parseEmpty() */ });
it('a throwing descriptor makes only that goal missing', () => {});
```

- [ ] **Step 2: Run** `npx vitest run __test__/utility/goals-resolve.test.js` → FAIL.
- [ ] **Step 3: Implement** `resolve.js`.
- [ ] **Step 4: Run** → PASS. Then the full suite `npm test` → PASS.
- [ ] **Step 5: Commit** `Goals: resolve goals against the parsed account`
