import { useEffect, useId, useRef, useState } from 'react';
import { Box, ClickAwayListener, Drawer, Portal, useMediaQuery } from '@mui/material';
import OverlayHeader from './OverlayHeader';
import OverlaySheet from './OverlaySheet';
import OverlayActions from './OverlayActions';
import NoticeSlot from './NoticeSlot';
import SheetContext from '@components/common/cards/SheetContext';
import { navBarHeight } from '@components/constants';

// Detail beside the page (Overlays board): from the right, 420 px by default, on the card surface with a
// divider edge; a bottom sheet on a phone. It starts under the app bar, whose search and sign-in sit at
// its right end, and covers the band under it (the band is drawer + 1).
const PAPER_SX = (theme) => ({
  top: navBarHeight,
  height: `calc(100% - ${navBarHeight}px)`,
  maxWidth: '100vw',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: (theme.vars || theme).palette.background.paper,
  borderLeft: `1px solid ${(theme.vars || theme).palette.divider}`,
  boxShadow: (theme.vars || theme).palette.shadow.floating
});

// Open drawers, newest last: a drawer opened from inside another (a breakdown in a stamp's details) takes Esc first.
const openDrawers = [];

// aside: beside the title, before the close (a breakdown's total). controls: see OverlayHeader. toolbar: rows that stay put under
// the header while the body scrolls. phoneActions: the phone sheet's actions (a picker's Done); the desktop
// drawer applies each change as it is made and closes from its x. width: for a page whose grid stays in use beside it.
// keepOpenOn: a selector for what a click may land on without closing it (the tiles that swap what it shows). focusBack: for
// such a page, where Esc, the close button and a sheet's end hand the focus, in place of what first opened it.
// stayOpen: no click on the page closes it, only its x, Esc or what opened it (the characters picker, kept open while
// players tick and compare).
// The types are for Breakdown.tsx, which the build type-checks: a
// .jsx prop with no type reads as required, and one defaulted to null reads as null only.
/**
 * @param {{ open: boolean, onClose: () => void, title: import('react').ReactNode,
 *   subtitle?: import('react').ReactNode, icon?: import('react').ReactNode, aside?: import('react').ReactNode,
 *   controls?: import('react').ReactNode, toolbar?: import('react').ReactNode, onExited?: () => void,
 *   children?: import('react').ReactNode, phoneActions?: { label: string, main?: boolean, onClick?: () => void }[],
 *   width?: number, keepOpenOn?: string, focusBack?: () => HTMLElement | null, stayOpen?: boolean }} props
 */
const AppDrawer = ({ open, onClose, title, subtitle = null, icon = null, aside = null, controls = null, toolbar = null,
                     onExited = undefined, phoneActions = undefined, width = 420, keepOpenOn = undefined, focusBack = undefined,
                     stayOpen = false, children }) => {
  const titleId = useId();
  const isPhone = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  // The desktop drawer is mounted from its opening to the end of its exit only: a page holds dozens of
  // closed breakdowns.
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);
  const body = useRef(null);
  const opener = useRef(null);
  const closeToOpener = () => {
    onClose();
    (focusBack?.() ?? opener.current)?.focus?.({ preventScroll: true });
  };

  // Not modal on the desktop, so the drawer hears Esc from anywhere on the page (and moves the focus in
  // itself, below). Esc and the close button hand the focus back to the trigger; a click on the page leaves
  // it where that click put it. A menu inside the drawer stops its own Esc before it gets here.
  useEffect(() => {
    if (!open || isPhone) return undefined;
    openDrawers.push(titleId);
    return () => {
      openDrawers.splice(openDrawers.indexOf(titleId), 1);
    };
  }, [open, isPhone]);
  useEffect(() => {
    if (!open || isPhone) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape' && openDrawers.at(-1) === titleId) closeToOpener();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, isPhone, focusBack]);

  const header = <OverlayHeader titleId={titleId} title={title} subtitle={subtitle} icon={icon} aside={aside} controls={controls}
                               onClose={isPhone ? onClose : closeToOpener}/>;

  if (isPhone) {
    // Edge to edge and 85% high: the sheet stands for a drawer that fills its side of the page.
    return <SheetContext value={null}>
      <OverlaySheet open={open} onClose={onClose} labelledBy={titleId} header={header} toolbar={toolbar}
                    actions={phoneActions?.length ? <OverlayActions actions={phoneActions} onClose={onClose} sheet/> : null}
                    onExited={() => {
                      focusBack?.()?.focus?.();
                      onExited?.();
                    }} gutters={false} fill>
        {children}
      </OverlaySheet>
    </SheetContext>;
  }
  if (!mounted) return null;
  // Beside the page, not over it (Decision 7: the page stays readable beside it): no backdrop, no scroll
  // lock, no focus trap, and the page keeps the pointer, so its tooltips show and another breakdown's
  // trigger opens that breakdown in its place. A click anywhere else closes it; a closing drawer drops
  // under the one opening.
  return <Portal>
    <SheetContext value={null}>
      <ClickAwayListener onClickAway={(event) => {
        if (open && !stayOpen && !(keepOpenOn && event.target.closest?.(keepOpenOn))) onClose();
      }}>
        <Drawer variant="persistent" anchor="right" open={open}
                SlideProps={{
                  appear: true,
                  // The drawer's content exists from here on, and the focus is still on what opened it.
                  onEnter: () => {
                    opener.current = document.activeElement;
                    body.current?.focus({ preventScroll: true });
                  },
                  onExited: () => {
                    setMounted(false);
                    onExited?.();
                  }
                }}
                PaperProps={{
                  role: 'dialog', 'aria-labelledby': titleId,
                  sx: [PAPER_SX, { width, zIndex: (theme) => theme.zIndex.drawer + (open ? 2 : 1) }]
                }}>
          <Box ref={body} tabIndex={-1} sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, outline: 'none' }}>
            {header}
            {toolbar ? <Box sx={{ flexShrink: 0 }}>{toolbar}</Box> : null}
            <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>{children}</Box>
          </Box>
          <NoticeSlot open={open}/>
        </Drawer>
      </ClickAwayListener>
    </SheetContext>
  </Portal>;
};

export default AppDrawer;
