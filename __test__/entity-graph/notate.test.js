import { describe, it, expect } from 'vitest';
import { notateGame } from '../../utility/wiki/notate';
import GAME from '../../utility/wiki/game-constants.mjs';

// Every expectation here was read back from the running game by calling its own
// _customBlock_NotateNumber (ActorEvents_124) through the debug server, not derived by hand.
describe('notateGame, against the game', () => {
  it.each([
    [45, '45'],
    [600, '600'],
    // The K, M and B rungs.
    [1250, '1.25K'],
    [150000, '150K'],
    [600000, '600K'],
    [2500000, '2.5M'],
    [3750000, '3.75M'],
    [68900000, '68.9M'],
    [1160000000, '1.16B'],
    [40000000000, '40B'],
    // Ceil-based and changing divisor at every power of ten, not every three: 1.25M, not the 1.3M a
    // round-to-two-significant-figures scheme would give.
    [1250000, '1.25M'],
    // Spearfish's MonsterHPTotal is 1e23. The game prints 10E22, not 1E23, because its own log
    // divides by a truncated ln(10) and lands at 22.99997.
    [1e23, '10E22'],
    [1e22, '10E21'],
    [1e21, '10E20'],
    // Math.pow(10, 23) !== 1e23 in some engines, which produced 4.99E23 here while the game said
    // 5E23. The implementation parses the literal instead, so this is stable across browsers.
    [5e23, '5E23'],
    // Nothing to show for a missing or non-finite value.
    [null, ''],
    [undefined, ''],
    [Number.POSITIVE_INFINITY, ''],
    [Number.NaN, '']
  ])('notates %s as %j', (value, notated) => {
    expect(notateGame(value)).toBe(notated);
  });
});

// The oracle: _customBlock_NotateNumber's default arm from 100 up, verbatim (N.js:68764), with getLOG (N.js:68919).
const getLOG = (e) => Math.log(Math.max(e, 1)) / 2.30259;
const gameNotate = (e) => (1e3 > e ? '' + Math.floor(e) : 1e4 > e ? Math.ceil(e / 10) / 100 + 'K' : 1e5 > e ? Math.ceil(e / 100) / 10 + 'K'
  : 1e6 > e ? Math.ceil(e / 1e3) / 1 + 'K' : 1e7 > e ? Math.ceil(e / 1e4) / 100 + 'M' : 1e8 > e ? Math.ceil(e / 1e5) / 10 + 'M'
    : 1e9 > e ? Math.ceil(e / 1e6) / 1 + 'M' : 1e10 > e ? Math.ceil(e / 1e7) / 100 + 'B' : 1e11 > e ? Math.ceil(e / 1e8) / 10 + 'B'
      : 1e12 > e ? Math.ceil(e / 1e9) + 'B' : 1e13 > e ? Math.ceil(e / 1e10) / 100 + 'T' : 1e14 > e ? Math.ceil(e / 1e11) / 10 + 'T'
        : 1e15 > e ? Math.ceil(e / 1e12) + 'T' : 1e16 > e ? Math.ceil(e / 1e13) / 100 + 'Q' : 1e17 > e ? Math.ceil(e / 1e14) / 10 + 'Q'
          : 1e18 > e ? Math.ceil(e / 1e15) + 'Q' : 1e19 > e ? Math.ceil(e / 1e16) / 100 + 'QQ' : 1e20 > e ? Math.ceil(e / 1e17) / 10 + 'QQ'
            : 1e21 > e ? Math.ceil(e / 1e18) + 'QQ'
              : Math.floor((e / Math.pow(10, Math.floor(getLOG(e)))) * 100) / 100 + ('E' + Math.floor(getLOG(e))));

// The double right below `value`: from 1e16 up, `value - 1` is `value` itself.
const nextDown = (value) => {
  const bits = new BigInt64Array(new Float64Array([value]).buffer);
  bits[0] -= 1n;
  return new Float64Array(bits.buffer)[0];
};

describe('notateGame, at every rung of the ladder the game data gives', () => {
  const edges = GAME.notateNumber.big.flatMap(({ below }) => [nextDown(below), below]);
  it.each(edges)('notates %s as the game does', (value) => {
    expect(notateGame(value)).toBe(gameNotate(value));
  });
});

// The mantissa past the ladder is floored to the table's scale (GAME.notateNumber exponential), not a literal 100: a patch
// that prints three decimals reaches the wiki with no code change.
describe('notateGame past the ladder', () => {
  it.each([[100, '1.23E23'], [1000, '1.234E23']])('floors the mantissa to a scale of %s', (mantissaScale, notated) => {
    const table = GAME.notateNumber;
    GAME.notateNumber = { ...table, exponential: { mantissaScale } };
    try {
      expect(notateGame(1.2345e23)).toBe(notated);
    } finally {
      GAME.notateNumber = table;
    }
  });
});
