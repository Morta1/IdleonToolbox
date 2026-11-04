import { useContext, useEffect, useId, useRef, useState } from 'react';
import { Box, Button, Divider, Link, Stack, Typography } from '@mui/material';
import {
  IconBrandAppleFilled, IconBrandGoogleFilled, IconBrandSteamFilled, IconCheck, IconChevronLeft, IconChevronRight,
  IconMail, IconX
} from '@tabler/icons-react';
import { useLocalStorage } from '@mantine/hooks';
import Router from 'next/router';
import AppDialog from '@components/common/Overlays/AppDialog';
import { SHEET_BOTTOM } from '@components/common/Overlays/OverlayActions';
import { isModifiedClick } from '@components/wiki/links';
import EmailLogin from '../Logins/EmailLogin';
import GoogleLogin from '../Logins/GoogleLogin';
import AppleLogin from '../Logins/AppleLogin';
import SteamLogin from '../Logins/SteamLogin';
import { fieldEdge } from '../Logins/look';
import { AppContext } from '../context/AppProvider';
import { routeNeedsAccount } from '@utility/account-routes';
import { touchTarget } from '../../../styles/theme/darkTheme';

// The four ways into the game's account (Sign in board). The ids are AppProvider's loginType values.
const METHODS = [
  { id: 'google', label: 'Google', Icon: IconBrandGoogleFilled, Flow: GoogleLogin },
  { id: 'steam', label: 'Steam', Icon: IconBrandSteamFilled, Flow: SteamLogin },
  { id: 'apple', label: 'Apple', Icon: IconBrandAppleFilled, Flow: AppleLogin },
  { id: 'email', label: 'email', Icon: IconMail, Flow: EmailLogin }
];

// Remembered on this device when a flow's first action runs, so a returning player taps once.
const LAST_METHOD_KEY = 'signin:method';

const orderMethods = (last) => {
  const first = METHODS.find((method) => method.id === last);
  return first ? [first, ...METHODS.filter((method) => method !== first)] : METHODS;
};

const SOURCE_URL = 'https://github.com/Morta1/IdleonToolbox/tree/main/services/auth';

// What a player wants to know before handing over a Google or Steam sign-in. Each line is true of the code:
// firebase/index.js only reads, the save arrives through onSnapshot, and an email password goes only to
// the game's own Firebase project.
const READS = ['Your characters, items and progress', 'Live updates while the game runs'];
const NEVER = [
  'Store your password. Google, Apple and Steam passwords stay on their own pages; an email password goes straight to the game\'s sign-in service.',
  'Change your save. It only reads.',
  'Payments or gem purchases'
];

// The board's title block: the close on the title's line, out in the gutter, and no more room under the title
// than the line that follows wants.
const HEADER_SX = { pb: 0.5, '& > .MuiIconButton-root': { mr: '-10px' } };

const METHOD_SX = {
  height: 48, px: '14px', gap: 1.5, justifyContent: 'flex-start', textAlign: 'left', borderRadius: '6px',
  fontSize: 14, fontWeight: 400, lineHeight: 1.43, letterSpacing: 'normal', color: 'text.primary'
};
const LIST_SX = { listStyle: 'none', p: 0, m: 0, mb: 1, gap: '7px', fontSize: 13, lineHeight: '18px' };

// The sample account loads with the page (AppProvider's init runs once per load), so this is a real
// navigation: the page on screen when it reads an account, the dashboard otherwise. Read from the Router
// singleton at click time: the dialog also renders where no router is mounted (tests), and useRouter throws there.
const SAMPLE_FALLBACK = '/dashboard?demo=true';
const sampleHref = (router) => {
  if (!routeNeedsAccount(router.pathname)) return SAMPLE_FALLBACK;
  const [path, query = ''] = router.asPath.split('#')[0].split('?');
  const params = new URLSearchParams(query);
  params.delete('profile');
  params.set('demo', 'true');
  return `${path}?${params}`;
};
const openSample = (event) => {
  if (isModifiedClick(event)) return;
  event.preventDefault();
  window.location.assign(sampleHref(Router));
};

const Line = ({ Glyph, color, children }) => <Stack component="li" direction="row" gap={1} alignItems="flex-start">
  <Box component="span" aria-hidden sx={{ color, display: 'inline-flex', flexShrink: 0, pt: '2px' }}><Glyph size={14} stroke={2}/></Box>
  <span>{children}</span>
</Stack>;

const ReadsPanel = ({ open, onToggle }) => {
  const panelId = useId();
  return <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
    <Button variant="outlined" color="inherit" onClick={onToggle} aria-expanded={open} aria-controls={panelId}
            sx={{
              display: { xs: 'flex', sm: 'none' }, height: 44, px: '14px', justifyContent: 'space-between', borderRadius: '6px',
              borderColor: 'divider', fontSize: 14, fontWeight: 400, letterSpacing: 'normal', textAlign: 'left', color: 'text.primary'
            }}>
      <span>What the toolbox reads, and never does</span>
      <Box component="span" aria-hidden sx={{ display: 'inline-flex', color: 'text.muted', transform: open ? 'rotate(90deg)' : undefined }}>
        <IconChevronRight size={14}/>
      </Box>
    </Button>
    <Box id={panelId} sx={{
      display: { xs: open ? 'flex' : 'none', sm: 'flex' }, flexDirection: 'column', gap: 1, flex: 1, mt: { xs: 1.5, sm: 0 },
      pl: { md: 3 }, borderLeft: { md: 1 }, borderColor: { md: 'divider' }, typography: 'body2', color: 'text.secondary'
    }}>
      <Typography variant="body2" fontWeight={500} color="text.primary">What the toolbox reads</Typography>
      <Stack component="ul" sx={LIST_SX}>
        {READS.map((text) => <Line key={text} Glyph={IconCheck} color="text.success">{text}</Line>)}
      </Stack>
      <Typography variant="body2" fontWeight={500} color="text.primary">What it never does</Typography>
      <Stack component="ul" sx={LIST_SX}>
        {NEVER.map((text) => <Line key={text} Glyph={IconX} color="text.error">{text}</Line>)}
      </Stack>
      <Box sx={{ mt: 'auto', fontSize: 12.5 }}>
        Open source.{' '}
        <Link href={SOURCE_URL} target="_blank" rel="noopener" underline="hover" sx={touchTarget}>
          See how sign-in works ›
        </Link>
      </Box>
    </Box>
  </Box>;
};

const LoginDialog = ({ open, onClose }) => {
  const { state, dispatch, setWaitingForAuth } = useContext(AppContext);
  const [methodId, setMethodId] = useState(null);
  const [showReads, setShowReads] = useState(false);
  const [shownFor, setShownFor] = useState(open);
  const [lastMethod, setLastMethod] = useLocalStorage({ key: LAST_METHOD_KEY });
  const body = useRef(null);
  // Set by a pick or by All sign-in options, so focus moves only after a step change, never on opening.
  const stepChanged = useRef(false);

  // Every opening starts at the picker, as today's tabs started on Email.
  if (open !== shownFor) {
    setShownFor(open);
    if (open) {
      setMethodId(null);
      setShowReads(false);
    }
  }

  // A sign-in closes the dialog for every opener, as LoginButton and UserMenu already did. The landing
  // page kept it open over its new "Open your dashboard" button.
  useEffect(() => {
    if (state?.signedIn && open) onClose();
  }, [state?.signedIn]);

  // A step change unmounts the button that had the focus, which would fall to the dialog's frame: a picked
  // flow takes it on its title, the picker on its first method.
  useEffect(() => {
    if (!stepChanged.current) return;
    stepChanged.current = false;
    const dialog = body.current?.closest('[role="dialog"]');
    if (methodId) {
      const title = dialog && document.getElementById(dialog.getAttribute('aria-labelledby'));
      title?.setAttribute('tabindex', '-1');
      title?.focus();
    } else {
      body.current?.querySelector('button')?.focus();
    }
  }, [methodId]);

  // What today's tab change did: drop the last error and stop any poll the flow armed.
  const leaveFlow = () => {
    dispatch({ type: 'loginError', data: null });
    setWaitingForAuth(false);
  };
  const handleClose = () => {
    leaveFlow();
    onClose();
  };
  const method = METHODS.find(({ id }) => id === methodId);

  if (method) {
    const { Flow, id, label } = method;
    return <AppDialog open={open} onClose={handleClose} size="m" phone="full" pinTop title={`Sign in with ${label}`}>
      <Button ref={body} size="small" startIcon={<IconChevronLeft size={18}/>} sx={{ alignSelf: 'flex-start', mb: 2, px: 0, ...touchTarget }}
              onClick={() => {
                leaveFlow();
                stepChanged.current = true;
                setMethodId(null);
              }}>
        All sign-in options
      </Button>
      <Flow onStart={() => setLastMethod(id)}/>
    </AppDialog>;
  }

  return <AppDialog open={open} onClose={handleClose} size="l" phone="full" pinTop title="Sign in" headerSx={HEADER_SX}>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Use the account you play Legends of Idleon with.</Typography>
    {/* Full screen on a phone, where the dialog adds no room of its own under the last line */}
    <Box sx={{
      display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1fr) 290px' }, columnGap: 3, rowGap: 2,
      pb: { xs: SHEET_BOTTOM, sm: '6px' }
    }}>
      <Stack sx={{ gap: { xs: 2, md: '14px' }, minWidth: 0 }}>
        <Stack ref={body} gap={1.25}>
          {orderMethods(lastMethod).map(({ id, label, Icon }) => (
            <Button key={id} variant="outlined" color="inherit"
                    onClick={() => {
                      leaveFlow();
                      stepChanged.current = true;
                      setMethodId(id);
                    }}
                    sx={{ ...METHOD_SX, borderColor: id === lastMethod ? 'primary.edge' : fieldEdge }}>
              <Icon size={20} style={{ flexShrink: 0 }}/>
              <span>Continue with {label}</span>
              {id === lastMethod ? <Box component="span" sx={{ ml: 'auto', typography: 'caption', color: 'text.secondary' }}>
                Last used
              </Box> : null}
              <Box component="span" aria-hidden sx={{ display: 'inline-flex', ml: id === lastMethod ? '10px' : 'auto', color: 'text.muted' }}>
                <IconChevronRight size={14}/>
              </Box>
            </Button>
          ))}
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
          Not sure which one? It&apos;s the one you pick on the game&apos;s login screen.
        </Typography>
        {!state?.demo ? <>
          <Divider sx={{ my: '2px' }}/>
          <Stack direction="row" alignItems="center" flexWrap="wrap"
                 sx={{ columnGap: '14px', minHeight: 32, typography: 'body2', color: 'text.secondary' }}>
            <span>Just looking?</span>
            <Link href={SAMPLE_FALLBACK} onClick={openSample} underline="hover" sx={touchTarget}>
              Browse the sample account
            </Link>
          </Stack>
        </> : null}
      </Stack>
      <ReadsPanel open={showReads} onToggle={() => setShowReads(!showReads)}/>
    </Box>
  </AppDialog>;
};

export default LoginDialog;
