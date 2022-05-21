import { tryToParse } from "../utility/helpers";
import { cogKeyMap, flagsReqs, randomList, towers } from "../data/website-data";
import { createCogstructionData } from "./cogstrution";

export const getConstruction = (idleonData) => {
  const cogMapRaw = idleonData?.CogMap || tryToParse(idleonData?.CogM);
  const cogOrderRaw = idleonData?.CogOrder || tryToParse(idleonData?.CogO);
  const cogMap = createCogMap(cogMapRaw, cogOrderRaw?.length);
  const cogsMap = parseConstruction(cogMap);
  const board = getFlags(idleonData, cogsMap, cogOrderRaw);
  const cogstruction = createCogstructionData(cogsMap, cogOrderRaw);
  return {
    board,
    cogstruction
  };
}

export const getFlags = (idleonData, cogsMap, cogOrderRaw) => {
  const flagsUnlockedRaw = idleonData?.FlagUnlock || tryToParse(idleonData?.FlagU);
  const flagsPlacedRaw = idleonData?.FlagsPlaced || tryToParse(idleonData?.FlagP);
  return parseFlags(flagsUnlockedRaw, flagsPlacedRaw, cogsMap, cogOrderRaw);
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

const parseFlags = (flagsUnlockedRaw, flagsPlacedRaw, cogsMap, cogsOrder) => {
  return flagsUnlockedRaw?.reduce((res, flagSlot, index) => {
    return [...res, {
      currentAmount: flagSlot === -11 ? flagsReqs?.[index] : parseFloat(flagSlot),
      requiredAmount: flagsReqs?.[index],
      flagPlaced: flagsPlacedRaw?.includes(index),
      cog: {
        name: cogsOrder?.[index],
        stats: cogsMap?.[index]
      }
    }];
  }, []);
}

export const getTowers = (idleonData) => {
  const towersRaw = idleonData?.TowerInfo || tryToParse(idleonData?.Tower);
  return parseTowers(towersRaw);
}

const parseTowers = (towersRaw) => {
  const towersLength = Object.keys(towers).length;
  const inProgress = towersRaw.slice(54, 62);
  const towersData = Object.entries(towers)?.map(([towerName, towerData]) => {
    const level = towersRaw?.[towerData?.index];
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
    buildMultiplier: randomList?.[13].split(" ")
  }
}