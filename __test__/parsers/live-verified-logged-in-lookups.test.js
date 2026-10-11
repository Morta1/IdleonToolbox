import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { getBestActiveCharacter, getLastBloodBerserkerLine, getMaestroHand, getTalentBonus } from '@parsers/talents';
import { getLoggedInSkillLevel } from '@parsers/misc';
import { getAccountMinorDivinityBonus, GOD_INDEX } from '@parsers/world-5/divinity';

// Account-wide game formulas read the LOGGED-IN character: DNSM.StarSigns (its signs, chip and summoning
// level; pinned in live-verified-star-signs.test.js), GA.Lv0[skill] (its skill levels), TalentCalc maps
// built for it. The toolbox stands in for it with getBestActiveCharacter (newest PTimeAway). Read from the running game on 11 Oct 2026 through the debug
// server, logged in as IAmTheHunterrr (Wind Walker); latest.json is that account's save. Caches rebuilt
// first (TotalStats calcEtcBonuses, TalentCalc(-2)).
const GAME = {
  // Sailing("BoatArtiMulti", t), Sailing("BoatValue", t), Sailing("BoatSpeed", t) (boat 0 is capped by the
  // island's minimum travel time, so its raw speed is rebuilt from DNSM.SailzDN3)
  artifactChance: [6526377.458918365],
  boatLoot: { 0: 3274796999.763354, 1: 2155734745.229376, 9: 3909344982.70105 },
  boatSpeedRaw: { 0: 109809293654.51337, 9: 6526388640.920813 },
  // Minehead("Button_uHave", t)
  buttonProgress: { 30: 284, 31: 318, 32: 48, 33: 18, 34: 25, 35: 214, 38: 6526377.458918365 },
  // Lv0[18], Lv0[0], Lv0[20]
  summoningLevel: 146,
  classLevel: 1280,
  researchLevel: 82,
  // 1 + (1 + CoralKidUpgBonus(3) / 100) * Lv0[14] / (60 + Lv0[14])
  coralHat: 1.9528467153284672,
  // DNSM.CalcTalentMAP[42] / [43] (left / right hand), skill order of Lv0[1..9]
  leftHand: [134.85342019543975, 134.85342019543975, 134.85342019543975, 134.85342019543975, 0, 134.85342019543975, 0, 134.85342019543975, 134.85342019543975],
  rightHand: [89.51612903225806, 89.51612903225806, 89.51612903225806, 89.51612903225806, 0, 89.51612903225806, 0, 89.51612903225806, 89.51612903225806]
};
const HAND_SKILLS = ['mining', 'smithing', 'chopping', 'fishing', 'alchemy', 'catching', 'trapping', 'construction', 'worship'];

const TOLERANCE = 1e-9;
const within = (actual, expected, tolerance = TOLERANCE) => expected === 0
  ? expect(actual).toBe(0)
  : expect(Math.abs(actual / expected - 1)).toBeLessThan(tolerance);

describe('account-wide lookups read the logged-in character, verified against the live game', () => {
  const { account, characters } = parseFixture(latest);
  const loggedIn = getBestActiveCharacter(characters);
  const allUpgrades = Object.values(account.summoning.upgrades).flat();

  it('the logged-in character is the one played at export', () => {
    expect(loggedIn?.name).toBe('IAmTheHunterrr');
  });

  it('artifact find chance: logged-in star sign (not every sign forced on) and 25% per tier 6 captain', () => {
    GAME.artifactChance.forEach((expected, boatIndex) => within(account.sailing.boats[boatIndex].artifactChance.rawValue, expected));
  });

  it('boat loot carries the tier 6 captain term, boat speed the vault upgrade 62 and star sign terms', () => {
    Object.entries(GAME.boatLoot).forEach(([boatIndex, expected]) => within(account.sailing.boats[boatIndex].loot.value, expected));
    Object.entries(GAME.boatSpeedRaw).forEach(([boatIndex, expected]) => within(account.sailing.boats[boatIndex].speed.raw, expected));
  });

  it('button skill-level tasks read the logged-in levels, the artifact task the raw chance', () => {
    Object.entries(GAME.buttonProgress).forEach(([taskIndex, expected]) => {
      const task = account.button.taskSequence.find(({ index }) => index === Number(taskIndex));
      if (task) within(task.progress, expected);
    });
  });

  it('summoning upgrades scaled by Lv0[18] use the logged-in summoning level', () => {
    expect(getLoggedInSkillLevel(characters, 'summoning')).toBe(GAME.summoningLevel);
    [30, 40, 46, 52, 58, 65, 66, 67].forEach((originalIndex) => {
      const upgrade = allUpgrades.find((u) => u?.originalIndex === originalIndex);
      if (upgrade) within(upgrade.totalBonus || 0, (upgrade.value || 0) * GAME.summoningLevel);
    });
  });

  it('Timmy Talented superbit and the research level read the logged-in levels', () => {
    expect(account.gaming.superbitsUpgrades[47].totalBonus).toBe(Math.floor((GAME.classLevel - 500) / 100));
    expect(account.research.researchLevel).toBe(GAME.researchLevel);
  });

  it('coral kid upgrade tooltips use the logged-in divinity level', () => {
    const descriptions = account.coralReef.coralKidUpgrades.map(({ description }) => description).join(' ');
    expect(descriptions).toContain('LV_of_214_');
    expect(descriptions).toContain(`${GAME.coralHat.toFixed(2)}x`);
  });

  it('Maestro hands for the logged-in character match CalcTalentMAP[42] and [43]', () => {
    HAND_SKILLS.forEach((skill, index) => {
      within(getMaestroHand(loggedIn, skill, characters, account, 'LEFT_HAND_OF_LEARNING'), GAME.leftHand[index]);
      within(getMaestroHand(loggedIn, skill, characters, account, 'RIGHT_HAND_OF_ACTION'), GAME.rightHand[index]);
    });
  });
});

describe('logged-in lookup rules the live account cannot exercise', () => {
  const { account, characters } = parseFixture(latest);
  const loggedIn = getBestActiveCharacter(characters);
  const withLevel = (character, skill, level) => ({
    ...character,
    skillsInfo: { ...character.skillsInfo, [skill]: { ...character.skillsInfo?.[skill], level } }
  });

  it('a Maestro hand needs a strictly lower skill level, and the Maestro itself only gets the enhanced double', () => {
    const maestro = characters.filter((c) => ['Maestro', 'Voidwalker', 'Infinilyte'].includes(c.class)).at(-1);
    const handTalent = maestro.flatTalents.find(({ name }) => name === 'LEFT_HAND_OF_LEARNING');
    expect(handTalent).toBeTruthy();
    const level = maestro.skillsInfo.mining.level;
    const equal = withLevel(loggedIn, 'mining', level);
    expect(getMaestroHand(equal, 'mining', characters, account, 'LEFT_HAND_OF_LEARNING')).toBe(0);
    const below = withLevel(loggedIn, 'mining', level - 1);
    expect(getMaestroHand(below, 'mining', characters, account, 'LEFT_HAND_OF_LEARNING')).toBeGreaterThan(0);
    // ENHANCEMENT_ECLIPSE on this account is past 175, so both hands are enhanced: self gets 2x
    const self = getMaestroHand(maestro, 'mining', characters, account, 'LEFT_HAND_OF_LEARNING');
    expect(self).toBeCloseTo(2 * getMaestroHand(below, 'mining', characters, account, 'LEFT_HAND_OF_LEARNING'), 9);
  });

  it('apocalypse count comes from the last Blood Berserker line character', () => {
    const berserkers = characters.filter((c) => ['Blood_Berserker', 'Death_Bringer'].includes(c.class));
    expect(getLastBloodBerserkerLine(characters)?.name).toBe(berserkers.at(-1)?.name);
  });

  it('King Doot spreads Harriep and Goharut only while the logged-in character has divinity 2', () => {
    const lowDivinity = (name) => characters.map((c) => c.name === name ? withLevel(c, 'divinity', 1) : c);
    const other = characters.find((c) => c.name !== loggedIn.name);
    const withDoot = getAccountMinorDivinityBonus(account, characters, GOD_INDEX.Goharut);
    const otherLow = getAccountMinorDivinityBonus(account, lowDivinity(other.name), GOD_INDEX.Goharut);
    const withoutDoot = getAccountMinorDivinityBonus(account, lowDivinity(loggedIn.name), GOD_INDEX.Goharut);
    // another character at divinity 1 only loses its own share; the logged-in one ends the spread
    expect(otherLow).toBeGreaterThan(withoutDoot * 2);
    expect(withDoot).toBeGreaterThan(otherLow);
  });

  it('crystal charge requirement uses BACKUP_ENERGY\'s y bonus (the charge half)', () => {
    const arcane = characters.find((c) => c.class === 'Arcane_Cultist');
    const y = getTalentBonus(arcane.flatTalents, 'BACKUP_ENERGY', true);
    expect(y).toBeGreaterThan(2);
    expect(account.tesseract.crystalChargeReq).toBe(Math.ceil(Math.max(50, 200 - (100 + Math.min(10, y)))));
  });
});
