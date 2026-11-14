# Design system

The rules that keep every page looking like one site. Read this before building or changing UI.

**What wins:** the code and its tests come first, then this file, then the design boards. Values live in code, so this file points at them instead of copying them. A change to a rule updates this file in the same commit. The boards are synced from the code afterwards, and show the current design only.

**Before you build:**
- Open the nearest sibling page and copy how it does things. `pages/account/world-1/stamps.jsx` is a good full example.
- Use a shared piece from the table below. If it can't do what you need, extend it. Don't build a second one beside it.
- A new look or layout is a design decision: show the owner a mock first, and write code on their word.

## A page, top to bottom

1. **Frame** (`components/common/NavBar/frame.js`): the page and its side ads as one centred group. The top bar is 56 px, with Worlds, Account and Tools. A menu's panel (`NavMenu.jsx`) stays inside the page's column: Worlds fills it, while Account and Tools centre on the button that opened them, pushed in only as far as the column's edge. A mouse resting 200 ms on a menu's button opens it; a click, a tap or Enter opens or closes it, except that a click within 600 ms of the menu opening never closes it (the habit click lands just after the rest opened it). A menu the mouse opened also closes when the mouse leaves both; a tap's or a key's stays until pressed again or a click away. The three menus work alike: no bar item navigates where its neighbours open a menu. A menu's page links are 15 px beside 24 px sprites on 30 px rows where the window is 1440 by 836 or more, 14 px beside 18 px sprites below that, so the sprites can be made out; there is no size setting, since browser zoom is one. Below 1200 px wide the nav is behind the burger, so words on the page can't say "top bar" there.
2. **Page header** (`components/common/NavBar/PageHeader.jsx`): the title, then Pin, Add goal and Page settings at the right. Below 900 px, on a page in a group, the buttons sit on the line above the title, so the title has the whole width. A page with no group keeps them on the title's row while they fit.
3. **Summary:** the page's main numbers in `PageSummary`.
4. **Tabs:** `Tabber`.
5. **Toolbar:** search, filter, sort and view for what's below it.
6. **Content:** cards, tiles, tables and panels.

## Where things go

| You need | Use | Don't |
|---|---|---|
| A setting that changes the page's numbers | `PageSettings` (`.Toggle`, `.Number`, `.Select`, or `.Action` to start a mode on the page), under a `.Group` named after its tab, even if only one tab reads it. Keep the stored key when moving one. It docks open under the header on a desktop, remembered per page, and is a sheet on a phone | A loose switch or number field above a tab |
| Search, filter, sort, view | `Toolbar` (`.Search`, `.Show`, `.Filter`, `.Sort`, `.View`; `.Lead` for a page's own control that stays in the row (`beforeSearch` puts it ahead of the search when the search narrows what it picks: Quests' character switcher; `ownRow` gives a wide one its own line on a phone, where a View beside it squeezed it: Exotic Rotation's upgrade field), `.Panel` for its own phone panel; `.Show multiple` when players combine options, a box per row; `.Show multiple pills` when they are a few short options flipped often, a pill each in the bar and the box list in the phone panel, as Stamps' states: they take the row's free width and wrap inside it, the View staying at the row's end. `.Show pills` without `multiple` for a pick-one set the old page had as radio buttons (Pets' Tradable and Missing): a click swaps the pill on, a click on the lit one shows everything again, no pill is "All", and the pills keep one line, the row wrapping before they split. Keep one pill per option the old page had, rather than merging them to save a line, and leave out a pill with nothing in it unless it's picked (Stamps' Over carry capacity at the reducer's cap). An option's fifth entry is a colour role, a dot before its label, where the options are the legend of a colour on the page. `.View phone={false}` when the views look the same at a phone's width, as Stamps' Columns and Rows. Name views for what they show ("Columns", "Rows"), never with a word the game uses for something else ("Stacked") | Page settings |
| Which characters a list is for (one, several or all) | `CharacterSelect` (`components/characters/CharactersList.jsx`) in a `Toolbar.Lead`: the Characters page's switcher on the page's own pick, kept in its toolbar state, as Quests | A `Toolbar.Show` of names; the app-wide `CharactersPicker`, which is the Characters page's |
| A calculator's inputs, changed each try | `Panel.Inputs`, on the tool's own tab | Page settings |
| A page-wide picker (a character, a world) | `PageHeaderControl`. A picker players switch with all the way down a long page (the characters picker) leads its pinned `Toolbar` instead, as `.Lead` | A control in the content |
| One number and its label | `StatTile`: inside `PageSummary` for the page's main numbers, in a plain `Stack` for a tab's own | A custom box |
| A titled box round a list, table, chart or form | `Panel`: the title lives in its header | A heading above one card. A `sectionTitle` over a whole grid of cards is fine |
| A thing with rows of details | `ItemCard` in a `CardGrid`, size S, M or L. At its `level`'s max it reads Maxed and drops its cost by itself. Its secondary rows (next milestone, time to charge) go in `more`, which shows while the page's Details pill (`Toolbar.Filter display`, passed as `CardGrid details`) is on. A pill earns its place only when it hides several rows and the page grows by a lot with it on (Pets, Sushi Bonuses: 30% and more): one or two short rows go straight in the card (Research Grid, Hole Study, Summoning and Spelunking Upgrades). A few cards that should never leave one alone on a row (Bubbles' four cauldrons) take `CardGrid evenRows`: four across where four fit, then two, then one. Cards players compare part by part (Outposts' rates and rank bars) take `CardGrid alignRows`, the most parts any card draws: each card is a subgrid, so a part that wraps on one card moves the same part down on its neighbours and every row stays level. A grid that mirrors a game screen's paging stops there with `CardGrid maxColumns`, its cards growing instead (the dashboard's characters: 6 across, as the character select pages them). A collection whose items each carry a bonus players read (Pets) is S cards, not labelled tiles: the bonus as the meta line under the name, the count as `aside` ("x6"), the fact rows in `more`. A row the page's filter or sort is about stays out of `more` (Pets' tradable copies under Tradable, the date while sorted by it), and a fact about something other than the item (when the Pet Mart last sold it) is the `footer`, under its line at the card's foot | A width on a card: the grid sets it. A cost past the cap |
| A sprite and one number, scanned at a glance | `IconTile` in a `CardGrid`. A collection whose sprites need their names (hats, companions) gives each tile a `label` in a `CardGrid fill={LABELED_TILE_MIN}`, the rest in its note. Names that differ only at their end (Tournament companions' "Bronze Champion Ram" and "… Troll") take `labelLines={3}`, on tiles with no note: only a row holding a three-line name grows, its values at the tiles' foot. In a sheet, a tile whose sprite is all it says (talents, skills, obols, equipment) takes `iconSize={40}`; a game border that goes over the sprite (a super talent's) is `frameAbove`. A rank 1 to 3 badge wears the podium's medals (`badgeColor`, `identity.leaderboard`); a sprite the game data marks (a re-rolled obol) takes `glow`; a thing that fills toward its next level (a shrine's EXP) takes `progress`, 0 to 1, a bar along the tile's foot, with the numbers in its note. A bar that counts as done short of its end (Bubbles' efficiency threshold) takes `progressGoal`: a tick there, green from it on; a tile in that grid with nothing to fill takes `progress={null}`, the bar's room with no bar, so its number lines up with its neighbours'. A grid whose states players scan at a glance and act on tile by tile (Stamps: level it, wait for coins, farm the material) gives each tile `edge`, its state's tone (`success.main`, `warning.main`, `error.main`), with the page's `.Show multiple pills` as the legend and the state's word in the tile's note. Only the states a player acts on take one: a state most tiles share on a late account (Stamps' carry capacity) stays plain, or it walls the grid. A grid that mirrors a game screen keeps the game's column count (Stamps' books, 4 a row, `CardGrid columns={4} fill`), and its Panel is no wider than those tiles at 72 px: stretched to a share of a wide row, they grow past 140 px. A grid that shows one or two more numbers under each value, behind a page setting (Bubbles' "/ target"), gives each tile `sub` as a list of lines, an empty list for a tile with none, and `height` with room for the most lines any tile draws (100 for two); the lines step down to 11 px under 58 px and 10 px under 52 px. A collection in a narrow card can pack 5 to a General column with `CardGrid fill={48}` (Statues, Shrines), its corner mark at `markSize={20}`; a grid whose tiles carry no number takes `height={56}` (the family obol board). A long collection of numberless sprites across the page (the Slab's 1,938 items) takes `height={48}` tiles in `CardGrid fill={48}`, the usual 40 px sprite, its corner mark at `markSize={20}`: 22 to a row at 1920. A collection of numberless sprites inside an `ItemCard` (Lore bosses' discoveries) takes 40 px tiles with a 32 px sprite, `height={40} iconSize={32}` in `CardGrid fill={40}`, 4 px apart: six to a row in an M card. A value of seven characters (193,075) draws at 11 px in a tile under about 58 px, five to an M card. A grid whose count is the game's (Bubbles' five a row) takes `columns` with `fill`, so its tiles share the row on a wide screen instead of stopping at 72 px | A custom grid. A card per item of a long collection |
| A table | `DataTable` (`components/common/DataTable/index.jsx`). Past rotations and Obols keep their own on purpose. A table of a few columns on a wide page is as wide as its columns from lg (`width: fit-content` round it, Refinery's salts), not stretched to the page. A long list of short items with one fact each (Sailing's trades) is small cards from sm and the table on a phone, where one card a row would double its height; CSS picks one, never a media query in render. Its columns join by the room the page or card gives (`from: { room }`, measured on a container round it), never the window's width: beside one side ad the page is the window less 364 px. The least-read columns fold into the row's Details first, and `sortField` takes the `from` where the headers sort enough to drop the phone's Sort field. Things players compare across rows (Refinery's power, timers and fuel) go in the table, not in a card per row | A raw MUI table. Columns that join by the window in a page beside the ads |
| A chart | `components/common/charts/`, with `seriesColors` | A colour picked by hand. Series slots go in order and never cycle: a ninth is Other |
| A game sprite | `GameIcon`, at 16, 24, 32, 40 or 56. 20 and 28 only for a shared piece's small or sheet form (`IconTile`, `Panel`, `SectionTabs`) | Any other size, or `image-rendering: pixelated`: it distorts the art |
| A state (Ready, Locked, Purchased) | `StatusText`: a word in its tone, with that tone's glyph (`selected` has none). On an `ItemCard`, something got for good (Owned, Purchased, Found, Created) is `done`: the word and its ✓, no edge. `active` and its green edge are for what is running now (In use, Equipped, Your turn). The preset the game has in use carries a green dot: `InUseDot` (`components/characters/InUseDot.jsx`) beside its word in a switch, centred under its tab for a sprite-only tab (card presets), never on the sprite, with "in use" in its name | A chip, or colour alone. A green edge on a card that is merely owned: a late account's grid turns all green |
| A rank that moved (guilds, leaderboards) | `RankDelta`: a caret and the places, green up, red down; `caption` beside a name in a row | "up 2"/"down 1" in words, or colour alone |
| A note beside text | `InfoButton`, or `DottedValue` for a value with a dotted underline. `NoteTrigger` is what both are built on, for a note with neither look; with `INFO_SX` it wears the i's look round another 16 px glyph (a dashboard character's stats). A card's extra block goes in a note, not opened inside the card: opened, it grows every card in its row | A tooltip on plain text, or MUI's Tooltip |
| How a number was made | A breakdown (`components/common/Breakdown/Breakdown.tsx`): values grouped under the game's names | Formula text |
| A message on the page | `Notice` | A custom alert |
| A short confirmation, with Undo if it helps | `notify` (`components/common/Overlays/notify.js`) | Rendering a Snackbar |
| A dialog | `AppDialog`: S a confirm or one field, M forms and pickers, L a list to review. Sign-in's picker is L and its flows S; the cookie policy is L. On a phone it's a sheet, `tall` or `full` | A raw MUI Dialog. `DashboardSettings`, `QuickSearch`, `BuildForm`, `BuildView` and `ItemPicker` still use one: don't copy them |
| A link that leaves the page, on a name | `LinkMark`, the `›` after the name | A name that gives no sign it's a link |
| A section that failed to load | `MissingData` with `atZero`: the catalog at zero under one note | A blank tab, or a guessed number. A failed number reads `-` |
| A system the player hasn't reached | `NotReached` | Reading zeros |
| An icon | Tabler outline icons (`@tabler/icons-react`). A custom icon goes in `public/etc`, never `public/data`, which each game update wipes | Mixing icon sets. Older code still uses `@mui/icons-material`: don't copy it |
| A pinned thing | `IconPin` and `IconPinFilled` in `primary.main`. A pinned row's fill is `primary.soft` | A star, or gold: pinned has one mark across the site |

## Colour

- **Ask for a role by its job:** a role name in `sx` (`text.secondary`, `background.paper`), or `(theme.vars || theme).palette` in a function. Roles are in `styles/theme/theme.js`.
- **Status:** words take `text.success` and its kin; fills and edges take `success.main`. Never `success.light` or `success.dark`. The info tone is the exception: `Notice` and `StatusText` use `primary.main`.
- **A thing's own colour** (a game's stat, tier or font colour) goes in `palette.identity`. Words in a game colour get a darker shade in light, at 5.5:1 on the page (`lightIdentity`); dots, edges and pictures keep the game's colour.
- **A picture of something** that looks the same in both schemes goes in `utility/colorSets.js`.
- **Text** is at least 4.5:1 on its surface, in both schemes. Known misses, not to copy: dark `identity.stats` words (3.1 to 3.8:1 on a card) and dark `identity.builds.main` (4.2:1).
- **Locked, not found, not reached:** the whole card at `DIM` (`components/common/cards/tokens.js`). Nothing else changes, except `keepMeta` on `ItemCard`: a meta line that states the card's state in words stays at full strength, so it can be read.
- **Done, faded by a page's setting so the rest stands out** (Bubbles past the efficiency threshold): status `faded`, at `FADE` (0.3), further than `DIM` so it never reads as not reached. Only behind a setting the player turns on.
- **After changing the theme:** `npx vitest run __test__/theme-vars.test.js -u` regenerates `styles/theme/theme-vars.css`, the one file that holds the theme's variables. Every page used to carry its own copy, and the export passed GitHub Pages' 1 GB limit.
- **The one exception** is the What's new story (`components/common/WhatsNew/story.module.css`): each slide wears a World's colours on purpose, and it uses its own font. Nothing else does.

## Type

Variants, from `styles/theme/theme.js`: `pageTitle`, `sectionTitle`, `cardTitle`, `groupLabel`, `value`, `heroValue`, plus MUI's `body2` and `caption`. Never `h1` to `h6` as a variant; pick the look and set `component` for the heading level.

## Surfaces and controls

- **Cards:** `cardSurface` (`components/common/cards/tokens.js`): the card colour, a divider edge, 8 px corners, no shadow. Padding and minimum widths per size are in the same file. Use a shared card first. Read `cardSurface` directly only for a shape no shared card draws, as the item planner's empty state does.
- **Anything that floats** (menus, dialogs, tooltips) gets the theme's floating look: the same surface, plus one shadow. Known misses, not to copy: an Autocomplete's list in dark, and the phone sheet, which keeps MUI's own shadow.
- **Control height:** 32 px in content, 40 in toolbars and forms, 44 on a touch screen (`touchTarget`). On touch, pills and a small `ViewSwitch` stay 32, menu rows 40, and a tall sheet's rows 38.
- **Destructive buttons:** `color="error"` on a `Button`, or `danger` on an `AppDialog` action. The theme sets their colours in both schemes, so don't style them by hand.
- **Focus:** one ring, `focusRing`: 2 px primary, keyboard only.
- **Typed fields:** 16 px text on a phone, or iOS zooms the page.

## Numbers

- **The rule:** below 1M a number shows the decimals it has. From 1M up, the game's short form. Costs, requirements and counts stay whole, as the game prints them. There's no setting for this.
- **Where the game's rule differs:** a stat with a `game=` key prints by that rule, so a few keep commas past 1M (`Save.FountainMarbles`, `Save.Gems`, meal bonuses). The wiki prints commas up to a billion, then the game's short form (`utility/wiki/format-amount.mjs`).
- **On a page:** `Num` (`components/common/Num.jsx`) with a kind from `formatNum` (`utility/helpers.js`): `amount`, `whole`, `mult`, `pct`, `price`, `exact`, `level`, `odds`, `rate`. For a stat the game has a rule for, `game="Block.Key"` (`formatGame`, `utility/gameNotation.js`). For a system's own mode on amounts with no key, `system` (`SYSTEM_MODES`).
- **In a game sentence:** `gameFill`, in parsers too.
- **Time left:** `Duration` or `formatDuration`: the two largest units.
- **Dates:** `useFormatDate`: see Date & Time Formatting in `CLAUDE.md`.
- **Before changing how a number prints,** read what `main` prints for a fractional value.
- **Approved exception:** Printer tiles are whole.
- **Approved exception:** Royal Armory's outpost rank bars print their amounts short with the game's exact ones on a tap, so a rank and its numbers keep one line in a 300 px card, as the old card's did.
- **Approved exception:** Bubbles' target line under a tile prints from 10,000 in the game's short form ("/ 200K"), the
  exact level in the tile's note, so it reads at 12 px on a 50 px tile. A tile's line takes a shorter form, never a
  smaller size.

## Words

- Plain words. Say what happens, not how it's built.
- "I", never "we": this is one person's site.
- No em dashes anywhere: use a colon.
- Nothing lives only on hover: a note opens on a tap and from the keyboard too.

## Every page, both schemes, every width

- **Check** dark and light at 1920, 1366, 900 and 384 wide, as demo and as a guest: `node tools/page-check.mjs <routes> --sizes 1920,1366,900,384 --schemes dark,light`. A clean run isn't "looks right": look at the pictures too.
- **Compare with the board:** a page a board draws isn't done until it looks like the board, side by side.
- **Phones:** no sideways scroll, and dialogs and filters rise from the bottom.
- **The first render, the static export and the empty account:** the rules are in `CLAUDE.md`.

## What holds these rules

**A failing check stops these:**

| Check | Stops |
|---|---|
| `eslint.config.mjs` | Hex, `rgb()`, named colours, `grey.N`, `common.white` and `common.black`; status shades; `h1` to `h6` variants; `theme.palette` reads; `toFixed`, `toLocaleString` and `numberWithCommas` in page code |
| `__test__/theme-vars.test.js` | The shared stylesheet drifting from the theme |
| `__test__/design-system-doc.test.js` | This file naming a path that no longer exists |
| `__test__/no-nossr.test.js`, `__test__/alt-text.test.js`, `__test__/card-spacing.test.js` | `noSsr`, an image with no alt, stacked card margins |
| `e2e/hydration.spec.js`, `e2e/chunk-audit.spec.js`, `e2e/static-head.spec.js`, `e2e/no-nan.spec.js` | Hydration errors, game data on a guest's path, broken heads, NaN on a page |
| `tools/page-check.mjs` (a report, not a stop) | Low contrast, overlaps, cut words, raw game marks |

**Nothing checks these, so they rely on whoever writes the code:** which row of the table a control belongs in; no chips for states; no tooltip on plain text; no `image-rendering: pixelated`; which number kind to use; no em dashes in new words; a theme role named in `sx` that doesn't exist, which draws nothing and reports nothing; whether a page looks like its board.

## The boards

[Design canvas](https://claude.ai/artifact/MtXexJGcUTA5ffHpwnCPD6): the picture of this system. It's a mirror, so it follows the code and never the other way round. It shows the current design only, with no "today" against "suggested".

Build from this file and the code. Open the boards only to design something new or check a page's look.
