import { isGodEnabledBySorcerer } from '@parsers/world-4/lab';
import { isCompanionBonusActive } from '@parsers/misc';
import { getActiveBubbleBonus } from '@parsers/world-2/alchemy';
import { isJadeBonusUnlocked } from '@parsers/world-6/sneaking';
import { getCoralKidUpgBonus } from '@parsers/world-7/coralReef';
import { getMineheadBonusQTY } from '@parsers/world-7/minehead';
import { getUpgradeVaultBonus } from '@parsers/misc/upgradeVault';
import { gods } from '@website-data';
import { tryToParse } from '@utility/helpers';

export const getDivinity = (idleonData: any, serializedCharactersData: any, accountData: any) => {
  const divinityRaw = tryToParse(idleonData?.Divinity) || idleonData?.Divinity;
  if (!divinityRaw) return null;
  return parseDivinity(divinityRaw, serializedCharactersData, accountData);
}

const parseDivinity = (divinityRaw: any, serializedCharactersData: any, accountData: any) => {
  const numberOfChars = serializedCharactersData?.length;
  const deitiesStartIndex = 12;
  const linkedDeities = divinityRaw?.slice(deitiesStartIndex, deitiesStartIndex + numberOfChars);
  const blessingLevelsStartIndex = 28;
  const blessingLevels = divinityRaw?.slice(blessingLevelsStartIndex, blessingLevelsStartIndex + gods?.length + 1);
  const linkedStyles = divinityRaw?.slice(0, serializedCharactersData?.length + 1);
  const unlockedDeities = divinityRaw?.[25];
  const godRank = unlockedDeities - 10;
  const coralKidBonus = getCoralKidUpgBonus(accountData, 1);
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
        unlocked: index < unlockedDeities,
        maxLevel: Math.round(100 + (coralKidBonus + (getMineheadBonusQTY(accountData, 9) + getUpgradeVaultBonus(accountData?.upgradeVault?.upgrades, 76))))
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

export const getDivStylePerHour = (index: any) => {
  return 0 === index ? 1 : 1 === index ? 2 : 2 === index || 3 === index
    ? 1 : 4 === index ? 7 : 5 === index ? 3 : 6 === index
      ? 8 : 7 === index && 10
}

export const applyGodCost = (accountData: any) => {
  return accountData?.divinity?.deities?.map((god: any, index: any) => ({
    ...god,
    cost: getGodCost(god, index, accountData)
  }))
}

const getCostToMax = (level: any, x4: any, x5: any, maxLevel = 100) => {
  let total = 0;
  for (let i = level; i < maxLevel; i++) {
    total += (x4 * Math.pow(x5, i));
  }
  return total;
}

const getGodCost = ({ name, level, x4, x5 }: any = {}, index: any, account: any) => {
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
      const particles = account?.atoms?.particles;
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

export const getGodBlessingBonus = (gods: any, godName: any) => {
  return gods?.find(({ name }: any) => name === godName)?.blessingBonus ?? 0;
}

export const getGodByIndex = (linkedDeities: any, characters: any, gIndex: any) => {
  const char = characters?.find((_: any, index: any) => linkedDeities?.[index] === gIndex)
  return char?.deityMinorBonus;
}

export const getDeityLinkedIndex = (account: any, characters: any, deityIndex: any) => {
  const coralKidLinked = account?.accountOptions?.[425] > 0 && account?.accountOptions?.[425] === deityIndex;
  const pocketLinked = account?.hole?.godsLinks?.find(({ index }: any) => index === deityIndex);
  const normalLink = account?.divinity?.linkedDeities?.map((deity: any, index: any) => deityIndex === deity || (isCompanionBonusActive(account, 0) && account?.finishedWorlds?.World4)
    ? index
    : -1);
  const esLink = characters.map((character: any, index: any) => isGodEnabledBySorcerer(character, deityIndex) || (isCompanionBonusActive(account, 0) && account?.finishedWorlds?.World4)
    ? index
    : -1);
  // Check if pocketLinked exists and add it to the result
  return normalLink?.map((charIndex: any, index: any) => {
    // First check for pocket link or coral kid link
    if (pocketLinked || coralKidLinked) {
      return index;
    }
    // Then check for normal and ES links as before
    return charIndex === -1 && esLink?.[index] !== -1
      ? esLink?.[index]
      : charIndex;
  }).filter((index: any) => index !== -1) || [];
}

export const getMinorDivinityBonus = (character: any, account: any, forcedDivinityIndex?: any, characters?: any) => {
  const bigPCharacter = characters?.find((char: any) => char.equippedBubbles?.find(({ bubbleName }: any) => bubbleName === 'BIG_P'));
  const bigPBubble = getActiveBubbleBonus((bigPCharacter || character || characters?.[0])?.equippedBubbles, 'BIG_P', account);
  const divinityLevel = (character || bigPCharacter || characters?.[0])?.skillsInfo?.divinity?.level;
  const linkedDeity = forcedDivinityIndex ?? account?.divinity?.linkedDeities?.[character.playerId];
  const godIndex = (gods as any)?.[linkedDeity]?.godIndex;
  const multiplier = gods?.[godIndex]?.minorBonusMultiplier;
  const coralKidUpgBonus = getCoralKidUpgBonus(account, 3);
  return Math.max(1, bigPBubble) * (1 + coralKidUpgBonus / 100) * (divinityLevel / (60 + divinityLevel)) * multiplier;
}