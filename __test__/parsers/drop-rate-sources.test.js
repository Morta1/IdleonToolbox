import { describe, expect, it } from 'vitest';
// Values below are pinned to the 22 Aug 2026 save (latest-2026-08.json), checked against the game then.
import latest from '../fixtures/latest-2026-08.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { getClassExpMulti, getDropRate } from '@parsers/character';
import { getCardBonusByEffect, getCardLevel } from '@parsers/cards';
import { getCloudBonus } from '@parsers/world-3/equinox';
import { getAmberGain, getLoreBonuses } from '@parsers/world-7/spelunking';
import { calcTotalStarTalent } from '@parsers/talents';
import { breakdownLineNames, findBreakdownNode } from '../helpers/breakdown-tree';

const dropRateAdditive = (breakdown) => findBreakdownNode(breakdown.tree, 'Additive');
const dropRateMultipliers = (breakdown) => breakdown.tree.find(({ name }) => name === 'Multipliers');

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

  it('agrees with a plain summed lookup while every group is under its cap', () => {
    expect(passiveTerm(LIVE_LEVELS)).toBeCloseTo(getCardBonusByEffect(liveCards, 'Drop_Rate_(Passive)'), 10);
  });

  it('clamps a 7 star Domeo Magmus, where a plain sum overshoots', () => {
    const maxed = { ...liveCards, a: card('mini5a', '+{%_Total_Drop_Rate_(Passive)', 1.5, 7) };
    expect(1.5 * getCardLevel(maxed, 'mini5a')).toBeCloseTo(10.5, 10);
    expect(passiveTerm({ ...LIVE_LEVELS, mini5a: 7 })).toBeCloseTo(34.5 - 1.5 + 10, 10);
    expect(getCardBonusByEffect(maxed, 'Drop_Rate_(Passive)')).toBeCloseTo(34.5 - 1.5 + 10.5, 10);
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

  it('matches the live game at Litterfish level 4', () => {
    // live client 2026-08-20: CardLv("w7a7") = 4, game term = min(20,40) + min(40,100) = 60
    expect(amberTerm(4)).toBeCloseTo(60, 10);
  });

  it('is triple what a single bonus * level lookup returns', () => {
    expect(getCardBonusByEffect(litterfish(4), 'Spelunk_Amber_(Passive)')).toBe(20); // the old, halved-and-then-some result
    expect(amberTerm(4)).toBeCloseTo(60, 10);
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
