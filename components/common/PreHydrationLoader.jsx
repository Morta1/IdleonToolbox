import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import SimpleLoader from './SimpleLoader';

// Every exported page ships an empty body: nothing below <WaitForRouter> in _app renders during
// the export, so a visitor sees the bare background until React hydrates - measured at ~0.7s on a
// desktop and ~10s on a throttled phone.
//
// This fills that window with the same <SimpleLoader> DataLoadingWrapper shows once the gate is
// open, so the handoff is not a visual change: whichever of the two is on screen, it is the same
// markup. Renders identically on the server and on the first client render, then unmounts, which
// is the pattern already proven by CrawlLinks.

const PreHydrationLoader = () => {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  if (hydrated) return null;

  // Centred in the viewport, not at the top: there is no NavBar above it yet, so SimpleLoader's
  // own 300px box would sit against the top edge of an otherwise empty screen. dvh rather than vh
  // so mobile browser chrome doesn't push it below centre.
  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <SimpleLoader message="Loading..."/>
    </Box>
  );
};

export default PreHydrationLoader;
