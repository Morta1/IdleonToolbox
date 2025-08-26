import { arenaBonuses, monsters, petGenes, petStats, petUpgrades, randomList, territory } from '../data/website-data';
import { createRange, tryToParse } from '../utility/helpers';
import { getBubbleBonus, getVialsBonusByEffect } from './alchemy';
import { getStampsBonusByEffect } from './stamps';
import { getJewelBonus, getLabBonus } from './lab';
import { getMealsBonusByEffectOrStat, getTotalKitchenLevels } from './cooking';
import { getAchievementStatus } from './achievements';
import { getStarSignBonus } from '@parsers/starSigns';
import { getWinnerBonus } from '@parsers/world-6/summoning';
import { getLampBonus } from '@parsers/world-5/caverns/the-lamp';
import { getUpgradeVaultBonus } from '@parsers/misc/upgradeVault';
import { getCharacterByHighestSkillLevel } from '@parsers/misc';
import { CLASSES, getTalentBonus } from '@parsers/talents';
import { getArcadeBonus } from '@parsers/arcade';

export const getBreeding = (idleonData, account, processedData) => {
  const breedingRaw = tryToParse(idleonData?.Breeding) || idleonData?.Breeding;
  const petsRaw = tryToParse(idleonData?.Pets) || idleonData?.Pets;
  const petsStoredRaw = tryToParse(idleonData?.PetsStored) || idleonData?.PetsStored;
  const territoryRaw = tryToParse(idleonData?.Territory) || idleonData?.Territory;
  const cookingRaw = tryToParse(idleonData?.Cooking) || idleonData?.Cooking;
  return parseBreeding(breedingRaw, territoryRaw, petsRaw, petsStoredRaw, cookingRaw, account, processedData);
}

const parseBreeding = (breedingRaw, territoryRaw, petsRaw, petsStoredRaw, cookingRaw, account, processedData) => {
  const eggs = breedingRaw?.[0];
  const genetics = breedingRaw?.[3]?.slice(0, 4)
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
  const breedingPetsLevels = breedingRaw?.slice(13, 17);
  const baseFenceSlots = breedingRaw?.[2]?.[4];
  const fenceSlots = Math.round(5 + baseFenceSlots + 2 * (account?.gemShopPurchases?.find((value, index) => index === 125) ?? 0));
  const rawFencePets = petsRaw?.slice(0, fenceSlots);
  const fencePetsObject = rawFencePets?.reduce((res, [petName, type]) => {
    if (!res[petName]) {
      res[petName] = {
        amount: 0,
        shiny: 0,
        breedability: 0
      };
    }

    res[petName].amount += 1;
    if (type === 4) res[petName].breedability += 1;
    if (type === 5) res[petName].shiny += 1;

    return res;
  }, {});

  const foragingRounds = territoryRaw?.map(([, round]) => round);
  const currentProgress = territoryRaw?.map(([progress]) => progress);
  const teams = petsRaw?.slice(27)?.map(([name, x1, x2, x3]) => {
    const gene = petGenes?.[x1];
    const realName = monsters?.[name]?.Name;
    return { name, realName, x1, power: x2, x3, gene };
  })?.toChunks(4);
  const terri = territory.filter((_, index) => index !== 14);
  const territories = terri?.map((territory, index) => {
    const team = teams?.[index] || [];
    const previousTeam = teams?.[index - 1] || [];
    const nextTeam = teams?.[index + 1] || [];
    const vaultBonus = 1 + getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 56) / 100;
    const forageSpeed = team?.reduce((sum, teamMember, position) => sum + getForageSpeed({
      team,
      previousTeam,
      teamMember,
      position
    }), 0) * vaultBonus;
    const teamPower = team?.reduce((sum, teamMember) => sum + getFightPower(teamMember), 0);
    const anyCombats = team?.some((teamMember) => teamMember?.gene?.abilityType === 0);
    const flashies = anyCombats ? 0 : team?.filter((teamMember) => teamMember?.gene?.name === 'Flashy')?.length;
    const fleeters = team?.filter((teamMember) => teamMember?.gene?.name === 'Fleeter')?.length;
    const fasidiouses = team?.filter((teamMember) => teamMember?.gene?.name === 'Fasidious')?.length;
    let miasmas = team?.filter((teamMember) => teamMember?.gene?.name === 'Miasma');
    if (miasmas.length) {
      const duplicates = team?.map(({ gene }) => gene?.name)?.every((name, index, arr) => arr.indexOf(index) === name);
      miasmas = !duplicates ? 4 : 1;
    } else {
      miasmas = 1;
    }
    const topAndBottomRows = [...team, ...previousTeam, ...nextTeam];
    const badumdums = topAndBottomRows?.filter((teamMember) => teamMember?.gene?.name === 'Badumdum')?.length;
    const tsars = topAndBottomRows?.filter((teamMember) => teamMember?.gene?.name === 'Tsar')?.length;
    const math = forageSpeed * Math.pow(1.3, fleeters) * Math.pow(1.2, badumdums) * Math.pow(1.5, flashies) * Math.pow(1.5, fasidiouses) * miasmas;
    const teamFightPower = (teamPower + forageSpeed * index) * Math.pow(1.5, tsars);
    const totalForageSpeed = teamFightPower < territory.fightPower ? 0 : math;
    const bonus = 1 + .02 / (team.filter((teamMember) => teamMember?.gene?.name === 'Monolithic').length / 5 + 1);
    const powerReq = index > 14 ? terri?.[index - 1]?.powerReq : territory?.powerReq;
    const reqProgress = (powerReq + foragingRounds?.[index]) * Math.pow(bonus, foragingRounds?.[index]);
    return { ...territory, team, forageSpeed: totalForageSpeed, reqProgress, currentProgress: currentProgress?.[index] }
  });

  const fencePets = [], passivesTotals = {};
  let totalShinyLevels = 0;
  const pets = petStats?.map((petList, worldIndex) => {
    const speciesUnlocked = speciesUnlocks?.[worldIndex];
    return petList?.map((pet, petIndex) => {
      const shinyLevel = getShinyLevel(shinyPetsLevels, worldIndex, petIndex);
      // Tome calc
      totalShinyLevels += shinyLevel === 0 ? 1 : shinyLevel;

      const shinyGoal = Math.floor((1 + Math.pow(shinyLevel, 1.6)) * Math.pow(1.7, shinyLevel));
      const passiveValue = Math.round(pet?.baseValue * shinyLevel);
      const petInfo = {
        ...pet,
        world: 'World' + (worldIndex + 1),
        level: petsLevels?.[worldIndex]?.[petIndex],
        shinyLevel,
        shinyProgress: shinyPetsLevels?.[worldIndex]?.[petIndex],
        breedingProgress: breedingPetsLevels?.[worldIndex]?.[petIndex],
        shinyGoal,
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
    eggsPowerRange: getEggsPowerRange(processedData?.charactersData),
    passivesTotals,
    storedPets,
    eggs,
    genetics,
    deadCells,
    speciesUnlocks,
    fencePets,
    fencePetsObject,
    maxArenaLevel: account?.accountOptions?.[89],
    timeToNextEgg: account?.accountOptions?.[87] * 1000,
    petUpgrades: petUpgradesList,
    arenaBonuses,
    unlockedBreedingMulti,
    pets,
    territories,
    foragingRounds,
    currentProgress,
    totalShinyLevels
  };
}

const getShinyLevel = (shinyPetsLevels, worldIndex, petIndex) => {
  const shinyLevel = new Array(19).fill(1)?.reduce((sum, _, index) => shinyPetsLevels?.[worldIndex]?.[petIndex] > Math.floor((1 + Math.pow(index + 1, 1.6)) * Math.pow(1.7, index + 1))
    ? index + 2
    : sum, 0)
  return shinyPetsLevels?.[worldIndex]?.[petIndex] === 0 ? 0 : shinyLevel === 0 ? 1 : shinyLevel;
}

export const addBreedingChance = (idleonData, account) => {
  const breedingRaw = tryToParse(idleonData?.Breeding) || idleonData?.Breeding;
  let totalBreedabilityLv = 0;
  const pets = account?.breeding?.pets?.map((petList, worldIndex) => {
    return petList?.map((pet, petIndex) => {
      const totalKitchenLevels = getTotalKitchenLevels(account?.cooking?.kitchens)
      const breedingMultipliers = getBreedingMulti(account, breedingRaw, worldIndex, petIndex, account?.breeding?.unlockedBreedingMulti, totalKitchenLevels);
      const breedingLevel = Math.min(9, Math.floor(Math.pow(breedingMultipliers?.second - 1, .8)) + 1);
      const breedingGoal = Math.pow(Math.pow(Math.E, Math.pow(breedingLevel, 1.25)), 1 / 0.725) - 1;
      totalBreedabilityLv += breedingLevel;
      return {
        ...pet,
        breedingLevel,
        breedingGoal,
        breedingMultipliers
      }
    })
  })
  return {
    ...account?.breeding,
    pets,
    totalBreedabilityLv
  }
}

const getBaseBreedChance = (breedingRaw, worldIndex, petIndex) => {
  const baseChances = randomList[54].split(' ');
  return petIndex + 2 > breedingRaw?.[1]?.[worldIndex]
    ? 1 / Math.max(1, baseChances[petStats[worldIndex][petIndex].passiveIndex])
    : 1
}

const getBreedingMulti = (account, breedingRaw, worldIndex, petIndex, unlockedBreedingMulti, totalKitchenLevels) => {
  const first = 1 + Math.ceil(100 * Math.pow(breedingRaw?.[(4 + worldIndex) | 0][petIndex] / 10, 1.9)) / 100;
  const second = (unlockedBreedingMulti?.second
    ? 1 + Math.log(Math.max(1, Math.pow(breedingRaw?.[(worldIndex + 13) | 0][petIndex] + 1, 0.725)))
    : 1)
  const third = (unlockedBreedingMulti?.third
    ? 1 + (0.25 * Math.pow(breedingRaw?.[0]?.[0], 1.4) + Math.pow(breedingRaw?.[0]?.[0] / 3, 6))
    : 1);
  const fourth = (unlockedBreedingMulti?.fourth
    ? (0 === worldIndex
      ? 1
      : 1 + 0.1 * worldIndex
      + Math.max(1, Math.min(3, 1 + 0.15 * (breedingRaw?.[2]?.[7])))
      * Math.pow((breedingRaw?.[1]?.[(worldIndex - 1) | 0])
        / (petStats[worldIndex - 1].length -
          petStats[worldIndex - 1].length / 2), 3))
    : 1)
  const fifth = (unlockedBreedingMulti?.fifth
    ? Math.max(1, Math.pow(account?.accountOptions?.[86] + 1, 0.3))
    : 1);

  const baseBreedingChance = getBaseBreedChance(breedingRaw, worldIndex, petIndex);
  const gemShopBonus = account?.gemShopPurchases?.find((value, index) => index === 119) ?? 0;
  const vialBonus = getVialsBonusByEffect(account?.alchemy?.vials, null, 'NewPet');
  const bubbleBonus = getBubbleBonus(account, 'PETTING_THE_RIFT', false);
  const stampBonus = getStampsBonusByEffect(account, 'New_Pet_Chance');
  const mealBonus = getMealsBonusByEffectOrStat(account, null, 'Npet');
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

export const getTimeToLevel = (pet, multi, copies, targetLevel, isShiny) => {
  const currentLevel = isShiny ? pet?.shinyLevel : pet?.breedingLevel;
  const currentProgress = isShiny ? pet?.shinyProgress : pet?.breedingProgress;

  if (currentLevel === targetLevel) return 0;

  let goal = 0;
  for (let i = currentLevel; i < targetLevel; i++) {
    if (isShiny) {
      goal += Math.floor((1 + Math.pow(i, 1.6)) * Math.pow(1.7, i));
    } else {
      goal += Math.pow(Math.pow(Math.E, Math.pow(i, 1.25)), 1 / 0.725) - 1
    }
  }

  return ((goal - currentProgress) / multi / (copies || 1)) * 8.64e+7;
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
  if (12 === upgradeIndex) {
    return 5 * upgrade?.level;
  }
  return 0;
}

export const getForageSpeed = ({ team, previousTeam, teamMember, position }) => {
  if (teamMember?.gene?.abilityType === 1) {
    switch (teamMember?.gene?.name) {
      case 'Forager':
        return 2 * teamMember?.power;
      case 'Targeter':
        if (previousTeam?.[position]?.gene?.name === 'Targeter')
          return 5 * teamMember?.power;
        break;
      case 'Opticular':
        if (team?.every((member) => member.power <= teamMember.power))
          return 3 * teamMember?.power;
        break;
      case 'Borger':
        if (previousTeam.some((member) => member?.gene?.name === 'Forager')) {
          return 10 * teamMember?.power
        }
    }
    return teamMember?.power;
  }
  return 0;
}

export const getFightPower = (teamMember) => {
  return teamMember?.gene?.abilityType === 0 ? teamMember?.gene?.name === 'Mercenary'
    ? 2 * teamMember.power
    : teamMember.power : 0;
}

export const calcHighestPower = (breeding) => {
  const teams = breeding?.territories?.reduce((result, { team }) => ([...result, ...team]), []);
  const mappedPets = [...(breeding?.storedPets || []), ...teams].map(({ power }) => power);
  return Math.max(...mappedPets);
}

export const calcBreedabilityMulti = (account, characters) => {
  const breedingBonus = calcUpgradeBonus(account?.breeding?.petUpgrades?.[3], 3, account);
  const starSignBonus = characters?.reduce((acc, character) => {
    const bonus = getStarSignBonus(character, account, 'Breedable_Spd') ?? 0;
    if (bonus > acc) {
      return bonus;
    }
    return acc;
  }, 0);
  const mealBonus = getMealsBonusByEffectOrStat(account, null, 'Breed')
  const lampBonus = getLampBonus({ holesObject: account?.hole?.holesObject, t: 0, i: 1 });
  const arcadeBonus = getArcadeBonus(account?.arcade?.shop, 'Breedability_Rate')?.bonus;

  return {
    value: (1 + (breedingBonus +
        (mealBonus
          + (20 * getAchievementStatus(account?.achievements, 218)
            + starSignBonus))) / 100)
      * (1 + account?.farming?.cropDepot?.shiny?.value / 100)
      * (1 + lampBonus / 100)
      * (1 + arcadeBonus / 100),
    breakdown: [
      { name: 'Breeding bonus', value: breedingBonus / 100 },
      { name: 'Meal bonus', value: mealBonus / 100 },
      { name: 'Achievement bonus', value: 20 * getAchievementStatus(account?.achievements, 218) / 100 },
      { name: 'Starsign bonus', value: starSignBonus / 100 },
      { name: 'Crop bonus', value: account?.farming?.cropDepot?.shiny?.value / 100 },
      { name: 'Lamp bonus', value: lampBonus / 100 },
      { name: 'Arcade bonus', value: arcadeBonus / 100 }
    ]
  }
}
export const calcShinyLvMulti = (account, characters) => {
  const spelunkerObolMulti = getLabBonus(account?.lab.labBonuses, 8); // gem multi
  const emeraldUlthuriteBonus = getJewelBonus(account?.lab.jewels, 15, spelunkerObolMulti);
  const fasterShinyLevelBonus = getShinyBonus(account?.breeding?.pets, 'Faster_Shiny_Pet_Lv_Up_Rate');
  const starSign = characters?.reduce((acc, character) => {
    const bonus = getStarSignBonus(character, account, 'Shiny_Pet_LV_spd') ?? 0;
    if (bonus > acc) {
      return bonus;
    }
    return acc;
  }, 0);
  const summoningBonus = getWinnerBonus(account, '<x Shiny EXP', false);
  const lampBonus = getLampBonus({ holesObject: account?.hole?.holesObject, t: 0, i: 1 });
  const breedingBonus = calcUpgradeBonus(account?.breeding?.petUpgrades?.[12], 12, account);

  return {
    value: (1 + (emeraldUlthuriteBonus
        + (fasterShinyLevelBonus
          + (account?.farming?.cropDepot?.shiny?.value
            + starSign + breedingBonus))) / 100)
      * (1 + summoningBonus / 100)
      * (1 + lampBonus / 100),
    breakdown: [
      { name: 'Jewel bonus', value: emeraldUlthuriteBonus / 100 },
      { name: 'Shiny bonus', value: fasterShinyLevelBonus / 100 },
      { name: 'Starsign bonus', value: starSign / 100 },
      { name: 'Crop bonus', value: account?.farming?.cropDepot?.shiny?.value / 100 },
      { name: 'Summoning bonus', value: summoningBonus / 100 },
      { name: 'Breeding bonus', value: breedingBonus / 100 },
      { name: 'Lamp bonus', value: lampBonus / 100 }
    ]
  };
}

export const getEggsPowerRange = (characters) => {
  const highestBreedingBM = getCharacterByHighestSkillLevel(characters, CLASSES.Wind_Walker, 'breeding');
  const breedingLevel = highestBreedingBM?.skillsInfo?.breeding?.level;
  const baseTalentBonus = getTalentBonus(highestBreedingBM?.flatTalents, 'CURVITURE_OF_THE_PAW');
  const base = Math.pow(4 * breedingLevel + Math.pow(breedingLevel / 2, 3), 0.85);
  const talentBonus = Math.min(2.1, Math.max(1, 1 + baseTalentBonus));
  const breedingBonus = Math.min(1.2 + breedingLevel / 12, 4);
  return createRange(0, 10).map((eggLevel) => {
    const eggLvScale = 0.2 * eggLevel + 0.3 * Math.floor((eggLevel + 1) / 4) + 1;

    return {
      minPower: base
        * talentBonus
        * eggLvScale
        * (breedingBonus * Math.pow(2.71828, -10 * Math.max(0.1, 1 - ((eggLevel + 4) / 12) * 0.9)) + 1),
      maxPower: base
        * talentBonus
        * eggLvScale
        * (breedingBonus * Math.pow(2.71828, -10 * 0) + 1)
    }
  })
}