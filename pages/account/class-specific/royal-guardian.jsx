import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import Notice from '@components/common/Notice';
import { sessionQuery } from '@utility/nav-query';

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
// No <meta http-equiv="refresh"> fallback: this is a data page, so its <NextSeo> never runs
// during the export and the noindex reaches the HTML only because generate-page-seo.mjs lifts it
// into _app via PAGE_SEO. A refresh tag would also fire before hydration, dropping the query a
// shared ?profile= link needs, so the redirect has to stay client-side.
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
    {/* A real link, so the way on works before the page's script has run */}
    <Notice tone={'info'} action={{ label: 'Continue to Royal Armory', href: { pathname: ROYAL_ARMORY_PATH, query: sessionQuery(router.query) } }}>This page moved to Royal Armory.</Notice>
  </>;
};

export default RoyalGuardianRedirect;
