import '../../polyfills';
import { describe, expect, it } from 'vitest';
// Values below are pinned to the 22 Aug 2026 save (latest-2026-08.json), checked against the game then.
import latest from '../fixtures/latest-2026-08.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { CLASSES, getAllTalentAddedLevels, getBestActiveCharacter, getHighestTalentByClass } from '@parsers/talents';

// Read out of the live client on 2026-09-08 via _customBlock_getbonus2(1, id, -1). getbonus2 reads
// the added levels off whoever is being played, so the same account answers differently depending on
// that - which is the whole point of these tables.
//
// 2.3.525 changed the call inside getbonus2 from AllTalentLVz(<the talent's LEVEL>) to
// AllTalentLVz("<talent id>|<character index>"). Two consequences, both visible below: the ban list
// and the Royal Guardian 225-239 cap are now keyed by the talent's id instead of by whatever number
// its level happened to be, and the super talent list that gets searched is the HOLDER's, not the
// one belonging to the character being played. The numbers with MortasNinth ('Nine') logged in were
// read back out of the live client and live in talent-vs-game.test.js's TALENTS table (same fixture,
// Nine active); the four tables here follow from the same two mechanics, each of which was confirmed
// on its own.
//
// 'Nine' is MortasNinth: AllTalentLVz 148, super talent list [168, 177, 165, 143, 144, 131, 86].
// 'Six' is IAmTheHunterrr: AllTalentLVz 136, super talent list empty.
// 'Ten' is Morojo: AllTalentLVz 138, super talent list [537, 536, 535, 526].
// 'Two' is mortastr: AllTalentLVz 141, super talent list [207, 199, 197, 136, 106, 146].
// 'Seven' is MortaMan: AllTalentLVz 123, super talent list [41, 42, 43].
// SuperTalentPTS_LVgiven is 121 for all five.
const ACTIVE = {
  Six: [
    ['Death_Bringer', "AGRICULTURAL_'PRECIATION", 812],
    // empty super talent list on the character being played, and BITTY_LITTY still collects its
    // +121: the list that counts belongs to the holder, Nine, whose list carries the talent's own id 177
    ['Divine_Knight', 'BITTY_LITTY', 16.992481203007518],
    // a banned id answers the same whoever is playing
    ['Voidwalker', 'ENHANCEMENT_ECLIPSE', 267]
  ],
  Ten: [
    ['Death_Bringer', "AGRICULTURAL_'PRECIATION", 816],
    // Ten holds the best of both tubes AND carries their ids, 535 and 536, in its own super talent list, so both fire.
    // Live client, MortasNinth playing: AllTalentLVz('177|8') and ('143|8') both return 269 (148 + 121) while every other
    // character index returns a plain 148, and ('199|1') returns 269 only for index 1, mortastr, the one character whose
    // list holds 199. The index in the key picks the character whose list is searched, and the id in front is looked up.
    ['Bubonic_Conjuror', 'PURPLE_TUBE', 33.37748344370861],
    ['Bubonic_Conjuror', 'GREEN_TUBE', 50.06622516556291]
  ],
  Two: [
    ['Death_Bringer', "AGRICULTURAL_'PRECIATION", 822],
    // 199 is in this character's super talent list and is also a holder's base level, which used to
    // hand this talent a +121 it never had a claim to; keyed by id (325) no list holds it
    ['Siege_Breaker', 'UNENDING_LOOT_SEARCH', 60.048923679060664]
  ],
  Seven: [
    ['Death_Bringer', "AGRICULTURAL_'PRECIATION", 786],
    // id 431 is not banned though its holder's base level is 50, which is
    ['Wind_Walker', 'SNEAKY_SKILLING', 1678.1]
  ]
};

describe('getbonus2 added-talent-levels', () => {
  const { characters } = parseFixture(latest);
  const byName = (name) => characters.find((character) => character.name === name);

  describe.each(Object.keys(ACTIVE))('with %s playing', (activeName) => {
    const active = byName(activeName);

    it.each(ACTIVE[activeName])('%s %s matches the game', (className, talent, expected) => {
      const bonus = getHighestTalentByClass(characters, CLASSES[className], talent,
        false, false, false, false, active);
      expect(bonus).toBeCloseTo(expected, 10);
    });
  });

  // The y-variant takes the active character's added levels exactly like the x one: live on
  // 2026-10-10, getbonus2(2, 475, -1) was 360000 = bigBase(4000, 1000) at MortaWiz's raw 220 + 136
  // added (AllTalentLVz). So the value moves with whoever is playing.
  it.each([['Six', 360000], ['Seven', 347000]])(
    'CHARGE_SYPHON y-bonus takes the added levels (%s playing)', (activeName, expected) => {
      const bonus = getHighestTalentByClass(characters, CLASSES.Wizard, 'CHARGE_SYPHON', 'y',
        false, false, false, byName(activeName));
      expect(bonus).toBeCloseTo(expected, 6);
    });

  // The save never names the character being played, but PTimeAway does: the played character's stamp tracks the clock
  // while every other one is frozen at the moment it was left. Confirmed against the live client, which reported mortastr
  // active with the newest stamp of the eleven, 3s behind GlobalTime against 58min for the runner-up.
  it('prefers the freshest stamp over the highest added levels', () => {
    const characters = [
      { name: 'stale-but-loaded', afkTime: 1000, addedLevels: 900 },
      { name: 'freshest', afkTime: 3000, addedLevels: 1 },
      { name: 'middle', afkTime: 2000, addedLevels: 400 }
    ];
    expect(getBestActiveCharacter(characters).name).toBe('freshest');
  });

  it('falls back to the highest added levels when nothing has ever been played', () => {
    const never = [{ name: 'a', addedLevels: 3 }, { name: 'b', addedLevels: 9 }, { name: 'c', addedLevels: 5 }];
    expect(getBestActiveCharacter(never).name).toBe('b');
  });

  // Read off the live client on 2026-09-08 with MortasNinth playing (AllTalentLVz 148): every id
  // below answers 0 or 148 exactly as asserted here.
  describe('AllTalentLVz banned talent ids', () => {
    it('bans 49-59, 149, 374, 505, 539 and everything past 614', () => {
      const banned = [];
      for (let i = 0; i < 1000; i++) if (getAllTalentAddedLevels(i, { addedLevels: 1 }) === 0) banned.push(i);
      const expected = [...Array.from({ length: 11 }, (_, i) => 49 + i), 149, 374, 505, 539,
        ...Array.from({ length: 385 }, (_, i) => 615 + i)];
      expect(banned).toEqual(expected);
      expect(getAllTalentAddedLevels(5000, { addedLevels: 1 })).toBe(0);
    });

    it('adds the super talent bonus when the talent id is in the holder list', () => {
      const holder = { superTalentsInfo: { talents: [{ talentIndex: 143 }], bonus: 121 } };
      const active = { addedLevels: 148 };
      expect(getAllTalentAddedLevels(143, active, holder)).toBe(269);
      expect(getAllTalentAddedLevels(144, active, holder)).toBe(148);
      expect(getAllTalentAddedLevels(49, active, holder)).toBe(0);
    });

    // AMBER_HOARD is id 235, on the Royal Guardian page, so its added levels are capped by Talent
    // Reattainment (armory 55). Live client, MortasNinth playing: AllTalentLVz('235|8') is 148 on an
    // account whose armory 55 sits at 300. An account without the upgrade gets nothing - which is
    // what the Spelunking shop discount was overpaying on while this was keyed by level.
    it('caps a Royal Guardian talent id by Talent Reattainment', () => {
      expect(getAllTalentAddedLevels(235, { addedLevels: 148, rgTalentAddedLevelsCap: 300 })).toBe(148);
      expect(getAllTalentAddedLevels(235, { addedLevels: 148, rgTalentAddedLevelsCap: 50 })).toBe(50);
      expect(getAllTalentAddedLevels(235, { addedLevels: 148, rgTalentAddedLevelsCap: 0 })).toBe(0);
      // ids either side of the Royal Guardian page keep the uncapped bonus
      expect(getAllTalentAddedLevels(224, { addedLevels: 148, rgTalentAddedLevelsCap: 0 })).toBe(148);
      expect(getAllTalentAddedLevels(240, { addedLevels: 148, rgTalentAddedLevelsCap: 0 })).toBe(148);
    });
  });
});
