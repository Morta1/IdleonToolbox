import React, { useState } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { Box, ButtonBase, Menu, MenuItem, MenuList, Typography } from '@mui/material';
import { IconChevronDown } from '@tabler/icons-react';
import AppDialog from '@components/common/Overlays/AppDialog';
import useNavPrefetch from '@hooks/useNavPrefetch';
import { groupOf, rowFit, SHORT_LABELS } from '@utility/navMenu';
import { prefix } from '@utility/helpers';
import { sessionQuery } from '@utility/nav-query';
import { trackEvent } from '@utility/analytics';
import { ROW_WIDTHS } from './frame';
import { MENU_BUTTON, navMenuId } from './NavMenu';
import { PHONE_MENU_ID } from './PhoneMenu';

const ROW_ID = 'group-row-more';
const PILL_SX = {
  display: 'inline-flex', alignItems: 'center', gap: 1, height: 36, px: 1.5, borderRadius: 999, flexShrink: 0,
  typography: 'body2', fontWeight: 500, whiteSpace: 'nowrap', textDecoration: 'none'
};
const GROUP_BUTTON_SX = {
  height: 36, px: 1.5, mr: 0.5, gap: 0.5, borderRadius: 1, flexShrink: 0, color: 'text.secondary', whiteSpace: 'nowrap',
  '&:hover': { color: 'text.primary', bgcolor: 'action.hover' }
};

// The same display rule under every row width query, so the widest one that matches decides (frame.js ROW_WIDTHS).
const byQuery = (show) => ({
  display: 'none',
  ...Object.fromEntries(ROW_WIDTHS.map(([query], index) => [`@media ${query}`, { display: show(index) }]))
});

const Pill = ({ page, current, nav, sx }) => {
  const short = SHORT_LABELS[page.url];
  return <Box component={NextLink} href={{ pathname: page.url, query: nav.query }} prefetch={nav.prefetch}
              aria-current={current ? 'page' : undefined} aria-label={short ? page.label : undefined}
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

// How many pills the widest matching query shows, read when More is pressed (the markup already hides the rest).
const shownNow = (counts) => {
  let shown = counts[0];
  ROW_WIDTHS.forEach(([query], index) => {
    if (window.matchMedia(query).matches) shown = counts[index];
  });
  return shown;
};

// A page's siblings (Layout boards): the group's name opens its menu, the pages are links, and what does not fit
// waits under More. Scrolls with the page (Decision 10). From md; a phone has its title switcher instead.
const GroupRow = ({ openMenu, phoneMenuOpen, onOpenMenu }) => {
  const router = useRouter();
  const pathname = router?.pathname ?? '';
  const prefetch = useNavPrefetch();
  const [more, setMore] = useState(null);
  const group = groupOf(pathname);
  if (!group) return null;
  const counts = ROW_WIDTHS.map(([, width]) => rowFit(group, width));
  const pages = group.pages;
  const nav = { query: sessionQuery(router?.query), prefetch };
  const hidden = more ? pages.slice(more.shown) : [];
  const closeMore = () => setMore(null);
  const menuOpen = openMenu === group.menu;
  // A list of 8 or fewer is a menu; past 8 it is a dialog (Overlays board, "Kind by job").
  const asDialog = hidden.length > 8;
  const moreItems = hidden.map((page) => {
    const current = page.url === pathname;
    return <MenuItem key={page.url} component={NextLink} href={{ pathname: page.url, query: nav.query }} prefetch={prefetch}
                     selected={current} aria-current={current ? 'page' : undefined}
                     onClick={() => {
                       trackEvent('handle_nav', { event_category: page.url, event_label: 'engagement', value: 1, source: 'row' });
                       closeMore();
                     }}>
      <Box component="img" src={`${prefix}${page.icon}.png`} alt="" style={page.style}
           sx={{ width: 22, height: 22, objectFit: 'contain', mr: 1.5 }}/>
      {page.label}
    </MenuItem>;
  });

  return <Box component="nav" aria-label={`${group.label} pages`} data-shell="group-row"
              sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5, height: 52, mb: 1, borderBottom: 1, borderColor: 'divider' }}>
    <ButtonBase {...{ [MENU_BUTTON]: '' }} onClick={() => onOpenMenu(group)} aria-expanded={menuOpen || phoneMenuOpen}
                aria-controls={menuOpen ? navMenuId(group.menu) : phoneMenuOpen ? PHONE_MENU_ID : undefined} sx={GROUP_BUTTON_SX}>
      <Typography variant="groupLabel" component="span">{group.label}</Typography>
      <IconChevronDown size={16} aria-hidden/>
    </ButtonBase>
    {pages.map((page, index) => <Pill key={page.url} page={page} current={page.url === pathname} nav={nav}
                                      sx={byQuery((query) => (index < counts[query] ? 'inline-flex' : 'none'))}/>)}
    <ButtonBase aria-haspopup={asDialog ? 'dialog' : 'menu'} aria-expanded={Boolean(more)} aria-controls={more ? ROW_ID : undefined}
                onClick={(event) => setMore({ anchor: event.currentTarget, shown: shownNow(counts) })}
                sx={[PILL_SX, { border: 1, borderColor: 'divider', color: 'text.secondary', gap: 0.5 },
                  byQuery((query) => (counts[query] < pages.length ? 'inline-flex' : 'none'))]}>
      More
      {counts.map((count, index) => <Box key={index} component="span"
                                         sx={byQuery((query) => (query === index ? 'inline' : 'none'))}>({pages.length - count})</Box>)}
      <IconChevronDown size={16} aria-hidden/>
    </ButtonBase>
    {more && !asDialog ? <Menu id={ROW_ID} anchorEl={more.anchor} open onClose={closeMore}>{moreItems}</Menu> : null}
    {more && asDialog ? <AppDialog open onClose={closeMore} id={ROW_ID} title={`${group.label} pages`} size="s">
      <MenuList autoFocusItem>{moreItems}</MenuList>
    </AppDialog> : null}
  </Box>;
};

export default GroupRow;
