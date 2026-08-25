import React from 'react';
import { useRouter } from 'next/router';
import { Box } from '@mui/material';
import { NextSeo } from 'next-seo';
import EntityList from '@components/wiki/EntityList';
import { KIND_PLURALS } from '@components/wiki/EntityPanel';
import { sessionQuery } from '@utility/nav-query';
import { hasListing } from '@utility/wiki/kinds.mjs';

// The listing for one kind, for the kinds worth listing. These are what makes the entity pages
// reachable: a crawler that lands on /wiki finds one link per catalog, and each of those carries
// its whole category. Quests have no catalog and are reached from the NPC that gives them.
const WikiKind = ({ kind, entries, seoTitle, seoDescription }) => {
  const router = useRouter();
  const index = {
    byId: Object.fromEntries(entries.map((entry) => [entry.id, entry.node])),
    searchList: entries.map(({ id, node, label }) => ({ id, kind: node.kind, label }))
  };
  const go = (href) => router.push({ pathname: href, query: sessionQuery(router.query) });

  return <Box sx={{ maxWidth: 1200 }}>
    <NextSeo title={seoTitle} description={seoDescription}/>
    <EntityList
      index={index}
      kind={kind}
      onNavigate={(id) => {
        const node = index.byId[id];
        if (node?.slug) go(`/wiki/${node.kind}/${node.slug}`);
      }}
      onBack={() => go('/wiki')}
    />
  </Box>;
};

export const getStaticPaths = async () => {
  const { staticGraph } = await import('@utility/wiki/static-graph.mjs');
  const { graph } = staticGraph();
  const kinds = [...new Set(Object.values(graph.nodes).map((node) => node.kind))].filter(hasListing);
  return { paths: kinds.map((kind) => ({ params: { kind } })), fallback: false };
};

export const getStaticProps = async ({ params }) => {
  const { staticGraph } = await import('@utility/wiki/static-graph.mjs');
  const { graph } = staticGraph();

  const entries = Object.entries(graph.nodes)
    // `catalog: false` keeps a page out of its kind's listing without taking the page away: the
    // 130 chests, souls, critters, Forges, Monuments and resource nodes in monsters.json all carry
    // real drop tables, and an item citing "dropped by Bronze Chest(W1)" still has somewhere to go.
    .filter(([, node]) => node.kind === params.kind && node.navigable !== false && node.catalog !== false && node.slug)
    .map(([id, node]) => ({
      id,
      label: (node.name || node.rawName).replace(/_/g, ' '),
      // category rides along so the listing can offer a facet the data actually has: seven worlds
      // for maps, five kinds for monsters, 112 item types behind a select.
      node: {
        kind: node.kind,
        rawName: node.rawName,
        name: node.name,
        icon: node.icon ?? null,
        slug: node.slug,
        category: node.category ?? null,
        // Vials and bubbles unlock in a fixed sequence, and that sequence is how they are read.
        order: node.order ?? null,
        // Monsters and NPCs band by world, which is a different axis from their category.
        world: node.world ?? null,
        // Which bestiary section a monster reads under, which is a world for most of them and
        // Bosses, Events, Dungeon or The Rift for the ones the game places nowhere.
        section: node.section ?? null
      }
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  if (entries.length === 0) return { notFound: true };

  const plural = KIND_PLURALS[params.kind] || params.kind;
  return {
    props: {
      kind: params.kind,
      entries,
      seoTitle: `${plural} | Idleon Toolbox`,
      seoDescription: `Every one of the ${entries.length.toLocaleString('en-US')} ${plural.toLowerCase()} in Legends of Idleon, and what each one connects to.`,
      crawlLinks: entries.map((entry) => ({ h: `/wiki/${entry.node.kind}/${entry.node.slug}`, t: entry.label })),
      crawlHeading: `${plural} in Legends of Idleon`
    }
  };
};

export default WikiKind;
