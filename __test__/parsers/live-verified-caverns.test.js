import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within } from '../helpers/live-verified';
import { getMonumentMaxLinearTime } from '@parsers/world-5/caverns/bravery';
import { getMotherlodeEffBase, getTotalOreReq, LAYER_CAVERN } from '@parsers/world-5/caverns/motherlode';
import { getHarpExpGain, getHarpStringAllBonus } from '@parsers/world-5/caverns/the-harp';
import { getLampBonus } from '@parsers/world-5/caverns/the-lamp';
import { getJarBonus, getNewCollectibleChance } from '@parsers/world-5/caverns/the-jars';
import { getTorchBonus } from '@parsers/world-5/caverns/the-temple';
import { getSchematicBonus } from '@parsers/world-5/caverns/the-well';
import { getMeasurementBonus, getStudyBonus } from '@parsers/world-5/hole';
import { getTesseractBonus } from '@parsers/class-specific/tesseract';

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
  // NotateNumber(Holes("AmpDebuff", t), t == 7 ? "Small" : "Big"): the amplifier panel prints 68K 96.6K 15 4 2 2 4 0.1.
  // Below 1M the site's sentences keep their decimals
  ampDebuffText: ['67,949.3', '96,536.18', '15', '4.63', '2.14', '2', '4', '0.1'],
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
  // Holes("TempleExtraTorches") (percent) and Holes("JarRupieExtraChance") (a fraction), read 2026-10-13; their inputs
  // (BellBonuss 4/5 = 125/3290, CosmoBonusQTY(0, 3) = 175, StudyBolaiaBonuses(14) = 660, B_UPG 64/77) match the save
  templeExtraTorches: 3975,
  jarRupieExtraChance: 3.5,
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

describe('caverns verified against the live game', () => {
  it.each([
    ['bravery', caverns.bravery, GAME_A.bravery],
    ['justice', caverns.justice, GAME_A.justice],
    ['wisdom', caverns.wisdom, GAME_A.wisdom],
    ['the den', caverns.theDen, GAME_A.den],
    ['the fountain', caverns.theFountain, GAME_A.fountain],
    ['the harp', caverns.theHarp, GAME_B.harp],
    ['grotto', caverns.grotto, GAME_B.grotto],
    ['the jars', caverns.theJars, GAME_B.jars],
    ['crystal glunko cove', caverns.crystalGlunkoCove, GAME_B.cove]
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
    within(theWell.opalCost, GAME_A.wellOpalCost);
  });

  it('layer requirement and efficiency of every layered cavern, Evertree including the Trench study', () => {
    GAME_A.totalOreReq.forEach((value, t) => within(getTotalOreReq(holesObject, account, t), value));
    GAME_A.motherlodeEffBase.forEach((value, t) => within(getMotherlodeEffBase(holesObject, t), value));
    within(caverns.evertree.logs.required, GAME_A.totalOreReq[LAYER_CAVERN.EVERTREE]);
    within(caverns.motherlode.ores.required, GAME_A.totalOreReq[LAYER_CAVERN.MOTHERLODE]);
  });

  it('den amplifier debuffs', () => {
    expect(caverns.theDen.amplifiers.map(({ bonus }) => bonus)).toEqual(GAME_A.ampDebuffText);
  });

  it('fountain upgrade bonuses, costs and unlocks', () => {
    const { waters } = caverns.theFountain;
    expect(waters.map(({ upgrades }) => upgrades.map(({ bonus }) => bonus))).toEqual(GAME_A.fountainBonus);
    expect(waters.map(({ upgrades }) => upgrades.map(({ unlocked }) => unlocked ? 1 : 0))).toEqual(GAME_A.fountainUnlocked);
    waters.forEach(({ upgrades }, t) => upgrades.forEach(({ cost }, i) => within(cost, GAME_A.fountainCost[t][i])));
  });

  // Holes("SchematicsAvailable") read 2026-10-16: 105, the game's cap, with 107 rows in HolesBuildings
  it('engineer schematics, unlocked out of the most there can be', () => {
    expect([account.hole.unlockedSchematics, account.hole.totalSchematics]).toEqual([105, 105]);
  });

  // The game has no fountain level cap (live saves pass 1,000); an upgrade has done its part once every upgrade it
  // leads to is unlocked, which is what the tree marks.
  it('fountain upgrades are uncapped and mark the ones that open everything after them', () => {
    const { waters } = caverns.theFountain;
    const upgrades = waters.flatMap(({ upgrades: list }) => list);
    expect(upgrades.every(({ maxLevel }) => maxLevel === null)).toBe(true);
    waters.forEach(({ upgrades: list }, t) => list.forEach(({ opensAll, unlocks }) => {
      expect(opensAll).toBe(unlocks.length > 0 && unlocks.every((child) => GAME_A.fountainUnlocked[t][child] === 1));
    }));
  });

  it('fountain currency base values and bars', () => {
    const { currencies, fountainBars } = caverns.theFountain;
    Object.entries(GAME_A.currencyBaseValue).forEach(([type, value]) => within(currencies[type].baseValue, value));
    expect(fountainBars.map(({ tier }) => tier)).toEqual(GAME_A.fountainBarSpeed.map((_, tier) => tier));
    fountainBars.forEach(({ speedPerSecond }, index) => within(speedPerSecond, GAME_A.fountainBarSpeed[index]));
    within(fountainBars[0].activeMulti, GAME_A.fountainActiveMulti);
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

  it('extra torch chance and extra rupie chance, neither shown by the game', () => {
    within(caverns.theTemple.extraTorchChance.value, GAME_B.templeExtraTorches);
    within(caverns.theJars.rupieExtraChance.value / 100, GAME_B.jarRupieExtraChance);
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
    within(caverns.theHive.bugs.required, GAME_A.totalOreReq[LAYER_CAVERN.HIVE]);
    within(caverns.theBottomlessTrench.fish.required, GAME_A.totalOreReq[LAYER_CAVERN.TRENCH]);
    within(caverns.theHive.fishingEff, 0.25 * GAME_A.motherlodeEffBase[LAYER_CAVERN.HIVE]);
    within(caverns.theBottomlessTrench.fishingEff, 0.25 * GAME_A.motherlodeEffBase[LAYER_CAVERN.TRENCH]);
  });
});

// The Hole's rates that read across its caverns, and its villagers. Read on 2026-10-11, logged in as IAmTheHunterrr.
// Caches were rebuilt first (calcEtcBonuses, TalentCalc(-2), PaletteBonus(-1), LoreEpiBon(-1), OverkillQTY(-1)).
const GAME_HOLE = {
  // Holes("VillagerExpPerHour", t)
  villagerExp: [100606167441241.08, 107748829431517.72, 347887683585451.1, 255655541551169.4, 198870132829311],
  // Holes("JarRupieValue"), Holes("JarProductionPerHR")
  jarRupieValue: 2310873159367098,
  jarProgressPerHour: 2915395.6824436793,
  // Holes("MonumentHRbonusPCT") and ("MonumentHRbonusMULTI")
  monumentAfkPercent: 1735.4172145155994,
  monumentAfkMulti: 1.25,
  // Holes("BellExpPerHR", 0..3)
  bellExpRates: [17385809045426.973, 8111941563.352408, 153911.628713663, 10]
};
// The villager, jar and monument readings were compared at 1e-6
const LOOSE = 1e-6;

describe('hole verified against the live game', () => {
  it('villager EXP / hr, the Tome epilogue read from the current tome score (hole parses before spelunking)', () => {
    account.hole.villagers.forEach((villager, index) => within(villager.expRate.value, GAME_HOLE.villagerExp[index], LOOSE));
  });

  it('jar rupie value and progress per hour', () => {
    within(caverns.theJars.rupieValue.value, GAME_HOLE.jarRupieValue, LOOSE);
    within(caverns.theJars.perHour.value, GAME_HOLE.jarProgressPerHour, LOOSE);
  });

  it('monument AFK bonus, with the Minehead opponent multiplier on top', () => {
    const { afkPercent } = caverns.bravery;
    within(afkPercent.value, GAME_HOLE.monumentAfkPercent, 2e-5);
    within(afkPercent.multi, GAME_HOLE.monumentAfkMulti, LOOSE);
  });

  it('bell EXP rates, the death note measurement leaving out the mini bosses', () => {
    caverns.theBell.bells.forEach(({ expRate }, index) => within(expRate.value, GAME_HOLE.bellExpRates[index]));
  });
});

// Gambit. Read on 2026-10-11, logged in as IAmTheHunterrr (Holes[11][65..70] gambit times and Holes[28] doublers match).
// The live monument bonus (Holes("MonumentROGbonuses", 2, 7)) read 68.6 against the save's 68.5: Holes[15][27]
// had grown from 11407 to 11507, so the points multi and every points-scaled bonus sit 1e-4 / 8e-6 above the save's.
const GAME_GAMBIT = {
  // Holes("GambitPts", 99, 0)
  basePoints: 1634160.00000002,
  // Holes("GambitPTSmulti", 0, 0)
  pointsMulti: 7.690268815920399,
  pointsMultiDriftTolerance: 2e-4,
  // The GambitPTSmulti terms that do not drift: MeasurementBonusTOTAL 13, StudyBolaiaBonuses 13, B_UPG 78,
  // JarCollectibleBonus 23 and 30, ArcaneUpgBonus 47
  pointsMultiTerms: {
    measurement: 37.426881592039805,
    study: 125,
    schematic: 10,
    jar23: 64,
    jar30: 64,
    tesseract: 300
  },
  // Holes("GambitBonuses", i, 0)
  bonuses: [
    22, 7.099220967818055, 20, 177.48052419545138, 20, 177.48052419545138, 35, 70.99220967818054,
    709.9220967818055, 1, 1, 177.48052419545138, 1, 1, 250, 3
  ],
  bonusDriftTolerance: 1e-5,
  // Holes("GambitPtsREQ", i, 0)
  pointsReq: [
    3000, 5024, 8667.92, 14802.406400000002, 24684.26384, 40109.5632512, 63623.16377719041, 98804.3881881682,
    150655.2386114558, 226126.35975265643, 334827.6442326948, 489985.8405622638, 709731.9643904582,
    1018828.2956256031, 1450980.3212664844, 2051925.843981216
  ],
  // Holes("Gambit_SummoningDoublersLeft", 0, 0): bonus 0 plus 10 from event shop 15, less the 30 appointed slots
  doublersLeft: 2,
  doublersTotal: 32
};

describe('gambit verified against the live game', () => {
  const { gambit } = caverns;

  it('base points and points multi', () => {
    within(gambit.basePoints, GAME_GAMBIT.basePoints);
    within(gambit.pointsMulti, GAME_GAMBIT.pointsMulti, GAME_GAMBIT.pointsMultiDriftTolerance);
  });

  it('points multi terms', () => {
    expect({
      measurement: getMeasurementBonus({ holesObject, accountData: account, t: 13 }),
      study: getStudyBonus(holesObject, 13, 0),
      schematic: getSchematicBonus({ holesObject, t: 78, i: 10 }),
      jar23: getJarBonus({ holesObject, i: 23, account }),
      jar30: getJarBonus({ holesObject, i: 30, account }),
      tesseract: getTesseractBonus(account, 47)
    }).toEqual(GAME_GAMBIT.pointsMultiTerms);
  });

  it.each([...GAME_GAMBIT.bonuses.entries()])('bonus %i and its points requirement', (index, bonus) => {
    within(gambit.bonuses[index].bonus, bonus, GAME_GAMBIT.bonusDriftTolerance);
    within(gambit.bonuses[index].pointsReq, GAME_GAMBIT.pointsReq[index]);
  });

  it('summoning doublers', () => {
    const { appointed, total } = gambit.summoningDoublers;
    expect(total).toBe(GAME_GAMBIT.doublersTotal);
    expect(total - appointed).toBe(GAME_GAMBIT.doublersLeft);
  });
});
