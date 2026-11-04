import { useId } from 'react';
import { Dialog, DialogContent, useMediaQuery } from '@mui/material';
import OverlayHeader from './OverlayHeader';
import OverlayActions from './OverlayActions';
import OverlaySheet from './OverlaySheet';
import NoticeSlot from './NoticeSlot';

// Picked by content, not per page: S a confirm or one field, M forms, pickers and sign in, L a list
// or table to review.
const WIDTH = { s: 400, m: 560, l: 800 };

// A full-screen phone form drops the floating surface's corners and edge (phase 1's floating(theme)).
const FULL_PAPER_SX = { borderRadius: 0, border: 0 };
// A full-screen form's gutter and title room, the Sign in board's phone: 16 px, the title near the top.
const FULL_HEADER_SX = { px: 2, pt: 1 };
// A pinned dialog starts a tenth of the way down and keeps the centred dialog's 85% at most.
const PIN_TOP_SX = { mt: '10vh', maxHeight: 'calc(90vh - 16px)' };

// A dialog on desktop, and on a phone one of three forms (Overlays board). phone 'sheet' (the default)
// rises from the bottom, at most 85% high; 'tall' is that sheet held at 85%, for a body with a list that
// opens below its field; 'full' fills the screen, for a flow that needs the room and keeps its action in
// reach (Sign in board, "On a phone"). Title and close are built in, the body
// scrolls under them. Focus stays inside, Esc closes and focus goes back to the opener (MUI's Modal).
// dirty: something was typed, so a click outside or a swipe down keeps it. id: the paper's, for an opener's
// aria-controls. onExited: once it has finished closing, for a dialog opened from a menu row, whose
// opener is gone, to hand focus back to the menu's trigger. pinTop (desktop): the dialog's top stays put
// while its content changes height (a sign-in step, an error appearing), instead of re-centering.
// headerSx: the room around the title, for a dialog whose board draws its own.
const AppDialog = ({
  open, onClose, onExited, id, title, subtitle, icon, size = 'm', phone = 'sheet', actions, dirty = false, pinTop = false,
  headerSx, children
}) => {
  const titleId = useId();
  // false at build and on the first client render; nothing opens before the player clicks.
  const isPhone = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const handleClose = (event, reason) => {
    // A sheet's swipe down closes with no reason: while dirty it keeps the text, as a click outside does (the
    // sheet also springs back from the swipe, keepOnSwipe below).
    if (dirty && (reason === 'backdropClick' || !reason)) return;
    onClose();
  };
  const full = isPhone && phone === 'full';
  const header = <OverlayHeader titleId={titleId} title={title} subtitle={subtitle} icon={icon} onClose={onClose}
                                sx={{ ...headerSx, ...(full ? FULL_HEADER_SX : {}) }}/>;
  const footer = actions?.length ? <OverlayActions actions={actions} onClose={onClose} sheet={isPhone}/> : null;

  if (isPhone && phone !== 'full') {
    return <OverlaySheet open={open} onClose={handleClose} onExited={onExited} id={id} labelledBy={titleId} header={header} actions={footer}
                         keepOnSwipe={dirty} fill={phone === 'tall'}>
      {children}
    </OverlaySheet>;
  }
  const pinned = pinTop && !full;
  return <Dialog open={open} onClose={handleClose} aria-labelledby={titleId} maxWidth={false} fullScreen={full}
                 TransitionProps={{ onExited }}
                 sx={pinned ? { '& .MuiDialog-container': { alignItems: 'flex-start' } } : undefined}
                 PaperProps={{
                   id,
                   sx: full ? FULL_PAPER_SX : {
                     width: WIDTH[size], maxWidth: 'calc(100% - 32px)', maxHeight: '85%', m: 2, ...(pinned ? PIN_TOP_SX : {})
                   }
                 }}>
    {header}
    {/* A full-screen body runs to the screen's edge and owns its end: a sticky action (FlowAction) or its
        last block clears the safe area and the consent banner, so no padding of the dialog's own sits under it */}
    <DialogContent sx={{ pt: 0, ...(full ? { display: 'flex', flexDirection: 'column', px: 2, pb: 0 } : {}) }}>{children}</DialogContent>
    {footer}
    <NoticeSlot open={open}/>
  </Dialog>;
};

export default AppDialog;
