import React from 'react';
import WikiListingPage from '@components/wiki/WikiListingPage';
import WikiSystemPage from '@components/wiki/WikiSystemPage';

// /wiki/<x> is a game system's page when x is a system slug, else a kind's listing. One route branches
// on what its param turns out to be, since two dynamic siblings can't coexist. Where a system slug
// equals a kind (equinox, rift) the system wins, and LISTING_SUFFIXES moves that kind's listing to
// listingHref(kind), one level down in [slug].jsx.
const WikiHub = (props) => (props.page === 'system' ? <WikiSystemPage {...props}/> : <WikiListingPage {...props}/>);

export const getStaticPaths = async () => {
  const { hubPaths } = await import('@utility/wiki/static-pages.mjs');
  return { paths: hubPaths(), fallback: false };
};

export const getStaticProps = async ({ params }) => {
  const { hubProps } = await import('@utility/wiki/static-pages.mjs');
  return hubProps(params.kind);
};

export default WikiHub;
