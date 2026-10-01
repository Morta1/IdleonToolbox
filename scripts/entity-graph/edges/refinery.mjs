// What each Refinery salt consumes per cycle. Shaped like craftedFrom (product -> ingredient) but a
// relation of its own: a salt is never smithed, and "Crafted from" would send a reader to the anvil.
//
// The quantity is the rank-one cost. It grows with the salt's rank (rank^1.5, or rank^1.3 for a
// salt ingredient once the salt task is done), which a save-less page cannot know.
//
// FillerMaterial is a real item row the game uses to pad unfinished recipes ("Not_Yet"), so it
// would resolve and print as an ingredient of Anionic Salt; it is skipped by name.
const PLACEHOLDER = 'FillerMaterial';

export const refineryEdges = (refinery) => {
  const edges = [];
  for (const [saltRawName, salt] of Object.entries(refinery || {})) {
    for (const cost of salt?.cost || []) {
      if (!cost?.rawName || cost.rawName === PLACEHOLDER) continue;
      edges.push({
        from: `item:${saltRawName}`,
        to: `item:${cost.rawName}`,
        rel: 'refinedFrom',
        meta: cost.quantity > 0 ? { quantity: Number(cost.quantity) } : {},
        source: 'refinery'
      });
    }
  }
  return edges;
};
