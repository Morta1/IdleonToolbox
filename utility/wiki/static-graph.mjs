// Build-time only. getStaticPaths and getStaticProps run 3,466 times between them, and a naive
// implementation would scan all 6,900 edges on every one of those calls. The graph is read once
// per worker process and indexed once, so a page costs a map lookup rather than a full scan.

import fs from 'fs';
import path from 'path';
// One definition of a node payload, shared with the runtime helper: two copies drifted once
// already, and the drift only showed up as a failed export.
import { fullNode, slimNode, SECOND_HOP_RELS } from './page-graph.js';

let cached = null;

export const staticGraph = () => {
  if (cached) return cached;

  const file = path.join(process.cwd(), 'data', 'entity-graph.json');
  const graph = JSON.parse(fs.readFileSync(file, 'utf-8'));

  const edgesById = new Map();
  const push = (id, edge) => {
    if (!edgesById.has(id)) edgesById.set(id, []);
    edgesById.get(id).push(edge);
  };
  for (const edge of graph.edges) {
    push(edge.from, edge);
    if (edge.to !== edge.from) push(edge.to, edge);
  }

  const bySlug = new Map();
  for (const [id, node] of Object.entries(graph.nodes)) {
    if (node.navigable === false) continue;
    bySlug.set(`${node.kind}/${node.slug}`, id);
  }

  cached = { graph, edgesById, bySlug };
  return cached;
};

// Same slice entityNeighbourhood produces, off the prebuilt index rather than a scan.
export const staticNeighbourhood = (id) => {
  const { graph, edgesById } = staticGraph();
  const node = graph.nodes[id];
  if (!node) return null;

  const edges = edgesById.get(id) || [];
  const firstHopIds = new Set(edges.map((edge) => (edge.from === id ? edge.to : edge.from)));

  const secondHop = [];
  for (const otherId of firstHopIds) {
    for (const edge of edgesById.get(otherId) || []) {
      if (SECOND_HOP_RELS.has(edge.rel) && edge.from === otherId) secondHop.push(edge);
    }
  }

  const nodes = {};
  for (const otherId of firstHopIds) if (graph.nodes[otherId]) nodes[otherId] = slimNode(graph.nodes[otherId]);
  for (const edge of secondHop) if (graph.nodes[edge.to]) nodes[edge.to] = slimNode(graph.nodes[edge.to]);
  nodes[id] = fullNode(node);

  return { id, node: nodes[id], nodes, edges: [...edges, ...secondHop] };
};
