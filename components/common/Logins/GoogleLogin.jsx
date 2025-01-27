import { CircularProgress, Stack, Typography } from '@mui/material';
import Link from '@mui/material/Link';
import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppProvider';
import Button from '@mui/material/Button';
import { getUserAndDeviceCode } from '../../../logins/google';

const googleDeviceUrl = 'https://www.google.com/device';
const GoogleLogin = () => {
  const { state, dispatch, waitingForAuth, setWaitingForAuth } = useContext(AppContext);
  const [userCode, setUserCode] = useState('');
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    if (clicked && !waitingForAuth) {
      setClicked(false);
    }
  }, [waitingForAuth]);

  useEffect(() => {
    const getCode = async () => {
      const codeReqResponse = await getUserAndDeviceCode();
      const userCode = codeReqResponse?.user_code
      const deviceCode = codeReqResponse?.device_code
      setUserCode(userCode);
      dispatch({ type: 'login', data: { loginData: { userCode, deviceCode }, loginType: 'google' } })
    }
    getCode();
  }, []);

  const handleAuthenticating = () => {
    setWaitingForAuth(true);
  }

  const handleCopyAndOpenUrl = async () => {
    try {
      await navigator.clipboard.writeText(userCode);
      window.open(googleDeviceUrl, '_blank', 'noopener,noreferrer');
      handleAuthenticating();
    } catch (err) {
      console.error(err);
    }
  }

  return <Stack alignItems={'center'} gap={2} sx={{ px: 5 }}>
    <Typography textAlign={'center'}>To sign in with Google, go to the following url and enter the code below to verify
      it is
      you</Typography>
    <Link mr={1} target="_blank" href={googleDeviceUrl} rel="noreferrer" onClick={handleAuthenticating}>
      https://www.google.com/device
    </Link>
    <Typography justifySelf={'center'}
                textAlign={'center'}
                sx={{ p: 1, border: '1px solid white', borderRadius: 1, margin: '0 auto', minWidth: 100 }}
                width={'fit-content'}>
      {userCode ? userCode : <CircularProgress sx={{ textAlign: 'center' }} size={14}/>}
    </Typography>
    <Button loading={clicked || !userCode} variant={'contained'} onClick={handleCopyAndOpenUrl}>
      <span>Copy code and open Url</span>
    </Button>
    <Typography mt={2} color={'error'} variant={'body1'}>{state?.loginError}</Typography>
  </Stack>
};

export default GoogleLogin;
