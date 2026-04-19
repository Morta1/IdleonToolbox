import { number2letter, tryToParse } from '@utility/helpers';
import { cogKeyMap, flagsReqs, randomList, towers } from '@website-data';
import { createCogstructionData } from '@parsers/world-3/cogstrution';
import { getGambitBonus } from '@parsers/world-5/caverns/gambit';
import { getAtomBonus } from '@parsers/world-3/atomCollider';
import { getLegendTalentBonus } from '@parsers/world-7/legendTalents';
import { getSushiBonus } from '@parsers/world-7/sushiStation';
import type { IdleonData, Account } from '../types';

export const getConstruction = (idleonData: IdleonData, account: Account) => {
  const cogMapRaw = idleonData?.CogMap || tryToParse(idleonData?.CogM);
  const cogOrderRaw = idleonData?.CogOrder || tryToParse(idleonData?.CogO);
  const cogMap = createCogMap(cogMapRaw, cogOrderRaw?.length);
  const cogsMap = parseConstruction(cogMap);
  const board = getFlags(idleonData, cogsMap, cogOrderRaw, account);
  const cogstruction = createCogstructionData(cogsMap, cogOrderRaw);
  return {
    ...board,
    cogstruction
  };
}

export const getFlags = (idleonData: IdleonData, cogsMap: any[], cogOrderRaw: any[], account: Account) => {
  const flagsUnlockedRaw = idleonData?.FlagUnlock || tryToParse(idleonData?.FlagU);
  const flagsPlacedRaw = idleonData?.FlagsPlaced || tryToParse(idleonData?.FlagP);
  return parseFlags(flagsUnlockedRaw, flagsPlacedRaw, cogsMap, cogOrderRaw, account);
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

export const BOARD_Y = 8;
export const BOARD_X = 12;
export const LEFT_COL_INDEX = 228;
export const RIGHT_COL_INDEX = 240;
export const EXTRA_COL_HEIGHT = 12;
export const LEFT_FLAG_INDEX = 96;   // FlagUnlock/FlagsPlaced indices for left extra column
export const RIGHT_FLAG_INDEX = 108; // FlagUnlock/FlagsPlaced indices for right extra column

const parseFlags = (flagsUnlockedRaw: any[], flagsPlacedRaw: any[], cogsMap: any[], cogsOrder: any[], account: Account) => {
  let board = flagsUnlockedRaw?.slice(0, BOARD_X * BOARD_Y)?.reduce((res, flagSlot, index) => {
    const name = cogsOrder?.[index];
    const stats = cogsMap?.[index];
    return [...res, {
      currentAmount: flagSlot === -11 ? flagsReqs?.[index] : parseFloat(flagSlot),
      requiredAmount: flagsReqs?.[index],
      flagPlaced: flagsPlacedRaw?.includes(index),
      cog: {
        name,
        stats,
        originalIndex: index
      }
    }];
  }, []);
  const gemShop = (account?.gemShopPurchases as any[])?.find((value: any, index: any) => index === 118) ?? 0;
  const flaggyMulti = (1 + 50 * gemShop / 100)
  const playersBuildRate = cogsMap?.map((cog, index) => ({
    ...cog,
    name: cogsOrder?.[index]
  })).filter(({ name }) => name?.includes('Player_'))
    .reduce((sum, { a }) => sum + (a?.value || 0), 0);
  const firstBoard = evaluateBoard(board);
  const leftColumn = buildExtraColumn(flagsUnlockedRaw, flagsPlacedRaw, cogsMap, cogsOrder, LEFT_COL_INDEX, LEFT_FLAG_INDEX);
  const rightColumn = buildExtraColumn(flagsUnlockedRaw, flagsPlacedRaw, cogsMap, cogsOrder, RIGHT_COL_INDEX, RIGHT_FLAG_INDEX);
  const smallCogExpMulti = 1 + getSmallCogBonusTotal(cogsOrder, 2) / 100;
  const finalFlaggyRate = firstBoard?.totalFlaggyRate * flaggyMulti;
  return {
    ...firstBoard,
    baseBoard: board,
    totalFlaggyRate: finalFlaggyRate,
    totalExpRate: firstBoard?.totalExpRate * smallCogExpMulti,
    playersBuildRate,
    leftColumn,
    rightColumn,
    board: firstBoard?.board?.map((slot: any) => ({
      ...slot,
      flagSpeed: slot.flagSpeedBoost * finalFlaggyRate
    }))
  };
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

const swapElements = (board: any[], index1: number, index2: number) => {
  // Create a new array with the same objects as the original board
  const newBoard = [...board];

  // Swap the inner properties (cog objects) at the specified indices
  const tempCog = { ...newBoard[index1]?.cog };
  newBoard[index1] = {
    ...newBoard[index1],
    cog: { ...newBoard[index2]?.cog }
  };
  newBoard[index2] = {
    ...newBoard[index2],
    cog: tempCog
  };

  return newBoard;
}

export const optimizeArrayWithSwaps = (arr: any[], stat: string, time: number = 2500, characters?: any[]) => {
  let currentSolution = [...arr];
  let best = evaluateBoard(currentSolution, characters)
  let currentScore = (best as any)?.[stat];
  let moves: any[] = [];
  const startTime = Date.now();

  while (Date.now() - startTime < time) {
    const randomIndex1 = Math.floor(Math.random() * currentSolution.length);
    const randomIndex2 = Math.floor(Math.random() * currentSolution.length);

    if (randomIndex1 === randomIndex2) {
      continue; // Skip the swap if the same index is selected
    }

    // Additional conditions to skip the swap
    if (
      currentSolution?.[randomIndex1]?.currentAmount < currentSolution?.[randomIndex1]?.requiredAmount ||
      currentSolution?.[randomIndex2]?.currentAmount < currentSolution?.[randomIndex2]?.requiredAmount ||
      currentSolution?.[randomIndex1]?.flagPlaced ||
      currentSolution?.[randomIndex1]?.cog?.stats?.h === 'everything' ||
      currentSolution?.[randomIndex2]?.flagPlaced ||
      currentSolution?.[randomIndex2]?.cog?.stats?.h === 'everything'
    ) {
      continue; // Skip the swap if any of the conditions are met
    }

    const newSolution = swapElements(currentSolution, randomIndex1, randomIndex2);
    const newBoard = evaluateBoard(newSolution, characters);
    if ((newBoard as any)?.[stat] > currentScore) {
      // If a lower score is better, use "<". If higher is better, use ">".
      best = newBoard;
      currentSolution = newSolution;
      currentScore = (newBoard as any)?.[stat];
      moves = [...moves, { from: randomIndex1, to: randomIndex2 }];
    }
  }

  return { ...best, moves };
}

const evaluateBoard = (currentBoard: any[], characters?: any[]) => {
  const { boosted, relations } = getAllBoostedCogs(currentBoard);
  let totalBuildRate = 0, totalExpRate = 0, totalFlaggyRate = 0, totalPlayerExpRate = 0;
  let updatedBoard = currentBoard?.map((slot, index) => {
    const { cog } = slot || {};
    const { e: boostedBuildRate, g: boostedFlaggyRate, f: characterExpPerHour, j: boostedFlagSpeed } = boosted?.[index] || {};
    const cogBaseBuildRate = cog?.stats?.a?.value || 0;
    const cogBaseFlaggyRate = cog?.stats?.c?.value || 0;
    const cogBasePlayerCharacterExp = cog?.stats?.b?.value || 0;
    let playerExp = 0;
    if (cog?.name?.includes('Player_')) {
      const character = characters?.find(({ name }) => name === cog?.name.replace('Player_', ''));
      if (!character) {
        totalPlayerExpRate += cogBasePlayerCharacterExp
      } else {
        playerExp = character?.constructionExpPerHour * (1 + (characterExpPerHour?.value || 0) / 100);
        totalPlayerExpRate += playerExp;
      }
    }

    const buildRate = cogBaseBuildRate * (1 + (boostedBuildRate?.value || 0) / 100);
    totalBuildRate += Math.max(buildRate, 0);

    totalExpRate += cog?.stats?.d?.value || 0;

    const flaggyRate = cogBaseFlaggyRate + (cogBaseFlaggyRate * (boostedFlaggyRate?.value || 0) / 100);
    totalFlaggyRate += Math.max(flaggyRate, 0);

    const flagSpeedBoost = slot?.flagPlaced ? 1 + (boostedFlagSpeed?.value || 0) / 100 : 0;

    return {
      ...slot,
      cog: {
        ...cog,
        stats: {
          ...cog?.stats,
          a: { ...cog?.stats?.a, value: buildRate },
          c: { ...cog?.stats?.c, value: flaggyRate },
          ...(characters ? { b: { ...cog?.stats?.b, value: playerExp } } : {})
        }
      },
      flagSpeedBoost,
      affectedBy: relations?.[index] || [],
      affects: Object.entries(relations)
        .filter(([_, affectingIndices]) => (affectingIndices as any[]).includes(index))
        .map(([affectedIndex]) => parseInt(affectedIndex))
    };
  });
  if (characters) {
    updatedBoard = updatedBoard?.map((slot) => {
      if (slot?.cog?.name?.includes('Player_')) {
        return {
          ...slot,
          cog: {
            ...slot?.cog,
            stats: {
              ...slot?.cog?.stats,
              b: { ...slot?.cog?.stats?.b, value: slot?.cog?.stats?.b?.value * (1 + totalExpRate / 100) }
            }
          }
        }
      }
      return slot;
    })
  }
  return {
    totalBuildRate,
    totalExpRate,
    totalFlaggyRate,
    totalPlayerExpRate: totalPlayerExpRate * (characters ? (1 + totalExpRate / 100) : 1),
    board: updatedBoard
  };
}

export const getAllBoostedCogs = (board: any[]) => {
  const relations: Record<number, any[]> = {};
  let boosted = new Array(BOARD_X * BOARD_Y).fill(0);
  for (let y = 0; y < BOARD_Y; y++) {
    for (let x = 0; x < BOARD_X; x++) {
      const index = (7 - y) * 12 + x;
      const currentCog = board?.[index]?.cog;
      const currentCogStats = board?.[index]?.cog?.stats || {};
      let affected: any = getAffectedIndexes(currentCog, x, y);
      if (affected?.length > 0) {
        affected = (affected as any[])?.map(([x, y]: any) => (x < 0 || y < 0 || x >= BOARD_X || y >= BOARD_Y)
          ? null
          : (7 - y) * 12 + x)?.filter((num: any) => num !== null) as number[];
        const { e, f, g, j } = currentCogStats || {};
        if (e || f || g || j) {
          for (let i = 0; i < affected.length; i++) {
            const affectedIndex = affected[i] as number;
            const { e, f, g, j } = currentCogStats;
            if (boosted?.[affectedIndex] === 0) {
              boosted[affectedIndex] = {
                e: { value: e?.value || 0 },
                f: { value: f?.value || 0 },
                g: { value: g?.value || 0 },
                j: { value: j?.value || 0 }
              }
            } else {
              const { e: curE, f: curF, g: curG, j: curJ } = boosted[affectedIndex] || {};
              boosted[affectedIndex] = {
                e: { ...curE, value: (curE?.value || 0) + (e?.value || 0) },
                f: { ...curF, value: (curF?.value || 0) + (f?.value || 0) },
                g: { ...curG, value: (curG?.value || 0) + (g?.value || 0) },
                j: { ...curJ, value: (curJ?.value || 0) + (j?.value || 0) }
              }
            }
            relations[affectedIndex] = [...(relations[affectedIndex] || []), index];
          }
        }
      }
    }
  }

  return {
    boosted,
    relations
  }
}

export const getAffectedIndexes = (currentCog: any, x: number, y: number) => {
  const affected = [];
  switch (currentCog?.stats?.h) {
    case 'diagonal':
      affected.push([x - 1, y - 1], [x + 1, y - 1], [x - 1, y + 1], [x + 1, y + 1]);
      break;
    case 'adjacent':
      affected.push([x - 1, y], [x, y + 1], [x + 1, y], [x, y - 1]);
      break;
    case 'up':
      affected.push([x - 1, y + 2], [x, y + 2], [x + 1, y + 2], [x - 1, y + 1], [x, y + 1], [x + 1, y + 1]);
      break;
    case 'right':
      affected.push([x + 2, y - 1], [x + 2, y], [x + 2, y + 1], [x + 1, y - 1], [x + 1, y], [x + 1, y + 1]);
      break;
    case 'down':
      affected.push([x - 1, y - 2], [x, y - 2], [x + 1, y - 2], [x - 1, y - 1], [x, y - 1], [x + 1, y - 1]);
      break;
    case 'left':
      affected.push([x - 2, y - 1], [x - 2, y], [x - 2, y + 1], [x - 1, y - 1], [x - 1, y], [x - 1, y + 1]);
      break;
    case 'row':
      for (let k = 0; k < BOARD_X; k++) {
        if (x === k) continue;
        affected.push([k, y]);
      }
      break;
    case 'column':
      for (let k = 0; k < BOARD_Y; k++) {
        if (y === k) continue;
        affected.push([x, k]);
      }
      break;
    case 'corners':
      affected.push([x - 2, y - 2], [x + 2, y - 2], [x - 2, y + 2], [x + 2, y + 2]);
      break;
    case 'around':
      affected.push([x, y - 2], [x - 1, y - 1], [x, y - 1], [x + 1, y - 1], [x - 2, y], [x - 1, y], [x + 1, y],
        [x + 2, y], [x - 1, y + 1], [x, y + 1], [x + 1, y + 1], [x, y + 2]);
      break;
    case 'everything':
      for (let l = 0; l < BOARD_Y; l++) {
        for (let k = 0; k < BOARD_X; k++) {
          if (y === l && x === k) continue;
          affected.push([k, l]);
        }
      }
      break;
    default:
      break;
  }
  return affected;
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
    const level = towersRaw?.[towerData?.index];
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
      progress: towersRaw?.[towerData?.index + 12 + towersLength * 2],
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