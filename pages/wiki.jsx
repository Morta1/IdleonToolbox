import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Typography } from '@mui/material';
import { NextSeo } from 'next-seo';
import { sessionQuery } from '@utility/nav-query';
import CategoryTiles from '@components/wiki/CategoryTiles';
import WikiRail from '@components/wiki/WikiRail';
import { navigateOnPlainClick, useWikiGo } from '@components/wiki/links';
import SimpleLoader from '@components/common/SimpleLoader';
import ItemCard from '@components/common/cards/ItemCard';
import Notice from '@components/common/Notice';
import { entityHref } from '@utility/wiki/page-graph';

const Wiki = ({ counts }) => {
  const router = useRouter();
  const [entries, setEntries] = useState(null);
  const [indexFailed, setIndexFailed] = useState(false);
  // Every entity has had its own page since routing landed. ?e= is what the wiki used before that,
  // and links to it are already out in the world, so it forwards rather than 404s.
  const legacyId = typeof router.query.e === 'string' ? router.query.e : null;

  // The slim index, only for the ?e= redirect: kind and slug per id. The search bar above already
  // fetches this chunk, so the page pays nothing for it.
  useEffect(() => {
    if (!legacyId) return undefined;
    let alive = true;
    import('../data/wiki-search-index.json').then((mod) => {
      if (alive) setEntries(mod.default || mod);
    }).catch(() => {
      if (alive) setIndexFailed(true);
    });
    return () => {
      alive = false;
    };
  }, [legacyId]);

  const go = useWikiGo();

  const hrefForId = (id) => {
    const entry = entries?.find((candidate) => candidate.id === id);
    return entry ? entityHref(entry) : null;
  };

  useEffect(() => {
    if (!entries || !legacyId) return;
    const href = hrefForId(legacyId);
    // replace, not push: a forwarded link should not leave the old URL in history behind it.
    if (href) router.replace({ pathname: href, query: sessionQuery(router.query) });
  }, [entries, legacyId]);

  // An id no page answers to, or an index that didn't load: the old link can't forward, so the note and the home.
  const outdated = Boolean(legacyId) && (indexFailed || (Boolean(entries) && !hrefForId(legacyId)));

  // Kept above the loader below, or the page has no title while the graph is still downloading.
  const seo = <NextSeo
    title="Wiki | Idleon Toolbox"
    description="Search every Legends of Idleon item, monster, NPC and quest to see what drops it, what it crafts, and which quests use it"
  />;

  return <WikiRail>
    <Box>
      {seo}
      {/* No heading of its own: the NavBar's PageTitle already renders the page's h1. */}
      <Typography variant={'body2'} mb={{ xs: 2, md: 3 }} color={'text.secondary'}>
        Search any item, monster, NPC, or game system (bubbles, chips, prayers, the Upgrade Vault...) to
        see how it connects to the rest of the game, or pick a category below.
      </Typography>
      {/* First because a phone has no rail: the rail carries the changelog on desktop and is hidden
          below md, and it is not a category so no tile leads to it either. A real anchor, like the
          rail's own links, so copy-link and modified clicks work. */}
      <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 3 }}>
        <ItemCard href={'/wiki/changelog'} onClick={navigateOnPlainClick(go, '/wiki/changelog', true)} prefetch={false} size={'s'}
                  title={'Changelog'} meta={'What the game changed, by version'}/>
      </Box>
      {outdated ? <Box sx={{ mb: 3 }}><Notice tone={'missing'}>That wiki link is out of date. Search for the page above.</Notice></Box> : null}
      {legacyId && !outdated
        ? <SimpleLoader message={'Loading wiki data...'}/>
        : <CategoryTiles counts={counts} onGo={go}/>}
    </Box>
  </WikiRail>;
};

// The counts at build time, so the exported page is the full index rather than a loader: the rail renders only its
// open groups, so these tiles are the one page linking every category.
export const getStaticProps = async () => {
  const { wikiHomeProps } = await import('@utility/wiki/static-pages.mjs');
  return wikiHomeProps();
};

export default Wiki;
