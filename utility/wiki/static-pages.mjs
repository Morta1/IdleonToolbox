// Build time only, like static-graph.mjs: getStaticPaths and getStaticProps import it dynamically.
// Both wiki routes branch on what their param turns out to be, so each route's paths and props come
// from here: /wiki/<x> is a system page or a listing, /wiki/<kind>/<x> a moved listing or an entity.

import { staticGraph, staticNeighbourhood } from './static-graph.mjs';
import { KIND_LABELS } from './kind-labels.mjs';
import {
  LISTED_KINDS, LISTING_SUFFIXES, hasListing, listingCounts, routeClashes, systemBySlug, systemsWithRows
} from './kinds.mjs';
import { listingEntries } from './listing.mjs';
import { entityDescription, entityTitle, listingDescription, listingTitle, systemDescription, systemTitle } from './seo.js';

// Repeats the graph build's guard, so next build stops even on a graph built before the guard existed.
const checkRoutes = (graph) => {
  const nodes = Object.values(graph.nodes);
  const clashes = routeClashes({ kinds: [...Object.keys(KIND_LABELS), ...nodes.map((node) => node.kind)], nodes });
  if (clashes.length) throw new Error(`Wiki route clashes:\n${clashes.join('\n')}`);
};

const rowCounts = (graph) => listingCounts(Object.values(graph.nodes));

export const listingProps = (kind) => {
  const { columns, entries } = listingEntries(staticGraph().graph, kind);
  if (entries.length === 0) return { notFound: true };

  return {
    props: {
      page: 'listing',
      kind,
      entries,
      columns,
      seoTitle: listingTitle(kind),
      seoDescription: listingDescription(kind, entries.length)
    }
  };
};

// /wiki/<x>: every system with rows, then every listing whose URL no system page holds.
export const hubPaths = () => {
  const { graph } = staticGraph();
  checkRoutes(graph);
  const counts = rowCounts(graph);
  return [
    ...systemsWithRows(counts).map((system) => system.slug),
    ...LISTED_KINDS.filter((kind) => counts[kind] && !LISTING_SUFFIXES[kind])
  ].map((kind) => ({ params: { kind } }));
};

export const hubProps = (param) => {
  const system = systemBySlug(param);
  if (system) {
    const counts = rowCounts(staticGraph().graph);
    const listed = systemsWithRows(counts).find((other) => other.slug === param);
    if (!listed) return { notFound: true };
    return {
      props: {
        page: 'system',
        system: { label: system.label, slug: system.slug, group: system.group },
        kinds: listed.kinds.map((kind) => ({ kind, count: counts[kind] })),
        seoTitle: systemTitle(system),
        seoDescription: systemDescription(system, listed.kinds)
      }
    };
  }
  if (hasListing(param) && !LISTING_SUFFIXES[param]) return listingProps(param);
  return { notFound: true };
};

// /wiki/<kind>/<x>: every entity page, then the listings a system page moved one level down.
export const slugPaths = () => {
  const { graph } = staticGraph();
  checkRoutes(graph);
  const nodes = Object.values(graph.nodes);
  const counts = rowCounts(graph);
  // A static export has no fallback to fall back to: every page has to exist at build time.
  return [
    ...nodes.filter((node) => node.navigable !== false && node.slug).map(({ kind, slug }) => ({ kind, slug })),
    ...Object.entries(LISTING_SUFFIXES).filter(([kind]) => counts[kind]).map(([kind, slug]) => ({ kind, slug }))
  ].map((params) => ({ params }));
};

export const slugProps = (kind, slug) => {
  if (LISTING_SUFFIXES[kind] === slug) return listingProps(kind);

  const { bySlug } = staticGraph();
  const id = bySlug.get(`${kind}/${slug}`);
  if (!id) return { notFound: true };

  const slice = staticNeighbourhood(id);
  return {
    props: {
      page: 'entity',
      slice,
      seoTitle: entityTitle(slice.node),
      seoDescription: entityDescription(slice.node, slice.edges, id)
    }
  };
};
