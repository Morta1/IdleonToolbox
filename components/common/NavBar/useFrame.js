import { useRouter } from 'next/router';
import { useSidebarAdBlocked } from '@hooks/useSidebarAd';
import { frameSx, PAGE_CAPS, pageSidesSx } from './frame';

// The frame of the page on screen, for the page and for the bar's panels alike, so a panel's edges are the page's
// whatever the ads do. Home and patch notes are not inner pages: they keep the full width and have no side ad. Nor are
// the error pages (the 404, Next's _error): ad networks allow no ads on an error page, so neither reserves the gutters
// or creates a side unit, and each keeps its own layout.
// The frame keeps one shape from the first paint to the loaded page (a loader sits in the page's column), so neither the
// page nor the group row under the bar moves when the data arrives. Only a blocker gives the ads' room back: which
// layout shows is CSS (frame.js; a media query hook is false at build), and detection starts as "not blocked", so the
// export reserves the ads' columns and a blocker's visitor sees the one ad's column go once, when the blocker answers
// (about 0.75 s), or never on a later page of the visit. Between two ads the page does not move at all.
const OUTER_PAGES = ['/', '/patch-notes', '/404', '/_error'];

const useFrame = () => {
  const router = useRouter();
  const adBlocked = useSidebarAdBlocked();
  const pathname = router?.pathname || '/';
  const inner = !OUTER_PAGES.includes(pathname);
  return { inner, sx: inner ? frameSx({ reserveAds: !adBlocked }) : pageSidesSx, cap: PAGE_CAPS[pathname] ?? null };
};

export default useFrame;
