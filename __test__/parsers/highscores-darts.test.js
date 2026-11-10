import { describe, expect, it } from 'vitest';
import { getDartsData } from '@parsers/highScores';

describe('darts upgrades', () => {
  // game: "}" is NotateNumber(1 + points / 100, "MultiplierInfo")
  it('7 Vault points make Vault upgrades 1.07x cheaper', () => {
    const { upgrades } = getDartsData({ accountOptions: Object.assign([], { 437: 7 }) });
    expect(upgrades[2].description).toBe('All_Vault_upgrades_are_1.07x_Cheaper!');
  });
});
