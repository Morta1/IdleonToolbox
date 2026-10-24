# Goals 7: Tester Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the "Do" items from the Discord Goals tester thread.

**Architecture:** Same goal engine (`utility/goals/*`), shared UI in `components/goals/*` and `components/dashboard/goals/*`. New scopes and target kinds live in `resolve.js` and `store.js`; new systems are descriptors under `utility/goals/registry/`.

**Tech Stack:** as plans 1-6.

**Spec:** `docs/superpowers/specs/2026-10-20-dashboard-goals-design.md`, section "Tester feedback round (2026-10-23)" (binding), plus "Goal rows redesign (2026-10-22)".

## Global Constraints

- Everything from plans 1-6 (no useMemo/useCallback; storage via @mantine/hooks; no storage reads in render; no em dashes; sentence case; no `▶`; tooltips via InfoIcon only; reusable shared helpers; never edit generated data; no Co-Authored-By or any trailer; never `--no-verify`).
- **Minimal tests (user rule, 2026-10-22):** add a test only for new logic or a real bug fix (one per behaviour, prefer an existing `it.each` table row or an existing test's assertion). UI tweaks only update existing tests that break. Never add tests for styling.
- Work only in the worktree `C:\Dev\idleon\toolbox\IdleonToolbox\.claude\worktrees\dashboard-goals`. Own dev server on port 3011 only if not already running (check `curl -s -o /dev/null -w "%{http_code}" http://localhost:3011`); never kill node processes you did not start; never use ports 3001/3002.
- Stored goals keep working: new fields are optional (`pinned`, `scope: 'allChars'`, `target: 'next'`); `isGoal` and import validation accept them.

## Review Focus

1. Old goals without `pinned` / new scopes resolve exactly as before.
2. An `allChars` goal never becomes `missing` when one character is deleted; it counts the characters it finds.
3. `target: 'next'` never reports reached for an entry with no next threshold (maxed entry counts as done, not as missing).
4. Pinned goals still respect the system filter chips.
5. Section order setting does not change server-rendered markup (hydration).

---

### Task 1: Quick UI fixes

> 2026-10-23 note: the `Add from:` line was dropped by user decision (starter chips only in the empty state, the pages were too specific).

**Files:** `components/goals/GoalListRow.jsx` (chevron), `components/goals/parts/format.js` (`allName`/title metric wording via the descriptor metric label), `components/goals/GoalTile.jsx` (`GoalGrid` width uncapped), `components/dashboard/goals/Goals.jsx` (`Add from:` line reusing the empty state's starter chips), slab help text (`components/goals/parts/AppliesTo.jsx` helper copy or the slab descriptor).
- [ ] Ribbon title: one row in the existing all-title `it.each` (resolve test) for a non-level metric, e.g. meal ribbon reads `All meals at least ribbon 15`.
- [ ] Implement all five; update broken expectations only; full suite; eslint; commit `Goals: clearer rows and titles from tester feedback`.

### Task 2: Pin goals and section order

> 2026-10-23 note: section order is built in Task 2b as drag-to-reorder on the dashboard section buttons (stored as `dashboard-section-order`), replacing the `Goals first` / `Alerts first` setting; only pinning shipped in this task.

**Files:** `utility/goals/store.js` (optional `pinned` in validation and `sameGoal` ignores it), `utility/goals/importExport.js` (keeps `pinned`), `components/dashboard/goals/Goals.jsx` (pinned first under every sort, before the 8 cap), `components/goals/GoalListRow.jsx` + `GoalTile.jsx` menu (`Pin` / `Unpin`, filled star icon on pinned rows), `pages/dashboard.jsx` (section order via drag on the section buttons, `useLocalStorage`, first render identical to the export).
- [ ] Tests: pinned sorts first under both sorts (one existing sort test assertion); import keeps `pinned` (one row in an existing import table).
- [ ] Implement; full suite; eslint; commit `Goals: pin goals and choose the dashboard order`.

### Task 3: All characters goals

**Files:** `utility/goals/store.js` (`scope: 'allChars'`), `utility/goals/resolve.js` (resolve the entry per character; value `met` / `total` characters; Next up = characters closest; reached when all meet), `components/goals/parts/CharacterPicker.jsx` (`All characters` option first), `components/goals/parts/format.js` (title `All characters <name> at least <target>`, value `n of m characters`), import character mapping skips `allChars`.
- [ ] Tests: resolve an `allChars` skill goal on a fixture (met/total equals a manual count over characters); import keeps it.
- [ ] Implement; full suite; eslint; Playwright one screenshot of the popover and the row; commit `Goals: all characters goals`.

### Task 4: Next claim / next level targets

**Files:** `utility/goals/registry/menagerieMission.js` (a `next` metric: progress toward the mission's next claim threshold from the page's own data), `utility/goals/registry/observation.js` (a `next` metric: insight EXP toward the next insight level, from the page's `Insight EXP: x / y`), `utility/goals/resolve.js` (metrics with `nextStep: true` take no typed target; entry is done when current >= threshold), `components/goals/parts/TargetInput.jsx` (hides the number field for `nextStep` metrics and reads `Next claim` / `Next level`).
- [ ] Tests: one resolve row per metric on a fixture (value equals the page's numbers); contract test covers finite values.
- [ ] Implement; full suite; eslint; commit `Goals: next claim and next level targets`.

### Task 5: New systems

Find the data the pages already show (do not invent formulas): glorified outposts count and per-outpost rank (Royal Guardian / armory outposts page), total jar breaks and breaks per jar (Hole jars page), carrying capacity per material type per character (inventory / bag page if the parser exposes it; skip with a ledger note if not). Add descriptors / page totals + routes + tab map entries; contract test rows as the existing pattern requires (no extra tests).
- [ ] Implement; full suite; eslint; commit `Goals: outposts, jars and carrying capacity`.
