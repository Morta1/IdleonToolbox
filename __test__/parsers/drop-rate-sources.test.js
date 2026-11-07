import { describe, expect, it } from 'vitest';
// Values below are pinned to the 22 Aug 2026 save (latest-2026-08.json), checked against the game then.
import latest from '../fixtures/latest-2026-08.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { getClassExpMulti, getDropRate } from '@parsers/character';
import { getCardBonusByEffect, getCardLevel } from '@parsers/cards';
import { getCloudBonus } from '@parsers/world-3/equinox';
import { getAmberGain, getLoreBonuses } from '@parsers/world-7/spelunking';
import { calcTotalStarTalent } from '@parsers/talents';
import { getFamilyBonusBonus } from '@parsers/family';
import { classFamilyBonuses } from '@website-data';
import { growth } from '@utility/helpers';
import { breakdownLineNames, findBreakdownNode } from '../helpers/breakdown-tree';

// Base drop rate > (additive bonuses x Siege Breaker) > additive bonuses; the multipliers are the second root group
const dropRateAdditive = (breakdown) => findBreakdownNode(breakdown.tree, 'Base drop rate').children[0].children[0];
const dropRateMultipliers = (breakdown) => breakdown.tree[1];

// Every expected ratio below is the game's own factor, read out of _customBlock_TotalStats("Drop_Rarity")
// in N.js and cross-checked against a live client on 2026-08-20.

const clone = (o) => JSON.parse(JSON.stringify(o));

describe('drop rate multiplicative sources', () => {
  const { account, characters } = parseFixture(latest);
  const character = characters[8];
  const base = getDropRate(character, account, characters).dropRate;

  const withCompanion = (index, bonus) => {
    const list = Object.assign([], account?.companions?.list);
    list[index] = { ...list[index], acquired: true, bonus };
    return { ...account, companions: { ...account.companions, list } };
  };

  const withChallengeDone = (index) => {
    const challenges = clone(account.equinox.challenges);
    challenges[index] = { ...challenges[index], current: -1 };
    return { ...account, equinox: { ...account.equinox, challenges } };
  };

  it('Crystal Glunko (companion 168) multiplies by 1.30', () => {
    const { dropRate } = getDropRate(character, withCompanion(168, 1), characters);
    expect(dropRate / base).toBeCloseTo(1.3, 10);
  });

  it('Unagi Nigiri sushi (RoG 48) multiplies by 1.10', () => {
    const withSushi = (uniqueSushi) => ({ ...account, sushiStation: { ...account.sushiStation, uniqueSushi } });
    const locked = getDropRate(character, withSushi(48), characters).dropRate;
    const unlocked = getDropRate(character, withSushi(49), characters).dropRate;
    expect(unlocked / locked).toBeCloseTo(1.1, 10);
  });

  it('equinox challenge 69 multiplies by 1.05 once complete', () => {
    const { dropRate } = getDropRate(character, withChallengeDone(69), characters);
    expect(dropRate / base).toBeCloseTo(1.05, 10);
  });

  it('Glunko The Massive (companion 160) has no 1.50x cap', () => {
    const at = (bonus) => getDropRate(character, withCompanion(160, bonus), characters).dropRate;
    expect(at(2) / at(1)).toBeCloseTo(2 / 1.5, 10);
  });

  it('Mama Troll (companion 132) adds 100 and multiplies by 1.50 from the same bonus', () => {
    const { breakdown } = getDropRate(character, withCompanion(132, 100), characters);
    const additive = findBreakdownNode(dropRateAdditive(breakdown), 'Mama Troll');
    const multi = findBreakdownNode(dropRateMultipliers(breakdown), 'Mama Troll');
    expect(additive.value).toBe(100); // +100%
    expect(multi.value).toBe(1.5);    // 1 + min(0.5, 100)
  });

  it('lists every source in the breakdown so the UI can show it', () => {
    const { breakdown } = getDropRate(character, account, characters);
    const multi = breakdownLineNames(dropRateMultipliers(breakdown));
    expect(multi).toEqual(expect.arrayContaining([
      'Crystal Glunko', 'Mama Troll', 'Sushi (Unagi Nigiri)', 'Jelly Operator', 'Equinox Multi', 'DR Vial'
    ]));
    expect(breakdownLineNames(dropRateAdditive(breakdown))).toContain('Mama Troll');
  });
});

describe('class exp multiplicative sources', () => {
  const { account, characters } = parseFixture(latest);
  const character = characters[8];

  it('equinox challenge 70 multiplies by 1.05 once complete', () => {
    const challenges = clone(account.equinox.challenges);
    challenges[70] = { ...challenges[70], current: -1 };
    const done = { ...account, equinox: { ...account.equinox, challenges } };
    const before = getClassExpMulti(character, account, characters).value;
    const after = getClassExpMulti(character, done, characters).value;
    expect(after / before).toBeCloseTo(1.05, 10);
  });

  it('shows the sushi, equinox and fountain factors in the breakdown', () => {
    const { breakdown } = getClassExpMulti(character, account, characters);
    expect(findBreakdownNode(breakdown.tree, 'Sushi (Tobiko Temaki)').value).toBeCloseTo(1.25, 10);
    expect(findBreakdownNode(breakdown.tree, 'Equinox Multi')).toBeDefined();
    expect(findBreakdownNode(breakdown.tree, 'Fountain')).toBeDefined();
  });
});

describe('getCloudBonus', () => {
  it('reads challenge completion, not upgrade level, and survives missing data', () => {
    const challenges = [{ current: 0 }, { current: -1 }];
    expect(getCloudBonus(challenges, 1)).toBe(1);
    expect(getCloudBonus(challenges, 0)).toBe(0);
    expect(getCloudBonus(undefined, 1)).toBe(0);
    expect(getCloudBonus(null, 1)).toBe(0);
    expect(getCloudBonus([], 1)).toBe(0);
  });
});

// Sets each named card to a CardLv (0 = unowned) on the account's own catalog-driven cards.
// CardLv in game == stars + 1, since the parser keeps stars 0-indexed.
const withCardLevels = (account, levels) => {
  const cards = Object.fromEntries(Object.entries(account.cards).map(([key, card]) => {
    if (!(card?.rawName in levels)) return [key, card];
    const level = levels[card.rawName];
    return [key, { ...card, amount: level > 0 ? Math.max(1, card.amount) : 0, stars: level - 1 }];
  }));
  const found = Object.values(cards).map(({ rawName }) => rawName);
  expect(Object.keys(levels).filter((rawName) => !found.includes(rawName))).toEqual([]);
  return { ...account, cards };
};

describe('passive drop rate card caps', () => {
  const { account, characters } = parseFixture(latest);
  const character = characters[8];
  const card = (rawName, effect, bonus, cardLv) => ({
    rawName, displayName: rawName, effect, bonus, amount: 1, stars: cardLv - 1
  });

  // Card levels read off the live client on 2026-08-20, where the game reported 34.5 for this group.
  const LIVE_LEVELS = { mini5a: 1, caveC: 5, caveD: 1, anni4Event1: 2, luckEvent1: 1 };
  const liveCards = {
    a: card('mini5a', '+{%_Total_Drop_Rate_(Passive)', 1.5, 1),
    b: card('caveC', '+{%_Total_Drop_Rate_(Passive)', 4, 5),
    c: card('caveD', '+{%_Total_Drop_Rate_(Passive)', 6, 1),
    d: card('anni4Event1', '+{%_Drop_Rate_(Passive)', 2, 2),
    e: card('luckEvent1', '+{%_Drop_Rate_(Passive)', 3, 1)
  };

  // The capped passive term getDropRate adds to its Cards line: the line at these levels minus the
  // line with all five unowned
  const cardsLine = (levels) => {
    const { breakdown } = getDropRate(character, withCardLevels(account, levels), characters);
    return findBreakdownNode(dropRateAdditive(breakdown), 'Cards').value;
  };
  const unowned = Object.fromEntries(Object.keys(LIVE_LEVELS).map((rawName) => [rawName, 0]));
  const passiveTerm = (levels) => cardsLine(levels) - cardsLine(unowned);

  it('reproduces the live game total of 34.5', () => {
    expect(passiveTerm(LIVE_LEVELS)).toBeCloseTo(34.5, 10);
  });

  // Both passive drop rate effects, each matched whole
  const summedLookup = (cards) => getCardBonusByEffect(cards, 'Total_Drop_Rate_(Passive)') + getCardBonusByEffect(cards, 'Drop_Rate_(Passive)');

  it('agrees with a plain summed lookup while every group is under its cap', () => {
    expect(passiveTerm(LIVE_LEVELS)).toBeCloseTo(summedLookup(liveCards), 10);
  });

  it('clamps a 7 star Domeo Magmus, where a plain sum overshoots', () => {
    const maxed = { ...liveCards, a: card('mini5a', '+{%_Total_Drop_Rate_(Passive)', 1.5, 7) };
    expect(1.5 * getCardLevel(maxed, 'mini5a')).toBeCloseTo(10.5, 10);
    expect(passiveTerm({ ...LIVE_LEVELS, mini5a: 7 })).toBeCloseTo(34.5 - 1.5 + 10, 10);
    expect(summedLookup(maxed)).toBeCloseTo(34.5 - 1.5 + 10.5, 10);
  });

  it('clamps the shared caveC and caveD group at 100', () => {
    expect(passiveTerm({ ...LIVE_LEVELS, caveC: 20, caveD: 20 })).toBeCloseTo(1.5 + 100 + 4 + 3, 10);
  });

  it('ignores unowned cards', () => {
    expect(getCardLevel({ ...liveCards, a: { ...liveCards.a, amount: 0 } }, 'mini5a')).toBe(0);
    expect(getCardLevel(liveCards, 'not_a_card')).toBe(0);
  });
});

describe('cards the game counts more than once or caps on their own', () => {
  const { account, characters } = parseFixture(latest);
  // Litterfish (w7a7) appears twice in the Spelunk Amber formula, at two coefficients with two
  // caps. Its own bonus field is 5, so one of the two terms cannot come from bonus * level.
  const litterfish = (cardLv) => ({
    w7a7: { rawName: 'w7a7', effect: '+{%_Spelunk_Amber_(Passive)', bonus: 5, amount: 1, stars: cardLv - 1 }
  });
  const amberTerm = (cardLv) => {
    const { breakdown } = getAmberGain(withCardLevels(account, { w7a7: cardLv }), getLoreBonuses(account));
    return (findBreakdownNode(breakdown.tree, 'Card').value - 1) * 100;
  };

  it('matches the live game at Litterfish level 4, triple a single bonus * level lookup', () => {
    // live client 2026-08-20: CardLv("w7a7") = 4, game term = min(20,40) + min(40,100) = 60
    expect(amberTerm(4)).toBeCloseTo(60, 10);
    expect(getCardBonusByEffect(litterfish(4), 'Spelunk_Amber_(Passive)')).toBe(20);
  });

  it('applies both caps independently at high level', () => {
    expect(amberTerm(9)).toBeCloseTo(40 + 90, 10);   // first term capped, second not
    expect(amberTerm(12)).toBeCloseTo(40 + 100, 10); // both capped
  });

  it('caps each Star Talent Points card on its own', () => {
    const starPoints = (cardLv) => calcTotalStarTalent(characters,
      withCardLevels(account, { w4b2: cardLv, Boss2C: cardLv, fallEvent1: cardLv }));
    // at level 7: Gilded Efaunt would give 105 uncapped, so the cap is what keeps it at 100
    expect(starPoints(7) - starPoints(0)).toBe(35 + 100 + 28);
  });
});

describe('drop rate: Royal Guardian family bonus and GRADED_RATE', () => {
  const { account, characters } = parseFixture(latest);
  const character = characters[8];
  const dropRate = (char, acc, chars) => getDropRate(char, acc, chars).dropRate;
  const base = dropRate(character, account, characters);

  // The family bonus is walked once per character at parse time (family-bonus-walk.test.js), so
  // the multiplier is exercised by setting the value that walk would have produced.
  const withRoyalGuardianFamily = (level, char = character) => ({
    ...char,
    familyBonuses: { ...char.familyBonuses, Royal_Guardian: getFamilyBonusBonus(classFamilyBonuses, 'DROP_RATE_MULTIPLIER', level) }
  });

  it('FamBonusQTYs[32] multiplies drop rate by the Royal Guardian family bonus', () => {
    const level = 1307;
    const expected = getFamilyBonusBonus(classFamilyBonuses, 'DROP_RATE_MULTIPLIER', level);
    expect(expected).toBeGreaterThan(0);
    expect(dropRate(withRoyalGuardianFamily(level), account, characters) / base).toBeCloseTo(1 + expected / 100, 10);
  });

  it('a Royal Guardian below the family bonus level requirement changes nothing', () => {
    expect(dropRate(withRoyalGuardianFamily(50), account, characters) / base).toBeCloseTo(1, 10);
  });

  // GRADED_RATE: decay, x1 3, x2 500 (talents.json, skillIndex 239).
  const withGradedRate = (level) => ({
    ...character,
    flatTalents: [...character.flatTalents, { name: 'GRADED_RATE', level, funcX: 'decay', x1: 3, x2: 500 }]
  });
  const withNodeGrades = (totalNodeLevels) => ({
    ...account,
    royalGuardian: {
      ...account.royalGuardian,
      outpostStats: { ...account.royalGuardian.outpostStats, totalNodeLevels }
    }
  });
  // Anchors how much one additive percentage point is worth after the whole multiplicative chain,
  // so the GRADED_RATE expectation is a magnitude and not just "it went up".
  const withSpelunkingUpgrade50 = (bonus) => {
    const upgrades = clone(account.spelunking.upgrades);
    upgrades[50] = { ...upgrades[50], bonus };
    return { ...account, spelunking: { ...account.spelunking, upgrades } };
  };
  const upgrade50Bonus = account.spelunking.upgrades[50].bonus;

  it('GetTalentNumber(1, 239) * TotalStatz(0) enters the additive group', () => {
    const talentLevel = 40;
    const nodeGrades = 42;
    const talentBonus = growth('decay', talentLevel, 3, 500, false);
    const perPoint = (dropRate(character, withSpelunkingUpgrade50(upgrade50Bonus + 10), characters)
      - dropRate(character, withSpelunkingUpgrade50(upgrade50Bonus), characters)) / 10;
    expect(perPoint).toBeGreaterThan(0);

    const actual = dropRate(withGradedRate(talentLevel), withNodeGrades(nodeGrades), characters);
    expect(actual).toBeCloseTo(base + perPoint * talentBonus * nodeGrades, 6);
  });

  it('a character without the talent contributes nothing, whatever the node grades', () => {
    expect(dropRate(character, withNodeGrades(500), characters)).toBeCloseTo(base, 10);
  });

  it('both new sources are listed in the breakdown', () => {
    const { breakdown } = getDropRate(withRoyalGuardianFamily(1307, withGradedRate(40)), withNodeGrades(42), characters);
    const additiveGroup = findBreakdownNode(breakdown.tree, 'Base drop rate').children[0].children[0];
    const multiGroup = breakdown.tree[1];
    expect([additiveGroup.combine, multiGroup.combine]).toEqual(['additive', 'product']);
    expect(breakdownLineNames(additiveGroup)).toContain('Graded Rate (Royal Guardian)');
    expect(breakdownLineNames(multiGroup)).toContain('Royal Guardian family');
    expect(findBreakdownNode(additiveGroup, 'Graded Rate (Royal Guardian)').value).toBeGreaterThan(0);
    // A factor: above 1 once the family bonus applies
    expect(findBreakdownNode(multiGroup, 'Royal Guardian family').value).toBeGreaterThan(1);
  });
});
