# Design system

The rules that keep every page looking like one site. Read this before building or changing UI.

**What wins:** the code and its tests come first, then this file, then the design boards. Values live in code, so this file points at them instead of copying them. A change to a rule updates this file in the same commit. The boards are synced from the code afterwards, and show the current design only.

**Before you build:**
- Open the nearest sibling page and copy how it does things. `pages/account/world-1/stamps.jsx` is a good full example.
- Use a shared piece from the table below. If it can't do what you need, extend it. Don't build a second one beside it.
- A new look or layout is a design decision: show the owner a mock first, and write code on their word.

## A page, top to bottom

1. **Frame** (`components/common/NavBar/frame.js`): the page and its side ads as one centred group. The top bar is 56 px, with Worlds, Account and Tools. Below 1200 px wide the nav is behind the burger, so words on the page can't say "top bar" there.
2. **Page header** (`components/common/NavBar/PageHeader.jsx`): the title, then Pin, Add goal and Page settings at the right. Below 900 px the buttons sit above the title.
3. **Summary:** the page's main numbers in `PageSummary`.
4. **Tabs:** `Tabber`.
5. **Toolbar:** search, filter, sort and view for what's below it.
6. **Content:** cards, tiles, tables and panels.

## Where things go

| You need | Use | Don't |
|---|---|---|
| A setting that changes the page's numbers | `PageSettings` (`.Toggle`, `.Number`), under a `.Group` named after its tab, even if only one tab reads it. Keep the stored key when moving one | A loose switch or number field above a tab |
| Search, filter, sort, view | `Toolbar` (`.Search`, `.Show`, `.Filter`, `.Sort`, `.View`) | Page settings |
| A calculator's inputs, changed each try | `Panel.Inputs`, on the tool's own tab | Page settings |
| A page-wide picker (a character, a world) | `PageHeaderControl` | A control in the content |
| One number and its label | `StatTile` inside `PageSummary` | A custom box |
| A titled box round a list, table, chart or form | `Panel`: the title lives in its header | A heading above a card |
| A thing with rows of details | `ItemCard` in a `CardGrid`, size S, M or L | A width on a card: the grid sets it |
| A sprite and one number, scanned at a glance | `IconTile` in a `CardGrid` | A custom grid |
| A table | `DataTable` (`components/common/DataTable/index.jsx`) | A raw MUI table |
| A chart | `components/common/charts/`, with `seriesColors` | A colour picked by hand. Series slots go in order and never cycle: a ninth is Other |
| A game sprite | `GameIcon`, at 16, 24, 32, 40 or 56 | Any other size, or `image-rendering: pixelated`: it distorts the art |
| A state (Ready, Locked, Purchased) | `StatusText`: a glyph and a word | A chip, or colour alone |
| A note beside text | `InfoButton`, or `NoteTrigger` for a value with a dotted underline | A tooltip on plain text, or MUI's Tooltip |
| How a number was made | A breakdown (`components/common/Breakdown/Breakdown.tsx`): values grouped under the game's names | Formula text |
| A message on the page | `Notice` | A custom alert |
| A short confirmation, with Undo if it helps | `notify` (`components/common/Overlays/notify.js`) | Rendering a Snackbar |
| A dialog | `AppDialog`: S a confirm or one field, M forms and pickers, L a list to review. On a phone it's a sheet, `tall` or `full` | A raw MUI Dialog |
| A link that leaves the page, on a name | `LinkMark`, the `›` after the name | A name that gives no sign it's a link |
| A section that failed to load | `MissingData` with `atZero`: the catalog at zero under one note | A blank tab, or a guessed number. A failed number reads `-` |
| A system the player hasn't reached | `NotReached` | Reading zeros |
| An icon | Tabler outline icons (`@tabler/icons-react`). A custom icon goes in `public/etc`, never `public/data`, which each game update wipes | Mixing icon sets |

## Colour

- **Ask for a role by its job:** a role name in `sx` (`text.secondary`, `background.paper`), or `(theme.vars || theme).palette` in a function. Roles are in `styles/theme/theme.js`.
- **Status:** words take `text.success` and its kin; fills and edges take `success.main`. Never `success.light` or `success.dark`.
- **A thing's own colour** (a game's stat, tier or font colour) goes in `palette.identity`. Words in a game colour get a darker shade in light, at 5.5:1 on the page (`lightIdentity`); dots, edges and pictures keep the game's colour.
- **A picture of something** that looks the same in both schemes goes in `utility/colorSets.js`.
- **Text** is at least 4.5:1 on its surface, in both schemes.
- **Locked, not found, not reached:** the whole card at `DIM` (`components/common/cards/tokens.js`). Nothing else changes.
- **After changing the theme:** `npx vitest run __test__/theme-vars.test.js -u` regenerates `styles/theme/theme-vars.css`, the one file that holds the theme's variables. Every page used to carry its own copy, and the export passed GitHub Pages' 1 GB limit.
- **The one exception** is the What's new story (`components/common/WhatsNew/story.module.css`): each slide wears a World's colours on purpose, and it uses its own font. Nothing else does.

## Type

Variants, from `styles/theme/theme.js`: `pageTitle`, `sectionTitle`, `cardTitle`, `groupLabel`, `value`, `heroValue`, plus MUI's `body2` and `caption`. Never `h1` to `h6` as a variant; pick the look and set `component` for the heading level.

## Surfaces and controls

- **Cards:** `cardSurface` (`components/common/cards/tokens.js`): the card colour, a divider edge, 8 px corners, no shadow. Padding and minimum widths per size are in the same file. Pages never read these tokens directly.
- **Anything that floats** (menus, dialogs, tooltips) gets the theme's floating look: the same surface, plus one shadow.
- **Control height:** 32 px in content, 40 in toolbars and forms, 44 on a touch screen (`touchTarget`).
- **Focus:** one ring, `focusRing`: 2 px primary, keyboard only.
- **Typed fields:** 16 px text on a phone, or iOS zooms the page.

## Numbers

- **The rule:** below 1M a number shows the decimals it has. From 1M up, the game's short form. Costs, requirements and counts stay whole, as the game prints them. There's no setting for this.
- **On a page:** `Num` (`components/common/Num.jsx`) with a kind from `formatNum` (`utility/helpers.js`): `amount`, `whole`, `mult`, `pct`, `price`, `exact`, `level`, `odds`, `rate`. For a stat the game has a rule for, `game="Block.Key"` (`formatGame`, `utility/gameNotation.js`).
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

**Nothing checks these, so they rely on whoever writes the code:** which row of the table a control belongs in; no chips for states; no tooltip on plain text; no `image-rendering: pixelated`; which number kind to use; no em dashes in new words; whether a page looks like its board.

## The boards

[Design canvas](https://claude.ai/artifact/MtXexJGcUTA5ffHpwnCPD6): the picture of this system. It's a mirror, so it follows the code and never the other way round. It shows the current design only, with no "today" against "suggested".
