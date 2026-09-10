import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Card, CardActionArea, Stack, Typography } from '@mui/material';
import { NextSeo } from 'next-seo';
import { sessionQuery } from '@utility/nav-query';
import CategoryTiles from '@components/wiki/CategoryTiles';
import WikiRail from '@components/wiki/WikiRail';
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
        {/* The rail carries the changelog on desktop and is hidden below md, and it is not a
            category so no tile leads to it either. Without this row it cannot be reached at all on
            a phone. A real anchor, like the rail's own links, so copy-link and modified clicks work. */}
        <Card variant={'outlined'} sx={{ display: { xs: 'block', md: 'none' } }}>
          <CardActionArea
            component={'a'}
            href={'/wiki/changelog'}
            onClick={(event) => {
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              event.preventDefault();
              go('/wiki/changelog');
            }}
            sx={{ p: 1.5 }}
          >
            <Stack gap={0.25}>
              <Typography fontWeight={600}>Changelog</Typography>
              <Typography variant={'caption'} color={'text.secondary'}>
                What the game changed, by version
              </Typography>
            </Stack>
          </CardActionArea>
        </Card>
      </Stack>}
    </Box>
  </WikiRail>;
};

// No getStaticProps: the category links a crawler follows from here are WikiRail's anchors, which
// every wiki page renders and CSS (not a condition) hides below md, so they are in the export.

export default Wiki;
