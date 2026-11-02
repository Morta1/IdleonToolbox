import { useRouter } from 'next/router';
import { useSidebarAdBlocked } from '@hooks/useSidebarAd';
import usePageDataLoading from '@hooks/usePageDataLoading';
import { usePageLoadingState } from '@components/common/context/PageLoadingProvider';

// The page frame (Layout boards). Where a 600 px rail fits beside the page by height, the page is centered between the
// side rails; elsewhere it keeps today's shape, from the left with one rail on the right. CSS only: the export and the
// first render agree at every size. 836: the bar (70), the group row (52), 24 px, a 600 px rail, the 90 px anchor.
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

// The frame of the page on screen, for the page and for the bar's panels alike, so a panel's edges are the page's
// whatever the rail does. Home and patch notes are not inner pages: they keep the full width and have no rail. While
// the page waits for its data there is nothing to keep clear of the rail, and the gutter would push the loader
// ~165 px left of the centre, so it goes; it goes too when a blocker hides the rail. The 850 px breakpoint is CSS (a
// media query hook is false at build), and detection starts as "not blocked", so the export reserves the gutter and
// only a blocker's visitor sees it collapse.
export const useFrame = () => {
  const router = useRouter();
  const adBlocked = useSidebarAdBlocked();
  const { loading } = usePageDataLoading();
  const pageReportedLoading = usePageLoadingState();
  const pathname = router?.pathname || '/';
  const inner = pathname !== '/' && pathname !== '/patch-notes';
  const reserveRail = !adBlocked && !loading && !pageReportedLoading;
  return { inner, sx: inner ? frameSx({ reserveRail }) : { px: 3 } };
};

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
