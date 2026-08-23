import type { IdleonData, Account } from '../types';
import { tryToParse, notateNumber } from '@utility/helpers';
import { generalSpelunky } from '@website-data';
import { getOptimizedGenericUpgrades } from '@parsers/genericUpgradeOptimizer';

const CLAM_UPGRADE_COUNT = 9;
// Clam upgrade levels live at accountOptions[455 + index].
const CLAM_LEVEL_OPTION_BASE = 455;
// MULTI-SCALPING scales with the multikill of whoever is parked at the Clamworks, which is not
// derivable from the account alone. 1000 is the neutral value: it makes the bonus fall back to
// one point per level, which is what the page showed before the multikill input existed.
export const DEFAULT_CLAM_MULTIKILL = 1000;

const clamWorkNames = [
  'PEARL_VALUE',
  'CLAM_COMRADES',
  'LUCKY_DAY',
  'MULTI-SCALPING',
  'FRUGALITY',
  'PURE_PEARLS',
  'ENCYSTATION_UP',
  'SHINIER_PEARLS',
  'ANTI_INFLATION'
];

export const CLAM_WORK_UPGRADE_CATEGORIES = {
  pearlGain: {
    name: 'Pearl Gain',
    stats: ['pearlGain'],
    upgradeIndices: [0, 1, 2, 3, 5, 6, 7]
  },
  costReduction: {
    name: 'Cost Reduction',
    stats: ['costReduction'],
    upgradeIndices: [4, 8]
  }
};

export const pearlNames = { 0: 'Pearls' };

export const getClamWork = (idleonData: IdleonData, account: Account) => {
  const spelunkingRaw = tryToParse((idleonData as any)?.Spelunk);
  return parseClamWork(account, spelunkingRaw);
}

export const getClamLevels = (account: Account): number[] => Array.from(
  { length: CLAM_UPGRADE_COUNT },
  (_, index) => (account as any)?.accountOptions?.[CLAM_LEVEL_OPTION_BASE + index] ?? 0
);

const getWorkerClass = (account: Account): number => (account as any)?.accountOptions?.[464] ?? 0;

// Rebuilds the whole page view for a given multikill, so the multikill input drives the header
// cards and the upgrade list, not just the optimizer.
export const parseClamWork = (account: Account, spelunkingRaw?: any, multiKill: number = DEFAULT_CLAM_MULTIKILL) => {
  const workerClass = getWorkerClass(account);
  const upgradesUnlocked = (account as any)?.accountOptions?.[465] ?? 0;
  const levels = getClamLevels(account);
  const promotionChance = 0.5 / (2 + workerClass);
  const promotionCost = getClamPromotionCost(workerClass);
  const clamHp = getClamHp(workerClass);
  const mobs = getClamMobs(levels);
  const blackPearlValue = getBlackPearlValue(levels);
  const pearlValue = getClamPearlValue(levels, multiKill);
  const ownedPearls = (account as any)?.accountOptions?.[454] ?? 0;

  const clamWorkDescriptions = generalSpelunky?.[27];
  const classExpMulti = getClamClassExpMulti(workerClass);
  const compensations = generalSpelunky?.[30].map((comp: string, index: number) => {
    return {
      // Only the 9th compensation carries a placeholder, and it's the class exp multi.
      name: comp.replace(/\}/g, `${classExpMulti}`),
      unlocked: getClamWorkBonus(account, index),
    }

  });
  const upgrades = clamWorkNames.map((name: string, index: number) => {
    const bonus = getClamBonus(levels, index, multiKill);
    const description = formatClamWorkDescription(clamWorkDescriptions?.[index] ?? '',
      index, { bonus, mobs, pearlValue, blackPearlValue });
    const requiredPearls = getClamPearlUpgReq(workerClass, index);
    return {
      name,
      description,
      requiredPearls,
      bonus,
      index,
      level: levels[index],
      // No x4: clam upgrades have no max level. It has to stay absent rather than null or
      // Infinity - `level >= null` is true at level 0, and JSON cloning turns Infinity into null.
      cost: getClamCost(levels, index, workerClass),
      unlocked: index <= upgradesUnlocked
    }
  });

  return {
    workerClass,
    promotionChance,
    promotionCost,
    clamHp,
    mobs,
    pearlValue,
    blackPearlValue,
    upgrades,
    ownedPearls,
    pearls: [{ name: 'Pearls', value: ownedPearls }],
    compensations,
    respawn: 60
  };
}

// Game rounds the drawn multiplier to 2 decimals. The max(0) matches the exp formula itself
// (N.js: 1 + Math.max(0, 5 * (workerClass - 8)) / 100), so a locked compensation reads 1x rather
// than the sub-1 number the game's draw code would produce for a class below 9.
const getClamClassExpMulti = (workerClass: number): number =>
  Math.round(100 * (1 + Math.max(0, 5 * (workerClass - 8)) / 100)) / 100;

export const getClamWorkBonus = (account: Account, index: number): number => {
  return (account as any)?.accountOptions?.[464] > index ? 1 : 0;
};

export const getClamHp = (workerClass: number): number => 1e16 * Math.pow(30, workerClass);

const getClamMobs = (levels: number[]): number => Math.min(25, 2 + (levels[1] ?? 0));

const getClamPromotionCost = (workerClass: number): number => 1e5 * Math.pow(10, workerClass);

const getClamPearlUpgReq = (workerClass: number, index: number): number => 20 * Math.pow(10 + 3 * workerClass, index - 1);

export const getClamCost = (levels: number[], index: number, workerClass: number): number => {
  if (index === 9) return getClamPromotionCost(workerClass);

  const multi = parseFloat(generalSpelunky[29]?.[index] ?? 0);
  const upgradeLevel = levels[index] ?? 0;
  const discount = (1 / (1 + getClamBonus(levels, 4) / 100)) * (1 / (1 + getClamBonus(levels, 8) / 100));

  if (index === 0) {
    return discount * (Math.pow(multi, upgradeLevel)
      + (3 * upgradeLevel) + Math.pow(upgradeLevel, 2.5));
  }
  return discount * ((getClamPearlUpgReq(workerClass, index) / 5)
    * Math.pow(multi, upgradeLevel)
    + (2 * upgradeLevel)
    + Math.pow(upgradeLevel, 1.5));
}

// Game: _customBlock_Thingies("ClamBonuses"). Index 3 (MULTI-SCALPING) scales with the multikill
// of the character farming the Clamworks, hence the parameter.
export const getClamBonus = (levels: number[], index: number, multiKill: number = DEFAULT_CLAM_MULTIKILL): number => {
  const upgradeLevel = levels[index] ?? 0;
  const perLevel = parseFloat(generalSpelunky[28]?.[index] ?? 0);
  if (index === 3) return (multiKill / 1000) * perLevel * upgradeLevel;
  return perLevel * upgradeLevel;
}

const getBlackPearlValue = (levels: number[]): number => 50 + getClamBonus(levels, 5);

const getClamPearlValue = (levels: number[], multiKill: number = DEFAULT_CLAM_MULTIKILL): number => {
  return (1 + getClamBonus(levels, 0))
    * (1 + getClamBonus(levels, 3, multiKill) / 100)
    * (1 + getClamBonus(levels, 7) / 100);
}

// Relative pearl income: mobs on the map x pearl value x the 10x roll x drop chance. Proportional
// to pearls per hour, so it ranks upgrades correctly. Drop rate and the Clamworks AFK penalty are
// flat multipliers on top and cancel out of the comparison.
const getClamPearlGain = (levels: number[], workerClass: number, multiKill: number = DEFAULT_CLAM_MULTIKILL): number => {
  const dropMulti = (1 + getClamBonus(levels, 6) / 100) * Math.pow(0.66, workerClass);
  const pearlChance = 0.005 * dropMulti;
  // Pure pearls only enter the drop table once PURE_PEARLS is bought at least once.
  const purePearlChance = (levels[5] ?? 0) > 0 ? 25e-6 * dropMulti : 0;
  const tenXChance = 1 - 1 / (1 + getClamBonus(levels, 2) / 100);
  const tenXValue = 1 + 9 * tenXChance;

  return getClamMobs(levels)
    * getClamPearlValue(levels, multiKill)
    * tenXValue
    * (pearlChance + purePearlChance * getBlackPearlValue(levels));
}

// The divisor FRUGALITY and ANTI_INFLATION apply to every upgrade cost. Ranking this directly
// gives "% cheaper per pearl spent", which is what those two upgrades actually buy.
const getClamCostReduction = (levels: number[]): number => {
  return (1 + getClamBonus(levels, 4) / 100) * (1 + getClamBonus(levels, 8) / 100);
}

export const getOptimizedClamWorkUpgrades = (character: any, account: any, category: string = 'pearlGain', maxUpgrades: number = 100, options: any = {}) => {
  const workerClass = getWorkerClass(account);
  const multiKill = options?.multiKill ?? DEFAULT_CLAM_MULTIKILL;
  const levelsOf = (upgrades: any) => upgrades.map((upgrade: any) => upgrade?.level ?? 0);

  return getOptimizedGenericUpgrades({
    character,
    account,
    category,
    maxUpgrades,
    categoryInfo: (CLAM_WORK_UPGRADE_CATEGORIES as Record<string, any>)[category],
    getUpgrades: (acc: any) => acc?.clamWork?.upgrades || [],
    getResources: (acc: any) => acc?.clamWork?.pearls || [],
    getCurrentStats: (upgrades: any) => {
      const levels = levelsOf(upgrades);
      return {
        pearlGain: getClamPearlGain(levels, workerClass, multiKill),
        costReduction: getClamCostReduction(levels)
      };
    },
    getUpgradeCost: (upgrade: any, index: any, { upgrades }: any) => getClamCost(levelsOf(upgrades), index, workerClass),
    updateResourcesAfterUpgrade: (resources: any, upgrade: any, resourceNames: any, cost: any) => {
      if (resources[0]) resources[0].value -= cost;
    },
    resourceNames: pearlNames,
    extraArgs: options
  });
}

interface ClamWorkDescriptionData {
  bonus: number;
  mobs: number;
  pearlValue: number;
  blackPearlValue: number;
}

const formatClamWorkDescription = (description: string, index: number, { bonus, mobs, pearlValue, blackPearlValue }: ClamWorkDescriptionData): string => {
  if (!description) return description;
  let text = description;
  if (index === 5) {
    if (blackPearlValue < 100) {
      return "Upgrade_this_once_to_add_Pure_Pearls_to_the_Clam's_Drop_Table...";
    }
  }

  const multiplier = 1 + bonus / 100;
  const multiplierFormatted = notateNumber(multiplier, 'MultiplierInfo');
  text = text.replace(/\}/g, multiplierFormatted as string);

  // Replace $ with special values based on index
  if (text.includes('$')) {
    let dollarValue = '';

    if (index === 0) {
      dollarValue = '' + Math.floor(pearlValue);
    } else if (index === 1) {
      dollarValue = '' + Math.floor(mobs);
    } else if (index === 2 || index === 4) {
      const chance = Math.floor(1e4 * (1 - 1 / (1 + bonus / 100))) / 100;
      dollarValue = '' + chance;
    } else if (index === 5) {
      dollarValue = '' + Math.floor(blackPearlValue);
    } else {
      dollarValue = '' + Math.floor(bonus);
    }
    text = text.replace(/\$/g, dollarValue);
  }

  return text;
};
