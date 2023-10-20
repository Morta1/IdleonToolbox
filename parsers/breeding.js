import { arenaBonuses, petStats, petUpgrades } from '../data/website-data';
import { tryToParse } from '../utility/helpers';

export const getBreeding = (idleonData, account) => {
  const breedingRaw = tryToParse(idleonData?.Breeding) || idleonData?.Breeding;
  const petsRaw = tryToParse(idleonData?.Pets) || idleonData?.Pets;
  const petsStoredRaw = tryToParse(idleonData?.PetsStored) || idleonData?.PetsStored;
  return parseBreeding(breedingRaw, petsRaw, petsStoredRaw, account);
}

const parseBreeding = (breedingRaw, petsRaw, petsStoredRaw, account) => {
  const eggs = breedingRaw?.[0];
  const deadCells = breedingRaw?.[3]?.[8];
  const speciesUnlocks = breedingRaw?.[1];
  const petUpgradesList = breedingRaw?.[2]?.map((upgradeLevel, index) => {
    return {
      ...(petUpgrades[index] || []),
      level: upgradeLevel
    }
  })
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
    pets
  };
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