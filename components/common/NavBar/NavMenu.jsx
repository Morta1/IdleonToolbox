import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { Box, ButtonBase, ClickAwayListener, ListItemButton, ListItemText, Typography, useMediaQuery } from '@mui/material';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { groupOf, MENUS, topNavLabel } from '@utility/navMenu';
import { prefix } from '@utility/helpers';
import { sessionQuery } from '@utility/nav-query';
import { trackEvent, trackMenuClose, trackMenuLink, trackMenuOpen } from '@utility/analytics';
import usePageTop from '@hooks/usePageTop';
import useFrame from './useFrame';
import { capPageWidth, OUTER_PANEL_WIDTH, TALL } from './frame';

export const navMenuId = (menu) => `nav-menu-${menu}`;
const buttonId = (menu) => `nav-menu-${menu}-button`;
// The buttons that open a menu (the bar's, a group row's name): a click outside the panel that lands on one swaps or
// toggles the panel instead of closing it first.
export const MENU_BUTTON = 'data-nav-menu-button';

// The controls Tab stops on, in the markup's order.
const TAB_STOPS = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';
const tabStops = (root) => [...(root?.querySelectorAll(TAB_STOPS) ?? [])].filter((node) => node.getClientRects().length);

// While a panel is open, a mouse resting this long on another menu's bar item swaps to it, so a wrong guess costs one
// move: long enough that crossing the bar swaps nothing.
const REST_SWAP_MS = 120;
// A click this soon after a rest swapped a panel in was already on its way to open it, so it doesn't close it.
const SWAP_CLICK_GRACE_MS = 400;

// The bar's open menu (a key of MENUS or null), and the button that opened it (null: the bar's own button for it).
export const useBarMenu = () => {
  const [openMenu, setOpenMenu] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const restTimer = useRef(null);
  const swappedAt = useRef(0);
  useEffect(() => () => clearTimeout(restTimer.current), []);
  useEffect(() => {
    if (!openMenu) return undefined;
    trackMenuOpen(openMenu);
    return () => trackMenuClose(openMenu);
  }, [openMenu]);
  const endRest = () => clearTimeout(restTimer.current);
  const toggleMenu = (menu, from = null) => {
    endRest();
    if (menu !== openMenu) {
      setMenuAnchor(from);
      setOpenMenu(menu);
    } else if (Date.now() - swappedAt.current >= SWAP_CLICK_GRACE_MS) setOpenMenu(null);
  };
  const restOn = (menu) => {
    endRest();
    if (!openMenu || menu === openMenu) return;
    restTimer.current = setTimeout(() => {
      swappedAt.current = Date.now();
      setMenuAnchor(null);
      setOpenMenu((current) => (current ? menu : current));
    }, REST_SWAP_MS);
  };
  return { openMenu, menuAnchor, setOpenMenu, toggleMenu, restOn, endRest };
};

// The bar item for a menu (Decision 11): a click, a tap or Enter opens its panel; no opening on hover, only the swap
// above, for a mouse: a tap's compatibility events must not count as a rest.
export const NavMenuButton = ({ menu, open, selected, onToggle, onRest, onRestEnd }) => (
  <ListItemButton id={buttonId(menu)} {...{ [MENU_BUTTON]: '' }} data-cy={`nav-item-${menu}`} data-tour={`nav-${menu}`}
                  selected={selected} aria-expanded={open} aria-controls={open ? navMenuId(menu) : undefined}
                  onClick={(event) => onToggle(menu, event.currentTarget)} onPointerLeave={onRestEnd}
                  onPointerEnter={(event) => {
                    if (event.pointerType === 'mouse') onRest(menu);
                  }}
                  dense size="medium" sx={[{ borderRadius: 2, p: '0 8px' }, open ? { bgcolor: 'action.hover' } : {}]}>
    <ListItemText component="span" disableTypography sx={{ fontWeight: 600, fontSize: 16 }}>
      {topNavLabel(menu)}
    </ListItemText>
    <IconChevronDown size={16} aria-hidden
                     style={{ marginLeft: 4, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}/>
  </ListItemButton>
);

// The panel's forms (Decision 3): full where a tall window gives the grid room, compact where it only just fits.
// Worlds' seven columns are the only grid that outgrows a window: below 1280 wide, or 600 tall (its 383 px under the bar
// and band, over a 90 px anchor ad), they take two panes, the groups and then the open group's pages. Rows and heads per form.
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
  // Columns as wide as their longest name, the rest shared out. Below 1366 the gaps tighten: with a 17 px scrollbar a 1280
  // window holds Worlds' names on one line and a 1200 window Account's; narrower still wraps the longest, never cuts them
  return <Box sx={{
    display: 'grid', gridTemplateColumns: `repeat(${groups.length}, auto)`, columnGap: 2, '@media (max-width: 1365.95px)': { columnGap: 1 }
  }}>
    {groups.map((group) => <GroupColumn key={group.key} group={group} form={form} pathname={pathname} nav={nav}/>)}
  </Box>;
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
  const pagesId = `${navMenuId(menu)}-pages`;
  return <Box sx={{
    display: 'grid', gridTemplateColumns: '240px minmax(0, 1fr)', columnGap: 3, gridTemplateRows: `repeat(${groups.length}, 32px)`
  }}>
    {groups.map((group, index) => {
      const open = group.key === openKey;
      return <React.Fragment key={group.key}>
        <ButtonBase aria-expanded={open} aria-controls={open ? pagesId : undefined}
                    onClick={() => openNow(group.key)} onFocus={() => openNow(group.key)}
                    onMouseEnter={() => openAfterRest(group.key)} onMouseLeave={() => clearTimeout(hoverTimer.current)}
                    sx={{
                      gridColumn: 1, gridRow: index + 1, justifyContent: 'flex-start', gap: 1, px: 1, borderRadius: 1,
                      typography: 'body2', color: open ? 'text.primary' : 'text.secondary',
                      bgcolor: open ? 'action.selected' : 'transparent'
                    }}>
          <Box component="img" src={`${prefix}${group.icon}.png`} alt="" style={group.style}
               sx={{ width: 22, height: 22, objectFit: 'contain', flexShrink: 0 }}/>
          <Box component="span" sx={{ flex: 1, textAlign: 'left' }}>{group.label}</Box>
          <IconChevronRight size={16} aria-hidden/>
        </ButtonBase>
        {open ? <Box component="ul" id={pagesId} aria-label={group.label} sx={{
          gridColumn: 2, gridRow: '1 / -1', alignSelf: 'start', m: 0, p: 0,
          display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', columnGap: 2
        }}>
          {group.pages.map((page) => <PageLink key={page.url} page={page} current={page.url === pathname} height={30}
                                               nav={nav}/>)}
        </Box> : null}
      </React.Fragment>;
    })}
  </Box>;
};

// A grid that ends where its columns do, centred under its button. Worlds and the panes fill the page's column.
const GRID_WIDTH = { account: 'fit-content', tools: 820 };

// A menu's pages under the bar (Layout boards). Not modal: another bar item swaps it, and a click outside
// or Esc closes it, focus back on its button (3d and 3e's rule for desktop panels). No dim and no scroll lock:
// the panel stays inside the page's frame (frame.js), so it never covers a side ad.
// anchor: the button that opened it (a group row's name), or null for the bar's own button.
export const NavMenuPanel = ({ menu, anchor = null, onClose }) => {
  const router = useRouter();
  const cellRef = useRef(null);
  const panelRef = useRef(null);
  // What opened the panel (the bar's button or a group row's name), for Esc to hand the focus back to.
  const openerRef = useRef(null);
  // The panel exists only after a click, so the media queries are read on a mounted client.
  const full = useMediaQuery(`(min-width: 1440px) and ${TALL}`);
  const worldsFit = useMediaQuery('(min-width: 1280px) and (min-height: 600px)');
  const form = menu === 'worlds' && !worldsFit ? 'pane' : full ? 'full' : 'compact';
  const pathname = router?.pathname ?? '';
  const top = usePageTop();
  // The page's own frame: a panel's edges are the page's, with or without the rail's gutter
  const frame = useFrame();

  useEffect(() => {
    openerRef.current = document.activeElement;
    panelRef.current?.focus();
  }, [menu]);

  // A panel narrower than the page's column centres on the button that opened it, as far as the column allows: at the
  // column's left edge, Account's first group sat about 600 px from its button and Tools opened under Dashboard. Set
  // before the first paint, and again when the column or the panel changes size or the window moves the bar.
  const [shift, setShift] = useState(0);
  useLayoutEffect(() => {
    const place = () => {
      const from = anchor?.isConnected ? anchor : document.getElementById(buttonId(menu));
      const cell = cellRef.current;
      const panel = panelRef.current;
      if (!from || !cell || !panel) return;
      const column = cell.getBoundingClientRect();
      const button = from.getBoundingClientRect();
      const width = panel.offsetWidth;
      const centred = button.left + button.width / 2 - width / 2 - column.left;
      setShift(Math.round(Math.max(0, Math.min(column.width - width, centred))));
    };
    place();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(place) : null;
    observer?.observe(cellRef.current);
    observer?.observe(panelRef.current);
    window.addEventListener('resize', place);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', place);
    };
  }, [menu, anchor]);

  const nav = {
    query: sessionQuery(router?.query),
    onNavigate: (url) => {
      trackEvent('handle_nav', { event_category: url, event_label: 'engagement', value: 1, source: 'menu' });
      trackMenuLink();
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
  // the bar's z-index and comes later, so a panel inside the bar would sit behind it. The frame's grid gives the cell
  // the page's column, and a page that caps its width (the guild pages) caps the cell the same way, so the panel never
  // passes the page's edges; the wrapper and the cell let clicks through; the panel takes them.
  return <Box sx={{
    position: 'fixed', top, left: 0, right: 0, zIndex: (theme) => theme.zIndex.drawer + 1,
    pointerEvents: 'none'
  }}>
    <Box sx={[frame.sx, frame.inner ? null : capPageWidth(OUTER_PANEL_WIDTH)]}>
      <Box ref={cellRef} sx={[{ gridArea: 'page', minWidth: 0 }, frame.cap ? capPageWidth(frame.cap) : null]}>
        <ClickAwayListener onClickAway={onClickAway}>
          <Box ref={panelRef} id={navMenuId(menu)} tabIndex={-1} onKeyDown={onKeyDown} onBlur={onBlur}
               style={shift ? { transform: `translateX(${shift}px)` } : undefined}
               sx={{
                 pointerEvents: 'auto', outline: 'none', color: 'text.primary',
                 width: (form !== 'pane' && GRID_WIDTH[menu]) || '100%', maxWidth: '100%',
                 p: FORMS[form]?.pad ?? 2, bgcolor: 'background.paper', border: 1, borderTop: 0, borderColor: 'divider',
                 borderRadius: '0 0 8px 8px', boxShadow: (theme) => (theme.vars || theme).palette.shadow.floating,
                 maxHeight: `calc(100vh - ${top}px - var(--nitro-ad-height, 0px))`, overflowY: 'auto'
               }}>
            <nav aria-label={`${topNavLabel(menu)} pages`}>
              {form === 'pane'
                ? <PaneForm menu={menu} pathname={pathname} nav={nav}/>
                : <GridForm menu={menu} form={form} pathname={pathname} nav={nav}/>}
            </nav>
          </Box>
        </ClickAwayListener>
      </Box>
    </Box>
  </Box>;
};
