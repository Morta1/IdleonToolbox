import useProfileBannerState from '@hooks/useProfileBannerState';
import { navBarHeight, profileBannerHeight } from '@components/constants';
import { useBandSlotHeld } from '@utility/band-slot';

// Where a page's own sticky things start: under the nav bar, and under the profile banner while it shows or its room is
// held (utility/band-slot.js), which stands as tall as the band and above the same things.
const usePageTop = () => {
  const { isVisible } = useProfileBannerState();
  const slotHeld = useBandSlotHeld();
  return navBarHeight + (isVisible || slotHeld ? profileBannerHeight : 0);
};

// Where a scroll target (a hash link, scrollIntoView) parks: under the bar and the band's height, whether the band
// shows yet or not. A deep link scrolls once the page's data is in, which can be before the band arrives (a sample
// account's), and a band arriving after the scroll would cover the target.
export const SCROLL_TARGET_MARGIN = navBarHeight + profileBannerHeight + 16;

export default usePageTop;
