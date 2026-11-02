// The page frame (Layout boards; phase 4 Task 8). An inner page and its side ads are one centred group, each ad right
// beside the page, never at the window's edge:
// - CENTERED: two ads, one each side of a 1260 px page, where both fit by width and a 600 px ad fits by height;
// - ONE_AD: one ad on the right from 850 px wide, narrower or shorter than that: below 1624 px the page and ad fill the
//   window with 24 px sides, today's shape; wider, the page slides right as the window grows (ONE_AD_LEFT), so it
//   meets the two-ad layout's centred page at 1900 instead of jumping;
// - under 850 px, no ad: the page fills the window.
// CSS only: the export and the first render agree at every size, and a page can take its width helper without the
// shell's hooks (useFrame.js picks the frame for the page on screen; SideAds in AdUnit.jsx creates the units).
export const FRAME_MAX = 1260;
const AD_WIDE = 300;
const AD_TALL = 600;
// One ad: 16 px to the page, so below 1624 the page keeps today's W - 364 (300 + 16 + its 24 px side). Two ads: 15 px,
// the boards' 1920 to the pixel (15 + 300 + 15 + 1260 + 15 + 300 + 15).
const AD_GAP = 16;
const PAIR_GAP = 15;
// The ads stick under the bar (70), the group row (52) and 24 px, where the boards draw them, clear of the band (70 to
// 110). A 600 px ad there ends at 746, where the 90 px anchor starts on an 836 px window.
const AD_TOP = 146;
export const TALL = '(min-height: 836px)';
const SHORT = '@media (max-height: 835.98px)';
// Two ads and the page take 1890 px. From 1900 the page keeps 1260; a 17 px scrollbar, which media queries count and
// the layout does not, takes it to 1253 at most, still four 300 px cards to a row (4 x 300 + 3 x 16 = 1248).
export const CENTERED = `@media (min-width: 1900px) and ${TALL}`;
export const ONE_AD = '@media (min-width: 850px) and (max-width: 1899.98px), (min-width: 850px) and (max-height: 835.98px)';
// The bar's links show from lg (1200) in one row that never wraps. Below 1440 the gaps between them go (a signed-in
// bar at 1366 with a 17 px scrollbar is a pixel short without), and below 1280 the items' own padding, the logo's
// margin and the bar's sides tighten too, so 1200 with a scrollbar holds it, signed in. The name and save time are
// the last to give, with an ellipsis.
export const BAR_SNUG = '@media (min-width: 1200px) and (max-width: 1439.95px)';
export const BAR_TIGHT = '@media (min-width: 1200px) and (max-width: 1279.95px)';

const grid = (columns, areas, gap) => ({
  display: 'grid', justifyContent: 'center', columnGap: `${gap}px`, gridTemplateColumns: columns, gridTemplateAreas: areas
});

// One ad: the ad keeps to the right, 24 px from the edge at 1624 closing to 4 by 1899, and the page takes the room left
// of page and ad, never past centred. So at 1899 the page sits within a pixel of the two-ad layout's 320 at 1900, and
// a short wide window centres its page as a tall one does. Percentages are of the frame's width, as the queries are.
const ONE_AD_GROUP = FRAME_MAX + AD_GAP + AD_WIDE;
const ONE_AD_RIGHT = 'clamp(4px, calc(24px - (100% - 1624px) * 20 / 275), 24px)';
const ONE_AD_LEFT = `clamp(24px, calc(100% - ${ONE_AD_GROUP}px - ${ONE_AD_RIGHT}), calc((100% - ${FRAME_MAX}px) / 2))`;

// reserveAds: false once a blocker hides the ads. Beside one ad the page then takes the ad's column as well, so it
// widens with its left edge where it was; between two ads it stays put and the ads' columns stay as margins.
export const frameSx = ({ reserveAds }) => ({
  width: '100%',
  px: 3,
  [ONE_AD]: reserveAds
    ? { ...grid(`minmax(0, ${FRAME_MAX}px) ${AD_WIDE}px`, '"page right"', AD_GAP), justifyContent: 'start', pl: ONE_AD_LEFT, pr: ONE_AD_RIGHT }
    : grid(`minmax(0, ${ONE_AD_GROUP}px)`, '"page"', AD_GAP),
  [CENTERED]: { ...grid(`${AD_WIDE}px minmax(0, ${FRAME_MAX}px) ${AD_WIDE}px`, '"left page right"', PAIR_GAP), px: 0 }
});

// The page's column: the header row and the page. minWidth 0 keeps a wide table from widening the track.
export const pageColumnSx = { gridArea: 'page', minWidth: 0 };

// An ad's gutter: the left one only between two ads, the right one wherever an ad shows. Hidden outside those queries
// (a fractional width between two of them included), so an empty gutter never drops below the page.
export const adGutterSx = (side) => ({
  display: 'none',
  gridArea: side,
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

// A page that caps its own width: its column centres in the frame where the page itself is centred, between two ads,
// and starts at the page column's left edge elsewhere, as it always has. The frame applies it to the header and the
// page together (useFrame reads PAGE_CAPS by route, which the export knows), so the title lines up with its content.
export const capPageWidth = (maxWidth) => ({ maxWidth, [CENTERED]: { width: '100%', mx: 'auto' } });
export const PAGE_CAPS = { '/guilds': 980, '/guilds/detail': 980, '/guilds/ecosystem': 980 };
