// The page frame (Layout boards). Where a 600 px rail fits beside the page by height, the page is centered between the
// side rails; elsewhere it keeps today's shape, from the left with one rail on the right. CSS only: the export and the
// first render agree at every size. 836: the bar (70), the group row (52), 24 px, a 600 px rail, the 90 px anchor.
export const CENTERED = '@media (min-width: 1920px) and (min-height: 836px)'; // Task 8 opens it from 1440
export const ONE_RAIL = '@media (min-width: 850px)'; // today's rail, from the width it starts at
export const FRAME_MAX = 1260;
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
