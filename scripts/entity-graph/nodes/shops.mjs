// Shops are keyed by a numeric index in shared-data, so the index IS the rawName. The display name
// is the town the shop sits in; two of them were unnamed until z-processing's shopMapping was
// extended, so fall back to the index rather than rendering "undefined".
//
// The town name is also how a shop learns its world: it matches a map name exactly, and a map's
// world is its index in blocks of fifty. Without it the nine shops carry no category and the
// listing has nothing to band them by.
const mapIndexesByName = (mapNames) => {
  const byName = new Map();
  for (const [index, name] of Object.entries(mapNames || {})) {
    if (!byName.has(name)) byName.set(name, index);
  }
  return byName;
};

export const shopNodes = (shops, mapNames) => {
  const byName = mapIndexesByName(mapNames);
  const nodes = {};
  for (const [rawName, shop] of Object.entries(shops || {})) {
    const mapIndex = byName.get(shop?.name);
    nodes[`shop:${rawName}`] = {
      kind: 'shop',
      rawName,
      name: shop?.name || `Shop ${rawName}`,
      icon: null,
      category: mapIndex === undefined ? null : `World ${Math.floor(Number(mapIndex) / 50) + 1}`
    };
  }
  return nodes;
};
