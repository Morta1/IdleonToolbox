import { useRouter } from 'next/router';
import { useSidebarAdBlocked } from '@hooks/useSidebarAd';
import { frameSx, PAGE_CAPS } from './frame';

// The frame of the page on screen, for the page and for the bar's panels alike, so a panel's edges are the page's
// whatever the rail does. Home and patch notes are not inner pages: they keep the full width and have no rail. The
// frame keeps one width from the first paint to the loaded page (a loader sits in the page's column, where the page
// will be), so neither the page nor the group row under the bar moves when the data arrives. Only a blocker, which
// hides the rail, gives its gutter back: the 850 px breakpoint is CSS (a media query hook is false at build) and
// detection starts as "not blocked", so the export reserves the gutter and a blocker's visitor sees it go once,
// when the blocker answers (about 0.75 s), or never on a later page of the visit.
const useFrame = () => {
  const router = useRouter();
  const adBlocked = useSidebarAdBlocked();
  const pathname = router?.pathname || '/';
  const inner = pathname !== '/' && pathname !== '/patch-notes';
  return { inner, sx: inner ? frameSx({ reserveRail: !adBlocked }) : { px: 3 }, cap: PAGE_CAPS[pathname] ?? null };
};

export default useFrame;
