import { number2letter, tryToParse } from '@utility/helpers';
import { cogKeyMap, flagsReqs, randomList, towers } from '@website-data';
import { createCogstructionData } from './cogstrution';
import { getGambitBonus } from '@parsers/world-5/caverns/gambit';
import { getAtomBonus } from '@parsers/atomCollider';
import { getLegendTalentBonus } from '@parsers/world-7/legendTalents';

export const getConstruction = (idleonData, account) => {
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

export const getFlags = (idleonData, cogsMap, cogOrderRaw, account) => {
  const flagsUnlockedRaw = idleonData?.FlagUnlock || tryToParse(idleonData?.FlagU);
  const flagsPlacedRaw = idleonData?.FlagsPlaced || tryToParse(idleonData?.FlagP);
  return parseFlags(flagsUnlockedRaw, flagsPlacedRaw, cogsMap, cogOrderRaw, account);
}

const parseConstruction = (cogMap) => {
  return cogMap?.map((cogObject) => {
    return Object.entries(cogObject)?.reduce((res, [key, value]) => cogKeyMap?.[key] && cogKeyMap?.[key] !== '_' ? {
      ...res,
      [key]: { name: cogKeyMap?.[key], value }
    } : { ...res, [key]: value }, {});
  });
}

const createCogMap = (cogMap, length) => {
  let array = [];
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

const parseFlags = (flagsUnlockedRaw, flagsPlacedRaw, cogsMap, cogsOrder, account) => {
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
  const gemShop = account?.gemShopPurchases?.find((value, index) => index === 118) ?? 0;
  const flaggyMulti = (1 + 50 * gemShop / 100)
  const playersBuildRate = cogsMap?.map((cog, index) => ({
    ...cog,
    name: cogsOrder?.[index]
  })).filter(({ name }) => name?.includes('Player_'))
    .reduce((sum, { a }) => sum + (a?.value || 0), 0);
  const firstBoard = evaluateBoard(board);
  const leftColumn = buildExtraColumn(flagsUnlockedRaw, flagsPlacedRaw, cogsMap, cogsOrder, LEFT_COL_INDEX, LEFT_FLAG_INDEX);
  const rightColumn = buildExtraColumn(flagsUnlockedRaw, flagsPlacedRaw, cogsMap, cogsOrder, RIGHT_COL_INDEX, RIGHT_FLAG_INDEX);
  return {
    ...firstBoard,
    baseBoard: board,
    totalFlaggyRate: firstBoard?.totalFlaggyRate * flaggyMulti,
    playersBuildRate,
    leftColumn,
    rightColumn
  };
}

const getSmallCogStats = (cogName) => {
  if (!cogName?.startsWith('CogSm')) return null;
  const typeChar = cogName.charAt(5);
  const level = parseInt(cogName.substring(6));
  if (isNaN(level)) return null;
  const typeIndex = number2letter.indexOf(typeChar);
  const base = (25 + 25 * level * level) * (1 + level / 5);
  let rawBonus;
  if (typeIndex === 0) rawBonus = Math.round(2 * base);
  else if (typeIndex === 1) rawBonus = Math.round(4 * base);
  else rawBonus = Math.round(base);
  // Display as multiplier matching game tooltip: 1 + rawBonus/100 (e.g. 240 → 3.40x)
  const multiplier = parseFloat((1 + rawBonus / 100).toFixed(2));
  // typeIndex 0 ('_') → Flaggy Rate, 1 ('a') → Build Rate, 2 ('b') → Construction XP
  const statKeys = ['g', 'e', 'f'];
  const statNames = ['x_Total_Flaggy_Rate', 'x_Total_Build_Rate', 'x_Total_Construction_XP'];
  const statKey = statKeys[typeIndex] ?? 'e';
  const statName = statNames[typeIndex] ?? 'x_Total_Build_Rate';
  return { [statKey]: { name: statName, value: multiplier } };
};

const buildExtraColumn = (flagsUnlockedRaw, flagsPlacedRaw, cogsMap, cogsOrder, cogStartIndex, flagStartIndex) => {
  const column = [];
  for (let i = 0; i < EXTRA_COL_HEIGHT; i++) {
    const cogIdx = cogStartIndex + i;
    const flagIdx = flagStartIndex + i;
    const flagSlot = flagsUnlockedRaw?.[flagIdx];
    const cogName = cogsOrder?.[cogIdx];
    const stats = getSmallCogStats(cogName) ?? cogsMap?.[cogIdx] ?? {};
    column.push({
      currentAmount: flagSlot === -11 ? (flagsReqs?.[flagIdx] ?? 0) : parseFloat(flagSlot ?? 0),
      requiredAmount: flagsReqs?.[flagIdx] ?? 0,
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

const swapElements = (board, index1, index2) => {
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

export const optimizeArrayWithSwaps = (arr, stat, time = 2500, characters) => {
  let currentSolution = [...arr];
  let best = evaluateBoard(currentSolution, characters)
  let currentScore = best?.[stat];
  let moves = [];
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
    if (newBoard?.[stat] > currentScore) {
      // If a lower score is better, use "<". If higher is better, use ">".
      best = newBoard;
      currentSolution = newSolution;
      currentScore = newBoard?.[stat];
      moves = [...moves, { from: randomIndex1, to: randomIndex2 }];
    }
  }

  return { ...best, moves };
}

const evaluateBoard = (currentBoard, characters) => {
  const { boosted, relations } = getAllBoostedCogs(currentBoard);
  let totalBuildRate = 0, totalExpRate = 0, totalFlaggyRate = 0, totalPlayerExpRate = 0;
  let updatedBoard = currentBoard?.map((slot, index) => {
    const { cog } = slot || {};
    // f: boostedPlayerXp
    const { e: boostedBuildRate, g: boostedFlaggyRate, f: characterExpPerHour } = boosted?.[index] || {};
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
      affectedBy: relations?.[index] || [],
      affects: Object.entries(relations)
        .filter(([_, affectingIndices]) => affectingIndices.includes(index))
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

export const getAllBoostedCogs = (board) => {
  const relations = {};
  let boosted = new Array(BOARD_X * BOARD_Y).fill(0);
  for (let y = 0; y < BOARD_Y; y++) {
    for (let x = 0; x < BOARD_X; x++) {
      const index = (7 - y) * 12 + x;
      const currentCog = board?.[index]?.cog;
      const currentCogStats = board?.[index]?.cog?.stats || {};
      let affected = getAffectedIndexes(currentCog, x, y);
      if (affected?.length > 0) {
        affected = affected?.map(([x, y]) => (x < 0 || y < 0 || x >= BOARD_X || y >= BOARD_Y)
          ? null
          : (7 - y) * 12 + x)?.filter((num) => num !== null);
        const { e, f, g } = currentCogStats || {};
        if (e || f || g) {
          for (let i = 0; i < affected.length; i++) {
            const affectedIndex = affected[i];
            const { e, f, g } = currentCogStats;
            if (boosted?.[affectedIndex] === 0) {
              boosted[affectedIndex] = {
                e: { ...e, value: Math.ceil(e?.value) },
                f: { ...f, value: Math.ceil(f?.value) },
                g: { ...g, value: Math.ceil(g?.value) }
              }
            } else {
              const { e: curE, f: curF, g: curG } = boosted[affectedIndex] || {};
              boosted[affectedIndex] = {
                // build rate
                e: { ...curE, value: Math.ceil((curE?.value || 0) + (e?.value || 0)) },
                f: { ...curF, value: Math.ceil((curF?.value || 0) + (f?.value || 0)) },
                // flaggy rate
                g: { ...curG, value: Math.ceil((curG?.value || 0) + (g?.value || 0)) }
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

export const getAffectedIndexes = (currentCog, x, y) => {
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

export const getTowers = (idleonData) => {
  const towersRaw = idleonData?.TowerInfo || tryToParse(idleonData?.Tower);
  const totemInfo = tryToParse(idleonData?.TotemInfo) || idleonData?.TotemInfo;
  return parseTowers(towersRaw, totemInfo);
}

const parseTowers = (towersRaw, totemInfo) => {
  const maxWaves = totemInfo?.[0];
  const totalWaves = maxWaves?.reduce((sum, maxWave) => sum + maxWave, 0);
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
      slot: inProgress?.findIndex((ind) => ind === towerData?.index)
    }
  });
  return {
    data: towersData,
    buildMultiplier: randomList?.[13].split(' '),
    wizardOverLevels,
    totalLevels,
    totalWaves,
    towersTwo: towersRaw?.[2]
  }
}

export const getBuildCost = (towers, level, bonusInc, index) => {
  if (index === 0) {
    const math1 = Math.pow(level + 1, 2);
    return 20 * math1 * Math.pow(1.6, level + 1);
  } else {
    const multiplier = Number(towers?.buildMultiplier?.[index]);
    return multiplier * Math.pow(bonusInc, level);
  }
}

// this._GenINFO[112].push(250)
export const constructionMasteryThresholds = [250, 500, 750, 1000, 1250, 1500, 2500];

export const applyMaxLevelToTowers = (accountData) => {
  const atom = accountData?.atoms?.atoms?.find(({ name }) => name === 'Carbon_-_Wizard_Maximizer');
  return accountData?.towers?.data?.map((tower) => {
    const extraLevels = getExtraMaxLevels(accountData, tower?.maxLevel, atom?.level);
    return {
      ...tower,
      maxLevel: tower?.maxLevel + extraLevels
    }
  });
}

const getConstructionMasteryBonus = (totalConstruct, index) => {
  // "ExtraMaxLvAtom"
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

export const getExtraMaxLevels = (account, maxLevel, atomBonus, index) => {
  const totalConstruct = account?.towers?.totalLevels;
  return 50 === maxLevel ? Math.round(2 * atomBonus
    + (getConstructionMasteryBonus(totalConstruct, 6, 0)
      + 100 * getGambitBonus(account, 9)))
    : 101 === maxLevel ? getConstructionMasteryBonus(totalConstruct, 4, 0)
      : 100 === maxLevel
        ? (18 <= index && account?.coralReef?.unlockedCorals > index - 18
          ? getConstructionMasteryBonus(totalConstruct, 5, 0) + 100
          : getConstructionMasteryBonus(totalConstruct, 5, 0))
        : 15 === maxLevel ? getConstructionMasteryBonus(totalConstruct, 3, 0) : 0;
}

export const getGildedBoostioBonus = (account) => {
  const atomBonus = getAtomBonus(account, 'Nitrogen_-_Construction_Trimmer');
  const legendTalentBonus = getLegendTalentBonus(account, 33);
  return (3 + atomBonus / 100) * (1 + legendTalentBonus / 100);
}