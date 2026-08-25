// IDs that are deliberately not entities (currencies, pseudo-drops).
// Populated during Task 5 triage.
export const ignore = new Set([
  // Quest XP payouts, not items. These reward entries carry only `rawName` +
  // `amount` and no `name`, and the index is the skill (0 = class XP, 1+ = skills).
  'item:Experience0',
  'item:Experience1',
  'item:Experience2',
  'item:Experience3',
  'item:Experience4',
  'item:Experience5',
  'item:Experience6',

  // Bonus drop bucket rolled when a giant mob dies (gem + time candies), not an enemy.
  'monster:GiantMobzz69',

  // Legacy drop-table key for the W1 boss. Not in monsters.json; its table matches
  // wolfA (Amarok) apart from one slot, and every item it lists is also on wolfA.
  'monster:GrasslandsBoss',

  // Legacy drop-table key for the W6 boss. Not in monsters.json; its table is
  // identical to Boss6A/Boss6B/Boss6C (Emperor), which do resolve.
  'monster:Boss6',

  // Padding rows in the game's own MonsterDrops table, not enemies. Each key occurs
  // exactly once in all of N.js (the drop table itself) and carries a single joke
  // payload: [["COIN", "0.5", "69", "N/A"]].
  'monster:frogFiller1',
  'monster:frogFiller1b',
  'monster:frogFiller1d',
  'monster:frogFiller3de',
  'monster:frogFiller3fd',
  'monster:frogFiller3drt',
  'monster:frogFiller3ed',

  // Dead drop-table keys, not the real Birch Tree. Each occurs exactly once in N.js
  // while BirchTree occurs 29 times with its own 15-row chopping table. These two list
  // Frog_Leg, which no tree drops, and Frog_Leg already has 17 real sources (frogG plus
  // every BugNest), so nothing is lost.
  'monster:BirchTree2',
  'monster:BirchTree3',
]);
