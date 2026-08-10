import { number2letter, tryToParse } from '@utility/helpers';
import { cogKeyMap, flagsReqs, randomList, towers } from '@website-data';
import { createCogstructionData } from '@parsers/world-3/cogstrution';
import { getGambitBonus } from '@parsers/world-5/caverns/gambit';
import { getAtomBonus } from '@parsers/world-3/atomCollider';
import { getLegendTalentBonus } from '@parsers/world-7/legendTalents';
import { getSushiBonus } from '@parsers/world-7/sushiStation';
import {
  BOARD_SIZE,
  BOARD_X,
  BOARD_Y,
  evaluateBoard,
  excogiaPieceIndex,
  getAssembledExcogiaSlots,
  stripExcogiaBoost
} from '@parsers/world-3/constructionOptimizer';
import type { IdleonData, Account } from '../types';

// The board maths lives in its own module so the optimizer can run in a Web Worker without pulling
// website-data in. Re-exported here because everything already imports it from this file.
export {
  BOARD_SIZE,
  BOARD_X,
  BOARD_Y,
  countBoardCharacters,
  evaluateBoard,
  getAffectedIndexes,
  getAllBoostedCogs,
  getBoardAtStep,
  isCharacterCog,
  optimizeArrayWithSwaps,
  WEIGHTED_STAT,
  WEIGHTED_STAT_KEYS
} from '@parsers/world-3/constructionOptimizer';
export type { OptimizeMove, OptimizeOptions, StatWeights, WeightedStatKey } from '@parsers/world-3/constructionOptimizer';

export const getConstruction = (idleonData: IdleonData, account: Account, characters?: any[]) => {
  const cogMapRaw = idleonData?.CogMap || tryToParse(idleonData?.CogM);
  const cogOrderRaw = idleonData?.CogOrder || tryToParse(idleonData?.CogO);
  const cogMap = createCogMap(cogMapRaw, cogOrderRaw?.length);
  const cogsMap = parseConstruction(cogMap);
  const board = getFlags(idleonData, cogsMap, cogOrderRaw, account, characters);
  const cogstruction = createCogstructionData(cogsMap, cogOrderRaw);
  return {
    ...board,
    cogstruction
  };
}

export const getFlags = (idleonData: IdleonData, cogsMap: any[], cogOrderRaw: any[], account: Account, characters?: any[]) => {
  const flagsUnlockedRaw = idleonData?.FlagUnlock || tryToParse(idleonData?.FlagU);
  const flagsPlacedRaw = idleonData?.FlagsPlaced || tryToParse(idleonData?.FlagP);
  return parseFlags(flagsUnlockedRaw, flagsPlacedRaw, cogsMap, cogOrderRaw, account, characters);
}

const parseConstruction = (cogMap: any[]) => {
  return cogMap?.map((cogObject) => {
    return Object.entries(cogObject)?.reduce((res, [key, value]) => (cogKeyMap as Record<string, any>)?.[key] && (cogKeyMap as Record<string, any>)?.[key] !== '_' ? {
      ...res,
      [key]: { name: (cogKeyMap as Record<string, any>)?.[key], value }
    } : { ...res, [key]: value }, {});
  });
}

const createCogMap = (cogMap: any, length: number) => {
  let array: any[] = [];
  for (let i = 0; i < length; i++) {
    array[i] = cogMap?.[i] || {};
  }
  return array;
}

export const SPARE_START_INDEX = 96;  // CogOrder 96-107 are character slots, 108-227 the cog inventory
export const LEFT_COL_INDEX = 228;
export const RIGHT_COL_INDEX = 240;
export const EXTRA_COL_HEIGHT = 12;
export const LEFT_FLAG_INDEX = 96;   // FlagUnlock/FlagsPlaced indices for left extra column
export const RIGHT_FLAG_INDEX = 108; // FlagUnlock/FlagsPlaced indices for right extra column

const parseFlags = (flagsUnlockedRaw: any[], flagsPlacedRaw: any[], cogsMap: any[], cogsOrder: any[], account: Account, characters?: any[]) => {
  // Catalog-driven: BOARD_SIZE is the game's fixed board grid, and flagsReqs (website-data) gives
  // every slot's requirement regardless of the save. Always building the full BOARD_SIZE array
  // (rather than one only as long as flagsUnlockedRaw) means a missing/short save renders an empty
  // board instead of throwing on `board.map` a few lines down. Every observed real save's
  // FlagUnlock is at least BOARD_SIZE long, so this reads the identical BOARD_SIZE values for a real
  // account that the old `.slice(0, BOARD_SIZE)` did.
  let board: any[] = Array.from({ length: BOARD_SIZE }, (_, index) => {
    const flagSlot = flagsUnlockedRaw?.[index];
    const name = cogsOrder?.[index];
    const stats = cogsMap?.[index];
    return {
      currentAmount: flagSlot === -11 ? flagsReqs?.[index] : parseFloat(flagSlot ?? 0),
      requiredAmount: flagsReqs?.[index],
      flagPlaced: flagsPlacedRaw?.includes(index),
      cog: {
        name,
        stats,
        originalIndex: index
      }
    };
  });
  // An Excogia piece outside an assembled square carries no boost, whatever the save still says.
  const assembledSlots = getAssembledExcogiaSlots(board);
  board = board.map((slot: any, index: number) => (excogiaPieceIndex(slot?.cog?.name) >= 0 && !assembledSlots.has(index)
    ? { ...slot, cog: stripExcogiaBoost(slot.cog) }
    : slot));
  const gemShop = (account?.gemShopPurchases as any[])?.find((value: any, index: any) => index === 118) ?? 0;
  const flaggyMulti = (1 + 50 * gemShop / 100)
  const playersBuildRate = cogsMap?.map((cog, index) => ({
    ...cog,
    name: cogsOrder?.[index]
  })).filter(({ name }) => name?.includes('Player_'))
    .reduce((sum, { a }) => sum + (a?.value || 0), 0);
  const firstBoard = evaluateBoard(board, characters);
  const leftColumn = buildExtraColumn(flagsUnlockedRaw, flagsPlacedRaw, cogsMap, cogsOrder, LEFT_COL_INDEX, LEFT_FLAG_INDEX);
  const rightColumn = buildExtraColumn(flagsUnlockedRaw, flagsPlacedRaw, cogsMap, cogsOrder, RIGHT_COL_INDEX, RIGHT_FLAG_INDEX);
  const expRateMulti = 1 + getSmallCogBonusTotal(cogsOrder, 2) / 100;
  const finalFlaggyRate = firstBoard?.totalFlaggyRate * flaggyMulti;
  // ExtraBuildSPDmulti and ExtraFlaggyRatemulti are deliberately not applied to these totals. The
  // game bakes them into the character cogs' own stats before the board is summed (N.js:93466), so
  // they are already inside the numbers below - multiplying again counts them twice, and would also
  // apply them to plain cogs that never get them. Only the gem flaggy and small cog exp multipliers
  // act on the total (N.js:93493 and :93495), which is what the two above are.
  return {
    ...firstBoard,
    baseBoard: board,
    spareCogs: buildSpareCogs(cogsMap, cogsOrder),
    // Passed straight back into optimizeArrayWithSwaps so an optimized board reports on the same basis.
    boardMultipliers: { flaggy: flaggyMulti, exp: expRateMulti },
    totalFlaggyRate: finalFlaggyRate,
    totalExpRate: firstBoard?.totalExpRate * expRateMulti,
    playersBuildRate,
    leftColumn,
    rightColumn,
    smallCogs: getSmallCogUpgrades(cogsOrder, [...leftColumn, ...rightColumn]),
    board: firstBoard?.board?.map((slot: any) => ({
      ...slot,
      flagSpeed: slot.flagSpeedBoost * finalFlaggyRate
    }))
  };
}

// Cogs sitting in the character slots / cog inventory. The optimizer may pull these onto the board.
// Empty slots are kept rather than skipped: taking a cog off the board means moving it into one, so
// without them a board with a full inventory could never have anything removed from it. The
// optimizer ignores them unless it has a reason to empty a slot.
const buildSpareCogs = (cogsMap: any[], cogsOrder: any[]) => {
  const spares = [];
  for (let index = SPARE_START_INDEX; index < LEFT_COL_INDEX; index++) {
    const name = cogsOrder?.[index];
    if (!name) continue;
    if (name.startsWith('CogSm')) continue; // small cogs only fit the side columns
    spares.push({ name, stats: cogsMap?.[index] ?? {}, originalIndex: index });
  }
  return spares;
}

const getSmallCogRawBonus = (cogName: string): { typeIndex: number; bonus: number } | null => {
  if (!cogName?.startsWith('CogSm')) return null;
  const typeChar = cogName.charAt(5);
  const level = parseInt(cogName.substring(6));
  if (isNaN(level)) return null;
  const typeIndex = number2letter.indexOf(typeChar);
  const base = (25 + 25 * level * level) * (1 + level / 5);
  let bonus;
  if (typeIndex === 0) bonus = Math.round(2 * base);
  else if (typeIndex === 1) bonus = Math.round(4 * base);
  else bonus = Math.round(base);
  return { typeIndex, bonus };
};

const getSmallCogStats = (cogName: string) => {
  const result = getSmallCogRawBonus(cogName);
  if (!result) return null;
  const { typeIndex, bonus } = result;
  const multiplier = parseFloat((1 + bonus / 100).toFixed(2));
  const statKeys = ['g', 'e', 'f'];
  const statNames = ['x_Total_Flaggy_Rate', 'x_Total_Build_Rate', 'x_Total_Construction_XP'];
  const statKey = statKeys[typeIndex] ?? 'e';
  const statName = statNames[typeIndex] ?? 'x_Total_Build_Rate';
  return { [statKey]: { name: statName, value: multiplier } };
};

// The game builds a cog's name from its raw id rather than storing one (N.js:67410). Same tables
// here so the UI can call a cog what the game calls it instead of showing "Cog3B0".
const COG_TIERS: Record<string, string> = { '0': 'Nooby', '1': 'Decent', '2': 'Superb', '3': 'Ulti', Z: 'Yin', S: 'Tiny' };
const CRYSTAL_COGS = ['Topaz', 'Ruby', 'Amethyst', 'Garnet', 'Emerald', 'Bluegem'];
// Keyed on characters 5-6 of the id, for cogs whose boost has a shape.
const COG_SHAPES: Record<string, string> = {
  ad: 'Adjay', di: 'Diggle', le: 'Leff', ri: 'Rite', up: 'Uppy',
  do: 'Downer', cn: 'Sniper', co: 'Collumm', ro: 'Rowow'
};
// Same two characters, for the plain cogs. A0 is the bare tier name with no grade word.
const COG_GRADES: Record<string, string> = {
  A0: '', A1: 'Average', A2: 'Spur', A3: 'Stacked', A4: 'Deckered',
  B0: 'Double', B1: 'Trips', B2: 'Trabble', B3: 'Quad', B4: 'Penta'
};
const SMALL_COG_STATS = ['Flaggy', 'Build', 'XP'];

/** What the game calls a cog, e.g. Cog3B0 -> "Ulti Double Cog". */
export const getCogDisplayName = (rawName?: string): string => {
  if (!rawName) return '';
  // Blank is a real entry in the cog order - an empty slot. In a list of steps "swaps with Blank"
  // reads like a cog you cannot find, so name it for what it is.
  if (rawName === 'Blank') return 'Empty slot';
  if (rawName.startsWith('Player_')) return rawName.slice(7);
  if (!rawName.startsWith('Cog')) return rawName;

  const tierChar = rawName.charAt(3);
  const pair = rawName.substring(4, 6);
  if (tierChar === 'C') return `${CRYSTAL_COGS[Number(rawName.replace('CogCry', ''))] ?? 'Glitched'} Cog`;
  if (tierChar === 'Y') return 'Yang Cog';
  if (tierChar === 'S') {
    const stat = SMALL_COG_STATS[number2letter.indexOf(rawName.charAt(5))];
    return `Tiny T${Number(rawName.substring(6)) + 1}${stat ? ` ${stat}` : ''} Cog`;
  }
  // The four gem shop pieces are all "Yin Cog" to the game, which is useless in a list of steps.
  const excogiaPiece = excogiaPieceIndex(rawName);
  if (excogiaPiece >= 0) return `Excogia piece ${excogiaPiece + 1}`;

  const tier = COG_TIERS[tierChar] ?? 'Glitched';
  if (number2letter.includes(rawName.charAt(5))) return `${tier} ${COG_SHAPES[pair] ?? 'Omni'} Cog`;
  const grade = COG_GRADES[pair] ?? 'Mongo';
  return `${tier}${grade ? ` ${grade}` : ''} Cog`;
}

// number2letter[0] is '_', so the letter after "CogSm" maps to 0 flaggy, 1 build, 2 construction XP.
const SMALL_COG_TYPES = [
  { key: 'flaggy', label: 'Flaggy rate' },
  { key: 'build', label: 'Build rate' },
  { key: 'constructionXp', label: 'Construction XP' }
] as const;

export interface SmallCog {
  name: string;
  /** CogOrder index, so a side slot and an inventory cog can be told apart. */
  originalIndex: number;
  typeIndex: number;
  type: string;
  typeLabel: string;
  bonus: number;
}

export interface SmallCogUpgrade extends SmallCog {
  /** The cog currently in the slot, or null when the slot is simply empty. */
  replaces: SmallCog | null;
  slotIndex: number;
  slotLabel: string;
  /** How much the type's total goes up, as a percentage of the rate it multiplies. */
  gainPercent: number;
}

const describeSmallCog = (name: string, originalIndex: number): SmallCog | null => {
  const raw = getSmallCogRawBonus(name);
  const type = SMALL_COG_TYPES[raw?.typeIndex ?? -1];
  if (!raw || !type) return null;
  return { name, originalIndex, typeIndex: raw.typeIndex, type: type.key, typeLabel: type.label, bonus: raw.bonus };
};

const sideSlotLabel = (slotIndex: number) => (slotIndex < RIGHT_COL_INDEX
  ? `Left #${slotIndex - LEFT_COL_INDEX + 1}`
  : `Right #${slotIndex - RIGHT_COL_INDEX + 1}`);

/**
 * Small cogs only fit the side columns and their bonuses are a flat sum, so where they sit makes no
 * difference - the only thing worth reporting is a stronger one going unused in the inventory.
 * Same-type swaps only: trading a flaggy cog for a build one is a judgement call, not an upgrade.
 */
export const getSmallCogUpgrades = (cogsOrder: any[], sideSlots: any[]): { upgrades: SmallCogUpgrade[]; spares: SmallCog[]; freeSlots: number } => {
  const spares: SmallCog[] = [];
  for (let index = SPARE_START_INDEX; index < LEFT_COL_INDEX; index++) {
    const cog = describeSmallCog(cogsOrder?.[index], index);
    if (cog) spares.push(cog);
  }

  // A slot you cannot put a cog in today is not an opportunity.
  const usable = sideSlots.filter((slot: any) => !slot?.flagPlaced
    && (slot?.currentAmount ?? 0) >= (slot?.requiredAmount ?? 0));
  const placed = usable
    .map((slot: any) => ({ slotIndex: slot?.cog?.originalIndex, cog: describeSmallCog(slot?.cog?.name, slot?.cog?.originalIndex) }))
    .filter(({ cog }) => cog);
  const freeSlots = usable.length - placed.length;

  const totals = SMALL_COG_TYPES.map((_, typeIndex) => getSmallCogBonusTotal(cogsOrder, typeIndex));
  const upgrades: SmallCogUpgrade[] = [];
  const taken = new Set<number>();

  // Empty slots first - anything that lands there is a pure gain, so it should not lose a strong
  // spare to a swap that only nets the difference.
  const byBonus = [...spares].sort((a, b) => b.bonus - a.bonus);
  for (let index = 0; index < Math.min(freeSlots, byBonus.length); index++) {
    const cog = byBonus[index];
    const slot = usable.find((s: any) => !describeSmallCog(s?.cog?.name, 0) && !taken.has(s?.cog?.originalIndex));
    taken.add(cog.originalIndex);
    if (slot) taken.add(slot.cog.originalIndex);
    upgrades.push({
      ...cog,
      replaces: null,
      slotIndex: slot?.cog?.originalIndex ?? -1,
      slotLabel: slot ? sideSlotLabel(slot.cog.originalIndex) : 'Empty slot',
      gainPercent: (cog.bonus / (100 + totals[cog.typeIndex])) * 100
    });
  }

  SMALL_COG_TYPES.forEach((_, typeIndex) => {
    const weakestFirst = placed.filter(({ cog }) => cog!.typeIndex === typeIndex)
      .sort((a, b) => a.cog!.bonus - b.cog!.bonus);
    const strongestFirst = spares.filter((cog) => cog.typeIndex === typeIndex && !taken.has(cog.originalIndex))
      .sort((a, b) => b.bonus - a.bonus);
    for (let index = 0; index < Math.min(weakestFirst.length, strongestFirst.length); index++) {
      const current = weakestFirst[index].cog!;
      const candidate = strongestFirst[index];
      if (candidate.bonus <= current.bonus) break;
      upgrades.push({
        ...candidate,
        replaces: current,
        slotIndex: weakestFirst[index].slotIndex,
        slotLabel: sideSlotLabel(weakestFirst[index].slotIndex),
        gainPercent: ((candidate.bonus - current.bonus) / (100 + totals[typeIndex])) * 100
      });
    }
  });

  return { upgrades: upgrades.sort((a, b) => b.gainPercent - a.gainPercent), spares, freeSlots };
}

const getSmallCogBonusTotal = (cogsOrder: any[], typeIndex: number) => {
  let total = 0;
  for (let i = 0; i < 2 * EXTRA_COL_HEIGHT; i++) {
    const result = getSmallCogRawBonus(cogsOrder?.[LEFT_COL_INDEX + i]);
    if (result && result.typeIndex === typeIndex) {
      total += result.bonus;
    }
  }
  return total;
};

const getExtraColumnFlagReq = (flagIdx: number) => {
  if (flagIdx < 96) return flagsReqs?.[flagIdx] ?? 0;
  return 5e6 * (1 + Math.min(9, 9 * Math.round(flagIdx - 96)) + Math.max(0, 10 * Math.round(flagIdx - 97))) * Math.pow(4, Math.round(flagIdx - 96));
}

const buildExtraColumn = (flagsUnlockedRaw: any[], flagsPlacedRaw: any[], cogsMap: any[], cogsOrder: any[], cogStartIndex: number, flagStartIndex: number) => {
  const column = [];
  for (let i = 0; i < EXTRA_COL_HEIGHT; i++) {
    const cogIdx = cogStartIndex + i;
    const flagIdx = flagStartIndex + i;
    const flagSlot = flagsUnlockedRaw?.[flagIdx];
    const cogName = cogsOrder?.[cogIdx];
    const stats = getSmallCogStats(cogName) ?? cogsMap?.[cogIdx] ?? {};
    const flagReq = getExtraColumnFlagReq(flagIdx);
    column.push({
      currentAmount: flagSlot === -11 ? flagReq : parseFloat(flagSlot ?? 0),
      requiredAmount: flagReq,
      flagPlaced: flagsPlacedRaw?.includes(flagIdx),
      cog: {
        name: cogName,
        stats,
        originalIndex: cogIdx
      },
      affectedBy: [],
      affects: []
    });
  }
  return column;
}


export const getTowers = (idleonData: IdleonData) => {
  const towersRaw = idleonData?.TowerInfo || tryToParse(idleonData?.Tower);
  const totemInfo = tryToParse(idleonData?.TotemInfo) || idleonData?.TotemInfo;
  return parseTowers(towersRaw, totemInfo);
}

const parseTowers = (towersRaw: any, totemInfo: any) => {
  const maxWaves = totemInfo?.[0];
  const totalWaves = maxWaves?.reduce((sum: any, maxWave: any) => sum + maxWave, 0);
  const towersLength = Object.keys(towers).length;
  const inProgress = towersRaw?.slice(54, 62);
  let wizardOverLevels = 0;
  let totalLevels = 0;
  const towersData = Object.entries(towers)?.map(([towerName, towerData]) => {
    // towersRaw is undefined with no save; totalLevels accumulates every tower's level below, and
    // `undefined + anything` is NaN forever after (the accumulator never recovers) - 0 is the correct
    // "never built" default, same as every other un-touched-feature default in this codebase.
    const level = towersRaw?.[towerData?.index] ?? 0;
    if (towerData?.index >= 9 && towerData?.index <= 17) {
      if (level > 50) {
        wizardOverLevels += level - 50;
      }
    }
    totalLevels += level;
    return {
      ...towerData,
      name: towerName,
      level,
      nextLevel: (level + 1) === towersRaw?.[towerData.index + towersLength],
      // towersRaw is undefined with no save; a bare `undefined` progress makes the rendered
      // "progress / buildCost" fraction NaN (see the `level` default above for the same reason).
      // 0 is the correct "never built" default here too.
      progress: towersRaw?.[towerData?.index + 12 + towersLength * 2] ?? 0,
      inProgress: inProgress?.includes(towerData?.index),
      slot: inProgress?.findIndex((ind: any) => ind === towerData?.index)
    }
  });
  return {
    data: towersData,
    buildMultiplier: randomList?.[13],
    wizardOverLevels,
    totalLevels,
    totalWaves,
    towersTwo: towersRaw?.[2]
  }
}

export const getBuildCost = (towers: any, level: number, bonusInc: number, index: number) => {
  if (index === 0) {
    const math1 = Math.pow(level + 1, 2);
    return 2 * math1 * Math.pow(1.3, level + 1);
  } else {
    const multiplier = Number(towers?.buildMultiplier?.[index]);
    return multiplier * Math.pow(bonusInc, level);
  }
}

// this._GenINFO[112].push(250)
export const constructionMasteryThresholds = [250, 500, 750, 1000, 1250, 1500, 2500];

export const applyMaxLevelToTowers = (accountData: any) => {
  const atom = accountData?.atoms?.atoms?.find(({ name }: any) => name === 'Carbon_-_Wizard_Maximizer');
  return accountData?.towers?.data?.map((tower: any) => {
    const extraLevels = getExtraMaxLevels(accountData, tower?.maxLevel, atom?.level, tower?.index);
    return {
      ...tower,
      maxLevel: tower?.maxLevel + extraLevels
    }
  });
}

const getConstructionMasteryBonus = (account: any, totalConstruct: any, index: any) => {
  if ((account?.rift?.currentRift ?? 0) < 40) return 0;
  if (index === 0) {
    return Math.max(0, Math.floor(totalConstruct / 10));
  } else if (index === 1) {
    return Math.max(0, 2 * Math.floor((totalConstruct - constructionMasteryThresholds?.[2]) / 10));
  } else if (index === 2) {
    return Math.max(0, 5 * Math.floor((totalConstruct - constructionMasteryThresholds?.[4]) / 10));
  } else if (index === 3) {
    return totalConstruct >= constructionMasteryThresholds?.[1] ? 35 : 0;
  } else if (index === 4) {
    return totalConstruct >= constructionMasteryThresholds?.[3] ? 100 : 0;
  } else if (index === 5) {
    return totalConstruct >= constructionMasteryThresholds?.[5] ? 100 : 0;
  } else if (index === 6) {
    return totalConstruct >= constructionMasteryThresholds?.[6] ? 30 : 0;
  }
  return 0;
}

export const getExtraMaxLevels = (account: any, maxLevel: any, atomBonus: any, index?: any) => {
  const totalConstruct = account?.towers?.totalLevels;
  return 50 === maxLevel ? Math.round(2 * atomBonus
    + (getConstructionMasteryBonus(account, totalConstruct, 6)
      + 100 * getGambitBonus(account, 9)))
    : 101 === maxLevel ? getConstructionMasteryBonus(account, totalConstruct, 4)
      : 100 === maxLevel
        ? (18 <= index && account?.coralReef?.unlockedCorals > index - 18
          ? Math.round(getConstructionMasteryBonus(account, totalConstruct, 5) + 100 + getSushiBonus(account, 58))
          : Math.round(getConstructionMasteryBonus(account, totalConstruct, 5) + getSushiBonus(account, 58)))
        : 15 === maxLevel ? getConstructionMasteryBonus(account, totalConstruct, 3) : 0;
}

export const getGildedBoostioBonus = (account: any) => {
  const atomBonus = getAtomBonus(account, 'Nitrogen_-_Construction_Trimmer');
  const legendTalentBonus = getLegendTalentBonus(account, 33);
  return (3 + atomBonus / 100) * (1 + legendTalentBonus / 100);
}