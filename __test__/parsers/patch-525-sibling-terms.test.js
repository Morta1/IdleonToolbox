import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { getAmberGain, getStaminaRegenRate } from '@parsers/world-7/spelunking';
import { getMinehead } from '@parsers/world-7/minehead';
import { getDropRate } from '@parsers/character';
import { getFamilyBonusBonus } from '@parsers/family';
import { classFamilyBonuses } from '@website-data';
import { growth } from '@utility/helpers';

// Terms the game applies that the first pass of the 2.3.525 work dropped. Every expectation is a
// differential against the same fixture, so a term that stops being multiplied in fails loudly
// even though the debug account reads 0 for all of them.

const clone = (o) => JSON.parse(JSON.stringify(o));

const withChapter = (account, chapterIndex, innerIndex, bonus) => {
  const chapters = clone(account.spelunking.chapters);
  chapters[chapterIndex][innerIndex] = { ...chapters[chapterIndex][innerIndex], bonus };
  return { ...account, spelunking: { ...account.spelunking, chapters } };
};

describe('spelunking: all three amber chapter multipliers', () => {
  const { account } = parseFixture(latest);
  const amber = (acc) => getAmberGain(acc, []).value;
  const base = amber(account);

  // The two chapters this patch missed read 0 on every save captured so far, which is exactly why
  // their absence went unnoticed three reviews running.
  const identity = (chapterIndex, innerIndex) => Math.max(1, account.spelunking.chapters[chapterIndex][innerIndex].bonus);

  it('the fixture reads 0 for chapters 4,1 and 5,1', () => {
    expect(account.spelunking.chapters[4][1].bonus).toBe(0);
    expect(account.spelunking.chapters[5][1].bonus).toBe(0);
    expect(base).toBeGreaterThan(0);
  });

  it.each([
    ['Decay Surrounds (1,3)', 1, 3, 4],
    ['Sunken Plunder (4,1)', 4, 1, 3],
    ['Kelp Primeval (5,1)', 5, 1, 10]
  ])('%s multiplies amber gain by its own bonus', (_name, chapterIndex, innerIndex, bonus) => {
    const expected = bonus / identity(chapterIndex, innerIndex);
    expect(expected).toBeGreaterThan(1);
    expect(amber(withChapter(account, chapterIndex, innerIndex, bonus)) / base).toBeCloseTo(expected, 6);
  });

  it('the three stack multiplicatively', () => {
    let acc = withChapter(account, 1, 3, 4);
    acc = withChapter(acc, 4, 1, 3);
    acc = withChapter(acc, 5, 1, 10);
    const expected = (4 * 3 * 10) / (identity(1, 3) * identity(4, 1) * identity(5, 1));
    expect(amber(acc) / base).toBeCloseTo(expected, 6);
  });

  it('a bonus below 1 is clamped to the 1x identity, as Math.max(1, ...) does in the game', () => {
    expect(amber(withChapter(account, 4, 1, 0.5)) / base).toBeCloseTo(1, 10);
  });
});

describe('spelunking: stamina regen chapter 5,2', () => {
  const { account } = parseFixture(latest);
  const regen = (acc) => getStaminaRegenRate(acc).value;
  const base = regen(account);

  it('adds its percentage into the same additive group as chapter 2,1', () => {
    const viaChapter5 = regen(withChapter(account, 5, 2, 60));
    const viaChapter2 = regen(withChapter(account, 2, 1, 60));
    expect(viaChapter5).toBeGreaterThan(base);
    expect(viaChapter5).toBeCloseTo(viaChapter2, 10);
  });
});

describe('minehead currency gain: outpost ROG bonus and event shop 44', () => {
  const { account } = parseFixture(latest);
  const data = latest.data ?? latest;
  const currency = (acc) => getMinehead(data, acc, latest.serverVars).currencyGain;

  const withRog = (selectedIndex, value) => ({
    ...account,
    royalGuardian: {
      ...account.royalGuardian,
      outpostStats: {
        ...account.royalGuardian.outpostStats,
        rogBonuses: account.royalGuardian.outpostStats.rogBonuses.map((bonus, index) => ({
          ...bonus,
          selected: index === selectedIndex,
          value: index === selectedIndex ? value : 1
        }))
      }
    }
  });

  // accountOptions[311] is the owned-event-shop letter string; "R" is index 44.
  const withEventShop = (owned) => ({
    ...account,
    accountOptions: Object.assign([], account.accountOptions, { 311: owned })
  });

  it('ROG bonus 3 (Minehead Currency Gain) multiplies currency per hour', () => {
    const none = currency(withRog(-1, 1));
    const selected = currency(withRog(3, 1.93));
    expect(selected / none).toBeCloseTo(1.93, 10);
  });

  it('a ROG bonus below 1 is clamped to the identity', () => {
    const none = currency(withRog(-1, 1));
    expect(currency(withRog(3, 0.4)) / none).toBeCloseTo(1, 10);
  });

  it('the other three ROG bonuses do not touch currency per hour', () => {
    const none = currency(withRog(-1, 1));
    [0, 1, 2].forEach((index) => {
      expect(currency(withRog(index, 1.93)) / none).toBeCloseTo(1, 10);
    });
  });

  it('event shop 44 doubles currency per hour', () => {
    const without = currency(withEventShop(''));
    const owned = currency(withEventShop('R'));
    expect(owned / without).toBeCloseTo(2, 10);
  });
});

describe('drop rate: Royal Guardian family bonus and GRADED_RATE', () => {
  const { account, characters } = parseFixture(latest);
  const character = characters[8];
  const dropRate = (char, acc, chars) => getDropRate(char, acc, chars).dropRate;
  const base = dropRate(character, account, characters);

  // A Royal Guardian appended rather than an existing character retyped, so no other class's
  // "highest level of" lookup moves underneath the comparison.
  const withRoyalGuardian = (level) => [...characters, { ...characters[0], class: 'Royal_Guardian', level }];

  it('FamBonusQTYs[32] multiplies drop rate by the Royal Guardian family bonus', () => {
    const level = 1307;
    const expected = getFamilyBonusBonus(classFamilyBonuses, 'DROP_RATE_MULTIPLIER', level);
    expect(expected).toBeGreaterThan(0);
    expect(dropRate(character, account, withRoyalGuardian(level)) / base).toBeCloseTo(1 + expected / 100, 10);
  });

  it('a Royal Guardian below the family bonus level requirement changes nothing', () => {
    expect(dropRate(character, account, withRoyalGuardian(50)) / base).toBeCloseTo(1, 10);
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
    const { breakdown } = getDropRate(withGradedRate(40), withNodeGrades(42), withRoyalGuardian(1307));
    const additive = breakdown.categories[0].sources.map((s) => s.name);
    const multi = breakdown.categories[1].sources.map((s) => s.name);
    expect(additive).toContain('Graded Rate (Royal Guardian)');
    expect(multi).toContain('Royal Guardian family');
    expect(breakdown.categories[0].sources.find((s) => s.name === 'Graded Rate (Royal Guardian)').value)
      .toBeGreaterThan(0);
    expect(breakdown.categories[1].sources.find((s) => s.name === 'Royal Guardian family').value)
      .toBeGreaterThan(0);
  });
});
