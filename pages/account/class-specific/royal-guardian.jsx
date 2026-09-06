import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { Stack, Typography } from '@mui/material';

// The page moved to /account/class-specific/royal-armory: every other class-specific entry is named
// after the skill it tracks (Grimoire, Compass, Tesseract), and the in-game skill here is the Royal
// Armory - Royal Guardian is the class. This path still circulates in bookmarks, Discord links and
// Google's index, so it stays as a redirect rather than a 404.
//
// A client redirect, not a 301: the site is a static export (next.config.js `output: 'export'`),
// so there is no server to answer with one. Same approach as the legacy /tools/builds ?c=&b= URLs.
// The whole query rides along verbatim - unlike a cross-page hop, these params (`t`, `profile`,
// `demo`) all belong to the page being reopened.
//
// No <meta http-equiv="refresh"> fallback. Nothing below _app's router gate renders during the
// export, so a tag declared here would never reach the exported HTML anyway - the noindex below
// takes effect only because generate-page-seo.mjs lifts it into _app's static head. And a refresh
// tag that did fire would fire before hydration, dropping the query a shared ?profile= link needs.
// Without JS this page is blank like every other page on the site, so JS is the only path that
// matters and Googlebot renders it.
export const ROYAL_ARMORY_PATH = '/account/class-specific/royal-armory';

const RoyalGuardianRedirect = () => {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    router.replace({ pathname: ROYAL_ARMORY_PATH, query: router.query });
  }, [router.isReady, router.query]);

  return <>
    <NextSeo
      title="Royal Armory | Idleon Toolbox"
      description="Keep track of your Royal Guardian's armory, royal statues, statue flair and orblet market"
      canonical={`https://idleontoolbox.com${ROYAL_ARMORY_PATH}`}
      noindex
    />
    <Stack sx={{ my: 4 }} alignItems={'center'} gap={1}>
      <Typography>This page moved to Royal Armory.</Typography>
      <a href={ROYAL_ARMORY_PATH}>Continue to Royal Armory</a>
    </Stack>
  </>;
};

export default RoyalGuardianRedirect;
