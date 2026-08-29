import { NO_ENEMY } from './maps.mjs';

// A world holds its areas, and each row carries what someone opened the world for: the area's
// enemy and how many NPCs stand in it. One enemy per area is the game's own shape rather than a
// summary of it, since mapEnemiesArray is a single id per map slot.
//
// Read from the finished node set because the enemy's display name lives on the monster node,
// and because `catalog: false` is decided there.
export const worldEdges = (nodes = {}, { mapEnemiesArray, npcPlacements } = {}) => {
  const npcCounts = {};
  for (const maps of Object.values(npcPlacements || {})) {
    for (const mapIndex of maps || []) npcCounts[mapIndex] = (npcCounts[mapIndex] || 0) + 1;
  }

  const edges = [];
  for (const [id, node] of Object.entries(nodes)) {
    if (node.kind !== 'map') continue;
    // An area the atlas leaves out stays out of its world too. The nine the game never named are
    // reached from the real areas that connect to them, which is where they belong.
    if (node.catalog === false) continue;
    const world = /^World (\d+)$/.exec(node.category || '')?.[1];
    if (!world || !nodes[`world:${world}`]) continue;

    const enemy = (mapEnemiesArray || [])[Number(node.rawName)];
    const monster = enemy && !NO_ENEMY.has(enemy) ? nodes[`monster:${enemy}`] : null;
    edges.push({
      from: `world:${world}`,
      to: id,
      rel: 'contains',
      meta: { enemy: monster?.name || null, npcs: npcCounts[node.rawName] || 0 },
      source: 'worlds'
    });
  }
  return edges;
};
