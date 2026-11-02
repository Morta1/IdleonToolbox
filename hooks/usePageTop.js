import useProfileBannerState from '@hooks/useProfileBannerState';
import { navBarHeight, profileBannerHeight } from '@components/constants';

// Where a page's own sticky things start: under the nav bar, and under the profile banner while it shows.
const usePageTop = () => {
  const { isVisible } = useProfileBannerState();
  return navBarHeight + (isVisible ? profileBannerHeight : 0);
};

// Where a scroll target (a hash link, scrollIntoView) parks: under the bar and the band's height, whether the band
// shows yet or not. A deep link scrolls once the page's data is in, which can be before the band arrives (a sample
// account's), and a band arriving after the scroll would cover the target.
export const SCROLL_TARGET_MARGIN = navBarHeight + profileBannerHeight + 16;

export default usePageTop;
