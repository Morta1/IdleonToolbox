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

// What the shop charges. N.js:67512 is the whole rule: BuyPrice is `4 * sellPrice * (1 - bribe)`,
// so four times the sell price is the price every player starts from and the Bribe only ever
// reduces it. A save-less page shows the base, the same call the craftable sell price makes.
const buyPrice = (rawName, items) => {
  const sellPrice = Number(items?.[rawName]?.sellPrice ?? 0);
  return sellPrice > 0 ? 4 * sellPrice : null;
};

export const shopEdges = (shops, mapNames, items = {}) => {
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
      const price = buyPrice(entry.rawName, items);
      edges.push({
        from: `shop:${shopRawName}`,
        to: `item:${entry.rawName}`,
        rel: 'sells',
        meta: price ? { price } : {},
        source: 'shops'
      });
    }
  }
  return edges;
};
