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
