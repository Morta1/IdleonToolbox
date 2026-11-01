import { useContext, useEffect, useId, useState } from 'react';
import { Box, Button, Link, Stack, Typography } from '@mui/material';
import {
  IconBrandApple, IconBrandGoogle, IconBrandSteam, IconCheck, IconChevronDown, IconChevronLeft, IconChevronRight,
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
import { AppContext } from '../context/AppProvider';
import { routeNeedsAccount } from '@utility/account-routes';

// The four ways into the game's account (Sign in board). The ids are AppProvider's loginType values.
const METHODS = [
  { id: 'google', label: 'Google', Icon: IconBrandGoogle, Flow: GoogleLogin },
  { id: 'steam', label: 'Steam', Icon: IconBrandSteam, Flow: SteamLogin },
  { id: 'apple', label: 'Apple', Icon: IconBrandApple, Flow: AppleLogin },
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
  'Store your password: Google, Apple and Steam passwords stay on their own pages, and an email password goes straight to the game\'s sign-in service',
  'Change your save: it only reads',
  'Payments or gem purchases'
];

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
  <Box component="span" aria-hidden sx={{ color, display: 'inline-flex', pt: '3px' }}><Glyph size={14} stroke={2.5}/></Box>
  <span>{children}</span>
</Stack>;

const ReadsPanel = ({ open, onToggle }) => {
  const panelId = useId();
  return <Box sx={{ width: { md: 260 }, flexShrink: 0 }}>
    <Button size="small" onClick={onToggle} aria-expanded={open} aria-controls={panelId}
            endIcon={<IconChevronDown size={16} style={{ transform: open ? 'rotate(180deg)' : undefined }}/>}
            sx={{ display: { xs: 'inline-flex', sm: 'none' }, px: 0 }}>
      What the toolbox reads, and never does
    </Button>
    <Box id={panelId} sx={{ display: { xs: open ? 'block' : 'none', sm: 'block' }, typography: 'body2', color: 'text.secondary' }}>
      <Typography variant="body2" fontWeight={600} color="text.primary">What the toolbox reads</Typography>
      <Stack component="ul" gap={0.5} sx={{ listStyle: 'none', p: 0, m: 0, mt: 0.5 }}>
        {READS.map((text) => <Line key={text} Glyph={IconCheck} color="text.success">{text}</Line>)}
      </Stack>
      <Typography variant="body2" fontWeight={600} color="text.primary" sx={{ mt: 2 }}>What it never does</Typography>
      <Stack component="ul" gap={0.5} sx={{ listStyle: 'none', p: 0, m: 0, mt: 0.5 }}>
        {NEVER.map((text) => <Line key={text} Glyph={IconX} color="text.secondary">{text}</Line>)}
      </Stack>
      <Link href={SOURCE_URL} target="_blank" rel="noopener" variant="body2" sx={{ display: 'inline-block', mt: 2 }}>
        Open source: see how sign-in works
      </Link>
    </Box>
  </Box>;
};

const LoginDialog = ({ open, onClose }) => {
  const { state, dispatch, setWaitingForAuth } = useContext(AppContext);
  const [methodId, setMethodId] = useState(null);
  const [showReads, setShowReads] = useState(false);
  const [shownFor, setShownFor] = useState(open);
  const [lastMethod, setLastMethod] = useLocalStorage({ key: LAST_METHOD_KEY });

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
    return <AppDialog open={open} onClose={handleClose} size="m" phone="full" title={`Sign in with ${label}`}>
      <Button size="small" startIcon={<IconChevronLeft size={18}/>} sx={{ alignSelf: 'flex-start', mb: 2, px: 0 }}
              onClick={() => {
                leaveFlow();
                setMethodId(null);
              }}>
        All sign-in options
      </Button>
      <Flow onStart={() => setLastMethod(id)}/>
    </AppDialog>;
  }

  return <AppDialog open={open} onClose={handleClose} size="l" phone="full" title="Sign in"
                    subtitle="Use the account you play Legends of Idleon with.">
    {/* Full screen on a phone, where the dialog adds no room of its own under the last line */}
    <Stack direction={{ xs: 'column', md: 'row' }} gap={3} sx={{ pb: { xs: SHEET_BOTTOM, sm: 0 } }}>
      <Stack gap={2} sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
          {orderMethods(lastMethod).map(({ id, label, Icon }) => (
            <Button key={id} variant="outlined" startIcon={<Icon size={20}/>} endIcon={<IconChevronRight size={18}/>}
                    onClick={() => {
                      leaveFlow();
                      setMethodId(id);
                    }}
                    sx={{ justifyContent: 'flex-start', textAlign: 'left', minHeight: 48, '& .MuiButton-endIcon': { ml: 'auto' } }}>
              <Stack component="span">
                <span>Continue with {label}</span>
                {/* StatusText's "selected" look, written out: StatusText imports Notice, which imports this
                    dialog, and the cycle throws on StatusText's top-level NOTICE_TONES read wherever
                    Notice is evaluated first (Toolbar, so ControlBar.test.jsx and the wiki's EntityList). */}
                {id === lastMethod ? <Typography component="span" variant="body2" fontWeight={500} color="primary.main">
                  Last used
                </Typography> : null}
              </Stack>
            </Button>
          ))}
        </Box>
        <Typography variant="body2" color="text.secondary">
          Not sure which one? It&apos;s the one you use to start the game.
        </Typography>
        {!state?.demo ? <Link href={SAMPLE_FALLBACK} onClick={openSample} variant="body2" sx={{ alignSelf: 'flex-start' }}>
          Just looking? Browse the sample account
        </Link> : null}
      </Stack>
      <ReadsPanel open={showReads} onToggle={() => setShowReads(!showReads)}/>
    </Stack>
  </AppDialog>;
};

export default LoginDialog;
