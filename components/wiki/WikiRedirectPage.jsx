import React, { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { Link, Stack } from '@mui/material';
import Notice from '@components/common/Notice';
import { SESSION_QUERY_PARAMS, sessionQuery } from '@utility/nav-query';

const SITE_ORIGIN = 'https://idleontoolbox.com';

// The old URL of a page whose kind moved under its game system. GitHub Pages has no server redirects, so the
// exported HTML does the job three ways: the canonical hands the old URL's ranking to the new one, the refresh moves a
// visitor (or a crawler) before any JS runs, and router.replace covers an in-app hop. No noindex: the canonical already
// tells a crawler which URL to keep, and these pages stay out of the sitemap.
// A refresh can't carry a query, so on a direct load the save in view (?demo, ?profile) moves first, by this script: the
// refresh waits for the load event. Nothing else on the old URL (utm tags) is carried over.
export const carrySessionScript = (to) => `(function(){var q=new URLSearchParams(location.search),s=new URLSearchParams();${JSON.stringify(SESSION_QUERY_PARAMS)}.forEach(function(k){if(q.has(k))s.set(k,q.get(k))});if(s.toString())location.replace(${JSON.stringify(to)}+"?"+s)})()`;

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
    <script dangerouslySetInnerHTML={{ __html: carrySessionScript(to) }}/>
    <Stack sx={{ my: 4 }}>
      <Notice tone={'info'}>This page moved to <Link href={to}>{`${SITE_ORIGIN}${to}`}</Link></Notice>
    </Stack>
  </>;
};

export default WikiRedirectPage;
