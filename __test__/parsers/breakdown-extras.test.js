import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { evaluateBreakdown, evaluateBreakdownNode } from '@parsers/breakdown';
import { getKrukBubblesDaily, getUpgradeableBubbles, getVialMultiplier } from '@parsers/world-2/alchemy';
import { getVoteBallot } from '@parsers/world-2/voteBallot';
import { getShinyChanceInfo, getTrapsBonuses } from '@parsers/world-3/traps';
import { calcBreedabilityMulti, calcShinyLvMulti } from '@parsers/world-4/breeding';
import { calcDailyRibbons } from '@parsers/world-4/cooking';
import { getExtraDust } from '@parsers/class-specific/compass';
import { getExtraBonesBonus } from '@parsers/class-specific/grimoire';
import { getExtraTachyon, getPrismaMulti } from '@parsers/class-specific/tesseract';
import { getPortalProgressBreakdown } from '@parsers/class-specific/speedrun';

// breakdown-totals.test.js rebuilds every breakdown on every save and skips what a root marks display only. These pin
// what it cannot see: the root combine, hand-built inputs no fixture reaches, display-only lists and the rounding.

const expectRebuilt = (breakdown, combine, value) => {
  expect(breakdown.combine ?? 'product').toBe(combine);
  if (value === 0) {
    expect(evaluateBreakdown(breakdown)).toBeCloseTo(0, 9);
    return;
  }
  expect(evaluateBreakdown(breakdown) / value).toBeCloseTo(1, 9);
};

const top = (breakdown, name) => breakdown.tree.find((node) => node.name === name);

const COMBINES = [
  ['vial multiplier', 'product', (account) => [getVialMultiplier(account).breakdown]],
  ['upgradeable bubbles', 'sum', (account, characters) => [getUpgradeableBubbles(account, characters).breakdown]],
  ['kruk bubbles daily', 'sum', (account) => [getKrukBubblesDaily(account).breakdown]],
  ['vote and meritocracy multis', 'product', ({ voteBallot }) => [voteBallot.voteMultiBreakdown, voteBallot.meritocracyMultBreakdown]],
  ['shiny critter chance', 'product', (account, characters) => characters.map((character) => getShinyChanceInfo(account, characters, character).breakdown)],
  ['breedability and shiny level multis', 'product', (account, characters) => [calcBreedabilityMulti(account, characters).breakdown, calcShinyLvMulti(account, characters).breakdown]],
  ['cooking mastery exp rate', 'product', ({ cooking }) => [cooking.cookingMastery.expRateBreakdown]],
  ['daily ribbons', 'sum', ({ cooking }) => {
    const daily = calcDailyRibbons(cooking.cookingMastery.dailyRibbons);
    return [daily.countBreakdown, daily.rankBreakdown];
  }],
  ['kitchen meal and fire speed', 'product', ({ cooking }) => cooking.kitchens.flatMap(({ mealSpeedBreakdown, fireSpeedBreakdown }) => [mealSpeedBreakdown, fireSpeedBreakdown])],
  ['storage slots', 'sum', ({ storage }) => [storage.slots.breakdown]],
  ['upgrade vault cost reduction', 'product', ({ upgradeVault }) => [upgradeVault.costReduction.breakdown]],
  ['extra dust, bones and tachyon', 'product', (account, characters) => characters.flatMap((character) =>
    [getExtraDust, getExtraBonesBonus, getExtraTachyon].map((getExtra) => getExtra(character, account).breakdown))],
  ['prisma multi', 'additive', (account) => [getPrismaMulti(account).breakdown]],
  ['portal progress per kill', 'product', (account) => [getPortalProgressBreakdown(account, 3.5).breakdown]]
];

describe('breakdowns on a real save', () => {
  const { account, characters } = parseFixture(latest);

  it('keeps the root combine of each one', () => {
    const combinesOf = ([label, , breakdownsOf]) => [label, [...new Set(breakdownsOf(account, characters).map(({ combine }) => combine ?? 'product'))]];
    expect(Object.fromEntries(COMBINES.map(combinesOf)))
      .toEqual(Object.fromEntries(COMBINES.map(([label, combine]) => [label, [combine]])));
  });

  it('trap collect rates, per character', () => {
    getTrapsBonuses(account, characters).perCharacter.forEach(({ critter, exp, breakdown }) => {
      const [critters, expGroup] = breakdown.tree;
      expect(evaluateBreakdownNode(critters) / (100 * critter)).toBeCloseTo(1, 9);
      expect(evaluateBreakdownNode(expGroup) / (100 * exp)).toBeCloseTo(1, 9);
    });
  });

  it('monument hours required list the per character hours', () => {
    ['bravery', 'justice', 'wisdom'].forEach((cavern) => {
      const req = account.hole.caverns[cavern].monumentAfkReq;
      if (!req) return;
      const [hoursPerCharacter] = req.tree;
      expect(hoursPerCharacter.combine).toBe('list');
      expect(hoursPerCharacter.children[0].value).toBe(req.totalValue);
    });
  });

  it('the jar enchant chance lists every tier', () => {
    const { enchant } = account.hole.caverns.theJars.jars[4];
    expect(top(enchant.breakdown, 'Enchant chance by tier').children).toHaveLength(enchant.tiers.length);
  });

  it('farming shares the growth speed drawer and rounds the uncapped crop value', () => {
    const { stats, maxTimes } = account.farming;
    expect(maxTimes[0].breakdown).toBe(stats.growthSpeed);
    // The uncapped group is rounded, and the lower of it and the cap wins
    const [uncapped, cap] = stats.cropValue.tree;
    expect(cap.name).toBe('Crop value cap');
    expect(evaluateBreakdownNode(uncapped)).toBe(Math.round(evaluateBreakdownNode(uncapped)));
  });
});

describe('breakdown edge cases', () => {
  const ribbonInputs = {
    unlocked: true,
    meritocracy: 37,
    connoisseur: 1,
    bundleDeathBringer: 1,
    bundleBoaring: 0,
    bundleAnniversary: 1,
    legendTalent: 2,
    talent: 45,
    palette: 170,
    grimoire: 30,
    sushi: 1,
    armory: 20,
    elegantRibbons: 1,
    binGoosey: 1,
    binGooseyUpgraded: 1,
    smoky: { bonus: 120 }
  };

  it('ribbons per day keeps its rounding and fractional sources', () => {
    const daily = calcDailyRibbons(ribbonInputs);
    expect(daily.count.expected).toBeGreaterThan(0);
    expectRebuilt(daily.countBreakdown, 'sum', daily.count.expected);
    expectRebuilt(daily.rankBreakdown, 'sum', daily.expectedRank);
  });

  it('locked daily ribbons rebuild to 0', () => {
    const daily = calcDailyRibbons({ ...ribbonInputs, unlocked: false });
    expectRebuilt(daily.countBreakdown, 'sum', 0);
  });

  it('prisma multi shows its x5 cap', () => {
    const { value, breakdown } = getPrismaMulti({ alchemy: { p2w: { totalEtherealSigils: 2000 } } });
    expect(value).toBe(5);
    expectRebuilt(breakdown, 'additive', value);
  });

  it('meritocracy is 0 before Spirit Village', () => {
    const { account } = parseFixture(latest);
    const { meritocracyMult, meritocracyMultBreakdown } = getVoteBallot(undefined, account, []);
    expect(meritocracyMult).toBe(0);
    expectRebuilt(meritocracyMultBreakdown, 'product', 0);
  });

  it('upgradeable bubbles without No Bubble Left Behind', () => {
    const { upgradeableBubblesAmount, breakdown } = getUpgradeableBubbles({}, []);
    expect(upgradeableBubblesAmount).toBe(0);
    expectRebuilt(breakdown, 'sum', 0);
  });

  it('empty-account breakdowns stay finite', () => {
    [
      getVialMultiplier({}).breakdown,
      getKrukBubblesDaily({}).breakdown,
      getShinyChanceInfo(undefined, undefined).breakdown,
      calcBreedabilityMulti({}, []).breakdown,
      calcShinyLvMulti({ lab: {} }, []).breakdown,
      getPrismaMulti({}).breakdown
    ].forEach((breakdown) => {
      breakdown.tree.forEach((node) => expect(Number.isFinite(evaluateBreakdownNode(node))).toBe(true));
    });
  });
});
