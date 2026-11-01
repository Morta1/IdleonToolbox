import { Box, CircularProgress, Stack } from '@mui/material';
import Link from '@mui/material/Link';
import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppProvider';
import { getUserAndDeviceCode } from '../../../services/auth/google';
import { copyText } from '@utility/clipboard';
import { describeLoginError } from '@utility/loginErrors';
import LoginErrorAlert from './LoginErrorAlert';
import SignInSteps from './SignInSteps';
import FlowAction from './FlowAction';

const googleDeviceUrl = 'https://www.google.com/device';
const GoogleLogin = ({ onStart }) => {
  const { state, dispatch, setWaitingForAuth } = useContext(AppContext);
  const [userCode, setUserCode] = useState('');
  const [copyFailed, setCopyFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [minutes, setMinutes] = useState(null);
  const [openedGooglePage, setOpenedGooglePage] = useState(false);

  useEffect(() => {
    const getCode = async () => {
      const codeReqResponse = await getUserAndDeviceCode().catch(() => null);
      if (!codeReqResponse?.user_code) {
        dispatch({ type: 'loginError', data: describeLoginError('GOOGLE_UNREACHABLE') });
        return;
      }
      const userCode = codeReqResponse?.user_code
      const deviceCode = codeReqResponse?.device_code
      const expiresAt = Date.now() + ((codeReqResponse?.expires_in || 1800) * 1000);
      setUserCode(userCode);
      setMinutes(Math.round((codeReqResponse?.expires_in || 1800) / 60));
      dispatch({ type: 'login', data: { loginData: { userCode, deviceCode, expiresAt }, loginType: 'google' } })
      setWaitingForAuth(true);
    }
    getCode();
  }, []);

  const handleCopyAndOpenUrl = async () => {
    onStart?.();
    window.open(googleDeviceUrl, '_blank', 'noopener,noreferrer');
    setWaitingForAuth(true);
    setOpenedGooglePage(true);
    const copiedNow = await copyText(userCode);
    setCopied(copiedNow);
    setCopyFailed(!copiedNow);
  }

  return <Stack sx={{ flex: 1 }}>
    <SignInSteps steps={[
      { title: 'Copy your code', done: copied, children: <>
        <Box component="code" sx={{ display: 'inline-block', mt: 0.5, px: 1.5, py: 0.5, border: 1, borderColor: 'divider',
                                    borderRadius: 1, typography: 'body1', fontFamily: 'monospace', color: 'text.primary', userSelect: 'all' }}>
          {userCode || <CircularProgress size={14}/>}
        </Box>
        {copyFailed ? <Box sx={{ mt: 0.5 }}>Couldn&apos;t copy it: select the code and copy it yourself.</Box> : null}
      </> },
      { title: 'Enter it on Google\'s page', children: <>
        Google asks you to confirm on its own site:{' '}
        <Link target="_blank" href={googleDeviceUrl} rel="noreferrer" onClick={() => setOpenedGooglePage(true)}>google.com/device</Link>
      </> },
      { title: 'Come back here', children: `The toolbox checks every few seconds and signs you in once Google confirms.${minutes ? ` The code works for ${minutes} minutes.` : ''}` }
    ]}/>
    <LoginErrorAlert sx={{ mt: 2 }} error={state?.loginError}/>
    <FlowAction loading={(!userCode && !state?.loginError) || (openedGooglePage && !state?.loginError)} disabled={!userCode}
                onClick={handleCopyAndOpenUrl} status={openedGooglePage && !state?.loginError ? 'Waiting for Google' : null}>
      Copy code and open Google
    </FlowAction>
  </Stack>
};

export default GoogleLogin;
