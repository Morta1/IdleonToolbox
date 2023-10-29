import { arenaBonuses, petStats, petUpgrades, randomList } from '../data/website-data';
import { tryToParse } from '../utility/helpers';
import { getBubbleBonus, getVialsBonusByEffect } from './alchemy';
import { getStampsBonusByEffect } from './stamps';
import { getJewelBonus, getLabBonus } from './lab';
import { getMealsBonusByEffectOrStat, getTotalKitchenLevels } from './cooking';
import { getAchievementStatus } from './achievements';

export const getBreeding = (idleonData, account) => {
  const breedingRaw = tryToParse(idleonData?.Breeding) || idleonData?.Breeding;
  const petsRaw = tryToParse(idleonData?.Pets) || idleonData?.Pets;
  const petsStoredRaw = tryToParse(idleonData?.PetsStored) || idleonData?.PetsStored;
  const cookingRaw = tryToParse(idleonData?.Cooking) || idleonData?.Cooking;
  return parseBreeding(breedingRaw, petsRaw, petsStoredRaw, cookingRaw, account);
}

const parseBreeding = (breedingRaw, petsRaw, petsStoredRaw, cookingRaw, account) => {
  const eggs = breedingRaw?.[0];
  const deadCells = breedingRaw?.[3]?.[8];
  const speciesUnlocks = breedingRaw?.[1];
  const petUpgradesList = breedingRaw?.[2]?.map((upgradeLevel, index) => {
    return {
      ...(petUpgrades[index] || []),
      level: upgradeLevel
    }
  })
  const unlockedBreedingMulti = {
    second: petUpgradesList?.[2]?.level > 0,
    third: petUpgradesList?.[4]?.level > 0,
    fourth: petUpgradesList?.[6]?.level > 0,
    fifth: petUpgradesList?.[9]?.level > 0
  }
  const storedPets = petsStoredRaw?.map(([name, level, power]) => {
    return { name, level, power }
  });
  const petsLevels = breedingRaw?.slice(4, 8);
  const shinyPetsLevels = breedingRaw?.slice(22, 26);
  const baseFenceSlots = breedingRaw?.[2]?.[4];
  const fenceSlots = Math.round(5 + baseFenceSlots + 2 * (account?.gemShopPurchases?.find((value, index) => index === 125) ?? 0));
  const rawFencePets = petsRaw?.slice(0, fenceSlots)
  const fencePetsObject = rawFencePets?.reduce((res, [petName, , , color]) => {
    if (color === 0) return res;
    return {
      ...res,
      [petName]: res?.[petName] ? res?.[petName] + 1 : 1
    }
  }, {});
  const totalKitchenLevels = cookingRaw?.reduce((res, kitchen) => {
    const [, , , , , , speedLv, fireLv, luckLv] = kitchen;
    return res + (speedLv + fireLv + luckLv);
  }, 0);
  const fencePets = [], passivesTotals = {};
  const pets = petStats?.map((petList, worldIndex) => {
    const speciesUnlocked = speciesUnlocks?.[worldIndex];
    return petList?.map((pet, petIndex) => {
      let shinyLevel = new Array(19).fill(1)?.reduce((sum, _, index) => shinyPetsLevels?.[worldIndex]?.[petIndex] > Math.floor((1 + Math.pow(index + 1, 1.6)) * Math.pow(1.7, index + 1))
        ? index + 2
        : sum, 0)
      shinyLevel = shinyPetsLevels?.[worldIndex]?.[petIndex] === 0 ? 0 : shinyLevel === 0 ? 1 : shinyLevel;
      const goal = Math.floor((1 + Math.pow(shinyLevel, 1.6)) * Math.pow(1.7, shinyLevel));
      const passiveValue = Math.round(pet?.baseValue * shinyLevel);
      const petInfo = {
        ...pet,
        level: petsLevels?.[worldIndex]?.[petIndex],
        shinyLevel,
        progress: shinyPetsLevels?.[worldIndex]?.[petIndex],
        goal,
        rawPassive: pet?.passive,
        passive: pet?.passive?.replace('{', passiveValue),
        passiveValue,
        unlocked: petIndex < speciesUnlocked
      }
      if (passivesTotals?.[pet?.passive]) {
        passivesTotals[pet?.passive] += passiveValue;
      } else if (passiveValue > 0) {
        passivesTotals[pet?.passive] = passiveValue;
      }
      if (fencePetsObject?.[pet?.monsterRawName]) {
        fencePets.push(petInfo);
      }
      return petInfo;
    })
  });

  return {
    passivesTotals,
    storedPets,
    eggs,
    deadCells,
    speciesUnlocks,
    fencePets,
    fencePetsObject,
    maxArenaLevel: account?.accountOptions?.[89],
    timeToNextEgg: account?.accountOptions?.[87] * 1000,
    petUpgrades: petUpgradesList,
    arenaBonuses,
    unlockedBreedingMulti,
    pets
  };
}

export const addBreedingChance = (idleonData, account) => {
  const breedingRaw = tryToParse(idleonData?.Breeding) || idleonData?.Breeding;
  const pets = account?.breeding?.pets?.map((petList, worldIndex) => {
    return petList?.map((pet, petIndex) => {
      const totalKitchenLevels = getTotalKitchenLevels(account?.cooking?.kitchens)
      const breedingMultipliers = getBreedingMulti(account, breedingRaw, worldIndex, petIndex, account?.breeding?.unlockedBreedingMulti, totalKitchenLevels);
      return {
        ...pet,
        breedingMultipliers
      }
    })
  })
  return {
    ...account?.breeding,
    pets
  }
}
const getBaseBreedChance = (breedingRaw, worldIndex, petIndex) => {
  const baseChances = randomList[54].split(' ');
  return petIndex + 2 > breedingRaw[1][worldIndex]
    ? 1 / Math.max(1, baseChances[petStats[worldIndex][petIndex].passiveIndex])
    : 1
}

const getBreedingMulti = (account, breedingRaw, worldIndex, petIndex, unlockedBreedingMulti, totalKitchenLevels) => {
  const first = 1 + Math.ceil(100 * Math.pow(breedingRaw[(4 + worldIndex) | 0][petIndex] / 10, 1.9)) / 100;
  const second = (unlockedBreedingMulti?.second
    ? 1 + Math.log(Math.max(1, Math.pow(breedingRaw[(worldIndex + 13) | 0][petIndex] + 1, 0.725)))
    : 1)
  const third = (unlockedBreedingMulti?.third
    ? 1 + (0.25 * Math.pow(breedingRaw[0][0], 1.4) + Math.pow(breedingRaw[0][0] / 3, 6))
    : 1);
  const fourth = (unlockedBreedingMulti?.fourth
    ? (0 === worldIndex
      ? 1
      : 1 + 0.1 * worldIndex
      + Math.max(1, Math.min(3, 1 + 0.15 * (breedingRaw[2][7])))
      * Math.pow((breedingRaw[1][(worldIndex - 1) | 0])
        / (petStats[worldIndex - 1].length -
          petStats[worldIndex - 1].length / 2), 3))
    : 1)
  const fifth = (unlockedBreedingMulti?.fifth
    ? Math.max(1, Math.pow(account?.accountOptions?.[86] + 1, 0.3))
    : 1);

  const baseBreedingChance = getBaseBreedChance(breedingRaw, worldIndex, petIndex);
  const gemShopBonus = account?.gemShopPurchases?.find((value, index) => index === 119) ?? 0;
  const vialBonus = getVialsBonusByEffect(account?.alchemy?.vials, null, 'NewPet');
  const bubbleBonus = getBubbleBonus(account?.alchemy?.bubbles, 'kazam', 'PETTING_THE_RIFT', false);
  const stampBonus = getStampsBonusByEffect(account?.stamps, 'New_Pet_Chance');
  const spelunkerObolMulti = getLabBonus(account?.lab?.labBonuses, 8); // gem multi
  const blackDiamondRhinestone = getJewelBonus(account?.lab?.jewels, 16, spelunkerObolMulti);
  const mealBonus = getMealsBonusByEffectOrStat(account, null, 'Npet', blackDiamondRhinestone);
  const breedingBonus = calcUpgradeBonus(account?.breeding?.petUpgrades?.[9], 9, account);
  const totalChance = (1 + (10 * gemShopBonus) / 100)
    * (1 + (vialBonus
      + bubbleBonus
      * account?.rift?.currentRift) / 100)
    * (1 + stampBonus / 100)
    * (1 + mealBonus / 100) * Math.pow(Math.max(1, breedingBonus),
      totalKitchenLevels / 100)
    * baseBreedingChance
    * first
    * second
    * third
    * fourth
    * fifth;

  return {
    first,
    second,
    third,
    fourth,
    fifth,
    totalChance
  }
}

export const getShinyBonus = (pets, passiveName) => {
  return pets?.reduce((sum, world) => sum + world?.reduce((innerSum, {
    passive,
    passiveValue
  }) => innerSum + (passive.includes(passiveName) && passiveValue), 0), 0);
}

export const getTimeToLevel = (pet, shinyMulti, copies, shinyLevel) => {
  if (pet?.shinyLevel === shinyLevel) return 0;
  let goal = 0;
  for (let i = pet?.shinyLevel; i < shinyLevel; i++) {
    goal += Math.floor((1 + Math.pow(i, 1.6)) * Math.pow(1.7, i));
  }
  return ((goal - pet?.progress) / shinyMulti / (copies || 1)) * 8.64e+7;
}

export const calcUpgradeBonus = (upgrade, upgradeIndex, account) => {
  if (0 === upgradeIndex || 2 === upgradeIndex || 4 === upgradeIndex) {
    return upgrade?.level;
  }
  if (1 === upgradeIndex) {
    return 4 * upgrade?.level;
  }
  if (3 === upgradeIndex) {
    return 25 * upgrade?.level;
  }
  if (5 === upgradeIndex) {
    return (1 + 0.25 * upgrade?.level) * Math.min(2, Math.max(1, 1 + 0.1 * getAchievementStatus(account?.achievements, 221)));
  }
  if (6 === upgradeIndex) {
    return 6 * upgrade?.level;
  }
  if (7 === upgradeIndex) {
    return 1 + 0.15 * upgrade?.level;
  }
  if (8 === upgradeIndex) {
    return 1 + 2 * upgrade?.level;
  }
  if (9 === upgradeIndex) {
    return 1 + 0.02 * upgrade?.level;
  }
  if (10 === upgradeIndex) {
    return 10 * upgrade?.level;
  }
  if (11 === upgradeIndex) {
    return Math.ceil(12 * Math.pow(upgrade?.level, 0.698));
  }
  return 0;
}