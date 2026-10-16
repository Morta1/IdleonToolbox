import { FORMULAS } from '@utility/wiki/effects.mjs';

// Lane L5 of the wiki upkeep extraction (Tasks 8a, 8b, 8c: World 5).
// Its client tables, in the same two maps as core.js: what reads each one, and what that gives with the committed data.
export const READS = {
  // Opal Find at levels 1 and 9: floored to at least 1 below a million, the fraction kept past it.
  cglunkoUpgradeCost: () => [FORMULAS.scaledPowPlusLevelFloor(1, { scale: 1, rate: 7.5 }), FORMULAS.scaledPowPlusLevelFloor(9, { scale: 1, rate: 7.5 })]
};

export const PRESENT = {
  cglunkoUpgradeCost: [8, 75084695.27929688]
};
