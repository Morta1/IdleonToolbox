import { describe, expect, it } from 'vitest';
import { cashFormatter, commaNotation, GAME_LN10, notateNumber, notateProgress } from '@utility/helpers';
import GAME from '@utility/wiki/game-constants.mjs';

/**
 * These are not invented expectations - every one was read back from the running game by calling
 * _customBlock_NotateNumber (N.js:68770) over the debug bridge. The toolbox prints these numbers
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

  // The one deliberate difference: the game prints NaNEInfinity, which a Bits bubble's cost reaches past ~Lv 1000.
  it('prints an infinite value as ∞ in every style', () => {
    expect([notateNumber(Infinity, 'Big'), notateNumber(Infinity), notateNumber(Infinity, 'bits')]).toEqual(['∞', '∞', '∞']);
  });

  // The game spells the mode Bits; the Gaming pages pass bits. Both reach the same arm (Big would print 12.4K).
  it('reads the game spelling of Bits', () => {
    expect([notateNumber(12345, 'Bits'), notateNumber(12345, 'bits')]).toEqual(['12.3K', '12.3K']);
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
    [1.5e9, '1500.00M'],
    // The game rounds before it checks for trailing zeros, so a value just off a whole number keeps its .00
    [1.0001, '1.00'],
    [9.9999, '10.00'],
    [2.501, '2.50'],
    [19.21, '19.21']
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

/**
 * The cash multiplier label has its own M and B bands before handing off to NotateNumber. The E
 * values were read back from the running game; there is no QQQ tier, which the toolbox once invented.
 */
describe('cashFormatter matches the game', () => {
  it.each([
    [5e6, '5.00M'],
    [1.234e7, '12.3M'],
    [1.234e10, '12.3B'],
    [1.5e14, '150000B'],
    [2.5e16, '25Q'],
    [9.99e20, '999QQ'],
    [1e21, '10e20'],
    [9.713e22, '9.71e22'],
    [1.0179e35, '1.01e35'],
    [4.2e150, '4.2e150']
  ])('formats %s as %s', (value, expected) => {
    expect(cashFormatter(value)).toBe(expected);
  });
});

// 2.3.540: the default exponent prints a lowercase 'e'; the new 'LargeE' mode keeps the capital.
// Read back live: NotateNumber(1.234e25, 'Big') = "1.23e25", NotateNumber(1.234e25, 'LargeE') = "1.23E25".
describe('notateNumber exponent letter', () => {
  it.each([
    ['Big', '1.23e25'],
    [undefined, '1.23e25'],
    ['LargeE', '1.23E25'],
    ['TinyE', '1.2e25']
  ])('mode %s prints %s', (mode, expected) => {
    expect(notateNumber(1.234e25, mode)).toBe(expected);
  });
});

// The table z-processing reads from N.js is the oracle: a game update that moves the ladder changes the table and fails
// here, instead of the port drifting from the game.
describe('notateNumber against the game table', () => {
  const { small, big, exponential } = GAME.notateNumber;
  // The double right below `value`: from 1e16 up, `value - 1` is `value` itself.
  const nextDown = (value) => {
    const bits = new BigInt64Array(new Float64Array([value]).buffer);
    bits[0] -= 1n;
    return new Float64Array(bits.buffer)[0];
  };
  const prints = (mode, rows) => [rows.map(([value]) => String(notateNumber(value, mode))), rows.map(([, print]) => print)];

  it('walks both edges of every rung', () => {
    const rows = big.flatMap(({ below, divisor, scale, suffix }, at) => [at ? big[at - 1].below : small.floorBelow, nextDown(below)]
      .map((value) => [value, `${Math.ceil(value / divisor) / scale}${suffix}`]));
    const [port, game] = prints('Big', rows);
    expect(port).toEqual(game);
  });

  it('walks the arm below the ladder', () => {
    const { hundredthsBelow, tenthsBelow, floorBelow } = small;
    const [port, game] = prints('Small', [
      [hundredthsBelow / 2 - 0.006, String(Math.round(100 * (hundredthsBelow / 2 - 0.006)) / 100)],
      [hundredthsBelow, String(Math.round(10 * hundredthsBelow) / 10)],
      [tenthsBelow - 0.26, String(Math.round(10 * (tenthsBelow - 0.26)) / 10)],
      [tenthsBelow + 0.9, String(Math.floor(tenthsBelow + 0.9))],
      [floorBelow - 0.5, String(Math.floor(floorBelow - 0.5))]
    ]);
    expect(port).toEqual(game);
  });

  it('walks the tail past the ladder', () => {
    const tail = (value) => {
      const power = Math.floor(Math.log(value) / GAME.gameLog.divisor);
      return `${Math.floor((value / Number(`1e${power}`)) * exponential.mantissaScale) / exponential.mantissaScale}${exponential.letter}${power}`;
    };
    const [port, game] = prints('Big', [big.at(-1).below, 1.2345e23, 5e23, 4.2e150].map((value) => [value, tail(value)]));
    expect([GAME_LN10, port]).toEqual([GAME.gameLog.divisor, game]);
  });
});

// A progress amount must never read as its target: the game's ladder rounds up, so it floors to the digits shown first
it.each([
  [9997104, '9.99M'],
  [1e7, '10M'],
  [999999, '999K'],
  [1999, '1.99K'],
  [592, '592'],
  [12345678, '12.3M']
])('notateProgress(%s) = %s', (value, expected) => {
  expect(notateProgress(value)).toBe(expected);
});

// From 1e39 the QQ digits themselves go to e notation, which the grouping cut into 2,.77,777,...e,+56QQ (Tome Overview).
it.each([
  [1234567, '1,234,567'],
  [2.7777777777777774e74, '2.77e74']
])('commaNotation(%s) = %s', (value, expected) => {
  expect(commaNotation(value)).toBe(expected);
});
