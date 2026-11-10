import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getMenagerieCost } from '@parsers/world-7/menagerie';
import { expectNoBreaks } from '../helpers/sweep';

// game: MenagerieStuff "CostExponent", copied verbatim as the oracle (the parser reads it from gameTables)
const costExponentOracle = (i) => ['8', '10', '12'].includes('' + i) ? 35 : ['17', '5', '2'].includes('' + i) ? 22.8
  : 6 == i ? 3.5 : ['0', '1', '7'].includes('' + i) ? 2.1 : 1.3;
// game: MenagerieStuff "Cost", type 2 (a boost row at its level)
const boostCostOracle = (i, level) => 3 * level + Math.pow(level, 1.5)
  + (5 + Math.pow(i, 1.5)) * Math.pow(Math.max(1.45, 2.25 + (i / 4) * -0.15), i) * Math.pow(costExponentOracle(i), level);

describe('Menagerie boost cost', () => {
  const rows = Array.from({ length: 20 }, (_, i) => i);
  const account = { menagerieSave: [[], [], [], rows.map(() => 3)] };

  it('every row at level 3 uses its cost exponent', () => {
    expectNoBreaks(rows, (row) => `row ${row}`, (row) => {
      const cost = getMenagerieCost(account, 2, row);
      const expected = boostCostOracle(row, 3);
      return Math.abs(cost / expected - 1) < 1e-12 ? [] : [`${cost} instead of ${expected}`];
    });
  });
});
