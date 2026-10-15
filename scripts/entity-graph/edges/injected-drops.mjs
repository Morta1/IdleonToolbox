import { isRealMonster } from '../nodes/monsters.mjs';
import { listAt } from '../registry/data.mjs';

// Drops the game adds to a monster at runtime rather than writing into its drop table, so
// monsterDrops.json never sees them. Both lists below are website-data; only the rule pairing a
// monster with its items is the game's code, cited where it is applied.

// The five random-event bosses (Fallen Meteor, Grumblo, Ice Guard, Snakenhotep, Grandfrogger).
// listIndexes.eventBosses is the boss roster and eventBossLoot + i is boss i's loot: N.js:106029 rolls
// each entry of that list once when the event ends, and N.js:93766 draws the same list as the
// event's reward panel. The odds are a code map (RandoMap) with no export, so the edge has none.
export const randomEventEdges = (randomList, monsters, data) => {
  const edges = [];
  (listAt(randomList, data, 'eventBosses') || []).forEach((boss, index) => {
    if (monsters && !isRealMonster(monsters[boss], boss)) return;
    for (const rawName of listAt(randomList, data, 'eventBossLoot', index) || []) {
      edges.push({ from: `monster:${boss}`, to: `item:${rawName}`, rel: 'drops', meta: { randomEvent: true }, source: 'injected-drops' });
    }
  });
  return edges;
};

// The Jade Emporium's Mob Cosplay Craze: "Certain monsters in World 6 will now have a rare chance to
// drop Ninja Hats, but only the ones you've found already from the Ninja Castle". N.js:80467 walks
// the fifteen Ninja Castle hats and splices hat e into the drop table of mob e in listIndexes.cosplayMobs.
//
// The code names the hat by arithmetic (EquipmentHats + 90 + e). The pairing here goes by name
// instead, Ninja Castle hat NjItem{e} to the cosmetic with the same display name, which reaches the
// same fifteen items and cannot silently drift onto a neighbour if the numbering moves.
export const ninjaHatEdges = (randomList, ninjaEquipment, items, monsters, data) => {
  const hatsByName = new Map();
  for (const [rawName, item] of Object.entries(items || {})) {
    if (/^EquipmentHats\d+$/.test(rawName) && item?.displayName) hatsByName.set(item.displayName, rawName);
  }
  const edges = [];
  (listAt(randomList, data, 'cosplayMobs') || []).forEach((mob, index) => {
    const hat = hatsByName.get(ninjaEquipment?.[`NjItem${index}`]?.name);
    if (!hat || (monsters && !isRealMonster(monsters[mob], mob))) return;
    edges.push({ from: `monster:${mob}`, to: `item:${hat}`, rel: 'drops', meta: { jadeUnlock: 'Mob Cosplay Craze' }, source: 'injected-drops' });
  });
  return edges;
};
