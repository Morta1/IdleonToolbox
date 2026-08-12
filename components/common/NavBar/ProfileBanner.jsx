import React, { useContext, useState } from 'react';
import { Button, Stack, Typography } from '@mui/material';
import { IconEye, IconInfoCircle } from '@tabler/icons-react';
import { useRouter } from 'next/router';
import { AppContext } from '../context/AppProvider';
import { navBarHeight, profileBannerHeight } from '../../constants';
import useProfileBannerState from '@hooks/useProfileBannerState';
import LoginDialog from './LoginDialog';

const bannerButtonSx = {
  ml: 1,
  fontSize: 12,
  textTransform: 'none',
  color: '#94baee',
  borderColor: '#2087e8',
  '&:hover': { borderColor: '#94baee', color: '#fff' }
};

const ProfileBanner = () => {
  const { state } = useContext(AppContext);
  const router = useRouter();
  const profileName = router?.query?.profile;
  const { profile: _profile, ...queryParams } = router.query;
  const [loginOpen, setLoginOpen] = useState(false);
  const { isProfileView, isVisible } = useProfileBannerState();

  const handleBackToAccount = () => {
    router.push({ url: router.pathname, query: queryParams });
    setTimeout(() => router.reload());
  };

  if (!isVisible) return null;

  return (
    <Stack direction="row" alignItems="center" justifyContent="center" spacing={2} sx={{
      position: 'sticky',
      top: navBarHeight,
      zIndex: (theme) => theme.zIndex.drawer + 1,
      height: profileBannerHeight,
      px: 2,
      bgcolor: '#1C252E',
      borderBottom: '1px solid #2f3641'
    }}>
      {isProfileView ? (
        <>
          <IconEye size={18} style={{ color: '#94baee', flexShrink: 0 }}/>
          <Typography sx={{ fontSize: 14, color: '#94baee' }}>
            Viewing <strong>{profileName}</strong>&apos;s profile
          </Typography>
          {state?.signedIn ? (
            <Button size="small" variant="outlined" onClick={handleBackToAccount} sx={bannerButtonSx}>
              Back to my account
            </Button>
          ) : null}
        </>
      ) : (
        <>
          <IconInfoCircle size={18} style={{ color: '#94baee', flexShrink: 0 }}/>
          <Typography sx={{ fontSize: 14, color: '#94baee' }}>
            Browsing as a guest - numbers fill in once you sign in
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