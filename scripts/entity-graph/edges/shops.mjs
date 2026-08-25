// Stored shop -> item, the same direction as monster -> item drops, so the UI derives "Sold by" on
// the item side by reversing rather than storing a mirrored edge.
// A shop's display name is the town it sits in, so it matches a map name exactly - all nine land on
// a town index (Blunder Hills 0 through Shimmerfin Grove 300). The first index wins because
// mapNames repeats its placeholder entries, and no town name is among them.
const mapIndexesByName = (mapNames) => {
  const byName = new Map();
  for (const [index, name] of Object.entries(mapNames || {})) {
    if (!byName.has(name)) byName.set(name, index);
  }
  return byName;
};

export const shopEdges = (shops, mapNames) => {
  const edges = [];
  const byName = mapIndexesByName(mapNames);
  for (const [shopRawName, shop] of Object.entries(shops || {})) {
    const mapIndex = byName.get(shop?.name);
    if (mapIndex !== undefined) {
      edges.push({
        from: `map:${mapIndex}`,
        to: `shop:${shopRawName}`,
        rel: 'hasShop',
        meta: {},
        source: 'shops'
      });
    }
    for (const entry of shop?.items || []) {
      if (!entry?.rawName) continue;
      edges.push({
        from: `shop:${shopRawName}`,
        to: `item:${entry.rawName}`,
        rel: 'sells',
        meta: {},
        source: 'shops'
      });
    }
  }
  return edges;
};
