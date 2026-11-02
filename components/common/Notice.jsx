import React, { useContext, useState } from 'react';
import { Box, Button, ButtonBase, IconButton, Link, Stack, Typography } from '@mui/material';
import { IconAlertTriangle, IconCircleX, IconInfoCircle, IconLock, IconLogin2, IconX } from '@tabler/icons-react';
import { AppContext } from '@components/common/context/AppProvider';
import LoginDialog from '@components/common/NavBar/LoginDialog';
import { DISCORD_SERVER_URL } from '@components/discordLinks';
import { navBarHeight, profileBannerHeight } from '@components/constants';

// Every tone has its own glyph, so a tone never rests on color alone (Notices board). 2d's StatusText
// imports these glyphs (Decision 6), so a state and a notice of the same tone look alike.
export const NOTICE_TONES = {
  info: { Glyph: IconInfoCircle, color: 'primary.main' },
  signin: { Glyph: IconLogin2, color: 'primary.main' },
  missing: { Glyph: IconAlertTriangle, color: 'text.warning' },
  locked: { Glyph: IconLock, color: 'text.secondary' },
  error: { Glyph: IconCircleX, color: 'text.error' }
};

// The one band under the app bar. AppDrawer and the leaderboards toolbar offset by its 40 px while
// useProfileBannerState says the slot is taken.
const BANNER_SX = {
  position: 'sticky',
  top: navBarHeight,
  zIndex: (theme) => theme.zIndex.drawer + 1,
  height: profileBannerHeight,
  px: 2,
  bgcolor: 'background.paper',
  borderBottom: 1,
  borderColor: 'divider'
};

const TOUCH = '@media (pointer: coarse)';

// A note's x takes the room of its 16 px glyph, as the InfoButton does: 24 px to click and 40 px to tap
// are drawn around it. An IconButton would grow the row to the theme's 40 px touch minimum.
const NOTE_DISMISS_SX = {
  width: 16,
  height: 16,
  mt: '2px',
  flexShrink: 0,
  borderRadius: '50%',
  color: 'text.secondary',
  '&::before': { content: '""', position: 'absolute', inset: -4, borderRadius: '50%' },
  '&:hover': { color: 'text.primary' },
  [TOUCH]: { '&::after': { content: '""', position: 'absolute', inset: -12, borderRadius: '50%' } }
};

const bannerButtonSx = (tone, color) => ({
  ml: 1,
  fontSize: 12,
  color,
  borderColor: tone === 'info' || tone === 'signin' ? 'primary.edge' : color,
  '&:hover': { borderColor: color, color: 'text.primary' }
});

const REPORT = { label: 'Report on Discord', href: DISCORD_SERVER_URL };
const RELOAD = { label: 'Reload', onClick: () => window.location.reload() };

// At most one action, two for an error. An error always offers Report on Discord, then the caller's
// own action (Retry, Try again) or Reload; action={null} keeps Report alone (a failure the toolbox
// cannot name). Sign in brings its own Sign in. action={false} leaves the note with none: an error the
// player can fix, whose sentence already says how.
const actionsFor = (tone, action, signedIn, openLogin) => {
  if (action === false) return [];
  if (tone === 'error') return action === null ? [REPORT] : [REPORT, action ?? RELOAD];
  if (tone === 'signin') return signedIn ? [] : [{ label: 'Sign in', onClick: openLogin }];
  return action ? [action] : [];
};

// One message: a glyph, one sentence in the game's words, at most one action. placement 'banner' is the
// sticky band under the app bar (whose numbers these are); 'note' is a line where it applies: under the
// page title, under a toolbar, in a card's footer. Never a panel, a box or a popup. onDismiss draws an x
// named by dismissLabel after the actions: 40 px in the banner, a 16 px one at the end of a note.
// data-notice marks a note for tests and the screenshot harness. role: alert for a note that answers
// what the player just did (a sign-in error), so it is read out when it appears.
const Notice = ({ tone = 'info', placement = 'note', icon, action, onDismiss, dismissLabel, role, sx, children }) => {
  const { state } = useContext(AppContext);
  const [loginOpen, setLoginOpen] = useState(false);
  const { Glyph: toneGlyph, color } = NOTICE_TONES[tone];
  const Glyph = icon ?? toneGlyph;
  const actions = actionsFor(tone, action, state?.signedIn, () => setLoginOpen(true));
  const loginDialog = tone === 'signin'
    ? <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)}/>
    : null;

  if (placement === 'banner') {
    return <Stack direction="row" alignItems="center" justifyContent="center" spacing={2}
                  sx={{ ...BANNER_SX, color, ...sx }}>
      <Glyph size={18} aria-hidden style={{ flexShrink: 0 }}/>
      <Typography sx={{ fontSize: 14 }}>{children}</Typography>
      {actions.map(({ label, onClick, href }) => (
        <Button key={label} size="small" variant="outlined" onClick={onClick} href={href}
                sx={bannerButtonSx(tone, color)}>
          {label}
        </Button>
      ))}
      {onDismiss ? <IconButton aria-label={dismissLabel} onClick={onDismiss}
                               sx={{ width: 40, height: 40, color: 'text.secondary' }}>
        <IconX size={16}/>
      </IconButton> : null}
      {loginDialog}
    </Stack>;
  }

  return <Stack direction="row" alignItems="flex-start" gap={1} data-notice={tone} role={role} sx={{ color, ...sx }}>
    <Glyph size={18} aria-hidden style={{ flexShrink: 0, marginTop: 1 }}/>
    <Typography variant="body2" component="div">
      {children}
      {actions.map(({ label, onClick, href }, index) => (
        <React.Fragment key={label}>
          {index > 0 ? <Box component="span" aria-hidden sx={{ mx: 0.75, color: 'text.muted' }}>·</Box> : ' '}
          <Link
            component={href ? 'a' : 'button'}
            type={href ? undefined : 'button'}
            href={href}
            target={href ? '_blank' : undefined}
            rel={href ? 'noreferrer' : undefined}
            onClick={onClick}
            underline="hover"
            sx={{ font: 'inherit', fontWeight: 500, verticalAlign: 'baseline' }}
          >
            {label}
          </Link>
        </React.Fragment>
      ))}
    </Typography>
    {onDismiss ? <ButtonBase aria-label={dismissLabel} onClick={onDismiss} disableRipple sx={NOTE_DISMISS_SX}>
      <IconX size={16}/>
    </ButtonBase> : null}
    {loginDialog}
  </Stack>;
};

export default Notice;
