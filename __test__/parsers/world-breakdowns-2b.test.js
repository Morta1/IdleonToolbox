import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { evaluateBreakdown, evaluateBreakdownNode } from '@parsers/breakdown';
import { getBitsMulti } from '@parsers/world-5/gaming';

// Top-level groups combine as the root says (product unless set); list groups are display only
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
  const { account, characters } = parseFixture(latest);

  it('sailing artifact find chance', () => {
    const boats = account.sailing.boats;
    expect(boats.length).toBeGreaterThan(0);
    boats.forEach(({ artifactChance }) => {
      const { rawValue, breakdown } = artifactChance;
      expect(breakdown.totalValue).toBe(artifactChance.value);
      expectRebuilds(breakdown, rawValue);
    });
  });

  it('villager EXP per hour', () => {
    const villagers = account.hole.villagers;
    expect(villagers.length).toBeGreaterThan(0);
    villagers.forEach(({ expRate }) => expectRebuilds(expRate.breakdown, expRate.value));
  });

  it('monument AFK bonus and hours required', () => {
    const { afkPercent } = account.hole.caverns.bravery;
    expectRebuilds(afkPercent.breakdown, afkPercent.value);
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

  it('gaming bit multi and palette luck', () => {
    const bits = getBitsMulti(account, characters);
    expectRebuilds(bits.breakdown, bits.value);
    const { paletteLuck } = account.gaming;
    expectRebuilds(paletteLuck.breakdown, paletteLuck.value);
  });

  it('emperor bonus multi', () => {
    const { bonusMulti } = account.emperor;
    expectRebuilds(bonusMulti, bonusMulti.totalValue);
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

  it('coral reef day gains', () => {
    const { reefDayGains } = account.coralReef;
    expectRebuilds(reefDayGains.breakdown, reefDayGains.value);
  });

  it('minehead currency per hour', () => {
    const { currencyGainBreakdown } = account.minehead;
    expectRebuilds(currencyGainBreakdown, currencyGainBreakdown.totalValue);
  });

  it('research EXP multi', () => {
    const { researchEXPmulti, researchEXPmultiBreakdown } = account.research;
    expectRebuilds(researchEXPmultiBreakdown, researchEXPmulti);
  });

  it('spelunking power, amber gain and stamina regen', () => {
    const { power, amberGain, staminaRegenRate } = account.spelunking;
    expectRebuilds(power.breakdown, power.value);
    expectRebuilds(amberGain.breakdown, amberGain.value);
    expectRebuilds(staminaRegenRate.breakdown, staminaRegenRate.value);
  });

  it('jelly operator bloodcell multi', () => {
    const { bloodcellMulti, bloodcellMultiBreakdown } = account.jellyOperator;
    expectRebuilds(bloodcellMultiBreakdown, bloodcellMulti);
  });
});
