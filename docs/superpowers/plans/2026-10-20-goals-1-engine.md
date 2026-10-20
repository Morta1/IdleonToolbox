# Goals 1: Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The data side of goals: goal records and their storage blob, a descriptor registry with the first six systems, and `resolveGoal` / `resolveGoals` that turn a goal plus the parsed account into a view row.

**Architecture:** Pure functions under `utility/goals/`, no React. Each system is one descriptor file in `utility/goals/registry/`; everything else only talks to descriptors. A data-free `routes.js` lists which routes have goals so the NavBar never imports the registry. A contract test runs every descriptor against the parsed fixtures so a game update that breaks one fails CI.

**Tech Stack:** JavaScript (utilities stay `.js`), TypeScript for the parser helper, vitest.

**Spec:** `docs/superpowers/specs/2026-10-20-dashboard-goals-design.md`

Plans in this series: **1 engine** (this), 2 UI, 3 import/export + material tracker, 4 system rollout.

## Global Constraints

- Branch `feat/dashboard-goals`; one commit per task; never `--no-verify`; no Co-Authored-By trailer.
- Parsers are `.ts`; utilities `.js`; components `.jsx`. No `useMemo` / `useCallback` (React Compiler).
- Goal keys come from game indexes or a stable `rawName`, never an array position of a filtered / sorted list, never a display name.
- Max is computed live, never stored. `realCap` returns `null` (uncapped) for nullish, `<= 0`, and placeholder caps: masterclass `x4 >= 999999`, armory `maxLevel >= 999` (the page and parser treat `< 999` as capped, `Armory.jsx:69`, `royalGuardian.ts:918`).
- Goal record `v: 1`; blob `{ schema: 1, accounts: { [accountKey]: Goal[] } }`. Cap: 200 goals per account, item goals (plan 3) excluded from that count and capped separately at 2000.
- `utility/goals/store.js` and `utility/goals/routes.js` must not import parsers, `@website-data` or the registry (they are loaded on every page).
- Tests: extend an existing test file when it already covers the function; no hard-coded catalog counts; parse fixtures once (`parseFixture` / `parseEmpty` from `__test__/helpers/parsed-fixtures.js`).
- No em dashes in any user-facing string.

## Review Focus

1. A stored blob that is not ours (garbage, old shape, `null`) must load as empty and never throw. Test in Task 2.
2. Logged-out visitor (`parseEmpty()`): resolving any goal never throws and every status is one of `ok | reached | missing` (catalog systems are populated at level 0 when logged out). Test in Task 4.
3. A `percentOfMax` goal on an entry without a percent (non-decay bubble) is `missing`; an "every bubble" percent goal counts only entries that have a percent. Test in Task 4.
4. `target: 'max'` on an entry whose cap is placeholder, `0` or null resolves to `missing`, not "reached" (stamp `maxLevel` is 0 when the save has no value, `stamps.ts:41`). Test in Task 4.
5. A character goal whose character no longer exists resolves to `missing`. Test in Task 4 (stub character descriptor).

---

### Task 1: Bubble effect percent helpers

The `% of max` maths lives inline in `pages/account/world-2/bubbles.jsx:356-410`. Extract it so the page and goals share one copy.

**Files:**
- Modify: `parsers/world-2/alchemy.ts` (next to `getMaxBonus`, ~line 925)
- Modify: `pages/account/world-2/bubbles.jsx:356-410` (use the helpers; behaviour unchanged)
- Modify: `pages/account/world-2/bubbles.jsx` dead `bubblesGoals` state (`:102`, read at `:127` and `:358-360`; its setter is never called): delete the state, its reads, and the multi-level cost branch at `:127` that only it could enable; `goalLevel` becomes `level`
- Test: `__test__/bubbles-adddecay-threshold.test.ts` (extend)

**Interfaces:**
- Produces: `getBubbleEffectPercent(account: Account, bubble, level?: number): number | null` (default `level = bubble.level`; `null` when `getMaxBonus(func, x1)` is null; prisma multiplier applied exactly as the page does)
- Produces: `getBubbleLevelForPercent(account: Account, bubble, percent: number): number | null` (smallest integer level whose percent is `>= percent`; `addDECAY` uses `findAddDecayThresholdLevel` then `Math.ceil`, mapping `Infinity` to `null`; other decay funcs `Math.ceil(percent / (100 - percent) * x2)`; `null` when no max bonus)

- [ ] **Step 1: Write the failing tests** (add a `describe('bubble effect percent')` block)

```ts
const { account } = parseFixture(latest);
const bubbles = account.alchemy.bubblesFlat;
const decay = bubbles.find((b) => b.func === 'decay');
const uncapped = bubbles.find((b) => b.func === 'bigBase');
const addDecay = bubbles.find((b) => b.func === 'addDECAY');
it('decay bubble at level x2 is 50%', () => {
  expect(getBubbleEffectPercent(account, decay, decay.x2)).toBeCloseTo(50, 9);
});
it('bubbles without a max bonus have no percent', () => {
  expect(getBubbleEffectPercent(account, uncapped)).toBeNull();
  expect(getBubbleLevelForPercent(account, uncapped, 90)).toBeNull();
});
it.each([[decay], [addDecay]].flatMap(([b]) => [50, 90, 99].map((p) => [b.func, b, p])))(
  '%s: level for %i%% reaches the percent and one level less does not', (_, b, p) => {
    const lv = getBubbleLevelForPercent(account, b, p);
    expect(Number.isInteger(lv)).toBe(true);
    expect(getBubbleEffectPercent(account, b, lv)).toBeGreaterThanOrEqual(p);
    expect(getBubbleEffectPercent(account, b, lv - 1)).toBeLessThan(p);
  });
```

- [ ] **Step 2: Run** `npx vitest run __test__/bubbles-adddecay-threshold.test.ts` → FAIL (functions not exported).
- [ ] **Step 3: Implement both helpers in `alchemy.ts`**, then replace the inline maths in `bubbles.jsx` with them and delete `bubblesGoals`.
- [ ] **Step 4: Run** the test file → PASS. Browser pane `http://localhost:3001/account/world-2/bubbles?demo=true`: percentages and the efficiency threshold filter show the same values as on `main`.
- [ ] **Step 5: Commit** `git add parsers/world-2/alchemy.ts pages/account/world-2/bubbles.jsx __test__/bubbles-adddecay-threshold.test.ts` / `Bubbles: share effect percent helpers`

---

### Task 2: Goal records and the storage blob

**Files:**
- Create: `utility/goals/store.js` (data-free: no parser, `@website-data` or registry imports)
- Test: `__test__/utility/goals-store.test.js`

**Interfaces:**
- Produces constants: `GOALS_SCHEMA = 1`, `MAX_GOALS = 200`, `MAX_ITEM_GOALS = 2000`, `GOALS_STORAGE_KEY = 'goals'`
- Produces: `accountKeyOf({ uid, characters, demo, profile, emptyAccount }): string | null` — `null` when `profile` or `emptyAccount` is true or there are no characters; `'demo'` when `demo` and no `uid`; else `uid ?? characters[0].name`
- Produces: `normalizeBlob(raw): Blob` — anything not `{ schema: 1, accounts: object }` becomes `{ schema: 1, accounts: {} }`; goals failing `isGoal` are dropped
- Produces: `isGoal(x): boolean` — has `v`, `id`, `kind` in `'entry'|'all'`, `system`, `metric`, `op` in `'>='|'<='`, `target` a number or `'max'`; optional `watch`, `nearAlert` booleans
- Produces: `createGoal(fields): Goal` — fills `v: 1`, `id` (`crypto.randomUUID()`), `createdAt: Date.now()`, defaults `kind: 'entry'`, `scope: 'account'`, `op: '>='`, `unit: 'value'`, `note: ''`
- Produces: `sameGoal(a, b): boolean` — equal on `system, scope, key, group, metric, op, target, unit, watch`
- Produces: `goalsOf(blob, accountKey): Goal[]`
- Produces: `upsertGoal(blob, accountKey, goal): { blob, rejected: 'cap' | null }` — replaces by `id`, else replaces a `sameGoal` entry, else appends; refuses a new goal when its pool is full (`system === 'item'` → `MAX_ITEM_GOALS`, others → `MAX_GOALS`)
- Produces: `upsertGoals(blob, accountKey, goals): { blob, added, duplicates, overCap }` (batch form used by migration and import)
- Produces: `removeGoal(blob, accountKey, id): Blob`; `removeGoals(blob, accountKey, ids: string[]): Blob`
- All functions return new objects; inputs are never mutated.

- [ ] **Step 1: Write the failing tests**

```js
it.each([[null], ['x'], [{ schema: 2, accounts: {} }], [{ accounts: [] }]])('normalizeBlob(%j) is empty', (raw) => {
  expect(normalizeBlob(raw)).toEqual({ schema: 1, accounts: {} });
});
it('drops malformed goals but keeps valid ones', () => {});
it.each([
  [{ profile: true, characters: [{ name: 'A' }] }, null],
  [{ emptyAccount: true, characters: [{ name: 'A' }] }, null],
  [{ characters: [] }, null],
  [{ demo: true, characters: [{ name: 'A' }] }, 'demo'],
  [{ demo: true, uid: 'u1', characters: [{ name: 'A' }] }, 'u1'],
  [{ uid: 'u1', characters: [{ name: 'A' }] }, 'u1'],
  [{ characters: [{ name: 'A' }] }, 'A'],
])('accountKeyOf(%j) = %s', (state, key) => expect(accountKeyOf(state)).toBe(key));
it('upsert replaces an identical goal instead of duplicating', () => {});
it('a watch goal and a >= 0 goal on the same item are different goals', () => {});
it('upsert refuses the 201st non-item goal but still accepts item goals', () => {});
it('upsertGoals reports added, duplicates and overCap', () => {});
it('does not mutate its input', () => { /* deep-frozen blob */ });
```

- [ ] **Step 2: Run** `npx vitest run __test__/utility/goals-store.test.js` → FAIL.
- [ ] **Step 3: Implement** `utility/goals/store.js`.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `Goals: goal records and storage blob`

---

### Task 3: Registry, routes, caps and the first six descriptors

**Files:**
- Create: `utility/goals/caps.js`, `utility/goals/routes.js`, `utility/goals/registry/index.js`, `utility/goals/registry/names.js`
- Create: `utility/goals/registry/bubble.js`, `stamp.js`, `grimoire.js`, `compass.js`, `tesseract.js`, `armory.js`
- Modify: `components/account/Misc/class-specific/MasterclassUpgradeCard.jsx:7` (move `cleanUpgradeName` out, import it back); sweep the other copies of the same cleanup to the shared function: `components/account/Misc/class-specific/GenericUpgradeOptimizer.jsx:655,730`, `pages/account/class-specific/grimoire.jsx:65`, `components/account/Worlds/World7/Spelunking/UpgradeOptimizer.jsx:375,464`, `pages/account/misc/upgrade-vault.jsx:96` (verify each is the same rule before replacing; leave any that differs and say so in the commit)
- Test: `__test__/utility/goals-registry.test.js` (the contract test)

**Interfaces:**
- Produces: `realCap(n, placeholderAtLeast = Infinity): number | null` — `null` when `n` is nullish, `<= 0`, or `>= placeholderAtLeast`
- Produces: `MASTERCLASS_PLACEHOLDER = 999999`, `ARMORY_PLACEHOLDER = 999`
- Produces: `GOAL_ROUTES: Record<string, string>` in `routes.js` (system → route, plain strings, data-free) and `hasGoals(pathname): boolean`
- Produces: `DESCRIPTORS: Descriptor[]`, `getDescriptor(system)`, `descriptorsForRoute(pathname)`; test-only `withDescriptors(list, fn)`
- Produces: `cleanUpgradeName(name): string` in `names.js`
- Descriptor shape (spec "Descriptor"): `{ system, label, entryLabel, scope, route, groups?, list(ctx), key(row), name(row), icon(row), iconRows?(rows, ctx), metrics }`; `ctx = { account, characters, character? }` (`character` set only for `scope: 'character'`); `icon` returns a path under `public/` without extension
- Metric shape: `{ label, value(row, ctx), max?(row, ctx), percentOfMax?(row, ctx), tiers?: string[], boolean?: true, steps?: number[] }`

| system | route | list | key | metrics | groups |
|---|---|---|---|---|---|
| `bubble` | `/account/world-2/bubbles` | `account.alchemy.bubblesFlat` | `bubbleIndex` | `level` (no max, `percentOfMax` = `getBubbleEffectPercent`, `steps: [100, 1000]`) | Cauldron: `row.cauldron` → Power / Quicc / High-IQ / Kazam |
| `stamp` | `/account/world-1/stamps` | `account.stamps.{combat,skills,misc}` flattened with `category` | `` `${category}:${rawName}` `` | `level` (max `realCap(maxLevel)`, current cap; 0 → null), `steps: [10, 50]` | Category |
| `grimoire` | `/account/class-specific/grimoire` | `account.grimoire.upgrades` | `String(index)` | `level` (max `realCap(x4, MASTERCLASS_PLACEHOLDER)`, `steps: [5, 10]`) | none |
| `compass` | `/account/class-specific/compass` | `account.compass.upgrades` minus `description === 'Titan_doesnt_exist'` | `String(index)` | as grimoire | none |
| `tesseract` | `/account/class-specific/tesseract` | `account.tesseract.upgrades` | `String(index)` | as grimoire | none |
| `armory` | `/account/class-specific/royal-armory` | `account.royalGuardian.armory.upgrades` with `slot >= 0` | `String(index)` | `level` (max `realCap(maxLevel, ARMORY_PLACEHOLDER)`) | none |

Icons: bubble `data/${rawName}`; stamp `data/${rawName}`; grimoire `data/GrimoireUpg${index}`; compass `data/CompassUpg${baseIconIndex >= 0 ? baseIconIndex + 106 : index}`; tesseract `data/ArcaneUpg${index}`; armory `data/${costResourceRawName}`. Names: bubble `cleanUnderscore(bubbleName)`; stamp `displayName`; masterclass `cleanUpgradeName(name)`; armory `cleanText(name)`.

Note for maintainers: `grimoire.ts:81-85` sets `index` to the filtered position. It equals the game index today because the catalog has no placeholder rows; the contract test's key-stability check (below) guards it.

- [ ] **Step 1: Write the failing contract test**

```js
const fixtures = { latest, highend, fresh };
const contexts = (d, parsed) => d.scope === 'character'
  ? parsed.characters.map((character) => ({ ...parsed, character }))
  : [parsed];
describe.each(DESCRIPTORS.map((d) => [d.system, d]))('%s descriptor', (system, d) => {
  it.each(Object.entries(fixtures))('%s: unique non-empty keys, finite values, null-or-positive max', (_, fx) => {
    for (const ctx of contexts(d, parseFixture(fx))) {
      const rows = d.list(ctx);
      const keys = rows.map(d.key);
      expect(keys.every((k) => typeof k === 'string' && k.length > 0)).toBe(true);
      expect(new Set(keys).size).toBe(keys.length);
      for (const [name, m] of Object.entries(d.metrics)) for (const row of rows) {
        expect(Number.isFinite(m.value(row, ctx)), `${name} ${d.key(row)}`).toBe(true);
        const max = m.max?.(row, ctx) ?? null;
        expect(max === null || (Number.isFinite(max) && max > 0)).toBe(true);
      }
    }
  });
  it('the same entry has the same key in latest and highend', () => { /* first 5 rows of latest by name: key equal in highend */ });
  it('every icon exists under public/', () => { /* (d.iconRows ?? identity)(rows) from latest, fs.existsSync(`public/${d.icon(row)}.png`) */ });
  it('route is a page in PAGES and in GOAL_ROUTES', () => { /* route appears in the flattened PAGES routes of components/constants.jsx and GOAL_ROUTES[system] === route */ });
  it('empty account lists without throwing', () => { for (const ctx of contexts(d, parseEmpty())) expect(() => d.list(ctx)).not.toThrow(); });
});
it('system ids are unique and GOAL_ROUTES has exactly the registered systems', () => {});
it.each([[999999, 999999, null], [200, 999999, 200], [998, 999, 998], [999, 999, null], [null, undefined, null], [-1, undefined, null], [0, undefined, null]])(
  'realCap(%j, %j) = %j', (n, p, out) => expect(realCap(n, p)).toBe(out));
```

- [ ] **Step 2: Run** `npx vitest run __test__/utility/goals-registry.test.js` → FAIL.
- [ ] **Step 3: Implement** `caps.js`, `routes.js`, `names.js` (+ the sweep), the six descriptors and `registry/index.js`.
- [ ] **Step 4: Run** → PASS on all fixtures; `npm test` → PASS (the sweep touches rendering code).
- [ ] **Step 5: Commit** `Goals: registry with bubbles, stamps and masterclass upgrades`

---

### Task 4: Resolve

**Files:**
- Create: `utility/goals/resolve.js`
- Test: `__test__/utility/goals-resolve.test.js`

**Interfaces:**
- Consumes: `getDescriptor`, `withDescriptors`, `Goal` (Tasks 2-3)
- Produces: `resolveGoal(goal, { account, characters }): View`
  - common fields: `{ id, kind, system, label, scope, metric, op, unit, target, name, icon, route, status }`
  - entry View adds `{ key, value, max, targetValue, progress, tierName? }`
  - all View adds `{ group, met, total, short: EntryView[] (every unmet row, closest first: highest progress first, ties by name), shortCount }`; `name` reads `All bubbles` or the group name (`Power cauldron`); `icon` is the first row's icon. The UI slices `short` (5 collapsed, 50 per page expanded); resolve never truncates.
  - `status`: `'reached' | 'ok' | 'missing'`
- Produces: `resolveGoals(goals, ctx): View[]` — ordered by registry order of `system`; within a system: account scope first, then characters by name; then `ok`, `reached`, `missing`; then `createdAt`
- Rules (spec "Resolution"):
  - `missing` when: unknown system; character scope and no character with that name; key not found; `unit: 'percentOfMax'` and the row has no percent; `target: 'max'` and the row's max is null.
  - `targetValue` = live max when `target === 'max'`, else `target`.
  - `>=`: `progress = clamp(value / targetValue, 0, 1)` (targetValue 0 → progress 1), reached at `value >= targetValue`. `<=`: reached while `value <= targetValue`; `progress` 1 when reached else `targetValue / value`.
  - Boolean metrics: value 0 / 1, the goal is `>= 1`. Tier metrics: `target` is a tier index; `tierName = tiers[target]`.
  - Percent goals compare `percentOfMax(row)` with `target`.
  - All goals: rows where the comparison is impossible (no percent / no max) are excluded from `total`; `reached` when `met === total && total > 0`; `missing` when `total === 0`.
  - `watch` goals (plan 3) are never reached: `status: 'ok'`, `progress: null`.
  - Never throws: an exception inside a descriptor call makes that goal `missing`.

- [ ] **Step 1: Write the failing tests** (fixture `latest`, real descriptors, plus a stub character descriptor and a stub tier / boolean descriptor through `withDescriptors`)

```js
it('entry goal below target is ok with fractional progress', () => {});
it('entry goal at target is reached', () => {});
it("'max' follows the live cap", () => {});
it.each([['grimoire placeholder cap'], ['stamp with maxLevel 0']])("'max' on %s is missing", () => {});
it('percent goal on a bubble without a percent is missing', () => {});
it('every-bubble percent goal counts only bubbles with a percent', () => {
  // total === bubblesFlat.filter((b) => getBubbleEffectPercent(account, b) !== null).length
});
it('group goal counts only that cauldron', () => {});
it('all goal lists every unmet row, closest first', () => { /* short.length === shortCount === total - met; progress non-increasing */ });
it('<= goal is reached while value stays at or below target', () => {});
it('boolean goal is reached at 1, tier goal reports tierName', () => {});
it('watch goal is ok with null progress even at 0', () => {});
it.each([['unknown system'], ['unknown key'], ['deleted character']])('%s is missing', () => {});
it('logged-out account: no throw and every status is ok, reached or missing', () => { /* parseEmpty() */ });
it('a throwing descriptor makes only that goal missing', () => {});
it('resolveGoals orders by registry, scope, status, createdAt', () => {});
```

- [ ] **Step 2: Run** `npx vitest run __test__/utility/goals-resolve.test.js` → FAIL.
- [ ] **Step 3: Implement** `resolve.js`.
- [ ] **Step 4: Run** → PASS; `npm test` → PASS.
- [ ] **Step 5: Commit** `Goals: resolve goals against the parsed account`
