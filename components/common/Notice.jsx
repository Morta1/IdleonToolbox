import React, { useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Box, Button, ButtonBase, CircularProgress, IconButton, Link, Stack, Typography } from '@mui/material';
import { IconAlertTriangle, IconCircleX, IconInfoCircle, IconLock, IconLogin2, IconX } from '@tabler/icons-react';
import { AppContext } from '@components/common/context/AppProvider';
import LoginDialog from '@components/common/NavBar/LoginDialog';
import { DISCORD_SERVER_URL } from '@components/discordLinks';
import { navBarHeight, profileBannerHeight } from '@components/constants';
import useProfileBannerState from '@hooks/useProfileBannerState';

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
  px: { xs: 1, sm: 2 },
  bgcolor: 'background.paper',
  borderBottom: 1,
  borderColor: 'divider'
};

const TOUCH = '@media (pointer: coarse)';

// A note's x takes the room of its 16 px glyph, as the InfoButton does: 24 px to click and 40 px to tap
// are drawn around it. An IconButton would grow the row to the theme's 40 px touch minimum. On a touch screen
// it sits 10 px further out, so its area stays clear of a link ending the sentence beside it.
const NOTE_DISMISS_SX = {
  width: 16,
  height: 16,
  mt: '2px',
  flexShrink: 0,
  borderRadius: '50%',
  color: 'text.secondary',
  '&::before': { content: '""', position: 'absolute', inset: -4, borderRadius: '50%' },
  '&:hover': { color: 'text.primary' },
  [TOUCH]: { ml: '10px', '&::after': { content: '""', position: 'absolute', inset: -12, borderRadius: '50%' } }
};

// A note's actions are links in its sentence, as tall as its text. On a touch screen each gets a 44 px tall tap
// area drawn around it (the note keeps its height) and 6 px out on each side, so two links 16 px apart (Report on
// Discord · Retry) keep their areas apart. nowrap: an area drawn around a link split over two lines misses half.
const NOTE_LINK_SX = {
  font: 'inherit',
  fontWeight: 500,
  verticalAlign: 'baseline',
  [TOUCH]: {
    position: 'relative',
    whiteSpace: 'nowrap',
    '&::after': { content: '""', position: 'absolute', left: -6, right: -6, top: '50%', height: 44, transform: 'translateY(-50%)' }
  },
  '&[aria-disabled="true"]': { color: 'text.secondary', cursor: 'progress', textDecoration: 'none' }
};

// A busy action (a Retry asking again) keeps its place and the focus, says so, and takes no second press.
const actionText = ({ label, busy, busyLabel }) => (busy ? <>
  <CircularProgress size={12} color="inherit" aria-hidden sx={{ mr: 0.75, verticalAlign: '-1px' }}/>
  {busyLabel ?? label}
</> : label);

// Retry for a read that can fail again: busy while the caller asks again (a query's isFetching).
export const retryAction = (onClick, busy) => ({ label: 'Retry', busyLabel: 'Retrying', onClick, busy: Boolean(busy) });

const bannerButtonSx = (tone, color) => ({
  ml: 1,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  fontSize: 12,
  color,
  borderColor: tone === 'info' || tone === 'signin' ? 'primary.edge' : color,
  '&:hover': { borderColor: color, color: 'text.primary' }
});

const REPORT = { label: 'Report on Discord', href: DISCORD_SERVER_URL };
const RELOAD = { label: 'Reload', onClick: () => window.location.reload() };

// At most one action, two for an error. An error always offers Report on Discord, then the caller's
// own action (Retry, Try again) or Reload; action={null} keeps Report alone (a failure the toolbox
// cannot name). Sign in brings its own Sign in, unless the band above already offers it (bandSignIn).
// action={false} leaves the note with none: an error the player can fix, whose sentence already says how.
const actionsFor = (tone, action, signedIn, openLogin, bandSignIn) => {
  if (action === false) return [];
  if (tone === 'error') return action === null ? [REPORT] : [REPORT, action ?? RELOAD];
  if (tone === 'signin') return signedIn || bandSignIn ? [] : [{ label: 'Sign in', onClick: openLogin }];
  return action ? [action] : [];
};

// Where the focus goes once a note's own action or x has taken it away (the note, or the button, is gone): the
// caller's focusAfter; else, after an action, the same action on the note now in this one's place (a Retry that
// failed again) or the first control of whatever took its place (the rows a Retry brought back); else the nearest
// control after the note, where reading goes on (the one before a note at the top of a page is in the app bar or the
// band), or before it when nothing follows. Never a text field on a touch screen, where focus pops the keyboard up.
const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]';
const TEXT_FIELD = /^(text|search|email|password|number|url|tel)$/;

const canTakeFocus = (element) => {
  if (!element?.isConnected || element.disabled || element.type === 'hidden' || !element.getClientRects().length) return false;
  if (element.closest('[aria-hidden="true"], [inert]')) return false;
  const textField = element.tagName === 'TEXTAREA' || (element.tagName === 'INPUT' && TEXT_FIELD.test(element.type));
  return !(textField && window.matchMedia?.('(hover: none)').matches);
};
const inTabOrder = (element) => element.getAttribute('tabindex') !== '-1' && canTakeFocus(element);

// A note's action by its label, which a busy one does not show (Retrying).
const actionLabel = (control) => control.getAttribute('data-notice-action') ?? control.textContent;

const firstControl = (scope, label) => {
  const controls = [...(scope.matches(FOCUSABLE) ? [scope] : []), ...scope.querySelectorAll(FOCUSABLE)].filter(inTabOrder);
  return controls.find((control) => label && actionLabel(control) === label) ?? controls[0] ?? null;
};

// Read while the note is still in the page: where it sits (and its boxes, a few levels up), and the nearest controls
// after and before it.
const focusPlan = (root, kind, label) => {
  const controls = [...document.querySelectorAll(FOCUSABLE)].filter((control) => !root.contains(control));
  const split = controls.findIndex((control) => control.compareDocumentPosition(root) & Node.DOCUMENT_POSITION_PRECEDING);
  const at = split < 0 ? controls.length : split;
  const after = controls.slice(at).find(inTabOrder) ?? null;
  const before = controls.slice(0, at).reverse().find(inTabOrder) ?? null;
  const places = [];
  for (let node = root; node?.parentElement && places.length < 4; node = node.parentElement) {
    places.push({ parent: node.parentElement, previous: node.previousElementSibling, next: node.nextElementSibling });
  }
  return { root, kind, label, places, after, before };
};

// The first control in whatever now sits where the note was: one element or several (a page), up to the sibling
// that followed the note, so a sibling that only moved up is not taken for it. A note whose box left with it (the
// error boundary remounts its whole fallback) is looked for where that box was.
const replacementControl = ({ places, label }) => {
  const place = places.find(({ parent }) => parent.isConnected);
  if (!place) return null;
  const { parent, previous, next } = place;
  let at = previous ? (previous.parentElement === parent ? previous.nextElementSibling : null) : parent.firstElementChild;
  for (; at && at !== next; at = at.nextElementSibling) {
    const control = firstControl(at, label);
    if (control) return control;
  }
  return null;
};

const handBackFocus = (plan, focusAfter) => setTimeout(() => {
  const active = document.activeElement;
  if (active && active !== document.body && active.isConnected) return;
  const action = plan.kind === 'action';
  const choices = [
    typeof focusAfter === 'function' ? focusAfter() : focusAfter?.current,
    action && plan.root.isConnected ? firstControl(plan.root, plan.label) : null,
    action ? replacementControl(plan) : null,
    plan.after,
    plan.before
  ];
  choices.find(canTakeFocus)?.focus();
}, 0);

// One message: a glyph, one sentence in the game's words, at most one action. placement 'banner' is the
// sticky band under the app bar (whose numbers these are); 'note' is a line where it applies: under the
// page title, under a toolbar, in a card's footer. Never a panel, a box or a popup. onDismiss draws an x
// named by dismissLabel (Dismiss) after the actions: 40 px in the banner, a 16 px one at the end of a note.
// data-notice marks a note for tests and the screenshot harness. An error is an alert, read out when it
// appears (role overrides that); a caller keys a note that can fail again, so it is read out again. focusAfter
// (an element ref, or a function returning one) is where the focus goes when the note's own action or x leaves
// it nowhere (handBackFocus). An action marked busy reads busyLabel beside a spinner and the note is aria-busy.
const NoticeBody = ({ tone = 'info', placement = 'note', icon, action, onDismiss, dismissLabel = 'Dismiss', role, focusAfter, sx, children, bandSignIn = false }) => {
  const { state } = useContext(AppContext);
  const [loginOpen, setLoginOpen] = useState(false);
  const rootRef = useRef(null);
  const latestFocusAfter = useRef(focusAfter);
  useEffect(() => {
    latestFocusAfter.current = focusAfter;
  });
  // A note that leaves while it holds the focus (a Retry answered later, by the rows or by a new note) hands it on.
  useLayoutEffect(() => {
    const root = rootRef.current;
    return () => {
      const active = document.activeElement;
      if (!root || !active || !root.contains(active)) return;
      handBackFocus(focusPlan(root, active.closest('[data-notice-dismiss]') ? 'dismiss' : 'action', actionLabel(active)), latestFocusAfter.current);
    };
  }, []);
  // The note's own action or x, then the focus handed on if that took it away. A busy action takes no press.
  const own = (kind, handler, label, busy = false) => {
    if (busy) return (event) => event.preventDefault();
    return handler ? (event) => {
      const plan = rootRef.current ? focusPlan(rootRef.current, kind, label) : null;
      handler(event);
      if (plan) handBackFocus(plan, focusAfter);
    } : undefined;
  };
  const { Glyph: toneGlyph, color } = NOTICE_TONES[tone];
  const Glyph = icon ?? toneGlyph;
  const actions = actionsFor(tone, action, state?.signedIn, () => setLoginOpen(true), bandSignIn);
  const busy = actions.some((entry) => entry.busy) || undefined;
  const loginDialog = tone === 'signin'
    ? <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)}/>
    : null;

  if (placement === 'banner') {
    return <Stack ref={rootRef} data-shell="band" direction="row" alignItems="center" justifyContent="center"
                  spacing={{ xs: 1, sm: 2 }} aria-busy={busy} sx={{ ...BANNER_SX, color, ...sx }}>
      <Glyph size={18} aria-hidden style={{ flexShrink: 0 }}/>
      {/* One row at every width: a long line ends in an ellipsis instead of wrapping out of the 40 px band */}
      <Typography noWrap variant={'body2'} sx={{ minWidth: 0 }}>{children}</Typography>
      {actions.map((entry) => (
        <Button key={entry.label} size="small" variant="outlined" onClick={own('action', entry.onClick, entry.label, entry.busy)} href={entry.href}
                aria-disabled={entry.busy || undefined} data-notice-action={entry.label} sx={bannerButtonSx(tone, color)}>
          {actionText(entry)}
        </Button>
      ))}
      {onDismiss ? <IconButton aria-label={dismissLabel} onClick={own('dismiss', onDismiss)} data-notice-dismiss=""
                               sx={{ width: 40, height: 40, flexShrink: 0, color: 'text.secondary' }}>
        <IconX size={16}/>
      </IconButton> : null}
      {loginDialog}
    </Stack>;
  }

  return <Stack ref={rootRef} direction="row" alignItems="flex-start" gap={1} data-notice={tone} aria-busy={busy}
                role={role ?? (tone === 'error' ? 'alert' : undefined)} sx={{ color, ...sx }}>
    <Glyph size={18} aria-hidden style={{ flexShrink: 0, marginTop: 1 }}/>
    <Typography variant="body2" component="div">
      {children}
      {actions.map((entry, index) => (
        <React.Fragment key={entry.label}>
          {index > 0 ? <Box component="span" aria-hidden sx={{ mx: 0.75, color: 'text.muted' }}>·</Box> : ' '}
          <Link
            component={entry.href ? 'a' : 'button'}
            type={entry.href ? undefined : 'button'}
            href={entry.href}
            target={entry.href ? '_blank' : undefined}
            rel={entry.href ? 'noreferrer' : undefined}
            onClick={own('action', entry.onClick, entry.label, entry.busy)}
            aria-disabled={entry.busy || undefined}
            data-notice-action={entry.label}
           
            sx={NOTE_LINK_SX}
          >
            {actionText(entry)}
          </Link>
        </React.Fragment>
      ))}
    </Typography>
    {onDismiss ? <ButtonBase aria-label={dismissLabel} onClick={own('dismiss', onDismiss)} data-notice-dismiss="" disableRipple
                             sx={NOTE_DISMISS_SX}>
      <IconX size={16}/>
    </ButtonBase> : null}
    {loginDialog}
  </Stack>;
};

// A sign-in note under a band that already offers Sign in (the guest's, the sample account's) keeps its words and
// leaves the action to the band: one Sign in on the screen, not two 250 px apart. Its own component, so only a
// sign-in note reads the band's state (and the router under it).
const SignInNote = (props) => {
  const { bandSignIn } = useProfileBannerState();
  return <NoticeBody {...props} bandSignIn={bandSignIn}/>;
};

// The types are for .tsx callers, which the build type-checks: a .jsx prop with no type reads as required.
/**
 * @param {{ tone?: string, placement?: string, icon?: import('react').ElementType,
 *   action?: false | null | { label: string, onClick?: () => void, href?: string, busy?: boolean, busyLabel?: string },
 *   onDismiss?: () => void, dismissLabel?: string, role?: string, focusAfter?: { current: HTMLElement | null } | (() => HTMLElement | null | undefined),
 *   sx?: object, children?: import('react').ReactNode }} props
 */
const Notice = (props) => (props.tone === 'signin' && (props.placement ?? 'note') === 'note'
  ? <SignInNote {...props}/>
  : <NoticeBody {...props}/>);

export default Notice;
