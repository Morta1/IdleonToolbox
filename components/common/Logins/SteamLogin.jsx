import { Button, InputAdornment, Link, Stack, TextField } from '@mui/material';
import { IconExternalLink } from '@tabler/icons-react';
import { useContext, useRef, useState } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { getSteamParams, normalizeSteamUrl } from '../../../services/auth/steam';
import { toLoginError } from '@utility/loginErrors';
import LoginErrorAlert from './LoginErrorAlert';
import SignInSteps from './SignInSteps';
import FlowAction, { ActionButton } from './FlowAction';
import { FIELD_SX, FLOW_SX } from './look';
import { touchTarget } from '../../../styles/theme/darkTheme';

const STEAM_OPENID_URL = 'https://steamcommunity.com/openid/login?' +
  'openid.ns=http://specs.openid.net/auth/2.0&' +
  'openid.claimed_id=http://specs.openid.net/auth/2.0/identifier_select&' +
  'openid.identity=http://specs.openid.net/auth/2.0/identifier_select&' +
  `openid.return_to=https://www.legendsofidleon.com/steamsso/&` +
  `openid.realm=https://www.legendsofidleon.com/steamsso/&` +
  'openid.mode=checkid_setup';

const OPENS_ICON = <IconExternalLink size={14} stroke={2.2}/>;
// The board's desktop draws each action inside its step; on a phone the one in reach is the sticky FlowAction's.
const IN_STEP_SX = { display: { xs: 'none', sm: 'inline-flex' }, alignSelf: 'flex-start', mt: '6px' };
const PASTE_SX = { minWidth: 0, px: 1, fontSize: 14, fontWeight: 400, letterSpacing: 'normal', ...touchTarget };

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

  const busy = waitingForAuth || verifying;
  const typed = Boolean(steamUrl.trim());
  const signInTyped = () => tryAddress(steamUrl, { showErrors: true });

  return <Stack sx={FLOW_SX}>
    <SignInSteps steps={[
      { title: 'Sign in on Steam', done: opened, children: <>
        <span>
          A new tab opens Steam&apos;s own sign-in page.
          {opened ? <> <Link component="button" type="button" underline="hover" onClick={handleOpen} sx={{ verticalAlign: 'baseline', ...touchTarget }}>Open it again</Link></> : null}
        </span>
        {!opened ? <ActionButton disabled={busy} icon={OPENS_ICON} onClick={handleOpen} sx={IN_STEP_SX}>Open Steam sign-in</ActionButton> : null}
      </> },
      { title: 'Copy the address of the page Steam sends you to', children:
          'It starts with legendsofidleon.com/steamsso. Don\'t press anything on that page.' },
      { title: 'Paste it here', children: <>
        <TextField
          inputRef={field} fullWidth label="Steam page address" sx={FIELD_SX}
          placeholder="legendsofidleon.com/steamsso?…" value={steamUrl} error={Boolean(error) && typed}
          helperText={pasteHint ? 'Paste the address into this field' : 'Signs you in as soon as a valid address is pasted.'}
          slotProps={{
            // The line under the field is an instruction, never the error: the note under the steps says that. The
            // board's phone has its action in reach and no such line, until the clipboard can't be read.
            formHelperText: {
              error: false,
              sx: { display: { xs: pasteHint ? 'block' : 'none', sm: 'block' }, mt: 1, fontSize: 13.5, lineHeight: '19px', color: 'text.secondary' }
            },
            input: {
              sx: { pr: '4px' },
              endAdornment: <InputAdornment position="end" sx={{ display: { xs: 'none', sm: 'flex' }, ml: 1 }}>
                <Button size="small" onClick={pasteFromClipboard} sx={PASTE_SX}>Paste</Button>
              </InputAdornment>
            }
          }}
          onChange={(event) => tryAddress(event.target.value, { showErrors: false, submit: false })}
          onPaste={(event) => {
            const text = event.clipboardData?.getData('text');
            if (!text) return;
            event.preventDefault();
            tryAddress(text, { showErrors: true });
          }}
          onBlur={() => {
            if (steamUrl.trim()) tryAddress(steamUrl, { showErrors: true, submit: false });
          }}/>
        {typed ? <ActionButton loading={busy} onClick={signInTyped} sx={IN_STEP_SX}>Sign in</ActionButton> : null}
      </> }
    ]}/>
    <LoginErrorAlert sx={{ mt: 2 }} error={error ?? state?.loginError}/>
    <FlowAction phoneOnly loading={busy} icon={!opened ? OPENS_ICON : null}
                onClick={!opened ? handleOpen : typed ? signInTyped : pasteFromClipboard}>
      {!opened ? 'Open Steam sign-in' : typed ? 'Sign in' : 'Paste from clipboard'}
    </FlowAction>
  </Stack>;
};

export default SteamLogin;
