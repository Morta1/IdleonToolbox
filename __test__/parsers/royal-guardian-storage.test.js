import { describe, expect, it } from 'vitest';
import { parseFixture } from '../helpers/parsed-fixtures';
import latest from '../fixtures/latest.json';

// Past about 1e43 the game saves some stored resource amounts as text ("6.051609923136365e+43") beside plain numbers.
// The Armory's cost line took the raw text as an unknown amount and dropped its "have /" and its colour.
describe('royalGuardian.resourceStorage', () => {
  it('reads every stored amount as a number, the ones the save keeps as text included', () => {
    const saved = JSON.parse(latest.data.RoyalG)[1];
    const { account } = parseFixture(latest);
    expect(saved.some((amount) => typeof amount === 'string')).toBe(true);
    expect(account.royalGuardian.resourceStorage).toEqual(saved.map((amount) => Number(amount) || 0));
  });
});
