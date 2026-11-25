import { isPlaceholderMap } from '../nodes/maps.mjs';

// The game marks "this map has no enemy" several ways, none of which is a monster id: 'Nothing' for
// towns and skilling areas, 'Z' for the unused slots padding each world's block of fifty, and
// 'Filler' for the placeholder it uses everywhere. 'JungleZ' is map 3 naming itself, an unfinished
// map, and occurs exactly once in the whole game bundle. Treating these as ids put 162 phantom
// entries in the unresolved report.
export const NO_ENEMY = new Set(['Nothing', 'Z', 'Filler', 'JungleZ']);

// The exits the game draws on a map (data/map-atlas.json), or null for a map the atlas has no picture of.
export const drawnExits = (atlas, index) => atlas?.[index]?.exits.map((exit) => String(exit.to)) ?? null;

// A listed destination no player can walk to (Spike Surprise, behind a hidden portal): both maps are drawn, and neither
// draws a way to the other. A secret passage draws only its way back.
export const isHiddenExit = (atlas, index, destination) => drawnExits(atlas, index)?.includes(String(destination)) === false
  && drawnExits(atlas, destination)?.includes(String(index)) === false;

// Where an NPC is listed and the game doesn't draw it, while it draws it on another map: Capital P in The Rift's challenge
// scene, and the main NPC of a boss or colosseum map. One the scene holds and hides stays (`hidden`).
const isMisplaced = (atlas, npc, mapIndex) => {
  const id = `npc:${npc}`;
  const draws = (entry) => entry.spots.some((spot) => spot.id === id);
  const entry = atlas[mapIndex];
  return Boolean(entry) && !draws(entry) && !entry.hidden?.includes(id) && Object.values(atlas).some(draws);
};

// Reads the same predicate mapNodes skips by, so an edge never leaves a map that has no node.
export const mapEdges = (shared, atlas = {}) => {
  const { mapEnemiesArray, mapMonsterCounts, mapPortalDestinations, npcPlacements } = shared || {};
  const dropped = (index) => isPlaceholderMap(index, shared);
  const edges = [];

  (mapEnemiesArray || []).forEach((enemy, index) => {
    if (!enemy || NO_ENEMY.has(enemy) || dropped(index)) return;
    edges.push({
      from: `map:${index}`,
      to: `monster:${enemy}`,
      rel: 'spawns',
      meta: { count: mapMonsterCounts?.[index] ?? null },
      source: 'maps'
    });
  });

  for (const [index, destinations] of Object.entries(mapPortalDestinations || {})) {
    if (dropped(index)) continue;
    for (const destination of destinations || []) {
      // A map listing itself would render as a portal to nowhere, and -1 is the game's "no
      // destination" marker rather than a map index.
      if (destination < 0 || String(destination) === String(index) || isHiddenExit(atlas, index, destination)) continue;
      edges.push({
        from: `map:${index}`,
        to: `map:${destination}`,
        rel: 'connectsTo',
        meta: {},
        source: 'maps'
      });
    }
  }

  // Doors, and the portals the game's list leaves out, for a pair of maps nothing joins yet. The way back is the same
  // pair: a map page lists it under Reachable from.
  const joined = new Set(edges.filter((edge) => edge.rel === 'connectsTo').flatMap(({ from, to }) => [`${from}>${to}`, `${to}>${from}`]));
  for (const index of Object.keys(atlas)) {
    for (const destination of dropped(index) ? [] : drawnExits(atlas, index)) {
      const [from, to] = [`map:${index}`, `map:${destination}`];
      if (joined.has(`${from}>${to}`)) continue;
      joined.add(`${from}>${to}`).add(`${to}>${from}`);
      edges.push({ from, to, rel: 'connectsTo', meta: {}, source: 'maps' });
    }
  }

  // Stored npc -> map because that is the shape z-processing derives, and the client indexes
  // edges both ways. An NPC can stand on more than one map: Clown appears in three towns.
  for (const [npc, mapIndexes] of Object.entries(npcPlacements || {})) {
    for (const mapIndex of mapIndexes || []) {
      if (isMisplaced(atlas, npc, mapIndex)) continue;
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
