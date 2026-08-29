import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Stack, Typography } from '@mui/material';
import { NextSeo } from 'next-seo';
import { sessionQuery } from '@utility/nav-query';
import { KIND_PLURALS } from '@components/wiki/EntityPanel';
import CategoryTiles from '@components/wiki/CategoryTiles';
import WikiRail from '@components/wiki/WikiRail';
import { hasListing } from '@utility/wiki/kinds.mjs';
import SimpleLoader from '@components/common/SimpleLoader';

const Wiki = () => {
  const router = useRouter();
  const [entries, setEntries] = useState(null);
  // Every entity has had its own page since routing landed. ?e= is what the wiki used before that,
  // and links to it are already out in the world, so it forwards rather than 404s.
  const legacyId = typeof router.query.e === 'string' ? router.query.e : null;

  // The slim index, not the full graph: the two things this page still needs every entity for are
  // the category counts and the ?e= redirect, and both are just kind and slug per id. The search
  // bar above already fetches this chunk, so the page pays nothing for it.
  useEffect(() => {
    let alive = true;
    import('../data/wiki-search-index.json').then((mod) => {
      if (alive) setEntries(mod.default || mod);
    });
    return () => {
      alive = false;
    };
  }, []);

  const go = (href) => router.push({ pathname: href, query: sessionQuery(router.query) });

  const entityHref = (id) => {
    const entry = entries?.find((candidate) => candidate.id === id);
    return entry?.slug ? `/wiki/${entry.kind}/${entry.slug}` : null;
  };

  useEffect(() => {
    if (!entries || !legacyId) return;
    const href = entityHref(legacyId);
    // replace, not push: a forwarded link should not leave the old URL in history behind it.
    if (href) router.replace({ pathname: href, query: sessionQuery(router.query) });
  }, [entries, legacyId]);

  // Kept above the loader below, or the page has no title while the graph is still downloading.
  const seo = <NextSeo
    title="Wiki | Idleon Toolbox"
    description="Search every Legends of Idleon item, monster, NPC and quest to see what drops it, what it crafts, and which quests use it"
  />;

  return <WikiRail>
    <Box sx={{ maxWidth: 1200 }}>
      {seo}
      {/* No heading of its own: the NavBar's PageTitle already renders the page's h1. */}
      <Typography mb={3} color={'text.secondary'}>
        Search any item, monster, NPC or quest to see how it connects to the rest of the game.
      </Typography>
      {!entries || legacyId ? <SimpleLoader message={'Loading wiki data...'}/> : <Stack gap={2}>
        <Typography color={'text.secondary'}>
          Search above, or pick a category to browse.
        </Typography>
        <CategoryTiles searchList={entries} onSelect={(kind) => go(`/wiki/${kind}`)}/>
      </Stack>}
    </Box>
  </WikiRail>;
};

export const getStaticProps = async () => {
  const { staticGraph } = await import('@utility/wiki/static-graph.mjs');
  const { graph } = staticGraph();
  const kinds = [...new Set(Object.values(graph.nodes).filter((n) => n.navigable !== false).map((n) => n.kind))]
    .filter(hasListing);
  return {
    props: {
      // The category pages, so a crawler landing on /wiki has somewhere to go. Each of those then
      // lists its whole category, which is how the entity pages are reached.
      // The label, not the bare kind: this is the anchor text a crawler reads for the links that
      // lead to every entity page.
      crawlLinks: kinds.map((kind) => ({ h: `/wiki/${kind}`, t: KIND_PLURALS[kind] || kind })),
      crawlHeading: 'Wiki categories'
    }
  };
};

export default Wiki;
