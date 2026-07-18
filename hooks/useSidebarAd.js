import { useMediaQuery } from '@mui/material';
import useAdBlockDetection from './useAdBlockDetection';

/**
 * Whether the sidebar rail ad should render. Shared by SidebarAd and by ContentWrapper, which
 * reserves the gutter the fixed-positioned rail sits in - the two must never disagree.
 */
const useSidebarAd = () => {
  const wideEnough = useMediaQuery('(min-width: 850px)', { noSsr: true });
  const adBlocked = useAdBlockDetection();

  return wideEnough && !adBlocked;
};

export default useSidebarAd;
