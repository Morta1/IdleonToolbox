import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { evaluateBreakdown, evaluateBreakdownNode } from '@parsers/breakdown';

// breakdown-totals.test.js rebuilds every breakdown; these pin the extras: stored display values,
// list groups, the jar tier count and the farming rounding. Top-level groups combine as the root says.
const rebuild = (breakdown) => evaluateBreakdown(breakdown);

const top = (breakdown, name) => breakdown.tree.find((node) => node.name === name);

const expectRebuilds = (breakdown, value) => {
  expect(breakdown.tree, breakdown.statName).toBeDefined();
  expect(breakdown.categories).toBeUndefined();
  const rebuilt = rebuild(breakdown);
  if (value === 0) expect(rebuilt).toBe(0);
  else expect(rebuilt / value, breakdown.statName).toBeCloseTo(1, 9);
};

describe('world 5-7 breakdowns rebuild their value', () => {
  const { account } = parseFixture(latest);

  it('sailing artifact find chance', () => {
    const boats = account.sailing.boats;
    expect(boats.length).toBeGreaterThan(0);
    boats.forEach(({ artifactChance }) => {
      const { rawValue, breakdown } = artifactChance;
      expect(breakdown.totalValue).toBe(artifactChance.value);
      expectRebuilds(breakdown, rawValue);
    });
  });

  it('monument AFK bonus and hours required', () => {
    const { afkPercent } = account.hole.caverns.bravery;
    expectRebuilds(afkPercent.breakdown, 1 + afkPercent.effectiveValue / 100);
    expect(afkPercent.effectiveValue).toBeCloseTo(((1 + afkPercent.value / 100) * afkPercent.multi - 1) * 100, 9);
    ['bravery', 'justice', 'wisdom'].forEach((cavern) => {
      const req = account.hole.caverns[cavern].monumentAfkReq;
      if (!req) return;
      const [hoursPerCharacter] = req.tree;
      expect(hoursPerCharacter.combine).toBe('list');
      expect(hoursPerCharacter.children[0].value).toBe(req.totalValue);
    });
  });

  it('the jars', () => {
    const { rupieValue, perHour, jars } = account.hole.caverns.theJars;
    expectRebuilds(rupieValue.breakdown, rupieValue.value);
    expectRebuilds(perHour.breakdown, perHour.value);
    const { enchant } = jars[4];
    expectRebuilds(enchant.breakdown, enchant.value);
    expect(top(enchant.breakdown, 'Chance per jar tier').children).toHaveLength(enchant.tiers.length);
  });

  it('farming stats', () => {
    const { stats, maxTimes } = account.farming;
    ['growthSpeed', 'ogChance', 'landRankExp', 'magicBean'].forEach((key) => {
      expectRebuilds(stats[key], stats[key].totalValue);
    });
    expect(maxTimes[0].breakdown).toBe(stats.growthSpeed);

    const { cropsOnVine, cropValue } = stats;
    expect(cropsOnVine.categories).toBeUndefined();
    expect(rebuild(cropsOnVine)).toBe(cropsOnVine.totalValue);
    // The uncapped group is rounded, and the lower of it and the cap wins
    expect(evaluateBreakdownNode(top(cropValue, 'Uncapped'))).toBe(Math.round(evaluateBreakdownNode(top(cropValue, 'Uncapped'))));
    expect(rebuild(cropValue)).toBe(cropValue.totalValue);
  });
});
