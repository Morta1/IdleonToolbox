import { describe, expect, it } from 'vitest';
import { parseFixture } from './helpers/parsed-fixtures';
import raw from '../data/raw.json';
import { classFamilyBonuses } from '@website-data';
import { getFamilyBonusBonus } from '../parsers/family';
import { getHighestLevelOf } from '../parsers/misc';
import { CLASSES } from '../parsers/talents';
import { getW7ChosenGodIndex, isMajorDivinityActive } from '../parsers/world-5/divinity';

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
  });

  it('would miss the game value if it read the Elemental Sorcerer', () => {
    const esLevel = getHighestLevelOf(characters, CLASSES.Elemental_Sorcerer);
    expect(esLevel).not.toBe(GAME_FAM_80_PROVIDER.level);
    expect(getFamilyBonusBonus(classFamilyBonuses, 'TOTAL_DMG_MULTIPLIER', esLevel)).not.toBeCloseTo(GAME_FAM_80, 9);
  });
});

// Divinity('Bonus_MAJOR', player, godIndex) on this save:
//   Holes[11][29] = 1 and Holes[11][30] = 5, so the two pocket divinity spots hold Arctis
//   (godIndex 2) and Omniphau (godIndex 4). Holes('CosmoBonusQTY', 2, 0) is 2, so both count.
//   OptionsListAccount[425] = 9, so the World 7 chosen god is Kattlekruk (godIndex 8).
//   GemItemsPurchased[9] = 1, which hands Snehebatu (godIndex 0) to everyone.
// Nobody is linked to Nobisect (godIndex 7), so the kill per kill doubler stays off account wide.
describe('major divinity bonus', () => {
  it('reads the World 7 chosen god through the god slot', () => {
    expect(getW7ChosenGodIndex(account)).toBe(8);
  });

  it('grants a pocket divinity to every character', () => {
    expect(characters.every((character) => isMajorDivinityActive(character, account, 2))).toBe(true);
    expect(characters.every((character) => isMajorDivinityActive(character, account, 4))).toBe(true);
  });

  it('grants the gem shop god to every character', () => {
    expect(characters.every((character) => isMajorDivinityActive(character, account, 0))).toBe(true);
  });

  it('leaves the kill per kill god off when nobody is linked to it', () => {
    expect(characters.some((character) => isMajorDivinityActive(character, account, 7))).toBe(false);
  });

  it('does not fall through to the polytheism link on an unlinked character', () => {
    const unlinked = characters.find((character) => character?.linkedDeity === -1);
    expect(unlinked).toBeTruthy();
    // Kattlekruk is the chosen god, so ask about one nobody hands out: Harriep, godIndex 3.
    expect(isMajorDivinityActive(unlinked, account, 3)).toBe(false);
  });
});
