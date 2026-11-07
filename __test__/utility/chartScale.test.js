import { describe, expect, it } from 'vitest';
import { foldOther, isFlat, labelIndexes, valueTicks } from '@utility/chartScale';

describe('chartScale', () => {
  it.each([
    [[0, 41329], { min: 0, max: 60000, ticks: [0, 20000, 40000, 60000] }],
    [[15340, 17910], { min: 15000, max: 18000, ticks: [15000, 16000, 17000, 18000] }],
    [[3, 7, { integer: true }], { min: 2, max: 8, ticks: [2, 4, 6, 8] }],
    [[0, 0], { min: 0, max: 1, ticks: [0, 0.5, 1] }]
  ])('puts at most four clean ticks around %o', (args, expected) => {
    expect(valueTicks(...args)).toEqual(expected);
  });

  it('spreads labels, folds a long share into Other, and knows a flat series', () => {
    const rows = Array.from({ length: 13 }, (_, i) => ({ key: `r${i}`, value: 13 - i }));
    expect({
      labels: [labelIndexes(7, 8), labelIndexes(19, 4)],
      folded: foldOther(rows, 10).slice(9),
      kept: foldOther(rows.slice(0, 11), 10).length,
      flat: [isFlat([3, null, 3]), isFlat([3, 4]), isFlat([3])]
    }).toEqual({
      labels: [[0, 1, 2, 3, 4, 5, 6], [0, 6, 12, 18]],
      folded: [{ key: 'r9', value: 4 }, { key: 'other', other: true, count: 3, value: 6 }],
      kept: 11,
      flat: [true, false, false]
    });
  });
});
