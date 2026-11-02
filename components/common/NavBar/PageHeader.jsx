import React, { createContext, useContext, useState } from 'react';
import NextLink from 'next/link';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { Box, ButtonBase, Divider, ListItemIcon, ListItemText, Menu, MenuItem, MenuList, Stack, Typography, useMediaQuery } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { IconChevronDown } from '@tabler/icons-react';
import Pin from '@components/common/favorites/Pin';
import AppDialog from '@components/common/Overlays/AppDialog';
import { titleOf } from '@components/common/PageTitle';
import { hasGoals } from '@utility/goals/routes';
import { headerIconFor } from '@utility/pageIndex';
import { groupOf } from '@utility/navMenu';
import { prefix } from '@utility/helpers';
import { sessionQuery } from '@utility/nav-query';
import { trackEvent } from '@utility/analytics';

// Parser-heavy popover: kept out of every page's bundle, fetched only on routes that have goals
const AddGoalButton = dynamic(() => import('@components/goals/AddGoalButton'), { ssr: false });

// The header's slots: the nodes a page renders its own header parts into (Page settings at the row's end, a page-wide
// control after Pin). null on the build machine and on the first client render, so the export has neither and nothing
// mismatches; the page's own state stays the page's (a portal keeps its context).
const SlotContext = createContext({ settings: null, control: null, setSettings: () => {}, setControl: () => {} });
export const PageHeaderSlots = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [control, setControl] = useState(null);
  return <SlotContext value={{ settings, control, setSettings, setControl }}>{children}</SlotContext>;
};
export const usePageHeaderSlot = (name = 'settings') => useContext(SlotContext)[name];
export const SettingsSlot = () => {
  const { setSettings } = useContext(SlotContext);
  return <Box ref={setSettings} sx={{ display: 'flex', alignItems: 'center' }}/>;
};
const ControlSlot = () => {
  const { setControl } = useContext(SlotContext);
  return <Box ref={setControl} sx={{ display: 'contents' }}/>;
};
// A page-wide control in the header row, after Pin (the characters picker): rendered once the slot exists.
export const PageHeaderControl = ({ children }) => {
  const node = usePageHeaderSlot('control');
  return node ? createPortal(children, node) : null;
};

// A switcher row is a tap target: 44 px on a coarse pointer, as the phone menu's links (the theme's menu rows are 40)
const ITEM_SX = { '@media (pointer: coarse)': { minHeight: 44 } };

// A phone's title opens the other pages of its group (Layout3Phone, ToolsPhone): a menu, or a sheet past 8, ending
// with every page of the group in the phone menu.
const TitleSwitcher = ({ group, title, pathname, onOpenGroup }) => {
  const router = useRouter();
  const [anchor, setAnchor] = useState(null);
  const close = () => setAnchor(null);
  const query = sessionQuery(router?.query);
  const asSheet = group.pages.length > 8;
  const items = [
    ...group.pages.map((page) => {
      const current = page.url === pathname;
      return <MenuItem key={page.url} component={NextLink} href={{ pathname: page.url, query }} selected={current}
                       aria-current={current ? 'page' : undefined} sx={ITEM_SX}
                       onClick={() => {
                         trackEvent('handle_nav', { event_category: page.url, event_label: 'engagement', value: 1, source: 'title' });
                         close();
                       }}>
        <ListItemIcon>
          <Box component="img" src={`${prefix}${page.icon}.png`} alt="" style={page.style}
               sx={{ width: 24, height: 24, objectFit: 'contain' }}/>
        </ListItemIcon>
        <ListItemText>{page.label}</ListItemText>
        {current ? <CheckIcon fontSize="small" sx={{ ml: 1 }}/> : null}
      </MenuItem>;
    }),
    <Divider key="divider"/>,
    <MenuItem key="all" sx={ITEM_SX} onClick={() => {
      close();
      onOpenGroup(group.key);
    }}>
      <ListItemText>All {group.label} pages</ListItemText>
    </MenuItem>
  ];
  return <>
    <ButtonBase aria-haspopup={asSheet ? 'dialog' : 'menu'} aria-expanded={Boolean(anchor)}
                onClick={(event) => setAnchor(event.currentTarget)}
                sx={{ font: 'inherit', color: 'inherit', gap: 0.5, maxWidth: '100%', borderRadius: 1, justifyContent: 'flex-start' }}>
      <Box component="span" sx={{ textAlign: 'left' }}>{title}</Box>
      <IconChevronDown size={22} aria-hidden style={{ flexShrink: 0 }}/>
    </ButtonBase>
    {anchor && !asSheet ? <Menu anchorEl={anchor} open onClose={close}>{items}</Menu> : null}
    {anchor && asSheet ? <AppDialog open onClose={close} title={`${group.label} pages`} phone="tall">
      <MenuList autoFocusItem>{items}</MenuList>
    </AppDialog> : null}
  </>;
};

// The page's h1, and on a phone, after hydration, the switcher inside it (the export and the first render are the plain
// h1 at every width). The group's caption above it is CSS only, so nothing moves when the switcher arrives. On a phone
// a long title wraps to a second line ("Guaranteed Drop Calculator" was "Guaranteed Drop Calc..." at 384); from md it
// keeps one line and an ellipsis.
const TitleOrSwitcher = ({ title, pathname, onOpenGroup }) => {
  const isPhone = useMediaQuery((theme) => theme.breakpoints.down('md'));
  const group = groupOf(pathname);
  return <Stack sx={{ minWidth: 0 }}>
    {group ? <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'block', md: 'none' } }}>
      {group.label}
    </Typography> : null}
    <Typography variant="pageTitle" component="h1"
                sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: { xs: 'normal', md: 'nowrap' } }}>
      {isPhone && group ? <TitleSwitcher group={group} title={title} pathname={pathname} onOpenGroup={onOpenGroup}/> : title}
    </Typography>
  </Stack>;
};

// Every page's first row (Tabs board): icon, title, Pin and Add goal, then the page's own settings at the end. One
// height everywhere, so nothing jumps between pages; Add goal arrives after the goals load and the gear after
// hydration, both where they move nothing (Decision 5). The body starts right under it, so a page's first note sits
// under its title (Decision 7). Where the row is too narrow, the buttons move together to a row of their own, and a title
// still too long for its line ends in an ellipsis. onOpenGroup: the phone menu at a group (a phone title's "All ... pages").
const PageHeader = ({ onOpenGroup }) => {
  const router = useRouter();
  const pathname = router?.pathname ?? '';
  const icon = headerIconFor(pathname);
  const title = titleOf(pathname);
  const showPin = pathname.includes('account') || pathname.includes('tools');
  const goals = hasGoals(pathname);
  if (!title && !showPin && !goals) return null;
  return <Stack data-shell="header" direction="row" alignItems="center" columnGap={2} rowGap={0.5} flexWrap="wrap"
                sx={{ minHeight: 48, mb: 2 }}>
    {title ? <Stack direction="row" alignItems="center" columnGap={2} sx={{ minWidth: 0, maxWidth: '100%' }}>
      {icon ? <Box component="img" src={`${prefix}${icon.icon}.png`} alt="" style={icon.style}
                   sx={{ width: 32, height: 32, objectFit: 'contain', flexShrink: 0 }}/> : null}
      <TitleOrSwitcher title={title} pathname={pathname} onOpenGroup={onOpenGroup}/>
    </Stack> : null}
    {/* One group, so the buttons wrap together; gone while it holds nothing (the control slot is empty off /characters).
        On a row of its own it may still be wider than a phone (Pin, a page's picker, Add goal): then it wraps too. */}
    <Stack direction="row" alignItems="center" columnGap={2} rowGap={1} flexWrap="wrap"
           sx={{ flexShrink: 0, maxWidth: '100%', '&:not(:has(> :not(:empty)))': { display: 'none' } }}>
      {showPin ? <Pin/> : null}
      <ControlSlot/>
      {goals ? <AddGoalButton/> : null}
    </Stack>
    <Box sx={{ flex: 1 }}/>
    <SettingsSlot/>
  </Stack>;
};

export default PageHeader;
