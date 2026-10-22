# Goals 6: Feedback Round 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the user-approved feedback round: clearer popover and rows, goals-first dashboard, material tracker clarity, slab change, page totals, and the missing systems found by the coverage audit.

**Architecture:** UX changes live in the shared goal components (`components/goals/*`, `components/dashboard/goals/*`, `components/goals/parts/format.js`, `utility/goals/resolve.js`). Coverage is more descriptors in `utility/goals/registry/` plus routes, header-only (no page edits except where a page has no NavBar route yet).

**Tech Stack:** as plans 1-5.

**Spec:** `docs/superpowers/specs/2026-10-20-dashboard-goals-design.md`, section "Feedback round 1 (2026-10-21)" (binding), plus "Page UI".

**Sources (read the parts your task names):** coverage audit `.superpowers/sdd/2026-10-21-goals-feedback/coverage-audit.md`; persona findings `.superpowers/sdd/2026-10-21-goals-feedback/personas/*/report-summary.md` (completionist has per-page dumps in `text\`).

## Global Constraints

- Everything from plans 1-5 (header-only; no `▶`; `current / target`; storage via @mantine/hooks; hydration rules; NavBar data-free; no useMemo/useCallback; no em dashes; sentence case; tooltips via InfoIcon only; reusable shared helpers; never edit generated data).
- Copy (verbatim): `At least`, `At most`, `One`, `All`, `By <group label>`, `Goal saved`, `View on dashboard`, `Reached`, `Undo`, `250 of N, type to filter`.
- Visual checks with Playwright (own headless context via a node script, or Playwright MCP when no other agent uses it), never the Claude Browser pane; never kill node processes (`taskkill /IM node.exe` is forbidden); never start/stop the dev server on :3001.
- Every claimed test must exist in the commit (verify with `git show --stat HEAD` + grep).

## Review Focus

1. Existing stored goals keep working: no change to keys of existing descriptors except where a task says so (stamp max removal keeps keys; slab single-item goals become `missing` and are covered by item goals: show them as `No longer exists` with remove).
2. The direction select and row wording never invert meaning: `<=` goals read `At most`, reached rules unchanged.
3. Undo restores exactly the removed goals (ids, createdAt).
4. Tab-to-system preselection falls back to the first system for unknown tabs.
5. Page totals values are finite on logged-out accounts (contract test).

---

### Task 1: Popover clarity

**Files:** `components/goals/GoalPopover.jsx` and `components/goals/parts/*` (TargetInput direction select, AppliesTo short labels + helper, SystemSelect icons/counts, EntrySearch existing-goal mark + cap hint, TierSelect no None/Locked), `components/goals/AddGoalButton.jsx` (right anchor, keep Add goal action beside count, snackbar on save), `utility/goals/routes.js` or a new data-free `utility/goals/tabs.js` (tab-to-system map; read the active tab from the page's query/tab state the way pages expose it), `utility/goals/registry/stamp.js` (no max), tier descriptors (artifact, sigil, card... drop None/Locked from selectable targets, page wording).
**Steps:**
- [ ] Tests first (GoalPopover/PageGoalsPanel tests): direction select default At least, At most hides quick steps; short labels + helper text; group options render icons (generic `groups.icon` or first row icon); system select shows icon + count; entries with a goal are marked; cap hint text; stamp Sword Stamp has no Max step and accepts 600; tier select has no None/Locked; save shows `Goal saved` snackbar with dashboard link; tab preselect (Hole > Measure -> measurement; unknown tab -> first).
- [ ] Implement; full suite; eslint; Playwright screenshots (cauldrons, farming, hole, stamps) at 1920x950 and 384x832.
- [ ] Commit `Goals: clearer goal popover`

### Task 2: Rows and dashboard

**Files:** `components/goals/parts/format.js`, `components/goals/parts/GoalVisuals.jsx`, `components/goals/GoalCard.jsx`, `components/goals/PageGoalsPanel.jsx`, `components/dashboard/goals/{Goals,GoalRow}.jsx`, `utility/goals/resolve.js` (range pairing view, closest = nearest unmet), `pages/dashboard.jsx` (Goals section first), `components/goals/GoalsProvider.jsx` if Undo needs a restore helper (`saveMany` of removed goals keeping ids).
**Steps:**
- [ ] Tests first: row text per direction/unit/reached; lower+upper item goals on one key render one range row; 4px bar + percent; Remove and Clear reached show Undo that restores ids; closest lists nearest unmet; group row click expands; expanded list height capped with inner scroll; Goals renders first on the dashboard with summary strip.
- [ ] Implement; full suite; eslint; Playwright dashboard at both widths.
- [ ] Commit `Goals: clearer goal rows and goals-first dashboard`

### Task 3: Material tracker clarity and slab

**Files:** `pages/tools/material-tracker.jsx`, `components/goals/useMaterialTrackerMigration.js` (+ one-time notice data), `utility/goals/importExport.js` (item-only export), `utility/dashboard/account.js` (alert wording), `utility/goals/registry/slab.js` (no single-item mode: `kind: 'all'` only via descriptor flag e.g. `allOnly: true` honoured by AppliesTo).
**Steps:**
- [ ] Tests first: migration notice shows once with merged count and a "keep as separate goals" action that replaces the fold with item goals; greenstack list collapsed by default; bounds/note under Track my greenstacks; tracker-page export (items only) and import; alert never says "nearly" beyond the near band; slab popover offers All / By category only.
- [ ] Implement; full suite; eslint; Playwright tracker page at both widths.
- [ ] Commit `Goals: material tracker clarity and slab totals only`

### Task 4: Page totals infrastructure + first pages

**Files:** `utility/goals/registry/totals/` (one helper `totalsDescriptor({ system, label, route, entries: [{ key, name, icon, value(ctx), max?(ctx) }] })`) and the first totals descriptors: research, spelunking, sushi, compass, tesseract, grimoire, upgrade vault, slab (looted, missing, greenstacks), gaming (crowns, log book), hole (opals invested, caverns unlocked, layers), gallery, jelly, button; routes; contract test coverage (finite, logged-out safe). Data paths: coverage audit + completionist dumps.
**Steps:**
- [ ] Tests first (contract test covers new descriptors; one test per totals entry value equals the page's own expression on the latest fixture).
- [ ] Implement; full suite; Playwright check two pages.
- [ ] Commit `Goals: page totals`

### Task 5: Named gaps

Systems: Beanstalk golden foods, Advice Fish, Zenith Market, Speedrun (add routes; confirm pages are in PAGES), Divinity (route Coral Kid to divinity, Singularity, god rank/blessing totals), Rift (skill mastery per skill with page thresholds as tiers, construct mastery, bonuses unlocked), Sneaking (ninja mastery, per-ninja sneaking level as character or ninja-scoped entries if the data is per ninja, floors), Farming ("Rank database" label, plot rank/OG per plot), Summoning stones, Emperor thresholds. Commit `Goals: rift, divinity, sneaking and missing pages`.

### Task 6: The Hole

All Hole systems from the audit and completionist dumps: opals per cavern, villager opals invested, Bravery, Justice, Bell, Harp strings, Lamp wishes, Jars + collectibles, Fountain, Cove crystals, Gambit, Wisdom, Temple, Evertree, Grotto, Trench, Hive, majik points; tab-to-system map entries for every Hole tab. Commit `Goals: the hole caverns`.

### Task 7: Remaining audit systems

The remaining "missing" rows of the coverage audit section G and the completionist inventory not covered by Tasks 4-6 (e.g. Bubba, cooking mastery, meal ribbons, compass medallions/abominations/portals, armory outposts/resources, menagerie missions/jellies, clam compensations, sushi slots, legend points + by-colour group, summoning winner bonuses, sailing chests). Split into two commits by area if large. Commit `Goals: remaining systems`.

Each of Tasks 5-7: descriptors + routes + tab map entries only (header-only); contract test; key-stability rows for filtered/sorted lists; names test; Playwright check on two pages.

### Task 8: Card grid dashboard and sentence-style target row (user feedback 2026-10-21, approved mock)

**Files:** `components/dashboard/goals/{Goals,GoalRow}.jsx` (new `GoalCard`-style tile for the dashboard; reuse shared `components/goals/parts/*` visuals and format helpers), `components/goals/parts/{TargetInput,format}.js(x)`, `components/goals/GoalPopover.jsx`, `components/goals/{PageGoalsPanel,GoalCard}.jsx` for consistent copy, tests.
**Spec (approved mock):**
- Dashboard Goals: header `Goals` + `n goals · m reached` + Export · Import; a chip row: `All n`, a sort chip (`Closest first` default, `Recently added`, `System`), one chip per system with count (filters; overflow `+k`); a responsive card grid (`repeat(auto-fill, minmax(205px, 1fr))`, 1 column on phones). Card: icon, name (ellipsis), small system/entry label (+ note), large current value, `of <target>` beside it, 4px bar. Tier goals: current tier name, `of <tier name>`. Boolean: `Not owned` / `Owned`, `Own it`. Watch: amount only. All/group goals: `met` `of total` and a `Closest: a, b, c ›` or `n to go ›` link that opens the full expandable list (dialog or inline expansion under the grid). Missing goals: dimmed card `No longer exists` + `Remove`. Reached goals move to a collapsed `Reached (n)` strip at the end (with Clear reached). Card actions (edit, remove, open page) appear on hover/focus on desktop and via a tap menu on touch; Undo stays.
- Popover target row: replace the `Now <metric> X` line with `You have <value>` (e.g. `You have 3 kills`, `You have Lv 150`, `You have Transcendent`); drop the `Direction` label: the select's options read `Reach at least` / `Stay at or below` (stored op unchanged `>=` / `<=`), and the target field placeholder is `Target <unit>` (e.g. `Target kills`, `Target level`).
- Header panel and goal card keep the same value wording as the dashboard cards (`449,924 of 500,000`).
**Steps:** tests first (card text per goal type, chips filter/sort, reached strip, all-goal expand, missing card, popover copy), implement, full suite, eslint, Playwright dashboard + one popover at 1920x950 and 384x832 (own headless context), commit `Goals: card grid dashboard`.

### Task 9: Goal rows redesign with cards toggle, cost progress for booleans (user feedback 2026-10-22)

**Spec:** section "Goal rows redesign (2026-10-22)" (binding). Research and personas: `.superpowers/sdd/2026-10-21-goals-feedback/card-redesign/`.
**Files:** `components/dashboard/goals/Goals.jsx` (view toggle, rows default), new `components/goals/GoalListRow.jsx` (row + in-place expansion), `components/goals/GoalTile.jsx` (fixed 78px skeleton, reserved action slot), `components/goals/GoalEntriesDialog.jsx` (reuse inside expansion or retire), `components/goals/parts/format.js` (copy per type: tier caption, boolean verbs, cost progress, `n of m done`, `Next up`), `utility/goals/resolve.js` (boolean `cost` progress: `{ value(ctx), price(row), unit }` on the metric; reached rule unchanged: owned flag), `utility/goals/registry/bribe.js` (cost: coins from `account.currencies.rawMoney`, price from the bribe row) and every other boolean descriptor whose page shows a currency price (audit the 39 boolean metrics; list what you added and what has no price), material tracker page and header panel keep matching copy.
**Steps:** tests first (row text per goal type incl. bribe `1.2M of 5M coins` and reached `Bought`; tier caption and step count; boolean verbs; `Next up` with value; toggle persists; expansion shows actions/note; missing row Remove; fixed heights; logged-out cost values finite), implement, full suite, eslint, Playwright dashboard in both views at 1920x950 and 384x832 (own headless context), commit `Goals: compact goal rows with cards toggle`.

### Task 10: Sort chip padding and goals empty state (user feedback 2026-10-22, approved mock)

**Files:** `components/dashboard/goals/Goals.jsx` (sort chip and empty state), tests in `__test__/components/DashboardGoals.test.jsx`.
**Spec:**
- Sort chip: same height as the Rows / Cards toggle beside it, about 4-5px vertical and 10-12px side padding, 6px gap between the sort icon and the label.
- Empty state (no goals): title `Goals`; a 36px rounded tile with `IconTargetArrow`; heading `Set your first goal`; line `Pick something you're working toward, like a stamp level, all meals to Lv 100 or a bribe, and track it here.`; line `Use [Add goal] in the top bar of any page, or start with:` where `[Add goal]` is a non-interactive replica of the header button (target-arrow icon + `Add goal`); suggestion chips with each system's game icon and label, linking to the page (keep `sessionQuery` like the current links): Stamps, Bubbles, Meals, Bribes, Talents (routes from `GOAL_ROUTES`, icons from the descriptors or existing page icons); muted footnote `Items from the material tracker show up here automatically.` Material tracker is no longer a link.
**Steps:** tests first (empty state copy, five chip links with hrefs, no material tracker link, sort chip still sorts), implement, full suite, eslint, Playwright screenshots of the empty dashboard and the sort chip row at 1920x950 and 384x832, commit `Goals: clearer empty state and sort chip`.
