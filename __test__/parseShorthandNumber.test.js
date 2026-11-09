import { describe, expect, it } from 'vitest';
import { parseShorthandNumber } from '../utility/helpers';

describe('parseShorthandNumber', () => {
  it.each([
    // Exactly three digits after one separator, one to three before it: thousands, in either notation.
    ['1,234', 1234],
    ['123,456', 123456],
    ['1.234', 1234],
    ['123.456', 123456],
    // The bug this guards: 123,000 is 123000, never 123.
    ['123,000', 123000],
    ['123.000', 123000],
    // Four digits before it: that same group is decimals.
    ['1234,567', 1234.567],
    ['1234.567', 1234.567],
    // One or two digits after it: decimals.
    ['12,5', 12.5],
    ['123,45', 123.45],
    ['12.5', 12.5],
    ['123.45', 123.45],
    // Four or more after it: a separator left behind while typing into a formatted number ('131,313' + '3').
    ['131,3133', 1313133],
    ['131.3133', 1313133],
    // The same separator repeated is thousands; with both, the last one is the decimal.
    ['1,234,567', 1234567],
    ['1.234.567', 1234567],
    ['1,234,567.89', 1234567.89],
    ['1.234.567,89', 1234567.89],
    ['1234567', 1234567],
    // Suffixes, past q a repeated q
    ['1.5k', 1500],
    ['1m', 1e6],
    ['1b', 1e9],
    ['1t', 1e12],
    ['1q', 1e15],
    ['1qq', 1e18],
    ['1qqqq', 1e24],
    ['-1.5k', -1500],
    ['1.234k', 1234000],
    ['1.234,5m', 1234500000],
    // Game notation past the suffixes: the game prints 3.2e12 (LargeE prints a capital E).
    ['3.2e12', 3.2e12],
    ['1.5E3', 1500],
    ['1,000e3', 1e6],
    // Whitespace is only in the way of the suffix; currency signs and extra minus signs in front are stripped, and so is a
    // percent sign at the end. Anything else in the number makes it no number, never a guess.
    [' 1k ', 1000],
    ['€1.234', 1234],
    ['--123', 123],
    ['5-a0', NaN],
    ['abc', NaN],
    ['', NaN],
    [123, NaN]
  ])('parses %j as %d', (input, expected) => {
    expect(parseShorthandNumber(input)).toBe(expected);
  });
});
