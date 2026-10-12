import '../../polyfills';
import { describe, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { unrounded, within } from '../helpers/live-verified';
import { getCropEvolution } from '@parsers/world-6/farming';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr (Wind Walker).
// latest.json is that account's save (OptionsListAccount[340] matches). Caches were rebuilt first
// (calcEtcBonuses, TalentCalc(-2), PaletteBonus(-1)).
const GAME = {
  // FarmingStuffs("GrowthRate"), and NextOGchance(plot) / 0.4^(OG + 1)
  farmingGrowth: 153756.64629688626,
  farmingOgMulti: 544.601486631657,
  // FarmingStuffs("NextCropChance", plot), a fraction far past the cap
  cropEvolution: { 0: 3.365518958801564e126, 2: 3.384100683750271e126, 6: 5.576744227697781e126, 26: 1.953307862699778e126, 35: 1.93472613775107e126 },
  // Read 2026-10-12, logged in as MortasNinth; equinox clouds 0-35 and 37 completed, OptionsListAccount[193] = 0.
  // FarmingStuffs("ExoticPurchasesAllowed"): sushi RoG 33 and equinox cloud 66 feed it
  exoticPurchasesAllowed: 18
};

const { account, characters } = parseFixture(latest);
const windWalker = characters.find(({ name }) => name === 'IAmTheHunterrr');

describe('farming verified against the live game', () => {
  it('exotic market purchases per week', () => {
    expect(account.farming.exoticMarkeMaxPurchases).toBe(GAME.exoticPurchasesAllowed);
  });

  it('growth speed and OG chance multiplier', () => {
    within(account.farming.stats.growthSpeed.totalValue, GAME.farmingGrowth, 1e-6);
    within(account.farming.stats.ogChance.totalValue, GAME.farmingOgMulti, 1e-6);
  });

  it('crop evolution chance before the cap: shared base chance, scaled Crop Chapter and Cropius Mapper, GMO value, best Mass Irrigation', () => {
    Object.entries(GAME.cropEvolution).forEach(([plot, chance]) => {
      const { breakdown } = getCropEvolution(account, windWalker, account.farming.plot[plot], false, characters);
      within(unrounded(breakdown) / 100, chance);
    });
  });
});
