import React, { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { Stack, Typography } from '@mui/material';
import { sessionQuery } from '@utility/nav-query';

const SITE_ORIGIN = 'https://idleontoolbox.com';

// The old URL of a page whose kind moved under its game system. GitHub Pages has no server redirects, so the
// exported HTML does the job three ways: the canonical hands the old URL's ranking to the new one, the refresh moves a
// visitor (or a crawler) before any JS runs, and router.replace covers an in-app hop, keeping the session query. No
// noindex: the canonical already tells a crawler which URL to keep, and these pages stay out of the sitemap.
const WikiRedirectPage = ({ to, seoTitle, seoDescription }) => {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    router.replace({ pathname: to, query: sessionQuery(router.query) });
  }, [router.isReady, to]);

  return <>
    <NextSeo title={seoTitle} description={seoDescription} canonical={`${SITE_ORIGIN}${to}`}/>
    {/* key "canonical" dedupes against the copies _app and NextSeo write from the same seoCanonical. */}
    <Head>
      <link rel="canonical" href={`${SITE_ORIGIN}${to}`} key="canonical"/>
      <meta httpEquiv="refresh" content={`0; url=${to}`} key="refresh"/>
    </Head>
    <Stack sx={{ my: 4 }} alignItems={'center'} gap={1}>
      <Typography>This page moved to <a href={to}>{`${SITE_ORIGIN}${to}`}</a></Typography>
    </Stack>
  </>;
};

export default WikiRedirectPage;
