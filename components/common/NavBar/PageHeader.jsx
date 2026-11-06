import React, { createContext, useContext, useState } from 'react';
import NextLink from 'next/link';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { Box, ButtonBase, Divider, Menu, MenuItem, MenuList, Stack, Typography, useMediaQuery } from '@mui/material';
import { IconCheck, IconChevronDown } from '@tabler/icons-react';
import Pin from '@components/common/favorites/Pin';
import { AppContext } from '@components/common/context/AppProvider';
import AppDialog from '@components/common/Overlays/AppDialog';
import { useGoals } from '@components/goals/GoalsProvider';
import usePageDataLoading from '@hooks/usePageDataLoading';
import { titleOf } from '@components/common/PageTitle';
import { hasGoals } from '@utility/goals/routes';
import { headerIconFor } from '@utility/pageIndex';
import { groupOf } from '@utility/navMenu';
import { prefix } from '@utility/helpers';
import { sessionQuery } from '@utility/nav-query';
import { trackEvent } from '@utility/analytics';

// Parser-heavy popover: kept out of every page's bundle, fetched only on routes that have goals. While its chunk is on
// the way the marker holds the header's buttons back (BUTTONS_SX); a chunk that failed leaves the others to show.
const AddGoalButton = dynamic(() => import('@components/goals/AddGoalButton'), {
  ssr: false,
  loading: ({ error }) => (error ? null : <span data-goals-pending hidden/>)
});

// The header's slots: the nodes a page renders its own header parts into (Page settings at the row's end, a page-wide
// control by the title). null on the build machine and on the first client render, so the export has neither and nothing
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
  return <Box ref={setSettings} sx={{ display: 'contents' }}/>;
};
// On a phone a page-wide control takes the header's last line, under the title and the buttons.
const ControlSlot = () => {
  const { setControl } = useContext(SlotContext);
  return <Box ref={setControl} sx={{
    display: { xs: 'flex', sm: 'contents' }, order: { xs: 1, sm: 0 }, flexBasis: { xs: '100%', sm: 'auto' }, mt: { xs: 1, sm: 0 },
    '&:empty': { display: 'none' }
  }}/>;
};
// A page-wide control in the header row, by the title (the characters picker): rendered once the slot exists.
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
                sx={{ font: 'inherit', color: 'inherit', gap: 0.75, maxWidth: '100%', borderRadius: 1, justifyContent: 'flex-start', verticalAlign: 'top' }}>
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

// The title's box, the h1's 36 px line, sits 14 px under whatever is above it. Under a group row that row's 8 px margin and
// the 6 px of air in the title's 48 make it; with none above, main's 24 px padding less 16. Below md, where a grouped page's
// first line is its caption and the buttons, the block has no air and starts 14 px down: main's 24 less 10.
const rowHeight = (group) => (group ? { md: 48 } : { xs: 36, sm: 48 });
const headerSx = (group, title) => ({
  // A route that draws its own h1 has it under this row, 14 px down
  mb: title ? 2 : '14px',
  minHeight: rowHeight(group),
  mt: group ? { xs: '-10px', md: 0 } : { xs: '-10px', sm: '-16px' },
  rowGap: group ? { xs: 0, sm: 0.5 } : 0.5
});
// One group at the row's right end, one gap apart; gone while it holds nothing.
const BUTTONS_SX = {
  ml: 'auto', minWidth: 0, maxWidth: '100%', columnGap: { xs: '6px', sm: 1 }, rowGap: 1, justifyContent: 'flex-end',
  '&:not(:has(> :not(:empty)))': { display: 'none' },
  '&:has([data-goals-pending])': { visibility: 'hidden' }
};

// Every page's first row (Tabs board, mock A): icon, title and any page-wide control on the left; Pin, Goals and the page's
// own settings on the right, one height and one outline. They arrive at different times: Pin is in the export, Goals after
// the stored goals and its chunk, the gear with the page's body once the save is parsed, and in a right-aligned group each
// arrival would push the others left. So the group keeps its place in the row, hidden, until the last has arrived, and all
// show at once in their final places; a guest or a failed section, whose page draws fewer, shows fewer at that same moment.
// Below md a grouped page's caption line holds the buttons, so the title has the whole width (a long one wraps at a space,
// never inside a word; from md it keeps one line and an ellipsis). Below sm the icon sits in that line too, and the buttons
// are their short forms. A page with no caption keeps them on the title's row while they fit.
// onOpenGroup: the phone menu at a group (a phone title's "All ... pages").
const PageHeader = ({ onOpenGroup }) => {
  const router = useRouter();
  const { state } = useContext(AppContext);
  const { loaded } = useGoals();
  const { loading } = usePageDataLoading();
  const isNarrow = useMediaQuery((theme) => theme.breakpoints.down('md'));
  const isPhone = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const pathname = router?.pathname ?? '';
  const icon = headerIconFor(pathname);
  const title = titleOf(pathname);
  const showPin = pathname.includes('account') || pathname.includes('tools') || pathname === '/characters';
  const goals = hasGoals(pathname);
  const group = groupOf(pathname);
  if (!title && !showPin && !goals) return null;
  const settled = loaded && !state?.isLoading && !loading;
  const heading = title ? <Stack key="title" direction="row" alignItems="center" columnGap={2}
                                 sx={{ minWidth: 0, maxWidth: '100%', minHeight: rowHeight(group), flexBasis: group ? { xs: '100%', md: 'auto' } : 'auto' }}>
    {icon ? <TitleIcon icon={icon} sx={{ width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 }, display: { xs: group ? 'none' : 'block', sm: 'block' } }}/> : null}
    <Typography variant="pageTitle" component="h1"
                sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: { xs: 'normal', md: 'nowrap' } }}>
      {isNarrow && group ? <TitleSwitcher group={group} title={title} pathname={pathname} onOpenGroup={onOpenGroup}/> : title}
    </Typography>
  </Stack> : null;
  const control = <ControlSlot key="control"/>;
  const buttons = <Stack key="buttons" direction="row" alignItems="center" flexWrap="wrap"
                         sx={[BUTTONS_SX, { order: group ? { xs: -1, md: 0 } : 0 }, settled ? null : { visibility: 'hidden' }]}>
    {showPin ? <Pin/> : null}
    {goals ? <AddGoalButton/> : null}
    <SettingsSlot/>
  </Stack>;
  // CSS order lays the row out from the export on. Tab follows the DOM, never CSS order, so after hydration the keyed parts
  // take the same order in the DOM at each width, moved rather than remounted.
  const parts = group && isNarrow ? [buttons, heading, control]
    : !group && isPhone ? [heading, buttons, control]
      : [heading, control, buttons];
  return <Stack data-shell="header" direction="row" alignItems="center" flexWrap="wrap" columnGap={{ xs: 1, sm: 2 }} sx={headerSx(group, title)}>
    {group && title ? <Stack direction="row" alignItems="center" gap={0.75} sx={{ display: { xs: 'flex', md: 'none' }, order: -2, flex: '1 1 0', minWidth: 0 }}>
      {icon ? <TitleIcon icon={icon} sx={{ width: 20, height: 20, display: { xs: 'block', sm: 'none' } }}/> : null}
      <Typography variant="caption" color="text.secondary" noWrap>{group.label}</Typography>
    </Stack> : null}
    {parts}
  </Stack>;
};

export default PageHeader;
