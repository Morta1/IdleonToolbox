import React, { useContext } from 'react';
import { IconEye, IconFlask, IconInfoCircle, IconUserQuestion } from '@tabler/icons-react';
import { useLocalStorage } from '@mantine/hooks';
import { simulatedCompanionsKey } from '@components/constants';
import { useRouter } from 'next/router';
import { AppContext } from '../context/AppProvider';
import useProfileBannerState from '@hooks/useProfileBannerState';
import useAdBlockNotice from '@hooks/useAdBlockNotice';
import { sessionQueryWithoutProfile } from '@utility/nav-query';
import Notice from '@components/common/Notice';

// The banner slot: one band under the app bar, one notice at a time, in this order. Every state is its
// own early return, so a fifth (2e's ad-block ask, only when none of these is up) is one more `if` before
// the last line.
const ProfileBanner = () => {
  const { state, reparseOwnAccount } = useContext(AppContext);
  const router = useRouter();
  const profileName = router?.query?.profile;
  const queryParams = sessionQueryWithoutProfile(router.query);
  const [, setSimulatedCompanions] = useLocalStorage({ key: simulatedCompanionsKey, defaultValue: [] });
  const { isProfileView, isSample, isSimulating, isEmptyAccount, simulatedCompanions, isVisible } = useProfileBannerState();
  useAdBlockNotice({ slotTaken: isVisible });

  const handleBackToAccount = () => {
    router.push({ url: router.pathname, query: queryParams });
    setTimeout(() => router.reload());
  };

  const handleStopSimulating = async () => {
    setSimulatedCompanions([]);
    await reparseOwnAccount();
  };

  if (!isVisible) return null;
  if (isSimulating) {
    // Amber: simulated pets skew every number on the page (Foundations: the simulation takes warning)
    return <Notice placement={'banner'} tone={'missing'} icon={IconFlask}
                   action={{ label: 'Turn off', onClick: handleStopSimulating }}>
      Pet simulation: <strong>{simulatedCompanions}</strong> unowned {simulatedCompanions === 1 ? 'pet' : 'pets'} counted as owned
    </Notice>;
  }
  if (isProfileView) {
    return <Notice placement={'banner'} tone={'info'} icon={IconEye}
                   action={state?.signedIn ? { label: 'Back to my account', onClick: handleBackToAccount } : undefined}>
      Viewing <strong>{profileName}</strong>&apos;s profile
    </Notice>;
  }
  if (isSample) {
    return <Notice placement={'banner'} tone={'signin'} icon={IconUserQuestion}>
      Sample account: sign in to see your own numbers
    </Notice>;
  }
  if (isEmptyAccount) {
    return <Notice placement={'banner'} tone={'signin'} icon={IconInfoCircle}>
      Browsing as a guest: numbers fill in once you sign in
    </Notice>;
  }
  return null;
};

export default ProfileBanner;
