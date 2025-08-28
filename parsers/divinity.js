import { isGodEnabledBySorcerer } from './lab';
import { isCompanionBonusActive } from './misc';
import { getActiveBubbleBonus } from './alchemy';
import { isJadeBonusUnlocked } from '@parsers/world-6/sneaking';

const { tryToParse } = require('../utility/helpers');
const { gods } = require('../data/website-data');

export const getDivinity = (idleonData, serializedCharactersData, accountData) => {
  const divinityRaw = tryToParse(idleonData?.Divinity) || idleonData?.Divinity;
  if (!divinityRaw) return null;
  return parseDivinity(divinityRaw, serializedCharactersData, accountData);
}

const parseDivinity = (divinityRaw, serializedCharactersData, accountData) => {
  const numberOfChars = serializedCharactersData?.length;
  const deitiesStartIndex = 12;
  const linkedDeities = divinityRaw?.slice(deitiesStartIndex, deitiesStartIndex + numberOfChars);
  const blessingLevelsStartIndex = 28;
  const blessingLevels = divinityRaw?.slice(blessingLevelsStartIndex, blessingLevelsStartIndex + gods?.length + 1);
  const linkedStyles = divinityRaw?.slice(0, serializedCharactersData?.length + 1);
  const unlockedDeities = divinityRaw?.[25];
  const godRank = unlockedDeities - 10;
  const deities = gods?.map((god, index) => {
      const level = blessingLevels?.[index];
      let emporiumBonus = 1;
      if (isJadeBonusUnlocked(accountData, 'True_Godly_Blessings')) {
        emporiumBonus = (1 + 0.05 * Math.max(0, godRank));
      }
      let blessingBonus = level * god?.blessingMultiplier * emporiumBonus;
      if (index === 2) {
        blessingBonus = Math.min(blessingBonus, 500);
      }
      return {
        ...god,
        rawName: `DivGod${index}`,
        level,
        blessingBonus,
        unlocked: index < unlockedDeities
      }
    }
  );

  return {
    linkedDeities,
    linkedStyles,
    deities,
    blessingLevels,
    unlockedDeities,
    godRank: godRank < 0 ? 0 : godRank
  }
}

export const getDivStylePerHour = (index) => {
  return 0 === index ? 1 : 1 === index ? 2 : 2 === index || 3 === index
    ? 1 : 4 === index ? 7 : 5 === index ? 3 : 6 === index
      ? 8 : 7 === index && 10
}

export const applyGodCost = (accountData) => {
  return accountData?.divinity?.deities?.map((god, index) => ({
    ...god,
    cost: getGodCost(god, index, accountData)
  }))
}

const getCostToMax = (level, x4, x5, maxLevel = 100) => {
  let total = 0;
  for (let i = level; i < maxLevel; i++) {
    total += (x4 * Math.pow(x5, i));
  }
  return total;
}

const getGodCost = ({ name, level, x4, x5 } = {}, index, account) => {
  if (level < 100) {
    const cost = x4 * Math.pow(x5, level);
    const nextLevelCost = x4 * Math.pow(x5, level + 1);
    const costToMax = getCostToMax(level, x4, x5);
    if (0 === index || 8 === index || 4 === index || 2 === index) {
      const atoms = account?.gaming?.bits;
      return {
        type: 'bits',
        cost,
        nextLevelCost,
        costToMax,
        currency: atoms
      }
    } else if (1 === index) {
      const sailingGold = account?.sailing?.lootPile?.[0];
      return {
        type: 'sailingGold',
        cost,
        nextLevelCost,
        costToMax,
        currency: sailingGold
      }
    } else if (3 === index || 6 === index) {
      const money = account?.currencies?.rawMoney;
      return {
        type: 'coins',
        cost,
        nextLevelCost,
        costToMax,
        currency: money
      }
    } else {
      const particles = account?.atomCollider?.particles;
      return {
        type: 'particles',
        cost,
        nextLevelCost,
        costToMax,
        currency: particles
      }
    }
  }
  return {
    cost: 'MAX'
  }
}

export const getGodBlessingBonus = (gods, godName) => {
  return gods?.find(({ name }) => name === godName)?.blessingBonus ?? 0;
}

export const getGodByIndex = (linkedDeities, characters, gIndex) => {
  const char = characters?.find((_, index) => linkedDeities?.[index] === gIndex)
  return char?.deityMinorBonus;
}

export const getDeityLinkedIndex = (account, characters, deityIndex) => {
  const pocketLinked = account?.hole?.godsLinks?.find(({ index }) => index === deityIndex);
  const normalLink = account?.divinity?.linkedDeities?.map((deity, index) => deityIndex === deity || (isCompanionBonusActive(account, 0) && account?.finishedWorlds?.World4)
    ? index
    : -1);
  const esLink = characters.map((character, index) => isGodEnabledBySorcerer(character, deityIndex) || (isCompanionBonusActive(account, 0) && account?.finishedWorlds?.World4)
    ? index
    : -1);
  // Check if pocketLinked exists and add it to the result
  return normalLink?.map((charIndex, index) => {
    // First check for pocket link
    if (pocketLinked) {
      return index;
    }
    // Then check for normal and ES links as before
    return charIndex === -1 && esLink?.[index] !== -1
      ? esLink?.[index]
      : charIndex;
  }).filter(index => index !== -1) || [];
}

export const getMinorDivinityBonus = (character, account, forcedDivinityIndex, characters) => {
  const bigPCharacter = characters?.find((char) => char.equippedBubbles?.find(({ bubbleName }) => bubbleName === 'BIG_P'));
  const bigPBubble = getActiveBubbleBonus((bigPCharacter || character || characters?.[0])?.equippedBubbles, 'BIG_P', account);
  const divinityLevel = (character || bigPCharacter || characters?.[0])?.skillsInfo?.divinity?.level;
  const linkedDeity = forcedDivinityIndex ?? account?.divinity?.linkedDeities?.[character.playerId];
  const godIndex = gods?.[linkedDeity]?.godIndex;
  const multiplier = gods?.[godIndex]?.minorBonusMultiplier;
  return Math.max(1, bigPBubble) * (divinityLevel / (60 + divinityLevel)) * multiplier;
}