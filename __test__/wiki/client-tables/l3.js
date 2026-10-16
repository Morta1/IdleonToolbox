import { FORMULAS } from '@utility/wiki/effects.mjs';

// Lane L3 of the wiki upkeep extraction (Tasks 6a, 6b, 6c: World 7 Spelunking, Research and Reef).
// Its client tables, in the same two maps as core.js: what reads each one, and what that gives with the committed data.
export const READS = {
  spelunkShopCost: () => [FORMULAS.spelunkShopCost(1, { base: 0.07, rate: 1.5, below: 1e5 })]
};
export const PRESENT = {
  spelunkShopCost: [7]
};
