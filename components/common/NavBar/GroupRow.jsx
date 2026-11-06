import React, { useRef, useState } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { Box, ButtonBase, Menu, MenuItem, MenuList, Typography } from '@mui/material';
import { IconChevronDown } from '@tabler/icons-react';
import AppDialog from '@components/common/Overlays/AppDialog';
import useNavPrefetch from '@hooks/useNavPrefetch';
import { groupOf, rowSplit, SHORT_LABELS } from '@utility/navMenu';
import { prefix } from '@utility/helpers';
import { sessionQuery } from '@utility/nav-query';
import { trackEvent } from '@utility/analytics';
import { MENU_BUTTON, navMenuId } from './NavMenu';
import { PHONE_MENU_ID } from './PhoneMenu';

const ROW_ID = 'group-row-more';
const PILL_SX = {
  display: 'inline-flex', alignItems: 'center', gap: 1, height: 36, px: 1.5, borderRadius: 999, flexShrink: 0,
  typography: 'body2', fontWeight: 500, whiteSpace: 'nowrap', textDecoration: 'none'
};
// The board's .wbtn: the group's name in caps, closed by a line before the first pill.
const GROUP_BUTTON_SX = {
  height: 36, pl: 1, pr: 1.25, mr: 1, gap: 0.5, borderRadius: '6px 0 0 6px', flexShrink: 0, color: 'text.secondary', whiteSpace: 'nowrap',
  borderRight: 1, borderColor: 'divider', '&:hover': { color: 'text.primary', bgcolor: 'action.hover' }
};
// The row's line runs window edge to edge while its content stays at the page's x. A spread shadow paints the rest of
// the line and clip-path holds it to 1 px: a shadow adds no scrollable overflow, so nothing scrolls sideways, and the
// row stays in the page's column with no copy of the frame's rules.
const EDGE_LINE_SX = {
  content: '""', position: 'absolute', left: 0, right: 0, bottom: 0, height: '1px', bgcolor: 'divider',
  boxShadow: (theme) => `0 0 0 100vmax ${(theme.vars || theme).palette.divider}`, clipPath: 'inset(0 -100vmax)'
};

// Shown on a row at least `from` px wide, and below `below` (rowSplit's widths, read against the row as a container).
const onRow = (display, from, below = 0) => ({
  display: from > 0 ? 'none' : display,
  ...(from > 0 ? { [`@container (min-width: ${from}px)`]: { display } } : {}),
  ...(below > 0 ? { [`@container (min-width: ${below}px)`]: { display: 'none' } } : {})
});
// A short label is the start of the link's name, so a voice command saying what is on screen finds it
const shortName = (short, label) => (label.startsWith(short) ? label : `${short}, ${label}`);

const Pill = ({ page, current, nav, sx }) => {
  const short = SHORT_LABELS[page.url];
  return <Box component={NextLink} href={{ pathname: page.url, query: nav.query }} prefetch={nav.prefetch}
              data-row-page={page.url} aria-current={current ? 'page' : undefined} aria-label={short ? shortName(short, page.label) : undefined}
              onClick={() => trackEvent('handle_nav', { event_category: page.url, event_label: 'engagement', value: 1, source: 'row' })}
              sx={[PILL_SX, {
                color: current ? 'text.primary' : 'text.secondary', bgcolor: current ? 'primary.soft' : 'transparent',
                '&:hover': { color: 'text.primary', bgcolor: current ? 'primary.soft' : 'action.hover' }
              }, sx]}>
    <Box component="img" src={`${prefix}${page.icon}.png`} alt="" style={page.style}
         sx={{ width: 22, height: 22, objectFit: 'contain', flexShrink: 0 }}/>
    {short ?? page.label}
  </Box>;
};


// A page's siblings (Layout boards): the group's name opens its menu, the pages are links, and what does not fit in
// the row's real width waits under More, never the page on screen (navMenu rowSplit). A band under the bar: it takes
// back main's top padding, so it sits flush under the bar (or the notice band), 52 px, with the title 14 px under it
// (8 here and 6 in the header row's 48). Scrolls with the page (Decision 10). From md; a phone has its title switcher.
const GroupRow = ({ openMenu, phoneMenuOpen, onOpenMenu }) => {
  const router = useRouter();
  const pathname = router?.pathname ?? '';
  const prefetch = useNavPrefetch();
  const [more, setMore] = useState(null);
  const rowRef = useRef(null);
  const group = groupOf(pathname);
  if (!group) return null;
  const { showFrom, more: moreCounts, moreFrom, dialogBelow } = rowSplit(group, pathname);
  const pages = group.pages;
  const nav = { query: sessionQuery(router?.query), prefetch };
  const closeMore = () => setMore(null);
  // The pages the row hides right now, read off the row when More is pressed (CSS decided which)
  const openMore = (event, kind) => {
    const shown = new Set([...rowRef.current.querySelectorAll('[data-row-page]')]
      .filter((pill) => getComputedStyle(pill).display !== 'none').map((pill) => pill.getAttribute('data-row-page')));
    setMore({ anchor: event.currentTarget, kind, hidden: pages.filter(({ url }) => !shown.has(url)) });
  };
  const menuOpen = openMenu === group.menu;
  const moreItems = (more?.hidden ?? []).map((page) => <MenuItem key={page.url} component={NextLink}
                                                                 href={{ pathname: page.url, query: nav.query }} prefetch={prefetch}
                                                                 onClick={() => {
                                                                   trackEvent('handle_nav', { event_category: page.url, event_label: 'engagement', value: 1, source: 'row' });
                                                                   closeMore();
                                                                 }}>
    <Box component="img" src={`${prefix}${page.icon}.png`} alt="" style={page.style}
         sx={{ width: 22, height: 22, objectFit: 'contain', mr: 1.5 }}/>
    {page.label}
  </MenuItem>);
  // More as a menu while it holds 8 or fewer, a dialog past 8 (Overlays board, "Kind by job"): two buttons, each shown
  // by the row's width, so its popup kind is right before it is pressed.
  const moreButton = (kind, from, below) => <ButtonBase aria-haspopup={kind} aria-expanded={more?.kind === kind}
                                                        aria-controls={more?.kind === kind ? ROW_ID : undefined}
                                                        onClick={(event) => openMore(event, kind)}
                                                        sx={[PILL_SX, { border: 1, borderColor: 'outline', color: 'text.primary', gap: 0.5 },
                                                          onRow('inline-flex', from, below)]}>
    More
    {moreCounts.map(([hidden, low, high]) => <Box key={hidden} component="span" sx={onRow('inline', low, high)}>({hidden})</Box>)}
    <IconChevronDown size={16} aria-hidden/>
  </ButtonBase>;

  return <Box component="nav" ref={rowRef} aria-label={`${group.label} pages`} data-shell="group-row"
              sx={{
                display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5, height: 52, mt: -3, mb: 1,
                position: 'relative', containerType: 'inline-size', '&::after': EDGE_LINE_SX
              }}>
    <ButtonBase {...{ [MENU_BUTTON]: '' }} onClick={() => onOpenMenu(group)} aria-expanded={menuOpen || phoneMenuOpen}
                aria-controls={menuOpen ? navMenuId(group.menu) : phoneMenuOpen ? PHONE_MENU_ID : undefined} sx={GROUP_BUTTON_SX}>
      <Typography variant="groupLabel" component="span" sx={{ fontSize: 13, fontWeight: 600 }}>{group.label}</Typography>
      <IconChevronDown size={18} aria-hidden/>
    </ButtonBase>
    {pages.map((page) => <Pill key={page.url} page={page} current={page.url === pathname} nav={nav}
                               sx={onRow('inline-flex', showFrom[page.url])}/>)}
    {dialogBelow ? moreButton('dialog', 0, dialogBelow) : null}
    {moreButton('menu', dialogBelow, moreFrom)}
    {more?.kind === 'menu' ? <Menu id={ROW_ID} anchorEl={more.anchor} open onClose={closeMore}>{moreItems}</Menu> : null}
    {more?.kind === 'dialog' ? <AppDialog open onClose={closeMore} id={ROW_ID} title={`${group.label} pages`} size="s">
      <MenuList autoFocusItem>{moreItems}</MenuList>
    </AppDialog> : null}
  </Box>;
};

export default GroupRow;
