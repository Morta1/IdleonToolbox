import { describe, expect, it } from 'vitest';
import { formatDuration, formatNum, gameFill } from '@utility/helpers';

// Lane B of the Numbers board: each expected string is the board's suggested value for that number.
describe('formatNum', () => {
  it.each([
    [2.155e15, 'amount', {}, '2.16Q'],
    [-21146, 'amount', {}, '-21,146'],
    // The site's rule: below 1M a value shows its decimals, up to two, rounded; float noise is not a fraction.
    [1529.05, 'amount', {}, '1,529.05'],
    [12.5, 'amount', {}, '12.5'],
    [7.004, 'amount', {}, '7'],
    [999999.25, 'amount', {}, '999,999.25'],
    [1e6, 'amount', {}, '1M'],
    // Significant figures keep their zeros, at any size, and round on the value's own digits.
    [35e6, 'amount', { significant: 3 }, '35.0M'],
    [999.6e6, 'amount', { significant: 3 }, '1.00B'],
    [1.3176e62, 'amount', { significant: 3 }, '1.32e62'],
    [0.2, 'amount', { significant: 2 }, '0.20'],
    [0.00028, 'mult', { significant: 2 }, '0.00028x'],
    // What stays whole, as the game prints it: a cost, a requirement, a count.
    [362.4, 'whole', {}, '362'],
    [21146.5, 'whole', {}, '21,147'],
    [2.155e15, 'whole', {}, '2.16Q'],
    [5136748.17, 'mult', {}, '5.14Mx'],
    // The game rounds before it looks for trailing zeros (the board's step 0), and keeps them.
    [2.001, 'mult', {}, '2.00x'],
    [14, 'mult', {}, '14.00x'],
    [1529.05, 'mult', {}, '1,529.05x'],
    [1156.09, 'pct', {}, '1,156.09%'],
    [1234567, 'pct', {}, '1.24M%'],
    [144.45, 'pct', { signed: true }, '+144.45%'],
    // A very small value keeps two significant digits, and past that it is noise.
    [0.0012, 'pct', {}, '0.0012%'],
    [1e-12, 'amount', {}, '0'],
    [61080.25, 'rate', {}, '+61,080.25/hr'],
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

// A game sentence's fill: the mode only picks the short form from 1M up; whole keeps a cost or a count as the game prints it.
describe('gameFill', () => {
  it.each([
    [1877.53, 'Big', {}, '1,877.53'],
    [1e6, 'Big', {}, '1M'],
    [0.5, 'MultiplierInfo', {}, '0.50'],
    [1e6, 'MultiplierInfo', {}, '1000000.00'],
    [1e6, 'Comma', {}, '1,000,000'],
    [1e21, 'Comma', {}, '1,000,000,000T'],
    [1877.53, 'Big', { whole: true }, '1.88K'],
    [-1877.53, 'Comma', {}, '-1,877.53']
  ])('gameFill(%s, %s, %o) = %s', (value, mode, options, expected) => {
    expect(gameFill(value, mode, options)).toBe(expected);
  });
});

describe('formatDuration', () => {
  it.each([
    [2 * 86400 + 14 * 3600 + 27 * 60 + 22, '2d 14h'],
    [6.16e33 * 86400, '> 999d'],
    [0, 'Ready']
  ])('formatDuration(%s) = %s', (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected);
  });
});
