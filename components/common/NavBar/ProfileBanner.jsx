import React, { useContext, useState } from 'react';
import { Box } from '@mui/material';
import { IconEye, IconFlask, IconInfoCircle, IconUserQuestion } from '@tabler/icons-react';
import { useLocalStorage } from '@mantine/hooks';
import { simulatedCompanionsKey } from '@components/constants';
import { useRouter } from 'next/router';
import { AppContext } from '../context/AppProvider';
import useProfileBannerState from '@hooks/useProfileBannerState';
import useAdBlockNotice from '@hooks/useAdBlockNotice';
import { sessionQueryWithoutProfile } from '@utility/nav-query';
import Notice from '@components/common/Notice';
import { trackEvent } from '@utility/analytics';
import AdBlockHowDialog from './AdBlockHowDialog';

// The banner slot: one band under the app bar, one notice at a time, in this order. Every state is its
// own early return; the ad-block ask comes last, only when none of the others is up.
const ProfileBanner = () => {
  const { state, reparseOwnAccount } = useContext(AppContext);
  const router = useRouter();
  const profileName = router?.query?.profile;
  const queryParams = sessionQueryWithoutProfile(router.query);
  const [, setSimulatedCompanions] = useLocalStorage({ key: simulatedCompanionsKey, defaultValue: [] });
  const {
    isProfileView, isSample, isSimulating, isEmptyAccount, simulatedCompanions, hasIdentityBanner, isAdBlockAsk, isVisible
  } = useProfileBannerState();
  const { dismiss } = useAdBlockNotice({ slotTaken: hasIdentityBanner });
  const [howOpen, setHowOpen] = useState(false);

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
  if (isAdBlockAsk) {
    return <>
      <Notice placement={'banner'} tone={'info'} onDismiss={dismiss} dismissLabel={'Hide for 7 days'}
              action={{
                label: 'How',
                onClick: () => {
                  trackEvent('adblock_notice_how');
                  setHowOpen(true);
                }
              }}>
        Ads keep the toolbox free
        {/* The band is one 40 px row: phones get the short line, the How button carries the rest. */}
        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>: allow ads on this site</Box>
      </Notice>
      <AdBlockHowDialog open={howOpen} onClose={() => setHowOpen(false)}/>
    </>;
  }
  return null;
};

export default ProfileBanner;
