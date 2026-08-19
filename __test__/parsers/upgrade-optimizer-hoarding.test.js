import { describe, expect, it } from 'vitest';
import { parseFixture } from '../helpers/parsed-fixtures';
import latest from '../fixtures/latest.json';
import { getOptimizedTesseractUpgrades } from '@parsers/class-specific/tesseract';

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

  it('never recommends more upgrades as the stash shrinks', () => {
    const counts = [1e6, 1e3, 100, 10, 1.05].map((multiple) => optimize(cheapestPurpleCost * multiple).length);
    for (let i = 1; i < counts.length; i++) {
      expect(counts[i]).toBeLessThanOrEqual(counts[i - 1]);
    }
  });
});
