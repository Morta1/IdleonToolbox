// Build time only, like static-graph.mjs: getStaticPaths and getStaticProps import it dynamically.
// The three wiki routes each branch on what their params turn out to be, since two dynamic siblings can't coexist:
//   /wiki/<x>              a system page, a loose kind's listing, or a moved kind's old listing (a redirect)
//   /wiki/<x>/<y>          a system kind's listing, a loose kind's entity, or a moved kind's old entity URL (a redirect)
//   /wiki/<x>/<y>/<z>      a system kind's entity

import { staticGraph, staticNeighbourhood } from './static-graph.mjs';
import { KIND_LABELS } from './kind-labels.mjs';
import {
  LISTED_KINDS, MOVED_KINDS, SYSTEMS, entityPath, hasListing, kindAtSegment, listingCounts, listingHref, listingSegment,
  looseKindAt, movedListingHref, routeClashes, systemBySlug, systemOf, systemsWithRows
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

const pageNodes = (graph) => Object.values(graph.nodes).filter((node) => node.navigable !== false && node.slug);

// /wiki: the home's index, counted at build time so the export links every system and listing. The rail folds its
// groups shut, so these tiles are how a crawler reaches the categories.
export const wikiHomeProps = () => ({ props: { counts: rowCounts(staticGraph().graph) } });

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

const entityProps = (id) => {
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

// An old URL of a moved kind. The page carries the new page's title and description, so a link preview of the old
// URL still names the right page, and its canonical is the new URL.
const redirectProps = (to, seoTitle, seoDescription) => ({
  props: { page: 'redirect', to, seoTitle, seoDescription, seoCanonical: to }
});

// The old listings a redirect page keeps alive: a moved kind with rows whose old URL no system page now holds.
const movedListings = (counts) => MOVED_KINDS.filter((kind) => counts[kind] && movedListingHref(kind));

// /wiki/<x>: every system with rows, every loose listing, then the moved kinds' old listings.
export const hubPaths = () => {
  const { graph } = staticGraph();
  checkRoutes(graph);
  const counts = rowCounts(graph);
  return [
    ...systemsWithRows(counts).map((system) => system.slug),
    ...LISTED_KINDS.filter((kind) => counts[kind] && !systemOf(kind)).map((kind) => listingHref(kind).replace('/wiki/', '')),
    ...movedListings(counts)
  ].map((kind) => ({ params: { kind } }));
};

export const hubProps = (param) => {
  const counts = rowCounts(staticGraph().graph);
  const system = systemBySlug(param);
  if (system) {
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
  const loose = looseKindAt(param);
  if (loose && hasListing(loose)) return listingProps(loose);
  if (movedListings(counts).includes(param)) {
    return redirectProps(listingHref(param), listingTitle(param), listingDescription(param, counts[param]));
  }
  return { notFound: true };
};

// /wiki/<x>/<y>: every system kind's listing, every loose kind's entity, then the moved kinds' old entity URLs.
export const slugPaths = () => {
  const { graph } = staticGraph();
  checkRoutes(graph);
  const nodes = pageNodes(graph);
  const counts = rowCounts(graph);
  // A static export has no fallback to fall back to: every page has to exist at build time.
  return [
    ...SYSTEMS.flatMap((system) => system.kinds.filter((kind) => counts[kind])
      .map((kind) => ({ kind: system.slug, slug: listingSegment(kind) }))),
    ...nodes.filter((node) => !systemOf(node.kind)).map(({ kind, slug }) => ({ kind: entityPath(kind, slug).split('/')[2], slug })),
    ...nodes.filter((node) => MOVED_KINDS.includes(node.kind)).map(({ kind, slug }) => ({ kind, slug }))
  ].map((params) => ({ params }));
};

export const slugProps = (first, second) => {
  const listed = kindAtSegment(first, second);
  if (listed) return listingProps(listed);

  const loose = looseKindAt(first);
  const looseId = loose && staticGraph().bySlug.get(`${loose}/${second}`);
  if (looseId) return entityProps(looseId);

  const id = staticGraph().bySlug.get(`${first}/${second}`);
  if (!id || !MOVED_KINDS.includes(first)) return { notFound: true };
  const { node, edges } = staticNeighbourhood(id);
  return redirectProps(entityPath(first, second), entityTitle(node), entityDescription(node, edges, id));
};

// /wiki/<system>/<segment>/<slug>: every entity of a system kind.
export const entityPaths = () => {
  const { graph } = staticGraph();
  checkRoutes(graph);
  return pageNodes(graph)
    .filter((node) => systemOf(node.kind))
    .map(({ kind, slug }) => ({ params: { kind: systemOf(kind).slug, slug: listingSegment(kind), entity: slug } }));
};

export const entityPageProps = (system, segment, slug) => {
  const kind = kindAtSegment(system, segment);
  const id = kind && staticGraph().bySlug.get(`${kind}/${slug}`);
  return id ? entityProps(id) : { notFound: true };
};
