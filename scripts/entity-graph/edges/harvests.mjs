// A map that yields a resource rather than an enemy that drops one.
//
// Trapping is the clear case: trappingInfo pairs a map with the critter caught there, and no drop
// table mentions a critter - the game hands it over when the trap is collected.
//
// Every map yields two critters, the plain one and its shiny. trappingInfo names the plain one
// (Critter1) and shinyCritterOf names the shiny item. The efficiencyReq is the bonus
// threshold above which the map pays extra critters: below it the trap still catches the base one.
// UPKEEP: a critter's shiny item is its name plus A (Critter1 and Critter1A); re-check on a game patch.
export const shinyCritterOf = (critterName) => `${critterName}A`;

const edge = (mapId, to, meta) => ({ from: `map:${mapId}`, to, rel: 'harvests', meta, source: 'harvests' });

export const harvestEdges = (trappingInfo) => {
  const edges = [];
  for (const entry of trappingInfo || []) {
    if (!entry?.critterName || entry?.mapId == null) continue;
    edges.push(
      edge(entry.mapId, `item:${entry.critterName}`, entry.efficiencyReq > 0 ? { efficiencyReq: entry.efficiencyReq } : {}),
      edge(entry.mapId, `item:${shinyCritterOf(entry.critterName)}`, entry.shinyChance > 0 ? { shinyChance: entry.shinyChance } : {})
    );
  }
  return edges;
};
