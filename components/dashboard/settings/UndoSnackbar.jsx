import React from 'react';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';

// MUI's default snackbar is light on the dark theme, where the primary Undo is too faint to read.
// A dark surface keeps it legible, and 10s gives a phone user time to reach it.
const UndoSnackbar = ({ label, onUndo, onClose, autoFocus = false }) => <Snackbar open autoHideDuration={10000} message={label}
                                                             ContentProps={{ role: 'status', sx: { bgcolor: 'grey.800', color: 'common.white' } }}
                                                             onClose={(e, reason) => {
                                                               if (reason !== 'clickaway') onClose();
                                                             }}
                                                             action={<Button color="primary" size="small" autoFocus={autoFocus} sx={{ minHeight: { xs: 44, sm: 'auto' } }}
                                                                             onClick={onUndo}>Undo</Button>}/>;

export default UndoSnackbar;
