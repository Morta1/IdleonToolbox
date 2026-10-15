import React from 'react';
import { useRouter } from 'next/router';
import { Box } from '@mui/material';
import { NextSeo } from 'next-seo';
import EntityList from '@components/wiki/EntityList';
import { KIND_PLURALS } from '@utility/wiki/kind-labels.mjs';
import WikiRail from '@components/wiki/WikiRail';
import { sessionQuery } from '@utility/nav-query';
import { hasListing, inListing } from '@utility/wiki/kinds.mjs';

// The listing for one kind, for the kinds worth listing. These are what makes the entity pages
// reachable: a crawler that lands on /wiki finds one link per catalog, and each of those carries
// its whole category. Quests have no catalog and are reached from the NPC that gives them.
const WikiKind = ({ kind, entries, seoTitle, seoDescription }) => {
  const router = useRouter();
  const index = {
    byId: Object.fromEntries(entries.map((entry) => [entry.id, entry.node])),
    searchList: entries.map(({ id, node, label, disambig }) => ({ id, kind: node.kind, label, ...(disambig ? { disambig } : {}) }))
  };
  const go = (href) => router.push({ pathname: href, query: sessionQuery(router.query) });

  return <WikiRail current={kind}>
    <Box sx={{ maxWidth: 1200 }}>
      <NextSeo title={seoTitle} description={seoDescription}/>
      <EntityList
        index={index}
        kind={kind}
        onNavigate={(id) => {
          const node = index.byId[id];
          if (node?.slug) go(`/wiki/${node.kind}/${node.slug}`);
        }}
        onBack={() => go('/wiki')}
        hrefFor={(id) => {
          const node = index.byId[id];
          return node?.slug ? `/wiki/${node.kind}/${node.slug}` : null;
        }}
      />
    </Box>
  </WikiRail>;
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
    .filter(([, node]) => node.kind === params.kind && inListing(node))
    .map(([id, node]) => ({
      id,
      label: (node.name || node.rawName).replace(/_/g, ' '),
      // What tells this row from another of the same name; a unique page carries none.
      ...(node.disambig ? { disambig: node.disambig } : {}),
      // category rides along so the listing can offer a facet the data actually has: seven worlds
      // for maps, five kinds for monsters, 112 item types behind a select.
      node: {
        kind: node.kind,
        rawName: node.rawName,
        name: node.name,
        icon: node.icon ?? null,
        slug: node.slug,
        category: node.category ?? null,
        // A bundle's art is a wide shop banner carrying its name, price and contents, and the card
        // is built around that. A Pet Mart pack has none: just its pet's sprite. So the four things
        // the banner would have shown travel with it and the card draws them itself.
        // A Starter Pack offer card is portrait art, which the wide banner card would blow up, so
        // it takes the Pet Mart treatment too.
        ...(node.petMart || node.starterOffer ? {
          ...(node.petMart ? { petMart: true } : { starterOffer: true }),
          petName: node.petName ?? null,
          price: node.price ?? null,
          gems: node.gems ?? null,
          petCrystals: node.petCrystals ?? null
        } : {}),
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
      seoDescription: `Every one of the ${entries.length.toLocaleString('en-US')} ${plural.toLowerCase()} in Legends of Idleon, and what each one connects to.`
    }
  };
};

export default WikiKind;
