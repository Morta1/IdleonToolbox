import '../../polyfills';
import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import fresh from '../fixtures/fresh.json';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { CLASSES, getHighestTalentAcrossCharacters, getHighestTalentByClass } from '@parsers/talents';

// Every talent reached by a getHighestTalentByClass call site anywhere in parsers/, read out of the
// live client on 2026-08-20 with Morojo ('Ten') playing: _customBlock_getbonus2(1, id, -1), or
// (2, id, -1) for the y-variant. Regenerate by switching character in game and re-reading - the
// numbers move with whoever is active, so the whole table is tied to that one character.
// [class, talent, talentId, expected, yBonus?]
const TALENTS = [
  ["Voidwalker", "ENHANCEMENT_ECLIPSE", 49, 267],
  ["Voidwalker", "POWER_ORB", 50, 12.864077669902912],
  ["Voidwalker", "EXP_CULTIVATION", 55, 0],
  ["Voidwalker", "VOODOO_STATUFICATION", 56, 99.24433249370277],
  ["Voidwalker", "MASTER_OF_THE_SYSTEM", 58, 4.126984126984127],
  ["Voidwalker", "BLOOD_MARROW", 59, 1.0230769230769232],
  ["Divine_Knight", "THE_FAMILY_GUY", 144, 32.67399267399267],
  ["Siege_Breaker", "THE_FAMILY_GUY", 144, 32.67399267399267],
  ["Divine_Knight", "1000_HOURS_PLAYED", 176, 49.010989010989015],
  ["Divine_Knight", "BITTY_LITTY", 177, 16.336996336996336],
  ["Death_Bringer", "AGRICULTURAL_'PRECIATION", 206, 816],
  ["Death_Bringer", "DANK_RANKS", 207, 2.3421052631578947],
  ["Death_Bringer", "WRAITH_OVERLORD", 208, 1.3808049535603715],
  ["Death_Bringer", "APOCALYPSE_WOW", 209, 1.3421052631578947],
  ["Siege_Breaker", "UNENDING_LOOT_SEARCH", 325, 59.90157480314961],
  ["Siege_Breaker", "EXPERTLY_SAILED", 326, 46.72566371681416],
  ["Siege_Breaker", "ARCHLORD_OF_THE_PIRATES", 328, 4.228346456692913],
  ["Beast_Master", "SHINING_BEACON_OF_EGG", 372, 74.22680412371135],
  ["Wind_Walker", "CURVITURE_OF_THE_PAW", 373, 1.8954314720812184],
  ["Wind_Walker", "SHINY_MEDALLIONS", 429, 2.6735537190082646],
  ["Wind_Walker", "SNEAKY_SKILLING", 431, 177.5],
  ["Wind_Walker", "GENERATIONAL_GEMSTONES", 432, 2.412698412698413],
  ["Wind_Walker", "DUSTWALKER", 433, 18.549618320610687],
  ["Wind_Walker", "SLAYER_ABOMINATOR", 434, 1.0309160305343512],
  ["Wizard", "CHARGE_SYPHON", 475, 224000, true],
  ["Elemental_Sorcerer", "SHARED_BELIEFS", 506, 80.1980198019802],
  ["Elemental_Sorcerer", "GODS_CHOSEN_CHILDREN", 507, 6.694214876033058],
  ["Elemental_Sorcerer", "WORMHOLE_EMPEROR", 508, 1.0945945945945945],
  ["Bubonic_Conjuror", "PURPLE_TUBE", 535, 31.718426501035196],
  ["Bubonic_Conjuror", "GREEN_TUBE", 536, 47.577639751552795],
  ["Arcane_Cultist", "OVERWHELMING_ENERGY", 589, 1.4714587737843552],
  ["Arcane_Cultist", "PASSION_OF_THE_SUMMON", 596, 4.4576271186440675],
  ["Arcane_Cultist", "TACHYON_TRUTH", 598, 7.4407294832826745],
  // Royal Guardian (patch 2.3.525, task D5): no character in this fixture has levelled these, so
  // the pinned values are each talent's level-0 identity (0 for decay, 1 for decayMulti) - still a
  // real regression lock, since a typo'd talent name would silently resolve to a different value.
  ["Royal_Guardian", "AMBER_HOARD", 235, 0],
  ["Royal_Guardian", "SPELUNKING_SPECIALTY", 236, 0],
  ["Royal_Guardian", "GRAND_VEIN", 238, 1],
  // Added with task D9 (Royal Armory "$" tooltip fix): also unlevelled in this fixture, so the
  // pinned value is again the decayMulti level-0 identity (1).
  ["Royal_Guardian", "WARBOUND_POLITICS", 231, 1],
  // Added with the Outposts tab (OutpostResourceRate): unlevelled in this fixture too, so decay
  // talents pin at 0 and decayMulti ones at 1.
  ["Royal_Guardian", "CASTLE_CONVENE", 225, 0],
  ["Royal_Guardian", "ROYAL_ARMORY", 226, 0],
  ["Royal_Guardian", "INDUSTRIAL_POLITICS", 230, 1],
  // Added with the outpost handler sweep (RI_chance / RI_mobs / OrbletMultiDrop). Also
  // unlevelled here: the x half of REGAL_INTERVENTION is a decay talent, its y half is
  // intervalAdd, which starts at 5 rather than 0.
  ["Royal_Guardian", "REGAL_INTERVENTION", 229, 0],
  ["Royal_Guardian", "REGAL_INTERVENTION", 229, 5, true],
  ["Royal_Guardian", "LIL'_ORBLETS", 234, 0],
  // Added with MarbleDrop. The live client reads talent 232 here, not the 231 that
  // z-processing/resources/N.js still shows, so this pin is what catches a regression back to 231.
  ["Royal_Guardian", "AESTHETIC_POLITICS", 232, 1]

];

describe('every talent used by a parser matches the game', () => {
  const { characters } = parseFixture(latest);
  const active = characters.find((character) => character.name === 'Ten');

  // Every parser call site now goes through getHighestTalentAcrossCharacters, because getbonus2
  // itself never filters by class. The className column is documentation only.
  it.each(TALENTS)('%s %s (id %i)', (_className, talent, _id, expected, yBonus) => {
    const got = getHighestTalentAcrossCharacters(characters, talent, active, yBonus ? 'y' : false);
    expect(got).toBeCloseTo(expected, 10);
  });

  it('still agrees with the class-filtered lookup wherever the id belongs to one class', () => {
    const shared = ['THE_FAMILY_GUY'];
    TALENTS.filter(([, talent]) => !shared.includes(talent)).forEach(([className, talent, , , yBonus]) => {
      const scoped = getHighestTalentByClass(characters, CLASSES[className], talent,
        yBonus ? 'y' : false, false, false, false, active);
      const global = getHighestTalentAcrossCharacters(characters, talent, active, yBonus ? 'y' : false);
      expect(global).toBeCloseTo(scoped, 10);
    });
  });

  // Reads the parser sources rather than asserting a row count: a count only proves nobody edited
  // the array above it, and would fail on a legitimate addition while staying silent on the thing
  // that matters - a new lookup landing with no pinned game value behind it.
  it('covers every talent the parsers look up', () => {
    const dir = path.resolve(__dirname, '../../parsers');
    const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((entry) => (
      entry.isDirectory() ? walk(path.join(d, entry.name))
        : entry.name.endsWith('.ts') ? [path.join(d, entry.name)] : []
    ));
    const looked = new Set();
    walk(dir).forEach((file) => {
      const src = fs.readFileSync(file, 'utf8');
      // the talent-name literal may itself contain an escaped quote: 'AGRICULTURAL_\'PRECIATION'
      for (const [, name] of src.matchAll(/getHighestTalentAcrossCharacters\(\s*[^,]+,\s*'((?:[^'\\]|\\.)*)'/g)) {
        looked.add(name.replace(/\\'/g, "'"));
      }
    });
    const pinned = new Set(TALENTS.map(([, talent]) => talent));
    expect([...looked].filter((talent) => !pinned.has(talent))).toEqual([]);
  });
});

// Read from a fresh account in the live client on 2026-08-20 (4 characters, none of these talents
// levelled). getbonus2 still evaluates growth() at level 0, so an unowned talent answers with its
// identity rather than zero - 0 for add/decay, 1 for decayMulti, x1 for bigBase. Returning 0 for a
// multiplier is the empty-account trap: tesseract reads `100 * (talent - 1)` and lands on -100.
const UNOWNED = [
  ['ENHANCEMENT_ECLIPSE', 'add', 0],
  ['POWER_ORB', 'decay', 0],
  ['DANK_RANKS', 'decayMulti', 1],
  ['CURVITURE_OF_THE_PAW', 'decayMulti', 1],
  ['SHINY_MEDALLIONS', 'decayMulti', 1],
  ['GENERATIONAL_GEMSTONES', 'decayMulti', 1],
  ['SLAYER_ABOMINATOR', 'decayMulti', 1],
  ['OVERWHELMING_ENERGY', 'decayMulti', 1],
  ['PASSION_OF_THE_SUMMON', 'decayMulti', 1],
  ['SNEAKY_SKILLING', 'add', 0],
  ['SHARED_BELIEFS', 'decay', 0]
];

describe('a talent nobody owns answers with its level-0 value, not zero', () => {
  const characters = [{ name: 'a', addedLevels: 13, flatTalents: [] }];

  it.each(UNOWNED)('%s (%s) -> %d', (talent, _func, expected) => {
    expect(getHighestTalentAcrossCharacters(characters, talent, characters[0])).toBe(expected);
  });

  // getbonus2(2, 475, -1) === 4000 on that account: bigBase(4000, 1000) at level 0.
  it('CHARGE_SYPHON y-variant answers 4000', () => {
    expect(getHighestTalentAcrossCharacters(characters, 'CHARGE_SYPHON', characters[0], 'y')).toBe(4000);
  });
});

// The same account parsed for real, rather than through a hand-built stub. 'Two' is the character
// that was logged in when these were read, and its addedLevels (13) matches the client's
// AllTalentLVz exactly. Most rows are 0 because nobody owns the talent; the non-zero ones are
// either level-0 identities or the three talents this account has actually levelled.
// [talent, talentId, expected, yBonus?]
const FRESH = [
  ["ENHANCEMENT_ECLIPSE", 49, 0],
  ["POWER_ORB", 50, 0],
  ["EXP_CULTIVATION", 55, 0],
  ["VOODOO_STATUFICATION", 56, 0],
  ["MASTER_OF_THE_SYSTEM", 58, 0],
  ["BLOOD_MARROW", 59, 0],
  ["THE_FAMILY_GUY", 144, 21.220657276995304],
  ["1000_HOURS_PLAYED", 176, 0],
  ["BITTY_LITTY", 177, 0],
  ["AGRICULTURAL_'PRECIATION", 206, 0],
  ["DANK_RANKS", 207, 1],
  ["WRAITH_OVERLORD", 208, 0],
  ["APOCALYPSE_WOW", 209, 0],
  ["UNENDING_LOOT_SEARCH", 325, 49.77900552486188],
  ["EXPERTLY_SAILED", 326, 41.65137614678899],
  ["ARCHLORD_OF_THE_PIRATES", 328, 3.643979057591623],
  ["SHINING_BEACON_OF_EGG", 372, 0],
  ["CURVITURE_OF_THE_PAW", 373, 1],
  ["SHINY_MEDALLIONS", 429, 1],
  ["SNEAKY_SKILLING", 431, 0],
  ["GENERATIONAL_GEMSTONES", 432, 1],
  ["DUSTWALKER", 433, 0],
  ["SLAYER_ABOMINATOR", 434, 1],
  ["CHARGE_SYPHON", 475, 4000, true],
  ["SHARED_BELIEFS", 506, 0],
  ["GODS_CHOSEN_CHILDREN", 507, 0],
  ["WORMHOLE_EMPEROR", 508, 0],
  ["PURPLE_TUBE", 535, 0],
  ["GREEN_TUBE", 536, 0],
  ["OVERWHELMING_ENERGY", 589, 1],
  ["PASSION_OF_THE_SUMMON", 596, 1],
  ["TACHYON_TRUTH", 598, 0]
];

describe('fresh account: every talent matches the live client', () => {
  const { characters } = parseFixture(fresh);
  const active = characters.find((character) => character.name === 'Two');

  it('the parsed active character carries the added levels the client reported', () => {
    expect(active.addedLevels).toBe(13);
  });

  it.each(FRESH)('%s (id %i)', (talent, _id, expected, yBonus) => {
    const got = getHighestTalentAcrossCharacters(characters, talent, active, yBonus ? 'y' : false);
    expect(got).toBeCloseTo(expected, 10);
  });
});
