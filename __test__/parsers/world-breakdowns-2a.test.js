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

describe.each([['latest', latest], ['highend', highend]])('world 2-4 and class breakdowns (%s)', (_, fixture) => {
  const { account, characters } = parseFixture(fixture);

  it('vial multiplier', () => {
    const { value, breakdown } = getVialMultiplier(account);
    expectRebuilt(breakdown, 'product', value);
  });

  it('upgradeable bubbles', () => {
    const { upgradeableBubblesAmount, breakdown } = getUpgradeableBubbles(account, characters);
    expectRebuilt(breakdown, 'sum', upgradeableBubblesAmount);
  });

  it('kruk bubbles daily', () => {
    const { value, breakdown } = getKrukBubblesDaily(account);
    expectRebuilt(breakdown, 'sum', value);
  });

  it('vote and meritocracy multis', () => {
    const { voteMulti, voteMultiBreakdown, meritocracyMult, meritocracyMultBreakdown } = account.voteBallot;
    expectRebuilt(voteMultiBreakdown, 'product', voteMulti);
    expectRebuilt(meritocracyMultBreakdown, 'product', meritocracyMult);
  });

  it('trap collect rates, per character', () => {
    getTrapsBonuses(account, characters).perCharacter.forEach(({ critter, exp, breakdown }) => {
      const [critters, expGroup] = breakdown.tree;
      expect(evaluateBreakdownNode(critters) / (100 * critter)).toBeCloseTo(1, 9);
      expect(evaluateBreakdownNode(expGroup) / (100 * exp)).toBeCloseTo(1, 9);
    });
  });

  it('shiny critter chance, per character', () => {
    characters.forEach((character) => {
      const { multiplier, breakdown } = getShinyChanceInfo(account, characters, character);
      expectRebuilt(breakdown, 'product', multiplier);
    });
  });

  it('breedability and shiny level multis', () => {
    const breedability = calcBreedabilityMulti(account, characters);
    const shiny = calcShinyLvMulti(account, characters);
    expectRebuilt(breedability.breakdown, 'product', breedability.value);
    expectRebuilt(shiny.breakdown, 'product', shiny.value);
  });

  it('cooking mastery exp rate and daily ribbons', () => {
    const mastery = account.cooking.cookingMastery;
    expect(mastery).toBeTruthy();
    expectRebuilt(mastery.expRateBreakdown, 'product', mastery.expRate);
    const daily = calcDailyRibbons(mastery.dailyRibbons);
    expectRebuilt(daily.countBreakdown, 'sum', daily.count.expected);
    expectRebuilt(daily.rankBreakdown, 'sum', daily.expectedRank);
  });

  it('kitchen meal and fire speed', () => {
    expect(account.cooking.kitchens.length).toBeGreaterThan(0);
    account.cooking.kitchens.forEach(({ mealSpeed, mealSpeedBreakdown, fireSpeed, fireSpeedBreakdown }) => {
      expectRebuilt(mealSpeedBreakdown, 'product', mealSpeed);
      expectRebuilt(fireSpeedBreakdown, 'product', fireSpeed);
    });
  });

  it('storage slots', () => {
    const { value, breakdown } = account.storage.slots;
    expectRebuilt(breakdown, 'sum', value);
  });

  it('upgrade vault cost reduction', () => {
    const { cheaperFactor, breakdown } = account.upgradeVault.costReduction;
    expectRebuilt(breakdown, 'product', cheaperFactor);
  });

  it('extra dust, bones and tachyon, per character', () => {
    characters.forEach((character) => {
      [getExtraDust, getExtraBonesBonus, getExtraTachyon].forEach((getExtra) => {
        const { value, breakdown } = getExtra(character, account);
        expectRebuilt(breakdown, 'product', value);
      });
    });
  });

  it('prisma multi', () => {
    const { value, breakdown } = getPrismaMulti(account);
    expectRebuilt(breakdown, 'product', value);
  });

  it('portal progress per kill', () => {
    const { perKill, breakdown } = getPortalProgressBreakdown(account, 3.5);
    expectRebuilt(breakdown, 'product', perKill);
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

  it('prisma multi shows its x4 cap', () => {
    const { value, breakdown } = getPrismaMulti({ alchemy: { p2w: { totalEtherealSigils: 2000 } } });
    expect(value).toBe(4);
    expectRebuilt(breakdown, 'product', value);
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
