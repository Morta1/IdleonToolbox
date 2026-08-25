// The game marks "this map has no enemy" several ways, none of which is a monster id: 'Nothing' for
// towns and skilling areas, 'Z' for the unused slots padding each world's block of fifty, and
// 'Filler' for the placeholder it uses everywhere. 'JungleZ' is map 3 naming itself, an unfinished
// map, and occurs exactly once in the whole game bundle. Treating these as ids put 162 phantom
// entries in the unresolved report.
const NO_ENEMY = new Set(['Nothing', 'Z', 'Filler', 'JungleZ']);

export const mapEdges = ({ mapEnemiesArray, mapMonsterCounts, mapPortalDestinations, npcPlacements }) => {
  const edges = [];

  (mapEnemiesArray || []).forEach((enemy, index) => {
    if (!enemy || NO_ENEMY.has(enemy)) return;
    edges.push({
      from: `map:${index}`,
      to: `monster:${enemy}`,
      rel: 'spawns',
      meta: { count: mapMonsterCounts?.[index] ?? null },
      source: 'maps'
    });
  });

  for (const [index, destinations] of Object.entries(mapPortalDestinations || {})) {
    for (const destination of destinations || []) {
      // A map listing itself would render as a portal to nowhere, and -1 is the game's "no
      // destination" marker rather than a map index.
      if (destination < 0 || String(destination) === String(index)) continue;
      edges.push({
        from: `map:${index}`,
        to: `map:${destination}`,
        rel: 'connectsTo',
        meta: {},
        source: 'maps'
      });
    }
  }

  // Stored npc -> map because that is the shape z-processing derives, and the client indexes
  // edges both ways. An NPC can stand on more than one map: Clown appears in three towns.
  for (const [npc, mapIndexes] of Object.entries(npcPlacements || {})) {
    for (const mapIndex of mapIndexes || []) {
      edges.push({
        from: `map:${mapIndex}`,
        to: `npc:${npc}`,
        rel: 'hosts',
        meta: {},
        source: 'maps'
      });
    }
  }

  return edges;
};
