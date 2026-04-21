import React, { useContext, useEffect, useState } from 'react';
import { Alert, Stack } from '@mui/material';
import SimpleLoader from '@components/common/SimpleLoader';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { AppContext } from '@components/common/context/AppProvider';
import BuildForm from '@components/tools/builds/BuildForm';
import useAuthReady from '@hooks/useAuthReady';
import { getBuild, getBuildState } from 'services/builds';

const EditBuild = () => {
  const router = useRouter();
  const { state } = useContext(AppContext);
  const { authReady, signedIn } = useAuthReady();
  const shortId = router.query?.id;

  const [build, setBuild] = useState(null);
  const [ownershipConfirmed, setOwnershipConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!shortId || !signedIn) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getBuild(shortId),
      getBuildState(shortId, state?.accessToken)
    ])
      .then(([doc, flags]) => {
        if (cancelled) return;
        if (!flags?.owner) {
          setError('You can only edit builds you created.');
        } else {
          setBuild(doc);
          setOwnershipConfirmed(true);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Unable to load build.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [shortId, signedIn, state?.accessToken]);

  return (
    <>
      <NextSeo title={`Edit ${build?.title || 'build'} | Idleon Toolbox`}/>
      <Stack mt={2} gap={2}>
        {authReady && !signedIn && (
          <Alert severity="warning">Sign in to edit your builds.</Alert>
        )}
        {error && <Alert severity="error">{error}</Alert>}
        {!authReady || loading ? (
          <SimpleLoader message={!authReady ? 'Checking sign-in…' : 'Loading build…'}/>
        ) : ownershipConfirmed && build ? (
          <BuildForm
            mode="edit"
            initialBuild={build}
            backHref={shortId ? `/tools/builds/view?id=${encodeURIComponent(shortId)}` : '/tools/builds'}
          />
        ) : null}
      </Stack>
    </>
  );
};

export default EditBuild;
