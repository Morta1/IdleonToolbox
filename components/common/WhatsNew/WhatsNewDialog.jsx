import { useState } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { Box, Link, Stack, Typography, useMediaQuery } from '@mui/material';
import { IconClockHour4, IconLayoutNavbar, IconPin, IconSun } from '@tabler/icons-react';
import AppDialog from '@components/common/Overlays/AppDialog';
import { trackEvent } from '@utility/analytics';
import { sessionQuery } from '@utility/nav-query';

const LINE_1 = 'The side menu is gone. Its pages are in the top bar now, under Worlds and Account.';
const LINE_1_BURGER = 'The menu now has Worlds and Account tabs. World 1 to 7 are under Worlds.';
const LINE_2 = 'Pin and Goals moved to the right of the page title, beside Page settings, where a page\'s options now live.';
const LINE_2_ABOVE = 'Pin and Goals moved above the page title, beside Page settings, where a page\'s options now live.';

// Below 1200 the nav is behind the burger, so "top bar" would be false, and below 900 the page's buttons sit above its title
// (PageHeader): those widths take the phone's words for that item.
const itemsFor = ({ burger, above }) => [
  { Icon: IconLayoutNavbar, line: burger ? LINE_1_BURGER : LINE_1 },
  { Icon: IconPin, line: above ? LINE_2_ABOVE : LINE_2 },
  { Icon: IconClockHour4, line: 'Dashboard timers now show what\'s ready first, then what\'s next.' },
  { Icon: IconSun, line: 'There\'s a light theme now. Pick it from the user menu, Settings or the footer.' }
];

// Words only: the tour shows the real thing, on the player's own data. Esc, the x and the backdrop are Got it. Mounted only once
// it opens, on a client that knows its window, so the media queries read true on the first render and the sheet never starts
// as a dialog.
const WhatsNewDialog = ({ onDone }) => {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [next, setNext] = useState(null);
  const phone = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const above = useMediaQuery((theme) => theme.breakpoints.down('md'));
  const burger = useMediaQuery((theme) => theme.breakpoints.down('lg'));
  const touch = useMediaQuery('(pointer: coarse)');
  const close = () => setOpen(false);
  const showAround = () => {
    trackEvent('whats_new_tour_start');
    setNext('tour');
    close();
  };
  const actions = burger
    ? [{ label: 'Got it', main: true }]
    : [{ label: 'Got it' }, { label: 'Show me around', main: true, onClick: showAround }];

  return <AppDialog open={open} onClose={close} onExited={() => onDone(next)} title="What's new" size="m" actions={actions}>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
      I rebuilt the site&apos;s layout, so a few things moved. Here&apos;s where they went.
    </Typography>
    <Stack component="ul" gap={1.5} sx={{ m: 0, p: 0, listStyle: 'none' }}>
      {itemsFor({ burger, above }).map(({ Icon, line }) => <Stack key={line} component="li" direction="row" gap={1.5} alignItems="flex-start">
        <Box sx={{ color: 'primary.main', display: 'flex', flexShrink: 0, mt: '1px' }}><Icon size={18} aria-hidden/></Box>
        <Typography variant="body2" component="span">{line}</Typography>
      </Stack>)}
    </Stack>
    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
      Plus lots of smaller changes, all in the{' '}
      <Link component={NextLink} href={{ pathname: '/patch-notes', query: sessionQuery(router.query) }} onClick={close}>patch notes</Link>
      .{touch || phone ? null : ' Can\'t find a page? Ctrl + K searches them all.'}
    </Typography>
  </AppDialog>;
};

export default WhatsNewDialog;
