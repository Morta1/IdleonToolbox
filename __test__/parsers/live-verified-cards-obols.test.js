import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within } from '../helpers/live-verified';
import { calcCardsLevels, getCardBonusByEffect, getCardLevel } from '@parsers/cards';
import { getSkillCardBonus } from '@parsers/misc';
import { getMaxDamage } from '@parsers/damage';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr (Wind Walker).
// latest.json is that account's save (OptionsListAccount[340] matches).
const GAME = {
  // RunCodeOfTypeXforThingY("CardLv", name) summed over every owned card, and a sample of each level,
  // the 7 star Cardifier list (w5b3), the 6 star list (Boss6B, Crystal0) and Boss3B's own tier curve
  totalCardLevels: 1402,
  cardLevels: {
    snakeZ: 1, iceknight: 1, frogGG: 2, frogGR3: 2, frogGR: 3, Bug8: 3, BirchTree: 4, snakeZ3: 4, skele: 5,
    shovelR: 5, babaHour: 6, demonP: 6, Fish8: 7, stache: 7, w5b3: 7, Boss6B: 6, Crystal0: 7, Boss3B: 7, w7a2: 6
  },
  // DNSM.CardBonusS after TalentCalc(-4): the eight equipped cards (two Omega chips, legend talent 21 at 75)
  equippedCardBonus: {
    'Monster_EXP_While_Active': 241.5,
    'EXP_from_monsters': 330.75
  },
  // ...and every owned card of a skill once its rift mastery replaces the equipped copies, plus Card
  // Drop Chance through upgrade vault 44
  passiveCardBonus: {
    'Total_Mining_Efficiency': 60, 'Mining_EXP': 73, 'Mining_Away_Gains': 45, 'Mining_Speed': 91,
    'Total_Choppin_Efficiency': 86, 'Choppin_EXP': 20, 'Choppin_Away_Gains': 57.5, 'Choppin_Speed': 98,
    'Total_Fishing_Efficiency': 175, 'Fishing_EXP': 210, 'Fishing_Away_Gains': 63.5, 'Fishing_Speed': 70,
    'Total_Catching_Efficiency': 178, 'Catching_EXP': 41, 'Catching_Away_Gains': 47.5, 'Catching_Speed': 42,
    'Shiny_Critter_Chance': 178, 'Trapping_Efficiency': 60, 'Trapping_EXP': 70,
    'Charge_Rate': 60, 'Starting_Pts_in_Worship': 100, 'Max_Charge': 85,
    'Spelunking_EXP': 42, 'Spelunking_Efficiency': 97, 'Spelunking_AFK_Gain': 32,
    'Card_Drop_Chance': 159
  },
  // Cards[3]: the equipped Bosses set
  cardSet: { effect: '{%_Dmg,_Drop,_and_EXP', bonus: 30 },
  // DamageDealed("Max") with DNSM.CardBonusS["+{%_Total_Damage_Multi"] set to 50, over the untouched value
  totalDamageMultiAt50: 1.5,
  // ActorEvents_29._ScrollCircleINFO[43]: [stat, personal, family] totals. The personal LUK is 20 though
  // the slots add up to 19: a reroll left Golden Obol of Plentiful Riches at -1 LUK, and only a
  // positive stat counts.
  obols: {
    Weapon_Power: [19, 32], STR: [16, 10], AGI: [18, 11], WIS: [21, 18], LUK: [20, 57], Defence: [2, 0],
    '%_MONEY': [42, 0], '_BASE_DAMAGE': [333, 203], '%_TOTAL_DAMAGE': [4, 0], '%_DROP_RATE': [26, 128],
    '%_MULTIKILL_PER_TIER': [0, 2], '%_ALL_STATS': [0, 10]
  }
};

const SKILL_BY_EFFECT_PREFIX = { Mining: 'mining', Choppin: 'chopping', Fishing: 'fishing', Catching: 'catching' };

const { account, characters } = parseFixture(latest);
const loggedIn = characters.find(({ name }) => name === 'IAmTheHunterrr');

describe('cards verified against the live game', () => {
  it('card levels', () => {
    expect(calcCardsLevels(account.cards)).toBe(GAME.totalCardLevels);
    const levels = Object.fromEntries(Object.keys(GAME.cardLevels).map((rawName) => [rawName, getCardLevel(account.cards, rawName)]));
    expect(levels).toEqual(GAME.cardLevels);
  });

  it.each(Object.entries(GAME.equippedCardBonus))('equipped %s', (effect, value) => {
    within(getCardBonusByEffect(loggedIn.cards.equippedCards, effect), value);
  });

  it.each(Object.entries(GAME.passiveCardBonus))('every owned card: %s', (effect, value) => {
    within(getCardBonusByEffect(account.cards, effect), value);
    const skill = Object.entries(SKILL_BY_EFFECT_PREFIX).find(([prefix]) => effect.includes(prefix))?.[1];
    if (skill) within(getSkillCardBonus(loggedIn, account, skill, effect), value);
  });

  it('card set', () => {
    const { effect, bonus } = loggedIn.cards.cardSet;
    expect({ effect, bonus }).toEqual(GAME.cardSet);
  });

  it('a Total Damage Multi card multiplies damage instead of adding to Total Damage', () => {
    const multiCard = {
      ...loggedIn.cards.equippedCards[0],
      effect: '+{%_Total_Damage_Multi',
      bonus: 50,
      stars: 0,
      chipBoost: 1,
      legendBonus: 1
    };
    const withMultiCard = {
      ...loggedIn,
      cards: { ...loggedIn.cards, equippedCards: [multiCard, ...loggedIn.cards.equippedCards.slice(1)] }
    };
    // Slot 0 holds an EXP card, which plays no part in damage
    const ratio = getMaxDamage(withMultiCard, characters, account).maxDamage / getMaxDamage(loggedIn, characters, account).maxDamage;
    within(ratio, GAME.totalDamageMultiAt50);
  });

  it('an equipped passive card only counts toward its own effect', () => {
    const passiveDropCard = { effect: '+{%_Total_Drop_Rate_(Passive)', bonus: 4, stars: 0, amount: 1 };
    expect(getCardBonusByEffect([passiveDropCard], 'Total_Drop_Rate')).toBe(0);
    expect(getCardBonusByEffect([passiveDropCard], 'Total_Drop_Rate_(Passive)')).toBe(4);
  });
});

describe('obols verified against the live game', () => {
  it('personal and family stat totals', () => {
    const totals = Object.fromEntries(Object.keys(GAME.obols).map((stat) => {
      const { personalBonus = 0, familyBonus = 0 } = loggedIn.obols.stats[stat] ?? {};
      return [stat, [personalBonus, familyBonus]];
    }));
    expect(totals).toEqual(GAME.obols);
  });
});
