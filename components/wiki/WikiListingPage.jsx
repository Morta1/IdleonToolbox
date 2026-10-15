import React from 'react';
import { useRouter } from 'next/router';
import { Box, Stack } from '@mui/material';
import { NextSeo } from 'next-seo';
import EntityList from './EntityList';
import WikiRail from './WikiRail';
import WikiBreadcrumbs from './WikiBreadcrumbs';
import { sessionQuery } from '@utility/nav-query';
import { listingHref, wikiCrumbs } from '@utility/wiki/kinds.mjs';
import { parseSort, sortQuery } from '@utility/wiki/listing-sort.mjs';

// The listing for one kind, for the kinds worth listing. These are what makes the entity pages
// reachable: a crawler that lands on /wiki finds one link per catalog, and each of those carries
// its whole category. Quests have no catalog and are reached from the NPC that gives them.
const WikiListingPage = ({ kind, entries, columns = [], seoTitle, seoDescription }) => {
  const router = useRouter();
  const index = {
    byId: Object.fromEntries(entries.map((entry) => [entry.id, entry.node])),
    searchList: entries.map(({ id, node, label, disambig, cells }) => ({ id, kind: node.kind, label, ...(disambig ? { disambig } : {}), cells }))
  };
  const go = (href) => router.push({ pathname: href, query: sessionQuery(router.query) });
  // The export has no query, so the first render is always unsorted, and a deep link sorts once the router is ready.
  const sort = router.isReady ? parseSort(router.query, columns) : null;
  // listingHref is the listing's own URL, so a moved listing sorts under /wiki/equinox/upgrades too.
  const onSortChange = (next) => router.replace(
    { pathname: listingHref(kind), query: sortQuery(router.query, next) }, undefined, { shallow: true, scroll: false });

  return <WikiRail current={kind}>
    <Box sx={{ maxWidth: 1200 }}>
      <NextSeo title={seoTitle} description={seoDescription}/>
      <Stack gap={2}>
        <WikiBreadcrumbs crumbs={wikiCrumbs({ kind, listing: true })} onGo={go}/>
        <EntityList
          index={index}
          kind={kind}
          columns={columns}
          sort={sort}
          onSortChange={onSortChange}
          onNavigate={(id) => {
            const node = index.byId[id];
            if (node?.slug) go(`/wiki/${node.kind}/${node.slug}`);
          }}
          hrefFor={(id) => {
            const node = index.byId[id];
            return node?.slug ? `/wiki/${node.kind}/${node.slug}` : null;
          }}
        />
      </Stack>
    </Box>
  </WikiRail>;
};

export default WikiListingPage;
