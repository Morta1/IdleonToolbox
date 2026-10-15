import { FORMULAS } from '@utility/wiki/effects.mjs';

// Lane L7 of the wiki upkeep extraction (Tasks 11a, 11b: account, Worlds 1 and 2).
// Its client tables, in the same two maps as core.js: what reads each one, and what that gives with the committed data.
export const READS = {
  // A Common item's L21 (formulas.test.js pins the live costs).
  dungeonRngUpgCost: () => [FORMULAS.dungeonRngCost(20, { scale: 5 })]
};
export const PRESENT = {
  dungeonRngUpgCost: [6265]
};
