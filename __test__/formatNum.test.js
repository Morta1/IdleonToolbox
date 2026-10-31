import { describe, expect, it } from 'vitest';
import { formatDuration, formatNum } from '@utility/helpers';

// Lane B of the Numbers board: each expected string is the board's suggested value for that number.
describe('formatNum', () => {
  it.each([
    [21146, 'amount', {}, '21,146'],
    [2.155e15, 'amount', {}, '2.16Q'],
    [-21146, 'amount', {}, '-21,146'],
    [5136748.17, 'mult', {}, '5.14Mx'],
    [19.21, 'mult', {}, '19.21x'],
    // The game rounds before it looks for trailing zeros (the board's step 0).
    [2.001, 'mult', {}, '2.00x'],
    [1156.09, 'pct', {}, '1.16K%'],
    [20945.04, 'pct', {}, '21K%'],
    [583.05, 'pct', {}, '583%'],
    [88.51, 'pct', {}, '88.5%'],
    [144.45, 'pct', { signed: true }, '+144%'],
    [-144.45, 'pct', { signed: true }, '-144%'],
    [6.51e31, 'rate', {}, '+6.51e31/hr'],
    [458, 'level', { max: 999999 }, 'Lv 458 / 999,999'],
    [145, 'level', { next: 146 }, 'Lv 145 · next 146'],
    [1 / 152, 'odds', {}, '1 in 152'],
    [1.123, 'mult', { precise: true }, '1.123x'],
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
