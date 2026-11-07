import React, { useContext, useEffect, useRef, useState } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { Box, ButtonBase, Collapse, Drawer, IconButton, Link } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { IconChevronDown } from '@tabler/icons-react';
import { AppContext } from '@components/common/context/AppProvider';
import PinnedPages from '@components/common/favorites/PinnedPages';
import NoticeSlot from '@components/common/Overlays/NoticeSlot';
import usePageTop from '@hooks/usePageTop';
import useNavPrefetch from '@hooks/useNavPrefetch';
import { groupByKey, groupOf, MENUS, menuOfRoute, TOP_NAV, topNavLabel } from '@utility/navMenu';
import { prefix } from '@utility/helpers';
import { sessionQuery } from '@utility/nav-query';
import { trackEvent } from '@utility/analytics';

const MENU_ID = 'phone-menu';

// A pill for a section (Layout3PhoneMenu): Worlds, Account and Tools pick the list below; the rest are links to their page.
// 32 px drawn in the one strip, with a 44 px tap target that stays inside the strip's padding (a scroller clips the rest).
const PILL_SX = {
  position: 'relative', flexShrink: 0, height: 32, px: 1.25, borderRadius: 999, fontSize: 13, lineHeight: '20px', fontWeight: 600,
  whiteSpace: 'nowrap', textDecoration: 'none', color: 'text.secondary', '&::before': { content: '""', position: 'absolute', inset: '-6px 0' }
};
const PICKED_SX = { bgcolor: 'primary.soft', color: 'text.primary' };

// One group of the list: a 46 px row that expands its pages as 42 px links, both on the open group's tint. A page's tap
// target reaches the 44 px every touch control has, a pixel into each neighbour.
const Group = ({ group, open, onToggle, pathname, nav }) => {
  const listId = `${MENU_ID}-${group.key}`;
  return <Box component="li" sx={{ listStyle: 'none' }}>
    <ButtonBase onClick={() => onToggle(group.key)} aria-expanded={open} aria-controls={listId}
                sx={{
                  width: '100%', height: 46, justifyContent: 'flex-start', gap: 1.5, px: 2, fontSize: 16, lineHeight: '24px', fontWeight: 500,
                  bgcolor: open ? 'background.tint' : 'transparent'
                }}>
      <Box component="img" src={`${prefix}${group.icon}.png`} alt="" style={group.style}
           sx={{ width: 28, height: 28, objectFit: 'contain', flexShrink: 0 }}/>
      <Box component="span" sx={{ flex: 1, textAlign: 'left' }}>{group.label}</Box>
      <Box component={IconChevronDown} size={18} aria-hidden
           sx={{ color: 'text.secondary', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}/>
    </ButtonBase>
    <Collapse in={open} unmountOnExit>
      <Box component="ul" id={listId} aria-label={group.label} sx={{ m: 0, p: 0 }}>
        {group.pages.map((page) => {
          const current = page.url === pathname;
          return <Box component="li" key={page.url} sx={{ listStyle: 'none' }}>
            <Box component={NextLink} href={{ pathname: page.url, query: nav.query }} prefetch={nav.prefetch}
                 aria-current={current ? 'page' : undefined} onClick={() => nav.onNavigate(page.url)}
                 sx={{
                   position: 'relative', display: 'flex', alignItems: 'center', gap: 1.5, height: 42, pl: 7, pr: 2, textDecoration: 'none',
                   fontSize: 15, lineHeight: '22px', color: 'text.primary',
                   bgcolor: current ? 'primary.soft' : 'background.tint',
                   '&::before': { content: '""', position: 'absolute', inset: '-1px 0' }
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

const GroupList = ({ menu, openGroups, onToggle, pathname, nav }) => <Box component="ul" sx={{ m: 0, p: 0 }}>
  {MENUS[menu].map((group) => <Group key={group.key} group={group} open={Boolean(openGroups[group.key])}
                                     onToggle={onToggle} pathname={pathname} nav={nav}/>)}
</Box>;

// The menu's content, mounted each time it opens: on the group it was opened at (a group row's name), else the current
// page's menu with its group open, else the Worlds list, where most of the clicks go.
const PhoneMenuBody = ({ group, onClose }) => {
  const { state } = useContext(AppContext);
  const router = useRouter();
  const pathname = router?.pathname ?? '';
  const prefetch = useNavPrefetch();
  const target = (group ? groupByKey(group) : null) ?? groupOf(pathname);
  const [menu, setMenu] = useState(target?.menu ?? menuOfRoute(pathname) ?? 'worlds');
  const [openGroups, setOpenGroups] = useState(target ? { [target.key]: true } : {});
  // The strip scrolls by itself when its sections outrun a phone: it opens with the current one in view
  const stripRef = useRef(null);
  useEffect(() => {
    const strip = stripRef.current;
    const here = strip?.querySelector('[aria-current="page"]') ?? strip?.querySelector('[aria-pressed="true"]');
    const past = (here?.offsetLeft ?? 0) + (here?.offsetWidth ?? 0) + 12 - (strip?.clientWidth ?? 0);
    if (past > 0) strip.scrollLeft = past;
  }, []);
  const nav = {
    query: sessionQuery(router?.query),
    prefetch,
    onNavigate: (url) => {
      trackEvent('handle_nav', { event_category: url, event_label: 'engagement', value: 1, source: 'phone' });
      onClose();
    }
  };
  return <Box component="nav" aria-label="Main" sx={{ pb: 2 }}>
    <Box ref={stripRef} sx={{
      position: 'relative', display: 'flex', gap: '6px', px: 1.5, pt: 1.5, pb: 1, mb: '6px', borderBottom: 1, borderColor: 'divider',
      overflowX: 'auto', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' }
    }}>
      {TOP_NAV.map((item) => {
        if (state?.profile && item === 'guilds') return null;
        if (MENUS[item]) {
          const picked = menu === item;
          return <ButtonBase key={item} aria-pressed={picked} onClick={() => setMenu(item)}
                             sx={[PILL_SX, picked ? PICKED_SX : {}]}>{topNavLabel(item)}</ButtonBase>;
        }
        const current = pathname.includes(item);
        return <ButtonBase key={item} component={NextLink} href={{ pathname: `/${item}`, query: nav.query }}
                           prefetch={prefetch} aria-current={current ? 'page' : undefined}
                           onClick={() => nav.onNavigate(`/${item}`)} sx={[PILL_SX, current ? PICKED_SX : {}]}>
          {topNavLabel(item)}
        </ButtonBase>;
      })}
    </Box>
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
  const open = Boolean(at);
  // Under the bar and the band while it shows
  const top = usePageTop();

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
