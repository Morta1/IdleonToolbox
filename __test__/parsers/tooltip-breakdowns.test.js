import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseEmpty, parseFixture } from '../helpers/parsed-fixtures';
import { evaluateBreakdown, evaluateBreakdownNode, findBreakdownNode, isBreakdownGroup } from '@parsers/breakdown';
import { getCropEvolution } from '@parsers/world-6/farming';
import { getExaltedStampBonus, getStampsPerDay } from '@parsers/world-1/stamps';
import { getPrinterMulti } from '@parsers/world-3/printer';
import { getRefineryCycles } from '@parsers/world-3/refinery';
import { getDoubleGoldenFoodDrop, getDoubleStatueDrop } from '@parsers/misc';
import { getGildedBoostioBonus, getTrimmedBuildSpeed } from '@parsers/world-3/construction';
import { calcTotals, getAnvilTotalsBreakdowns } from '@parsers/world-1/anvil';
import { getBraveryEnemyHp } from '@parsers/world-5/caverns/bravery';

// The drawers that replaced the old hover lists: each tree must rebuild the value the page shows
const product = (breakdown) => breakdown.tree.reduce((total, node) => total * evaluateBreakdownNode(node), 1);

// breakdown-totals.test.js rebuilds these on every fixture; it never sees the logged-out account
describe('tooltip breakdowns (empty)', () => {
  const { account, characters } = parseEmpty();

  it('every bell exp rate is base * multipliers', () => {
    const bells = account.hole?.caverns?.theBell?.bells ?? [];
    bells.forEach(({ expRate }) => {
      expect(product(expRate.breakdown)).toBeCloseTo(expRate.value, 9);
    });
  });

  it('crop evolution is base chance * multipliers, capped and rounded', () => {
    (account.farming?.plot ?? []).forEach((crop) => {
      const { value, isLocked, breakdown } = getCropEvolution(account, characters?.[0], crop);
      if (isLocked) return expect(breakdown.combine).toBe('list');
      expect(evaluateBreakdown(breakdown)).toBe(value);
    });
  });

  it('stamps per day and the exalted multi', () => {
    const perDay = getStampsPerDay(account);
    expect(evaluateBreakdown(perDay.breakdown)).toBe(perDay.value);
    const exalted = getExaltedStampBonus(account);
    expect(evaluateBreakdown(exalted.breakdown)).toBeCloseTo(1 + exalted.value / 100, 9);
  });

  it('liquid capacity is base * multipliers, rounded up', () => {
    (account.alchemy?.liquidCauldrons ?? []).forEach(({ maxLiquid, maxLiquidBreakdown }) => {
      expect(evaluateBreakdown(maxLiquidBreakdown)).toBe(maxLiquid);
    });
  });

  it('equinox fill rate', () => {
    const { equinox } = account;
    if (!equinox?.unlocked) return;
    expect(evaluateBreakdown(equinox.breakdown)).toBe(equinox.chargeRate);
    expect(Number.isFinite(findBreakdownNode(equinox.breakdown.tree, 'Penguins').value)).toBe(true);
  });

  it('printer multi and every sample', () => {
    const { value, breakdown } = getPrinterMulti(account, characters);
    expect(evaluateBreakdown(breakdown)).toBe(value);
    (account.printer ?? []).flat().forEach((slot) => {
      expect(product(slot.breakdown)).toBeCloseTo(slot.boostedValue, 6);
    });
  });

  it('refinery cycles are the base time over the speed', () => {
    const { cycles } = getRefineryCycles(account, characters, Date.now());
    cycles.forEach(({ time, breakdown }) => {
      expect(evaluateBreakdown(breakdown)).toBe(time);
    });
  });

  it('double statue and golden food drop chances', () => {
    [getDoubleStatueDrop(account, characters?.[0], characters), getDoubleGoldenFoodDrop(account)]
      .forEach(({ value, breakdown }) => expect(evaluateBreakdown(breakdown)).toBeCloseTo(value, 9));
  });
});

describe.each([['latest', () => parseFixture(latest)], ['empty', parseEmpty]])('tooltip breakdowns (%s)', (name, parse) => {
  const { account, characters } = parse();
  // The fixture must reach every branch, or a broken tree passes on empty data
  const populated = name === 'latest';

  it('legend points owned', () => {
    const pointsOwned = account.legendTalents?.pointsOwned;
    if (!pointsOwned) return;
    expect(Math.round(evaluateBreakdown(pointsOwned.breakdown))).toBe(pointsOwned.value);
  });

  it('trimmed build speed is the build speed * the gilded boostio multi', () => {
    const { value, breakdown } = getTrimmedBuildSpeed(account);
    expect(product(breakdown)).toBe(value);
    expect(value).toBe(getGildedBoostioBonus(account) * (account?.construction?.totalBuildRate ?? 0));
  });

  it('anvil totals are the sum of every character producing them', () => {
    const totals = calcTotals(account, characters);
    const breakdowns = getAnvilTotalsBreakdowns(account, characters);
    expect(Object.keys(breakdowns)).toEqual(Object.keys(totals));
    if (populated) expect(Object.keys(totals).length).toBeGreaterThan(0);
    Object.entries(totals).forEach(([rawName, perHour]) => {
      expect(evaluateBreakdown(breakdowns[rawName])).toBe(perHour);
    });
  });

  it('the info lists keep one line per entry', () => {
    const hps = account.hole?.caverns?.bravery;
    if (hps?.hpsBreakdown) {
      expect(hps.hpsBreakdown.tree.map(({ value }) => value)).toEqual(hps.hps.map(({ value }) => value));
      const firstLevel = Number(hps.hps[0].name.replace('Level ', ''));
      expect(hps.hps.map(({ name }) => name)).toEqual(hps.hps.map((_, i) => `Level ${firstLevel + i}`));
      expect(hps.hps[0].value).toBeGreaterThan(hps.damage.min);
      if (firstLevel > 1) expect(getBraveryEnemyHp(firstLevel - 1)).toBeLessThanOrEqual(hps.damage.min);
    }
    const sneaking = account.sneaking;
    if (sneaking?.itemsMaxLevelBreakdown) {
      expect(sneaking.itemsMaxLevelBreakdown.tree.map(({ name, value }) => [name, value]))
        .toEqual(sneaking.itemsMaxLevel.map(({ name, value }) => [name, value]));
      expect(sneaking.itemsMaxLevelBreakdown.tree.some(isBreakdownGroup)).toBe(false);
    }
  });
});
