import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within } from '../helpers/live-verified';
import { getBestActiveCharacter, getLastBloodBerserkerLine, getMaestroHand } from '@parsers/talents';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr (Wind Walker).
// latest.json is that account's save (OptionsListAccount[340] matches). Caches were rebuilt first
// (calcEtcBonuses, TalentCalc(-2)). TalentCalc maps are built for the logged-in character, which the toolbox
// stands in for with getBestActiveCharacter (newest PTimeAway).
const GAME = {
  // DNSM.CalcTalentMAP[42] / [43] (left / right hand), skill order of Lv0[1..9]
  leftHand: [134.85342019543975, 134.85342019543975, 134.85342019543975, 134.85342019543975, 0, 134.85342019543975, 0, 134.85342019543975, 134.85342019543975],
  rightHand: [89.51612903225806, 89.51612903225806, 89.51612903225806, 89.51612903225806, 0, 89.51612903225806, 0, 89.51612903225806, 89.51612903225806]
};
const HAND_SKILLS = ['mining', 'smithing', 'chopping', 'fishing', 'alchemy', 'catching', 'trapping', 'construction', 'worship'];

const { account, characters } = parseFixture(latest);
const loggedIn = getBestActiveCharacter(characters);
const withLevel = (character, skill, level) => ({
  ...character,
  skillsInfo: { ...character.skillsInfo, [skill]: { ...character.skillsInfo?.[skill], level } }
});

describe('Maestro hands verified against the live game', () => {
  it('the logged-in character\'s hands match CalcTalentMAP[42] and [43]', () => {
    HAND_SKILLS.forEach((skill, index) => {
      within(getMaestroHand(loggedIn, skill, characters, account, 'LEFT_HAND_OF_LEARNING'), GAME.leftHand[index]);
      within(getMaestroHand(loggedIn, skill, characters, account, 'RIGHT_HAND_OF_ACTION'), GAME.rightHand[index]);
    });
  });

  it('a hand needs a strictly lower skill level, and the Maestro itself only gets the enhanced double', () => {
    const maestro = characters.filter((c) => ['Maestro', 'Voidwalker', 'Infinilyte'].includes(c.class)).at(-1);
    expect(maestro.flatTalents.find(({ name }) => name === 'LEFT_HAND_OF_LEARNING')).toBeTruthy();
    const level = maestro.skillsInfo.mining.level;
    const equal = withLevel(loggedIn, 'mining', level);
    expect(getMaestroHand(equal, 'mining', characters, account, 'LEFT_HAND_OF_LEARNING')).toBe(0);
    const below = withLevel(loggedIn, 'mining', level - 1);
    const belowHand = getMaestroHand(below, 'mining', characters, account, 'LEFT_HAND_OF_LEARNING');
    expect(belowHand).toBeGreaterThan(0);
    // ENHANCEMENT_ECLIPSE on this account is past 175, so both hands are enhanced: self gets 2x
    expect(getMaestroHand(maestro, 'mining', characters, account, 'LEFT_HAND_OF_LEARNING')).toBeCloseTo(2 * belowHand, 9);
  });
});

describe('Apocalypse kill count holder (TalentCalc CalcTalentDT1)', () => {
  it('is the last character in save order on the Blood Berserker line, not the highest class', () => {
    const line = [
      { name: 'first', class: 'Death_Bringer' },
      { name: 'last', class: 'Blood_Berserker' },
      { name: 'other', class: 'Wind_Walker' }
    ];
    expect(getLastBloodBerserkerLine(line)?.name).toBe('last');
  });
});
