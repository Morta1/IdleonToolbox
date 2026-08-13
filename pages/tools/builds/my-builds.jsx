import React, { useContext, useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Grid,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Typography
} from '@mui/material';
import Tooltip from '@components/Tooltip';
import SimpleLoader from '@components/common/SimpleLoader';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { NextSeo } from 'next-seo';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { AppContext } from '@components/common/context/AppProvider';
import BuildCard from '@components/tools/builds/BuildCard';
import useAuthReady from '@hooks/useAuthReady';
import { listMyBuilds, listLikedBuilds } from 'services/builds';
import { fetchAllBuildsAtBuildTime } from '@utility/builds/static-fetch.mjs';
import { staticIdSet } from '@utility/builds/build-pages.mjs';

// The builds themselves are fetched per-user at runtime, but which of them have an exported page
// is a build-time fact - without it every card here would link to /tools/builds/view?id=.
export async function getStaticProps() {
  const builds = await fetchAllBuildsAtBuildTime();
  // Account-scoped: the export ships an empty shell, and a signed-out visitor gets a sign-in
  // prompt. Nothing here for a crawler to rank.
  return { props: { staticIds: [...staticIdSet(builds)], seoNoindex: true } };
}

const MyBuilds = ({ staticIds }) => {
  const router = useRouter();
  const { state } = useContext(AppContext);
  const { authReady, signedIn } = useAuthReady();

  const [tab, setTab] = useState(0); // 0 = mine, 1 = liked
  const [mine, setMine] = useState(null);
  const [liked, setLiked] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    Promise.all([
      listMyBuilds(state?.accessToken).catch(() => ({ items: [] })),
      listLikedBuilds(state?.accessToken).catch(() => ({ items: [] }))
    ])
      .then(([m, l]) => {
        if (cancelled) return;
        setMine(m?.items || []);
        setLiked(l?.items || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Unable to load your builds.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [signedIn, state?.accessToken]);

  if (!authReady) {
    return (
      <>
        <NextSeo title="My builds | Idleon Toolbox" noindex/>
        <SimpleLoader message="Checking sign-in…"/>
      </>
    );
  }

  if (!signedIn) {
    return (
      <>
        <NextSeo title="My builds | Idleon Toolbox" noindex/>
        <Stack mt={2} gap={2}>
          <Typography variant="h4">My builds</Typography>
          <Alert severity="info">Sign in to see your builds and the ones you've liked.</Alert>
          <Button component={Link} href="/tools/builds" variant="outlined">
            Browse community builds
          </Button>
        </Stack>
      </>
    );
  }

  const items = tab === 0 ? mine : liked;

  return (
    <>
      <NextSeo title="My builds | Idleon Toolbox" noindex/>
      <Stack mt={2} gap={2}>
        <Stack direction="row" alignItems="center" gap={1}>
          <Tooltip title="Back to builds">
            <IconButton component={Link} href="/tools/builds">
              <ArrowBackIcon/>
            </IconButton>
          </Tooltip>
          <Typography variant="h4">My builds</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon/>}
            onClick={() => router.push('/tools/builds/new')}
            sx={{ ml: 'auto' }}
          >
            New build
          </Button>
        </Stack>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label={`Yours${mine ? ` (${mine.length})` : ''}`}/>
          <Tab label={`Liked${liked ? ` (${liked.length})` : ''}`}/>
        </Tabs>
        {error && <Alert severity="error">{error}</Alert>}
        {loading || !items ? (
          <SimpleLoader message="Loading your builds…"/>
        ) : items.length === 0 ? (
          <Alert severity="info">
            {tab === 0
              ? "You haven't published a build yet. Click \"New build\" to get started."
              : "You haven't liked any builds yet."}
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {items.map((b) => (
              <Grid item xs={12} sm={6} md={4} key={b.shortId}>
                <BuildCard build={b} staticIds={new Set(staticIds)}/>
              </Grid>
            ))}
          </Grid>
        )}
      </Stack>
    </>
  );
};

export default MyBuilds;
