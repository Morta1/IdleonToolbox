import React, { useContext, useState } from 'react';
import { Box } from '@mui/material';
import { IconEye, IconFlask, IconInfoCircle, IconLayoutNavbar } from '@tabler/icons-react';
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

// What a phone leaves out of a line: the band is one 40 px row, and the button carries the rest. Each tail starts with
// its own punctuation, so the line reads as before from 600 px.
const WideOnly = ({ children }) => <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>{children}</Box>;

// The banner slot: one band under the app bar, one notice at a time, in this order. Every state is its
// own early return; the ad-block ask comes last, only when none of the others is up.
const ProfileBanner = () => {
  const { state, dispatch, reparseOwnAccount } = useContext(AppContext);
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
      Pet simulation: <strong>{simulatedCompanions}</strong> <WideOnly>unowned </WideOnly>{simulatedCompanions === 1 ? 'pet' : 'pets'}<WideOnly> counted as owned</WideOnly>
    </Notice>;
  }
  if (isProfileView) {
    return <Notice placement={'banner'} tone={'info'} icon={IconEye}
                   action={state?.signedIn ? { label: 'Back to my account', onClick: handleBackToAccount } : undefined}>
      Viewing <strong>{profileName}</strong><WideOnly>&apos;s profile</WideOnly>
    </Notice>;
  }
  if (isSample) {
    return <Notice placement={'banner'} tone={'signin'} icon={IconLayoutNavbar}>
      Sample account<WideOnly>: sign in to see your own numbers</WideOnly>
    </Notice>;
  }
  if (isEmptyAccount) {
    const loginNotice = state?.loginNotice;
    if (loginNotice?.message) {
      // A saved sign-in that failed on load: why these are a guest's numbers, until it is hidden. Only
      // NO_CHARACTERS' hint adds anything (SESSION_RESTORE_FAILED's says sign in, which the band's button
      // does); the band fits the hint on its one line from lg up (it wrapped from 900 to about 1000 px), and
      // ends without a period, as band lines do.
      const hint = loginNotice.code === 'NO_CHARACTERS' ? loginNotice.hint?.replace(/\.$/, '') : null;
      return <Notice placement={'banner'} tone={'signin'} onDismiss={() => dispatch({ type: 'data', data: { loginNotice: null } })}>
        {loginNotice.message}
        {hint ? <Box component="span" sx={{ display: { xs: 'none', lg: 'inline' } }}>{`. ${hint}`}</Box> : null}
      </Notice>;
    }
    return <Notice placement={'banner'} tone={'signin'} icon={IconInfoCircle}>
      Browsing as a guest<WideOnly>: numbers fill in once you sign in</WideOnly>
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
        <WideOnly>: allow ads on this site</WideOnly>
      </Notice>
      <AdBlockHowDialog open={howOpen} onClose={() => setHowOpen(false)}/>
    </>;
  }
  return null;
};

export default ProfileBanner;
