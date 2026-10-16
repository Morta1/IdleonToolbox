import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { withLoggedInDivinity } from '../helpers/live-verified';
import { getBestActiveCharacter } from '@parsers/talents';
import { getCharacters } from '@parsers/character';
import { getLab } from '@parsers/world-4/lab';
import {
  getAccountMinorDivinityBonus,
  getCharacterMinorDivinityBonus,
  GOD_INDEX,
  GOD_SLOT,
  isGainingDivinityPoints,
  isMajorDivinityActive,
  isMeditatingForDivinity,
  isMeditatingOnClaim
} from '@parsers/world-5/divinity';
import { getDivinityAlert } from '@utility/dashboard/characters';
import { getNobisectBonus } from '@parsers/efficiency';
import { getMaxDamage } from '@parsers/damage';

// Read from the running game through the debug server for the save latest.json was exported from, with
// IAmTheHunterrr (Wind Walker, divinity 214) logged in: the minor bonuses and the no-Doot majors on 2026-10-10,
// the rest on 2026-10-11 (OptionsListAccount[340] matches). King Doot is active, so Harriep and Goharut reach
// every character while Purrmep and Kattlekruk stay with the linked ones; Companions(0) checks the LOGGED-IN
// character's divinity level, so character 10 (Morojoze, divinity 1) still counts.
// "noDoot" = DNSM.CompanionBon["0"] set to 0 for the read and restored right after, which is also what a
// logged-in character under divinity 2 sees. The account owns gem shop item 9 (Snehebatu for everyone) and
// pocket divinities in slots 1 and 5 (Arctis and Omniphau for everyone); MortaWiz reaches Flutterbis through
// polytheism. Pockets Holes[11][29..30] = [1, 5].
const GAME = {
  // Divinity("Bonus_Minor", player, godIndex) summed over the account
  minorAccount: { Harriep: 1418.0237260005854, Goharut: 70.90118630002925, Purrmep: 64.29963673515722, Kattlekruk: 16.031377022500234 },
  // Divinity("Bonus_Minor", 5, godIndex)
  minorHunter: { Snehebatu: 99.00400792818888, Flutterbis: 212.15144556040477, Arctis: 21.215144556040475, Omniphau: 141.43429704026985, Nobisect: 282.8685940805397 },
  // noDoot: all 110 character x god values and the four sums matched; these are the link paths King Doot hides
  minorAccountNoDoot: { Harriep: 288.08125768439083, Goharut: 7.071714852013492, Purrmep: 64.29963673515722, Kattlekruk: 16.031377022500234 },
  minorCharacterNoDoot: [
    ['morta11', 'Snehebatu', 115.13258677270223],
    ['morta11', 'Harriep', 0],
    ['MortaWiz', 'Flutterbis', 206.4412010443864],
    ['MortaWiiz', 'Harriep', 158.73213422299582],
    ['IAmTheHunterrr', 'Goharut', 7.071714852013492],
    ['Morojoze', 'Omniphau', 2.968668407310705]
  ],
  // noDoot Divinity("Bonus_MAJOR", player, godIndex) for godIndex 0-9, one digit each. Everyone has Snehebatu
  // (gem shop), Arctis and Omniphau (pocket), Purrmep (someone linked) and Kattlekruk (Coral Kid and a link);
  // the rest come from each character's own links
  majorNoDoot: ['1010101010', '1010101010', '1110101010', '1010101010', '1011101010', '1010111010',
    '1010101010', '1011101010', '1010101010', '1010101010', '1010101010'],
  // Divinity("Bonus_MAJOR", i, 3) for every player: Morojoze (no link, no Harriep pocket) gets it through King Doot
  harriepMajor: Array(11).fill(true),
  // Divinity("DivPerHr", t, 0) > 0, with and without King Doot (AFK target Nothing for the logged-in character)
  divPerHr: Array(11).fill(1),
  divPerHrNoDoot: [1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0]
};

const data = latest.data ?? latest;
const { account, characters } = parseFixture(latest);
const loggedIn = getBestActiveCharacter(characters);
const noDootAccount = {
  ...account,
  companions: { ...account.companions, list: account.companions.list.map((companion, index) => index === 0 ? { ...companion, acquired: false } : companion) }
};
const withLevel = (character, skill, level) => ({
  ...character,
  skillsInfo: { ...character.skillsInfo, [skill]: { ...character.skillsInfo?.[skill], level } }
});

describe('minor divinity bonuses verified against the live game', () => {
  it.each(Object.entries(GAME.minorAccount))('account wide %s', (god, value) => {
    expect(getAccountMinorDivinityBonus(account, characters, GOD_INDEX[god])).toBeCloseTo(value, 6);
  });

  it.each(Object.entries(GAME.minorHunter))('IAmTheHunterrr %s', (god, value) => {
    const hunter = characters.find(({ name }) => name === 'IAmTheHunterrr');
    expect(getCharacterMinorDivinityBonus(hunter, account, GOD_INDEX[god])).toBeCloseTo(value, 6);
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
});

describe('minor and major divinity bonuses verified against the live game without King Doot', () => {
  it.each(Object.entries(GAME.minorAccountNoDoot))('account wide %s', (god, value) => {
    expect(getAccountMinorDivinityBonus(noDootAccount, characters, GOD_INDEX[god])).toBeCloseTo(value, 6);
  });

  it.each(GAME.minorCharacterNoDoot)('%s %s', (name, god, value) => {
    const character = characters.find((candidate) => candidate.name === name);
    expect(getCharacterMinorDivinityBonus(character, noDootAccount, GOD_INDEX[god])).toBeCloseTo(value, 6);
  });

  it('major bonuses for every character and god', () => {
    const toolbox = characters.map((character) =>
      Array.from({ length: 10 }, (_, godIndex) => isMajorDivinityActive(character, noDootAccount, godIndex) ? 1 : 0).join(''));
    expect(toolbox).toEqual(GAME.majorNoDoot);
  });
});

describe('King Doot in Bonus_MAJOR follows the logged-in character\'s divinity level', () => {
  const doot = { companions: { list: [{ acquired: true }] }, divinity: { linkedDeities: [-1, -1] } };
  const lowDivinity = { playerId: 0, skillsInfo: { divinity: { level: 1 } } };
  const highDivinity = { playerId: 1, skillsInfo: { divinity: { level: 50 } } };

  it('an unlinked character under divinity 2 gets the major bonus when the logged-in one qualifies', () => {
    expect(isMajorDivinityActive(lowDivinity, doot, GOD_INDEX.Harriep)).toBe(false);
    expect(isMajorDivinityActive(lowDivinity, doot, GOD_INDEX.Harriep, highDivinity)).toBe(true);
  });

  it('and loses it when the logged-in character is under divinity 2', () => {
    expect(isMajorDivinityActive(highDivinity, doot, GOD_INDEX.Arctis)).toBe(true);
    expect(isMajorDivinityActive(highDivinity, doot, GOD_INDEX.Arctis, lowDivinity)).toBe(false);
  });

  it('live: every character, Morojoze included, has the Harriep major bonus', () => {
    expect(characters.map((character) => isMajorDivinityActive(character, account, GOD_INDEX.Harriep, loggedIn))).toEqual(GAME.harriepMajor);
  });

  it('lab tubes: with the pocket and grid 173 Arctis sources off, Morojoze is uploaded through King Doot', () => {
    const rawCharacters = getCharacters(data, latest.charNames ?? []);
    const morojoze = characters.find(({ name }) => name === 'Morojoze');
    expect(morojoze.skillsInfo.divinity.level).toBeLessThan(2);
    expect(morojoze.afkTarget).not.toBe('Laboratory');
    const holesObject = account.hole.holesObject;
    const gridSquares = [...account.research.gridSquares];
    gridSquares[173] = { ...gridSquares[173], bonuses: [0] };
    const noArctisSources = {
      ...account,
      hole: { ...account.hole, holesObject: { ...holesObject, idleonMajiks: [0, ...holesObject.idleonMajiks.slice(1)] } },
      research: { ...account.research, gridSquares }
    };
    expect(isMajorDivinityActive(morojoze, noArctisSources, GOD_INDEX.Arctis)).toBe(false);
    expect(isMajorDivinityActive(morojoze, noArctisSources, GOD_INDEX.Arctis, loggedIn)).toBe(true);
    const lab = getLab(data, rawCharacters, noArctisSources, characters);
    expect(lab.connectedPlayers.map(({ playerId }) => playerId)).toContain(morojoze.playerId);
  });
});

describe('Divinity("DivPerHr"): who meditates', () => {
  const stub = (extra = {}) => ({
    companions: { list: [{ acquired: true }] },
    divinity: { linkedDeities: [-1, -1, -1], linkedStyles: [0, 0, 0] },
    hole: { holesObject: { extraCalculations: [] } },
    ...extra
  });
  const high = { playerId: 0, afkTarget: 'Nothing', afkTime: 2, skillsInfo: { divinity: { level: 50 } } };
  const low = { ...high, skillsInfo: { divinity: { level: 1 } } };
  const labber = { playerId: 1, afkTarget: 'Laboratory', afkTime: 1, skillsInfo: { divinity: { level: 1 } } };
  const fighter = { playerId: 2, afkTarget: 'Green_Mushroom', afkTime: 1, skillsInfo: { divinity: { level: 90 } } };

  it('a lab character meditates through King Doot, which follows the logged-in character', () => {
    expect(isMeditatingForDivinity(labber, stub(), [high, labber, fighter])).toBe(true);
    expect(isMeditatingForDivinity(labber, stub(), [low, labber, fighter])).toBe(false);
  });

  it('outside the lab only a raw Arctis pocket slot counts the character in', () => {
    expect(isMeditatingForDivinity(fighter, stub(), [high, labber, fighter])).toBe(false);
    const arctisPocket = stub({ hole: { holesObject: { extraCalculations: Object.assign([], { 29: GOD_SLOT.Arctis }) } } });
    expect(isMeditatingForDivinity(fighter, arctisPocket, [high, labber, fighter])).toBe(true);
  });

  it('a pocket or direct Goharut link works without King Doot', () => {
    const noDoot = { companions: { list: [{ acquired: false }] } };
    expect(isMeditatingForDivinity(labber, stub(noDoot), [high, labber])).toBe(false);
    const linked = stub({ ...noDoot, divinity: { linkedDeities: [-1, GOD_SLOT.Goharut], linkedStyles: [] } });
    expect(isMeditatingForDivinity(labber, linked, [high, labber])).toBe(true);
    const pocket = stub({ ...noDoot, hole: { holesObject: { extraCalculations: Object.assign([], { 30: GOD_SLOT.Goharut }) } } });
    expect(isMeditatingForDivinity(labber, pocket, [high, labber])).toBe(true);
  });

  it('the logged-in character at the lab with Goharut major makes everyone meditate', () => {
    expect(isMeditatingForDivinity(fighter, stub(), [{ ...high, afkTarget: 'Laboratory' }, fighter])).toBe(true);
  });

  it('TranQi earns without meditating', () => {
    const tranQi = stub({ companions: { list: [] }, divinity: { linkedDeities: [], linkedStyles: [0, 0, 5] } });
    expect(isMeditatingForDivinity(fighter, tranQi, [high, fighter])).toBe(false);
    expect(isGainingDivinityPoints(fighter, tranQi, [high, fighter])).toBe(true);
  });

  it('live: every character earns, and without King Doot only TranQi, the Goharut link and the Divinity AFK do', () => {
    expect(characters.map((character) => isGainingDivinityPoints(character, account, characters) ? 1 : 0)).toEqual(GAME.divPerHr);
    const lowCharacters = withLoggedInDivinity(characters, 1);
    expect(lowCharacters.map((character) => isGainingDivinityPoints(character, account, lowCharacters) ? 1 : 0)).toEqual(GAME.divPerHrNoDoot);
  });

  // Only the Divinity claim and the lab claim with Goharut pay Divinity_PTS, whatever DivPerHr shows.
  it.each([
    ['AFK at Divinity', { ...fighter, afkTarget: 'Divinity' }, stub(), true],
    ['in the lab through King Doot', labber, stub(), false],
    ['in the lab through King Doot at divinity 2+', { ...labber, skillsInfo: { divinity: { level: 2 } } }, stub(), true],
    ['fighting with an Arctis pocket', fighter, stub({ hole: { holesObject: { extraCalculations: Object.assign([], { 29: GOD_SLOT.Arctis }) } } }), false]
  ])('an AFK claim pays the style rate: %s', (_, character, account, expected) => {
    expect(isMeditatingOnClaim(character, account)).toBe(expected);
  });

  it('the style alert asks Divinity claimers for Mindful and everyone else for TranQi', () => {
    const options = { divinityStyle: { checked: true } };
    const alerts = characters.map((character) => getDivinityAlert(account, characters, character, 0, options)?.icon ?? null);
    expect(alerts).toEqual([null, 'Div_Style_5', 'Div_Style_5', 'Div_Style_5', 'Div_Style_5', 'Div_Style_5', null, 'Div_Style_5', 'Div_Style_5', 'Div_Style_5', null]);
  });
});

// Divinity("BlesssBonus", t) read 2026-10-16 (Divinity[28..37] and [25] match latest.json). True Godly Blessings
// raises every god but Nobisect, which is 122 x 50 x the active character's efficiency scaling (its 0.1 floor here)
// and has no cap: the parser once capped it at 500.
describe('blessing bonuses verified against the live game', () => {
  const GAME_BLESSINGS = [353.8, 530.6999999999999, 610, 530.6999999999999, 707.6, 348, 413.25, 65.25, 176.9, 427.75];

  it('every god but Nobisect', () => {
    const others = (list) => list.filter((_, slot) => slot !== GOD_SLOT.Nobisect);
    expect(others(account.divinity.deities.map(({ blessingBonus }) => blessingBonus)).map((value) => Number(value.toFixed(6))))
      .toEqual(others(GAME_BLESSINGS).map((value) => Number(value.toFixed(6))));
  });

  it('Nobisect for the active character', () => {
    const playerInfo = getMaxDamage(loggedIn, characters, account);
    expect(getNobisectBonus(loggedIn, account, characters, playerInfo)).toBeCloseTo(GAME_BLESSINGS[GOD_SLOT.Nobisect], 9);
    expect(account.divinity.deities[GOD_SLOT.Nobisect].blessingBonus).toBe(122 * account.divinity.deities[GOD_SLOT.Nobisect].blessingMultiplier);
  });
});
