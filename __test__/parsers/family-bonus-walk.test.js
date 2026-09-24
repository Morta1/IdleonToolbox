import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getFamilyBonusBonus, getFamilyBonusesSeenBy } from '@parsers/family';
import { classFamilyBonuses } from '@website-data';
import { growth } from '@utility/helpers';

// FamBonusQTYs as the game builds it: characters walked in save order, a raw value only replaces a
// stored one it beats, and THE_FAMILY_GUY (decay 40/100) only buffs the value the played character
// sets. Same-class levels sit close together, which is where walk order decides the result.

const DROP_RATE = 'DROP_RATE_MULTIPLIER';
const TALENT_LEVELS = 'LV_FOR_ALL_TALENTS_ABOVE_LV_1';
const GOLDEN_FOODS = 'GOLDEN_FOODS';
const raw = (bonusName, level) => getFamilyBonusBonus(classFamilyBonuses, bonusName, level);
const familyGuyBonus = (level) => growth('decay', level, 40, 100, false);
// level holds the talent's points plus every added level except the sorcerer family bonus
const familyGuy = (level, baseLevel = 409) => ({ name: 'THE_FAMILY_GUY', baseLevel, level, funcX: 'decay', x1: 40, x2: 100 });

describe('family bonuses walked in save order', () => {
  it('buffs the bonus the played character sets', () => {
    const chars = [{ class: 'Elemental_Sorcerer', level: 1803 }, { class: 'Royal_Guardian', level: 1900 }];
    const { Royal_Guardian } = getFamilyBonusesSeenBy(chars, 1, familyGuy(657));
    const talentLevel = 657 + Math.floor(raw(TALENT_LEVELS, 1803));
    expect(Royal_Guardian).toBeCloseTo(raw(DROP_RATE, 1900) * (1 + familyGuyBonus(talentLevel) / 100), 10);
  });

  it('keeps an earlier played character\'s buff that a later raw value cannot beat', () => {
    const chars = [{ class: 'Royal_Guardian', level: 1872 }, { class: 'Royal_Guardian', level: 1900 }];
    const buffed = raw(DROP_RATE, 1872) * (1 + familyGuyBonus(657) / 100);
    expect(raw(DROP_RATE, 1900)).toBeGreaterThan(raw(DROP_RATE, 1872));
    expect(raw(DROP_RATE, 1900)).toBeLessThan(buffed);
    expect(getFamilyBonusesSeenBy(chars, 0, familyGuy(657)).Royal_Guardian).toBeCloseTo(buffed, 10);
  });

  it('does not buff a played character whose raw value loses to an earlier one', () => {
    const sorcerers = [{ class: 'Elemental_Sorcerer', level: 1803 }, { class: 'Elemental_Sorcerer', level: 1802 }];
    expect(getFamilyBonusesSeenBy(sorcerers, 1, familyGuy(657)).Elemental_Sorcerer).toBe(raw(TALENT_LEVELS, 1803));
    // Arcane Cultist is on the Shaman line, so it competes for the golden food bonus too
    const cultists = [{ class: 'Arcane_Cultist', level: 1825 }, { class: 'Arcane_Cultist', level: 1804 }];
    expect(getFamilyBonusesSeenBy(cultists, 1, familyGuy(657)).Shaman).toBe(raw(GOLDEN_FOODS, 1825));
  });

  it('gives any other class the best raw value', () => {
    const chars = [{ class: 'Royal_Guardian', level: 1872 }, { class: 'Royal_Guardian', level: 1900 }, { class: 'Wind_Walker', level: 1797 }];
    expect(getFamilyBonusesSeenBy(chars, 2, familyGuy(657)).Royal_Guardian).toBe(raw(DROP_RATE, 1900));
  });

  it('reads the talent with only the sorcerer bonus stored so far', () => {
    const before = getFamilyBonusesSeenBy([{ class: 'Royal_Guardian', level: 1872 }, { class: 'Elemental_Sorcerer', level: 1803 }], 0, familyGuy(657));
    const after = getFamilyBonusesSeenBy([{ class: 'Elemental_Sorcerer', level: 1803 }, { class: 'Royal_Guardian', level: 1872 }], 1, familyGuy(657));
    expect(before.Royal_Guardian).toBeCloseTo(raw(DROP_RATE, 1872) * (1 + familyGuyBonus(657) / 100), 10);
    expect(after.Royal_Guardian).toBeCloseTo(raw(DROP_RATE, 1872) * (1 + familyGuyBonus(657 + Math.floor(raw(TALENT_LEVELS, 1803))) / 100), 10);
  });

  it('lets a played sorcerer\'s talent count its own raw bonus', () => {
    const { Elemental_Sorcerer } = getFamilyBonusesSeenBy([{ class: 'Elemental_Sorcerer', level: 1803 }], 0, familyGuy(657));
    const talentLevel = 657 + Math.floor(raw(TALENT_LEVELS, 1803));
    expect(Elemental_Sorcerer).toBeCloseTo(raw(TALENT_LEVELS, 1803) * (1 + familyGuyBonus(talentLevel) / 100), 10);
  });

  it('leaves the bonus raw without points in the talent', () => {
    const chars = [{ class: 'Royal_Guardian', level: 1900 }];
    expect(getFamilyBonusesSeenBy(chars, 0, familyGuy(0, 0)).Royal_Guardian).toBe(raw(DROP_RATE, 1900));
    expect(getFamilyBonusesSeenBy(chars, 0, undefined).Royal_Guardian).toBe(raw(DROP_RATE, 1900));
  });
});
