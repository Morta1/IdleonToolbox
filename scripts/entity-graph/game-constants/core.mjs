import { gameTable } from '../registry/data.mjs';

// The client tables read before the wiki upkeep lanes. Each lane keeps its own in l1.mjs..l8.mjs beside this file, and
// ../game-constants.mjs merges them all. One literal read per table, so the game tables sweep (game-tables.test.js)
// sees each name.
export const READ = {
  cardLevelTiers: (data) => gameTable(data, 'cardLevelTiers'),
  carryCapacityBase: (data) => gameTable(data, 'carryCapacityBase'),
  formatBonuses: (data) => gameTable(data, 'formatBonuses'),
  gameLog: (data) => gameTable(data, 'gameLog'),
  notateNumber: (data) => gameTable(data, 'notateNumber')
};
