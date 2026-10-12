import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within } from '../helpers/live-verified';
import { getBestActiveCharacter, getOwnOrHighestTalent, getTalentBonus } from '@parsers/talents';
import { getKitchens, getMealLevelCost, getRibbonBonus, parseKitchens } from '@parsers/world-4/cooking';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr (Wind Walker,
// no BLOOD_MARROW of its own). latest.json is that account's save (OptionsListAccount[340] matches). Caches
// were rebuilt first (calcEtcBonuses, TalentCalc(-2), PaletteBonus(-1)).
const GAME = {
  // Summoning2("ExpRateCook"), CkMst_AcLvT / CkMst_RbLvT caches rebuilt
  cookingMasteryExp: 266958.2014651165,
  // CookingR("CookingSPEED", t) / ("CookingFIRE", t), Gordonius Major from the logged-in character; [0] is the
  // kitchen at speed level 532, [1] the others
  mealSpeed: [4.6564444608964815e149, 4.665035686839095e149],
  fireSpeed: [1.4341404750760975e67, 1.4367864907127692e67],
  // Inputs of the daily ribbon roll (N.js daily reset): MeritocBonusz(11), getbonus2(1, 204, -1),
  // PaletteBonus(33), GrimoireUpgBonus(5), SushiStuff(14), BonusAmountcook(3, 99), ArmoryUpgBonus(82)
  ribbons: {
    meritocracy: 166.0497512437811,
    connoisseur: 1,
    bundleDeathBringer: 1,
    bundleBoaring: 0,
    bundleAnniversary: 0,
    legendTalent: 1,
    talent: 172.5212464589235,
    palette: 8.653846153846153,
    grimoire: 375,
    sushi: 20,
    armory: 60,
    elegantRibbons: 1,
    binGoosey: 0,
    smoky: 71.42857142857143
  },
  // GetTalentNumber(1, 59), getbonus2(1, 59, -1), the summed meal levels and DNSM.CalcTalentMAP[59] / TalentCalc(59)
  bloodMarrowOwn: 0,
  bloodMarrowHighest: 1.0230769230769232,
  totalMealLevels: 10948,
  talentCalc59: 2.4925319900030245e+48,
  // Read 2026-10-12, logged in as MortasNinth; equinox clouds 0-35 and 37 completed, OptionsListAccount[193] = 0.
  // Summoning("RibbonBonus", rank) for ranks 0, 10, 20, 30, 40 (EMPEROR_SET, cloud 73, jelly RoG 60)
  ribbonBonus: { 0: 1, 10: 2.35, 20: 5, 30: 8.95, 40: 14.2 },
  // CookingR("CookingMenuMealCosts", t) for a level 148 meal (Food_Lust, cloud 33)
  mealCostLv148: 1.7177986595864166e+186
};

const data = latest.data ?? latest;
const parse = (raw) => typeof raw === 'string' ? JSON.parse(raw) : raw;
const { account, characters } = parseFixture(latest);
const loggedIn = getBestActiveCharacter(characters);

describe('cooking verified against the live game', () => {
  it('ribbon multi per rank and meal upgrade cost', () => {
    Object.entries(GAME.ribbonBonus).forEach(([rank, bonus]) => within(getRibbonBonus(account, Number(rank)), bonus));
    within(getMealLevelCost(148, account.achievements, account), GAME.mealCostLv148);
  });

  it('cooking mastery EXP rate', () => {
    within(account.cooking.cookingMastery.expRate, GAME.cookingMasteryExp);
  });

  it('daily ribbon inputs', () => {
    const { dailyRibbons } = account.cooking.cookingMastery;
    const { smoky, ...expected } = GAME.ribbons;
    Object.entries(expected).forEach(([key, value]) => within(dailyRibbons[key] + 1, value + 1));
    within(dailyRibbons.smoky.bonus, smoky);
  });

  it('kitchen meal and fire speed for the logged-in character', () => {
    // No character picked on the page: the logged-in one, as in the game
    const kitchens = parseKitchens(parse(data.Cooking), parse(data.Atoms), characters, account);
    kitchens.forEach(({ speedLv, mealSpeed, fireSpeed }) => {
      const level = speedLv === 532 ? 0 : 1;
      within(mealSpeed, GAME.mealSpeed[level]);
      within(fireSpeed, GAME.fireSpeed[level]);
    });
  });
});

const BLOOD_MARROW = { name: 'BLOOD_MARROW', talentId: 59, skillIndex: 59, funcX: 'decay', x1: 2.1, x2: 220 };
const withBloodMarrow = (level) => ({ flatTalents: [{ ...BLOOD_MARROW, level, baseLevel: level }] });
const bloodMarrowAt = (level) => 2.1 * level / (level + 220);

describe('TalentCalc(59): the logged-in character\'s own BLOOD_MARROW, else the account best', () => {
  it('uses the logged-in character\'s own bonus even when another character has more', () => {
    const own = withBloodMarrow(20);
    within(getOwnOrHighestTalent([own, withBloodMarrow(200)], 'BLOOD_MARROW', own), bloodMarrowAt(20));
  });

  it('falls back to the highest across characters when the logged-in one has none', () => {
    const own = withBloodMarrow(0);
    within(getOwnOrHighestTalent([own, withBloodMarrow(200), withBloodMarrow(80)], 'BLOOD_MARROW', own), bloodMarrowAt(200));
  });

  it('live: IAmTheHunterrr has none, so the kitchen reads the account best', () => {
    expect(getTalentBonus(loggedIn.flatTalents, 'BLOOD_MARROW')).toBe(GAME.bloodMarrowOwn);
    const bonus = getOwnOrHighestTalent(characters, 'BLOOD_MARROW', loggedIn);
    within(bonus, GAME.bloodMarrowHighest);
    const totalMeals = account.cooking.meals.reduce((sum, { level }) => sum + level, 0);
    expect(totalMeals).toBe(GAME.totalMealLevels);
    // TalentCalc(59) as the game writes it, fed the parser's bonus
    within(Math.pow(Math.min(1.012, 1 + bonus / 100), totalMeals), GAME.talentCalc59);
  });

  it('kitchen speed follows the logged-in character\'s own lower level', () => {
    const ownLevel = 20;
    const patched = characters.map((character) => character === loggedIn
      ? { ...character, flatTalents: [...character.flatTalents.filter(({ name }) => name !== 'BLOOD_MARROW'), { ...BLOOD_MARROW, level: ownLevel, baseLevel: ownLevel }] }
      : character);
    const factor = (bonus) => 1 + Math.pow(Math.min(1.012, 1 + bonus / 100), GAME.totalMealLevels) / 100;
    const before = getKitchens(data, characters, account);
    const after = getKitchens(data, patched, account);
    const firstKitchen = before.findIndex((kitchen) => kitchen);
    within(after[firstKitchen].mealSpeed / before[firstKitchen].mealSpeed, factor(bloodMarrowAt(ownLevel)) / factor(GAME.bloodMarrowHighest));
  });
});
