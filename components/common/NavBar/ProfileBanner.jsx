import React, { useContext } from 'react';
import { Button, Stack, Typography } from '@mui/material';
import { IconEye } from '@tabler/icons-react';
import { useRouter } from 'next/router';
import { AppContext } from '../context/AppProvider';
import { navBarHeight } from '../../constants';

const ProfileBanner = () => {
  const { state } = useContext(AppContext);
  const router = useRouter();
  const profileName = router?.query?.profile;
  const { profile: _profile, ...queryParams } = router.query;

  const handleBackToAccount = () => {
    router.push({ url: router.pathname, query: queryParams });
    setTimeout(() => router.reload());
  };

  if (!state?.profile || !profileName) return null;

  return (
    <Stack direction="row" alignItems="center" justifyContent="center" spacing={2} sx={{
      position: 'sticky',
      top: navBarHeight,
      zIndex: (theme) => theme.zIndex.drawer + 1,
      px: 2,
      py: 0.75,
      bgcolor: '#1C252E',
      borderBottom: '1px solid #2f3641'
    }}>
      <IconEye size={18} style={{ color: '#94baee', flexShrink: 0 }}/>
      <Typography sx={{ fontSize: 14, color: '#94baee' }}>
        Viewing <strong>{profileName}</strong>&apos;s profile
      </Typography>
      {state?.signedIn ? (
        <Button
          size="small"
          variant="outlined"
          onClick={handleBackToAccount}
          sx={{
            ml: 1,
            fontSize: 12,
            textTransform: 'none',
            color: '#94baee',
            borderColor: '#2087e8',
            '&:hover': { borderColor: '#94baee', color: '#fff' }
          }}
        >
          Back to my account
        </Button>
      ) : null}
    </Stack>
  );
};

export default ProfileBanner;
