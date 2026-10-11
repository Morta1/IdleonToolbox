import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within } from '../helpers/live-verified';
import { commaNotation, notateNumber } from '@utility/helpers';
import { getMonumentMaxLinearTime } from '@parsers/world-5/caverns/bravery';
import { getMotherlodeEffBase, getTotalOreReq, LAYER_CAVERN } from '@parsers/world-5/caverns/motherlode';
import { getHarpExpGain, getHarpStringAllBonus } from '@parsers/world-5/caverns/the-harp';
import { getLampBonus } from '@parsers/world-5/caverns/the-lamp';
import { getNewCollectibleChance } from '@parsers/world-5/caverns/the-jars';
import { getTorchBonus } from '@parsers/world-5/caverns/the-temple';

const { account } = parseFixture(latest);
const { caverns, holesObject } = account.hole;

// Caverns part A: Bravery, Justice, Wisdom, The Well, Motherlode, The Den, Evertree, The Fountain.
// Read from the running game on 2026-10-12 through the debug server (N.js fingerprint matched), logged in as
// IAmTheHunterrr; latest.json is that account's save (OptionsListAccount[340] matches). Only readings whose inputs
// still equal the save are pinned here. The monument bonus levels (Holes[15]) had grown by 100 since the export, so
// MonumentROGbonuses, BucketFillRate and Bravery_MinDMG/MaxDMG were compared with the live Holes array swapped into
// the parse instead (exact, the sword damage after dividing out the drifting skill-level measurement).
const GAME_A = {
  // Holes("Bravery_SwordsOwned" / "MaxRerolls" / "MaxRevisions" / "Bravery_OpalRewardChanceDEC")
  bravery: { ownedSwords: 8, maxRethrow: 15, maxRetelling: 1, opalChance: 0.5 },
  // Holes("MonumentRewardMulti_MaxLinearTime", t)
  maxLinearTime: [1389600.0000000002, 2599200, 1389600.0000000002],
  // Holes("J_StartCoins" / "J_Happiness" / "J_Dismissals" / "J_StartHealth" / "Justice_OpalRewardChanceDEC")
  justice: { coins: 68, popularity: 10, dismissals: 4, health: 5, opalChance: 0.5 },
  // Holes2("W_attempts" / "W_attemptsGainPerRound" / "W_timePerMatch" / "W_instamatches" / "Wisdom_OpalRewardChanceDEC")
  wisdom: { attempts: 27, attemptsGainPerRound: 2, timePerMatch: 12.6, instantMatches: 4, opalChance: 0.5 },
  // Holes("SedimentMax", t)
  sedimentMax: [
    212025518483025.2, 18069385668231789000, 21415568199385825000, 19009948055665760000, 22942951825152970000,
    81515166019272230000, 18846806987610456000, 18614055901984633000, 18384238035313383000, 21788723292063085000
  ],
  // Holes("BucketsOwned"), Holes2("HolezBucketGoldOwned" / "HolezBucketGoldMult"), Holes("WellOpal_cost")
  buckets: 9,
  goldenBucketsOwned: 1,
  goldenBucketMulti: 3.95,
  wellOpalCost: 506770377338174.4,
  // Holes("TotalOreREQ", t) and Holes("MotherlodeEffBase", t): Motherlode, Hive, Evertree, Trench
  totalOreReq: [369247.55331915885, 3256.7283997626137, 167839.79696325405, 3467764.400067231],
  motherlodeEffBase: [74962673.51641624, 2203992.1152000003, 41645929.731342345, 1285368201.5846403],
  // Holes("HoundNextOpalScoreReq" / "AmpStonesOwned" / "AmpMulti")
  den: { nextOpalAt: 17982988.396270752, ownedAmps: 8, ampMulti: 4.1899999999999995 },
  // NotateNumber(Holes("AmpDebuff", t), t == 7 ? "Small" : "Big"), as the amplifier panel prints it
  ampDebuffText: ['68K', '96.6K', '15', '4', '2', '2', '4', '0.1'],
  // Holes2("Fountain_BonTOT", t, i) after a -1 rebuild, Holes2("Cost_FountainUPG", t, i), Holes2("Fountain_UpgUnlocked", t, i)
  fountainBonus: [
    [10, 220, 136, 60, 59, 925, 900, 280, 64, 144, 5, 9, 720, 10, 122, 295, 56, 90, 200, 75],
    [0, 40, 150, 100, 20, 55, 0, 0, 42, 600, 265, 163, 110, 0, 75, 40, 20, 33, 50, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  ],
  fountainCost: [
    [161051.00000000006, 82809.2158368654, 3627.8383609363873, 54753.41294295477, 81241.77732792014, 11562.68519450066,
      79695.3391777247, 5199.126417960171, 191691.03015367387, 69758.34869409486, 16000000, 6553600, 126462.18552730363,
      2384185.791015625, 25207.99278753006, 6920.03726230499, 28521.95391771543, 23737.631379976956, 13957.645566204608,
      189901.05103981565],
    [1000000, 12000, 93333.2618535589, 35711.88241141773, 44.501135092786974, 142.65583530550012, 100, 250,
      35424.953989539405, 52939.55920339377, 7812361.259143757, 3076.3938106473806, 1163.0978490160232, 5000,
      154.79341055999993, 1011.3894339269767, 339.45673899222203, 2326.1956980320465, 3890.6136901500035, 10000],
    [1000000000, 10000000, 5000, 20000, 100000, 50000, 200000, 1000000, 10000, 350000, 100000, 10000, 10000000, 10000,
      15000, 25000, 50000, 100000, 250000, 1000000]
  ],
  fountainUnlocked: [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0]
  ],
  // Holes2("Fountain_WatersOwned" / "SpacesOwned" / "MaxStackSize" / "Fount_CurrencyALLmulti" / "Fount_MarblePerFill")
  fountain: { watersOwned: 1, spacesOwned: 6, maxStackSize: 20, currencyAllMulti: 413.9450638644149, marblePerFill: 793.875 },
  // Holes2("Fount_CurrencyBaseValue", t) for the dollar-and-up currencies (the coins grow with live Mythril)
  currencyBaseValue: { 3: 571, 4: 156, 5: 21, 6: 1, 7: 1, 8: 1 },
  // Holes2("FountainBar_Speed", t) for the bars the save has (FountainBar_DoWeHave 1, 1, 0)
  fountainBarSpeed: [3.1756417910447765, 1],
  // Holes2("FountainBar_ActiveSpdMulti")
  fountainActiveMulti: 12.2
};

describe('caverns part A verified against the live game', () => {
  it.each([
    ['bravery', caverns.bravery, GAME_A.bravery],
    ['justice', caverns.justice, GAME_A.justice],
    ['wisdom', caverns.wisdom, GAME_A.wisdom],
    ['the den', caverns.theDen, GAME_A.den],
    ['the fountain', caverns.theFountain, GAME_A.fountain]
  ])('%s scalar readings', (_, cavern, expected) => {
    Object.entries(expected).forEach(([key, value]) => within(cavern[key], value));
  });

  it('monument max linear reward time per monument', () => {
    GAME_A.maxLinearTime.forEach((value, t) => within(getMonumentMaxLinearTime(holesObject, t, account), value));
  });

  it('well sediment caps, buckets and opal cost', () => {
    const { theWell } = caverns;
    // sediments[0] is the rock layer, repeated in front of the ten sediments
    GAME_A.sedimentMax.forEach((value, index) => within(theWell.sediments[index + 1].max, value));
    expect(theWell.buckets.length).toBe(GAME_A.buckets);
    expect(theWell.goldenBucketsOwned).toBe(GAME_A.goldenBucketsOwned);
    within(theWell.goldenBucketMulti, GAME_A.goldenBucketMulti);
    expect(theWell.opalCost).toBe(notateNumber(GAME_A.wellOpalCost, 'TinyE'));
  });

  it('layer requirement and efficiency of every layered cavern, Evertree including the Trench study', () => {
    GAME_A.totalOreReq.forEach((value, t) => within(getTotalOreReq(holesObject, account, t), value));
    GAME_A.motherlodeEffBase.forEach((value, t) => within(getMotherlodeEffBase(holesObject, t), value));
    expect(caverns.evertree.logs.required).toBe(commaNotation(GAME_A.totalOreReq[LAYER_CAVERN.EVERTREE]));
    expect(caverns.motherlode.ores.required).toBe(commaNotation(GAME_A.totalOreReq[LAYER_CAVERN.MOTHERLODE]));
  });

  it('den amplifier debuffs as the game prints them', () => {
    expect(caverns.theDen.amplifiers.map(({ bonus }) => bonus)).toEqual(GAME_A.ampDebuffText);
  });

  it('fountain upgrade bonuses, costs and unlocks', () => {
    const { waters } = caverns.theFountain;
    expect(waters.map(({ upgrades }) => upgrades.map(({ bonus }) => bonus))).toEqual(GAME_A.fountainBonus);
    expect(waters.map(({ upgrades }) => upgrades.map(({ unlocked }) => unlocked ? 1 : 0))).toEqual(GAME_A.fountainUnlocked);
    waters.forEach(({ upgrades }, t) => upgrades.forEach(({ cost }, i) => within(cost, GAME_A.fountainCost[t][i])));
  });

  it('fountain currency base values and bars', () => {
    const { currencies, fountainBars } = caverns.theFountain;
    Object.entries(GAME_A.currencyBaseValue).forEach(([type, value]) => within(currencies[type].baseValue, value));
    expect(fountainBars.map(({ tier }) => tier)).toEqual(GAME_A.fountainBarSpeed.map((_, tier) => tier));
    fountainBars.forEach(({ speedPerSecond }, index) => within(speedPerSecond, GAME_A.fountainBarSpeed[index]));
    within(fountainBars[0].activeMulti, GAME_A.fountainActiveMulti);
  });
});

// Caverns part B: The Bell, The Harp, The Lamp, The Hive, Grotto, The Jars, The Temple, The Bottomless Trench and
// Crystal Glunko Cove. Read from the same live session on 2026-10-12; every reading below still matched the save.
const GAME_B = {
  // Holes("BellMethodsOwned" / "BellMethodsNewODDS"), Holes("BellMethodsQTY" / "BellCosts", t), Holes("BellBonuss", t),
  // Holes("BellEXPreq", t)
  bellMethodsOwned: 6,
  bellNewMethodChance: 0.10975609756097562,
  bellMethodQuantity: [545298.9362696332, 1539016.28713663, 1744956.5960628262, 1971933.81826643, 591247.9836913383, 2192267.804698221],
  bellMethodCost: [1.850818456399015e+29, 32148926367977.766, 2.3985902718069446e+75, 65874447854609.164, 724503.0834338608, 126987256576100.77],
  bellBonus: [4520, 442.5, 7520, 601.8, 125, 3290, 53.6],
  bellExpReq: [33843483244995.52, 53945316627.05141, 1968300, 25],
  // Holes("StringSlots" / "StringTypesOwned" / "HarpNewNote_Cost" / "HarpPOWperHR"), Holes("HarpStringExpREQ" /
  // "HarpStringLVbonus", t)
  harp: { stringSlots: 11, stringTypes: 6, newNoteCost: 3589251437.859988, powerRate: 1390 },
  harpStringExpReq: [52452173863.05586, 1318653607.0017369, 2055644987.1624854, 2055644987.1624854, 1772984718.514127, 195973240478.93726],
  harpStringBonus: [1410, 696, 595, 1547, 2360, 2700],
  // Holes("HarpStringAllBonus") and Holes("HarpEXPgain") read with the harp unopened this session, so _GenINFO[128]
  // (strings plucked) and [129] (unique string types) were both 0, at _GenINFO[112] (strum power) = 10757984.128704686.
  // HarpEXPgain was read six times: its 1% study crit never rolled.
  harpLiveState: { uniqueStringTypes: 0, power: 10757984.128704686, allBonus: 1.15, expGain: 18464872742.9928 },
  // Holes("LampWishCost", t), Holes("LampWishPerDay"), Holes("LampBonuses", t, i) and Holes("LampBonuses", 99)
  lampWishCost: [999999, 6, 4, 2, 10, 2, 18, 3, 11, 2997, 15, 1998],
  lampWishPerDay: 44.31515222482436,
  lampBonus: [[2760, 1104, 883.1999999999999], [3060, 8160, 2040], [2592, 4536, 1555.2], [288, 57.599999999999994, 57.599999999999994], [4.8, 4.8, 4.8]],
  lampResourceBonus: 2580,
  // Holes("MonarchHP" / "MushKillsLeft")
  grotto: { monarchHp: 133483886718750000, mushroomKillsLeft: 0 },
  // Holes2("TempleTorchCost" / "TempleTorchBonuses", t)
  templeTorchCost: [136.80883743752224, 143674.17873127665, 6662.83435371441],
  templeTorchBonus: [5.7, 0.2814805766259879, 340],
  // Holes("JarOpalChance" / "JarNewCollectibleChance" / "JarEnchantChance" / "JarNewJar_Cost" / "JarProductionSlots" /
  // "JarAesthetic"), Holes("JarProductionREQ", t)
  jars: { opalChance: 0.27226188641240123, newJarCost: 2138657015.5301707, unlockedSlots: 3, jarAesthetic: 7 },
  jarNewCollectibleChance: 0.011238045915402149,
  jarEnchantChance: 3.047530454649355e-59,
  jarProductionReq: [615.826495070391, 1847.4794852111734, 3253.926806643307, 4198.209478717521, 5207.537685458631,
    6659.424282290008, 7583.6757541948655, 8805.481560915823, 10643.779047248294, 12337.752922626869],
  // Holes2("Cglunko_DR" / "Cglunko_AFKgains" / "Cglunko_DoublePickup" / "Cglunko_Bdig" / "Cglunko_Pdig" / "Cglunko_MKtier" /
  // "Cglunko_MKbase" / "Cglunko_Respawn"), Holes2("Cglunko_upgBon" / "Cglunko_upgCost", t)
  cove: { dropRate: 5.211099999999999, afkGains: 0.11, doublePickup: 0, bdig: 6, pdig: 0, multiKillTier: 0, multiKillBase: 0, respawn: 10 },
  coveUpgradeBonus: [3, 105, 10, 24, 15, 0, 0, 3, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  coveUpgradeCost: [412, 73, 99, 32, 15, 4, 1, 12, 2, 4, 1, 4, 1, 4, 1, 4, 1, 4, 1, 4, 1, 4, 1, 4]
};

describe('caverns part B verified against the live game', () => {
  it.each([
    ['the harp', caverns.theHarp, GAME_B.harp],
    ['grotto', caverns.grotto, GAME_B.grotto],
    ['the jars', caverns.theJars, GAME_B.jars],
    ['crystal glunko cove', caverns.crystalGlunkoCove, GAME_B.cove]
  ])('%s scalar readings', (_, cavern, expected) => {
    Object.entries(expected).forEach(([key, value]) => within(cavern[key], value));
  });

  it.each([
    ['bell method bonus', caverns.theBell.improvementMethods.map(({ bonus }) => bonus), GAME_B.bellMethodQuantity],
    ['bell method cost', caverns.theBell.improvementMethods.map(({ cost }) => cost), GAME_B.bellMethodCost],
    ['bell bonus', caverns.theBell.bellBonuses.map(({ bonus }) => bonus), GAME_B.bellBonus],
    ['bell EXP requirement', caverns.theBell.bells.map(({ expReq }) => expReq), GAME_B.bellExpReq],
    ['harp string EXP requirement', caverns.theHarp.chords.map(({ expReq }) => expReq), GAME_B.harpStringExpReq],
    ['harp string level bonus', caverns.theHarp.chords.map(({ bonus }) => bonus), GAME_B.harpStringBonus],
    ['lamp wish cost', caverns.theLamp.wishes.map(({ cost }) => cost), GAME_B.lampWishCost],
    ['temple torch cost', caverns.theTemple.bonuses.map(({ cost }) => cost), GAME_B.templeTorchCost],
    ['temple torch bonus', GAME_B.templeTorchBonus.map((_, t) => getTorchBonus(holesObject, t)), GAME_B.templeTorchBonus],
    ['jar production requirement', caverns.theJars.jars.map(({ req }) => req), GAME_B.jarProductionReq],
    ['cove upgrade bonus', caverns.crystalGlunkoCove.upgrades.map(({ bonus }) => bonus), GAME_B.coveUpgradeBonus],
    ['cove upgrade cost', caverns.crystalGlunkoCove.upgrades.map(({ cost }) => cost), GAME_B.coveUpgradeCost]
  ])('%s per entry', (_, actual, expected) => {
    expect(actual.length).toBe(expected.length);
    actual.forEach((value, index) => within(value, expected[index]));
  });

  it('bell methods and new method chance', () => {
    expect(caverns.theBell.bellMethodsOwned).toBe(GAME_B.bellMethodsOwned);
    within(caverns.theBell.newMethodChance, GAME_B.bellNewMethodChance);
  });

  it('lamp wishes per day and wish bonuses', () => {
    within(caverns.theLamp.wishPerDay, GAME_B.lampWishPerDay);
    GAME_B.lampBonus.forEach((row, t) => row.forEach((value, i) => within(getLampBonus({ holesObject, t, i, account }), value)));
    within(getLampBonus({ holesObject, t: 99, i: 0, account }), GAME_B.lampResourceBonus);
  });

  it('harp all-string bonus and string EXP, at the strum state the game was in', () => {
    const { uniqueStringTypes, power, allBonus, expGain } = GAME_B.harpLiveState;
    const stringAllBonus = getHarpStringAllBonus(holesObject, uniqueStringTypes);
    within(stringAllBonus, allBonus);
    within(getHarpExpGain(holesObject, account, stringAllBonus, power), expGain);
  });

  it('jar new collectible chance (palette, exotic and Jar Jar Collectible superbit) and enchant chance', () => {
    within(getNewCollectibleChance(holesObject, account), GAME_B.jarNewCollectibleChance);
    within(caverns.theJars.jars[4].enchant.value, GAME_B.jarEnchantChance);
  });

  it('hive and trench requirements and efficiency, the Trench study included and no extra quarter on the Trench', () => {
    expect(caverns.theHive.bugs.required).toBe(commaNotation(GAME_A.totalOreReq[LAYER_CAVERN.HIVE]));
    expect(caverns.theBottomlessTrench.fish.required).toBe(commaNotation(GAME_A.totalOreReq[LAYER_CAVERN.TRENCH]));
    expect(caverns.theHive.fishingEff).toBe(notateNumber(0.25 * GAME_A.motherlodeEffBase[LAYER_CAVERN.HIVE], 'Big'));
    expect(caverns.theBottomlessTrench.fishingEff).toBe(notateNumber(0.25 * GAME_A.motherlodeEffBase[LAYER_CAVERN.TRENCH], 'Big'));
  });
});
