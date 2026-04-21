import React, { useEffect, useState } from 'react';
import { Alert, Stack } from '@mui/material';
import SimpleLoader from '@components/common/SimpleLoader';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import BuildForm from '@components/tools/builds/BuildForm';
import useAuthReady from '@hooks/useAuthReady';
import { getBuild } from 'services/builds';

// Supports optional `?from=<shortId>` template pre-fill.
const NewBuild = () => {
  const router = useRouter();
  const { authReady, signedIn } = useAuthReady();
  const fromId = router.query?.from;

  const [template, setTemplate] = useState(null);
  // Start true so we don't flash the empty form before router.query hydrates
  // (Next.js static export: query is {} until router.isReady flips).
  const [templateLoading, setTemplateLoading] = useState(true);
  const [templateError, setTemplateError] = useState('');

  useEffect(() => {
    if (!router.isReady) return;
    if (!fromId) {
      setTemplate(null);
      setTemplateLoading(false);
      return;
    }
    let cancelled = false;
    setTemplateLoading(true);
    getBuild(fromId)
      .then((doc) => {
        if (cancelled) return;
        // Strip title to force the user to name their variant; keep everything else.
        setTemplate({ ...doc, title: `` });
        setTemplateLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setTemplateError(err?.message || 'Could not load template.');
        setTemplateLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [router.isReady, fromId]);

  // If auth resolves and the user isn't signed in, bounce back to the public
  // list page — a single loader is shown until the form is interactive.
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
      />
      <Stack mt={2} gap={2}>
        {templateError && <Alert severity="error">{templateError}</Alert>}
        {notReady ? (
          <SimpleLoader message={loaderMessage}/>
        ) : (
          <BuildForm mode="create" initialBuild={template} backHref="/tools/builds"/>
        )}
      </Stack>
    </>
  );
};

export default NewBuild;
