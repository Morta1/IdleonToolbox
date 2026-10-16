import React from 'react';
import WikiEntityPage from '@components/wiki/WikiEntityPage';
import WikiListingPage from '@components/wiki/WikiListingPage';
import WikiRedirectPage from '@components/wiki/WikiRedirectPage';

// /wiki/<x>/<y> is a system kind's listing (x a system, y its segment), a loose kind's entity, or the old URL of an
// entity whose kind moved under its system (a redirect). One route branches on what its params turn out to be, since
// two dynamic siblings can't coexist.
const VIEWS = { listing: WikiListingPage, redirect: WikiRedirectPage, entity: WikiEntityPage };

const WikiPage = (props) => {
  const View = VIEWS[props.page];
  return <View {...props}/>;
};

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
