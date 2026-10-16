// Lane L6 of the wiki upkeep extraction (Tasks 9a, 9b, 10a, 10b: World 6).
// Its client tables, in the same two maps as core.js: what reads each one, and what that gives with the committed data.
import { FORMULAS } from '@utility/wiki/effects.mjs';

const linear = { formula: 'linear', args: { perLevel: 3.5 } };

export const READS = {
  ninjaItemStat: () => [
    FORMULAS.ninjaGloveStat(0, { base: 1 }),
    FORMULAS.ninjaWeaponStat(1, { base: 10 }),
    FORMULAS.ninjaWeaponStat(111, { base: 10 }),
    FORMULAS.charmStat(50, { base: 8, scale: 13 }),
    FORMULAS.charmStatMulti(0, { base: 8, scale: 13 })
  ],
  detectionDec: () => [FORMULAS.zeroDetectionStealth(2, linear)]
};

export const PRESENT = {
  ninjaItemStat: [2.5, 12.3, 6761107965.720221, 13.68421052631579, 1.08],
  detectionDec: [70]
};
