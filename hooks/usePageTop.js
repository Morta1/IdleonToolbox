import useProfileBannerState from '@hooks/useProfileBannerState';
import { navBarHeight, profileBannerHeight } from '@components/constants';

// Where a page's own sticky things start: under the nav bar, and under the profile banner while it shows.
const usePageTop = () => {
  const { isVisible } = useProfileBannerState();
  return navBarHeight + (isVisible ? profileBannerHeight : 0);
};

export default usePageTop;
