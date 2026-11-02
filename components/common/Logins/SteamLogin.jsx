import { Link, Stack, TextField } from '@mui/material';
import { useContext, useRef, useState } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { getSteamParams, normalizeSteamUrl } from '../../../services/auth/steam';
import { toLoginError } from '@utility/loginErrors';
import LoginErrorAlert from './LoginErrorAlert';
import SignInSteps from './SignInSteps';
import FlowAction from './FlowAction';
import { touchTarget } from '../../../styles/theme/darkTheme';

const STEAM_OPENID_URL = 'https://steamcommunity.com/openid/login?' +
  'openid.ns=http://specs.openid.net/auth/2.0&' +
  'openid.claimed_id=http://specs.openid.net/auth/2.0/identifier_select&' +
  'openid.identity=http://specs.openid.net/auth/2.0/identifier_select&' +
  `openid.return_to=https://www.legendsofidleon.com/steamsso/&` +
  `openid.realm=https://www.legendsofidleon.com/steamsso/&` +
  'openid.mode=checkid_setup';

const SteamLogin = ({ onStart }) => {
  const { state, dispatch, waitingForAuth, setWaitingForAuth } = useContext(AppContext);
  const [steamUrl, setSteamUrl] = useState('');
  const [error, setError] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [opened, setOpened] = useState(false);
  const [pasteHint, setPasteHint] = useState(false);
  // The last address sent: each one works once, so a refused address is never sent again, and pasting it
  // again shows why.
  const sent = useRef('');
  const refused = useRef(null);
  const field = useRef(null);

  const handleOpen = () => {
    onStart?.();
    setOpened(true);
    window.open(STEAM_OPENID_URL, '_blank', 'popup');
  };

  // Today's Login handler from the normalised address on, unchanged.
  const signIn = async (url) => {
    setError(null);
    dispatch({ type: 'loginError', data: null });
    try {
      setSteamUrl(url);
      setVerifying(true);
      const token = await getSteamParams(url);
      setWaitingForAuth(true);
      dispatch({ type: 'login', data: { loginData: { token }, loginType: 'steam' } });
    } catch (e) {
      const loginError = toLoginError(e);
      // A network or server failure can be retried by pasting again; a refused address cannot: the field
      // clears and the flow starts over at Steam's page, which gives a new address.
      if (loginError.code !== 'STEAM_URL_REJECTED') {
        sent.current = '';
      } else {
        refused.current = loginError;
        setSteamUrl('');
        setOpened(false);
      }
      setError(loginError);
    } finally {
      setVerifying(false);
    }
  };

  // A pasted address signs in at once; a typed one waits for Sign in (Decision 3, the owner's choice). Typing shows no
  // error until a paste, Sign in or the field losing focus, as today's button showed none until it was pressed.
  const tryAddress = (text, { showErrors, submit = true }) => {
    setSteamUrl(text);
    setPasteHint(false);
    let url;
    try {
      url = normalizeSteamUrl(text);
    } catch (e) {
      setError(showErrors && text.trim() ? toLoginError(e) : null);
      return;
    }
    if (url === sent.current) {
      setError(refused.current);
      return;
    }
    setError(null);
    if (!submit || verifying || waitingForAuth) return;
    sent.current = url;
    refused.current = null;
    onStart?.();
    signIn(url);
  };

  const pasteFromClipboard = async () => {
    let text = null;
    try {
      text = await navigator.clipboard?.readText?.();
    } catch {
      text = null;
    }
    if (text) {
      tryAddress(text, { showErrors: true });
      return;
    }
    setPasteHint(true);
    field.current?.focus();
  };

  return <Stack sx={{ flex: 1 }}>
    <SignInSteps steps={[
      { title: 'Sign in on Steam', done: opened, children: <>
        A new tab opens Steam&apos;s own sign-in page.
        {opened ? <> <Link component="button" type="button" onClick={handleOpen} sx={{ verticalAlign: 'baseline', ...touchTarget }}>Open it again</Link></> : null}
      </> },
      { title: 'Copy the address of the page Steam sends you to', children:
          'It starts with legendsofidleon.com/steamsso. Don\'t press the big blue button on that page: copy the address bar.' },
      { title: 'Paste it here', children: <TextField
        inputRef={field} fullWidth size="small" sx={{ mt: 1 }} label="Steam page address"
        placeholder="legendsofidleon.com/steamsso?..." value={steamUrl} error={Boolean(error) && Boolean(steamUrl.trim())}
        helperText={pasteHint ? 'Paste the address into this field' : 'Signs you in as soon as a valid address is pasted, or press Sign in.'}
        // The line under the field is an instruction, never the error: the note under the steps says that
        slotProps={{ formHelperText: { error: false } }}
        onChange={(event) => tryAddress(event.target.value, { showErrors: false, submit: false })}
        onPaste={(event) => {
          const text = event.clipboardData?.getData('text');
          if (!text) return;
          event.preventDefault();
          tryAddress(text, { showErrors: true });
        }}
        onBlur={() => {
          if (steamUrl.trim()) tryAddress(steamUrl, { showErrors: true, submit: false });
        }}/> }
    ]}/>
    <LoginErrorAlert sx={{ mt: 2 }} error={error ?? state?.loginError}/>
    <FlowAction loading={waitingForAuth || verifying}
                onClick={!opened ? handleOpen : steamUrl.trim() ? () => tryAddress(steamUrl, { showErrors: true }) : pasteFromClipboard}>
      {!opened ? 'Open Steam sign-in' : steamUrl.trim() ? 'Sign in' : 'Paste from clipboard'}
    </FlowAction>
  </Stack>;
};

export default SteamLogin;
