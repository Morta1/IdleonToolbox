// A map that yields a resource rather than an enemy that drops one.
//
// Trapping is the clear case: trappingInfo pairs a map with the critter caught there, and until now
// none of the eleven critters had any source at all. Poison Froge and Jade Scarab reached their page
// with nothing pointing at them, because no drop table mentions a critter - the game hands it over
// when the trap is collected.
//
// The item is the critter's name plus A: trappingInfo says Critter1 and the item is Critter1A. The
// bare name is the trap's own node, which is not an item.
const critterItem = (critterName) => (critterName ? `item:${critterName}A` : null);

export const harvestEdges = (trappingInfo) => {
  const edges = [];
  for (const entry of trappingInfo || []) {
    const to = critterItem(entry?.critterName);
    if (!to || entry?.mapId == null) continue;
    edges.push({
      from: `map:${entry.mapId}`,
      to,
      rel: 'harvests',
      // The efficiency a trap needs before the map yields anything, which is the one number a
      // player checks before walking there.
      meta: entry.efficiencyReq > 0 ? { efficiencyReq: entry.efficiencyReq } : {},
      source: 'harvests'
    });
  }
  return edges;
};
