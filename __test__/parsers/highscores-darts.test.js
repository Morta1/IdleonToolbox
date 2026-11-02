import { describe, expect, it } from 'vitest';
import { getDartsData } from '@parsers/highScores';

describe('darts upgrades', () => {
  // game: "}" is NotateNumber(1 + points / 100, "MultiplierInfo")
  it.each([[0, '1.00'], [7, '1.07'], [250, '3.50']])('%i Vault points make Vault upgrades %sx cheaper', (points, multi) => {
    const { upgrades } = getDartsData({ accountOptions: Object.assign([], { 437: points }) });
    expect(upgrades[2].description).toBe(`All_Vault_upgrades_are_${multi}x_Cheaper!`);
  });
});
