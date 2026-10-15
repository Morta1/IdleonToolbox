import React from 'react';
import { useRouter } from 'next/router';
import { Box } from '@mui/material';
import { NextSeo } from 'next-seo';
import EntityPanel from './EntityPanel';
import WikiRail from './WikiRail';
import { pageIndex } from '@utility/wiki/page-graph';
import { listingHref } from '@utility/wiki/kinds.mjs';
import { sessionQuery } from '@utility/nav-query';

// One page per entity. The whole point of the route: 3,466 entities used to share /wiki and one
// title, and a shared URL cannot be linked to, ranked or sitemapped separately.
const WikiEntityPage = ({ slice, seoTitle, seoDescription }) => {
  const router = useRouter();
  // No graph download here: everything this page renders came from static props one hop away.
  const index = pageIndex(slice);

  const go = (href) => router.push({ pathname: href, query: sessionQuery(router.query) });

  return <WikiRail current={slice.node?.kind}>
    <Box sx={{ maxWidth: 1200 }}>
      <NextSeo title={seoTitle} description={seoDescription}/>
      <EntityPanel
        index={index}
        id={slice.id}
        hrefFor={(id) => {
          const node = index.byId[id];
          return node?.slug ? `/wiki/${node.kind}/${node.slug}` : null;
        }}
        onNavigate={(id) => {
          const node = index.byId[id];
          if (node?.slug) go(`/wiki/${node.kind}/${node.slug}`);
        }}
        onBack={() => go('/wiki')}
        onBrowseKind={(kind) => go(listingHref(kind))}
      />
    </Box>
  </WikiRail>;
};

export default WikiEntityPage;
