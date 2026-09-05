import React, { useEffect, useState } from 'react';
import { Box, Container, Stack, Typography } from '@mui/material';
import SimpleLoader from './SimpleLoader';
import { PAGE_H1_SX } from './PageTitle';
import { drawerWidth, navBarHeight } from '../constants';

// Every exported page ships an empty body: nothing below <WaitForRouter> in _app renders during
// the export, so a visitor sees the bare background until React hydrates - measured at ~0.7s on a
// desktop and ~10s on a throttled phone.
//
// This fills that window with the same <SimpleLoader> DataLoadingWrapper shows once the gate is
// open, so the handoff is not a visual change. Renders identically on the server and on the first
// client render, then unmounts, which is the pattern already proven by CrawlLinks.
//
// It also paints the page's heading, description and, on the landing page, the hero image. Field
// data (Sept 2026, web_vitals attribution) showed the LCP element on nearly every page is static
// text - the h1, or the landing subtitle - painted only after hydration, with render-delay being
// the whole of the metric. Text that needs no data has no reason to wait for it. Painted here it
// is the largest paint at first byte instead of after ~2.4MB of JS.
//
// Two things make that stick. Chrome does not move LCP when an element is removed, only when a
// larger one paints later, so the heading here must be the same size as the one PageTitle draws
// after the gate opens (PAGE_H1_SX is shared for exactly that reason). And on '/' the hero is
// larger than any text, so it has to be here too, or its own post-hydration paint would re-anchor
// LCP right back where it was. Its first image is fixed so the export paints the same one
// hydration will show; React's server renderer preloads it from the <img> on its own.

// Same media query index.jsx uses for the hero column layout, as CSS: useMediaQuery cannot run in
// the export, and a mismatch here would be a layout jump at hydration.
const NARROW = '@media (max-width:1245px)';

const HomeHeader = ({ heading, description, hero }) => (
  <Container>
    <Stack direction={'row'} flexWrap={'wrap'} gap={2}
           sx={{ mt: 1, '@media (min-width:1921px)': { mt: 5 }, [NARROW]: { textAlign: 'center', gap: 6 } }}>
      <Stack sx={{ width: '50%', [NARROW]: { width: '100%' } }}>
        <Typography variant={'h1'} sx={{ fontWeight: 400 }}>{heading}</Typography>
        {description ? (
          <Typography component={'p'} variant={'h6'} sx={{ mt: 2, fontWeight: 400, color: '#e3e3e3' }}>
            {description}
          </Typography>
        ) : null}
      </Stack>
      <Stack sx={{ justifyContent: 'center', [NARROW]: { width: '100%' } }}>
        <Box sx={{ width: 550, aspectRatio: '1200 / 674', position: 'relative', [NARROW]: { width: '100%' } }}>
          <img
            src={hero.src}
            alt={hero.alt}
            width={1200}
            height={674}
            fetchPriority="high"
            // Same fixed box and cover as index.jsx's hero: the two must paint at the same size or
            // the hydrated copy becomes a larger, later LCP candidate.
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              maxWidth: 550,
              left: '50%',
              transform: 'translateX(-50%)',
              borderRadius: 10,
              boxShadow: '0 10px 15px -3px #000000'
            }}
          />
        </Box>
      </Stack>
    </Stack>
  </Container>
);

// The description is drawn at subtitle size on purpose, not body size. It is the largest thing the
// shell paints on these pages, and LCP stays at its paint only while nothing bigger comes later.
// At body size (13,192px^2) the cookie-consent bar's text (14,022px^2) narrowly beat it at
// hydration on every first visit from a non-GDPR region; at h6 it is ~20,000px^2 and nothing
// the hydrated page paints reaches that. e2e/lcp-shell.spec.js holds the invariant.
const PageHeader = ({ heading, description }) => (
  <>
    {heading ? <Typography component={'h1'} sx={PAGE_H1_SX}>{heading}</Typography> : null}
    {description ? (
      <Typography component={'p'} variant={'h6'} sx={{ mt: 1, fontWeight: 400, color: '#e3e3e3' }}>
        {description}
      </Typography>
    ) : null}
  </>
);

const PreHydrationLoader = ({ heading, description, hero, withDrawer = false }) => {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  if (hydrated) return null;

  const hasHeader = Boolean(heading || description || hero);

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {hasHeader ? (
        // Same offsets as NavBar's <main>, so the heading lands where the real one will appear.
        <Box component={'header'} sx={{
          pt: `${navBarHeight + 24}px`,
          pr: 3,
          pl: { xs: 3, lg: withDrawer ? `${drawerWidth + 24}px` : 3 }
        }}>
          {hero
            ? <HomeHeader heading={heading} description={description} hero={hero}/>
            : <PageHeader heading={heading} description={description}/>}
        </Box>
      ) : null}
      {/* Centred in whatever is left. dvh rather than vh so mobile browser chrome doesn't push it
          below centre. */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <SimpleLoader message="Loading..."/>
      </Box>
    </Box>
  );
};

export default PreHydrationLoader;
