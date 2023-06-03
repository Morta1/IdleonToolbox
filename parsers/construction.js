import { tryToParse } from "../utility/helpers";
import { cogKeyMap, flagsReqs, randomList, towers } from "../data/website-data";
import { createCogstructionData } from "./cogstrution";

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

const BOARD_Y = 8;
const BOARD_X = 12;

const parseFlags = (flagsUnlockedRaw, flagsPlacedRaw, cogsMap, cogsOrder, account) => {
  const board = flagsUnlockedRaw?.reduce((res, flagSlot, index) => {
    const name = cogsOrder?.[index];
    const stats = cogsMap?.[index];
    return [...res, {
      currentAmount: flagSlot === -11 ? flagsReqs?.[index] : parseFloat(flagSlot),
      requiredAmount: flagsReqs?.[index],
      flagPlaced: flagsPlacedRaw?.includes(index),
      cog: {
        name,
        stats
      }
    }];
  }, []);
  const playersBuildRate = cogsMap?.map((cog, index) => ({
    ...cog,
    name: cogsOrder?.[index]
  })).filter(({ name }) => name?.includes('Player_'))
    .reduce((sum, { a }) => sum + (a?.value || 0), 0);

  let boosted = new Array(BOARD_X * BOARD_Y).fill(0);
  for (let y = 0; y < BOARD_Y; y++) {
    for (let x = 0; x < BOARD_X; x++) {
      const index = (7 - y) * 12 + x;
      const currentCog = board?.[index]?.cog?.stats;
      let affected = getAffectedIndexes(currentCog?.h, x, y);
      if (affected?.length > 0) {
        affected = affected?.map(([x, y]) => (7 - y) * 12 + x);
        const { e, f, g } = currentCog || {};
        if (e || f || g) {
          affected?.forEach((affectedIndex) => {
            const { e, f, g } = board?.[index]?.cog?.stats || {};
            if (boosted?.[affectedIndex] === 0) {
              boosted[affectedIndex] = { e, f, g }
            } else {
              const { e: curE, f: curF, g: curG } = boosted[affectedIndex] || {};
              boosted[affectedIndex] = {
                e: { ...curE, value: (curE?.value || 0) + (e?.value || 0) },
                f: { ...curF, value: (curF?.value || 0) + (f?.value || 0) },
                g: { ...curG, value: (curG?.value || 0) + (g?.value || 0) },
              }
            }
          })
        }
      }
    }
  }

  let totalBuildRate = 0, totalExpRate = 0, totalFlaggyRate = 0;
  const gemShop = account?.gemShopPurchases?.find((value, index) => index === 118) ?? 0;
  const flaggyMulti = (1 + 50 * gemShop / 100)
  const updatedBoard = board?.map((slot, index) => {
    const { cog } = slot || {};
    const { e, f, g } = boosted?.[index] || {};
    const buildRate = e?.value > 0 && cog?.stats?.a?.value > 0 ? cog?.stats?.a?.value + (cog?.stats?.a?.value * e?.value / 100) : (cog?.stats?.a?.value || 0);
    totalBuildRate += buildRate;
    // const expRate = f?.value > 0 && cog?.stats?.b?.value > 0 ? cog?.stats?.b?.value + (cog?.stats?.b?.value * f?.value / 100) : (cog?.stats?.b?.value || 0);
    totalExpRate += cog?.stats?.d?.value > 0 ? cog?.stats?.d?.value : 0;
    const flaggyRate = g?.value > 0 && cog?.stats?.c?.value > 0 ? cog?.stats?.c?.value + (cog?.stats?.c?.value * g?.value / 100) : (cog?.stats?.c?.value || 0);
    totalFlaggyRate += flaggyRate;

    return {
      ...slot,
      cog: {
        ...cog,
        stats: {
          ...cog?.stats,
          a: { ...cog?.stats?.a, value: buildRate },
          c: { ...cog?.stats?.c, value: flaggyRate }
        }
      }
    }
  });
  return {
    board: updatedBoard,
    totalBuildRate,
    totalExpRate,
    totalFlaggyRate: totalFlaggyRate * flaggyMulti,
    playersBuildRate
  };
}

const getAffectedIndexes = (type, x, y) => {
  const boosted = [];
  switch (type) {
    case "diagonal":
      boosted.push([x - 1, y - 1], [x + 1, y - 1], [x - 1, y + 1], [x + 1, y + 1]);
      break;
    case "adjacent":
      boosted.push([x - 1, y], [x, y + 1], [x + 1, y], [x, y - 1]);
      break;
    case "up":
      boosted.push([x - 1, y + 2], [x, y + 2], [x + 1, y + 2], [x - 1, y + 1], [x, y + 1], [x + 1, y + 1]);
      break;
    case "right":
      boosted.push([x + 2, y - 1], [x + 2, y], [x + 2, y + 1], [x + 1, y - 1], [x + 1, y], [x + 1, y + 1]);
      break;
    case "down":
      boosted.push([x - 1, y - 2], [x, y - 2], [x + 1, y - 2], [x - 1, y - 1], [x, y - 1], [x + 1, y - 1]);
      break;
    case "left":
      boosted.push([x - 2, y - 1], [x - 2, y], [x - 2, y + 1], [x - 1, y - 1], [x - 1, y], [x - 1, y + 1]);
      break;
    case "row":
      for (let k = 0; k < BOARD_X; k++) {
        if (x === k) continue;
        boosted.push([k, y]);
      }
      break;
    case "column":
      for (let k = 0; k < BOARD_Y; k++) {
        if (y === k) continue;
        boosted.push([x, k]);
      }
      break;
    case "corners":
      boosted.push([x - 2, y - 2,], [x + 2, y - 2,], [x - 2, y + 2,], [x + 2, y + 2,]);
      break;
    case "around":
      boosted.push([x, y - 2], [x - 1, y - 1], [x, y - 1], [x + 1, y - 1], [x - 2, y], [x - 1, y], [x + 1, y],
        [x + 2, y], [x - 1, y + 1], [x, y + 1,], [x + 1, y + 1], [x, y + 2]);
      break;
    case "everything":
      for (let l = 0; l < BOARD_Y; l++) {
        for (let k = 0; k < BOARD_X; k++) {
          if (y === l && x === k) continue;
          boosted.push([k, l]);
        }
      }
      break;
    default:
      break;
  }
  return boosted;
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
  const inProgress = towersRaw.slice(54, 62);
  let wizardOverLevels = 0, wizardAboveFifty = 0;
  let totalLevels = 0;
  const towersData = Object.entries(towers)?.map(([towerName, towerData]) => {
    const level = towersRaw?.[towerData?.index];
    if (towerData?.index >= 9 && towerData?.index <= 17) {
      if (level > 50) {
        wizardOverLevels += level - 50;
        wizardAboveFifty += 1;
      }
    }
    totalLevels += level;
    return {
      ...towerData,
      name: towerName,
      level,
      nextLevel: (level + 1) === towersRaw[towerData.index + towersLength],
      progress: towersRaw?.[towerData?.index + 12 + towersLength * 2],
      inProgress: inProgress?.includes(towerData?.index)
    }
  });
  return {
    data: towersData,
    buildMultiplier: randomList?.[13].split(" "),
    wizardOverLevels,
    wizardAboveFifty,
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

export const constructionMasteryThresholds = [250, 500, 750, 1000, 1250, 1500, 2500];