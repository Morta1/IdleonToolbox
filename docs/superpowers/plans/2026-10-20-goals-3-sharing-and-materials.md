# Goals 3: Import / Export and Material Tracker Merge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Item goals replace the material tracker (one-time migration, dashboard alert kept), and goal lists can be exported to and imported from a JSON file.

**Architecture:** Items become one more descriptor (`item`). A pure migration converts the old `material-tracker` blob into item goals; one hook runs it from the two places that show item goals. Import / export is a pure module plus one dialog on the dashboard Goals section.

**Tech Stack:** JavaScript, React (`.jsx`), MUI, `@mantine/hooks`, vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-20-dashboard-goals-design.md` (sections "Material tracker merge", "Import / export")

Depends on plans 1 and 2.

## Global Constraints

- Everything from plans 1 and 2.
- The old `material-tracker` key is read, never deleted or rewritten (rollback safety for two releases).
- Export file: `{ format: 'idleon-toolbox-goals', schema: 1, exportedAt, goals }`, downloaded with `handleDownload(data, 'idleon-goals-YYYY-MM-DD')` from `utility/helpers.js` (it appends `.json` itself, `helpers.js:906`).
- Item counts use exactly `getAllItems(characters, account)` + `findQuantityOwned(items, displayName)` (`parsers/items.ts`).
- A material-tracker bound counts only when it is a finite `parseInt` greater than 0 (the page stores `''` for unset, `material-tracker.jsx:135-136`; `checkBound` is truthiness-based).

## Review Focus

1. Migration must run once per real account: a user who deletes a migrated goal must not get it back on the next load. Test in Task 2.
2. First load on `?demo=true` must not consume the migration: demo gets the goals for that session but the flag stays unset. Test in Task 2.
3. A tracker with hundreds of entries (greenstack bulk adds) migrates fully up to `MAX_ITEM_GOALS`; anything beyond is reported, nothing silently lost. Test in Task 2 (250 entries with both bounds).
4. A file from a newer site version (`schema: 2`) is refused; unknown systems are kept as `missing`; unmapped characters are skipped and counted. Test in Task 4.
5. An old material-tracker export file imported into the new dialog becomes item goals. Test in Task 4.

---

### Task 1: Item and greenstack descriptors

**Files:**
- Create: `utility/goals/registry/item.js`, `utility/goals/registry/greenstack.js`; register both in `utility/goals/registry/index.js` and `utility/goals/routes.js`
- Test: extend `__test__/utility/goals-registry.test.js`, `__test__/utility/goals-resolve.test.js`

**Interfaces:**
- Produces descriptor `item`: `route: '/tools/material-tracker'`; `list` = `itemsArray` from `@website-data` (catalog, so logged-out lists too); `key: rawName`; `name: cleanUnderscore(displayName)`; `icon: data/${rawName}`; `iconRows: (rows, ctx) => rows owned in ctx` (catalog items without art exist); metric `quantity` (`value` = `findQuantityOwned(getAllItems(characters, account), displayName).amount ?? 0`, items list computed once per `account` and cached in a `WeakMap`; no max; `steps: [1000, 1000000]`).
- Produces descriptor `greenstack`: `route: '/tools/material-tracker'`; `list` = `account.looty.slabItems.filter((i) => i.greenstackable && !i.unobtainable && (!i.unrealisticGreenstack || i.greenStacked))` (same flags `isMissingGreenstack` uses, `parsers/misc.ts:462`); `key: itemRawName`; name / icon as the slab page renders them; metric `quantity`: `value` = `greenStacked ? 1e7 : Math.min(owned, 1e7)` where `owned` uses the same cached item list as `item` (the game's registry keeps an item greenstacked after the stack drops, `material-tracker.jsx:74-79`), max `1e7`. Exported constant `GREENSTACK_AMOUNT = 1e7` (move it from `material-tracker.jsx:45`).
- The "greenstack everything" goal is `createGoal({ system: 'greenstack', kind: 'all', metric: 'quantity', target: 'max' })`, exported as `greenstackGoal()`.
- `watch` / `nearAlert` support already exists in plan 1 (`isGoal`, `sameGoal`, resolve).

- [ ] **Step 1: Write the failing tests**: item quantity for one stacked item in `latest` equals `findQuantityOwned(getAllItems(...), displayName).amount`; a `watch` item goal at 0 owned resolves `ok`; `GOAL_ROUTES.item === '/tools/material-tracker'`; `resolveGoal(greenstackGoal())` on `latest` has `met` equal to the slab page's greenstack count and `total - met` equal to the number of rows `isMissingGreenstack` (plus unrealistic-but-stacked rows counted on both sides); a registered greenstack below 10M owned counts as met.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `Goals: item goals`

---

### Task 2: Material tracker migration

**Files:**
- Create: `utility/goals/migrateMaterialTracker.js`, `components/goals/useMaterialTrackerMigration.js`
- Modify: `components/dashboard/goals/Goals.jsx` (call the hook)
- Test: `__test__/utility/goals-migrate-material-tracker.test.js`, `__test__/components/useMaterialTrackerMigration.test.jsx`

**Interfaces:**
- Consumes: `getValidTrackedMaterials` (`utility/materialTracker.js`), `createGoal`, `useGoals().saveMany`
- Produces: `materialTrackerToGoals(tracked, { greenstackKeys: Set<string> }): Goal[]` — per valid entry: lower bound → `{ system: 'item', kind: 'entry', key: rawName, metric: 'quantity', op: '>=', target }`; upper bound → same with `op: '<='`; both carry `note` and `nearAlert: Boolean(includeNearly)`; neither bound → one `{ op: '>=', target: 0, watch: true }`. **Fold**: an entry that looks like a "track missing greenstacks" add (lower bound exactly `1e7`, no upper bound, empty note, `rawName` in `greenstackKeys`) produces no item goal; if at least one entry folds, the result contains one `greenstackGoal()`. `greenstackKeys` comes from the `greenstack` descriptor's rows for the loaded account.
- Produces: `useMaterialTrackerMigration(): { overCap: number }` — in an effect, when `useGoals().enabled`: read `material-tracker` and `goals-material-tracker-migrated` with `readLocalStorageValue`; if the flag is unset and there are valid entries, `saveMany(materialTrackerToGoals(tracked, { greenstackKeys }))` with `greenstackKeys` = keys of `getDescriptor('greenstack').list({ account, characters })` (dedupes, so re-running is harmless); set the flag unless `accountKey === 'demo'`; return `overCap` so the caller can show `N tracked materials could not be added (goal limit)`.
- Called from exactly two places: the dashboard Goals section (here) and the material tracker page (Task 3).

- [ ] **Step 1: Write the failing tests**

```js
it.each([
  [{ lowerBound: 100 }, [['>=', 100]]],
  [{ upperBound: 900 }, [['<=', 900]]],
  [{ lowerBound: 100, upperBound: 900 }, [['>=', 100], ['<=', 900]]],
  [{ lowerBound: '', upperBound: '' }, 'watch'],
  [{ lowerBound: '0' }, 'watch'],
  [{ lowerBound: '100' }, [['>=', 100]]],
])('bounds %j become %j', () => {});
it('note and includeNearly carry over', () => {});
it('invalid entries are skipped', () => {});
it('missing-greenstack entries fold into one greenstack goal', () => { /* 300 entries lower 1e7, no note, keys in greenstackKeys -> [greenstackGoal()] */ });
it('a 1e7 entry with a note, an upper bound, or a non-greenstackable item does not fold', () => {});
```
Hook tests: migrates once (delete a migrated goal, remount, it stays deleted); demo account migrates but leaves the flag unset; no tracker key → nothing written; 250 entries with both bounds → 500 item goals, `overCap` 0; with `MAX_ITEM_GOALS` mocked to 100 → `overCap` 400.

- [ ] **Step 2: Run** both files → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `Goals: migrate material tracker entries to item goals`

---

### Task 3: Material tracker page and dashboard alert on item goals

**Files:**
- Modify: `pages/tools/material-tracker.jsx` — the page lists item goals with `GoalRow` (plan 2) and calls `useMaterialTrackerMigration`; adding single items is the NavBar `AddGoalButton` (the `item` route is registered); the greenstack buttons: "Track missing greenstacks" adds the single `greenstackGoal()` (snackbar `Greenstack goal added`, or `Already tracking your greenstacks` when it exists); "Track my greenstacks" keeps its behaviour (`:130-136`): goals from the bounds typed on the page, or `watch` goals when none are typed; the greenstack goal, when present, renders first with `GoalRow defaultExpanded` (the full closest-first list lives here); empty state `Add item goals with the Add goal button`; the old `it-material-tracker` export button is removed (its files import through Task 4's dialog)
- Modify: `components/dashboard/Account.jsx:82` — call `useGoals()`, pass `itemGoals` (the account's `system === 'item'` goals) and `greenstackView` (`resolveGoal` of the account's greenstack goal, if any) in the alerts `context`, and include the goal ids + targets in `contextKey` (`hooks/useAlerts.jsx:11,45`) so edits refresh the alert
- Modify: `utility/dashboard/account.js:104-127` — build the material alert from `context.itemGoals` (no `localStorage` read): rebuild `item` from `items[rawName]` (already imported, `account.js:15`); `>=` goal → lower bound, `<=` → upper, both for the same item merged into one `checkBound` call, `nearAlert` → `includeNearly`, `watch` → `You have N X`; a greenstack goal (passed in `context.greenstackView`, the resolved view) → one alert entry `N greenstacks to go` listing its 5 closest short items
- Test: `__test__/utility/material-tracker-alert.test.js` (new: no existing test covers this alert), `__test__/components/MaterialTrackerPage.test.jsx` (new)

- [ ] **Step 1: Write the failing tests**: for each bound combination, the alert text from item goals equals `checkBound(...)` for the equivalent tracker entry; a `watch` goal gives `You have N X`; the page lists existing item goals and shows the empty state when there are none; "Track missing greenstacks" adds exactly one greenstack goal and a second click adds nothing; the greenstack goal renders expanded first; the material alert for a greenstack goal lists the 5 closest short items as `Copper Ore 9.6M / 10M` lines plus `and N more`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.**
- [ ] **Step 4: Run** → PASS; `npm test` → PASS. Browser pane: seed `material-tracker` with two entries in localStorage, load `/dashboard?demo=true`: the material alert shows the same texts as on `main`; `/tools/material-tracker?demo=true` lists them as goals; screenshots of both.
- [ ] **Step 5: Commit** `Goals: material tracker runs on item goals`

---

### Task 4: Import / export

**Files:**
- Create: `utility/goals/importExport.js`, `components/dashboard/goals/ImportDialog.jsx`
- Modify: `components/dashboard/goals/Goals.jsx` (header: Export, Import)
- Test: `__test__/utility/goals-import-export.test.js`, `__test__/components/GoalsImportDialog.test.jsx`

**Interfaces:**
- Produces: `exportGoals(goals, characters): ExportFile` — adds `classIndex` to character-scoped goals' `scope`
- Produces: `parseImport(text): { ok: true, file } | { ok: false, error: 'json' | 'format' | 'schema' }` — also accepts an old material-tracker export (an object whose values pass `isValidTrackedMaterial`), converted with `materialTrackerToGoals` into a goals file
- Produces: `planImport(file, { current, characters, mode: 'merge' | 'replace', charMap }): { goals, added, duplicates, skipped, overCap, missing }` — regenerates `id` / `createdAt`; drops goals whose character maps to `null`; dedupes with `sameGoal` on merge; applies the caps; `missing` counts goals the importer's account does not resolve (still imported)
- Produces: `defaultCharMap(file, characters)` — by name, then `classIndex`, else `null`
- Dialog copy: summary `12 goals: 9 account, 3 character`; Merge (default) / Replace; one select per exported character; result `Imported 10. 2 already there. 1 skipped.`; errors `This file is not a goals export`, `This file is from a newer version of the site`, `This file could not be read`.
- GA: `trackEvent('goal_added', { source: 'import', count })` once per import.

- [ ] **Step 1: Write the failing tests**

```js
it('round trip keeps every goal definition', () => {});
it.each([['{', 'json'], ['{"format":"x"}', 'format'], ['{"format":"idleon-toolbox-goals","schema":2,"goals":[]}', 'schema']])('parseImport(%s) -> %s', () => {});
it('an old material tracker export imports as item goals', () => {});
it('merge dedupes identical goals', () => {});
it('replace drops current goals', () => {});
it('unmapped characters are skipped and counted', () => {});
it('unknown systems are imported and counted as missing', () => {});
it('cap leaves out the excess and reports it', () => {});
it('defaultCharMap matches by name then class', () => {});
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.**
- [ ] **Step 4: Run** → PASS; `npm test` → PASS. Browser pane: export from `/dashboard?demo=true`, clear goals, import the file (merge); screenshots of the dialog and the restored section.
- [ ] **Step 5: Commit** `Goals: import and export goal lists`
