import { useContext } from 'react';
import { useRouter } from 'next/router';
import { AppContext } from '@components/common/context/AppProvider';
import { routeNeedsAccount } from '@utility/account-routes';

const useProfileBannerState = () => {
  const { state } = useContext(AppContext);
  const router = useRouter();
  const profileName = router?.query?.profile;

  const isHomepage = router?.pathname === '/';

  const isProfileView = !isHomepage && !!(state?.profile && profileName);
  // "Numbers fill in once you sign in" only holds where the page shows account numbers. On static
  // pages it was also the largest text to arrive after hydration, which made it their LCP.
  const isEmptyAccount = routeNeedsAccount(router?.pathname) && !isProfileView && !!state?.emptyAccount;
  const simulatedCompanions = state?.account?.companions?.list?.filter((companion) => companion?.simulated)?.length ?? 0;
  // Simulated pet bonuses skew numbers on every page, so this warning outranks the other banners.
  const isSimulating = !isHomepage && simulatedCompanions > 0;

  return {
    isProfileView,
    isEmptyAccount,
    isSimulating,
    simulatedCompanions,
    isVisible: isSimulating || isProfileView || isEmptyAccount
  };
};

export default useProfileBannerState;
