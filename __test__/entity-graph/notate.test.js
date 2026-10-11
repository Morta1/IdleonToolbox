import { describe, it, expect } from 'vitest';
import { notateGame } from '../../utility/wiki/notate';

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
