# Goals: design

Source: triage task 1557680221610709012 ("Add a sort of todo list to the dashboard", rederdex).
Status: approved design, 2026-10-20. Next step: implementation plan.

## Problem

Players want to track specific targets without opening each page: bubble levels, stamp levels,
masterclass upgrades, Killroy, and so on. Targets are either for one entry ("Sanic Tools to Lv 6930")
or for many ("every bubble at 90% of max or more"). The reporter takes targets from an external tier
list (autoreview screenshots), so goals are always user-entered, never copied from that tool.

## Decisions

| Topic | Decision |
|---|---|
| Coverage | Every trackable system, account and character level, including boolean and tier ones |
| Goal kinds | One entry, or every entry of a system / group. Users only ever see "goal"; the words "rule" and "fixed" stay in code |
| Where goals are added | On the pages themselves, through one header button per page (`Add goal`, or `Goals 2/5` with a page summary). No per-entry icons (2026-10-20). No add UI on the dashboard |
| Popover | One shared `GoalPopover` for every page, assembled from parts the system's descriptor switches on. No per-page popovers |
| Dashboard | Goals section to view and manage (edit, remove, clear reached), plus import / export |
| Material tracker | Merged into goals |
| Reached goals | Stay green at the bottom of their group until the user removes them |
| Page traffic | Goal rows stay thin (status + link); every row links to its page; GA events |
| Storage | localStorage only (the site has no cloud user storage) |
| Sharing | JSON file export / import (merge or replace, character mapping); links later |
| Release | Feature branch `feat/dashboard-goals` on a Vercel preview URL; prod only after approval |

## Research summary

Four research passes (2026-10-20) covered the parsed account, the existing infrastructure, and
prior art from other game tools.

**Inventory: about 155 trackable collections.**

| Bucket | Share | Examples | Cost |
|---|---|---|---|
| Direct | ~35% | prayers, atoms, upgrade vault, guild bonuses, divinity, legend talents, research grid, sushi, jelly, minehead, star talents, post office | descriptor only |
| Small adapter | ~35% | stamps and bubbles (nested), talents (`baseLevel` vs `level`, max -1), grimoire / compass / tesseract (max in `x4`), armory (999 = uncapped), meals and buildings (cap from a helper), cards (re-key), statues (rawName changes with tier), skills (keyed object), summoning (grouped by colour), items (sum stacks) | descriptor + 3-10 line function |
| Boolean / tier | ~20% | artifacts (tier 0-6), slab, gallery, bribes, constellations, jade emporium, unlocks, speedrun difficulty | metric with max 1 or max = tier count |
| Awkward | ~10% | hole caverns (numbers stored as formatted strings), stickers and gallery (positions shift), beanstalk (built in the page), menagerie missions (moving requirement), obols / equipment (no numeric progress) | case by case, may stay out |

**Rules the inventory forces:**
- Keys come from game indexes (`originalIndex`, `index`, `talentId`) or a stable `rawName`. Never a
  position in a filtered or sorted array (`liveEntries`, gallery sort, jade sort, stickers), never a
  display name.
- Max is usually the *current* cap (stamps, divinity, legend talents, farming, atoms, vault) and grows
  with other upgrades. Max is computed live, never stored. A target above the current cap is allowed.
- Placeholder caps are not caps: masterclass `x4` 999999, armory `maxLevel >= 999`, summoning 9999,
  spelunking 99999, gem shop 100000, sushi `Infinity`; also a cap of 0 (stamps without a save value).
  Descriptors return `null` (uncapped) for those, so "Max" targets and "every entry maxed" only count
  real caps.
- Some entries carry several numbers (pets: level / shiny / breedability; sigils: tier / charge;
  boats: three levels). Each number is a named metric.

**Existing infrastructure:**
- Wiki entity graph (`data/entity-graph.json`, 97 kinds, ~7.6k nodes, ids `kind:rawName`) gives names,
  icons and wiki URLs, but no link to the player's value, ids that differ from the parser's for some
  kinds, missing caps, and a 1 MB search index. Considered as the backbone and rejected: goals are
  read from the parsed account and link to account pages, so the graph is not used at all.
- Material tracker (`pages/tools/material-tracker.jsx`, localStorage `material-tracker`) is the only
  existing user goal that feeds a dashboard alert (`utility/dashboard/account.js:104-127`).
- `alertMeta.js` already maps ~149 trackers to page routes.
- The bubbles page's `bubblesGoals` state is dead code (setter never called): remove it.
- Account identity in practice: `state.uid` on cloud login, else `characters[0].name`
  (`useBossRespawns` precedent).

**Prior art worth copying:** OSRS Goal Planner (typed goal + per-type auto tracker, add goals in
context), Wise Old Man (threshold templates for "all X at Y"), Teamcraft (grouping, hide when done),
Paimon.moe (pitfall: stored snapshots go stale). Also: version the goal schema from day one, show a
visible "no longer exists" state for removed entities, and never let goal values disagree with the
pages.

## Architecture

```
utility/goals/
  registry/index.js          list of all descriptors
  registry/<system>.js       one descriptor per system
  resolve.js                 goal + account + characters -> view row
  evaluate.js                many-entry goal evaluation (met / total, shortest list)
  store.js                   load / save / per-account keys / schema
  importExport.js            JSON file format, validation, merge
  migrateMaterialTracker.js
components/goals/
  GoalPopover.jsx            the one popover, built from parts
  parts/                     AppliesTo, EntrySearch, CharacterPicker, MetricChips,
                             TargetInput, QuickSteps, TierSelect, Preview
  AddGoalButton.jsx          page header button
  useGoals.js                read / write goals for the loaded account
components/dashboard/goals/
  Goals.jsx                  dashboard section
  GoalRow.jsx
  ImportDialog.jsx
```

### Descriptor

```js
{
  system: 'bubble',                 // stable id of the system
  label: 'Bubbles', entryLabel: 'bubble',
  scope: 'account' | 'character',
  route: '/account/world-2/bubbles',
  groups: { label: 'Cauldron', of: (row) => row.cauldron, names: {...} },   // optional
  list: (account, character?) => rows,
  key: (row) => row.bubbleIndex,    // stable key
  name: (row) => ..., icon: (row) => 'data/aUpgradesO0',
  metrics: {
    level: {
      label: 'Level',
      value: (row, ctx) => row.level,
      max: (row, ctx) => null,          // null = uncapped (also for placeholder caps)
      percentOfMax: (row, ctx) => ...,  // optional, enables % targets
      tiers: ['None', 'Base', ...],     // optional, tier metrics
      boolean: false,                   // optional, own / unlocked
      steps: [100, 1000]                // optional quick-step chips
    }
  }
}
```

Most direct systems are a dozen lines. Awkward systems use plain functions inside the same shape.

### Goal record

```js
{
  v: 1,
  id: 'uuid',
  kind: 'entry' | 'all',      // internal only, never shown
  system: 'bubble',
  scope: 'account' | { char: 'CharName' },
  key: '_0',                  // entry goals
  group: 'power',             // optional, 'all' goals limited to a group
  metric: 'level',
  op: '>=' | '<=',
  target: 6930,               // 'max' allowed when the metric has a max
  unit: 'value' | 'percentOfMax',
  note: '',
  createdAt: 1760000000000
}
```

Storage: localStorage `goals` = `{ schema: 1, accounts: { [uid ?? firstCharName ?? 'demo']: Goal[] } }`,
read and written through one `GoalsProvider` (`useLocalStorage`) in `_app`. Goals are hidden on
`?profile=` views (someone else's account) and for empty accounts. Cap: 200 goals per account, plus
up to 2000 item goals counted separately (material tracker users can have hundreds of greenstack
entries). The NavBar decides whether to show "Add goal" from a data-free route list and loads the
button lazily, so pages without goals never download the registry or parsers.

### Resolution

`resolve(goal, account, characters)` returns
`{ name, icon, value, max, target, progress (0-1), status: 'ok' | 'reached' | 'missing', route }`.
- `missing`: the system, character or key no longer exists. The row says so and offers remove.
- `percentOfMax` goals compare the metric's `percentOfMax`, not the raw value.
- `target: 'max'` follows the live max (a cap raised by another upgrade moves the goal with it).
- `<=` goals (storage cap style) are reached while the value stays at or below the target.
- `all` goals evaluate every row of the system or group: `met / total` plus the rows still short
  (5 shown + "and N more").

## Page UI

Goals are added and viewed from one place on each page: the header button (decided 2026-10-20,
replacing per-entry icons). Pages need no edits; a system only needs a descriptor and its route.
Icon: tabler `target-arrow`. No `▶` in UI copy: progress reads `current / target`.

### Header: `AddGoalButton`

Rendered once in the shared NavBar next to "Pin this page" on every page that has a registered
system (it reads the route).

- No goals on this page: `Add goal`. Opens `GoalPopover` with nothing pre-selected. Pages with
  several systems (e.g. Hole) show a system selector as the first popover part; per-character
  systems show the character picker.
- Goals on this page: `Goals 2/5` (reached / total for the page's systems, account scope plus every
  character). Opens the page summary panel:
  - header `Goals on this page` with an `Add goal` button (opens `GoalPopover` as above)
  - one row per goal: entry icon, name (with the character name for character goals),
    `current / target` or `met / total`, progress bar; reached rows green, after open ones
  - a row click opens that goal's goal card: entry name, system entry label, metric label with
    `current / target` (or tier name / `Own it`) and a progress bar, `Edit` (opens `GoalPopover`
    editing the goal) and `Remove`
  - footer link `All goals on the dashboard`

The dashboard's expanded group rows keep a small target-arrow icon per entry to give that entry its
own goal (opens `GoalPopover` pre-set to it).

### `GoalPopover`: one component, parts switched on by the descriptor

| Part | Shown when the system... | Examples |
|---|---|---|
| System selector | the page has several systems | Hole, Sailing |
| Applies to: one / all / a group | always; group only if `groups` exists | bubbles (cauldron), stamps (category), talents (tab) |
| Entry search (page-scoped) | "one" is selected | every system |
| Character picker | is per-character and the page shows several characters | talents, skills, post office |
| Metric chips | has more than one metric (incl. % of max) | bubbles, pets, boats |
| `>=` / `<=` + number | the metric is numeric | most systems |
| Quick steps ("Max", "+5", "90% = Lv 11,880") | max exists / `steps` / `percentOfMax` | grimoire, prayers, bubbles |
| Tier select instead of a number | the metric has `tiers` | artifacts, sigils, speedrun |
| Preview ("212 of 280 already there; lowest...") | applies to all or a group | any system |
| Remove | the goal exists | any system |

A system that needs something these parts can't do gets a new shared part, never a one-off popover.
Validation: targets above an absolute max are rejected, % must be below 100.

## Dashboard UI

- New "Goals" toggle beside Account / Characters / Timers, on by default (existing users with a saved
  filter list get it added once).
- Grouped by system; character goals grouped under the character name.
- Row: icon, name, progress bar, current then target (or `met / total`), link to the page.
  No costs or how-to-reach details on the row.
- Actions: edit target (same `GoalPopover`), remove, "Clear reached".
- Goals that cover many entries (all / group) expand. Collapsed: the row plus
  `Closest: a, b, ... · and N more` (5 entries). Expanded: every entry still short, closest first,
  each with progress and its own target icon (promotes it to an individual goal), a search box, and
  50 rows at a time with a link to the system's page for the full list.
- Header actions: Import, Export.
- Empty state: "Add goals from any page with the target icon", with links to a few common pages.

## Material tracker merge

- One-time migration on first load: each `material-tracker` entry becomes item goals
  (`lowerBound` -> `>= lower`, `upperBound` -> `<= upper`, note kept, `includeNearly` -> goal field
  `nearAlert: true`). An entry with neither bound becomes a `watch: true` goal (shows the count
  only, never "reached"). The old key stays for two releases so a rollback keeps working. The old
  tracker is global, so its entries migrate into the first real account that opens the dashboard
  or the material tracker page; the demo account gets a copy for the session but does not consume
  the migration.
- **Greenstacks are one goal.** A `greenstack` system lists every greenstackable slab item (same
  flags as the slab page) with value = owned amount capped at 10M, or 10M once the game has
  registered the greenstack. "Track missing greenstacks" adds one goal, "greenstack every item",
  shown as `812 of 1,560` and expandable to every item still short, closest first. "Track my
  greenstacks" keeps adding per-item goals. The migration folds old "track missing" entries (lower
  bound exactly 10M, no upper bound, no note, greenstackable item) into that one goal instead of
  hundreds of item goals. The dashboard material alert shows it as `N greenstacks to go` with the
  5 closest items.
- `/tools/material-tracker` becomes the item goals page: the shared `AddGoalButton` (entry search over
  the item catalog) plus a list of item goals, so bookmarks keep working.
- The existing dashboard material-tracker alert reads from goals.
- Item value: chest + character bags + forge, counted exactly as the material tracker does today
  (`getAllItems` + `findQuantityOwned`).

## Import / export (JSON file)

Goals store definitions only, so a shared list is recomputed against the importer's own account.

- **Export**: downloads `idleon-goals-YYYY-MM-DD.json`:
  `{ format: 'idleon-toolbox-goals', schema: 1, exportedAt, goals: Goal[] }`. Character goals keep
  `scope.char` plus a `classIndex` hint.
- **Import**: file picker, then a review dialog:
  - summary: "12 goals: 9 account, 3 character";
  - merge into current goals (default) or replace them;
  - character goals: map each exported character to one of the importer's characters (pre-selected
    by matching name, then class), or skip;
  - identical goals (same system, scope, key, group, metric, op, target) are not duplicated on merge;
  - `id` and `createdAt` are regenerated.
- **Validation**: wrong `format`, newer `schema`, or invalid JSON shows an error and imports nothing.
  Goals for unknown systems or keys are kept and shown as "no longer exists" (a list made on a newer
  game version must not lose entries); the dialog reports how many.
- The caps apply after merge; the dialog says how many were left out.
- Old material tracker export files are accepted and imported as item goals.

## Analytics

GA events: `goal_click` (`system`, `kind`) on dashboard row links; `goal_added` / `goal_removed`
(`system`, `kind`, `source`: `header` | `entry` | `import`). Lets us compare page views per session for
users with goals against users without.

## Testing

- **Descriptor contract test** (vitest, test save fixtures): for every descriptor, keys are unique and
  non-empty, values are finite numbers, icons exist under `public/data` or `public/etc`, routes exist
  in `PAGES`. A game update that breaks a descriptor fails CI instead of breaking user goals. Also
  checks that every route with a descriptor renders `AddGoalButton` (registry is the page checklist).
- Unit tests: `resolve` (ok / reached / missing, `<=`, percent, `'max'`), `evaluate`, the store
  (schema, per-account keys), the material tracker migration, import / export (round trip, merge
  dedupe, character mapping, rejected files).
- Browser check on `?demo=true`: add from header and from an entry, edit, reach, remove, "all" goal,
  boolean one-click, tier select, character page, material tracker page, import / export, mobile tap.
- Existing gates still apply: `empty-account.test.js` (pages render logged-out; goal UI hidden with no
  account), `e2e/hydration.spec.js` (goal state read after mount only), `e2e/chunk-audit.spec.js`.

## Feedback round 1 (2026-10-21)

Approved by the user after a review plus four persona tests. These override earlier sections where they differ.

Popover
- Direction is a select: `At least` (default) / `At most`. Quick steps hide for `At most`.
- Applies-to labels are short (`One`, `All`, `By <group label>`), with one helper sentence under the toggle explaining the choice. Group options and the system select show icons; the system select shows entry counts.
- The popover preselects the system that matches the active page tab (a tab-to-system map next to `GOAL_ROUTES`), anchors right so it does not cover the page header and tabs, marks entries that already have a goal, and says `250 of N, type to filter` when the list is capped.
- Stamps have no max (`maxLevel` is the gold cap, raised with materials). Tier selects never offer `None` / `Locked` as targets and use the page's tier wording.
- Save shows a snackbar `Goal saved` with `View on dashboard`. The header keeps an `Add goal` action even when the page has goals, next to the goals count.

Rows (header panel, goal card, dashboard)
- Every row states direction and unit: `At least Lv 100 · 38 / 44`, `At most 10 · 2,052`, `Reached` with a check. A lower and upper item goal on the same entry render as one range row (`500K - 5M`).
- Thin 4px progress bar with a percent; on phones the progress text sits under the name and icons get a fixed column with 40px+ targets.
- Remove and `Clear reached` offer Undo (snackbar). `Closest` lists the nearest unmet entries.
- Clicking an all/group row expands it; the expanded list scrolls inside a fixed height.

Dashboard
- Goals is the first dashboard section, with a summary strip (`n goals · m reached · closest: ...`), two columns on desktop.

Material tracker
- One-time migration notice (`N greenstack entries merged into All greenstacks`, option to keep them as separate item goals). Greenstack list collapsed by default; bounds and note fields belong to `Track my greenstacks`; one line explains slab goals vs item goals.
- Export / import on the tracker page, with an item-goals-only export. Material alert does not say "nearly" when the value is far past the bound.

Slab
- No single-item slab goals (item goals cover quantities). Slab keeps `All` / `By category` and its header totals.

Coverage
- "Page totals": each page with header summary numbers registers a `<page> totals` system whose entries are those numbers (e.g. Research level, observations found, discoveries 77/105, unique sushi, total upgrade levels, opals invested). Each entry is one value with an optional max.
- New systems from the coverage audit: pages without a goal button (Beanstalk, Advice Fish, Zenith Market, Speedrun), Divinity (Coral Kid moved here, Singularity, god rank), Rift skill and construct mastery, Sneaking ninja mastery, the Hole caverns, and the remaining audit list. "Land ranks" is labelled "Rank database".

## Goal rows redesign (2026-10-22)

Approved by the user after research and three persona reviews (`.superpowers/sdd/2026-10-21-goals-feedback/card-redesign/`). Overrides the card grid of feedback round 1.

Layout
- Default view: compact rows, 38px fixed height, 2 columns on desktop (1 under ~900px). Fixed slots: icon, name (+ note icon) with one muted system line, value, bar, percent. Value and bar sit at the same x in every row.
- A `Rows` / `Cards` toggle beside the sort chip (stored with `useLocalStorage`). Cards use the same fixed skeleton: 78px tall, `minmax(200px, 1fr)`, three rows (name + system, value, bar + caption).
- Actions never cover content: rows expand in place on click/tap (details, note, `Next up` list, Edit, Open page, Remove); cards keep a reserved action slot instead of overlaying the name.
- Meta collapses to one line: the system label only. Metric wording (`Best`, `Max quantity`, `At least Lv 151`) moves into the title for all/group goals or into the expanded view.

Copy per goal type
- Level/number: `Lv 11 of 102`, `449,924 of 500,000`, percent.
- Tier: current tier name, step bar (`5/6`), caption `Goal: Verisimilitude`. Never two tier names side by side.
- Boolean with a currency cost (e.g. bribes cost coins): progress toward the price, `1.2M of 5M coins`, bar and percent; reached reads `Bought`. Descriptors opt in with a `cost` on the boolean metric.
- Boolean without a cost: empty circle and `Not bought yet` / `Not unlocked yet` / `Not owned yet` (by descriptor verb); reached `Bought` / `Unlocked` / `Owned`. No bar, no `Own it`.
- Watch: amount only, muted `Tracking`.
- All/group: `1 of 74 done`, caption `Next up: Apple Lv 148` (nearest unmet with its value).
- Missing: same skeleton, `No longer in the game`, `Remove` always visible.
- Note: note icon on the row; full text in the expanded view.

## Out of scope

- An add-goal search on the dashboard (revisit if testers ask).
- Cloud sync of goals.
- Share links and share codes (URL hash), and short links via a Cloudflare worker. Same export format
  when added later.
- Material roll-up (cost of all goals summed against storage).
- Notifications when a goal is reached.
- Recurring (daily / weekly) goals.

## Release

Branch `feat/dashboard-goals`, Vercel preview URL shared with testers; merge to main only on explicit
approval. Patch note proposed at merge time.
