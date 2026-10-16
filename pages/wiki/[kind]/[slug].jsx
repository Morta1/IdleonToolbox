import React from 'react';
import WikiEntityPage from '@components/wiki/WikiEntityPage';
import WikiListingPage from '@components/wiki/WikiListingPage';

// /wiki/<kind>/<x> is the kind's listing when x is its LISTING_SUFFIXES entry (a system page holds
// /wiki/<kind>, so listingHref moved the listing here), else an entity page. One route branches on
// what its param turns out to be, since two dynamic siblings can't coexist.
const WikiPage = (props) => (props.page === 'listing' ? <WikiListingPage {...props}/> : <WikiEntityPage {...props}/>);

export const getStaticPaths = async () => {
  const { slugPaths } = await import('@utility/wiki/static-pages.mjs');
  // A static export has no fallback to fall back to: every page has to exist at build time.
  return { paths: slugPaths(), fallback: false };
};

export const getStaticProps = async ({ params }) => {
  const { slugProps } = await import('@utility/wiki/static-pages.mjs');
  return slugProps(params.kind, params.slug);
};

export default WikiPage;
