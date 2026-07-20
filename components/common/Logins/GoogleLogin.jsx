import { CircularProgress, Stack, Typography } from '@mui/material';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppProvider';
import { getUserAndDeviceCode } from '../../../services/auth/google';

const googleDeviceUrl = 'https://www.google.com/device';
const GoogleLogin = () => {
  const { state, dispatch, setWaitingForAuth } = useContext(AppContext);
  const [userCode, setUserCode] = useState('');
  const [copyFailed, setCopyFailed] = useState(false);
  const [openedGooglePage, setOpenedGooglePage] = useState(false);

  useEffect(() => {
    const getCode = async () => {
      const codeReqResponse = await getUserAndDeviceCode();
      const userCode = codeReqResponse?.user_code
      const deviceCode = codeReqResponse?.device_code
      const expiresAt = Date.now() + ((codeReqResponse?.expires_in || 1800) * 1000);
      setUserCode(userCode);
      dispatch({ type: 'login', data: { loginData: { userCode, deviceCode, expiresAt }, loginType: 'google' } })
      setWaitingForAuth(true);
    }
    getCode();
  }, []);

  const handleCopyAndOpenUrl = () => {
    window.open(googleDeviceUrl, '_blank', 'noopener,noreferrer');
    setWaitingForAuth(true);
    setOpenedGooglePage(true);

    navigator.clipboard?.writeText(userCode).catch((err) => {
      console.error('Could not copy the login code to the clipboard:', err);
      setCopyFailed(true);
    });
  }

  return <Stack alignItems={'center'} gap={2} sx={{ px: 5 }}>
    <Typography textAlign={'center'}>To sign in with Google, go to the following url and enter the code below to verify
      it is
      you</Typography>
    <Link mr={1} target="_blank" href={googleDeviceUrl} rel="noreferrer" onClick={() => setOpenedGooglePage(true)}>
      https://www.google.com/device
    </Link>
    <Typography justifySelf={'center'}
                textAlign={'center'}
                sx={{ p: 1, border: '1px solid white', borderRadius: 1, margin: '0 auto', minWidth: 100 }}
                width={'fit-content'}>
      {userCode ? userCode : <CircularProgress sx={{ textAlign: 'center' }} size={14}/>}
    </Typography>
    <Button 
      loading={!userCode || (openedGooglePage && !state?.loginError)}
      variant={'contained'} 
      onClick={handleCopyAndOpenUrl}
    >
      Copy code and open Url
    </Button>
    {copyFailed ? <Typography variant={'caption'}>Couldn't copy automatically - please copy the code above
      manually.</Typography> : null}
    <Typography mt={2} color={'error'} variant={'body1'}>{state?.loginError}</Typography>
  </Stack>
};

export default GoogleLogin;
