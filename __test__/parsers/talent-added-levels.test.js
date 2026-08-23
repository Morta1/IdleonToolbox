import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { CLASSES, getAllTalentAddedLevels, getBestActiveCharacter, getHighestTalentByClass } from '@parsers/talents';

// Read out of the live client on 2026-08-20 via _customBlock_getbonus2(1, id, -1), once per active
// character. getbonus2 reads the added levels off whoever is being played, so the same account
// answers differently depending on that - which is the whole point of these four tables.
//
// 'Nine' is MortasNinth: AllTalentLVz 148, super talent list [168, 177, 165, 143, 144, 131, 86].
// 'Six' is IAmTheHunterrr: AllTalentLVz 136, super talent list empty.
// 'Ten' is Morojo: AllTalentLVz 138, super talent list [537, 536, 535, 526].
// 'Two' is mortastr: AllTalentLVz 141, super talent list [207, 199, 197, 136, 106, 146].
// 'Seven' is MortaMan: AllTalentLVz 123, super talent list [41, 42, 43].
// SuperTalentPTS_LVgiven is 121 for all five.
//
// The MortaMan rows were PREDICTED from the parser and only then read out of the client, all exact.
// Its list is the low-id case: AllTalentLVz("41") returns 244 (123 + 121) while AllTalentLVz("44")
// returns a plain 123, so the super term is live - but no talent any parser looks up has a holder
// sitting at base level 41-43, so it never actually fires in the table below.
const ACTIVE = {
  Nine: [
    ['Death_Bringer', "AGRICULTURAL_'PRECIATION", 836],
    ['Death_Bringer', 'DANK_RANKS', 2.3527508090614884],
    ['Beast_Master', 'SHINING_BEACON_OF_EGG', 74.87437185929649],
    ['Wind_Walker', 'SNEAKY_SKILLING', 177.5],
    ['Wind_Walker', 'GENERATIONAL_GEMSTONES', 2.440207972270364],
    ['Elemental_Sorcerer', 'SHARED_BELIEFS', 80.58252427184466],
    ['Divine_Knight', 'BITTY_LITTY', 16.402877697841728],
    ['Bubonic_Conjuror', 'PURPLE_TUBE', 31.886409736308316],
    // base level 143 is in this character's super talent list, so it collects +121 and wins
    ['Bubonic_Conjuror', 'GREEN_TUBE', 48.28125],
    ['Voidwalker', 'ENHANCEMENT_ECLIPSE', 267],
    ['Voidwalker', 'VOODOO_STATUFICATION', 99.24433249370277]
  ],
  Six: [
    ['Death_Bringer', "AGRICULTURAL_'PRECIATION", 812],
    ['Death_Bringer', 'DANK_RANKS', 2.33993399339934],
    ['Beast_Master', 'SHINING_BEACON_OF_EGG', 74.09326424870466],
    // base level 50 is banned, so this one does not move when the active character changes
    ['Wind_Walker', 'SNEAKY_SKILLING', 177.5],
    ['Wind_Walker', 'GENERATIONAL_GEMSTONES', 2.4070796460176993],
    ['Elemental_Sorcerer', 'SHARED_BELIEFS', 80.11928429423459],
    ['Divine_Knight', 'BITTY_LITTY', 16.323529411764707],
    ['Bubonic_Conjuror', 'PURPLE_TUBE', 31.683991683991685],
    // empty super talent list, so the base-143 character loses its +121 and the base-245 one wins
    ['Bubonic_Conjuror', 'GREEN_TUBE', 47.525987525987524],
    // talent id < 100 never takes added levels, so these two are identical in every table
    ['Voidwalker', 'ENHANCEMENT_ECLIPSE', 267],
    ['Voidwalker', 'VOODOO_STATUFICATION', 99.24433249370277]
  ],
  Ten: [
    ['Death_Bringer', "AGRICULTURAL_'PRECIATION", 816],
    ['Death_Bringer', 'DANK_RANKS', 2.3421052631578947],
    ['Beast_Master', 'SHINING_BEACON_OF_EGG', 74.22680412371135],
    ['Wind_Walker', 'SNEAKY_SKILLING', 177.5],
    ['Wind_Walker', 'GENERATIONAL_GEMSTONES', 2.412698412698413],
    ['Elemental_Sorcerer', 'SHARED_BELIEFS', 80.1980198019802],
    ['Divine_Knight', 'BITTY_LITTY', 16.336996336996336],
    // see the discriminator test below - this character's super talent list holds 535 and 536,
    // which are these two talents' own ids, and neither fires
    ['Bubonic_Conjuror', 'PURPLE_TUBE', 31.718426501035196],
    ['Bubonic_Conjuror', 'GREEN_TUBE', 47.577639751552795],
    ['Voidwalker', 'ENHANCEMENT_ECLIPSE', 267],
    ['Voidwalker', 'VOODOO_STATUFICATION', 99.24433249370277]
  ],
  Two: [
    ["Voidwalker", "ENHANCEMENT_ECLIPSE", 267],
    ["Voidwalker", "VOODOO_STATUFICATION", 99.24433249370277],
    ["Divine_Knight", "BITTY_LITTY", 16.35701275045537],
    ["Death_Bringer", "AGRICULTURAL_'PRECIATION", 822],
    ["Death_Bringer", "DANK_RANKS", 2.345335515548282],
    ["Siege_Breaker", "UNENDING_LOOT_SEARCH", 64.13256955810148],
    ["Beast_Master", "SHINING_BEACON_OF_EGG", 74.42455242966751],
    ["Wind_Walker", "SNEAKY_SKILLING", 177.5],
    ["Wind_Walker", "GENERATIONAL_GEMSTONES", 2.4210526315789473],
    ["Elemental_Sorcerer", "SHARED_BELIEFS", 80.31496062992126],
    ["Bubonic_Conjuror", "PURPLE_TUBE", 31.76954732510288],
    ["Bubonic_Conjuror", "GREEN_TUBE", 47.65432098765432]
  ],
  Seven: [
    ['Death_Bringer', "AGRICULTURAL_'PRECIATION", 786],
    ['Death_Bringer', 'DANK_RANKS', 2.325463743676223],
    ['Beast_Master', 'SHINING_BEACON_OF_EGG', 73.19034852546918],
    ['Wind_Walker', 'SNEAKY_SKILLING', 177.5],
    ['Wind_Walker', 'GENERATIONAL_GEMSTONES', 2.3695652173913047],
    ['Elemental_Sorcerer', 'SHARED_BELIEFS', 79.59183673469387],
    ['Divine_Knight', 'BITTY_LITTY', 16.23352165725047],
    ['Bubonic_Conjuror', 'PURPLE_TUBE', 31.45299145299145],
    ['Bubonic_Conjuror', 'GREEN_TUBE', 47.17948717948718],
    // no 199 in this character's super talent list, so this reads 59.137... where mortastr,
    // whose list does hold 199, reads 64.132... off the very same account
    ['Siege_Breaker', 'UNENDING_LOOT_SEARCH', 59.13793103448276],
    ['Voidwalker', 'ENHANCEMENT_ECLIPSE', 267],
    ['Voidwalker', 'VOODOO_STATUFICATION', 99.24433249370277]
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

  // UNENDING_LOOT_SEARCH is the second independent proof of the super talent term: mortastr's list
  // holds 199, which is a HOLDER'S BASE LEVEL for that talent (not its id), so it collects +121 and
  // the result is 64.132..., not the 60.048... it would be without.
  it('fires the super talent term on a second talent and character', () => {
    const active = byName('Two');
    const ids = active.superTalentsInfo.talents.map(({ talentIndex }) => talentIndex);
    expect(ids).toContain(199);
    const bonus = getHighestTalentByClass(characters, CLASSES.Siege_Breaker, 'UNENDING_LOOT_SEARCH',
      false, false, false, false, active);
    expect(bonus).toBeCloseTo(64.13256955810148, 10);
    expect(bonus).not.toBeCloseTo(60.048923679060664, 6);
  });

  // getbonus2(2, 475, -1) === 224000 whoever is playing: bigBase(4000, 1000) at the RAW level 220.
  // The y-variant is a separate branch that never sees added levels.
  it.each(['Nine', 'Six', 'Ten', 'Two', 'Seven'])('CHARGE_SYPHON y-bonus ignores added levels (%s playing)', (activeName) => {
    const bonus = getHighestTalentByClass(characters, CLASSES.Wizard, 'CHARGE_SYPHON', 'y',
      false, false, false, byName(activeName));
    expect(bonus).toBeCloseTo(224000, 6);
  });

  // The whole model rests on getbonus2 handing AllTalentLVz the talent's LEVEL where a talent id
  // belongs. 'Ten' settles it: its super talent list holds 535 and 536, the literal ids of
  // PURPLE_TUBE and GREEN_TUBE. Keyed by id both would collect +121 and read 33.377 / 50.066.
  // The live client returns the by-level numbers, so the list is searched for the level, not the id.
  it('searches the super talent list for the base level, not the talent id', () => {
    const active = byName('Ten');
    const ids = active.superTalentsInfo.talents.map(({ talentIndex }) => talentIndex);
    expect(ids).toEqual(expect.arrayContaining([535, 536]));

    const purple = getHighestTalentByClass(characters, CLASSES.Bubonic_Conjuror, 'PURPLE_TUBE',
      false, false, false, false, active);
    const green = getHighestTalentByClass(characters, CLASSES.Bubonic_Conjuror, 'GREEN_TUBE',
      false, false, false, false, active);

    expect(purple).toBeCloseTo(31.718426501035196, 10);
    expect(green).toBeCloseTo(47.577639751552795, 10);
    expect(purple).not.toBeCloseTo(33.37748344370861, 6);
    expect(green).not.toBeCloseTo(50.06622516556291, 6);
  });

  // The save never names the character being played, but PTimeAway does: the played character's
  // stamp tracks the clock while every other one is frozen at the moment it was left. Confirmed
  // against the live client, which reported mortastr active with the newest stamp of the eleven,
  // 3s behind GlobalTime against 58min for the runner-up.
  it('picks the most recently played character as the account-wide active one', () => {
    const newest = Math.max(...characters.map(({ afkTime }) => afkTime ?? -Infinity));
    expect(getBestActiveCharacter(characters).afkTime).toBe(newest);
  });

  // Stated on synthetic input rather than on the fixture: whether the freshest character also
  // happens to hold the most added levels is a property of whoever was logged in when the save was
  // taken, so asserting they differ would fail on a perfectly legal account.
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

  describe('AllTalentLVz banned base levels', () => {
    it.each([49, 55, 59, 149, 374, 505, 539, 615, 650, 699, 700, 999, 5000, 100000])(
      'level %i gets no added levels', (level) => {
        expect(getAllTalentAddedLevels(level, { addedLevels: 148 })).toBe(0);
      });

    it.each([48, 60, 148, 150, 373, 375, 504, 506, 538, 540, 614])('level %i keeps them', (level) => {
      expect(getAllTalentAddedLevels(level, { addedLevels: 148 })).toBe(148);
    });

    it('bans 49-59, 149, 374, 505, 539 and everything past 614', () => {
      const banned = [];
      for (let i = 0; i < 1000; i++) if (getAllTalentAddedLevels(i, { addedLevels: 1 }) === 0) banned.push(i);
      const expected = [...Array.from({ length: 11 }, (_, i) => 49 + i), 149, 374, 505, 539,
        ...Array.from({ length: 385 }, (_, i) => 615 + i)];
      expect(banned).toEqual(expected);
    });

    it('adds the super talent bonus when the base level is one of the active list ids', () => {
      const active = { addedLevels: 148, superTalentsInfo: { talents: [{ talentIndex: 143 }], bonus: 121 } };
      expect(getAllTalentAddedLevels(143, active)).toBe(269);
      expect(getAllTalentAddedLevels(144, active)).toBe(148);
      expect(getAllTalentAddedLevels(49, active)).toBe(0);
    });
  });
});
