import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import Notice from '@components/common/Notice';

// The Active Exp Calculator was folded into the Active Stuff Calculator, whose Exp section covers
// the same numbers (exp/hr, time to next level, target level). The old path stays as a client
// redirect so bookmarks and indexed links don't 404 - same approach as royal-guardian.jsx.
export const ACTIVE_STUFF_CALCULATOR_PATH = '/tools/active-stuff-calculator';

const ActiveExpCalculatorRedirect = () => {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    router.replace({ pathname: ACTIVE_STUFF_CALCULATOR_PATH, query: router.query });
  }, [router.isReady, router.query]);

  return <>
    <NextSeo
      title="Active Stuff Calculator | Idleon Toolbox"
      description="Calculate active gameplay item drops, resource gains, and efficiency for your Legends of Idleon characters"
      canonical={`https://idleontoolbox.com${ACTIVE_STUFF_CALCULATOR_PATH}`}
      noindex
    />
    <Notice action={{ label: 'Open the Active Stuff Calculator', href: ACTIVE_STUFF_CALCULATOR_PATH }}>
      The Active Exp Calculator is part of the Active Stuff Calculator now.
    </Notice>
  </>;
};

export default ActiveExpCalculatorRedirect;
