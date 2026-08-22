import { Stack, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import React, { useContext, useState } from 'react';
import { appleAuthorize, getAppleCode, openAuthPopup } from '../../../services/auth/apple';
import { AppContext } from '../context/AppProvider';

const APPLE_LOGIN_TIMEOUT = 10 * 60 * 1000;

const AppleLogin = () => {
  const { state, dispatch, waitingForAuth, setWaitingForAuth } = useContext(AppContext);
  const [fetchingCode, setFetchingCode] = useState(false);

  const handleAppleLogin = async () => {
    if (fetchingCode || waitingForAuth) return;
    setFetchingCode(true);
    // Opened here and not after the await, otherwise it's outside the user gesture and safari blocks it.
    const popup = openAuthPopup();
    try {
      const userCode = await getAppleCode();
      await appleAuthorize(userCode, popup);
      // loginType has to land before the auth poll is armed. The poll ticks 1s after waitingForAuth
      // flips, and on a phone the code request alone takes longer than that, so arming first sent
      // the first tick down the google branch with no device code and killed the flow.
      dispatch({
        type: 'login',
        data: {
          loginData: { ...(userCode || {}), expiresAt: Date.now() + APPLE_LOGIN_TIMEOUT },
          loginType: 'apple'
        }
      })
      setWaitingForAuth(true);
    } catch (e) {
      popup?.close();
      setWaitingForAuth(false);
      dispatch({ type: 'loginError', data: e?.message || 'Could not start the apple sign-in, please try again.' })
    } finally {
      setFetchingCode(false);
    }
  }

  return <Stack sx={{ px: 5 }}>
    <Typography textAlign={'center'}>
      An Apple Sign-in page will open for you in a popup, Please complete the steps there, then return here
    </Typography>
    <Typography textAlign={'center'} variant={'caption'}>* please make sure you enable pop-ups in your
      browser</Typography>
    <Button 
      loading={fetchingCode || waitingForAuth} 
      sx={{ mt: 3 }} 
      onClick={handleAppleLogin}
      variant={'contained'}
    >
      Login
    </Button>
    <Typography mt={2} color={'error'} variant={'body1'}>{state?.loginError}</Typography>
  </Stack>
};

export default AppleLogin;
