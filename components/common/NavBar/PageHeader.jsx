import React, { createContext, useContext, useState } from 'react';
import NextLink from 'next/link';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { Box, ButtonBase, Divider, Menu, MenuItem, MenuList, Stack, Typography, useMediaQuery } from '@mui/material';
import { IconCheck, IconChevronDown } from '@tabler/icons-react';
import Pin from '@components/common/favorites/Pin';
import AppDialog from '@components/common/Overlays/AppDialog';
import { titleOf } from '@components/common/PageTitle';
import { hasGoals } from '@utility/goals/routes';
import { headerIconFor } from '@utility/pageIndex';
import { groupOf } from '@utility/navMenu';
import { prefix } from '@utility/helpers';
import { sessionQuery } from '@utility/nav-query';
import { trackEvent } from '@utility/analytics';
import { PHONE_SIDES } from '@components/common/NavBar/frame';

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
// On a phone a page-wide control takes the group's last line, so Pin, Add goal and the gear keep their one row.
const ControlSlot = () => {
  const { setControl } = useContext(SlotContext);
  return <Box ref={setControl} sx={{
    display: { xs: 'flex', sm: 'contents' }, order: { xs: 1, sm: 0 }, flexBasis: { xs: '100%', sm: 'auto' }, '&:empty': { display: 'none' }
  }}/>;
};
// A page-wide control in the header row, after Pin (the characters picker): rendered once the slot exists.
export const PageHeaderControl = ({ children }) => {
  const node = usePageHeaderSlot('control');
  return node ? createPortal(children, node) : null;
};

// A switcher row as the board's dropdown: 38 px drawn, 6 px corners. On a coarse pointer it keeps a 44 px tap target: 6 px
// of air between the rows, and each row's hit area reaches 3 px into it.
const ITEM_SX = {
  minHeight: 38, px: '10px', gap: '10px', borderRadius: '6px', typography: 'body2', '@media (min-width: 600px)': { minHeight: 38 },
  '@media (pointer: coarse)': { mb: '6px', '&::before': { content: '""', position: 'absolute', inset: '-3px 0' } }
};
const MENU_PAPER = { width: 'calc(100vw - 32px)', maxWidth: 'none', maxHeight: 'calc(100% - 32px)' };
const ALL_LABEL = { account: 'All account pages', tools: 'All tools' };

// A phone's title opens the other pages of its group (Layout3Phone, ToolsPhone): a dropdown across the gutters, or a sheet
// past 8, ending with every page of the group in the phone menu.
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
        <Box component="img" src={`${prefix}${page.icon}.png`} alt="" style={page.style}
             sx={{ width: 22, height: 22, objectFit: 'contain', flexShrink: 0 }}/>
        {page.label}
        {current ? <IconCheck size={18} stroke={2.5} aria-hidden style={{ marginLeft: 'auto', flexShrink: 0 }}/> : null}
      </MenuItem>;
    }),
    <Divider key="divider" sx={{ my: '6px !important', mx: '4px' }}/>,
    <MenuItem key="all" sx={[ITEM_SX, { color: 'primary.main', fontWeight: 500 }]} onClick={() => {
      close();
      onOpenGroup(group.key);
    }}>
      {ALL_LABEL[group.menu]} ›
    </MenuItem>
  ];
  return <>
    <ButtonBase aria-haspopup={asSheet ? 'dialog' : 'menu'} aria-expanded={Boolean(anchor)}
                onClick={(event) => setAnchor(event.currentTarget)}
                sx={{ font: 'inherit', color: 'inherit', gap: 0.75, maxWidth: '100%', borderRadius: 1, justifyContent: 'flex-start' }}>
      <Box component="span" sx={{ textAlign: 'left' }}>{title}</Box>
      <IconChevronDown size={18} aria-hidden style={{ flexShrink: 0, transform: anchor ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}/>
    </ButtonBase>
    {anchor && !asSheet ? <Menu anchorEl={anchor} open onClose={close} slotProps={{ paper: { sx: MENU_PAPER } }}
                                MenuListProps={{ 'aria-label': `${group.label} pages`, sx: { p: '6px' } }}>
      <Typography variant="groupLabel" component="li" role="presentation" color="text.secondary" sx={{ px: '10px', pt: '6px', pb: '4px' }}>
        {group.label}
      </Typography>
      {items}
    </Menu> : null}
    {anchor && asSheet ? <AppDialog open onClose={close} title={`${group.label} pages`} phone="tall">
      <MenuList autoFocusItem>{items}</MenuList>
    </AppDialog> : null}
  </>;
};

const TitleIcon = ({ icon, sx }) => <Box component="img" src={`${prefix}${icon.icon}.png`} alt="" style={icon.style}
                                         sx={[{ objectFit: 'contain', flexShrink: 0 }, sx]}/>;

// The page's h1, and on a phone, after hydration, the switcher inside it (the export and the first render are the plain
// h1 at every width). The group's caption above it is CSS only, so nothing moves when the switcher arrives. On a phone
// a long title wraps at a space, never inside a word ("Guaranteed Drop Calculator" was "Guaranteed Drop Calc..." at
// 384); from md it keeps one line and an ellipsis. Below sm a grouped title's icon sits in the caption's line: the row
// has no room for it beside the title with Pin, Add goal and the gear.
const TitleOrSwitcher = ({ title, group, icon, pathname, onOpenGroup }) => {
  const isPhone = useMediaQuery((theme) => theme.breakpoints.down('md'));
  return <Stack sx={{ minWidth: 0 }}>
    {group ? <Stack direction="row" alignItems="center" gap={0.75} sx={{ display: { xs: 'flex', md: 'none' } }}>
      {icon ? <TitleIcon icon={icon} sx={{ width: 20, height: 20, display: { xs: 'block', sm: 'none' } }}/> : null}
      <Typography variant="caption" color="text.secondary">{group.label}</Typography>
    </Stack> : null}
    <Typography variant="pageTitle" component="h1"
                sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: { xs: 'normal', md: 'nowrap' } }}>
      {isPhone && group ? <TitleSwitcher group={group} title={title} pathname={pathname} onOpenGroup={onOpenGroup}/> : title}
    </Typography>
  </Stack>;
};

// Every page's first row (Tabs board): icon, title, Pin and Add goal, then the page's own settings at the end. One
// height everywhere, so nothing jumps between pages; Add goal arrives after the goals load and the gear after
// hydration, both where they move nothing (Decision 5). The body starts right under it, so a page's first note sits
// under its title (Decision 7). On a phone (Layout3Phone) the buttons are their short forms and share the title's row
// when they fit: a title too long for that takes its own line and they move together under it, the gear at their end.
// onOpenGroup: the phone menu at a group (a phone title's "All ... pages").
const PageHeader = ({ onOpenGroup }) => {
  const router = useRouter();
  const pathname = router?.pathname ?? '';
  const icon = headerIconFor(pathname);
  const title = titleOf(pathname);
  const isCharacters = pathname === '/characters';
  const showPin = pathname.includes('account') || pathname.includes('tools') || isCharacters;
  const goals = hasGoals(pathname);
  const group = groupOf(pathname);
  if (!title && !showPin && !goals) return null;
  return <Stack data-shell="header" direction="row" alignItems={{ xs: 'flex-end', sm: 'center' }} columnGap={{ xs: 1, sm: 2 }} rowGap={0.5} flexWrap="wrap"
                sx={{ minHeight: 48, mb: 2, mt: { xs: -1, sm: 0 } }}>
    {title ? <Stack direction="row" alignItems="center" columnGap={2} sx={{ minWidth: 0, maxWidth: '100%', ...(isCharacters ? { [PHONE_SIDES]: { flexGrow: 1 } } : {}) }}>
      {icon ? <TitleIcon icon={icon} sx={{ width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 }, display: { xs: group ? 'none' : 'block', sm: 'block' } }}/> : null}
      <TitleOrSwitcher title={title} group={group} icon={icon} pathname={pathname} onOpenGroup={onOpenGroup}/>
    </Stack> : null}
    {/* One group, so the buttons wrap together, the gear at its end; gone while it holds nothing. The characters page's
        control is wider than the group's line, which would take Pin and Add goal under the title with it: on a phone
        the group opens into the row, so they stay beside the title and the control takes its own row. */}
    <Stack direction="row" alignItems="center" columnGap={{ xs: 0.5, sm: 2 }} rowGap={1} flexWrap="wrap"
           sx={{
             flex: '1 1 auto', minWidth: 0, maxWidth: '100%', '&:not(:has(> :not(:empty)))': { display: 'none' },
             ...(isCharacters ? { [PHONE_SIDES]: { display: 'contents', '& > :empty': { display: 'none' } } } : {})
           }}>
      {showPin ? <Pin/> : null}
      <ControlSlot/>
      {/* Add goal's room on a phone is held while it loads, so its arrival never wraps the row */}
      {goals ? <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 2 }, minWidth: { xs: 84, sm: 0 } }}><AddGoalButton/></Box> : null}
      <Box sx={{ flex: 1 }}/>
      <SettingsSlot/>
    </Stack>
  </Stack>;
};

export default PageHeader;
