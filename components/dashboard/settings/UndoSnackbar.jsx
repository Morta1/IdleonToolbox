import React from 'react';
import Button from '@mui/material/Button';
import NoticeSnackbar from '@components/common/NoticeSnackbar';

const UndoSnackbar = ({ label, onUndo, onClose, stacked }) => (
  <NoticeSnackbar label={label} onClose={onClose} stacked={stacked}
                  action={<Button color="primary" size="small" sx={{ minHeight: { xs: 44, sm: 'auto' } }}
                                  onClick={onUndo}>Undo</Button>}/>
);

export default UndoSnackbar;
