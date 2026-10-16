import { cardTiers, FORMULAS, starterBundleCapacity } from '@utility/wiki/effects.mjs';
import { notateGame } from '@utility/wiki/notate';

// The client tables read before the wiki upkeep lanes: what reads each one (READS) and what that gives with the
// committed data (PRESENT). Each lane keeps the same two maps for its own tables in l1.js..l8.js beside this file, and
// formulas.test.js merges them all.
const linear = { formula: 'linear', args: { perLevel: 3.5 } };

export const READS = {
  cardLevelTiers: () => [cardTiers()],
  carryCapacityBase: () => [starterBundleCapacity()],
  formatBonuses: () => [FORMULAS.formatBonuses(10, { ...linear, func: 'add', x2: 0 }), FORMULAS.familyBonus(15, { func: 'add', x1: 2, x2: 0, offset: 10 })],
  gameLog: () => [notateGame(5e23)],
  notateNumber: () => [FORMULAS.notateBig(10, linear), FORMULAS.notateSmall(10, linear), notateGame(1250)]
};

export const PRESENT = {
  cardLevelTiers: [{ bonus: [0, 1, 2, 3, 4, 5, 6], requirement: [0, 1, 2, 3, 4, 5] }],
  carryCapacityBase: [1000],
  formatBonuses: [35, 10],
  gameLog: ['5E23'],
  notateNumber: [35, 35, '1.25K']
};
