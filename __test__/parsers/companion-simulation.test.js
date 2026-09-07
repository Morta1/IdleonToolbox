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

// Game: m._customBlock_Stuff2("PetBonusTokensOwned")
//   Math.round(Math.min(1, opt[605]) + Math.min(1, opt[615]))
// and "PetBonusTokensLeft" subtracts opt[606].split(',').length when `"" != opt[606]`.
const tokenOptions = ({ o605, o615, o606 }) => {
  const accountOptions = [];
  if (o605 !== undefined) accountOptions[605] = o605;
  if (o615 !== undefined) accountOptions[615] = o615;
  if (o606 !== undefined) accountOptions[606] = o606;
  return accountOptions;
};

describe('getCompanions pet bonus tokens', () => {
  it('counts both token grants, not just opt[605]', () => {
    const { tokens } = getCompanions(ownedCompanionObject, tokenOptions({ o605: 1, o615: 1, o606: '' }));
    expect(tokens.owned).toBe(2);
    expect(tokens.remaining).toBe(2);
  });

  it('counts the opt[615] token on its own', () => {
    const { tokens } = getCompanions(ownedCompanionObject, tokenOptions({ o605: 0, o615: 1, o606: '' }));
    expect(tokens.owned).toBe(1);
  });

  it('caps each grant at one', () => {
    const { tokens } = getCompanions(ownedCompanionObject, tokenOptions({ o605: 5, o615: 3, o606: '' }));
    expect(tokens.owned).toBe(2);
  });

  it('handles a pre-patch save with no opt[615]', () => {
    const { tokens } = getCompanions(ownedCompanionObject, tokenOptions({ o605: 1, o606: '' }));
    expect(tokens.owned).toBe(1);
  });

  it('subtracts spent tokens from the remaining count', () => {
    const { tokens, list } = getCompanions(ownedCompanionObject, tokenOptions({ o605: 1, o615: 1, o606: '14' }));
    expect(tokens.used).toBe(1);
    expect(tokens.remaining).toBe(1);
    expect(list[14].viaToken).toBe(true);
  });

  it('treats the string "0" as a token spent on companion index 0', () => {
    const { tokens, list } = getCompanions(ownedCompanionObject, tokenOptions({ o605: 1, o615: 0, o606: '0' }));
    expect(tokens.used).toBe(1);
    expect(tokens.usedIndices).toEqual([0]);
    expect(tokens.remaining).toBe(0);
    expect(list[0].viaToken).toBe(true);
  });

  it('treats an untouched numeric 0 slot as no tokens spent', () => {
    const { tokens, list } = getCompanions(ownedCompanionObject, tokenOptions({ o605: 1, o615: 0, o606: 0 }));
    expect(tokens.used).toBe(0);
    expect(tokens.remaining).toBe(1);
    expect(list[0].viaToken).toBe(false);
  });
});
