export const craftEdges = (crafts) => {
  const edges = [];
  for (const recipe of Object.values(crafts)) {
    for (const material of recipe?.materials || []) {
      if (!recipe?.rawName || !material?.rawName) continue;
      edges.push({
        from: `item:${recipe.rawName}`,
        to: `item:${material.rawName}`,
        rel: 'craftedFrom',
        meta: { quantity: material.itemQuantity },
        source: 'crafts',
      });
    }
  }
  return edges;
};
