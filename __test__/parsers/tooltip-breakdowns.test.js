import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseEmpty, parseFixture } from '../helpers/parsed-fixtures';
import { evaluateBreakdown, evaluateBreakdownNode, isBreakdownGroup } from '@parsers/breakdown';
import { getCropEvolution } from '@parsers/world-6/farming';
import { calcTotals, getAnvilTotalsBreakdowns } from '@parsers/world-1/anvil';
import { getBraveryEnemyHp } from '@parsers/world-5/caverns/bravery';

// The drawers that replaced the old hover lists. breakdown-totals.test.js rebuilds every value on every fixture and on the
// logged-out account; what is left here is what that sweep skips: display-only lists and the anvil key match.
describe('tooltip breakdowns (empty)', () => {
  const { account, characters } = parseEmpty();

  it('crop evolution is base chance * multipliers, capped and rounded', () => {
    (account.farming?.plot ?? []).forEach((crop) => {
      const { value, isLocked, breakdown } = getCropEvolution(account, characters?.[0], crop);
      if (isLocked) return expect(breakdown.combine).toBe('list');
      expect(evaluateBreakdown(breakdown)).toBe(value);
    });
  });
});

describe.each([['latest', () => parseFixture(latest)], ['empty', parseEmpty]])('tooltip breakdowns (%s)', (name, parse) => {
  const { account, characters } = parse();
  // The fixture must reach every branch, or a broken tree passes on empty data
  const populated = name === 'latest';

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
      expect(sneaking.itemsMaxLevelBreakdown.tree.map((node) => [node.name, evaluateBreakdownNode(node)]))
        .toEqual(sneaking.itemsMaxLevel.map(({ name, value }) => [name, value]));
      expect(sneaking.itemsMaxLevelBreakdown.tree.every(isBreakdownGroup)).toBe(true);
    }
  });
});
