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

// The JS-only half of the decision. ContentWrapper reserves the gutter with a CSS media query so
// the export and the first client render agree on the width; only "is an adblocker running" needs
// JS, and it is the same detection SidebarAd sees.
export const useSidebarAdBlocked = () => useAdBlockDetection();

export default useSidebarAd;
