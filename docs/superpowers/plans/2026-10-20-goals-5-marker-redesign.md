# Goals 5: Marker Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the text badge on entry icons with an icon-only marker (progress ring), open a goal card on click, and turn the header button into a page summary.

**Architecture:** Changes stay in the shared components (`SetGoalButton`, `AddGoalButton`, new `GoalCard`, `PageGoalsPanel`, `GoalRing`) plus removing per-page badge workarounds. Page call sites keep `<SetGoalButton system entryKey scope? />`.

**Tech Stack:** React (`.jsx`), MUI, `@tabler/icons-react`, vitest + Testing Library, Playwright MCP for visual checks.

**Spec:** `docs/superpowers/specs/2026-10-20-dashboard-goals-design.md` (section "Page UI", rewritten 2026-10-20)

Inserted between plan 4 Task 2 and Task 3 at the user's request (2026-10-20).

## Global Constraints

- Everything from plans 1-4.
- Icon: `IconTargetArrow` from `@tabler/icons-react` for the header and every entry state. No `IconTarget`.
- The entry button is a fixed size (28x28 hit area, 16px icon, 2px ring) and never renders text.
- Colors from the MUI theme: muted = `text.disabled`, in progress = `primary.main`, reached = `success.main`.
- Copy (verbatim): `Add goal`, `Goals {reached}/{total}`, `Goals on this page`, `All goals on the dashboard`, `This page: {n} goals, {m} reached`, `View all`, `Edit`, `Remove`, `Own it`, aria `Goal: {metricLabel lowercased} {current} of {target}`.
- Popovers are MUI `Popover`; the card and the panel are not new pages.
- No `▶` character anywhere in the UI (user, 2026-10-20). Progress reads `current / target` (`11 / 100`, `90% / 99%`), tiers `Ancient / Eldritch`, all-goals `met / total`. Sweep existing uses (`GoalRow.jsx`, `SetGoalButton.jsx`, the popover Preview, dashboard alerts, tests) in Task 1.

## Review Focus

1. A page with 100+ markers must not resolve every goal per marker per render: resolve once per page (shared hook) and look up by entry. Test in Task 1.
2. Clicking inside the goal card or the panel never reaches the host card's onClick (portal bubbling). Test in Task 1 and Task 2.
3. Character pages: the panel counts the goals of the characters shown; the card shows the goal for that marker's character only. Test in Task 2.
4. Boolean goals: first click on a marker with no goal still toggles "own it" directly (no card); a marker with an own-it goal opens the card, whose Remove clears it.
5. Pages without goals keep `Add goal` and open the add popover directly.

---

### Task 1: Marker and goal card

**Files:**
- Create: `components/goals/GoalRing.jsx` (`<GoalRing progress={0..1|null} state="none|open|reached|boolean" />`, SVG ring + `IconTargetArrow`)
- Create: `components/goals/GoalCard.jsx` (`<GoalCard goals={Goal[]} views={View[]} onEdit(goal) onRemove(goal) onViewAll />`)
- Create: `components/goals/usePageGoals.js` (`usePageGoals(systems: string[], { characters? }) => { views: View[], byEntry: Map<string, View[]> }`, key `` `${system}|${scopeKey}|${key}` ``, resolved once per render of the caller via `resolveGoals`)
- Modify: `components/goals/SetGoalButton.jsx` (no badge; GoalRing; click with goal opens GoalCard; Edit opens GoalPopover; uses `usePageGoals` through a context provided by the page-level provider if present, else resolves its own entry)
- Modify: remove badge workarounds: `pages/account/world-1/stamps.jsx` (badge positioning), `components/characters/Skills.jsx` (`skillGoalSx`), `components/goals/goalHost.js` (`goalCornerSx` backdrop only needed for text: keep a plain corner position), any other `has-goal` badge spacing found by grepping `goal-set-btn`
- Test: rewrite badge tests in `__test__/components/SetGoalButton.test.jsx`; add `GoalCard` cases

**Steps:**
- [ ] Tests first: ring state per goal status (none / open with progress / reached / boolean dashed); no text inside the button; click with a goal opens the card with `current / target`, Edit opens the popover in edit mode, Remove removes; click without a goal opens the add popover; boolean without a goal toggles on first click; clicks in the card never reach a spy host onClick; aria label text.
- [ ] Implement; `npx vitest run` green; eslint clean on touched files.
- [ ] Playwright at 1920x950 and 384x832: bubbles, stamps, grimoire, arcade-shop, characters (skills + talents) with goals set (open, reached, boolean on bribes). Screenshots `qa/marker-*.png`.
- [ ] Commit `Goals: icon-only goal marker with progress ring and goal card`

### Task 2: Header page summary

**Files:**
- Create: `components/goals/PageGoalsPanel.jsx`
- Modify: `components/goals/AddGoalButton.jsx` (label `Goals {reached}/{total}` when the route has goals; opens the panel; `Add goal` inside opens GoalPopover; no goals: unchanged)
- Test: `__test__/components/PageGoalsPanel.test.jsx`

**Steps:**
- [ ] Tests first: label switches between `Add goal` and `Goals 2/5`; panel lists only goals of the route's systems, open before reached; character goals limited to characters present in state (all characters on `/characters`); row click opens the goal card; `Add goal` opens the popover; dashboard link keeps `sessionQuery`; panel clicks do not bubble.
- [ ] Implement; tests green; `npm run test:e2e -- e2e/chunk-audit.spec.js e2e/hydration.spec.js` (NavBar stays data-free: the panel is inside the dynamically loaded `AddGoalButton`). Report the known pre-existing item-planner chunk-audit failure separately.
- [ ] Playwright screenshots of the panel on compass and characters at both widths.
- [ ] Commit `Goals: header page goals summary`
