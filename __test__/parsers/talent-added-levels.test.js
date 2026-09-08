import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { CLASSES, getAllTalentAddedLevels, getBestActiveCharacter, getHighestTalentByClass } from '@parsers/talents';

// Read out of the live client on 2026-09-08 via _customBlock_getbonus2(1, id, -1). getbonus2 reads
// the added levels off whoever is being played, so the same account answers differently depending on
// that - which is the whole point of these five tables.
//
// 2.3.525 changed the call inside getbonus2 from AllTalentLVz(<the talent's LEVEL>) to
// AllTalentLVz("<talent id>|<character index>"). Two consequences, both visible below: the ban list
// and the Royal Guardian 225-239 cap are now keyed by the talent's id instead of by whatever number
// its level happened to be, and the super talent list that gets searched is the HOLDER's, not the
// one belonging to the character being played. Every number in the 'Nine' table was read back out
// of the live client with MortasNinth logged in; the other four follow from the same two mechanics,
// each of which was confirmed on its own (see the discriminator tests below).
//
// 'Nine' is MortasNinth: AllTalentLVz 148, super talent list [168, 177, 165, 143, 144, 131, 86].
// 'Six' is IAmTheHunterrr: AllTalentLVz 136, super talent list empty.
// 'Ten' is Morojo: AllTalentLVz 138, super talent list [537, 536, 535, 526].
// 'Two' is mortastr: AllTalentLVz 141, super talent list [207, 199, 197, 136, 106, 146].
// 'Seven' is MortaMan: AllTalentLVz 123, super talent list [41, 42, 43].
// SuperTalentPTS_LVgiven is 121 for all five.
const ACTIVE = {
  Nine: [
    ['Death_Bringer', "AGRICULTURAL_'PRECIATION", 836],
    ['Death_Bringer', 'DANK_RANKS', 2.45872801082544],
    ['Beast_Master', 'SHINING_BEACON_OF_EGG', 74.87437185929649],
    // id 431 is not banned, so this one takes added levels - before 2.3.525 the ban list saw its
    // holder's base LEVEL of 50, which is banned, and it stayed frozen at 177.5 whoever was playing
    ['Wind_Walker', 'SNEAKY_SKILLING', 2168.1],
    ['Wind_Walker', 'GENERATIONAL_GEMSTONES', 2.440207972270364],
    ['Elemental_Sorcerer', 'SHARED_BELIEFS', 84.27672955974843],
    // the holder of the best BITTY_LITTY is Nine itself, and 177 is in Nine's super talent list
    ['Divine_Knight', 'BITTY_LITTY', 17.045790251107828],
    ['Bubonic_Conjuror', 'PURPLE_TUBE', 33.48534201954397],
    ['Bubonic_Conjuror', 'GREEN_TUBE', 50.22801302931596],
    // talent id < 100 never takes added levels, so these two are identical in every table
    ['Voidwalker', 'ENHANCEMENT_ECLIPSE', 267],
    ['Voidwalker', 'VOODOO_STATUFICATION', 99.24433249370277],
    ['Siege_Breaker', 'UNENDING_LOOT_SEARCH', 60.38610038610039]
  ],
  Six: [
    ['Death_Bringer', "AGRICULTURAL_'PRECIATION", 812],
    ['Death_Bringer', 'DANK_RANKS', 2.4497936726272354],
    ['Beast_Master', 'SHINING_BEACON_OF_EGG', 74.09326424870466],
    ['Wind_Walker', 'SNEAKY_SKILLING', 1925.1],
    ['Wind_Walker', 'GENERATIONAL_GEMSTONES', 2.4070796460176993],
    ['Elemental_Sorcerer', 'SHARED_BELIEFS', 83.97435897435898],
    // empty super talent list on the character being played, and BITTY_LITTY still collects its
    // +121: the list that counts belongs to the holder
    ['Divine_Knight', 'BITTY_LITTY', 16.992481203007518],
    ['Bubonic_Conjuror', 'PURPLE_TUBE', 33.35548172757475],
    ['Bubonic_Conjuror', 'GREEN_TUBE', 50.033222591362126],
    ['Voidwalker', 'ENHANCEMENT_ECLIPSE', 267],
    ['Voidwalker', 'VOODOO_STATUFICATION', 99.24433249370277],
    ['Siege_Breaker', 'UNENDING_LOOT_SEARCH', 59.80237154150198]
  ],
  Ten: [
    ['Death_Bringer', "AGRICULTURAL_'PRECIATION", 816],
    ['Death_Bringer', 'DANK_RANKS', 2.4513031550068587],
    ['Beast_Master', 'SHINING_BEACON_OF_EGG', 74.22680412371135],
    ['Wind_Walker', 'SNEAKY_SKILLING', 1964.6],
    ['Wind_Walker', 'GENERATIONAL_GEMSTONES', 2.412698412698413],
    ['Elemental_Sorcerer', 'SHARED_BELIEFS', 84.02555910543131],
    ['Divine_Knight', 'BITTY_LITTY', 17.001499250374813],
    // see the discriminator test below - Ten holds the best of both tubes AND carries their ids,
    // 535 and 536, in its own super talent list, so both fire
    ['Bubonic_Conjuror', 'PURPLE_TUBE', 33.37748344370861],
    ['Bubonic_Conjuror', 'GREEN_TUBE', 50.06622516556291],
    ['Voidwalker', 'ENHANCEMENT_ECLIPSE', 267],
    ['Voidwalker', 'VOODOO_STATUFICATION', 99.24433249370277],
    ['Siege_Breaker', 'UNENDING_LOOT_SEARCH', 59.90157480314961]
  ],
  Two: [
    ['Voidwalker', 'ENHANCEMENT_ECLIPSE', 267],
    ['Voidwalker', 'VOODOO_STATUFICATION', 99.24433249370277],
    ['Divine_Knight', 'BITTY_LITTY', 17.01492537313433],
    ['Death_Bringer', "AGRICULTURAL_'PRECIATION", 822],
    ['Death_Bringer', 'DANK_RANKS', 2.4535519125683063],
    // 199 is in this character's super talent list and is also a holder's base level, which used to
    // hand this talent a +121 it never had a claim to; keyed by id (325) no list holds it
    ['Siege_Breaker', 'UNENDING_LOOT_SEARCH', 60.048923679060664],
    ['Beast_Master', 'SHINING_BEACON_OF_EGG', 74.42455242966751],
    ['Wind_Walker', 'SNEAKY_SKILLING', 2024.6],
    ['Wind_Walker', 'GENERATIONAL_GEMSTONES', 2.4210526315789473],
    ['Elemental_Sorcerer', 'SHARED_BELIEFS', 84.10174880763115],
    ['Bubonic_Conjuror', 'PURPLE_TUBE', 33.41021416803954],
    ['Bubonic_Conjuror', 'GREEN_TUBE', 50.11532125205931]
  ],
  Seven: [
    ['Death_Bringer', "AGRICULTURAL_'PRECIATION", 786],
    ['Death_Bringer', 'DANK_RANKS', 2.439775910364146],
    ['Beast_Master', 'SHINING_BEACON_OF_EGG', 73.19034852546918],
    ['Wind_Walker', 'SNEAKY_SKILLING', 1678.1],
    ['Wind_Walker', 'GENERATIONAL_GEMSTONES', 2.3695652173913047],
    ['Elemental_Sorcerer', 'SHARED_BELIEFS', 83.63338788870703],
    ['Divine_Knight', 'BITTY_LITTY', 16.932515337423315],
    ['Bubonic_Conjuror', 'PURPLE_TUBE', 33.20882852292021],
    ['Bubonic_Conjuror', 'GREEN_TUBE', 49.81324278438031],
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

  // BITTY_LITTY is the proof that the super talent term follows the HOLDER. Its best holder is Nine,
  // whose list carries the talent's own id 177, and the live client returned 17.045790251107828 with
  // MortasNinth playing - the +121 value. It stays a super talent with Six playing, whose own list is
  // empty, because the list that gets searched is Nine's.
  it('takes the super talent term from the holder, not from the character being played', () => {
    expect(byName('Nine').superTalentsInfo.talents.map(({ talentIndex }) => talentIndex)).toContain(177);
    expect(byName('Six').superTalentsInfo.talents).toHaveLength(0);

    const withNine = getHighestTalentByClass(characters, CLASSES.Divine_Knight, 'BITTY_LITTY',
      false, false, false, false, byName('Nine'));
    const withSix = getHighestTalentByClass(characters, CLASSES.Divine_Knight, 'BITTY_LITTY',
      false, false, false, false, byName('Six'));

    expect(withNine).toBeCloseTo(17.045790251107828, 10);
    expect(withSix).toBeCloseTo(16.992481203007518, 10);
    // the same two without the super term - what the pre-2.3.525 by-level lookup returned
    expect(withNine).not.toBeCloseTo(16.402877697841728, 6);
    expect(withSix).not.toBeCloseTo(16.323529411764707, 6);
  });

  // Live client, MortasNinth playing: AllTalentLVz('177|8') and ('143|8') both return 269 (148 + 121)
  // while every other character index returns a plain 148, and ('199|1') returns 269 only for index 1
  // - mortastr, the one character whose list holds 199. The index in the key picks the character
  // whose super talent list is searched, and the id in front of it is what is looked up.
  it('searches the super talent list by talent id', () => {
    const active = byName('Ten');
    const ids = active.superTalentsInfo.talents.map(({ talentIndex }) => talentIndex);
    expect(ids).toEqual(expect.arrayContaining([535, 536]));

    const purple = getHighestTalentByClass(characters, CLASSES.Bubonic_Conjuror, 'PURPLE_TUBE',
      false, false, false, false, active);
    const green = getHighestTalentByClass(characters, CLASSES.Bubonic_Conjuror, 'GREEN_TUBE',
      false, false, false, false, active);

    expect(purple).toBeCloseTo(33.37748344370861, 10);
    expect(green).toBeCloseTo(50.06622516556291, 10);
    // the by-level numbers, which is what these two read before 2.3.525
    expect(purple).not.toBeCloseTo(31.718426501035196, 6);
    expect(green).not.toBeCloseTo(47.577639751552795, 6);
  });

  // getbonus2(2, 475, -1) === 224000 whoever is playing: bigBase(4000, 1000) at the RAW level 220.
  // The y-variant is a separate branch that never sees added levels.
  it.each(['Nine', 'Six', 'Ten', 'Two', 'Seven'])('CHARGE_SYPHON y-bonus ignores added levels (%s playing)', (activeName) => {
    const bonus = getHighestTalentByClass(characters, CLASSES.Wizard, 'CHARGE_SYPHON', 'y',
      false, false, false, byName(activeName));
    expect(bonus).toBeCloseTo(224000, 6);
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

  // Read off the live client on 2026-09-08 with MortasNinth playing (AllTalentLVz 148): every id
  // below answers 0 or 148 exactly as asserted here.
  describe('AllTalentLVz banned talent ids', () => {
    it.each([49, 55, 59, 149, 374, 505, 539, 615, 650, 699, 700, 999, 5000, 100000])(
      'id %i gets no added levels', (talentId) => {
        expect(getAllTalentAddedLevels(talentId, { addedLevels: 148 })).toBe(0);
      });

    it.each([48, 60, 148, 150, 373, 375, 504, 506, 538, 540, 614])('id %i keeps them', (talentId) => {
      expect(getAllTalentAddedLevels(talentId, { addedLevels: 148 })).toBe(148);
    });

    it('bans 49-59, 149, 374, 505, 539 and everything past 614', () => {
      const banned = [];
      for (let i = 0; i < 1000; i++) if (getAllTalentAddedLevels(i, { addedLevels: 1 }) === 0) banned.push(i);
      const expected = [...Array.from({ length: 11 }, (_, i) => 49 + i), 149, 374, 505, 539,
        ...Array.from({ length: 385 }, (_, i) => 615 + i)];
      expect(banned).toEqual(expected);
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
