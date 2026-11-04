import { Stack, Typography } from '@mui/material';
import { IconExternalLink } from '@tabler/icons-react';
import React, { useContext, useState } from 'react';
import { appleAuthorize, getAppleCode, openAuthPopup } from '../../../services/auth/apple';
import { AppContext } from '../context/AppProvider';
import { describeLoginError } from '@utility/loginErrors';
import LoginErrorAlert from './LoginErrorAlert';
import FlowAction from './FlowAction';
import { FLOW_SX } from './look';

const APPLE_LOGIN_TIMEOUT = 10 * 60 * 1000;

const AppleLogin = ({ onStart }) => {
  const { state, dispatch, waitingForAuth, setWaitingForAuth } = useContext(AppContext);
  const [fetchingCode, setFetchingCode] = useState(false);

  const handleAppleLogin = async () => {
    if (fetchingCode || waitingForAuth) return;
    onStart?.();
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
      console.error('Apple sign-in failed to start:', e);
      // The browser blocked the pop-up, or Apple's service did not answer: each has its own next step.
      const blocked = !popup || e?.code === 'APPLE_POPUP_BLOCKED';
      dispatch({ type: 'loginError', data: describeLoginError(blocked ? 'APPLE_POPUP_BLOCKED' : 'APPLE_START_FAILED') })
    } finally {
      setFetchingCode(false);
    }
  }

  return <Stack sx={FLOW_SX}>
    <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13.5, lineHeight: '19px' }}>
      Apple&apos;s sign-in opens in a pop-up. Finish there, then come back to this tab.
    </Typography>
    <LoginErrorAlert sx={{ mt: 2 }} error={state?.loginError}/>
    <FlowAction loading={fetchingCode} inert={waitingForAuth} icon={<IconExternalLink size={14} stroke={2.2}/>}
                onClick={handleAppleLogin} status={waitingForAuth ? 'Waiting for Apple' : null}>
      Open Apple sign-in
    </FlowAction>
  </Stack>
};

export default AppleLogin;
