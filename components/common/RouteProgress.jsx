import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import LinearProgress from '@mui/material/LinearProgress';

// A prefetched page swaps in around 100ms, which is fast enough that a bar would only flash.
// Anything slower than this is a page whose chunk wasn't prefetched (offscreen accordion, saveData
// or a slow connection) and the user needs to see that the click registered.
const SHOW_AFTER_MS = 150;

/**
 * Thin indeterminate bar across the top of the viewport while a route change is in flight.
 *
 * Without it a slow navigation looks like a dead click: routeChangeStart fires within ~5ms but
 * nothing on screen moves until the new page's chunk has downloaded, including the selected state
 * in the nav, which reads router.pathname and therefore only updates on completion.
 */
const RouteProgress = () => {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timeout;

    const start = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => setVisible(true), SHOW_AFTER_MS);
    };

    const stop = () => {
      clearTimeout(timeout);
      setVisible(false);
    };

    router.events.on('routeChangeStart', start);
    router.events.on('routeChangeComplete', stop);
    router.events.on('routeChangeError', stop);

    return () => {
      clearTimeout(timeout);
      router.events.off('routeChangeStart', start);
      router.events.off('routeChangeComplete', stop);
      router.events.off('routeChangeError', stop);
    };
  }, [router.events]);

  if (!visible) return null;

  return (
    <LinearProgress
      data-cy={'route-progress'}
      aria-label={'Loading page'}
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        zIndex: (theme) => theme.zIndex.drawer + 2
      }}
    />
  );
};

export default RouteProgress;
