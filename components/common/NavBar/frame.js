// The page frame (Layout boards). Where a 600 px rail fits beside the page by height, the page is centered between the
// side rails; elsewhere it keeps today's shape, from the left with one rail on the right. CSS only: the export and the
// first render agree at every size, and a page can take its width helper without the shell's hooks (useFrame.js
// picks the frame for the page on screen). 836: the bar (70), the group row (52), 24 px, a 600 px rail, the 90 px anchor.
export const CENTERED = '@media (min-width: 1920px) and (min-height: 836px)'; // Task 8 opens it from 1440
export const ONE_RAIL = '@media (min-width: 850px)'; // today's rail, from the width it starts at
export const FRAME_MAX = 1260;
// The bar's links show from lg (1200) in one row that never wraps. Below 1440 the gaps between them go (a signed-in
// bar at 1366 with a 17 px scrollbar is a pixel short without), and below 1280 the items' own padding, the logo's
// margin and the bar's sides tighten too, so 1200 with a scrollbar holds it, signed in. The name and save time are
// the last to give, with an ellipsis.
export const BAR_SNUG = '@media (min-width: 1200px) and (max-width: 1439.95px)';
export const BAR_TIGHT = '@media (min-width: 1200px) and (max-width: 1279.95px)';
// The rail's 300 px, the 16 px to it and the page's own 24 px gutter: today's ContentWrapper reserve plus main's pr.
const RAIL_GUTTER = 340;

// reserveRail: keep the one-rail shape's gutter (not while the page loads or when a blocker hides the rail).
// Centered, the gutters are margins. Emotion writes the keys in order, so CENTERED wins where both match.
export const frameSx = ({ reserveRail }) => ({
  width: '100%',
  px: 3,
  [ONE_RAIL]: { pr: reserveRail ? `${RAIL_GUTTER}px` : 3 },
  [CENTERED]: { width: `min(${FRAME_MAX}px, calc(100% - 360px))`, mx: 'auto', px: 0 }
});

// A page that caps its own width: its column centers in the frame where the frame itself is centered, and starts at
// the frame's left edge elsewhere, as it always has. The frame applies it to the header and the page together (useFrame
// reads PAGE_CAPS by route, which the export knows), so the title lines up with its content.
export const capPageWidth = (maxWidth) => ({ maxWidth, [CENTERED]: { width: '100%', mx: 'auto' } });
export const PAGE_CAPS = { '/guilds': 980, '/guilds/detail': 980, '/guilds/ecosystem': 980 };
