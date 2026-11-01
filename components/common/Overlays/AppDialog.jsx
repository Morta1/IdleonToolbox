import { useId } from 'react';
import { Dialog, DialogContent, useMediaQuery } from '@mui/material';
import OverlayHeader from './OverlayHeader';
import OverlayActions from './OverlayActions';
import OverlaySheet from './OverlaySheet';
import NoticeSlot from './NoticeSlot';

// Picked by content, not per page: S a confirm or one field, M forms, pickers and sign in, L a list
// or table to review.
const WIDTH = { s: 400, m: 560, l: 800 };

// A dialog on desktop, a bottom sheet on a phone (Overlays board). Title and close are built in, the
// body scrolls under them, at most 85% of the window high. Focus stays inside, Esc closes and focus
// goes back to the opener (MUI's Modal). dirty: something was typed, so a click outside keeps it.
// id: the paper's, for an opener's aria-controls.
const AppDialog = ({ open, onClose, id, title, subtitle, icon, size = 'm', actions, dirty = false, children }) => {
  const titleId = useId();
  // false at build and on the first client render; nothing opens before the player clicks.
  const isPhone = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const handleClose = (event, reason) => {
    if (reason === 'backdropClick' && dirty) return;
    onClose();
  };
  const header = <OverlayHeader titleId={titleId} title={title} subtitle={subtitle} icon={icon} onClose={onClose}/>;
  const footer = actions?.length ? <OverlayActions actions={actions} onClose={onClose} sheet={isPhone}/> : null;

  if (isPhone) {
    return <OverlaySheet open={open} onClose={handleClose} id={id} labelledBy={titleId} header={header} actions={footer}>
      {children}
    </OverlaySheet>;
  }
  return <Dialog open={open} onClose={handleClose} aria-labelledby={titleId} maxWidth={false}
                 PaperProps={{ id, sx: { width: WIDTH[size], maxWidth: 'calc(100% - 32px)', maxHeight: '85%', m: 2 } }}>
    {header}
    <DialogContent sx={{ pt: 0 }}>{children}</DialogContent>
    {footer}
    <NoticeSlot open={open}/>
  </Dialog>;
};

export default AppDialog;
