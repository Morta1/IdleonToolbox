import { describe, expect, it } from 'vitest';
import { formatDuration, formatNum } from '@utility/helpers';

// Lane B of the Numbers board: each expected string is the board's suggested value for that number.
describe('formatNum', () => {
  it.each([
    [21146, 'amount', {}, '21,146'],
    [2.155e15, 'amount', {}, '2.16Q'],
    [-21146, 'amount', {}, '-21,146'],
    // The site's rule: below 1M a value shows its decimals, up to two, rounded; float noise is not a fraction.
    [3.59, 'amount', {}, '3.59'],
    [1529.05, 'amount', {}, '1,529.05'],
    [12.5, 'amount', {}, '12.5'],
    [7.004, 'amount', {}, '7'],
    [999999.25, 'amount', {}, '999,999.25'],
    [1e6, 'amount', {}, '1M'],
    // What stays whole, as the game prints it: a cost, a requirement, a count.
    [362.4, 'whole', {}, '362'],
    [21146.5, 'whole', {}, '21,147'],
    [2.155e15, 'whole', {}, '2.16Q'],
    [5136748.17, 'mult', {}, '5.14Mx'],
    [19.21, 'mult', {}, '19.21x'],
    // The game rounds before it looks for trailing zeros (the board's step 0), and keeps them.
    [2.001, 'mult', {}, '2.00x'],
    [14, 'mult', {}, '14.00x'],
    [1529.05, 'mult', {}, '1,529.05x'],
    [153756.65, 'mult', {}, '153,756.65x'],
    [1.93e21, 'mult', {}, '1.93e21x'],
    [1156.09, 'pct', {}, '1,156.09%'],
    [6395.65, 'pct', {}, '6,395.65%'],
    [583.05, 'pct', {}, '583.05%'],
    [88.51, 'pct', {}, '88.51%'],
    [5.5, 'pct', {}, '5.5%'],
    [1234567, 'pct', {}, '1.24M%'],
    [144.45, 'pct', { signed: true }, '+144.45%'],
    [-144.45, 'pct', { signed: true }, '-144.45%'],
    // A very small value keeps two significant digits, and past that it is noise.
    [0.0012, 'pct', {}, '0.0012%'],
    [1e-12, 'amount', {}, '0'],
    [61080.25, 'rate', {}, '+61,080.25/hr'],
    [6.51e31, 'rate', {}, '+6.51e31/hr'],
    [458, 'level', { max: 999999 }, 'Lv 458 / 999,999'],
    [145, 'level', { next: 146 }, 'Lv 145 · next 146'],
    [1 / 152, 'odds', {}, '1 in 152'],
    [1.123, 'mult', { precise: true }, '1.123x'],
    // Decimals: a fixed count, so a column's values line up (the guild list's vs last week).
    [15, 'pct', { decimals: 1 }, '15.0%'],
    // Precise keeps two significant digits under 0.01, so a small real gain never prints as 0.
    [0.0012, 'pct', { precise: true }, '0.0012%'],
    // Bare: the game's own sentence carries the % or the x.
    [88.51, 'pct', { bare: true }, '88.51'],
    [4.99, 'price', {}, '$4.99'],
    [1234.5678, 'exact', {}, '1,234.568'],
    // Past about 9e12 ThreeDecimals' 1000 * x passes 2^53: no decimal is real
    [12345678901234.5, 'exact', {}, '12,345,678,901,235'],
    [undefined, 'amount', {}, '-']
  ])('formatNum(%s, %s, %o) = %s', (value, kind, options, expected) => {
    expect(formatNum(value, kind, options)).toBe(expected);
  });
});

describe('formatDuration', () => {
  it.each([
    [2 * 86400 + 14 * 3600 + 27 * 60 + 22, '2d 14h'],
    [6 * 86400 + 3600, '6d 1h'],
    [6.16e33 * 86400, '> 999d'],
    [0, 'Ready']
  ])('formatDuration(%s) = %s', (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected);
  });
});
