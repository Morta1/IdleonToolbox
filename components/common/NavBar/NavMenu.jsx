import React, { useEffect, useRef, useState } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { Box, ButtonBase, ClickAwayListener, ListItemButton, ListItemText, Typography, useMediaQuery } from '@mui/material';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { groupOf, MENUS } from '@utility/navMenu';
import { prefix } from '@utility/helpers';
import { sessionQuery } from '@utility/nav-query';
import { trackEvent } from '@utility/analytics';
import usePageTop from '@hooks/usePageTop';
import useFrame from './useFrame';
import { TALL } from './frame';

const LABELS = { account: 'Account', tools: 'Tools' };
export const navMenuId = (menu) => `nav-menu-${menu}`;
const buttonId = (menu) => `nav-menu-${menu}-button`;
// The buttons that open a menu (the bar's, a group row's name): a click outside the panel that lands on one swaps or
// toggles the panel instead of closing it first.
export const MENU_BUTTON = 'data-nav-menu-button';

// The controls Tab stops on, in the markup's order.
const TAB_STOPS = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';
const tabStops = (root) => [...(root?.querySelectorAll(TAB_STOPS) ?? [])].filter((node) => node.getClientRects().length);

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
           display: 'flex', alignItems: 'center', gap: 1, minHeight: height, py: '2px', px: 1, borderRadius: 1,
           typography: 'body2', textDecoration: 'none',
           color: current ? 'text.primary' : 'text.secondary',
           bgcolor: current ? 'primary.soft' : 'transparent',
           '&:hover': { color: 'text.primary', bgcolor: current ? 'primary.soft' : 'action.hover' }
         }}>
      <Box component="img" src={`${prefix}${page.icon}.png`} alt="" style={page.style}
           sx={{ width: 18, height: 18, objectFit: 'contain', flexShrink: 0 }}/>
      {/* A name too long for its column takes a second line, never an ellipsis */}
      <Box component="span" sx={{ minWidth: 0, lineHeight: 1.25 }}>{page.label}</Box>
    </Box>
  </Box>
);

const GroupColumn = ({ group, form, pathname, nav }) => {
  const { row, head, headIcon } = FORMS[form];
  return <Box>
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
    {/* Columns as wide as their longest name, the rest shared out: a 1366 screen holds every name on one line, and a
        narrower one wraps the longest names rather than cutting them */}
    <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${rowGroups.length}, auto)`, columnGap: 2 }}>
      {rowGroups.map((group) => <GroupColumn key={group.key} group={group} form={form} pathname={pathname} nav={nav}/>)}
    </Box>
  </Box>);
};

// A pointer crossing other groups on its way to the open group's pages leaves them shut: hover opens a group only
// after it rests this long. A click or the focus opens one at once.
const HOVER_OPEN_MS = 150;

// Two panes: the groups on the left, the open group's pages on the right in two columns. Each group's pages
// follow its button in the markup (the grid draws them in the right column), so Tab goes from a group into
// its pages and then on to the next group.
const PaneForm = ({ menu, pathname, nav }) => {
  const groups = MENUS[menu];
  const here = groupOf(pathname);
  const [openKey, setOpenKey] = useState(here?.menu === menu ? here.key : groups[0].key);
  const hoverTimer = useRef(null);
  useEffect(() => () => clearTimeout(hoverTimer.current), []);
  const openNow = (key) => {
    clearTimeout(hoverTimer.current);
    setOpenKey(key);
  };
  const openAfterRest = (key) => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setOpenKey(key), HOVER_OPEN_MS);
  };
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
                    onClick={() => openNow(entry.key)} onFocus={() => openNow(entry.key)}
                    onMouseEnter={() => openAfterRest(entry.key)} onMouseLeave={() => clearTimeout(hoverTimer.current)}
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
// the panel takes the page's frame (frame.js), so its edges are the page's and it never covers a side ad.
export const NavMenuPanel = ({ menu, onClose }) => {
  const router = useRouter();
  const panelRef = useRef(null);
  // What opened the panel (the bar's button or a group row's name), for Esc to hand the focus back to.
  const openerRef = useRef(null);
  // The panel exists only after a click, so the media queries are read on a mounted client.
  const full = useMediaQuery(`(min-width: 1440px) and ${TALL}`);
  const compact = useMediaQuery('(min-width: 1366px) and (min-height: 700px)');
  const form = full ? 'full' : compact ? 'compact' : 'pane';
  const pathname = router?.pathname ?? '';
  const top = usePageTop();
  // The page's own frame: a panel's edges are the page's, with or without the rail's gutter
  const frame = useFrame();

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

  const opener = () => {
    const node = openerRef.current;
    return node?.isConnected && node !== document.body ? node : document.getElementById(buttonId(menu));
  };
  const closeToOpener = () => {
    onClose();
    opener()?.focus();
  };
  // Esc, or Shift+Tab out of the panel's top, closes it with the focus back on its button; Tab past its last stop
  // closes it and goes on to whatever follows that button (the bar's next item). The panel comes after the band in
  // the markup, so the browser's own steps would land on the band, or skip the rest of the bar.
  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      closeToOpener();
      return;
    }
    if (event.key !== 'Tab') return;
    const active = document.activeElement;
    const stops = tabStops(panelRef.current);
    if (event.shiftKey && (active === panelRef.current || active === stops[0])) {
      event.preventDefault();
      closeToOpener();
    } else if (!event.shiftKey && active === stops.at(-1)) {
      event.preventDefault();
      const from = opener();
      const page = tabStops(document).filter((node) => !panelRef.current.contains(node));
      const at = page.indexOf(from);
      const next = at < 0 ? null : page[at + 1];
      onClose();
      (next ?? from)?.focus();
    }
  };
  // Tab out of the panel closes it; a click elsewhere is the ClickAwayListener's.
  const onBlur = (event) => {
    const next = event.relatedTarget;
    if (next && !event.currentTarget.contains(next) && !next.closest?.(`[${MENU_BUTTON}]`)) onClose();
  };
  const onClickAway = (event) => {
    if (!event.target?.closest?.(`[${MENU_BUTTON}]`)) onClose();
  };

  // Fixed under the bar and the band while it shows (as the phone menu), after the band in the markup: the band has
  // the bar's z-index and comes later, so a panel inside the bar would sit behind it. The frame's grid puts the panel
  // in the page's column; the wrapper lets clicks through; the panel takes them.
  return <Box sx={{
    position: 'fixed', top, left: 0, right: 0, zIndex: (theme) => theme.zIndex.drawer + 1,
    pointerEvents: 'none'
  }}>
    <Box sx={frame.sx}>
      <ClickAwayListener onClickAway={onClickAway}>
        <Box ref={panelRef} id={navMenuId(menu)} tabIndex={-1} onKeyDown={onKeyDown} onBlur={onBlur}
             sx={{
               gridArea: 'page',
               pointerEvents: 'auto', outline: 'none', color: 'text.primary',
               width: menu === 'tools' && form !== 'pane' ? 820 : '100%', maxWidth: '100%',
               p: FORMS[form]?.pad ?? 2, bgcolor: 'background.paper', border: 1, borderTop: 0, borderColor: 'divider',
               borderRadius: '0 0 8px 8px', boxShadow: 8,
               maxHeight: `calc(100vh - ${top}px - var(--nitro-ad-height, 0px))`, overflowY: 'auto'
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
