import { holeFountUpg } from '@website-data';
import { commaNotation, lavaLog, notateNumber } from '@utility/helpers';
import { getArcadeBonus } from '@parsers/world-2/arcade';
import { getCglunkoBonus } from '@parsers/world-5/caverns/crystal-glunko-cove';
import { getSchematicBonus } from '@parsers/world-5/caverns/the-well';
import { getLampBonus } from '@parsers/world-5/caverns/the-lamp';
import { getBellBonus } from '@parsers/world-5/caverns/the-bell';
import { getCosmoBonus, getMeasurementBonus, getStudyBonus } from '@parsers/world-5/hole';
import { OPT } from '@parsers/accountOptions';

// Each tier represents a water color. The first upgrade in each tier ("X_Water") is the gate
// that unlocks the NEXT color: tier 0/0 ("Yellow_Water") unlocks Yellow, tier 1/0 ("Green_Water")
// would unlock Green ("well, it will in the Future" per its in-game text), tier 2/0 would unlock
// Black. Tier 2's entries are all placeholders in 2.3.504 (full set of "Name" entries) so Green
// is effectively unimplemented and hidden via the `implemented` flag below.
// Mapping: tier 0 = Blue, tier 1 = Yellow, tier 2 = Green.

// Currency names mapped to the 0..8 currencyType offset (Holes[9][30..38]).
// website-data has no dedicated list; these names come from the Penny_Lane / Nickel_and_Diming /
// Dubloon_Desires / Dolla_Dolla_Bills / Credit_Swisse / In_Gov_We_Trust upgrade descriptions.
// Tier 2 currency names (Moolah/Shilling/Greane) come from the placeholder Green-water upgrades.
export const CURRENCY_NAMES = [
  'Bronze', 'Silver', 'Gold',
  'Dollar', 'Credit', 'Treasury',
  'Moolah', 'Shilling', 'Greane'
];

const isFountainUpgradeUnlocked = (t: number, i: number, prereq: number, holesObject: any) => {
  if (prereq === -1) return true;
  const prereqLevel = holesObject?.fountainUpgradeLevels?.[t]?.[prereq] ?? 0;
  if (prereqLevel >= 10) return true;
  // Bell-style branch: water type 0 indices 14 & 2 unlock at any level >= 1
  if (t === 0 && (i === 14 || i === 2) && prereqLevel >= 1) return true;
  return false;
};

const getFountainUpgradeCost = (baseCost: number, costMulti: number, level: number) => {
  return baseCost === 1
    ? (level + baseCost) * Math.pow(costMulti, level)
    : baseCost * Math.pow(costMulti, level);
};

export const getFountainBonusTotal = (holesObject: any, t: number, i: number) => {
  const u = holeFountUpg?.[t]?.[i];
  if (!u) return 0;
  const level = holesObject?.fountainUpgradeLevels?.[t]?.[i] ?? 0;
  const marbleTier = holesObject?.fountainMarbleizeLevels?.[t]?.[i] ?? 0;
  const marbleMulti = marbleTier === 0 ? 1 : 1.5 + 0.5 * marbleTier;
  return Math.round(level * u.bonusPerLevel * marbleMulti);
};

const timerDisplay = (totalSeconds: number) => {
  if (!isFinite(totalSeconds) || totalSeconds < 0) return '0h_0min_0s';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor(totalSeconds / 60) - 60 * h;
  const s = Math.round(totalSeconds) - 60 * Math.floor(totalSeconds / 60);
  return `${h}h_${m}min_${s}s`;
};

const moneyFmt = (v: number): string => (v < 1e6 ? String(commaNotation(Math.round(v))) : String(notateNumber(v, 'Big')));

// Fountain helper formulas (mirror N.js customBlock_Holes2 handlers)
const getFountainBarReq = (t: number) => (t === 0 ? 7200 : t === 1 ? 36000 : 90000);

const getFountainBarSpeed = (holesObject: any, accountData: any, t: number) => {
  if (t !== 0) return 1;
  const arcade = getArcadeBonus(accountData?.arcade?.shop, 'Fountain_Speed')?.bonus ?? 0;
  return (1 + getFountainBonusTotal(holesObject, 0, 9) / 100) * (1 + arcade / 100);
};

const getFountainBarActiveSpdMulti = (holesObject: any) => {
  const b12 = getFountainBonusTotal(holesObject, 0, 12);
  return 1 + Math.min(4, 4 * b12) + b12 / 100;
};

const getFountCurrencyKeep = (holesObject: any) => {
  const b8 = getFountainBonusTotal(holesObject, 0, 8);
  return 0.1 + (b8 / (100 + b8)) * 0.5;
};

const getFountRoyalChance = (holesObject: any) => {
  return (1 / 300) * (1 + getFountainBonusTotal(holesObject, 1, 8) / 100);
};

// Fount_DuckChance: per-fill chance the Rubber Ducky bar grants +1 duck stack.
// accountOptions[601] = current duck stack count; each stack makes the next 5x rarer (0.2^n).
// game: "Fount_DuckChance"
const getFountDuckChance = (holesObject: any, accountData: any) => {
  const stacks = accountData?.accountOptions?.[OPT.fountainDuckStacks] ?? 0;
  return (1 / 3)
    * (1 + (getFountainBonusTotal(holesObject, 2, 12) + getFountainBonusTotal(holesObject, 2, 10)) / 100)
    * Math.pow(0.2, stacks);
};

const getFountRoyalMulti = (holesObject: any) => {
  return 5 + getFountainBonusTotal(holesObject, 1, 9) / 100;
};

// game: Holes("CosmoBonusQTY", 0, 4), the hole majik that also boosts currency, marble and stack size
const getFountainCosmoBonus = (holesObject: any) => getCosmoBonus({ majik: holesObject?.holeMajiks, t: 0, i: 4 }) || 0;

// game: "Fount_MarblePerFill"
const getFountMarblePerFill = (holesObject: any) => {
  return 100 * (1 + getFountainBonusTotal(holesObject, 1, 10) / 100)
    * (1 + getStudyBonus(holesObject, 15, 0) / 100)
    * (1 + (10 * getFountainCosmoBonus(holesObject)) / 100);
};

// Holes[30][currencyType] = how many LUCKY coins of that currency the player has
const getLuckyCoins = (holesObject: any, currencyType: number) => holesObject?.fountainSpaceFilled?.[currencyType] ?? 0;

// game: "Fount_LuckyCoinChance"
const getFountLuckyCoinChance = (holesObject: any, currencyType: number) => {
  const luckBonus = getFountainBonusTotal(holesObject, 2, 8);
  if (luckBonus === 0) return 0;
  return 0.001 * (1 + (luckBonus + getFountainBonusTotal(holesObject, 2, 10)) / 100)
    * Math.pow(0.25, getLuckyCoins(holesObject, currencyType));
};

// game: "Fount_LuckyCoinValuePER"
const getFountLuckyCoinValuePer = (holesObject: any) => 25 + getFountainBonusTotal(holesObject, 2, 9);

// game: "Fount_DuckMulti"
const getFountDuckMulti = (holesObject: any, accountData: any) => {
  return Math.pow(1 + getFountainBonusTotal(holesObject, 2, 11) / 100, accountData?.accountOptions?.[OPT.fountainDuckStacks] ?? 0);
};

// Well sediment slot whose POW 10 boosts each water's currencies: Mythril, Sharp Notes, Red Rupies
const TRANSIENCE_SEDIMENT = [3, 16, 20];

// game: "Fount_CurrencyBaseValue": per currency (0..8 = Bronze..Greane). Each currency has a finder upgrade
// (2/3/4 of its water), a stackin' upgrade, and its water's POW 10 upgrade (index 19)
const CURRENCY_VALUE_TERMS = [
  { water: 0, finder: 2, stack: [0, 2] }, { water: 0, finder: 3, stack: [0, 5] }, { water: 0, finder: 4, stack: [0, 6] },
  { water: 1, finder: 2, stack: [0, 7] }, { water: 1, finder: 3, stack: [1, 5] }, { water: 1, finder: 4, stack: [1, 6] },
  { water: 2, finder: 2, stack: [1, 7] }, { water: 2, finder: 3, stack: [2, 5] }, { water: 2, finder: 4, stack: [2, 6] }
];
const getFountCurrencyBaseValue = (holesObject: any, currencyType: number) => {
  const terms = CURRENCY_VALUE_TERMS[currencyType];
  if (!terms) return 1 + getFountainBonusTotal(holesObject, 2, 7) / 100;
  const { water, finder, stack: [stackWater, stackIndex] } = terms;
  const sedimentLog = lavaLog(holesObject?.wellSediment?.[TRANSIENCE_SEDIMENT[water]] ?? 0);
  return 1 + getFountainBonusTotal(holesObject, water, finder)
    * (1 + getFountainBonusTotal(holesObject, stackWater, stackIndex) / 100)
    * (1 + (sedimentLog * getFountainBonusTotal(holesObject, water, 19)) / 100);
};

// game: "Fount_CurrencyALLmulti"
const getFountCurrencyAllMulti = (holesObject: any, accountData: any) => {
  const f = (t: number, i: number) => getFountainBonusTotal(holesObject, t, i);
  const trenchSchematicMulti = Math.max(1, getSchematicBonus({ holesObject, t: 94, i: 1 })
    * Math.pow(1.1, holesObject?.extraCalculations?.[7] ?? 0));
  return (1 + f(0, 0) / 100)
    * (1 + getCglunkoBonus(accountData, 14) / 100)
    * (1 + (f(0, 1) + f(1, 1) + f(2, 1) + f(1, 12)) / 100)
    * trenchSchematicMulti
    * (1 + f(1, 0) / 100)
    * (1 + f(2, 0) / 100)
    * (1 + (25 * getFountainCosmoBonus(holesObject)) / 100)
    * (1 + getLampBonus({ holesObject, t: 99, i: 0, account: accountData }) / 400)
    * (1 + getMeasurementBonus({ holesObject, accountData, t: 16 }) / 100)
    * (1 + getBellBonus({ holesObject, t: 6 }) / 100);
};

const getSpacesOwned = (holesObject: any) => Math.min(16, 1 + getFountainBonusTotal(holesObject, 0, 10));
// game: "MaxStackSize"
const getMaxStackSize = (holesObject: any) => Math.min(50, 3 + getSchematicBonus({ holesObject, t: 97, i: 3 })
  + getFountainBonusTotal(holesObject, 0, 11) + getFountainCosmoBonus(holesObject));
const getMaxCoinz = (holesObject: any) => getSpacesOwned(holesObject) * getMaxStackSize(holesObject);

const formatFountainDescription = (
  rawDescription: string,
  holesObject: any,
  accountData: any,
  t: number,
  i: number,
  bonus: number
): string => {
  let desc = rawDescription;
  // Universal { → bonus value, } → 1 + bonus/100 multiplier
  desc = desc.replaceAll('{', String(commaNotation(bonus)));
  desc = desc.replaceAll('}', String(notateNumber(1 + bonus / 100, 'MultiplierInfo')).replace('#', ''));

  // Yellow Water tier-specific substitutions
  if (t === 0) {
    if (i === 2 || i === 3 || i === 4) {
      const value = getFountCurrencyBaseValue(holesObject, i - 2);
      desc = desc.replaceAll('$', moneyFmt(value));
    }
    if (i === 2) {
      const allMulti = getFountCurrencyAllMulti(holesObject, accountData);
      desc = desc.replaceAll('^', `${allMulti > 1e3 ? notateNumber(allMulti, 'Big') : Math.round(100 * allMulti) / 100}x`);
    }
    if (i === 8) {
      desc = desc.replaceAll('$', String(Math.round(10000 * getFountCurrencyKeep(holesObject)) / 100));
    }
    if (i === 9) {
      const barReq = getFountainBarReq(0);
      const barSpeed = getFountainBarSpeed(holesObject, accountData, 0);
      const activeMulti = getFountainBarActiveSpdMulti(holesObject);
      const barProgress = holesObject?.fountainBarProgress?.[0] ?? 0;
      const totalTime = barReq / Math.max(barSpeed, 1e-9);
      const remainingTime = Math.max(0, barReq - barProgress) / Math.max(barSpeed * Math.max(1, activeMulti), 1e-9);
      desc = desc.replaceAll('#', timerDisplay(totalTime));
      desc = desc.replaceAll('$', timerDisplay(remainingTime));
    }
    if (i === 10) {
      desc = desc.replaceAll('$', String(getSpacesOwned(holesObject)));
      desc = desc.replaceAll('#', String(getMaxCoinz(holesObject)));
    }
    if (i === 11) {
      desc = desc.replaceAll('$', String(getMaxStackSize(holesObject)));
      desc = desc.replaceAll('#', String(getMaxCoinz(holesObject)));
    }
    if (i === 12) {
      desc = desc.replaceAll('$', String(Math.round(100 * getFountainBarActiveSpdMulti(holesObject)) / 100));
    }
    if (i === 19) {
      const mythrilLog = lavaLog(holesObject?.wellSediment?.[3] ?? 0);
      const totalBonus = Math.round(100 * (1 + (mythrilLog * getFountainBonusTotal(holesObject, 0, 19)) / 100)) / 100;
      desc = desc.replaceAll('$', String(totalBonus));
    }
  }

  // Green Water tier-specific substitutions
  if (t === 1) {
    if (i === 2 || i === 3 || i === 4) {
      const value = getFountCurrencyBaseValue(holesObject, i + 1);
      desc = desc.replaceAll('$', moneyFmt(value));
    }
    if (i === 8) {
      desc = desc.replaceAll('$', String(commaNotation(Math.round(1 / getFountRoyalChance(holesObject)))));
    }
    if (i === 9) {
      desc = desc.replaceAll('$', String(Math.round(100 * getFountRoyalMulti(holesObject)) / 100));
    }
    if (i === 10) {
      desc = desc.replaceAll('$', String(commaNotation(Math.round(getFountMarblePerFill(holesObject)))));
    }
    if (i === 19) {
      const sharpLog = lavaLog(holesObject?.wellSediment?.[16] ?? 0);
      const totalBonus = Math.round(100 * (1 + (sharpLog * getFountainBonusTotal(holesObject, 1, 19)) / 100)) / 100;
      desc = desc.replaceAll('$', String(totalBonus));
    }
  }

  // Green Water tier-specific substitutions (tier 2 — real content as of 2.3.511)
  if (t === 2) {
    if (i === 2 || i === 3 || i === 4) {
      const value = getFountCurrencyBaseValue(holesObject, i + 4);
      desc = desc.replaceAll('$', moneyFmt(value));
      // Water 2 currencies only get the square root of the total currency multi
      desc = desc.replaceAll('^', `${notateNumber(Math.pow(getFountCurrencyAllMulti(holesObject, accountData), 0.5), 'Big')}x`);
    }
    if (i === 8) {
      const firstLuckyChance = Math.max(0.001, getFountLuckyCoinChance(holesObject, 0))
        / Math.pow(0.25, getLuckyCoins(holesObject, 0));
      desc = desc.replaceAll('$', String(commaNotation(1 / firstLuckyChance)));
    }
    if (i === 9) {
      desc = desc.replaceAll('$', String(commaNotation(getFountLuckyCoinValuePer(holesObject))));
    }
    if (i === 11) {
      const duckMulti = getFountDuckMulti(holesObject, accountData);
      desc = desc.replaceAll('$', duckMulti < 1e3
        ? String(notateNumber(duckMulti, 'MultiplierInfo')).replace('#', '')
        : String(commaNotation(duckMulti)));
    }
    if (i === 12) {
      desc = desc.replaceAll('$', String(commaNotation(1 / getFountDuckChance(holesObject, accountData))));
    }
  }

  // Green-tier glyph cleanup: 鉢 is the "Total Currency Multi" label glyph, @ is an in-game line break.
  desc = desc.replaceAll('鉢', '').replaceAll('@', ' ');

  return desc;
};

// The waters by tier, as the Fountain page names them
export const FOUNTAIN_WATER_NAMES = ['Blue', 'Yellow', 'Green'];

export const getTheFountain = (holesObject: any, accountData: any) => {
  const watersOwned = Math.min(2, Math.min(1, holesObject?.fountainUpgradeLevels?.[0]?.[0] ?? 0)
    + Math.min(1, holesObject?.fountainUpgradeLevels?.[1]?.[0] ?? 0)
    + Math.min(1, holesObject?.fountainUpgradeLevels?.[2]?.[0] ?? 0));

  const currentWaterType = holesObject?.extraCalculations?.[80] ?? 0;
  const marbleCurrency = holesObject?.extraCalculations?.[81] ?? 0;
  const desiredCurrency = holesObject?.extraCalculations?.[82] ?? -1;

  const waters = holeFountUpg.map((tierUpgrades, t) => {
    const tierLevels = holesObject?.fountainUpgradeLevels?.[t] ?? [];
    // Compute BFS depth: prereq=-1 → 0, then depth(prereq) + 1
    const depthCache: Record<number, number> = {};
    const computeDepth = (idx: number, stack: Set<number> = new Set()): number => {
      if (depthCache[idx] !== undefined) return depthCache[idx];
      if (stack.has(idx)) return 0; // cycle guard
      stack.add(idx);
      const prereq = Number(tierUpgrades[idx]?.prereqIndex ?? -1);
      const d = prereq === -1 ? 0 : computeDepth(prereq, stack) + 1;
      depthCache[idx] = d;
      return d;
    };

    const levelled = tierUpgrades.map((u, i) => {
      const level = tierLevels[i] ?? 0;
      const marbleTier = holesObject?.fountainMarbleizeLevels?.[t]?.[i] ?? 0;
      const marbleMulti = marbleTier === 0 ? 1 : 1.5 + 0.5 * marbleTier;
      const bonus = Math.round(level * u.bonusPerLevel * marbleMulti);
      const cost = getFountainUpgradeCost(u.baseCost, u.costMulti, level);
      const unlocked = isFountainUpgradeUnlocked(t, i, u.prereqIndex, holesObject);
      const description = formatFountainDescription(u.description, holesObject, accountData, t, i, bonus);
      const depth = computeDepth(i);
      const prereqName = u.prereqIndex === -1 ? null : tierUpgrades[u.prereqIndex]?.name ?? null;
      const prereqCurrentLevel = u.prereqIndex === -1 ? 0 : (tierLevels[u.prereqIndex] ?? 0);
      const prereqRequiredLevel = (t === 0 && (i === 14 || i === 2)) ? 1 : 10;
      const unlocks = tierUpgrades
        .map((other, otherIdx) => ({ idx: otherIdx, prereq: Number(other.prereqIndex) }))
        .filter(({ prereq }) => prereq === i)
        .map(({ idx }) => idx);
      return {
        index: i,
        name: u.name,
        description,
        prereqIndex: u.prereqIndex,
        prereqName,
        prereqCurrentLevel,
        prereqRequiredLevel,
        currencyType: u.currencyType,
        position: u.position,
        level,
        // Uncapped: the game's purchase only adds a level (Cost_FountainUPG has no cap), and live saves pass 1,000.
        maxLevel: null,
        marbleTier,
        marbleMulti,
        bonus,
        bonusPerLevel: u.bonusPerLevel,
        cost,
        unlocked,
        depth,
        unlocks
      };
    });
    // An upgrade has done its part in the tree once it reaches the level every upgrade it leads to requires.
    const upgrades = levelled.map((upgrade) => ({
      ...upgrade,
      opensAll: upgrade.unlocks.length > 0
        && upgrade.unlocks.every((child: number) => upgrade.level >= levelled[child].prereqRequiredLevel)
    }));
    const dynamicName = FOUNTAIN_WATER_NAMES[Math.min(t, FOUNTAIN_WATER_NAMES.length - 1)];
    // A tier is "implemented" only when its upgrades have real positions and named entries.
    // Future-content tiers (e.g. Green water at v2.3.504) ship placeholders like name="Name" and position="X".
    const placeholderCount = tierUpgrades.filter((u) =>
      u.name === 'Name' || !u.position?.includes(',')
    ).length;
    const implemented = placeholderCount < tierUpgrades.length / 2;
    return {
      tier: t,
      name: dynamicName,
      barProgress: holesObject?.fountainBarProgress?.[t] ?? 0,
      barReq: getFountainBarReq(t),
      unlocked: t === 0 ? true : t < watersOwned + 1, // tier 0 is always available (Blue is default)
      implemented,
      upgrades
    };
  });

  const fountainSpeedBonus = getArcadeBonus(accountData?.arcade?.shop, 'Fountain_Speed')?.bonus ?? 0;
  const spacesOwned = getSpacesOwned(holesObject);
  const maxStackSize = getMaxStackSize(holesObject);
  // Per Cost_FountainUPG, fountain currencies live at Holes[9][30..38] (= wellSediment[30..38]).
  const wellSediment = holesObject?.wellSediment ?? [];
  const currencies = CURRENCY_NAMES.map((name, type) => ({
    type,
    name,
    amount: Math.max(0, wellSediment[30 + type] ?? 0),
    baseValue: getFountCurrencyBaseValue(holesObject, type)
  }));
  const currencyAllMulti = getFountCurrencyAllMulti(holesObject, accountData);

  // Only show fountain bars that are actually active in-game (FountainBar_DoWeHave logic).
  const activeMulti = getFountainBarActiveSpdMulti(holesObject);
  const buildBar = (tier: number, name: string, description: string, unlocked: boolean) => {
    const progress = holesObject?.fountainBarProgress?.[tier] ?? 0;
    const req = getFountainBarReq(tier);
    const speed = Math.max(getFountainBarSpeed(holesObject, accountData, tier), 1e-9);
    const remaining = Math.max(0, req - progress);
    return {
      tier, name, description, progress, req, unlocked,
      speedPerSecond: speed,
      activeMulti: tier === 0 ? activeMulti : 1,
      duckChance: tier === 2 ? getFountDuckChance(holesObject, accountData) : undefined,
      timeToFullMs: (remaining / speed) * 1000,
      timeFullCycleMs: (req / speed) * 1000
    };
  };
  const fountainBars = [
    buildBar(0, 'Coin Fill',
      'When full, spawns a new coin in the fountain.',
      true), // bar 0 is always active once the cavern is owned
    buildBar(1, 'Marble Fill',
      'When full, produces marble currency for Marbleization upgrades.',
      getFountainBonusTotal(holesObject, 1, 10) >= 1), // Marble_Filling Lv 1+
    buildBar(2, 'Rubber Ducky Bar',
      'When full, has a chance to give +1 Rubber Ducky stack.',
      getFountainBonusTotal(holesObject, 2, 12) >= 1) // Rubber_Ducky (tier 2 idx 12) adds this bar
  ].filter((b) => b.unlocked);

  return {
    waters,
    watersOwned,
    currentWaterType,
    marbleCurrency,
    desiredCurrency,
    fountainSpeedBonus,
    currencies,
    currencyAllMulti,
    marblePerFill: getFountMarblePerFill(holesObject),
    fountainBars,
    spacesOwned,
    maxStackSize
  };
};
