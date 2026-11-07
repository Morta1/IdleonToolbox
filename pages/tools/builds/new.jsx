import React, { useEffect, useState } from 'react';
import { Alert, Stack } from '@mui/material';
import SimpleLoader from '@components/common/SimpleLoader';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import BuildForm from '@components/tools/builds/BuildForm';
import useAuthReady from '@hooks/useAuthReady';
import { getBuild } from 'services/builds';

// Supports optional `?from=<shortId>` template pre-fill.
// Signed out, this page immediately redirects to /tools/builds - an indexable URL that bounces is
// a soft 404, and Google can hold that against its neighbours.
export async function getStaticProps() {
  return { props: { seoNoindex: true } };
}

const NewBuild = () => {
  const router = useRouter();
  const { authReady, signedIn } = useAuthReady();
  const fromId = router.query?.from;

  const [template, setTemplate] = useState(null);
  // The ?from= whose answer has landed.
  const [answeredFrom, setAnsweredFrom] = useState(null);
  const [templateError, setTemplateError] = useState('');
  // Loading until the router is ready, so we don't flash the empty form before router.query hydrates
  // (Next.js static export: query is {} until router.isReady flips).
  const templateLoading = !router.isReady || (Boolean(fromId) && answeredFrom !== fromId);

  useEffect(() => {
    if (!router.isReady || !fromId) return;
    let cancelled = false;
    getBuild(fromId)
      .then((doc) => {
        if (cancelled) return;
        // Strip title to force the user to name their variant; keep everything else.
        setTemplate({ ...doc, title: `` });
        setAnsweredFrom(fromId);
      })
      .catch((err) => {
        if (cancelled) return;
        setTemplateError(err?.message || 'Couldn\'t load the template.');
        setAnsweredFrom(fromId);
      });
    return () => {
      cancelled = true;
    };
  }, [router.isReady, fromId]);

  // If auth resolves and the user isn't signed in, bounce back to the public
  // list page: a single loader is shown until the form is interactive.
  useEffect(() => {
    if (authReady && !signedIn) {
      router.replace('/tools/builds');
    }
  }, [authReady, signedIn, router]);

  const notReady = !authReady || !signedIn || templateLoading;
  const loaderMessage = fromId && templateLoading
    ? 'Loading template…'
    : !authReady
      ? 'Checking sign-in…'
      : 'Loading…';

  return (
    <>
      <NextSeo
        title="New build | Idleon Toolbox"
        description="Create a new community build for Legends of Idleon"
        noindex
      />
      <Stack mt={2} gap={2}>
        {templateError && <Alert severity="error">{templateError}</Alert>}
        {notReady ? (
          <SimpleLoader message={loaderMessage}/>
        ) : (
          <BuildForm mode="create" initialBuild={fromId ? template : null} backHref="/tools/builds"/>
        )}
      </Stack>
    </>
  );
};

export default NewBuild;
