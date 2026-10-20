# Goals 5: Header-only Goals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Goals are added and viewed only from the header button: per-entry icons are removed from every page, and the header button becomes a page summary (`Goals 2/5`) with goal cards.

**Architecture:** Pages lose their `SetGoalButton` wiring and badge workarounds. `AddGoalButton` (still loaded via `next/dynamic` from the NavBar) shows `Add goal` or `Goals n/m`; the latter opens `PageGoalsPanel`, whose rows open `GoalCard`. The dashboard's expanded group rows keep a small "give this entry its own goal" icon that opens `GoalPopover` pre-set to the entry.

**Tech Stack:** React (`.jsx`), MUI, `@tabler/icons-react`, vitest + Testing Library, Playwright MCP.

**Spec:** `docs/superpowers/specs/2026-10-20-dashboard-goals-design.md` (section "Page UI", rewritten 2026-10-20: header-only)

Inserted between plan 4 Task 2 and Task 3 at the user's request (2026-10-20). Plan 4's remaining tasks then add descriptors and routes only, with no page edits.

## Global Constraints

- Everything from plans 1-4.
- Icon: `IconTargetArrow` from `@tabler/icons-react` (header button, panel, card, dashboard promote icon). No `IconTarget`.
- No `▶` character anywhere in the UI (user, 2026-10-20). Progress reads `current / target` (`11 / 100`, `90% / 99%`), tiers `Ancient / Eldritch`, all-goals `met / total`, boolean `Own it`.
- Copy (verbatim): `Add goal`, `Goals {reached}/{total}`, `Goals on this page`, `All goals on the dashboard`, `Edit`, `Remove`, `Own it`.
- NavBar stays data-free: everything new lives behind the dynamically loaded `AddGoalButton`.
- Popovers are MUI `Popover`; clicks inside them never bubble to page elements.

## Review Focus

1. No page still renders a goal icon or imports `SetGoalButton` / `goalHostSx` / `goalCornerSx` (grep is the test); pages render exactly as on `main` apart from the NavBar button.
2. The panel resolves goals once per open (not per row per render) and lists only the route's systems; character goals show the character name.
3. A page with goals shows `Goals 2/5`, a page without shows `Add goal`; `Add goal` inside the panel opens the add popover.
4. Editing from a goal card updates the goal (never adds a second); Remove removes it and the label count updates.
5. Logged out / `?profile=`: the header button renders nothing (unchanged behaviour).

---

### Task 1: Remove entry icons and sweep `▶`

**Files:**
- Modify: every page/component that renders `SetGoalButton` or uses `goalHostSx` / `goalCornerSx` / `skillGoalSx` / `onOpenChange` tooltip suppression for goals (grep `components/`, `pages/`): restore each to its pre-goals markup (compare with `git show 693108498c:<path>`; keep unrelated changes made on this branch, e.g. `cleanUpgradeName` / `cleanText` sweeps)
- Modify: `components/dashboard/goals/GoalRow.jsx` (promote icon becomes a small `IconTargetArrow` icon button opening `GoalPopover` pre-set to the entry, filled color when the entry already has a goal), `components/goals/parts/*` and any copy with `▶`
- Delete: `components/goals/SetGoalButton.jsx`, `components/goals/goalHost.js` if nothing else uses them; replace `__test__/components/SetGoalButton.test.jsx` coverage that still matters (`hasGoals` routes) in a test that keeps it
- Test: update `DashboardGoals.test.jsx`, `GoalPopover.test.jsx`

**Steps:**
- [ ] Grep-based test (vitest) asserting no file under `pages/` or `components/` (except `components/goals/` and `components/dashboard/goals/`) imports from `components/goals/`.
- [ ] Remove wiring; restore page markup; sweep `▶`; update tests; full suite green; eslint clean on touched files.
- [ ] Playwright (1920x950 and 384x832): stamps, arcade-shop, characters look as on `main` (no icons). Screenshots `qa/t1-*.png`.
- [ ] Commit `Goals: header-only, entry icons removed`

### Task 2: Header page summary with goal cards

**Files:**
- Create: `components/goals/PageGoalsPanel.jsx`, `components/goals/GoalCard.jsx` (reference implementation of an earlier draft: `.superpowers/sdd/2026-10-20-goals-5-marker-redesign/partial/GoalCard.jsx`, `usePageGoals.js`; reuse what fits)
- Modify: `components/goals/AddGoalButton.jsx` (label `Add goal` / `Goals {reached}/{total}`; with goals opens the panel)
- Test: `__test__/components/PageGoalsPanel.test.jsx`

**Steps:**
- [ ] Tests first: label switches; panel lists only goals of the route's systems (open before reached, character goals with the character name); row click opens the goal card with `current / target`; Edit opens `GoalPopover` in edit mode and saving keeps one goal; Remove removes and the label updates; `Add goal` in the panel opens the add popover; dashboard link keeps `sessionQuery`; clicks in the panel/card do not bubble; logged out renders nothing.
- [ ] Implement; tests green; `npm run test:e2e -- e2e/chunk-audit.spec.js e2e/hydration.spec.js` (report the known pre-existing item-planner chunk-audit failure separately).
- [ ] Playwright screenshots of the panel and a goal card on bubbles, compass and characters at both widths.
- [ ] Commit `Goals: header page goals summary`
