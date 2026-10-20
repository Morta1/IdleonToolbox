# Goals 3: Import / Export and Material Tracker Merge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Item goals replace the material tracker (with a one-time migration and the dashboard alert kept), and goal lists can be exported to and imported from a JSON file.

**Architecture:** Items become one more descriptor (`item`). A pure migration converts the old `material-tracker` blob into item goals once. Import / export is a pure module plus one dialog on the dashboard Goals section.

**Tech Stack:** JavaScript, React (`.jsx`), MUI, vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-20-dashboard-goals-design.md` (sections "Material tracker merge", "Import / export")

Depends on plans 1 and 2.

## Global Constraints

- Everything from plans 1 and 2.
- The old `material-tracker` key is read, never deleted or rewritten (rollback safety for two releases).
- Export file: `{ format: 'idleon-toolbox-goals', schema: 1, exportedAt, goals }`, name `idleon-goals-YYYY-MM-DD.json`, downloaded with `handleDownload` from `utility/helpers.js`.
- Item counts use exactly `getAllItems(characters, account)` + `findQuantityOwned(items, displayName)` (`parsers/items.ts`), as the material tracker does.

## Review Focus

1. Migration must run once: a user who deletes a migrated goal must not get it back on the next load. Test in Task 2.
2. A file exported from a newer site version (`schema: 2`) or with unknown systems: refuse the first, keep the second as `missing`. Test in Task 4.
3. Importing a list whose characters do not exist in the importer's account: those goals are mapped or skipped, never saved with a dangling name silently. Test in Task 4.
4. Import that would exceed 200 goals: the excess is left out and reported, nothing else is lost. Test in Task 4.
5. A user with no material-tracker key and no goals: migration is a no-op and does not set any storage. Test in Task 2.

---

### Task 1: Item descriptor and `watch` / `nearAlert` goal fields

**Files:**
- Create: `utility/goals/registry/item.js`; register it in `utility/goals/registry/index.js`
- Modify: `utility/goals/store.js` (`isGoal` and `sameGoal` accept optional `watch: boolean`, `nearAlert: boolean`)
- Modify: `utility/goals/resolve.js` (`watch` goals: `status: 'ok'`, `progress: null`, never reached)
- Test: extend `__test__/utility/goals-registry.test.js`, `__test__/utility/goals-resolve.test.js`, `__test__/utility/goals-store.test.js`

**Interfaces:**
- Produces descriptor `item`: `route: '/tools/material-tracker'`, `list` = `itemsArray` from `@website-data` (catalog, so logged-out lists too), `key: rawName`, `name: cleanUnderscore(displayName)`, `icon: data/${rawName}`, metric `quantity` (`value` = `findQuantityOwned(getAllItems(characters, account), displayName).amount`, computed once per `ctx` and cached on a `WeakMap` keyed by `account`; no max; `steps: [1000, 1000000]`).
- Contract test: for `item`, the icon check runs only on rows owned in the fixture (catalog items without art exist).

- [ ] **Step 1: Write the failing tests**: item quantity for one stacked item in `latest` equals `findQuantityOwned(getAllItems(...), displayName).amount`; `watch` goal resolves `ok` with `progress: null` even when the value is 0; `isGoal` accepts `watch`/`nearAlert`.
- [ ] **Step 2: Run** the three files → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `Goals: item goals`

---

### Task 2: Material tracker migration

**Files:**
- Create: `utility/goals/migrateMaterialTracker.js`
- Modify: `components/goals/useGoals.js` (run the migration once when `enabled`)
- Test: `__test__/utility/goals-migrate-material-tracker.test.js`

**Interfaces:**
- Consumes: `getValidTrackedMaterials` (`utility/materialTracker.js`), `createGoal`, `upsertGoal`
- Produces: `materialTrackerToGoals(tracked): Goal[]` — per entry: `lowerBound` → `{ system: 'item', kind: 'entry', key: rawName, metric: 'quantity', op: '>=', target: lowerBound }`; `upperBound` → same with `op: '<='`; both carry `note` and `nearAlert: includeNearly`; neither bound → one `{ op: '>=', target: 0, watch: true }`
- Produces: flag key `goals-material-tracker-migrated`; `useGoals` migrates when the flag is unset and `material-tracker` holds valid entries, then sets the flag. No entries → sets nothing.

- [ ] **Step 1: Write the failing tests**

```js
it.each([
  [{ lowerBound: 100 }, [['>=', 100]]],
  [{ upperBound: 900 }, [['<=', 900]]],
  [{ lowerBound: 100, upperBound: 900 }, [['>=', 100], ['<=', 900]]],
])('bounds %j become %j', (bounds, ops) => {});
it('no bounds becomes one watch goal', () => {});
it('note and includeNearly carry over', () => {});
it('invalid entries are skipped', () => {});
```
Plus in `__test__/components/useGoals.test.jsx`: migrates once (delete a migrated goal, re-render, it stays deleted); no tracker key → no `goals` or flag written.

- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `Goals: migrate material tracker entries to item goals`

---

### Task 3: Material tracker page and dashboard alert on item goals

**Files:**
- Modify: `pages/tools/material-tracker.jsx` (replace its own store and list with item goals: the NavBar `AddGoalButton` already appears because `item` registers this route; the page body lists item goals with `GoalRow` from plan 2; the "Track greenstacks" buttons create item goals `>= 10,000,000` for each greenstack candidate instead of tracker entries)
- Modify: `utility/dashboard/account.js:104-127` (read item goals from the `goals` blob for the current account instead of `material-tracker`; keep `checkBound` texts: `>=` goal → lower bound, `<=` → upper, `nearAlert` → `includeNearly`, `watch` → `You have N X`)
- Test: extend the existing dashboard alert test that covers `materialTracker` (grep `materialTracker` under `__test__/`); `__test__/components/MaterialTrackerPage.test.jsx` (new)

**Interfaces:**
- Consumes: `normalizeBlob`, `goalsOf`, `accountKeyOf`; the alert function's `context` provides what `accountKeyOf` needs (`uid`, `demo`); if it does not, pass them through from `hooks/useAlerts.jsx`.

- [ ] **Step 1: Write the failing tests**: alert text for a `>=` item goal below target equals today's `checkBound` text for the same lower bound; page lists existing item goals and shows the empty state `Add item goals with the Add goal button`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** → PASS. Browser pane: seed `material-tracker` in localStorage with two entries, load `/dashboard?demo=true`: the material alert shows the same texts as on `main`; `/tools/material-tracker?demo=true` lists them as goals. Screenshots of both.
- [ ] **Step 5: Commit** `Goals: material tracker runs on item goals`

---

### Task 4: Import / export

**Files:**
- Create: `utility/goals/importExport.js`
- Create: `components/dashboard/goals/ImportDialog.jsx`
- Modify: `components/dashboard/goals/Goals.jsx` (header: Export, Import)
- Test: `__test__/utility/goals-import-export.test.js`, `__test__/components/GoalsImportDialog.test.jsx`

**Interfaces:**
- Produces: `exportGoals(goals, characters): ExportFile` — strips nothing but adds `classIndex` to character-scoped goals' `scope`
- Produces: `parseImport(text): { ok: true, file } | { ok: false, error: 'json' | 'format' | 'schema' }`
- Produces: `planImport(file, { current: Goal[], characters, mode: 'merge' | 'replace', charMap: Record<string, string | null> }): { goals: Goal[], added, duplicates, skipped, overCap, missing }` — regenerates `id`/`createdAt`; drops goals whose character maps to `null`; dedupes with `sameGoal` on merge; applies `MAX_GOALS`; `missing` counts goals whose system or key the importer's account does not resolve (they are still imported)
- Produces: `defaultCharMap(file, characters)` — by name, then by `classIndex`, else `null`
- Dialog copy: summary `12 goals: 9 account, 3 character`; radio Merge (default) / Replace; one select per exported character; result line `Imported 10. 2 already there. 1 skipped.`; errors `This file is not a goals export`, `This file is from a newer version of the site`, `This file could not be read`.
- GA: `goal_added` with `source: 'import'` once per import (`count` param).

- [ ] **Step 1: Write the failing tests**

```js
it('round trip keeps every goal definition', () => {});
it.each([['{', 'json'], ['{"format":"x"}', 'format'], ['{"format":"idleon-toolbox-goals","schema":2,"goals":[]}', 'schema']])('parseImport(%s) -> %s', () => {});
it('merge dedupes identical goals', () => {});
it('replace drops current goals', () => {});
it('unmapped characters are skipped and counted', () => {});
it('unknown systems are imported and counted as missing', () => {});
it('cap leaves out the excess and reports it', () => {});
it('defaultCharMap matches by name then class', () => {});
```

- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** module and dialog.
- [ ] **Step 4: Run** → PASS; `npm test` → PASS. Browser pane: export from `/dashboard?demo=true`, clear goals, import the file (merge), screenshot the dialog and the restored section.
- [ ] **Step 5: Commit** `Goals: import and export goal lists`
