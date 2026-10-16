import React from 'react';
import WikiListingPage from '@components/wiki/WikiListingPage';
import WikiRedirectPage from '@components/wiki/WikiRedirectPage';
import WikiSystemPage from '@components/wiki/WikiSystemPage';

// /wiki/<x> is a game system's page when x is a system slug, a loose kind's listing, or the old listing of a kind that
// moved under its system (a redirect). One route branches on what its param turns out to be, since two dynamic
// siblings can't coexist.
const VIEWS = { system: WikiSystemPage, redirect: WikiRedirectPage, listing: WikiListingPage };

const WikiHub = (props) => {
  const View = VIEWS[props.page];
  return <View {...props}/>;
};

export const getStaticPaths = async () => {
  const { hubPaths } = await import('@utility/wiki/static-pages.mjs');
  return { paths: hubPaths(), fallback: false };
};

export const getStaticProps = async ({ params }) => {
  const { hubProps } = await import('@utility/wiki/static-pages.mjs');
  return hubProps(params.kind);
};

export default WikiHub;
