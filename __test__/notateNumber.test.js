import { describe, expect, it } from 'vitest';
import { notateNumber } from '@utility/helpers';

/**
 * These are not invented expectations - every one was read back from the running game by calling
 * _customBlock_NotateNumber (N.js:68616) over the debug bridge. The toolbox prints these numbers
 * beside in-game ones, so the two have to agree character for character.
 */
describe('notateNumber matches the game', () => {
  // Each suffix covers three orders of magnitude, spending the spare digits on decimals.
  it.each([
    [592, '592'],
    [4010, '4.01K'],
    [27200, '27.2K'],
    [87400, '87.4K'],
    [500000, '500K'],
    [1240000, '1.24M'],
    [12400000, '12.4M'],
    [500000000, '500M'],
    [1.24e9, '1.24B'],
    [1.24e10, '12.4B'],
    [1.24e11, '124B'],
    [1.24e12, '1.24T'],
    [9.917e15, '9.92Q'],
    [1.08e16, '10.8Q'],
    [1.099e18, '1.1QQ'],
    [1.24e19, '12.4QQ'],
    [1.24e20, '124QQ']
  ])('notates %s as %s', (value, expected) => {
    expect(notateNumber(value, 'Big')).toBe(expected);
  });

  // The game never tests for "Big" either - it falls through to the same default ladder.
  it('treats Big and no style the same, as the game does', () => {
    for (const value of [4010, 1.24e9, 1.099e18]) {
      expect(notateNumber(value)).toBe(notateNumber(value, 'Big'));
    }
  });

  // Suffixes must roll over instead of running to four digits, which is what went wrong before:
  // a build rate of 1.099e18 printed as 1099Q while the game showed 1.1QQ.
  it('rolls the suffix over rather than printing four digits', () => {
    for (const value of [1.24e9, 1.24e12, 1.24e15, 1.24e18]) {
      expect(notateNumber(value, 'Big')).toMatch(/^\d{1,3}(\.\d{1,2})?[KMBTQ]+$/);
    }
  });

  // The game never passes a negative in, so neither does the port - it falls through to Math.floor
  // and prints raw. Callers with a signed value notate the magnitude and render the sign themselves,
  // which is what ConstructionStats does with its optimizer deltas.
  it('notates the magnitude callers hand it', () => {
    expect(notateNumber(Math.abs(-1.24e9), 'Big')).toBe('1.24B');
  });
});

/**
 * Same source, same method - every expectation below was read back from the running game, with the
 * trailing '#' dropped. That character is an in-game font glyph, not something to print on a page.
 */
describe('notateNumber MultiplierInfo matches the game', () => {
  it.each([
    [1e6, '1000000.00'],
    [1234567, '1.23M'],
    [2e6, '2.00M'],
    [2.1e6, '2.10M'],
    [2.5e6, '2.50M'],
    [1.5e9, '1500.00M']
  ])('notates %s as %s', (value, expected) => {
    expect(notateNumber(value, 'MultiplierInfo')).toBe(expected);
  });

  // A million itself is not past a million - the game's test is strict, so it keeps the long form.
  it('switches to M only above a million, not at it', () => {
    expect(notateNumber(1e6, 'MultiplierInfo')).toBe('1000000.00');
    expect(notateNumber(1e6 + 1, 'MultiplierInfo')).toMatch(/M$/);
  });

  // The suffix never rolls past M, however large the number gets.
  it('stays on M rather than moving to B', () => {
    expect(notateNumber(1.5e9, 'MultiplierInfo')).toBe('1500.00M');
  });
});
