import { useState } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { Box, Link, useMediaQuery } from '@mui/material';
import AppDialog from '@components/common/Overlays/AppDialog';
import { prefix } from '@utility/helpers';
import { sessionQuery } from '@utility/nav-query';

const PICS = `${prefix}etc/whatsnew`;

const LINE_1 = 'The side menu is gone. Its pages are in the top bar now, under Worlds and Account.';
const LINE_1_BURGER = 'The menu now has Worlds and Account tabs. World 1 to 7 are under Worlds.';
const LINE_2 = 'Pin and Goals moved to the right of the page title, next to Page settings.';
const LINE_2_ABOVE = 'Pin and Goals moved above the page title, next to Page settings.';

// Below 1200 the nav is behind the burger, so "top bar" would be false, and below 900 the page's buttons sit above its
// title (PageHeader): those widths take the phone's words and the phone's pictures for that item.
const itemsFor = ({ burger, above, phone }) => [
  {
    line: burger ? LINE_1_BURGER : LINE_1, pic: burger ? 'phone-nav' : 'nav',
    alt: 'The old side menu, then the new Worlds menu'
  },
  {
    line: above ? LINE_2_ABOVE : LINE_2, pic: above ? 'phone-header' : 'header',
    alt: 'Pin and Goals beside the title, then in the row with Page settings'
  },
  {
    line: 'Dashboard timers now show what\'s ready first, then what\'s next.', pic: phone ? 'phone-timers' : 'timers',
    alt: 'Timers in cards per world, then one table starting with Ready now'
  },
  {
    line: 'There\'s a light theme now. Pick it from the user menu, Settings or the footer.', pic: phone ? 'phone-theme' : 'theme',
    alt: 'The same page in dark, then in light', first: 'dark', second: 'light', firstCap: 'Dark, still the default', secondCap: 'Light'
  }
];

// A phone's picture in the wider frame loses its right end, not its first letters.
const IMG_SX = {
  display: 'block', width: '100%', aspectRatio: '177 / 92', objectFit: 'cover', objectPosition: 'left', borderRadius: '6px', border: 1, borderColor: 'divider'
};
const PHONE_IMG_SX = { aspectRatio: '164 / 76' };

const Picture = ({ src, alt, caption, phone }) => <Box component="figure" sx={{ m: 0, flex: '1 1 0', minWidth: 0 }}>
  <Box component="img" src={src} alt={alt} sx={[IMG_SX, phone ? PHONE_IMG_SX : {}]}/>
  <Box component="figcaption" sx={{ mt: '2px', typography: 'caption', lineHeight: '16px', color: 'text.secondary' }}>{caption}</Box>
</Box>;

const WhatsNewItem = ({ item, phone }) => <Box>
  <Box component="p" sx={{ m: 0, mb: '6px', minHeight: phone ? 0 : 40, typography: 'body2', color: 'text.primary' }}>{item.line}</Box>
  <Box sx={{ display: 'flex', gap: 1 }}>
    <Picture src={`${PICS}/${item.pic}-${item.first ?? 'before'}.png`} alt={item.alt} caption={item.firstCap ?? 'Before'} phone={phone}/>
    <Picture src={`${PICS}/${item.pic}-${item.second ?? 'after'}.png`} alt="" caption={item.secondCap ?? 'After'} phone={phone}/>
  </Box>
</Box>;

// Esc, the x and the backdrop are Got it. Mounted only once it opens, on a client that knows its window, so the media
// queries read true on the first render and the sheet never starts as a dialog.
const WhatsNewDialog = ({ onDone }) => {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const phone = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const above = useMediaQuery((theme) => theme.breakpoints.down('md'));
  const burger = useMediaQuery((theme) => theme.breakpoints.down('lg'));
  const touch = useMediaQuery('(pointer: coarse)');
  const close = () => setOpen(false);
  const actions = [{ label: 'Got it', main: true }];
  return <AppDialog open={open} onClose={close} onExited={onDone} title="What's new" size="l" actions={actions}>
    <Box component="p" sx={{ m: 0, mb: 1.5, typography: 'body2', color: 'text.secondary' }}>
      I rebuilt the site&apos;s layout, so a few things moved. Here&apos;s where they went.
    </Box>
    <Box sx={phone
      ? { display: 'flex', flexDirection: 'column', gap: 2 }
      : { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
      {itemsFor({ burger, above, phone }).map((item) => <WhatsNewItem key={item.pic} item={item} phone={phone}/>)}
    </Box>
    <Box component="p" sx={{ m: 0, mt: phone ? 2 : 1.5, mb: phone ? 0.5 : 0, typography: 'body2', color: 'text.secondary' }}>
      Plus lots of smaller changes, all in the{' '}
      <Link component={NextLink} href={{ pathname: '/patch-notes', query: sessionQuery(router.query) }} onClick={close}>patch notes</Link>
      .{touch || phone ? null : ' Can\'t find a page? Ctrl + K searches them all.'}
    </Box>
  </AppDialog>;
};

export default WhatsNewDialog;
