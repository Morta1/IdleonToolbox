export const resolveEdges = (nodes, rawEdges, { aliases, ignore }) => {
  const edges = [];
  const unresolved = [];
  for (const rawEdge of rawEdges) {
    const from = aliases[rawEdge.from] || rawEdge.from;
    const to = aliases[rawEdge.to] || rawEdge.to;
    const fromIgnored = ignore.has(from);
    const toIgnored = ignore.has(to);
    // An ignored id suppresses the edge but must not suppress the OTHER endpoint's existence
    // check: a monster whose only drop is a coin would otherwise never be reported missing, and
    // the unresolved report is the whole early-warning system for a game patch renaming things.
    // The ignored id itself is never checked, since it is deliberately not a node.
    if (fromIgnored || toIgnored) {
      const other = fromIgnored ? (toIgnored ? null : to) : from;
      if (other && !nodes[other]) {
        unresolved.push({ id: other, source: rawEdge.source, from, to, rel: rawEdge.rel });
      }
      continue;
    }
    const missing = !nodes[from] ? from : (!nodes[to] ? to : null);
    if (missing) {
      unresolved.push({ id: missing, source: rawEdge.source, from, to, rel: rawEdge.rel });
      continue;
    }
    edges.push({ from, to, rel: rawEdge.rel, meta: rawEdge.meta });
  }
  return { edges, unresolved };
};
