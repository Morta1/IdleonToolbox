import { useContext } from 'react';
import { useRouter } from 'next/router';
import { AppContext } from '@components/common/context/AppProvider';

const useProfileBannerState = () => {
  const { state } = useContext(AppContext);
  const router = useRouter();
  const profileName = router?.query?.profile;

  const isHomepage = router?.pathname === '/';

  const isProfileView = !isHomepage && !!(state?.profile && profileName);
  const isEmptyAccount = !isHomepage && !isProfileView && !!state?.emptyAccount;

  return {
    isProfileView,
    isEmptyAccount,
    isVisible: isProfileView || isEmptyAccount
  };
};

export default useProfileBannerState;
