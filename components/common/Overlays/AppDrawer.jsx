import { useId } from 'react';
import { Box, Drawer, useMediaQuery } from '@mui/material';
import OverlayHeader from './OverlayHeader';
import OverlaySheet from './OverlaySheet';
import NoticeSlot from './NoticeSlot';

// Detail beside the page (Overlays board): from the right, 420 px, on the card surface with a
// divider edge; a bottom sheet on a phone. Above the app bar and the band (both drawer + 1).
const PAPER_SX = (theme) => ({
  width: 420,
  maxWidth: '100vw',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: (theme.vars || theme).palette.background.paper,
  borderLeft: `1px solid ${(theme.vars || theme).palette.divider}`,
  boxShadow: (theme.vars || theme).shadows[8]
});

const AppDrawer = ({ open, onClose, title, subtitle, icon, onExited, children }) => {
  const titleId = useId();
  const isPhone = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const header = <OverlayHeader titleId={titleId} title={title} subtitle={subtitle} icon={icon} onClose={onClose}/>;

  if (isPhone) {
    return <OverlaySheet open={open} onClose={onClose} labelledBy={titleId} header={header} onExited={onExited}>
      {children}
    </OverlaySheet>;
  }
  return <Drawer anchor="right" open={open} onClose={onClose} SlideProps={{ onExited }}
                 // The page stays readable beside it: no dimming; a click outside still closes (Decision 3).
                 slotProps={{ backdrop: { invisible: true } }}
                 sx={{ zIndex: (theme) => theme.zIndex.drawer + 2 }}
                 PaperProps={{ role: 'dialog', 'aria-modal': true, 'aria-labelledby': titleId, sx: PAPER_SX }}>
    {header}
    <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>{children}</Box>
    <NoticeSlot open={open}/>
  </Drawer>;
};

export default AppDrawer;
