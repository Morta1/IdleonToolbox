import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Link as MuiLink, Stack } from '@mui/material';
import AppDialog from '@components/common/Overlays/AppDialog';
import { sessionQuery } from '@utility/nav-query';
import { goalTitle } from './parts/format';
import GoalEntries from './GoalEntries';

// The card view's Next up list; a row opens the same list in place. Mounted while shown: it closes itself and
// tells the caller once it has slid out, so it leaves the way it came.
const GoalEntriesDialog = ({ view, source, onClose }) => {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  return (
    <AppDialog open={open} onClose={() => setOpen(false)} onExited={onClose} size="m" title={goalTitle(view)}>
      <Stack gap={1} sx={{ pt: 0.5 }}>
        {/* The dialog body is the one scroller: a list scrolling inside a scrolling sheet fights the swipe */}
        <GoalEntries view={view} source={source} maxHeight="none"/>
        {view.route ? (
          <MuiLink component={Link} href={{ pathname: view.route, query: sessionQuery(router.query) }} variant="body2"
                   underline="hover" sx={{ alignSelf: 'flex-start' }}>
            {`Full list on the ${view.label} page`}
          </MuiLink>
        ) : null}
      </Stack>
    </AppDialog>
  );
};

export default GoalEntriesDialog;
