import { useContext } from 'react';
import { useRouter } from 'next/router';
import { AppContext } from '@components/common/context/AppProvider';

// Single source of truth for the sticky "special viewing mode" notice bar
// (NavBar/ProfileBanner) rendered under the navbar. Both ProfileBanner
// (deciding whether/what to render) and AppDrawer (reserving space so the
// drawer's own content doesn't slide up underneath the banner) must agree
// on when it's visible - previously each computed this independently and
// drifted apart, causing the drawer to overlap the banner in the
// empty-account state.
//
// AppProvider keeps the two states mutually exclusive in practice:
// `handleProfile` always sets `emptyAccount: false`, and the empty-account
// path never sets `profile`. If both were ever true at once, the profile
// view wins - it means real data for a specific player is on screen, which
// is more useful to show than the generic "you're not signed in" fallback.
const useProfileBannerState = () => {
  const { state } = useContext(AppContext);
  const router = useRouter();
  const profileName = router?.query?.profile;

  const isProfileView = !!(state?.profile && profileName);
  const isEmptyAccount = !isProfileView && !!state?.emptyAccount;

  return {
    isProfileView,
    isEmptyAccount,
    isVisible: isProfileView || isEmptyAccount
  };
};

export default useProfileBannerState;
