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
  // Without it the sample account (?demo=true) reads like the player's own save.
  const isSample = routeNeedsAccount(router?.pathname) && !isProfileView && !!state?.demo;
  const simulatedCompanions = state?.account?.companions?.list?.filter((companion) => companion?.simulated)?.length ?? 0;
  // Simulated pet bonuses skew numbers on every page, so this warning outranks the other banners.
  const isSimulating = !isHomepage && simulatedCompanions > 0;

  const hasIdentityBanner = isSimulating || isProfileView || isSample || isEmptyAccount;
  // The ad-block ask takes the band only when no identity banner is up, and never on the landing
  // page, where no banner shows (Overlays board, "One band under the app bar").
  const isAdBlockAsk = !isHomepage && !hasIdentityBanner && Boolean(state?.adBlockAsk);
  return {
    isProfileView,
    isEmptyAccount,
    isSample,
    isSimulating,
    simulatedCompanions,
    hasIdentityBanner,
    isAdBlockAsk,
    isVisible: hasIdentityBanner || isAdBlockAsk
  };
};

export default useProfileBannerState;
