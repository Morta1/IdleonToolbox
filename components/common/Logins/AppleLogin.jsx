import { Stack, Typography } from '@mui/material';
import React, { useContext } from 'react';
import { appleAuthorize, getAppleCode } from '../../../logins/apple';
import { AppContext } from '../context/AppProvider';
import Button from '@mui/material/Button';

const AppleLogin = () => {
  const { state, dispatch, waitingForAuth, setWaitingForAuth } = useContext(AppContext);

  const handleAppleLogin = async () => {
    if (!waitingForAuth) {
      handleAuthenticating();
      try {
        const userCode = await getAppleCode();
        await appleAuthorize(userCode);
        dispatch({ type: 'login', data: { loginData: { ...(userCode || {}) }, loginType: 'apple' } })
      } catch (e) {
        dispatch({ type: 'loginError', data: e })
      }
    }
  }

  const handleAuthenticating = () => {
    setWaitingForAuth(true);
  }

  return <Stack sx={{ px: 5 }}>
    <Typography textAlign={'center'}>
      An Apple Sign-in page will open for you in a popup, Please complete the steps there, then return here
    </Typography>
    <Typography textAlign={'center'} variant={'caption'}>* please make sure you enable pop-ups in your
      browser</Typography>
    <Button loading={waitingForAuth} sx={{ mt: 3 }} onClick={handleAppleLogin}
                   variant={'contained'}>Login</Button>
    <Typography mt={2} color={'error'} variant={'body1'}>{state?.loginError}</Typography>
  </Stack>
};

export default AppleLogin;
