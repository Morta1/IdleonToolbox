import { FORMULAS } from '@utility/wiki/effects.mjs';

// Lane L4 of the wiki upkeep extraction (Tasks 7a, 7b, 7c: Worlds 3 and 4).
// Its client tables, in the same two maps as core.js: what reads each one, and what that gives with the committed data.
// Hydrogen at level 9 sits below the atom floor, so the floor shows; meal level 1 is 12 x 1.25.
export const READS = {
  atomCost: () => [FORMULAS.affinePowFloor(9, { base: 2, perLevel: 1, rate: 1.35 })],
  mealCost: () => [FORMULAS.mealCost(1)],
  shrineHours: () => [FORMULAS.shrineHours(10)]
};

export const PRESENT = {
  atomCost: [163],
  mealCost: [15],
  shrineHours: [5053]
};
