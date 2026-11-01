import { Box, SwipeableDrawer } from '@mui/material';
import NoticeSlot from './NoticeSlot';

// The phone form of a dialog or drawer: from the bottom, at most 85% high, swipe down or the close
// button to leave, actions in reach. It sits at the dialog layer, above the anchor ad (forced to
// 1099 in NitroAdUnits), and never touches the ad's node.
const SHEET_PAPER_SX = {
  maxHeight: '85%',
  display: 'flex',
  flexDirection: 'column',
  borderTopLeftRadius: 8,
  borderTopRightRadius: 8,
  bgcolor: 'background.paper',
  borderTop: 1,
  borderColor: 'divider'
};

const OverlaySheet = ({ open, onClose, labelledBy, header, actions, onExited, children }) => (
  <SwipeableDrawer anchor="bottom" open={open} onClose={onClose} onOpen={() => {}} disableSwipeToOpen
                   // A closed sheet stays mounted for edge swipes otherwise; nothing here swipes open.
                   ModalProps={{ keepMounted: false }}
                   SlideProps={{ onExited }}
                   sx={{ zIndex: (theme) => theme.zIndex.modal }}
                   PaperProps={{ role: 'dialog', 'aria-modal': true, 'aria-labelledby': labelledBy, sx: SHEET_PAPER_SX }}>
    <Box aria-hidden sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: 'divider', mx: 'auto', mt: 1, flexShrink: 0 }}/>
    {header}
    <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: 3, pb: actions ? 0 : 'calc(16px + env(safe-area-inset-bottom))' }}>
      {children}
    </Box>
    {actions}
    <NoticeSlot open={open}/>
  </SwipeableDrawer>
);

export default OverlaySheet;
