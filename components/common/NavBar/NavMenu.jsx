import React, { useEffect, useRef, useState } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { Box, ButtonBase, ClickAwayListener, ListItemButton, ListItemText, Typography, useMediaQuery } from '@mui/material';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { groupOf, MENUS } from '@utility/navMenu';
import { prefix } from '@utility/helpers';
import { sessionQuery } from '@utility/nav-query';
import { trackEvent } from '@utility/analytics';
import { navBarHeight } from '@components/constants';
import { frameSx } from './frame';

const LABELS = { account: 'Account', tools: 'Tools' };
export const navMenuId = (menu) => `nav-menu-${menu}`;
const buttonId = (menu) => `nav-menu-${menu}-button`;
// The buttons that open a menu (the bar's, a group row's name): a click outside the panel that lands on one swaps or
// toggles the panel instead of closing it first.
export const MENU_BUTTON = 'data-nav-menu-button';

// The bar item for a menu (Decision 11): a click, a tap or Enter opens its panel; no opening on hover.
export const NavMenuButton = ({ menu, open, selected, onToggle }) => (
  <ListItemButton id={buttonId(menu)} {...{ [MENU_BUTTON]: '' }} data-cy={`nav-item-${menu}`}
                  selected={selected} aria-expanded={open} aria-controls={open ? navMenuId(menu) : undefined}
                  onClick={() => onToggle(menu)} dense size="medium" sx={{ borderRadius: 2, p: '0 8px' }}>
    <ListItemText component="span" disableTypography sx={{ fontWeight: 'bold', fontSize: 16 }}>
      {LABELS[menu]}
    </ListItemText>
    <IconChevronDown size={16} aria-hidden
                     style={{ marginLeft: 4, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}/>
  </ListItemButton>
);

// The panel's three forms (Decision 3): full where the whole grid fits, compact on a 1366x768 class screen, and
// two panes (the groups, then the open group's pages) below that. Rows and heads per form.
const FORMS = {
  full: { row: 26, head: 38, headIcon: 28, pad: 3 },
  compact: { row: 23, head: 32, headIcon: 24, pad: 1.5 }
};

const PageLink = ({ page, current, height, nav }) => (
  <Box component="li" sx={{ listStyle: 'none' }}>
    <Box component={NextLink} href={{ pathname: page.url, query: nav.query }} prefetch={false}
         data-cy={page.url.split('/').at(-1)} aria-current={current ? 'page' : undefined}
         onClick={() => nav.onNavigate(page.url)}
         sx={{
           display: 'flex', alignItems: 'center', gap: 1, height, px: 1, borderRadius: 1,
           typography: 'body2', textDecoration: 'none',
           color: current ? 'text.primary' : 'text.secondary',
           bgcolor: current ? 'primary.soft' : 'transparent',
           '&:hover': { color: 'text.primary', bgcolor: current ? 'primary.soft' : 'action.hover' }
         }}>
      <Box component="img" src={`${prefix}${page.icon}.png`} alt="" style={page.style}
           sx={{ width: 18, height: 18, objectFit: 'contain', flexShrink: 0 }}/>
      <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{page.label}</Box>
    </Box>
  </Box>
);

const GroupColumn = ({ group, form, pathname, nav }) => {
  const { row, head, headIcon } = FORMS[form];
  return <Box sx={{ minWidth: 0 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, height: head, mb: 0.5, borderBottom: 1, borderColor: 'divider' }}>
      <Box component="img" src={`${prefix}${group.icon}.png`} alt="" style={group.style}
           sx={{ width: headIcon, height: headIcon, objectFit: 'contain', flexShrink: 0 }}/>
      <Typography variant="value" component="div" noWrap>{group.label}</Typography>
    </Box>
    <Box component="ul" aria-label={group.label} sx={{ m: 0, p: 0 }}>
      {group.pages.map((page) => <PageLink key={page.url} page={page} current={page.url === pathname} height={row}
                                           nav={nav}/>)}
    </Box>
  </Box>;
};

const GridForm = ({ menu, form, pathname, nav }) => {
  const groups = MENUS[menu];
  const rows = menu === 'account'
    ? [['Worlds', groups.filter(({ row }) => row === 'worlds')], ['Account-wide', groups.filter(({ row }) => row === 'account')]]
    : [[null, groups]];
  return rows.map(([label, rowGroups], index) => <Box key={label ?? 'tools'} sx={{ mt: index ? 2 : 0 }}>
    {label ? <Typography variant="groupLabel" color="text.secondary" sx={{ mb: 0.5 }}>{label}</Typography> : null}
    <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${rowGroups.length}, minmax(0, 1fr))`, columnGap: 2 }}>
      {rowGroups.map((group) => <GroupColumn key={group.key} group={group} form={form} pathname={pathname} nav={nav}/>)}
    </Box>
  </Box>);
};

// Two panes: the groups on the left, the open group's pages on the right in two columns. Each group's pages
// follow its button in the markup (the grid draws them in the right column), so Tab goes from a group into
// its pages and then on to the next group.
const PaneForm = ({ menu, pathname, nav }) => {
  const groups = MENUS[menu];
  const here = groupOf(pathname);
  const [openKey, setOpenKey] = useState(here?.menu === menu ? here.key : groups[0].key);
  const entries = menu === 'account'
    ? [{ label: 'Worlds' }, ...groups.filter(({ row }) => row === 'worlds'), { label: 'Account-wide' },
      ...groups.filter(({ row }) => row === 'account')]
    : groups;
  const pagesId = `${navMenuId(menu)}-pages`;
  return <Box sx={{
    display: 'grid', gridTemplateColumns: '240px minmax(0, 1fr)', columnGap: 3,
    gridTemplateRows: entries.map((entry) => (entry.key ? '32px' : '28px')).join(' ')
  }}>
    {entries.map((entry, index) => {
      if (!entry.key) {
        return <Typography key={entry.label} variant="groupLabel" color="text.secondary"
                           sx={{ gridColumn: 1, gridRow: index + 1, alignSelf: 'end' }}>{entry.label}</Typography>;
      }
      const open = entry.key === openKey;
      return <React.Fragment key={entry.key}>
        <ButtonBase aria-expanded={open} aria-controls={open ? pagesId : undefined}
                    onClick={() => setOpenKey(entry.key)} onFocus={() => setOpenKey(entry.key)}
                    onMouseEnter={() => setOpenKey(entry.key)}
                    sx={{
                      gridColumn: 1, gridRow: index + 1, justifyContent: 'flex-start', gap: 1, px: 1, borderRadius: 1,
                      typography: 'body2', color: open ? 'text.primary' : 'text.secondary',
                      bgcolor: open ? 'action.selected' : 'transparent'
                    }}>
          <Box component="img" src={`${prefix}${entry.icon}.png`} alt="" style={entry.style}
               sx={{ width: 22, height: 22, objectFit: 'contain', flexShrink: 0 }}/>
          <Box component="span" sx={{ flex: 1, textAlign: 'left' }}>{entry.label}</Box>
          <IconChevronRight size={16} aria-hidden/>
        </ButtonBase>
        {open ? <Box component="ul" id={pagesId} aria-label={entry.label} sx={{
          gridColumn: 2, gridRow: '1 / -1', alignSelf: 'start', m: 0, p: 0,
          display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', columnGap: 2
        }}>
          {entry.pages.map((page) => <PageLink key={page.url} page={page} current={page.url === pathname} height={30}
                                               nav={nav}/>)}
        </Box> : null}
      </React.Fragment>;
    })}
  </Box>;
};

// The Account or Tools pages under the bar (Layout boards). Not modal: another bar item swaps it, and a click outside
// or Esc closes it, focus back on its button (3d and 3e's rule for desktop panels). No dim and no scroll lock:
// the panel takes the page's frame (frame.js), so its edges are the page's and it never covers a side rail.
export const NavMenuPanel = ({ menu, onClose }) => {
  const router = useRouter();
  const panelRef = useRef(null);
  // What opened the panel (the bar's button or a group row's name), for Esc to hand the focus back to.
  const openerRef = useRef(null);
  // The panel exists only after a click, so the media queries are read on a mounted client.
  const full = useMediaQuery('(min-width: 1440px) and (min-height: 840px)');
  const compact = useMediaQuery('(min-width: 1366px) and (min-height: 700px)');
  const form = full ? 'full' : compact ? 'compact' : 'pane';
  const pathname = router?.pathname ?? '';

  useEffect(() => {
    openerRef.current = document.activeElement;
    panelRef.current?.focus();
  }, [menu]);

  const nav = {
    query: sessionQuery(router?.query),
    onNavigate: (url) => {
      trackEvent('handle_nav', { event_category: url, event_label: 'engagement', value: 1, source: 'menu' });
      onClose();
    }
  };

  const onKeyDown = (event) => {
    if (event.key !== 'Escape') return;
    event.stopPropagation();
    onClose();
    const opener = openerRef.current;
    (opener?.isConnected && opener !== document.body ? opener : document.getElementById(buttonId(menu)))?.focus();
  };
  // Tab out of the panel closes it; a click elsewhere is the ClickAwayListener's.
  const onBlur = (event) => {
    const next = event.relatedTarget;
    if (next && !event.currentTarget.contains(next) && !next.closest?.(`[${MENU_BUTTON}]`)) onClose();
  };
  const onClickAway = (event) => {
    if (!event.target?.closest?.(`[${MENU_BUTTON}]`)) onClose();
  };

  // Fixed under the bar, after the band in the markup: the band has the bar's z-index and comes later, so a panel
  // inside the bar would sit behind it. The frame-width wrapper lets clicks through; the panel takes them.
  return <Box sx={{
    position: 'fixed', top: navBarHeight, left: 0, right: 0, zIndex: (theme) => theme.zIndex.drawer + 1,
    pointerEvents: 'none'
  }}>
    <Box sx={frameSx({ reserveRail: true })}>
      <ClickAwayListener onClickAway={onClickAway}>
        <Box ref={panelRef} id={navMenuId(menu)} tabIndex={-1} onKeyDown={onKeyDown} onBlur={onBlur}
             sx={{
               pointerEvents: 'auto', outline: 'none', color: 'text.primary',
               width: menu === 'tools' && form !== 'pane' ? 820 : '100%', maxWidth: '100%',
               p: FORMS[form]?.pad ?? 2, bgcolor: 'background.paper', border: 1, borderTop: 0, borderColor: 'divider',
               borderRadius: '0 0 8px 8px', boxShadow: 8,
               maxHeight: `calc(100vh - ${navBarHeight}px - var(--nitro-ad-height, 0px))`, overflowY: 'auto'
             }}>
          <nav aria-label={`${LABELS[menu]} pages`}>
            {form === 'pane'
              ? <PaneForm menu={menu} pathname={pathname} nav={nav}/>
              : <GridForm menu={menu} form={form} pathname={pathname} nav={nav}/>}
          </nav>
        </Box>
      </ClickAwayListener>
    </Box>
  </Box>;
};
