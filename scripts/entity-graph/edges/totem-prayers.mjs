import { isPlaceholderPrayer } from '../nodes/systems.mjs';

// Which Worship Totem unlocks which prayer, and at which wave.
//
// A prayer names its totem in `unlockZone`, spelled with spaces ("Goblin Gorefest"), while the
// totem pages carry the underscored name, so the join is the totem node's name. A prayer the game
// still marks as not unlockable has no wave to reach and gets no edge.
// UPKEEP: 999 is the game's "This Prayer is not unlockable yet" marker for unlockWave; those prayers still name a totem in unlockZone.
const NOT_UNLOCKABLE = 999;

export const totemPrayerEdges = (nodes, prayers) => {
  const totemByName = new Map(Object.entries(nodes || {})
    .filter(([, node]) => node.kind === 'totem')
    .map(([id, node]) => [node.name, id]));
  return (prayers || [])
    .filter((prayer) => prayer?.unlockWave !== NOT_UNLOCKABLE && !isPlaceholderPrayer(prayer) && totemByName.has(String(prayer?.unlockZone).replace(/ /g, '_')))
    .map((prayer) => ({
      from: totemByName.get(prayer.unlockZone.replace(/ /g, '_')),
      to: `prayer:Prayer${prayer.prayerIndex}`,
      rel: 'unlocks',
      meta: { wave: prayer.unlockWave },
      source: 'totems'
    }));
};
