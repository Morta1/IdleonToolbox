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

// A body with no actions under it ends 72 px clear (Info board): the ad network's button sits over a sheet's
// last rows, and the consent banner, until it is answered, adds its own height (ConsentBannerHeight).
const BOTTOM_ROOM = 'calc(72px + env(safe-area-inset-bottom) + var(--consent-banner-height, 0px))';

// gutters: a dialog's body sits 24 px in; a drawer's rows run edge to edge, as on desktop.
// fill: a drawer's sheet keeps 85% of the window, so a search that narrows its list never shrinks it.
// toolbar: rows that stay put under the header while the body scrolls.
// keepOnSwipe: something was typed, so a swipe down springs back instead of closing (no swipe reaches the
// threshold or the speed that would close it).
const KEEP_ON_SWIPE = { hysteresis: 1, minFlingVelocity: Infinity };
const OverlaySheet = ({ open, onClose, id, labelledBy, header, toolbar = null, actions = null, onExited,
                        gutters = true, fill = false, keepOnSwipe = false, children }) => (
  <SwipeableDrawer anchor="bottom" open={open} onClose={onClose} onOpen={() => {}} disableSwipeToOpen
                   {...(keepOnSwipe ? KEEP_ON_SWIPE : {})}
                   // A closed sheet stays mounted for edge swipes otherwise; nothing here swipes open.
                   ModalProps={{ keepMounted: false }}
                   SlideProps={{ onExited }}
                   sx={{ zIndex: (theme) => theme.zIndex.modal }}
                   PaperProps={{
                     id, role: 'dialog', 'aria-modal': true, 'aria-labelledby': labelledBy,
                     sx: fill ? { ...SHEET_PAPER_SX, height: '85%' } : SHEET_PAPER_SX
                   }}>
    <Box aria-hidden sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: 'divider', mx: 'auto', mt: 1, flexShrink: 0 }}/>
    {header}
    {toolbar ? <Box sx={{ flexShrink: 0 }}>{toolbar}</Box> : null}
    <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: gutters ? 3 : 0, pb: actions ? 0 : BOTTOM_ROOM }}>
      {children}
    </Box>
    {actions}
    <NoticeSlot open={open}/>
  </SwipeableDrawer>
);

export default OverlaySheet;
