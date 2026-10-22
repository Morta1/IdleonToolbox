import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Link as MuiLink, Stack } from '@mui/material';
import { sessionQuery } from '@utility/nav-query';
import { goalTitle } from './parts/format';
import GoalEntries from './GoalEntries';

// The card view's Next up list; a row opens the same list in place
const GoalEntriesDialog = ({ view, source, onClose }) => {
  const router = useRouter();
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{goalTitle(view)}</DialogTitle>
      <DialogContent>
        <Stack gap={1} sx={{ pt: 0.5 }}>
          <GoalEntries view={view} source={source} maxHeight="50vh"/>
          {view.route ? (
            <MuiLink component={Link} href={{ pathname: view.route, query: sessionQuery(router.query) }} variant="body2"
                     underline="hover" sx={{ alignSelf: 'flex-start' }}>
              {`Full list on the ${view.label} page`}
            </MuiLink>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default GoalEntriesDialog;
