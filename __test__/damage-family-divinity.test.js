import { describe, expect, it } from 'vitest';
import { parseFixture } from './helpers/parsed-fixtures';
import raw from '../data/raw.json';
import { classFamilyBonuses } from '@website-data';
import { getFamilyBonusBonus } from '../parsers/family';
import { getHighestLevelOf } from '../parsers/misc';
import { CLASSES } from '../parsers/talents';
import { getW7ChosenGodIndex } from '../parsers/world-5/divinity';

const { characters, account } = parseFixture(raw);

// DNSM.FamBonusQTYs[80], read live after TalentCalc(-3). The key is 2 * classIndex + I, so 80 is
// classFamilyBonuses[40] (Arcane Cultist), not [34] (Elemental Sorcerer). FamBonusQTYs['80list']
// names the character the game picked, which is the Arcane Cultist rather than the higher levelled
// Elemental Sorcerer.
const GAME_FAM_80 = 6.952681388012619;
const GAME_FAM_80_PROVIDER = { name: 'MortaWiiz', level: 1231 };

describe('total damage family bonus', () => {
  it('reads the Arcane Cultist, not the Elemental Sorcerer', () => {
    const level = getHighestLevelOf(characters, CLASSES.Arcane_Cultist);
    expect(level).toBe(GAME_FAM_80_PROVIDER.level);
    expect(getFamilyBonusBonus(classFamilyBonuses, 'TOTAL_DMG_MULTIPLIER', level)).toBeCloseTo(GAME_FAM_80, 9);
    const esLevel = getHighestLevelOf(characters, CLASSES.Elemental_Sorcerer);
    expect(esLevel).not.toBe(GAME_FAM_80_PROVIDER.level);
    expect(getFamilyBonusBonus(classFamilyBonuses, 'TOTAL_DMG_MULTIPLIER', esLevel)).not.toBeCloseTo(GAME_FAM_80, 9);
  });
});

// OptionsListAccount[425] = 9 on this save, so the World 7 chosen god is Kattlekruk (godIndex 8). The rest of
// Bonus_MAJOR is live-verified-divinity's table of every character and god.
describe('major divinity bonus', () => {
  it('reads the World 7 chosen god through the god slot', () => {
    expect(getW7ChosenGodIndex(account)).toBe(8);
  });
});
