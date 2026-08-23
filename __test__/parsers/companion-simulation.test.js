import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getCompanions, isCompanionBonusActive } from '@parsers/misc';

const ownedCompanionObject = { l: ['5,1'] };

describe('getCompanions simulation', () => {
  it('leaves every unowned companion alone without an override', () => {
    const { list } = getCompanions(ownedCompanionObject, []);
    expect(list.some((companion) => companion.simulated)).toBe(false);
    expect(list[5].acquired).toBe(true);
    expect(list[18].acquired).toBe(false);
  });

  it('marks simulated companions as acquired', () => {
    const { list } = getCompanions(ownedCompanionObject, [], [18]);
    expect(list[18].acquired).toBe(true);
    expect(list[18].simulated).toBe(true);
    expect(list[18].copies).toBe(0);
    expect(isCompanionBonusActive({ companions: { list } }, 18)).toBe(true);
  });

  it('does not flag an owned or token companion as simulated', () => {
    const accountOptions = [];
    accountOptions[606] = '30';
    const { list } = getCompanions(ownedCompanionObject, accountOptions, [5, 30]);
    expect(list[5].simulated).toBe(false);
    expect(list[30].simulated).toBe(false);
    expect(list[30].viaToken).toBe(true);
  });

  it('ignores malformed override entries', () => {
    const { list } = getCompanions(ownedCompanionObject, [], ['nope', null, -1, 1.5]);
    expect(list.some((companion) => companion.simulated)).toBe(false);
  });
});
