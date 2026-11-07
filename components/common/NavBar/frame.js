import { navBarHeight } from '@components/constants';

// The page frame (Layout boards; phase 4 Task 8). An inner page and its side ads are one centred group, each ad right
// beside the page, never at the window's edge. The page takes the room the ads leave, up to FRAME_MAX, so a big monitor
// shows more of it instead of empty margins:
// - CENTERED: two ads, one each side of the page, where both fit by width and a 600 px ad fits by height: the page is
//   the window and its scrollbar less 638 px (the ads, 15 px to the page and 4 px to the window's edge), 1265 at 1920
//   and about 1905 at 2560;
// - ONE_AD: one ad on the right from 850 px wide, narrower or shorter than that: the page is the window less 364 px;
// - under 850 px, no ad: the page fills the window, with 16 px sides on a phone as the phone boards draw.
// CSS only: the export and the first render agree at every size, and a page can take its width helper without the
// shell's hooks (useFrame.js picks the frame for the page on screen; SideAds in AdUnit.jsx creates the units).
// FRAME_MAX holds a page to what reads as one page on an ultrawide.
export const FRAME_MAX = 2000;
const AD_WIDE = 300;
const AD_TALL = 600;
// One ad: 16 px to the page, which keeps its 24 px sides, so the page is W - 364 (300 + 16 + 24 + 24). Two ads: 15 px
// between an ad and the page, 4 at the window's edges (4 + 300 + 15 + page + 15 + 300 + 4): at 1920, less a 17 px scrollbar,
// the page keeps the 1,248 px of four 300 px cards to a row (4 x 300 + 3 x 16), which 15 px edges took 3 px short of.
const EDGE_GAP = 4;
const AD_GAP = 16;
const PAIR_GAP = 15;
// The ads stick under the bar, the group row (52) and 24 px, where the boards draw them, clear of the band under the
// bar. A 600 px ad there ends at 732, 14 px above where the 90 px anchor starts on an 836 px window.
const AD_TOP = navBarHeight + 52 + 24;
export const TALL = '(min-height: 836px)';
const SHORT = '@media (max-height: 835.98px)';
// From 1900 two ads fit beside a page of about 1240 (a 17 px scrollbar, which media queries count and the layout does
// not, included), four 300 px cards to a row (4 x 300 + 3 x 16 = 1248) at 1920.
export const CENTERED = `@media (min-width: 1900px) and ${TALL}`;
export const ONE_AD = '@media (min-width: 850px) and (max-width: 1899.98px), (min-width: 850px) and (max-height: 835.98px)';
// The bar's links show from lg (1200) in one row that never wraps, and a user's name at its end needs the room: measured
// with a 17 px scrollbar. Below 1460 the gaps between them go (at 1440 a 14-letter name is 15 px short with them), below
// 1366 the items' padding, the logo's margin and the bar's sides tighten too (at 1280 a name is 19 to 35 px short
// without), and below 1280 the items' padding again, which holds a name of about 12 letters at 1200. The name and save
// time are the last to give, with an ellipsis.
export const BAR_SNUG = '@media (min-width: 1200px) and (max-width: 1459.95px)';
export const BAR_TIGHT = '@media (min-width: 1200px) and (max-width: 1365.95px)';
export const BAR_CRAMPED = '@media (min-width: 1200px) and (max-width: 1279.95px)';

// A phone's page sides. A media query rather than a breakpoint object, so CENTERED's px: 0 needs no source order to win.
export const PHONE_SIDES = '@media (max-width: 599.95px)';
export const pageSidesSx = { px: 3, [PHONE_SIDES]: { px: 2 } };

const grid = (columns, areas, gap) => ({
  display: 'grid', justifyContent: 'center', columnGap: `${gap}px`, gridTemplateColumns: columns, gridTemplateAreas: areas
});

// reserveAds: false once a blocker hides the ads. Beside one ad the page then takes the ad's column as well, so it
// widens with its left edge where it was; between two ads it stays put and the ads' columns stay as margins.
export const frameSx = ({ reserveAds }) => ({
  width: '100%',
  ...pageSidesSx,
  [ONE_AD]: reserveAds
    ? grid(`minmax(0, ${FRAME_MAX}px) ${AD_WIDE}px`, '"page right"', AD_GAP)
    : grid(`minmax(0, ${FRAME_MAX + AD_GAP + AD_WIDE}px)`, '"page"', AD_GAP),
  [CENTERED]: { ...grid(`${AD_WIDE}px minmax(0, ${FRAME_MAX}px) ${AD_WIDE}px`, '"left page right"', PAIR_GAP), px: `${EDGE_GAP}px` }
});

// The page's column: the header row and the page. minWidth 0 keeps a wide table from widening the track.
export const pageColumnSx = { gridArea: 'page', minWidth: 0 };

// An ad's gutter: the left one only between two ads, the right one wherever an ad shows. Hidden outside those queries
// (a fractional width between two of them included), so an empty gutter never drops below the page.
// minHeight: room for the box to reach AD_TOP. A sticky box stays inside its gutter, and the gutter is only as tall as
// the page, so on a short page (Bundles' Pet Mart tab) the ad sat higher than on its other tabs, jumping on a tab switch.
export const adGutterSx = (side) => ({
  display: 'none',
  gridArea: side,
  minHeight: AD_TOP + AD_TALL - navBarHeight,
  ...(side === 'right' ? { [ONE_AD]: { display: 'block' } } : {}),
  [CENTERED]: { display: 'block' }
});

// The box a unit fills: the gutter's width and a 600 px ad's height at every window height. Nitro offers a display
// unit only the sizes that fit its holder, so every unit can be served every size it lists. From 836 px tall the box
// sticks at AD_TOP, clear of the anchor. A shorter window keeps today's rail (phase 4 Decision 3): the box sticks
// centred on the window and the creative sits in its middle, where Nitro centres the rail (railVerticalAlign: center),
// so nitro-side-ad is served the rail's sizes at the rail's height on the screen.
export const adBoxSx = {
  position: 'sticky', top: AD_TOP, width: AD_WIDE, height: AD_TALL,
  [SHORT]: { top: `calc(50vh - ${AD_TALL / 2}px)`, '& [id^="nitro-"]': { alignItems: 'center' } }
};

// A page that caps its own width: its column centres in the page column in every layout, two ads, one ad or a blocker,
// since the page and its ad are one centred group in each (a cap left at the column's left edge beside one ad sat
// 280 px off centre). The frame applies it to the header and the page together (useFrame reads PAGE_CAPS by route,
// which the export knows), so the title lines up with its content.
export const capPageWidth = (maxWidth) => ({ maxWidth, width: '100%', mx: 'auto' });
export const PAGE_CAPS = { '/guilds': 980, '/guilds/detail': 980, '/guilds/ecosystem': 980 };
// Home, patch notes and the error pages have no page column, so a bar panel there takes home's width (its MUI
// Container, lg), centred: without it Worlds spanned the window and Account and Tools sat at its left edge.
export const OUTER_PANEL_WIDTH = 1200;
