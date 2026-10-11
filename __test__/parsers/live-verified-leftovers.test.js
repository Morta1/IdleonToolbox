import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { getBestActiveCharacter, getOwnOrHighestTalent } from '@parsers/talents';
import { getKitchens } from '@parsers/world-4/cooking';
import { getLab } from '@parsers/world-4/lab';
import { getCharacters } from '@parsers/character';
import { calcHitChance, NO_DEFENCE_OVERRIDE } from '@parsers/damage';
import { GOD_INDEX, isMajorDivinityActive } from '@parsers/world-5/divinity';

// Read from the running game on 11 Oct 2026 through the debug server, logged in as IAmTheHunterrr
// (divinity 214, no BLOOD_MARROW of its own); latest.json is that account's save.
const GAME = {
  // GetTalentNumber(1, 59), getbonus2(1, 59, -1), DNSM.CalcTalentMAP[59], TalentCalc(59)
  bloodMarrowOwn: 0,
  bloodMarrowHighest: 1.0230769230769232,
  totalMealLevels: 10948,
  talentCalc59: 2.4925319900030245e+48,
  // Divinity("Bonus_MAJOR", i, 3) for every player: Morojoze (divinity 1, no link, no Harriep pocket)
  // gets it through King Doot, because Companions(0) checks the LOGGED-IN character's divinity level
  harriepMajor: Array(11).fill(true),
  // ArbitraryCode("HitChancePCT") with DNSM.arbAcc3 set to PlayerAccTot / ratio (target Type Monster)
  playerAccuracy: 6.593752681348616e+26,
  hitChanceByRatio: { 0.3: 0, 0.5: 4, 0.7: 23, 1.2: 71, 1.5: 99, 3: 100 }
};

const TOLERANCE = 1e-9;
const within = (actual, expected) => expect(Math.abs(actual / expected - 1)).toBeLessThan(TOLERANCE);

const BLOOD_MARROW = { name: 'BLOOD_MARROW', talentId: 59, skillIndex: 59, funcX: 'decay', x1: 2.1, x2: 220 };
const withBloodMarrow = (level, extra = {}) => ({
  ...extra,
  flatTalents: [{ ...BLOOD_MARROW, level, baseLevel: level }]
});
const bloodMarrowAt = (level) => 2.1 * level / (level + 220);

describe('TalentCalc(59): the logged-in character\'s own BLOOD_MARROW, else the account best', () => {
  it('uses the logged-in character\'s own bonus even when another character has more', () => {
    const loggedIn = withBloodMarrow(20);
    const characters = [loggedIn, withBloodMarrow(200)];
    within(getOwnOrHighestTalent(characters, 'BLOOD_MARROW', loggedIn), bloodMarrowAt(20));
  });

  it('falls back to the highest across characters when the logged-in one has none', () => {
    const loggedIn = withBloodMarrow(0);
    const characters = [loggedIn, withBloodMarrow(200), withBloodMarrow(80)];
    within(getOwnOrHighestTalent(characters, 'BLOOD_MARROW', loggedIn), bloodMarrowAt(200));
  });

  it('live: IAmTheHunterrr has none, so the kitchen reads the account best', () => {
    const { account, characters } = parseFixture(latest);
    const loggedIn = getBestActiveCharacter(characters);
    expect(loggedIn?.name).toBe('IAmTheHunterrr');
    expect(GAME.bloodMarrowOwn).toBe(0);
    const bonus = getOwnOrHighestTalent(characters, 'BLOOD_MARROW', loggedIn);
    within(bonus, GAME.bloodMarrowHighest);
    const totalMeals = account.cooking.meals.reduce((sum, { level }) => sum + level, 0);
    expect(totalMeals).toBe(GAME.totalMealLevels);
    within(Math.pow(Math.min(1.012, 1 + bonus / 100), totalMeals), GAME.talentCalc59);
  });

  it('kitchen speed follows the logged-in character\'s own lower level, and the page pick', () => {
    const { account, characters } = parseFixture(latest);
    const data = latest.data ?? latest;
    const loggedInIndex = characters.indexOf(getBestActiveCharacter(characters));
    const ownLevel = 20;
    const patched = characters.map((character, index) => index === loggedInIndex
      ? { ...character, flatTalents: [...character.flatTalents.filter(({ name }) => name !== 'BLOOD_MARROW'), { ...BLOOD_MARROW, level: ownLevel, baseLevel: ownLevel }] }
      : character);
    const meals = GAME.totalMealLevels;
    const factor = (bonus) => 1 + Math.pow(Math.min(1.012, 1 + bonus / 100), meals) / 100;
    const expectedRatio = factor(bloodMarrowAt(ownLevel)) / factor(GAME.bloodMarrowHighest);
    const before = getKitchens(data, characters, account);
    const after = getKitchens(data, patched, account);
    const firstKitchen = before.findIndex((kitchen) => kitchen);
    within(after[firstKitchen].mealSpeed / before[firstKitchen].mealSpeed, expectedRatio);
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
    const { account, characters } = parseFixture(latest);
    const loggedIn = getBestActiveCharacter(characters);
    expect(characters.map((character) => isMajorDivinityActive(character, account, GOD_INDEX.Harriep, loggedIn))).toEqual(GAME.harriepMajor);
  });

  it('lab tubes: with the pocket and grid 173 Arctis sources off, Morojoze is uploaded through King Doot', () => {
    const { account, characters } = parseFixture(latest);
    const data = latest.data ?? latest;
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
    const loggedIn = getBestActiveCharacter(characters);
    expect(isMajorDivinityActive(morojoze, noArctisSources, GOD_INDEX.Arctis)).toBe(false);
    expect(isMajorDivinityActive(morojoze, noArctisSources, GOD_INDEX.Arctis, loggedIn)).toBe(true);
    const lab = getLab(data, rawCharacters, noArctisSources, characters);
    expect(lab.connectedPlayers.map(({ playerId }) => playerId)).toContain(morojoze.playerId);
  });
});

describe('ArbitraryCode("HitChancePCT")', () => {
  const monster = { Type: 'Monster', Defence: 1 };

  it('live: the arbAcc3 defence override replaces the target\'s Defence', () => {
    Object.entries(GAME.hitChanceByRatio).forEach(([ratio, expected]) => {
      expect(calcHitChance(GAME.playerAccuracy, monster, GAME.playerAccuracy / Number(ratio))).toBe(expected);
    });
  });

  it('the 0.444 sentinel means no override', () => {
    expect(calcHitChance(70, { Type: 'Monster', Defence: 100 }, NO_DEFENCE_OVERRIDE)).toBe(calcHitChance(70, { Type: 'Monster', Defence: 100 }));
    expect(calcHitChance(70, { Type: 'Monster', Defence: 100 })).toBe(Math.floor(100 * (.95 * .7 - .425)));
  });

  it('ores, trees, fish and bugs use the quarter-defence curve', () => {
    const ore = { Type: 'Ore', Defence: 100 };
    expect(calcHitChance(24, ore)).toBe(0);
    expect(calcHitChance(25, ore)).toBe(Math.floor(6 * (.25 - .174) / (.25 - .17 + 9.04) * 100));
    expect(calcHitChance(70, ore)).toBe(Math.floor(6 * (.7 - .174) / (.7 - .17 + 9.04) * 100));
    expect(calcHitChance(200, { Type: 'Fish', Defence: 100 })).toBe(100);
    // the monster curve would give 0 at a 0.4 ratio
    expect(calcHitChance(40, { Type: 'Monster', Defence: 100 })).toBe(0);
    expect(calcHitChance(40, { Type: 'Bug', Defence: 100 })).toBeGreaterThan(0);
  });

  it('no target answers 0', () => {
    expect(calcHitChance(100, undefined)).toBe(0);
  });
});

describe('Gaming superbit display', () => {
  it('42 Bigger_Palette is a flag with no value; 55 shows the logged-in farming multi', () => {
    const { account } = parseFixture(latest);
    const superbits = account.gaming.superbitsUpgrades;
    const biggerPalette = superbits.find(({ name }) => name === 'Bigger_Palette');
    expect(biggerPalette.description).not.toContain('{');
    expect(biggerPalette.additionalInfo).toBeUndefined();
    const megacrop = superbits.find(({ name }) => name === 'Mo_Stickers_Mo_Bonusers');
    expect(megacrop.totalBonus).toBeGreaterThan(1);
  });
});
