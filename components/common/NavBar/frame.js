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

// The narrowest page each layout can have from md up, for a group row's split (navMenu rowFit): the row hides by CSS
// what does not fit, so its counts come from the smallest width a query allows, never the measured one. Several match
// at once on a big screen, so the list runs from the narrowest query to the widest and the last one written wins.
// Task 8 (the rails) makes the 1440 entry its centered layout, (min-width: 1440px) and (min-height: 836px) at 1080.
export const ROW_WIDTHS = [
  ['(min-width: 900px)', 536],
  ['(min-width: 1200px)', 836],
  ['(min-width: 1366px)', 1002],
  ['(min-width: 1440px)', 1076],
  ['(min-width: 1920px) and (min-height: 836px)', FRAME_MAX]
];
