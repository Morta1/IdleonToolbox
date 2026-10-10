import '../../polyfills';
import { describe, expect, it } from 'vitest';
import {
  getAccountMinorDivinityBonus,
  getCharacterMinorDivinityBonus,
  getMinorDivinityBonus,
  GOD_INDEX,
  GOD_SLOT,
  isMajorDivinityActive
} from '@parsers/world-5/divinity';

const character = (playerId, extra = {}) => ({ playerId, skillsInfo: { divinity: { level: 100 } }, equippedBubbles: [], ...extra });

// Two characters: 0 linked to Harriep, 1 to Arctis, and nothing else granting a god.
const setup = ({ linkedDeities = [GOD_SLOT.Harriep, GOD_SLOT.Arctis], coralKid = 0, doot = false, ...rest } = {}) => ({
  characters: [character(0), character(1)],
  account: {
    divinity: { linkedDeities, unlockedDeities: 10 },
    accountOptions: Object.assign([], { 425: coralKid }),
    companions: { list: [{ acquired: doot }] },
    ...rest
  }
});

const full = (char, account, slot) => getMinorDivinityBonus(char, account, slot);

describe('getCharacterMinorDivinityBonus', () => {
  it('pays the linked god only, read through its slot', () => {
    const { account, characters: [harriep] } = setup();
    expect(full(harriep, account, GOD_SLOT.Harriep)).toBeGreaterThan(0);
    expect(getCharacterMinorDivinityBonus(harriep, account, GOD_INDEX.Harriep)).toBe(full(harriep, account, GOD_SLOT.Harriep));
    expect(getCharacterMinorDivinityBonus(harriep, account, GOD_INDEX.Omniphau)).toBe(0);
  });

  it('ignores Coral Kid, whatever it chose', () => {
    for (const coralKid of [0, GOD_SLOT.Omniphau, GOD_SLOT.Omniphau + 1, GOD_INDEX.Omniphau + 1]) {
      const { account, characters: [harriep] } = setup({ coralKid });
      expect(getCharacterMinorDivinityBonus(harriep, account, GOD_INDEX.Omniphau)).toBe(0);
      expect(getCharacterMinorDivinityBonus(harriep, account, GOD_INDEX.Snehebatu)).toBe(0);
    }
  });

  it('hands every god out with King Doot, once the character has divinity level 2', () => {
    const { account, characters: [harriep] } = setup({ doot: true });
    expect(getCharacterMinorDivinityBonus(harriep, account, GOD_INDEX.Omniphau)).toBe(full(harriep, account, GOD_SLOT.Omniphau));
    const novice = character(0, { skillsInfo: { divinity: { level: 1 } } });
    expect(getCharacterMinorDivinityBonus(novice, account, GOD_INDEX.Omniphau)).toBe(0);
  });

  it('hands out Snehebatu with gem shop item 9 and Arctis with research grid square 173', () => {
    const { account, characters: [harriep] } = setup({
      gemShopPurchases: Object.assign([], { 9: 1 }),
      research: { gridSquares: { 173: { bonuses: [1] } } }
    });
    expect(getCharacterMinorDivinityBonus(harriep, account, GOD_INDEX.Snehebatu)).toBe(full(harriep, account, GOD_SLOT.Snehebatu));
    expect(getCharacterMinorDivinityBonus(harriep, account, GOD_INDEX.Arctis)).toBe(full(harriep, account, GOD_SLOT.Arctis));
  });

  it('pays the polytheism link only once that slot is unlocked account wide', () => {
    const { account } = setup();
    const sorcerer = character(0, { secondLinkedDeityIndex: GOD_SLOT.Flutterbis });
    expect(getCharacterMinorDivinityBonus(sorcerer, account, GOD_INDEX.Flutterbis)).toBe(full(sorcerer, account, GOD_SLOT.Flutterbis));
    account.divinity.unlockedDeities = GOD_SLOT.Flutterbis;
    expect(getCharacterMinorDivinityBonus(sorcerer, account, GOD_INDEX.Flutterbis)).toBe(0);
  });
});

describe('getAccountMinorDivinityBonus', () => {
  it('sums only the linked characters by default', () => {
    const { account, characters } = setup();
    expect(getAccountMinorDivinityBonus(account, characters, GOD_INDEX.Harriep)).toBe(full(characters[0], account, GOD_SLOT.Harriep));
  });

  it('gives Harriep to everyone when Coral Kid holds its godIndex + 1', () => {
    const everyone = setup({ coralKid: GOD_INDEX.Harriep + 1 });
    expect(getAccountMinorDivinityBonus(everyone.account, everyone.characters, GOD_INDEX.Harriep))
      .toBe(2 * full(everyone.characters[0], everyone.account, GOD_SLOT.Harriep));
  });

  it('gives Goharut to everyone on the godIndex + 1 match, which is Omniphau\'s slot', () => {
    const { account, characters } = setup({ coralKid: GOD_INDEX.Goharut + 1 });
    expect(GOD_INDEX.Goharut + 1).toBe(GOD_SLOT.Omniphau + 1);
    expect(getAccountMinorDivinityBonus(account, characters, GOD_INDEX.Goharut)).toBe(2 * full(characters[0], account, GOD_SLOT.Goharut));
    const choseGoharut = setup({ coralKid: GOD_SLOT.Goharut + 1 });
    expect(getAccountMinorDivinityBonus(choseGoharut.account, choseGoharut.characters, GOD_INDEX.Goharut)).toBe(0);
  });

  it('does not spread the other gods with King Doot, and is 0 when nobody is linked', () => {
    const { account, characters } = setup({ doot: true });
    expect(getAccountMinorDivinityBonus(account, characters, GOD_INDEX.Purrmep)).toBe(0);
    expect(getAccountMinorDivinityBonus(account, characters, GOD_INDEX.Kattlekruk)).toBe(0);
    expect(getAccountMinorDivinityBonus(account, characters, GOD_INDEX.Goharut)).toBe(2 * full(characters[0], account, GOD_SLOT.Goharut));
  });
});

describe('isMajorDivinityActive', () => {
  it('reads Coral Kid as a 1-based slot', () => {
    const { account, characters: [, arctis] } = setup({ coralKid: GOD_SLOT.Kattlekruk + 1 });
    expect(isMajorDivinityActive(arctis, account, GOD_INDEX.Kattlekruk)).toBe(true);
    expect(isMajorDivinityActive(arctis, account, GOD_INDEX.Harriep)).toBe(false);
  });
});
