import { describe, expect, it } from 'vitest';
import { parseFixture } from '../helpers/parsed-fixtures';
import latest from '../fixtures/latest.json';
import { calcTesseractBonus, getOptimizedTesseractUpgrades } from '@parsers/class-specific/tesseract';
import { lavaLog } from '@utility/helpers';

// Singulon Hoarding (tesseract upgrade 12) multiplies Arcanist damage by lavaLog of the PURPLE
// tachyons you are holding, so paying for a purple-funded upgrade gives part of that bonus back.
// The optimizer has to price that in, or it recommends purchases that lower the user's damage.
const PURPLE_DAMAGE_UPGRADES = [0, 4, 6];

const buildScenario = (account, stash) => ({
  ...account,
  accountOptions: Object.assign([...account.accountOptions], { 388: stash }),
  tesseract: {
    ...account.tesseract,
    // only purple is spendable, so the optimizer must pick a purple-funded upgrade
    tachyons: account.tesseract.tachyons.map((tachyon, index) => ({ ...tachyon, value: index === 0 ? stash : 0 }))
  }
});

describe('upgrade optimizer: held-resource hoarding', () => {
  const { account, characters } = parseFixture(latest);
  const arcane = characters.find((character) => character?.class === 'Arcane_Cultist');
  const cheapestPurpleCost = Math.min(...PURPLE_DAMAGE_UPGRADES.map((index) => account.tesseract.upgrades[index].cost));
  const optimize = (stash) => getOptimizedTesseractUpgrades(arcane, buildScenario(account, stash), 'damage', 3, {
    getResourceType: (upgrade) => upgrade.x3,
    onlyAffordable: true
  });

  it('reports gross gain, hoarding loss and net gain that add up', () => {
    const rows = optimize(cheapestPurpleCost * 1e3);
    expect(rows.length).toBeGreaterThan(0);
    rows.forEach((row) => {
      row.statChanges.forEach((statChange) => {
        expect(statChange.hoardingPercentChange).toBeGreaterThan(0);
        expect(statChange.percentChange).toBeCloseTo(statChange.grossPercentChange - statChange.hoardingPercentChange, 10);
        expect(statChange.percentChange).toBeGreaterThan(0);
      });
    });
  });

  it('barely charges hoarding when the stash dwarfs the cost', () => {
    const [row] = optimize(cheapestPurpleCost * 1e6);
    expect(row).toBeDefined();
    const [statChange] = row.statChanges;
    expect(statChange.hoardingPercentChange).toBeLessThan(statChange.grossPercentChange / 100);
  });

  it('recommends nothing when spending would cost more damage than it gains', () => {
    // affordable, but each purchase loses more Singulon bonus than the upgrade adds
    const rows = optimize(cheapestPurpleCost * 10);
    expect(rows).toHaveLength(0);
    // and says why, so the UI can tell the user to hoard rather than "nothing found"
    expect(rows.stoppedReason).toBe('hoarding');
  });

  it('separates "cannot afford anything" from "should not buy anything"', () => {
    // a stash smaller than the real price leaves nothing to evaluate at all
    expect(optimize(cheapestPurpleCost * 1.05).stoppedReason).toBe('no-candidates');
  });

  describe('hold rates', () => {
    const singulon = account.tesseract.upgrades[12];
    const holdRatesFor = (stash, resourcePerHour) => getOptimizedTesseractUpgrades(arcane, buildScenario(account, stash), 'damage', 3, {
      getResourceType: (upgrade) => upgrade.x3,
      resourcePerHour
    }).holdRates;

    it('reports only the colors a damage hoarding upgrade reads', () => {
      expect(singulon.level).toBeGreaterThan(0);
      expect(holdRatesFor(1e10).map((rate) => rate.name)).toEqual(['Purple']);
    });

    it('prices a 10x stash at the Singulon bonus without RPH', () => {
      const [purple] = holdRatesFor(1e10);
      expect(purple.perHour).toBeNull();
      // a 10x stash is one lavaLog step (lavaLog divides by 2.30259, so not exactly 1) of the
      // Singulon bonus in the additive damage multiplier
      const bonus = calcTesseractBonus(account.tesseract.upgrades, 12, 0);
      const others = [4, 24, 31, 42, 53].reduce((sum, index) => sum + calcTesseractBonus(account.tesseract.upgrades, index, 0), 0);
      const multiplier = 1 + (bonus * lavaLog(1e10) + others) / 100;
      const step = lavaLog(1e11) - lavaLog(1e10);
      expect(purple.perTenfold).toBeCloseTo((bonus * step / 100) / multiplier * 100, 8);
    });

    it('gives a per hour rate from RPH that shrinks as the stash grows', () => {
      const small = holdRatesFor(1e6, { 0: 1e5 })[0].perHour;
      const big = holdRatesFor(1e9, { 0: 1e5 })[0].perHour;
      expect(small).toBeGreaterThan(0);
      expect(big).toBeLessThan(small);
    });

    it('is empty for the "all" category', () => {
      const rows = getOptimizedTesseractUpgrades(arcane, buildScenario(account, 1e10), 'all', 3, {});
      expect(rows.holdRates).toEqual([]);
    });
  });

  it('never recommends more upgrades as the stash shrinks', () => {
    const counts = [1e6, 1e3, 100, 10, 1.05].map((multiple) => optimize(cheapestPurpleCost * multiple).length);
    for (let i = 1; i < counts.length; i++) {
      expect(counts[i]).toBeLessThanOrEqual(counts[i - 1]);
    }
  });
});
