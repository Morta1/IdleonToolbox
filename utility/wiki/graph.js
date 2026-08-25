export const indexGraph = (graph) => {
  const byId = graph.nodes;
  const edgesFrom = new Map();
  const edgesTo = new Map();
  for (const edge of graph.edges) {
    if (!edgesFrom.has(edge.from)) edgesFrom.set(edge.from, []);
    edgesFrom.get(edge.from).push(edge);
    if (!edgesTo.has(edge.to)) edgesTo.set(edge.to, []);
    edgesTo.get(edge.to).push(edge);
  }
  // Nodes that exist only to label a row, like Coin, are not destinations: keeping them out of the
  // search list also keeps them out of the category counts and the browse lists.
  const searchList = Object.entries(byId).filter(([, node]) => node.navigable !== false).map(([id, node]) => ({
    id,
    kind: node.kind,
    label: (node.name || node.rawName).replace(/_/g, ' '),
  }));
  return { byId, edgesFrom, edgesTo, searchList };
};
