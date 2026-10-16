import React from 'react';
import { Box } from '@mui/material';
import { NextSeo } from 'next-seo';
import EntityPanel from './EntityPanel';
import WikiRail from './WikiRail';
import { useWikiGo } from './links';
import { entityHref, pageIndex } from '@utility/wiki/page-graph';

// One page per entity. The whole point of the route: 3,466 entities used to share /wiki and one
// title, and a shared URL cannot be linked to, ranked or sitemapped separately.
const WikiEntityPage = ({ slice, seoTitle, seoDescription }) => {
  // No graph download here: everything this page renders came from static props one hop away.
  const index = pageIndex(slice);

  const go = useWikiGo();

  return <WikiRail current={slice.node?.kind}>
    <Box sx={{ maxWidth: 1200 }}>
      <NextSeo title={seoTitle} description={seoDescription}/>
      {/* Keyed by entity: Next keeps this page mounted between two entity pages, and a level typed on
          one would otherwise open the next at that level. */}
      <EntityPanel
        key={slice.id}
        index={index}
        id={slice.id}
        hrefFor={(id) => entityHref(index.byId[id])}
        onNavigate={(id) => {
          const href = entityHref(index.byId[id]);
          if (href) go(href);
        }}
        onGo={go}
      />
    </Box>
  </WikiRail>;
};

export default WikiEntityPage;
