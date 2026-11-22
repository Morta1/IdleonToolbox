import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  Box, Button, Checkbox, FormControlLabel, IconButton, Link, Radio, RadioGroup, Stack, Typography
} from '@mui/material';
import { IconX } from '@tabler/icons-react';
import { readLocalStorageValue, useLocalStorage } from '@mantine/hooks';
import { AppContext } from '@components/common/context/AppProvider';
import Notice from '@components/common/Notice';
import { notify } from '@components/common/Overlays/notify';
import useNow from '@hooks/useNow';
import useProfileUpload, { everyHours, isShown } from '@hooks/useProfileUpload';
import { errorMessage, trackEvent } from '@utility/analytics';
import { getProfileStatus } from '../../services/profiles';
import { currentToken } from '../../firebase/lazy';

const OPEN_EVENT = 'upload-prompt:open';
const PUT_AWAY_MS = 30 * 24 * 60 * 60 * 1000;
// The snackbar's own height var pattern: it rises above this card on a phone, where both span the screen.
const HEIGHT_VAR = '--upload-prompt-height';

// The leaderboards page's own way in: opens the card at its choice, whatever was answered before.
export const openUploadPrompt = () => window.dispatchEvent(new Event(OPEN_EVENT));

// The player's own live save: never a guest, the sample account, a viewed profile or a pasted save.
export const useOwnSave = () => {
  const { state } = useContext(AppContext);
  return Boolean(state?.signedIn && state?.uid && !state?.demo && !state?.profile && !state?.manualImport
    && state?.characters?.length);
};

const CARD_SX = {
  position: 'fixed',
  zIndex: (theme) => theme.zIndex.snackbar - 1,
  bottom: {
    xs: 'calc(var(--nitro-ad-height, 0px) + var(--consent-banner-height, 0px) + 8px)',
    sm: 'calc(var(--nitro-ad-height, 0px) + var(--consent-banner-height, 0px) + 16px)'
  },
  left: { xs: 8, sm: 'auto' },
  width: { xs: 'auto', sm: 380 },
  p: 2,
  bgcolor: 'background.paper',
  border: 1,
  borderColor: 'divider',
  borderRadius: 3,
  boxShadow: (theme) => (theme.vars || theme).palette.shadow.floating
};

const Option = ({ value, label, description }) => (
  <FormControlLabel value={value} control={<Radio size="small"/>} sx={{ alignItems: 'flex-start', m: 0 }}
                    label={<Stack sx={{ pt: '7px' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'fontWeightMedium' }}>{label}</Typography>
                      <Typography variant="body2" color="text.secondary">{description}</Typography>
                    </Stack>}/>
);

// A small card at the bottom of any page that offers a signed-in player with nothing shown on the server a way onto
// the leaderboards: the offer, then the choice. Mounted once for the whole site.
const UploadPrompt = () => {
  const { state } = useContext(AppContext);
  const uid = state?.uid;
  const own = useOwnSave();
  const now = useNow(60000);
  const { upload, adopt, shown, lastUploadAccess, setAutoUpload, autoHours } = useProfileUpload();
  // 'never', or the time until which "Not now" put it away. Kept in this browser only, per account.
  const [answer, setAnswer] = useLocalStorage({ key: `${uid}/uploadPrompt` });
  const [, setProfileAccess] = useLocalStorage({ key: 'data:profileAccess' });
  const [, setParticipation] = useLocalStorage({ key: 'data:leaderboardParticipation' });
  const [step, setStep] = useState('offer');
  // Opened from the leaderboards page: shows even after "Do not ask again", and for a player who has a profile.
  const [asked, setAsked] = useState(false);
  const [access, setAccess] = useState(null);
  const [keepUpdated, setKeepUpdated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [right, setRight] = useState(16);
  const card = useRef(null);

  // Asked once per browser: each ask costs the worker a database connect, so the answer is kept. Asked again only by
  // a browser that knows a profile is shown but not how it was uploaded.
  const known = shown === 'no' || (shown === 'yes' && isShown(lastUploadAccess));
  useEffect(() => {
    if (!own || known) return;
    // The hook hands over what is stored one render after the account's id arrives, so on every page load `known`
    // is false for a moment. Read the store itself before asking, or each page load asks the server again.
    const stored = readLocalStorageValue({ key: `${uid}/profileShown` });
    if (stored === 'no' || (stored === 'yes' && isShown(readLocalStorageValue({ key: `${uid}/lastUploadAccess` })))) return;
    let cancelled = false;
    currentToken(state?.accessToken)
      .then(({ token, source }) => getProfileStatus(token, source))
      .then((res) => {
        if (!cancelled) adopt(res);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [own, known, uid]);

  useEffect(() => {
    const open = () => {
      setAsked(true);
      setStep('choose');
    };
    window.addEventListener(OPEN_EVENT, open);
    return () => window.removeEventListener(OPEN_EVENT, open);
  }, []);

  const putAway = !answer ? false : answer === 'never' || now < answer;
  const visible = own && (asked || (shown === 'no' && now > 0 && !putAway));

  // At the edge of the page's column, clear of the side ad beside it; its height lifts the snackbar on a phone.
  useEffect(() => {
    if (!visible) return;
    const place = () => {
      const page = document.querySelector('[data-shell="page"]');
      // A phone has no side ad: the card spans the screen, 8 px in on both sides.
      setRight(page && window.innerWidth >= 600 ? Math.max(8, window.innerWidth - page.getBoundingClientRect().right) : 8);
      document.documentElement.style.setProperty(HEIGHT_VAR, `${(card.current?.offsetHeight ?? 0) + 8}px`);
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(document.documentElement);
    if (card.current) observer.observe(card.current);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty(HEIGHT_VAR);
    };
  }, [visible, step, error]);

  // card: it showed by itself. leaderboards: opened from that page's Join.
  const source = asked ? 'leaderboards' : 'card';
  useEffect(() => {
    if (visible) trackEvent('upload_prompt_shown', { source });
  }, [visible, source]);

  if (!visible) return null;

  const close = (next) => {
    if (next && !asked) setAnswer(next);
    setAsked(false);
    setStep('offer');
    setError(null);
  };

  const handleUpload = async () => {
    setLoading(true);
    setError(null);
    try {
      // Leaderboards on: that is what the card offers. Gem info is not sent from here.
      await upload({ profileAccess: access, leaderboardParticipation: 'on', removeGems: true, source });
      setProfileAccess(access);
      setParticipation('on');
      setAutoUpload(keepUpdated && autoHours > 0);
      close();
      notify('Profile uploaded. The leaderboards refresh every 30 minutes.');
    } catch (err) {
      setError(err);
    }
    setLoading(false);
  };

  return <Box ref={card} role="region" aria-label="Join the leaderboards" sx={CARD_SX} style={{ right }}>
    <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} sx={{ mb: 1 }}>
      <Typography component="h2" sx={{ fontWeight: 'fontWeightBold', fontSize: 16 }}>
        {step === 'offer' ? 'Join the leaderboards' : 'How should your profile appear?'}
      </Typography>
      <IconButton size="small" aria-label="Not now" onClick={() => close(now + PUT_AWAY_MS)} sx={{ m: -0.5 }}>
        <IconX size={18}/>
      </IconButton>
    </Stack>
    {step === 'offer' ? <>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Upload your profile to see where you rank on the leaderboards and track your progress over time.
      </Typography>
      <Stack direction="row" alignItems="center" gap={1}>
        <Button variant="contained" size="small" onClick={() => { trackEvent('upload_prompt_join', { source }); setStep('choose'); }}>Join</Button>
        <Button variant="text" size="small" onClick={() => close(now + PUT_AWAY_MS)}>Not now</Button>
        <Link component="button" type="button" variant="body2" color="text.secondary" onClick={() => close('never')}
              sx={{ ml: 'auto' }}>
          Do not ask again
        </Link>
      </Stack>
    </> : <>
      <RadioGroup value={access} onChange={(event) => setAccess(event.target.value)} aria-label="Profile access"
                  sx={{ gap: 0.5 }}>
        <Option value="public" label="Public" description="Your character names are shown."/>
        <Option value="anonymous" label="Anonymous" description="Shown as Anon# with a code. Names hidden."/>
      </RadioGroup>
      {/* Not offered while the worker has automatic uploads switched off */}
      {autoHours > 0 ? <Box sx={{ borderTop: 1, borderColor: 'divider', mt: 1.5, pt: 1 }}>
        <FormControlLabel
          sx={{ alignItems: 'flex-start', m: 0 }}
          control={<Checkbox size="small" checked={keepUpdated} onChange={(event) => setKeepUpdated(event.target.checked)}/>}
          label={<Stack sx={{ pt: '7px' }}>
            <Typography variant="body2" sx={{ fontWeight: 'fontWeightMedium' }}>Keep it updated while the toolbox is open</Typography>
            <Typography variant="body2" color="text.secondary">
              {keepUpdated
                ? `Uploaded again ${everyHours(autoHours)} while you use the site, so your leaderboard ranks stay up to date and your progress is tracked. Turn it off any time in Settings.`
                : 'Without it, your leaderboard ranks only update when you upload manually.'}
            </Typography>
          </Stack>}/>
      </Box> : null}
      {error ? <Notice tone={'error'} action={false} sx={{ mt: 1.5 }}>{errorMessage(error)}</Notice> : null}
      <Stack direction="row" alignItems="center" gap={1} sx={{ mt: 2 }}>
        <Button variant="contained" size="small" disabled={!access} loading={loading} onClick={handleUpload}>Upload</Button>
        {asked ? null : <Button variant="text" size="small" onClick={() => setStep('offer')}>Back</Button>}
      </Stack>
    </>}
  </Box>;
};

export default UploadPrompt;
