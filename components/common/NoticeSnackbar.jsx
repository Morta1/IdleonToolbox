import React, { createContext, useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import Box from '@mui/material/Box';
import Snackbar from '@mui/material/Snackbar';

// Takes a snackbar out of its fixed corner so it flows inside a NoticeStack
const STACKED_SX = { position: 'static', transform: 'none', left: 'auto', right: 'auto', bottom: 'auto', pointerEvents: 'auto' };

// MUI's default snackbar is light on the dark theme, where a primary action is too faint to read.
// A dark surface keeps it legible, and 10s gives a phone user time to reach the action.
const NoticeSnackbar = ({ open = true, label, action, autoHideDuration = 10000, onClose, stacked = false }) => (
  <Snackbar open={open} autoHideDuration={autoHideDuration} message={label} action={action}
            sx={stacked ? STACKED_SX : undefined}
            ContentProps={{ role: 'status', sx: { bgcolor: 'grey.800', color: 'common.white' } }}
            onClose={(e, reason) => {
              if (reason !== 'clickaway') onClose();
            }}/>
);

const STACK_SX = {
  position: 'fixed',
  zIndex: 'snackbar',
  bottom: { xs: 8, sm: 24 },
  left: { xs: 8, sm: '50%' },
  right: { xs: 8, sm: 'auto' },
  transform: { sm: 'translateX(-50%)' },
  display: 'flex',
  flexDirection: 'column',
  // A phone gives every snackbar the full width, as MUI does for a single one
  alignItems: { xs: 'stretch', sm: 'center' },
  gap: 1,
  pointerEvents: 'none'
};

const NoticeStackContext = createContext(null);

// One notice column for the whole app: the header's goal notices and a page's own notices land in it together
// instead of two fixed columns drawn over each other
export const NoticeStackProvider = ({ children }) => {
  const [host, setHost] = useState(null);
  return (
    <NoticeStackContext.Provider value={host}>
      {children}
      <Box ref={setHost} sx={STACK_SX} data-notice-stack=""/>
    </NoticeStackContext.Provider>
  );
};

// Snackbars at one corner overlap, so the ones that can show at once (rendered with `stacked`) sit in one column.
// Outside a NoticeStackProvider (and before its column mounts) the stack draws its own column.
export const NoticeStack = ({ children }) => {
  const host = useContext(NoticeStackContext);
  if (host) return createPortal(children, host);
  return <Box sx={STACK_SX}>{children}</Box>;
};

export default NoticeSnackbar;
