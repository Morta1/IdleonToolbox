import React from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';

const DefaultsNote = ({ count, onReview, onDismiss }) => <Alert
  severity="info" sx={{ mb: 2 }}
  action={<>
    <Button color="inherit" size="small" onClick={onReview}>Review</Button>
    <Button color="inherit" size="small" onClick={onDismiss}>Dismiss</Button>
  </>}>
  {count} of your alert settings differ from the defaults.
</Alert>;

export default DefaultsNote;
