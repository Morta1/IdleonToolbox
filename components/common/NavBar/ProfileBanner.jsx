import React, { useContext, useState } from 'react';
import { Button, Stack, Typography } from '@mui/material';
import { IconEye, IconFlask, IconInfoCircle, IconUserQuestion } from '@tabler/icons-react';
import { useLocalStorage } from '@mantine/hooks';
import { simulatedCompanionsKey } from '@components/constants';
import { useRouter } from 'next/router';
import { AppContext } from '../context/AppProvider';
import { navBarHeight, profileBannerHeight } from '../../constants';
import useProfileBannerState from '@hooks/useProfileBannerState';
import LoginDialog from './LoginDialog';
import { sessionQueryWithoutProfile } from '@utility/nav-query';

const bannerButtonSx = {
  ml: 1,
  fontSize: 12,
  textTransform: 'none',
  color: 'primary.main',
  borderColor: (theme) => `rgba(${theme.vars.palette.primary.mainChannel} / 0.5)`,
  '&:hover': { borderColor: 'primary.main', color: 'text.primary' }
};

const NOTICE_COLOR = 'var(--mui-palette-primary-main)';

const simulationButtonSx = {
  ml: 1,
  fontSize: 12,
  textTransform: 'none',
  color: '#f0b849',
  borderColor: '#f0b849',
  '&:hover': { borderColor: '#ffd88a', color: '#fff' }
};

const ProfileBanner = () => {
  const { state, reparseOwnAccount } = useContext(AppContext);
  const router = useRouter();
  const profileName = router?.query?.profile;
  const queryParams = sessionQueryWithoutProfile(router.query);
  const [loginOpen, setLoginOpen] = useState(false);
  const [, setSimulatedCompanions] = useLocalStorage({ key: simulatedCompanionsKey, defaultValue: [] });
  const { isProfileView, isSample, isSimulating, simulatedCompanions, isVisible } = useProfileBannerState();

  const handleBackToAccount = () => {
    router.push({ url: router.pathname, query: queryParams });
    setTimeout(() => router.reload());
  };

  const handleStopSimulating = async () => {
    setSimulatedCompanions([]);
    await reparseOwnAccount();
  };

  if (!isVisible) return null;

  return (
    <Stack direction="row" alignItems="center" justifyContent="center" spacing={2} sx={{
      position: 'sticky',
      top: navBarHeight,
      zIndex: (theme) => theme.zIndex.drawer + 1,
      height: profileBannerHeight,
      px: 2,
      bgcolor: 'background.paper',
      borderBottom: 1, borderColor: 'divider'
    }}>
      {isSimulating ? (
        <>
          <IconFlask size={18} style={{ color: '#f0b849', flexShrink: 0 }}/>
          <Typography sx={{ fontSize: 14, color: '#f0b849' }}>
            Pet simulation: <strong>{simulatedCompanions}</strong> unowned {simulatedCompanions === 1 ? 'pet' : 'pets'} counted as owned
          </Typography>
          <Button size="small" variant="outlined" onClick={handleStopSimulating} sx={simulationButtonSx}>
            Turn off
          </Button>
        </>
      ) : isProfileView ? (
        <>
          <IconEye size={18} style={{ color: NOTICE_COLOR, flexShrink: 0 }}/>
          <Typography sx={{ fontSize: 14, color: 'primary.main' }}>
            Viewing <strong>{profileName}</strong>&apos;s profile
          </Typography>
          {state?.signedIn ? (
            <Button size="small" variant="outlined" onClick={handleBackToAccount} sx={bannerButtonSx}>
              Back to my account
            </Button>
          ) : null}
        </>
      ) : isSample ? (
        <>
          <IconUserQuestion size={18} style={{ color: NOTICE_COLOR, flexShrink: 0 }}/>
          <Typography sx={{ fontSize: 14, color: 'primary.main' }}>
            Sample account: sign in to see your own numbers
          </Typography>
          {!state?.signedIn ? (
            <Button size="small" variant="outlined" onClick={() => setLoginOpen(true)} sx={bannerButtonSx}>
              Sign in
            </Button>
          ) : null}
          <LoginDialog open={loginOpen} setOpen={setLoginOpen} onClose={() => setLoginOpen(false)}/>
        </>
      ) : (
        <>
          <IconInfoCircle size={18} style={{ color: NOTICE_COLOR, flexShrink: 0 }}/>
          <Typography sx={{ fontSize: 14, color: 'primary.main' }}>
            Browsing as a guest: numbers fill in once you sign in
          </Typography>
          <Button size="small" variant="outlined" onClick={() => setLoginOpen(true)} sx={bannerButtonSx}>
            Sign in
          </Button>
          <LoginDialog open={loginOpen} setOpen={setLoginOpen} onClose={() => setLoginOpen(false)}/>
        </>
      )}
    </Stack>
  );
};

export default ProfileBanner;