import React, { useState } from 'react';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import LoginDialog from './NavBar/LoginDialog';

/**
 * Shown on data-dependent pages when `state.emptyAccount` is set - i.e. a logged-out visitor is
 * looking at the full game catalog with every value at zero rather than their own save.
 *
 * Deliberately renders alongside the page content, not instead of it (unlike `MissingData`,
 * which replaces the page entirely for locked features) - the zeroed catalog rows are the whole
 * point of showing this page to a logged-out visitor at all.
 */
const EmptyAccountBanner = () => {
  const [open, setOpen] = useState(false);

  return <>
    <Alert severity="info" sx={{ mb: 2 }}>
      {'You\'re not signed in, so everything below is shown at zero. '}
      <Link component="button" type="button" onClick={() => setOpen(true)}>
        Sign in
      </Link>
      {' to see your own Legends of Idleon progress.'}
    </Alert>
    <LoginDialog open={open} setOpen={setOpen} onClose={() => setOpen(false)}/>
  </>;
};

export default EmptyAccountBanner;
