import { describe, it, expect } from 'vitest';
import { notateGame } from '../../utility/wiki/notate';

// Every expectation here was read back from the running game by calling its own
// _customBlock_NotateNumber (ActorEvents_124) through the debug server, not derived by hand.
describe('notateGame, against the game', () => {
  it.each([
    [45, '45'],
    // Ceil-based and changing divisor at every power of ten, not every three: 1.25M, not the 1.3M a
    // round-to-two-significant-figures scheme would give.
    [1250000, '1.25M'],
    // Spearfish's MonsterHPTotal is 1e23. The game prints 10e22, not 1e23, because its own log
    // divides by a truncated ln(10) and lands at 22.99997.
    [1e23, '10e22'],
    // Math.pow(10, 23) !== 1e23 in some engines, which produced 4.99e23 here while the game said
    // 5e23. The implementation parses the literal instead, so this is stable across browsers.
    [5e23, '5e23'],
    // Nothing to show for a missing or non-finite value.
    [null, ''],
    [Number.POSITIVE_INFINITY, ''],
    [Number.NaN, '']
  ])('notates %s as %j', (value, notated) => {
    expect(notateGame(value)).toBe(notated);
  });
});
