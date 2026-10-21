import React from 'react';
import Snackbar from '@mui/material/Snackbar';

// MUI's default snackbar is light on the dark theme, where a primary action is too faint to read.
// A dark surface keeps it legible, and 10s gives a phone user time to reach the action.
const NoticeSnackbar = ({ open = true, label, action, autoHideDuration = 10000, onClose }) => (
  <Snackbar open={open} autoHideDuration={autoHideDuration} message={label} action={action}
            ContentProps={{ role: 'status', sx: { bgcolor: 'grey.800', color: 'common.white' } }}
            onClose={(e, reason) => {
              if (reason !== 'clickaway') onClose();
            }}/>
);

export default NoticeSnackbar;
