import { useRouter } from 'next/router';
import { useSidebarAdBlocked } from '@hooks/useSidebarAd';
import usePageDataLoading from '@hooks/usePageDataLoading';
import { usePageLoadingState } from '@components/common/context/PageLoadingProvider';
import { frameSx, PAGE_CAPS } from './frame';

// The frame of the page on screen, for the page and for the bar's panels alike, so a panel's edges are the page's
// whatever the rail does. Home and patch notes are not inner pages: they keep the full width and have no rail. While
// the page waits for its data there is nothing to keep clear of the rail, and the gutter would push the loader
// ~165 px left of the centre, so it goes; it goes too when a blocker hides the rail. The 850 px breakpoint is CSS (a
// media query hook is false at build), and detection starts as "not blocked", so the export reserves the gutter and
// only a blocker's visitor sees it collapse.
const useFrame = () => {
  const router = useRouter();
  const adBlocked = useSidebarAdBlocked();
  const { loading } = usePageDataLoading();
  const pageReportedLoading = usePageLoadingState();
  const pathname = router?.pathname || '/';
  const inner = pathname !== '/' && pathname !== '/patch-notes';
  const reserveRail = !adBlocked && !loading && !pageReportedLoading;
  return { inner, sx: inner ? frameSx({ reserveRail }) : { px: 3 }, cap: PAGE_CAPS[pathname] ?? null };
};

export default useFrame;
