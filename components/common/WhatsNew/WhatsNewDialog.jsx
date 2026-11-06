import { useEffect, useRef, useState } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { Box, Button, ButtonBase, Link, useMediaQuery } from '@mui/material';
import AppDialog from '@components/common/Overlays/AppDialog';
import { trackEvent } from '@utility/analytics';
import { prefix } from '@utility/helpers';
import { sessionQuery } from '@utility/nav-query';
import BeforeAfter from './BeforeAfter';

const PICS = `${prefix}etc/whatsnew`;
const DESK_FRAME = 1033 / 567;
const PHONE_FRAME = 384 / 320;

const LINE_1 = 'The side menu is gone. Its pages are in the top bar now, under Worlds and Account.';
const LINE_1_BURGER = 'The menu now has Worlds and Account tabs. World 1 to 7 are under Worlds.';
const LINE_2 = 'Pin and Goals moved to the right of the page title, beside Page settings, where a page\'s options now live.';
const LINE_2_ABOVE = 'Pin and Goals moved above the page title, beside Page settings, where a page\'s options now live.';

// Below 1200 the nav is behind the burger, so "top bar" would be false, and below 900 the page's buttons sit above its
// title (PageHeader): those widths take the phone's words and the phone's pictures for that item.
const itemsFor = ({ burger, above, phone }) => [
  {
    line: burger ? LINE_1_BURGER : LINE_1, pic: burger ? 'phone-menu' : 'menu',
    alts: burger
      ? ['The old phone menu, with Account as one long list', 'The phone menu, with tabs for Worlds and Account']
      : ['The old side menu', 'The Worlds menu open from the top bar']
  },
  {
    line: above ? LINE_2_ABOVE : LINE_2, pic: above ? 'phone-pin' : 'pin',
    alts: ['Pin and Goals beside the page title', 'Pin and Goals in a row with Page settings']
  },
  {
    line: 'Dashboard timers now show what\'s ready first, then what\'s next.', pic: phone ? 'phone-timers' : 'timers',
    alts: ['Timers in cards per world', 'One table of timers, starting with Ready now']
  },
  {
    line: 'There\'s a light theme now. Pick it from the user menu, Settings or the footer.', pic: phone ? 'phone-theme' : 'theme',
    sides: ['dark', 'light'], labels: ['Dark', 'Light'], alts: ['A page in the dark theme', 'The same page in the light theme']
  }
];

const sideOf = ({ pic, sides = ['before', 'after'], labels = ['Before', 'After'], alts }, at) => ({
  src: `${PICS}/${pic}-${sides[at]}.webp`, label: labels[at], alt: alts[at]
});

// A short window takes the room from the picture, so everything still shows with no scroll: 85% of the window is the dialog's
// most, and this is all of it that isn't the picture (title, buttons, the lines above and below, the Next row).
const AROUND_THE_PICTURE = 227;
// Stacked, the list is under the picture too: four rows of one line each, and the gap over them.
const STACKED_LIST = 172;
const pictureWidth = (around) => `min(614px, max(320px, calc((85vh - ${around}px) * ${DESK_FRAME})))`;
const PICTURE_WIDTH = pictureWidth(AROUND_THE_PICTURE);
const STACKED_PICTURE_WIDTH = pictureWidth(AROUND_THE_PICTURE + STACKED_LIST);
const TWO_COLUMNS = `minmax(240px, 1fr) minmax(0, ${PICTURE_WIDTH})`;
// The dialog's 337 px high, for the widest sheets: past this a phone's picture only gets softer and pushes the list away.
const SHEET_PICTURE_WIDTH = 404;

// The current line is a little heavier. Each row always holds the room for that, so the rows don't shift as it moves.
const ROW_SX = {
  display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', width: '100%', px: 1.25, borderRadius: '6px', textAlign: 'left', typography: 'body2', color: 'text.secondary',
  '&:hover': { bgcolor: 'action.hover' },
  '&::after': { content: 'attr(data-line)', gridArea: '1 / 1', visibility: 'hidden', fontWeight: 500 }
};
const CURRENT_ROW_SX = { bgcolor: 'primary.soft', color: 'text.primary', fontWeight: 500, '&:hover': { bgcolor: 'primary.soft' } };

// Esc, the x and the backdrop are Got it. Mounted only once it opens, on a client that knows its window, so the media
// queries read true on the first render and the sheet never starts as a dialog.
const WhatsNewDialog = ({ onDone }) => {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [next, setNext] = useState(null);
  const [at, setAt] = useState(0);
  const phone = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const above = useMediaQuery((theme) => theme.breakpoints.down('md'));
  const burger = useMediaQuery((theme) => theme.breakpoints.down('lg'));
  const touch = useMediaQuery('(pointer: coarse)');
  const items = itemsFor({ burger, above, phone });
  const rows = useRef(null);
  const preloaded = useRef([]);

  // So swapping never waits on a picture, held so the browser keeps them to hand. A width change brings another set.
  useEffect(() => {
    preloaded.current = items.flatMap((item) => [0, 1].map((side) => {
      const image = new Image();
      image.src = sideOf(item, side).src;
      return image;
    }));
  }, [burger, above, phone]);

  const show = (index) => {
    setAt(index);
    // A sheet's list runs past its fold, and the line being shown is what explains the picture.
    rows.current.children[index].scrollIntoView({ block: 'nearest' });
  };
  const close = () => setOpen(false);
  const showAround = () => {
    trackEvent('whats_new_tour_start');
    setNext('tour');
    close();
  };
  const actions = burger
    ? [{ label: 'Got it', main: true }]
    : [{ label: 'Got it' }, { label: 'Show me around', main: true, onClick: showAround }];

  // Every picture has one height at any width: a phone's pair in a wider column sits centred, so Next never moves.
  const frame = phone ? PHONE_FRAME : DESK_FRAME;
  const pairFrame = items[at].pic.startsWith('phone-') ? PHONE_FRAME : DESK_FRAME;
  const stackedWidth = phone ? SHEET_PICTURE_WIDTH : STACKED_PICTURE_WIDTH;
  const list = <Box key="list" ref={rows} component="ul" sx={{ m: 0, p: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: phone ? '2px' : '4px', minWidth: 0 }}>
    {items.map((item, index) => <li key={item.pic}>
      <ButtonBase data-line={item.line} onClick={() => show(index)} aria-current={index === at ? 'true' : undefined}
                  sx={[ROW_SX, { py: phone ? 0.75 : 1 }, index === at ? CURRENT_ROW_SX : {}]}>
        <Box component="span" sx={{ gridArea: '1 / 1' }}>{item.line}</Box>
      </ButtonBase>
    </li>)}
  </Box>;
  const picture = <Box key="picture" sx={{ minWidth: 0, width: '100%', maxWidth: above ? stackedWidth : PICTURE_WIDTH, mx: 'auto' }}>
    <BeforeAfter before={sideOf(items[at], 0)} after={sideOf(items[at], 1)}
                 sx={{ width: `${(pairFrame / frame) * 100}%`, aspectRatio: pairFrame, mx: 'auto' }}/>
    <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
      <Box component="span" sx={{ typography: 'caption', color: 'text.secondary' }}>{at + 1} of {items.length}. Drag the line.</Box>
      <Button size="small" variant="outlined" onClick={() => show((at + 1) % items.length)}>Next</Button>
    </Box>
  </Box>;

  return <AppDialog open={open} onClose={close} onExited={() => onDone(next)} title="What's new" size="xl" actions={actions}
                    headerSx={{ pb: 0.5 }}>
    <Box component="p" sx={{ m: 0, mb: 1, typography: 'body2', color: 'text.secondary' }}>
      I rebuilt the site&apos;s layout, so a few things moved. Here&apos;s where they went.
    </Box>
    <Box sx={{ display: 'grid', gap: 2, alignItems: 'start', gridTemplateColumns: above ? 'minmax(0, 1fr)' : TWO_COLUMNS }}>
      {above ? [picture, list] : [list, picture]}
    </Box>
    {/* The buttons' row has its own room above it: the body's 20 px under this goes to the picture, at a short window. */}
    <Box component="p" sx={{ m: 0, mt: 1, mb: phone ? 0.5 : '-20px', typography: 'body2', color: 'text.secondary' }}>
      Plus lots of smaller changes, all in the{' '}
      <Link component={NextLink} href={{ pathname: '/patch-notes', query: sessionQuery(router.query) }} onClick={close}>patch notes</Link>
      .{touch || phone ? null : ' Can\'t find a page? Ctrl + K searches them all.'}
    </Box>
  </AppDialog>;
};

export default WhatsNewDialog;
