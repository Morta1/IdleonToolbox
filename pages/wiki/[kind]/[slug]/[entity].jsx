import React from 'react';
import WikiEntityPage from '@components/wiki/WikiEntityPage';

// /wiki/<system>/<segment>/<slug>: an entity of a kind filed under a game system. The params keep the names of the
// directories above, so `kind` holds the system slug and `slug` the kind's listing segment.
const WikiSystemEntityPage = (props) => <WikiEntityPage {...props}/>;

export const getStaticPaths = async () => {
  const { entityPaths } = await import('@utility/wiki/static-pages.mjs');
  return { paths: entityPaths(), fallback: false };
};

export const getStaticProps = async ({ params }) => {
  const { entityPageProps } = await import('@utility/wiki/static-pages.mjs');
  return entityPageProps(params.kind, params.slug, params.entity);
};

export default WikiSystemEntityPage;
