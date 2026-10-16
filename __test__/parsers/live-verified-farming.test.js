import '../../polyfills';
import { describe, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { unrounded, within } from '../helpers/live-verified';
import { getCropEvolution, getLandRank, getLandRankTotalBonus } from '@parsers/world-6/farming';

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
  exoticPurchasesAllowed: 18,
  // Read 2026-10-15, logged in as MortasNinth. The rank EXP a collect adds (N.js, the only FarmRank[1] write):
  // (1 + BasketUpgQTY(0, 7) / 100) * (1 + LankRankUpgBonus(2) * prevPlotRank / 100) * (1 + LandRankUpgBonusTOTAL(2) / 100),
  // here averaged over the plots. FarmingStuffs("PlotRankGain") is the screen-only stat it never reads.
  landRankExp: {
    rankBoostMarket: 354,
    soilExpBoost: 78.3719553450609,
    soilExpBoostAvgMulti: 141.02456021650883,
    soilExpSuperAndMegaboost: 2430.9776171820213
  }
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

  // The land ranks follow the logged-in character's DANK_RANKS, so they are read as MortasNinth sees them; the
  // breakdown itself uses the parse-time view, so its Soil Exp Boost line is compared per point of rank bonus
  it('land rank EXP from the market and the Soil Exp land ranks', () => {
    const game = GAME.landRankExp;
    const mortasNinth = characters.find(({ name }) => name === 'MortasNinth');
    const [market, soilExpBoost] = account.farming.stats.landRankExp.tree;
    within(market.value, 1 + game.rankBoostMarket / 100);
    within(getLandRank(account.farming.ranks, 2, characters, mortasNinth), game.soilExpBoost);
    within((soilExpBoost.value - 1) / getLandRank(account.farming.ranks, 2), (game.soilExpBoostAvgMulti - 1) / game.soilExpBoost);
    within(getLandRankTotalBonus(account, 2, characters, mortasNinth), game.soilExpSuperAndMegaboost);
  });

  it('crop evolution chance before the cap: shared base chance, scaled Crop Chapter and Cropius Mapper, GMO value, best Mass Irrigation', () => {
    Object.entries(GAME.cropEvolution).forEach(([plot, chance]) => {
      const { breakdown } = getCropEvolution(account, windWalker, account.farming.plot[plot], false, characters);
      within(unrounded(breakdown) / 100, chance);
    });
  });
});

// FarmingStuffs("MarketCostQTY", t, i) read 2026-10-16 for every day and night upgrade whose level matches latest.json
// (day 7 had levelled since the export): floored below 1e8, so the night market reads whole numbers.
describe('market costs verified against the live game', () => {
  const LIVE = {
    0: 636250484.7738575, 1: 19154025710.6113, 2: 21568617008.126713, 3: 16806862002.045643, 4: 11879583578.970945,
    5: 14110390908.2846, 6: 28833478893.62544, 8: 3, 9: 15671751, 10: 5605530, 11: 8235407, 12: 168634, 13: 24,
    14: 26564185, 15: 962354
  };
  it.each(Object.entries(LIVE))('market %s', (index, cost) => {
    within(account.farming.market[index].cost, cost);
  });
});
