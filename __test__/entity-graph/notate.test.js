import { describe, it, expect } from 'vitest';
import { notateGame } from '../../utility/wiki/notate';

// Every expectation here was read back from the running game by calling its own
// _customBlock_NotateNumber (ActorEvents_124) through the debug server, not derived by hand.
describe('notateGame, against the game', () => {
  it('leaves small numbers alone', () => {
    expect(notateGame(45)).toBe('45');
    expect(notateGame(600)).toBe('600');
  });

  it('matches the game across the K, M and B rungs', () => {
    expect(notateGame(1250)).toBe('1.25K');
    expect(notateGame(150000)).toBe('150K');
    expect(notateGame(600000)).toBe('600K');
    expect(notateGame(2500000)).toBe('2.5M');
    expect(notateGame(3750000)).toBe('3.75M');
    expect(notateGame(68900000)).toBe('68.9M');
    expect(notateGame(1160000000)).toBe('1.16B');
    expect(notateGame(40000000000)).toBe('40B');
  });

  // The ladder is ceil-based and changes divisor at every power of ten, not every three, so this
  // is 1.25M and not the 1.3M a round-to-two-significant-figures scheme would give.
  it('is ceil-based per power of ten', () => {
    expect(notateGame(1250000)).toBe('1.25M');
  });

  // Spearfish's MonsterHPTotal is 1e23. The game prints 10E22, not 1E23, because its own log
  // divides by a truncated ln(10) and lands at 22.99997.
  it('reproduces the game exponent, truncated-ln quirk and all', () => {
    expect(notateGame(1e23)).toBe('10E22');
    expect(notateGame(1e22)).toBe('10E21');
    expect(notateGame(1e21)).toBe('10E20');
  });

  // Math.pow(10, 23) !== 1e23 in some engines, which produced 4.99E23 here while the game said
  // 5E23. The implementation parses the literal instead, so this is stable across browsers.
  it('does not depend on the engine Math.pow', () => {
    expect(notateGame(5e23)).toBe('5E23');
  });

  it('has nothing to show for a missing or non-finite value', () => {
    expect(notateGame(null)).toBe('');
    expect(notateGame(undefined)).toBe('');
    expect(notateGame(Number.POSITIVE_INFINITY)).toBe('');
    expect(notateGame(Number.NaN)).toBe('');
  });
});
