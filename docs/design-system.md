# Design system

The rules that keep every page looking like one site. Read this before building or changing UI.

**What wins:** the code and its tests come first, then this file, then the design boards. Values live in code, so this file points at them instead of copying them. A change to a rule updates this file in the same commit. The boards are synced from the code afterwards, and show the current design only.

**Before you build:**
- Open the nearest sibling page and copy how it does things. `pages/account/world-1/stamps.jsx` is a good full example.
- Use a shared piece from the table below. If it can't do what you need, extend it. Don't build a second one beside it.
- A new look or layout is a design decision: show the owner a mock first, and write code on their word.

## A page, top to bottom

1. **Frame** (`components/common/NavBar/frame.js`): the page and its side ads as one centred group. The top bar is 56 px, with Worlds, Account and Tools. A menu's panel (`NavMenu.jsx`) stays inside the page's column: Worlds fills it, while Account and Tools centre on the button that opened them, pushed in only as far as the column's edge. Below 1200 px wide the nav is behind the burger, so words on the page can't say "top bar" there.
2. **Page header** (`components/common/NavBar/PageHeader.jsx`): the title, then Pin, Add goal and Page settings at the right. Below 900 px, on a page in a group, the buttons sit on the line above the title, so the title has the whole width. A page with no group keeps them on the title's row while they fit.
3. **Summary:** the page's main numbers in `PageSummary`.
4. **Tabs:** `Tabber`.
5. **Toolbar:** search, filter, sort and view for what's below it.
6. **Content:** cards, tiles, tables and panels.

## Where things go

| You need | Use | Don't |
|---|---|---|
| A setting that changes the page's numbers | `PageSettings` (`.Toggle`, `.Number`, `.Select`, or `.Action` to start a mode on the page), under a `.Group` named after its tab, even if only one tab reads it. Keep the stored key when moving one. It docks open under the header on a desktop, remembered per page, and is a sheet on a phone | A loose switch or number field above a tab |
| Search, filter, sort, view | `Toolbar` (`.Search`, `.Show`, `.Filter`, `.Sort`, `.View`; `.Lead` for a page's own control that stays in the row, `.Panel` for its own phone panel; `.Show multiple` when players combine options, a box per row, as Stamps' states) | Page settings |
| A calculator's inputs, changed each try | `Panel.Inputs`, on the tool's own tab | Page settings |
| A page-wide picker (a character, a world) | `PageHeaderControl` | A control in the content |
| One number and its label | `StatTile`: inside `PageSummary` for the page's main numbers, in a plain `Stack` for a tab's own | A custom box |
| A titled box round a list, table, chart or form | `Panel`: the title lives in its header | A heading above one card. A `sectionTitle` over a whole grid of cards is fine |
| A thing with rows of details | `ItemCard` in a `CardGrid`, size S, M or L. At its `level`'s max it reads Maxed and drops its cost by itself. Its secondary rows (next milestone, time to charge) go in `more`, which shows while the page's Details pill (`Toolbar.Filter display`, passed as `CardGrid details`) is on. A few cards that should never leave one alone on a row (Bubbles' four cauldrons) take `CardGrid evenRows`: four across where four fit, then two, then one | A width on a card: the grid sets it. A cost past the cap |
| A sprite and one number, scanned at a glance | `IconTile` in a `CardGrid`. A collection whose sprites need their names (hats, companions) gives each tile a `label` in a `CardGrid fill={LABELED_TILE_MIN}`, the rest in its note. In a sheet, a tile whose sprite is all it says (talents, skills, obols, equipment) takes `iconSize={40}`; a game border that goes over the sprite (a super talent's) is `frameAbove`. A rank 1 to 3 badge wears the podium's medals (`badgeColor`, `identity.leaderboard`); a sprite the game data marks (a re-rolled obol) takes `glow`; a thing that fills toward its next level (a shrine's EXP) takes `progress`, 0 to 1, a bar along the tile's foot, with the numbers in its note. A collection in a narrow card can pack 5 to a General column with `CardGrid fill={48}` (Statues, Shrines), its corner mark at `markSize={20}`; a grid whose tiles carry no number takes `height={56}` (the family obol board). A collection of numberless sprites inside an `ItemCard` (Lore bosses' discoveries) takes 40 px tiles with a 32 px sprite, `height={40} iconSize={32}` in `CardGrid fill={40}`, 4 px apart: six to a row in an M card. A value of seven characters (193,075) draws at 11 px in a tile under about 58 px, five to an M card. A grid whose count is the game's (Bubbles' five a row) takes `columns` with `fill`, so its tiles share the row on a wide screen instead of stopping at 72 px | A custom grid. A card per item of a long collection |
| A table | `DataTable` (`components/common/DataTable/index.jsx`). Past rotations and Obols keep their own on purpose | A raw MUI table |
| A chart | `components/common/charts/`, with `seriesColors` | A colour picked by hand. Series slots go in order and never cycle: a ninth is Other |
| A game sprite | `GameIcon`, at 16, 24, 32, 40 or 56. 20 and 28 only for a shared piece's small or sheet form (`IconTile`, `Panel`, `SectionTabs`) | Any other size, or `image-rendering: pixelated`: it distorts the art |
| A state (Ready, Locked, Purchased) | `StatusText`: a word in its tone, with that tone's glyph (`selected` has none). On an `ItemCard`, something got for good (Owned, Purchased, Found, Created) is `done`: the word and its ✓, no edge. `active` and its green edge are for what is running now (In use, Equipped, Your turn). The preset the game has in use carries a green dot: `InUseDot` (`components/characters/InUseDot.jsx`) beside its word in a switch, centred under its tab for a sprite-only tab (card presets), never on the sprite, with "in use" in its name | A chip, or colour alone. A green edge on a card that is merely owned: a late account's grid turns all green |
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
