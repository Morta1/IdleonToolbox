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
    // One token owned, so the game keeps the one-entry list (2.3.540 wipes a list longer than the tokens owned)
    accountOptions[605] = 1;
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
  it.each([
    ['counts both token grants, not just opt[605]', { o605: 1, o615: 1 }, 2],
    ['counts the opt[615] token on its own', { o605: 0, o615: 1 }, 1],
    ['caps each grant at one', { o605: 5, o615: 3 }, 2],
    ['handles a pre-patch save with no opt[615]', { o605: 1 }, 1]
  ])('%s', (_label, grants, owned) => {
    const { tokens } = getCompanions(ownedCompanionObject, tokenOptions({ ...grants, o606: '' }));
    expect(tokens.owned).toBe(owned);
    expect(tokens.remaining).toBe(owned);
  });

  it.each([
    ['subtracts spent tokens from the remaining count', { o605: 1, o615: 1, o606: '14' }, [14], 1, 14, true],
    ['treats the string "0" as a token spent on companion index 0', { o605: 1, o615: 0, o606: '0' }, [0], 0, 0, true],
    ['treats an untouched numeric 0 slot as no tokens spent', { o605: 1, o615: 0, o606: 0 }, [], 1, 0, false],
    // 2.3.540: the game wipes opt[606] every 5s when it lists more companions than tokens owned
    ['ignores a list longer than the tokens owned', { o605: 1, o615: 0, o606: '14,22' }, [], 1, 14, false],
    ['ignores any list when no token is owned', { o605: 0, o615: 0, o606: '14' }, [], 0, 14, false]
  ])('%s', (_label, options, usedIndices, remaining, companionIndex, viaToken) => {
    const { tokens, list } = getCompanions(ownedCompanionObject, tokenOptions(options));
    expect(tokens.used).toBe(usedIndices.length);
    expect(tokens.usedIndices).toEqual(usedIndices);
    expect(tokens.remaining).toBe(remaining);
    expect(list[companionIndex].viaToken).toBe(viaToken);
  });
});
