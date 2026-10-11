import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { getKrukBubblesDaily, getUpgradeableBubbles, getVialMultiplier } from '@parsers/world-2/alchemy';
import { getShinyChance, getTrapsBonuses } from '@parsers/world-3/traps';
import { calcBreedabilityMulti, calcShinyLvMulti } from '@parsers/world-4/breeding';
import { parseKitchens } from '@parsers/world-4/cooking';

// Read from the running game on 11 Oct 2026 through the debug server, logged in as IAmTheHunterrr (Wind Walker).
// latest.json is the same account's save (OptionsListAccount[340] matches). Caches were rebuilt first
// (calcEtcBonuses, TalentCalc(-2), PaletteBonus(-1), LoreEpiBon(-1)).
const GAME = {
  // CauldronStats("VialBonus") / the raw vial value
  vialMulti: 3.3600000000000003,
  // Thingies("KrukBubblesDaily")
  krukDaily: 2142,
  // ArcaneType("NBLB_bubbleQTY", 0, 0)
  upgradeableBubbles: 10,
  // Summoning2("MeritocBonuszMulti"), Summoning2("VotingBonuszMulti")
  meritocracyMulti: 1.6604975124378107,
  voteMulti: 2.208653846153846,
  // TrappingStuffs("CollectAllPCT") / ("CollectAllPCTexp") for the logged-in Wind Walker; the other
  // characters take the non-hunter branch, max over getbonus2(1|2, 310, i) of every character
  hunterCritters: 6491.96,
  otherCritters: 6457.96,
  hunterExp: 99,
  otherExp: 84,
  // TrappingStuffs("TotalRareChance") on Froge (base 5), then RareBonusOnOpen 243 and the Shiny Snitch curse 21
  froge: 86204408.50905809,
  rareBonusOnOpen: 243,
  shinySnitchCurse: 21,
  // Breeding("BreedabilitySpdMulti") / ("ShinySpdMulti"), star signs from the logged-in character
  breedability: 98251.86370996364,
  shinyLvMulti: 23400.111818197933,
  // Summoning2("ExpRateCook"), CkMst_AcLvT / CkMst_RbLvT caches rebuilt
  cookingMasteryExp: 266958.2014651165,
  // CookingR("CookingSPEED", t) / ("CookingFIRE", t), Gordonius Major from the logged-in character
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
  // ChestSlotsOwned
  storageSlots: 601
};

const TOLERANCE = 1e-9;
const within = (actual, expected, tolerance = TOLERANCE) => expect(Math.abs(actual / expected - 1)).toBeLessThan(tolerance);
const parse = (raw) => typeof raw === 'string' ? JSON.parse(raw) : raw;

describe('world 2 to 4 formulas verified against the live game', () => {
  const { account, characters } = parseFixture(latest);
  const hunterIndex = characters.findIndex(c => c?.name === 'IAmTheHunterrr');
  const hunter = characters[hunterIndex];

  it('vial multiplier, Kruk daily bubble levels and upgradeable bubbles', () => {
    within(getVialMultiplier(account).value, GAME.vialMulti);
    expect(getKrukBubblesDaily(account).value).toBe(GAME.krukDaily);
    expect(getUpgradeableBubbles(account, characters).upgradeableBubblesAmount).toBe(GAME.upgradeableBubbles);
  });

  it('vote ballot meritocracy and bonus multis', () => {
    within(account.voteBallot.meritocracyMult, GAME.meritocracyMulti);
    within(account.voteBallot.voteMulti, GAME.voteMulti);
  });

  it('critter collect rates per character', () => {
    const { perCharacter } = getTrapsBonuses(account, characters);
    perCharacter.forEach(({ name, critter, exp }) => {
      const isHunter = name === hunter.name;
      within(critter, (isHunter ? GAME.hunterCritters : GAME.otherCritters) / 100);
      within(exp, (isHunter ? GAME.hunterExp : GAME.otherExp) / 100);
    });
  });

  it('shiny critter chance, Cuz I Catch Em All with the archer class multiplier', () => {
    const shiny = getShinyChance(hunter, account);
    const froge = shiny.critters.find(({ rawName }) => rawName === 'Critter1');
    within(froge.chance, GAME.froge * (1 + GAME.rareBonusOnOpen / 100) / Math.round(1 + GAME.shinySnitchCurse));
  });

  it('breedability and shiny level multis for the logged-in character', () => {
    within(calcBreedabilityMulti(account, characters).value, GAME.breedability);
    within(calcShinyLvMulti(account, characters).value, GAME.shinyLvMulti);
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
    const data = latest.data;
    // No character picked on the page: the logged-in one, as in the game
    const kitchens = parseKitchens(parse(data.Cooking), parse(data.Atoms), characters, account);
    kitchens.forEach(({ speedLv, mealSpeed, fireSpeed }) => {
      const level = speedLv === 532 ? 0 : 1;
      within(mealSpeed, GAME.mealSpeed[level]);
      within(fireSpeed, GAME.fireSpeed[level]);
    });
  });

  it('storage slots', () => {
    expect(account.storage.slots.value).toBe(GAME.storageSlots);
  });
});
