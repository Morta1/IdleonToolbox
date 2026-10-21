import React from 'react';
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

// Snackbars at one corner overlap, so the ones a page can show at once (rendered with `stacked`) sit in one column
export const NoticeStack = ({ children }) => (
  <Box sx={{
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
  }}>
    {children}
  </Box>
);

export default NoticeSnackbar;
