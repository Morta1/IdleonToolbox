import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import highend from '../fixtures/highend.json';
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

// The top-level nodes combined the way the root says; list groups are reference values. The combine
// each test expects is checked against the root's (unset means product)
const rebuild = (breakdown, combine) => {
  expect(breakdown.combine ?? 'product').toBe(combine);
  return evaluateBreakdown(breakdown);
};

const expectRebuilt = (breakdown, combine, value) => {
  expect(breakdown.categories).toBeUndefined();
  if (value === 0) {
    expect(rebuild(breakdown, combine)).toBeCloseTo(0, 9);
    return;
  }
  expect(rebuild(breakdown, combine) / value).toBeCloseTo(1, 9);
};

// breakdown-totals.test.js rebuilds all of these; what it does not check is the root's combine type
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

describe.each([['latest', latest], ['highend', highend]])('world 2-4 and class breakdowns (%s)', (_, fixture) => {
  const { account, characters } = parseFixture(fixture);

  it.each(COMBINES)('%s combines as %s', (_label, combine, breakdownsOf) => {
    const breakdowns = breakdownsOf(account, characters);
    expect(breakdowns.length).toBeGreaterThan(0);
    breakdowns.forEach((breakdown) => expect(breakdown.combine ?? 'product').toBe(combine));
  });

  it('trap collect rates, per character', () => {
    getTrapsBonuses(account, characters).perCharacter.forEach(({ critter, exp, breakdown }) => {
      const [critters, expGroup] = breakdown.tree;
      expect(evaluateBreakdownNode(critters) / (100 * critter)).toBeCloseTo(1, 9);
      expect(evaluateBreakdownNode(expGroup) / (100 * exp)).toBeCloseTo(1, 9);
    });
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
