import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { getClassExpMulti, getDropRate } from '@parsers/character';
import { getCardBonusByEffect, getCardLevel } from '@parsers/cards';
import { getCloudBonus } from '@parsers/world-3/equinox';

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

  it('Mama Troll (companion 132) adds 100 and multiplies by 1.50 from the same bonus', () => {
    const { breakdown } = getDropRate(character, withCompanion(132, 100), characters);
    const additive = breakdown.categories[0].sources.find((s) => s.name === 'Mama Troll');
    const multi = breakdown.categories[1].sources.find((s) => s.name === 'Mama Troll');
    expect(additive.value).toBe(1);   // +100 / 100
    expect(multi.value).toBe(1.5);    // 1 + min(0.5, 100)
  });

  it('lists every source in the breakdown so the UI can show it', () => {
    const { breakdown } = getDropRate(character, account, characters);
    const multi = breakdown.categories[1].sources.map((s) => s.name);
    expect(multi).toEqual(expect.arrayContaining([
      'Crystal Glunko', 'Mama Troll', 'Sushi (Unagi Nigiri)', 'Equinox Multi', 'DR Vial'
    ]));
    expect(breakdown.categories[0].sources.map((s) => s.name)).toContain('Mama Troll');
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
    const sources = breakdown.categories.flatMap((c) => c.sources ?? []);
    expect(sources.find((s) => s.name === 'Sushi (Tobiko Temaki)').value).toBeCloseTo(1.25, 10);
    expect(sources.find((s) => s.name === 'Equinox Multi')).toBeDefined();
    expect(sources.find((s) => s.name === 'Fountain')).toBeDefined();
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

describe('passive drop rate card caps', () => {
  // CardLv in game == stars + 1, since the parser keeps stars 0-indexed.
  const card = (rawName, effect, bonus, cardLv) => ({
    rawName, displayName: rawName, effect, bonus, amount: 1, stars: cardLv - 1
  });

  // Card levels read off the live client on 2026-08-20, where the game reported 34.5 for this group.
  const liveCards = {
    a: card('mini5a', '+{%_Total_Drop_Rate_(Passive)', 1.5, 1),
    b: card('caveC', '+{%_Total_Drop_Rate_(Passive)', 4, 5),
    c: card('caveD', '+{%_Total_Drop_Rate_(Passive)', 6, 1),
    d: card('anni4Event1', '+{%_Drop_Rate_(Passive)', 2, 2),
    e: card('luckEvent1', '+{%_Drop_Rate_(Passive)', 3, 1)
  };

  const capped = (cards) => {
    const lv = (raw) => getCardLevel(cards, raw);
    return Math.min(1.5 * lv('mini5a'), 10)
      + Math.min(4 * lv('caveC') + 6 * lv('caveD'), 100)
      + Math.min(2 * lv('anni4Event1'), 20)
      + Math.min(3 * lv('luckEvent1'), 25);
  };

  it('reproduces the live game total of 34.5', () => {
    expect(capped(liveCards)).toBeCloseTo(34.5, 10);
  });

  it('agrees with a plain summed lookup while every group is under its cap', () => {
    expect(capped(liveCards)).toBeCloseTo(getCardBonusByEffect(liveCards, 'Drop_Rate_(Passive)'), 10);
  });

  it('clamps a 7 star Domeo Magmus, where a plain sum overshoots', () => {
    const maxed = { ...liveCards, a: card('mini5a', '+{%_Total_Drop_Rate_(Passive)', 1.5, 7) };
    expect(1.5 * getCardLevel(maxed, 'mini5a')).toBeCloseTo(10.5, 10);
    expect(capped(maxed)).toBeCloseTo(34.5 - 1.5 + 10, 10);
    expect(getCardBonusByEffect(maxed, 'Drop_Rate_(Passive)')).toBeCloseTo(34.5 - 1.5 + 10.5, 10);
  });

  it('clamps the shared caveC and caveD group at 100', () => {
    const huge = {
      ...liveCards,
      b: card('caveC', '+{%_Total_Drop_Rate_(Passive)', 4, 20),
      c: card('caveD', '+{%_Total_Drop_Rate_(Passive)', 6, 20)
    };
    expect(capped(huge)).toBeCloseTo(1.5 + 100 + 4 + 3, 10);
  });

  it('ignores unowned cards', () => {
    expect(getCardLevel({ ...liveCards, a: { ...liveCards.a, amount: 0 } }, 'mini5a')).toBe(0);
    expect(getCardLevel(liveCards, 'not_a_card')).toBe(0);
  });
});

describe('cards the game counts more than once or caps on their own', () => {
  // Litterfish (w7a7) appears twice in the Spelunk Amber formula, at two coefficients with two
  // caps. Its own bonus field is 5, so one of the two terms cannot come from bonus * level.
  const litterfish = (cardLv) => ({
    w7a7: { rawName: 'w7a7', effect: '+{%_Spelunk_Amber_(Passive)', bonus: 5, amount: 1, stars: cardLv - 1 }
  });
  const amberTerm = (cards) => {
    const lv = getCardLevel(cards, 'w7a7');
    return Math.min(5 * lv, 40) + Math.min(10 * lv, 100);
  };

  it('matches the live game at Litterfish level 4', () => {
    // live client 2026-08-20: CardLv("w7a7") = 4, game term = min(20,40) + min(40,100) = 60
    expect(amberTerm(litterfish(4))).toBe(60);
  });

  it('is triple what a single bonus * level lookup returns', () => {
    const cards = litterfish(4);
    expect(getCardBonusByEffect(cards, 'Spelunk_Amber_(Passive)')).toBe(20); // the old, halved-and-then-some result
    expect(amberTerm(cards)).toBe(60);
  });

  it('applies both caps independently at high level', () => {
    expect(amberTerm(litterfish(9))).toBe(40 + 90);   // first term capped, second not
    expect(amberTerm(litterfish(12))).toBe(40 + 100); // both capped
  });

  it('caps each Star Talent Points card on its own', () => {
    const cards = {
      w4b2: { rawName: 'w4b2', bonus: 5, amount: 1, stars: 6 },
      Boss2C: { rawName: 'Boss2C', bonus: 15, amount: 1, stars: 6 },
      fallEvent1: { rawName: 'fallEvent1', bonus: 4, amount: 1, stars: 6 }
    };
    const lv = (raw) => getCardLevel(cards, raw);
    const term = Math.min(5 * lv('w4b2'), 50) + Math.min(15 * lv('Boss2C'), 100) + Math.min(4 * lv('fallEvent1'), 100);
    // at level 7: Gilded Efaunt would give 105 uncapped, so the cap is what keeps it at 100
    expect(lv('Boss2C')).toBe(7);
    expect(term).toBe(35 + 100 + 28);
  });
});
