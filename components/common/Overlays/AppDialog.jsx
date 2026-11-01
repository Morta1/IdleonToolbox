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

// A dialog on desktop, and on a phone one of two forms (Overlays board). phone 'sheet' (the default)
// rises from the bottom, at most 85% high; 'full' fills the screen, for a flow that needs the room and
// keeps its action in reach (Sign in board, "On a phone"). Title and close are built in, the body
// scrolls under them. Focus stays inside, Esc closes and focus goes back to the opener (MUI's Modal).
// dirty: something was typed, so a click outside keeps it. id: the paper's, for an opener's
// aria-controls. onExited: once it has finished closing, for a dialog opened from a menu row, whose
// opener is gone, to hand focus back to the menu's trigger.
const AppDialog = ({
  open, onClose, onExited, id, title, subtitle, icon, size = 'm', phone = 'sheet', actions, dirty = false, children
}) => {
  const titleId = useId();
  // false at build and on the first client render; nothing opens before the player clicks.
  const isPhone = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const handleClose = (event, reason) => {
    if (reason === 'backdropClick' && dirty) return;
    onClose();
  };
  const header = <OverlayHeader titleId={titleId} title={title} subtitle={subtitle} icon={icon} onClose={onClose}/>;
  const footer = actions?.length ? <OverlayActions actions={actions} onClose={onClose} sheet={isPhone}/> : null;

  if (isPhone && phone === 'sheet') {
    return <OverlaySheet open={open} onClose={handleClose} onExited={onExited} id={id} labelledBy={titleId} header={header} actions={footer}>
      {children}
    </OverlaySheet>;
  }
  const full = isPhone && phone === 'full';
  return <Dialog open={open} onClose={handleClose} aria-labelledby={titleId} maxWidth={false} fullScreen={full}
                 TransitionProps={{ onExited }}
                 PaperProps={{ id, sx: full ? FULL_PAPER_SX : { width: WIDTH[size], maxWidth: 'calc(100% - 32px)', maxHeight: '85%', m: 2 } }}>
    {header}
    <DialogContent sx={{ pt: 0, ...(full ? { display: 'flex', flexDirection: 'column' } : {}) }}>{children}</DialogContent>
    {footer}
    <NoticeSlot open={open}/>
  </Dialog>;
};

export default AppDialog;
