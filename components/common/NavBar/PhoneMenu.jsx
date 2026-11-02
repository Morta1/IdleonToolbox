import React, { useContext, useState } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { Box, Button, ButtonBase, Collapse, Drawer, IconButton, Link, Stack, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { IconChevronDown } from '@tabler/icons-react';
import { AppContext } from '@components/common/context/AppProvider';
import PinnedPages from '@components/common/favorites/PinnedPages';
import NoticeSlot from '@components/common/Overlays/NoticeSlot';
import useProfileBannerState from '@hooks/useProfileBannerState';
import useNavPrefetch from '@hooks/useNavPrefetch';
import { groupByKey, groupOf, MENUS, TOP_NAV } from '@utility/navMenu';
import { prefix } from '@utility/helpers';
import { sessionQuery } from '@utility/nav-query';
import { trackEvent } from '@utility/analytics';
import { navBarHeight, profileBannerHeight } from '@components/constants';

const MENU_ID = 'phone-menu';
const LABELS = { account: 'Account', tools: 'Tools' };
const capitalize = (word) => word.charAt(0).toUpperCase() + word.slice(1);

// A pill for a section: Account and Tools pick the list below; the rest are links to their page.
const PILL_SX = { borderRadius: 999, px: 2, color: 'text.primary', borderColor: 'divider' };
const PICKED_SX = { bgcolor: 'primary.soft', borderColor: 'primary.edge' };

// One group of the list: a 48 px row that expands its pages as 44 px links.
const Group = ({ group, open, onToggle, pathname, nav }) => {
  const listId = `${MENU_ID}-${group.key}`;
  return <Box component="li" sx={{ listStyle: 'none' }}>
    <ButtonBase onClick={() => onToggle(group.key)} aria-expanded={open} aria-controls={listId}
                sx={{ width: '100%', height: 48, justifyContent: 'flex-start', gap: 1.5, px: 2, typography: 'body1' }}>
      <Box component="img" src={`${prefix}${group.icon}.png`} alt="" style={group.style}
           sx={{ width: 28, height: 28, objectFit: 'contain', flexShrink: 0 }}/>
      <Box component="span" sx={{ flex: 1, textAlign: 'left' }}>{group.label}</Box>
      <IconChevronDown size={20} aria-hidden style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}/>
    </ButtonBase>
    <Collapse in={open} unmountOnExit>
      <Box component="ul" id={listId} aria-label={group.label} sx={{ m: 0, p: 0, pb: 1 }}>
        {group.pages.map((page) => {
          const current = page.url === pathname;
          return <Box component="li" key={page.url} sx={{ listStyle: 'none' }}>
            <Box component={NextLink} href={{ pathname: page.url, query: nav.query }} prefetch={nav.prefetch}
                 aria-current={current ? 'page' : undefined} onClick={() => nav.onNavigate(page.url)}
                 sx={{
                   display: 'flex', alignItems: 'center', gap: 1.5, height: 44, pl: 4, pr: 2, textDecoration: 'none',
                   typography: 'body2', color: current ? 'text.primary' : 'text.secondary',
                   bgcolor: current ? 'primary.soft' : 'transparent'
                 }}>
              <Box component="img" src={`${prefix}${page.icon}.png`} alt="" style={page.style}
                   sx={{ width: 24, height: 24, objectFit: 'contain', flexShrink: 0 }}/>
              {page.label}
            </Box>
          </Box>;
        })}
      </Box>
    </Collapse>
  </Box>;
};

const GroupList = ({ menu, openGroups, onToggle, pathname, nav }) => {
  const groups = MENUS[menu];
  const rows = menu === 'account'
    ? [['Worlds', groups.filter(({ row }) => row === 'worlds')], ['Account-wide', groups.filter(({ row }) => row === 'account')]]
    : [[null, groups]];
  return rows.map(([label, rowGroups]) => <Box key={label ?? 'tools'} sx={{ mt: 1 }}>
    {label ? <Typography variant="groupLabel" color="text.secondary" sx={{ px: 2, py: 0.5 }}>{label}</Typography> : null}
    <Box component="ul" sx={{ m: 0, p: 0 }}>
      {rowGroups.map((group) => <Group key={group.key} group={group} open={Boolean(openGroups[group.key])}
                                       onToggle={onToggle} pathname={pathname} nav={nav}/>)}
    </Box>
  </Box>);
};

// The menu's content, mounted each time it opens: on the group it was opened at (a group row's name), else the current
// page's, else World 1's list; Tools on a tool page, Account everywhere else.
const PhoneMenuBody = ({ group, onClose }) => {
  const { state } = useContext(AppContext);
  const router = useRouter();
  const pathname = router?.pathname ?? '';
  const prefetch = useNavPrefetch();
  const target = (group ? groupByKey(group) : null) ?? groupOf(pathname);
  const [menu, setMenu] = useState(target?.menu ?? 'account');
  const [openGroups, setOpenGroups] = useState(target ? { [target.key]: true } : {});
  const nav = {
    query: sessionQuery(router?.query),
    prefetch,
    onNavigate: (url) => {
      trackEvent('handle_nav', { event_category: url, event_label: 'engagement', value: 1, source: 'phone' });
      onClose();
    }
  };
  return <Box component="nav" aria-label="Main" sx={{ pb: 2 }}>
    <Stack direction="row" flexWrap="wrap" gap={1} sx={{ p: 2 }}>
      {TOP_NAV.map((item) => {
        if (state?.profile && item === 'guilds') return null;
        if (item === 'account' || item === 'tools') {
          const picked = menu === item;
          return <Button key={item} variant="outlined" aria-pressed={picked} onClick={() => setMenu(item)}
                         sx={[PILL_SX, picked ? PICKED_SX : {}]}>{LABELS[item]}</Button>;
        }
        const current = pathname.includes(item);
        return <Button key={item} variant="outlined" component={NextLink} href={{ pathname: `/${item}`, query: nav.query }}
                       prefetch={prefetch} aria-current={current ? 'page' : undefined}
                       onClick={() => nav.onNavigate(`/${item}`)} sx={[PILL_SX, current ? PICKED_SX : {}]}>
          {capitalize(item)}
        </Button>;
      })}
    </Stack>
    <PinnedPages/>
    <GroupList key={menu} menu={menu} openGroups={openGroups} pathname={pathname} nav={nav}
               onToggle={(key) => setOpenGroups((groups) => ({ ...groups, [key]: !groups[key] }))}/>
    <Link href="https://ko-fi.com/S6S7BHLQ4" target="_blank" rel="noopener" variant="body2" color="text.secondary"
          sx={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, mx: 2, mt: 1 }}>
      Buy me a coffee
    </Link>
  </Box>;
};

// The phone menu (Layout3PhoneMenu): every section, world and tool in one list under the bar, below lg. A modal
// drawer from the bar's bottom (and the band's, while it shows) to the anchor ad's top: the ad stays in view under
// it, and the bar stays above it, so its x is always there. Esc, the x, a link or a page change closes it.
// at: null while closed, else { group } it opened at (NavBar owns it, so a group row can open it too).
export const PHONE_MENU_ID = MENU_ID;
const PhoneMenu = ({ at, onOpen, onClose }) => {
  const { isVisible: bandVisible } = useProfileBannerState();
  const open = Boolean(at);
  const top = navBarHeight + (bandVisible ? profileBannerHeight : 0);

  return <>
    <IconButton onClick={() => (open ? onClose() : onOpen(null))} aria-label={open ? 'Close menu' : 'Open menu'}
                aria-expanded={open} aria-controls={open ? MENU_ID : undefined} edge="start"
                sx={{ mr: 2, display: { xs: 'inherit', lg: 'none' } }}>
      {open ? <CloseIcon/> : <MenuIcon/>}
    </IconButton>
    <Drawer anchor="top" open={open} onClose={onClose} hideBackdrop
            // Under the bar and the band (drawer + 1), and clear of the anchor ad, which stays in view and tappable
            sx={{ zIndex: (theme) => theme.zIndex.drawer, bottom: 'var(--nitro-ad-height, 0px)', display: { lg: 'none' } }}
            PaperProps={{
              id: MENU_ID, 'aria-label': 'Menu',
              sx: { top, bottom: 'var(--nitro-ad-height, 0px)', height: 'auto', maxHeight: 'none', backgroundImage: 'none', borderTop: 1, borderColor: 'divider' }
            }}>
      <PhoneMenuBody group={at?.group} onClose={onClose}/>
      {/* The open menu is a modal: a notice from inside it (a pinned pages import) is heard here */}
      <NoticeSlot open={open}/>
    </Drawer>
  </>;
};

export default PhoneMenu;
