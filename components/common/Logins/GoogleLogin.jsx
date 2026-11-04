import { Box, CircularProgress, Stack } from '@mui/material';
import Link from '@mui/material/Link';
import { IconCheck, IconExternalLink } from '@tabler/icons-react';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { AppContext } from '../context/AppProvider';
import { getUserAndDeviceCode } from '../../../services/auth/google';
import { copyText } from '@utility/clipboard';
import { describeLoginError } from '@utility/loginErrors';
import LoginErrorAlert from './LoginErrorAlert';
import SignInSteps from './SignInSteps';
import FlowAction from './FlowAction';
import { codeFill, fieldEdge, FLOW_SX } from './look';

const googleDeviceUrl = 'https://www.google.com/device';

// The board's code box. A longer code than the board's on a narrow phone lets "Copied" take its own line.
const CODE_BOX_SX = {
  display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', columnGap: 1, boxSizing: 'border-box',
  minHeight: 52, mt: 0.5, pl: 2, pr: '14px', borderRadius: '8px', border: 1, borderColor: fieldEdge, bgcolor: codeFill, color: 'text.primary'
};

// The line the board ends step 3 with, counted down from Google's expires_in: its own component, so only this line ticks.
const CodeExpiry = ({ expiresAt, seconds }) => {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    const timer = setInterval(() => setLeft(Math.max(0, Math.round((expiresAt - Date.now()) / 1000))), 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);
  return ` The code expires in ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}.`;
};

const GoogleLogin = ({ onStart }) => {
  const { state, dispatch, setWaitingForAuth } = useContext(AppContext);
  const [userCode, setUserCode] = useState('');
  const [copyFailed, setCopyFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expiry, setExpiry] = useState(null);
  const [openedGooglePage, setOpenedGooglePage] = useState(false);

  // Google's answer to a code request: when the flow opens, and again from Try again.
  const applyCode = (codeReqResponse) => {
    if (!codeReqResponse?.user_code) {
      dispatch({ type: 'loginError', data: describeLoginError('GOOGLE_UNREACHABLE') });
      return;
    }
    const userCode = codeReqResponse?.user_code
    const deviceCode = codeReqResponse?.device_code
    const expiresAt = Date.now() + ((codeReqResponse?.expires_in || 1800) * 1000);
    setUserCode(userCode);
    setExpiry({ expiresAt, seconds: codeReqResponse?.expires_in || 1800 });
    dispatch({ type: 'login', data: { loginData: { userCode, deviceCode, expiresAt }, loginType: 'google' } })
    setWaitingForAuth(true);
  };

  // Closing the dialog (or leaving the tab) ends the flow: a code that arrives afterwards must not
  // arm the poll, and an armed poll must stop, or the visitor gets signed in by a dialog they closed.
  // The flow number moves on every close, so a code requested before it is dropped.
  const flow = useRef(0);
  const requestCode = () => {
    const requestedIn = flow.current;
    return getUserAndDeviceCode().catch(() => null).then((response) => {
      if (requestedIn === flow.current) applyCode(response);
    });
  };

  useEffect(() => {
    requestCode();
    return () => {
      flow.current += 1;
      setWaitingForAuth(false);
    };
  }, []);

  // After any failure (Google unreachable, the code refused or expired) the flow starts over with a new code.
  const tryAgain = () => {
    dispatch({ type: 'loginError', data: null });
    setUserCode('');
    setExpiry(null);
    setCopied(false);
    setCopyFailed(false);
    setOpenedGooglePage(false);
    requestCode();
  };
  const failed = Boolean(state?.loginError);

  const handleCopyAndOpenUrl = async () => {
    onStart?.();
    window.open(googleDeviceUrl, '_blank', 'noopener,noreferrer');
    setWaitingForAuth(true);
    setOpenedGooglePage(true);
    const copiedNow = await copyText(userCode);
    setCopied(copiedNow);
    setCopyFailed(!copiedNow);
  }

  return <Stack sx={FLOW_SX}>
    <SignInSteps steps={[
      { title: 'Copy your code', done: copied, children: <>
        {/* No code after a failure: no box, and no spinner that never stops */}
        {userCode || !failed ? <Box sx={CODE_BOX_SX}>
          {userCode ? <Box component="code" sx={{ fontFamily: 'monospace', fontSize: 22, letterSpacing: '.14em', whiteSpace: 'nowrap', userSelect: 'all' }}>
            {userCode}
          </Box> : <CircularProgress size={14}/>}
          {copied ? <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: 12.5, color: 'text.success', whiteSpace: 'nowrap' }}>
            <IconCheck size={14} stroke={2}/>Copied
          </Box> : null}
        </Box> : null}
        {copyFailed ? <span>Couldn&apos;t copy it: select the code and copy it yourself.</span> : null}
      </> },
      { title: 'Enter it on Google\'s page', children: <span>
        Google asks you to confirm on its own site:{' '}
        <Link target="_blank" href={googleDeviceUrl} rel="noreferrer" underline="hover" onClick={() => setOpenedGooglePage(true)}>google.com/device</Link>
      </span> },
      { title: 'Come back here', children: <span>
        The toolbox checks every few seconds and signs you in once Google confirms.
        {expiry && !failed ? <CodeExpiry {...expiry}/> : null}
      </span> }
    ]}/>
    <LoginErrorAlert sx={{ mt: 2 }} error={state?.loginError}/>
    {failed
      ? <FlowAction onClick={tryAgain}>Try again</FlowAction>
      : <FlowAction loading={!userCode} inert={openedGooglePage} icon={<IconExternalLink size={14} stroke={2.2}/>}
                    onClick={handleCopyAndOpenUrl} status={openedGooglePage ? 'Waiting for Google' : null}>
        Copy code and open Google
      </FlowAction>}
  </Stack>
};

export default GoogleLogin;
