import { isRealMonster } from '../nodes/monsters.mjs';

export const dropEdges = (monsterDrops, monsters) => {
  const edges = [];
  for (const [monsterRawName, drops] of Object.entries(monsterDrops)) {
    if (monsters && !isRealMonster(monsters[monsterRawName])) continue;
    for (const drop of drops) {
      if (!drop?.rawName) continue;
      // A chance of 0 never drops. 697 of these are the placeholder row the game writes for a
      // nested drop table's own slot ("COIN 0"), and rendering them listed Coin three times on a
      // monster that drops it once. The other 37 are disabled cards and materials.
      if (!(drop.chance > 0)) continue;
      // z-processing decodes an anvil recipe's packed id into the item it teaches. idleon.wiki
      // lists that item rather than the recipe, and pointing the edge there is what puts Sand
      // Giant on Dootjat Eye's own page: a generic "Novice Recipe" node links nobody to anything.
      const to = drop.recipeItem || drop.rawName;
      edges.push({
        from: `monster:${monsterRawName}`,
        to: `item:${to}`,
        rel: 'drops',
        // `chance` is the odds within the drop's own table; `effectiveChance` is per kill.
        // They are equal for direct drops, where dropTablePath is empty.
        meta: {
          chance: drop.chance,
          quantity: drop.quantity,
          // A talent book is one item rawName covering ~140 different books; the talent it teaches
          // is the only thing telling two of them apart, on screen and in the duplicate-edge pass.
          ...(drop.talentName ? { talentName: drop.talentName, talentLevel: drop.talentLevel } : {}),
          // The edge points at the item so the link is useful, but what drops is the recipe for it.
          // Without saying so the row reads as though the monster hands over a Dootjat Eye.
          ...(drop.recipeItem ? { recipe: true } : {}),
          effectiveChance: drop.effectiveChance,
          tableChance: drop.tableChance,
          dropTablePath: drop.dropTablePath,
        },
        source: 'drops',
      });
    }
  }
  return edges;
};
