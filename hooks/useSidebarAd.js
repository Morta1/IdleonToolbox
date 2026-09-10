import { useMediaQuery } from '@mui/material';
import useAdBlockDetection from './useAdBlockDetection';

/**
 * Whether the sidebar rail ad should render. Shared by SidebarAd and by ContentWrapper, which
 * reserves the gutter the fixed-positioned rail sits in - the two must never disagree.
 */
const useSidebarAd = () => {
  const wideEnough = useMediaQuery('(min-width: 850px)');
  const adBlocked = useAdBlockDetection();

  return wideEnough && !adBlocked;
};

// The JS-only half of the decision: the width itself is a CSS media query so the export and the
// first client render agree, and only "is an adblocker running" needs JS.
export const useSidebarAdBlocked = () => useAdBlockDetection();

export default useSidebarAd;
