// An entity page ships only its own neighbourhood, not the whole graph. /wiki still lazy-loads the
// full entity-graph.json for search, but a routed page has no reason to: everything it renders is
// one hop away, and the slice is a few tens of KB against four megabytes.

// An NPC's Quests section renders each quest in full inline, which is a second hop: npc -> quest
// via gives, then quest -> item via rewards and requires. Nothing else in the panel reads past one
// hop. Both are small: no quest asks for more than three items or pays out more than three.
//
// hasShop is the third, and the reason shops need no catalog of their own: a town NPC reaches its
// shop through the map that hosts it, so the shop rides along in the NPC's slice and its crawl
// links. It costs nothing anywhere else, since only nine maps have a shop at all.
export const SECOND_HOP_RELS = new Set(['rewards', 'requires', 'hasShop']);

// Node payloads are the bulk of a page's JSON, and the far end of an edge only ever needs enough to
// draw a row: art, a name to print, a slug to link to, and whether it is a link at all.
// Every optional field coalesces to null rather than being left undefined. getStaticProps must
// return JSON and Next refuses undefined outright: quests carry no category, and that one missing
// field failed the export for all 3,466 pages.
export const slimNode = (node) => ({
  kind: node.kind,
  rawName: node.rawName,
  name: node.name,
  icon: node.icon ?? null,
  slug: node.slug ?? null,
  category: node.category ?? null,
  // ItemDisplay builds a tooltip from these, and the quest brief under an NPC's row is the
  // description, so both travel even for a neighbour.
  description: node.description ?? null,
  stats: node.stats ?? null,
  card: node.card ?? null,
  // An NPC renders each quest it gives in full, so a quest neighbour carries the two fields that
  // block reads. Both are quest-only and spread in conditionally: nothing else in the graph has
  // them, and the slice is shipped with every page.
  ...(node.difficulty != null ? { difficulty: node.difficulty } : {}),
  ...(node.objectives?.length ? { objectives: node.objectives } : {}),
  ...(node.navigable === false ? { navigable: false } : {})
});

// The focal node keeps every field it has, including the ones only its own page renders, but it
// has to survive the same serializer.
export const fullNode = (node) => {
  const out = {};
  for (const [key, value] of Object.entries(node)) out[key] = value === undefined ? null : value;
  return out;
};

// Collect the focal node's edges plus, for any quest it reaches, that quest's rewards.
export const entityNeighbourhood = (graph, id) => {
  const node = graph.nodes[id];
  if (!node) return null;

  const edges = graph.edges.filter((edge) => edge.from === id || edge.to === id);
  const firstHopIds = new Set(edges.map((edge) => (edge.from === id ? edge.to : edge.from)));

  const secondHop = graph.edges.filter((edge) => SECOND_HOP_RELS.has(edge.rel) && firstHopIds.has(edge.from));

  const nodes = {};
  for (const otherId of firstHopIds) {
    if (graph.nodes[otherId]) nodes[otherId] = slimNode(graph.nodes[otherId]);
  }
  for (const edge of secondHop) {
    if (graph.nodes[edge.to]) nodes[edge.to] = slimNode(graph.nodes[edge.to]);
  }
  nodes[id] = fullNode(node);

  return { id, node: nodes[id], nodes, edges: [...edges, ...secondHop] };
};

// The same shape indexGraph produces, so EntityPanel cannot tell which of the two it was handed.
export const pageIndex = ({ nodes, edges }) => {
  const edgesFrom = new Map();
  const edgesTo = new Map();
  for (const edge of edges) {
    if (!edgesFrom.has(edge.from)) edgesFrom.set(edge.from, []);
    edgesFrom.get(edge.from).push(edge);
    if (!edgesTo.has(edge.to)) edgesTo.set(edge.to, []);
    edgesTo.get(edge.to).push(edge);
  }
  return { byId: nodes, edgesFrom, edgesTo, searchList: [] };
};

export const entityHref = (node) => (node?.kind && node?.slug ? `/wiki/${node.kind}/${node.slug}` : null);
