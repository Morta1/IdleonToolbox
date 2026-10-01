import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getFamilyBonusBonus, getFamilyBonusesSeenBy } from '@parsers/family';
import { classFamilyBonuses, classPromotions } from '@website-data';
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

describe('family bonuses walked across every class', () => {
  it('credits each class in a character line, not just the final one', () => {
    const { Hunter, Beast_Master, Wind_Walker, Archer } = getFamilyBonusesSeenBy([{ class: 'Wind_Walker', level: 1280 }], -1, null);
    expect(Hunter).toBe(raw('EFFICIENCY_FOR_ALL_SKILLS', 1280));
    expect(Beast_Master).toBe(raw('ALL_SKILL_AFK_GAINS', 1280));
    expect(Wind_Walker).toBeGreaterThan(0);
    expect(Archer).toBeGreaterThan(0);
  });

  it('buffs Divine Knight and Siege Breaker with the account talent whoever is played', () => {
    const chars = [{ class: 'Divine_Knight', level: 1240 }, { class: 'Siege_Breaker', level: 1291 }];
    const played = getFamilyBonusesSeenBy(chars, 0, familyGuy(657), familyGuy(500));
    const unplayed = getFamilyBonusesSeenBy(chars, -1, null, familyGuy(500));
    expect(played.Divine_Knight).toBeCloseTo(raw('Refinery_Speed', 1240) * (1 + familyGuyBonus(500) / 100), 10);
    expect(played.Siege_Breaker).toBe(unplayed.Siege_Breaker);
    expect(getFamilyBonusesSeenBy(chars, -1, null).Divine_Knight).toBe(raw('Refinery_Speed', 1240));
  });

  // A live account (Royal Guardian played, THE_FAMILY_GUY at 577 with the sorcerer's 15 included), read
  // from DNSM.FamBonusQTYs. The first Siege Breaker sits before the Elemental Sorcerer, so its account
  // buff is read without the sorcerer's 15 levels.
  it('matches FamBonusQTYs read from the game', () => {
    const byIndex = Object.fromEntries(Object.entries(classPromotions).map(([name, { index }]) => [index, name]));
    const chars = [[22, 1291], [14, 1292], [34, 1259], [12, 1240], [40, 1231], [29, 1280], [4, 1158], [22, 1261], [16, 1307], [36, 1268], [1, 1224]]
      .map(([classIndex, level]) => ({ class: byIndex[classIndex], level }));
    const game = {
      6: 5.51179820992677, 8: 4.066467513069455, 14: 348.63810930576074, 16: 23.165810711665443, 18: 49.744278630430074,
      20: 17.434069850320743, 24: 59.43271792887757, 28: 35.54763117677025, 32: 7.985838313023764, 38: 257, 40: 35.20998531571219,
      42: 27.77942264988897, 44: 23.519585373476403, 50: 4.352983465132998, 58: 1.825935417734495, 62: 252, 64: 206,
      66: 1.3701269604182227, 68: 15.454545454545455, 72: 4.3473531544597535, 80: 6.952681388012619
    };
    const walked = getFamilyBonusesSeenBy(chars, 8, familyGuy(562), familyGuy(562));
    Object.entries(game).forEach(([key, value]) => {
      expect(walked[byIndex[key / 2]], `FamBonusQTYs[${key}]`).toBeCloseTo(value, 10);
    });
  });

  // Same account with its Elemental Sorcerer played: the sorcerer buffs its own bonus to 20.65, and
  // the Divine Knight walked after it reads the account talent with those 20 levels, not the raw 15.
  it('matches FamBonusQTYs read from the game with the sorcerer played', () => {
    const byIndex = Object.fromEntries(Object.entries(classPromotions).map(([name, { index }]) => [index, name]));
    const chars = [[22, 1291], [14, 1292], [34, 1259], [12, 1240], [40, 1231], [29, 1280], [4, 1158], [22, 1261], [16, 1307], [36, 1268], [1, 1224]]
      .map(([classIndex, level]) => ({ class: byIndex[classIndex], level }));
    const walked = getFamilyBonusesSeenBy(chars, 2, familyGuy(514), familyGuy(555));
    expect(walked.Elemental_Sorcerer).toBeCloseTo(20.653562653562656, 10);
    expect(walked.Wizard).toBeCloseTo(274.97980456026056, 10);
    expect(walked.Divine_Knight).toBeCloseTo(59.42495864524631, 10);
    expect(walked.Siege_Breaker).toBeCloseTo(23.508247784504693, 10);
  });
});
