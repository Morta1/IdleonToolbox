import { createRange, lavaLog, number2letter, tryToParse } from '../utility/helpers';
import { filteredGemShopItems, filteredLootyItems, keysMap } from './parseMaps';
import {
  bonuses,
  classFamilyBonuses,
  companions,
  deathNote,
  items,
  killRoySkullShop,
  mapEnemiesArray,
  mapNames,
  monsters,
  ninjaExtraInfo,
  randomList,
  rawMapNames,
  slab
} from '../data/website-data';
import { checkCharClass, CLASSES, getTalentBonus, mainStatMap, talentPagesMap } from './talents';
import { getMealsBonusByEffectOrStat } from './cooking';
import { getBubbleBonus, getSigilBonus, getVialsBonusByEffect, getVialsBonusByStat } from './alchemy';
import { getStampsBonusByEffect } from './stamps';
import { getAchievementStatus } from './achievements';
import { getJewelBonus, getLabBonus } from './lab';
import { getAtomBonus } from './atomCollider';
import { getPrayerBonusAndCurse } from './prayers';
import { getShrineBonus } from './shrines';
import { isSuperbitUnlocked } from './gaming';
import { getFamilyBonusBonus } from './family';
import { getStatsFromGear } from './items';
import LavaRand from '../utility/lavaRand';
import { isPast } from 'date-fns';
import { getGuildBonusBonus } from './guild';
import { getStarSignBonus } from './starSigns';
import { getPlayerFoodBonus } from './character';
import { getCharmBonus, isJadeBonusUnlocked } from '@parsers/world-6/sneaking';
import { getBribeBonus } from '@parsers/bribes';
import { getVoteBonus } from '@parsers/world-2/voteBallot';
import { getUpgradeVaultBonus } from '@parsers/misc/upgradeVault';
import { getArmorSetBonus } from '@parsers/misc/armorSmithy';
import { getObolsBonus } from '@parsers/obols';

export const getLibraryBookTimes = (idleonData, characters, account) => {
  const { bookCount, libTime, breakdown } = calcBookCount(account, characters, idleonData);
  const timeAway = account?.timeAway;
  let breakpoints = [16, 18, 20].map((maxCount) => {
    return {
      breakpoint: maxCount,
      time: calcTimeToXBooks(bookCount, maxCount, account, characters, idleonData) - timeAway?.BookLib
    }
  })
  breakpoints = [...breakpoints,
    { breakpoint: 0, time: calcTimeToXBooks(0, 20, account, characters, idleonData) }]
  return {
    bookCount,
    next: getTimeToNextBooks(bookCount, account, characters, idleonData)?.value - libTime,
    breakdown,
    breakpoints
  }
}

const calcBookCount = (account, characters, idleonData) => {
  const baseBookCount = account?.accountOptions?.[55];
  const timeAway = account?.timeAway;
  let libTime = timeAway?.BookLib;
  let afk = (new Date).getTime() / 1e3 - timeAway.GlobalTime;
  let bookCount = baseBookCount;
  if (afk > 300) libTime += afk;
  const { breakdown } = getTimeToNextBooks(bookCount, account, characters, idleonData);
  while (libTime > getTimeToNextBooks(bookCount, account, characters, idleonData)?.value) {
    libTime -= getTimeToNextBooks(bookCount, account, characters, idleonData)?.value;
    bookCount += 1;
  }
  return { bookCount, libTime, breakdown };
}

const calcTimeToXBooks = (bookCount, maxCount, account, characters, idleonData) => {
  let time = 0;
  for (let i = bookCount; i < maxCount; i++) {
    time += getTimeToNextBooks(i, account, characters, idleonData)?.value;
  }
  return time;
}

//  "BookReqTime"
export const getTimeToNextBooks = (bookCount, account, characters, idleonData) => {
  const towersLevels = tryToParse(idleonData?.Tower) || idleonData?.Tower;
  const mealBonus = getMealsBonusByEffectOrStat(account, 'Library_checkout_Speed', null);
  const bubbleBonus = getBubbleBonus(account, 'IGNORE_OVERDUES', false);
  const vialBonus = getVialsBonusByEffect(account?.alchemy?.vials, 'Talent_Book_Library');
  const stampBonus = getStampsBonusByEffect(account, 'Talent_Book_Library_Refresh_Speed')
  const libraryTowerLevel = towersLevels?.[1];
  const libraryBooker = getAtomBonus(account, 'Oxygen_-_Library_Booker');
  const superbit = isSuperbitUnlocked(account, 'Library_Checkouts');
  let superbitBonus = 0;
  if (superbit) {
    superbitBonus = superbit?.totalBonus;
  }
  const math = Math.round(4 * (3600 / ((1 + mealBonus / 100)
      * (1 + libraryBooker / 100) *
      (1 + (5 * libraryTowerLevel
        + bubbleBonus
        + (vialBonus
          + (stampBonus
            + Math.min(30, Math.max(0, 30 * getAchievementStatus(account?.achievements, 145)))
            + superbitBonus))) / 100)))
    * (1 + 10 * Math.pow(bookCount, 1.4) / 100))

  const breakdown = [
    { title: 'Multiplicative' },
    { name: '' },
    { name: 'Meal Bonus', value: mealBonus },
    { name: 'Atom Bonus', value: libraryBooker },
    { name: 'Tower Bonus', value: 5 * libraryTowerLevel },
    { name: 'Bubble Bonus', value: bubbleBonus },
    { name: 'Vial Bonus', value: vialBonus },
    { name: 'Stamp Bonus', value: stampBonus },
    { name: 'Superbit Bonus', value: superbitBonus },
    {
      name: 'Achievement Bonus',
      value: Math.min(30, Math.max(0, 30 * getAchievementStatus(account?.achievements, 145)))
    }
  ]
  return {
    value: math,
    breakdown
  };
}

export const getSlab = (idleonData) => {
  const lootyRaw = idleonData?.Cards?.[1] || tryToParse(idleonData?.Cards1);
  const allItems = structuredClone((items)); // Deep clone
  const forcedNames = {
    'Motherlode': 'Motherlode_x1',
    'Island0': 'Island0_x1',
    'Dust0': 'Dust0_x1',
    'Dust1': 'Dust1_x1',
    'Dust2': 'Dust2_x1',
    'Dust3': 'Dust3_x1',
    'Dust4': 'Dust4_x1',
    'Dust5': 'Dust5_x1'
  }
  const slabItems = slab?.map((name) => ({
    name: allItems?.[name]?.displayName,
    rawName: forcedNames?.[name] || name,
    obtained: lootyRaw?.includes(name),
    onRotation: filteredGemShopItems?.[name],
    unobtainable: filteredLootyItems?.[name]
  }));
  const missingItems = slabItems?.filter(({ obtained, unobtainable }) => !obtained && !unobtainable)?.length;

  return {
    slabItems,
    lootyRaw,
    lootedItems: lootyRaw?.length,
    missingItems,
    totalItems: slab?.length,
    rawLootedItems: lootyRaw?.length
  };
};

export const getCurrencies = (account, idleonData, processedData) => {
  const keys = idleonData?.CurrenciesOwned?.['KeysAll'] || idleonData?.CYKeysAll;
  if (idleonData?.CurrenciesOwned) {
    return {
      ...idleonData?.CurrenciesOwned,
      KeysAll: getKeysObject(keys)
    };
  }
  const normalCandyTimes = {
    '1_HR_Time_Candy': 1,
    '2_HR_Time_Candy': 2,
    '4_HR_Time_Candy': 4,
    '12_HR_Time_Candy': 12,
    '24_HR_Time_Candy': 24,
    '72_HR_Time_Candy': 72
  };

  const specialCandy = {
    'Steamy_Time_Candy': { min: 1 / 6, max: 24 },
    'Spooky_Time_Candy': { min: 1 / 3, max: 12 },
    'Cosmic_Time_Candy': { min: 5, max: 500 }
  };
  const allItems = [...account?.storage?.list,
    ...(processedData?.charactersData || [])?.map(({ inventory }) => inventory)?.flat()];
  const allCandies = allItems?.filter(({ Type } = {}) => Type === 'TIME_CANDY');
  const guaranteedCandies = allCandies?.reduce((sum, { displayName, amount }) => {
    if (specialCandy[displayName]) return sum;
    const hours = normalCandyTimes[displayName];
    return sum + (hours * amount);
  }, 0);
  const specialCandies = allCandies?.reduce((sum, { displayName, amount }) => {
    const hours = specialCandy[displayName];
    if (!hours) return sum;

    return {
      min: sum?.min + (hours?.min * amount),
      max: sum?.max + (hours?.max * amount)
    }
  }, { min: 0, max: 0 })

  return {
    candies: { guaranteed: guaranteedCandies, special: specialCandies },
    WorldTeleports: idleonData?.CYWorldTeleports,
    KeysAll: getKeysObject(keys),
    ColosseumTickets: idleonData?.CYColosseumTickets,
    ObolFragments: idleonData?.CYObolFragments,
    SilverPens: idleonData?.CYSilverPens,
    GoldPens: idleonData?.CYGoldPens,
    DeliveryBoxComplete: idleonData?.CYDeliveryBoxComplete,
    DeliveryBoxStreak: idleonData?.CYDeliveryBoxStreak,
    DeliveryBoxMisc: idleonData?.CYDeliveryBoxMisc,
    minigamePlays: account?.accountOptions?.[33] ?? 0
  };
};

export const enhanceColoTickets = (tickets, characters, account) => {
  const npcs = {
    0: { name: 'Typhoon', dialogThreshold: 3, daysSinceIndex: 15 },
    1: { name: 'Centurion', dialogThreshold: 4, daysSinceIndex: 35 },
    2: { name: 'Lonely_Hunter', dialogThreshold: 6, daysSinceIndex: 56 }
  }
  const allTickets = Object.entries(npcs).reduce((res, [, npc], index) => {
    // const amountPerDay = getAmountPerDay(npc, characters);
    const daysSincePickup = account?.accountOptions?.[npc?.daysSinceIndex];
    return [...res,
      {
        rawName: `TixEZ${index}`,
        amountPerDay: 1,
        daysSincePickup,
        amount: tickets,
        totalAmount: Math.min(daysSincePickup, 3)
      }];
  }, [])
  return {
    allTickets,
    totalAmount: tickets
  }
}

const getKeysObject = (keys) => {
  return keys.reduce((res, keyAmount, index) => (index < 5 ? [...res,
    { amount: keyAmount, ...keysMap[index] }] : res), []);
}

export const enhanceKeysObject = (keysAll, characters, account) => {
  const npcs = {
    0: { name: 'Dog_Bone', dialogThreshold: 5, daysSinceIndex: 16 },
    1: { name: 'Djonnut', dialogThreshold: 6, daysSinceIndex: 31 },
    2: { name: 'Bellows', dialogThreshold: 8.5, daysSinceIndex: 80 },
    3: {}
  }
  return keysAll.map((key, keyIndex) => {
    const amountPerDay = getAmountPerDay(npcs?.[keyIndex], characters);
    const daysSincePickup = account?.accountOptions?.[npcs?.[keyIndex]?.daysSinceIndex];
    return { ...key, amountPerDay, daysSincePickup, totalAmount: Math.min(daysSincePickup, 3) * amountPerDay };
  });
}

const getAmountPerDay = ({ name, dialogThreshold } = {}, characters) => {
  return characters.reduce((res, { npcDialog }) => {
    if (dialogThreshold === undefined) return res;
    return npcDialog?.[name] > dialogThreshold ? res + 1 : res;
  }, 0);
}

export const getBundles = (idleonData) => {
  const bundlesRaw = tryToParse(idleonData?.BundlesReceived) || idleonData?.BundlesReceived;
  if (!bundlesRaw) return [];
  return Object.entries(bundlesRaw)
    ?.reduce(
      (res, [bundleName, owned]) =>
        owned
          ? [
            ...res,
            {
              name: bundleName,
              owned: !!owned
            }
          ]
          : res,
      []
    )
    .sort((a, b) => a?.name?.match(/_[a-z]/i)?.[0].localeCompare(b?.name?.match(/_[a-z]/i)?.[0]));
};

export const isBundlePurchased = (bundles, name) => {
  return bundles?.find(({ name: n }) => n === name);
}

export const isArenaBonusActive = (arenaWave, waveReq, bonusNumber) => {
  const waveReqArray = waveReq.split(' ');
  if (bonusNumber > waveReqArray.length) {
    return false;
  }
  return arenaWave >= waveReqArray[bonusNumber];
};

export const calculateAfkTime = (playerTime) => {
  return parseFloat(playerTime) * 1e3;
};

export const getAllCapsBonus = (guildBonus, telekineticStorageBonus, shrineBonus, zergPrayer, ruckSackPrayer, bribeCapBonus) => {
  return (1 + (guildBonus + telekineticStorageBonus) / 100) * (1 + shrineBonus / 100) * (1 + bribeCapBonus / 100) * Math.max(1 - zergPrayer / 100, 0.4) * (1 + ruckSackPrayer / 100);
};

export const getMaterialCapacity = (bag, capacities) => {
  const {
    allCapacity,
    mattyBagStampBonus,
    gemShopCarryBonus,
    masonJarStampBonus,
    extraBagsTalentBonus,
    starSignExtraCap
  } = capacities;

  const bCraftCap = bag?.capacity;

  return Math.floor(bCraftCap
    * (1 + mattyBagStampBonus / 100)
    * (1 + (25 * gemShopCarryBonus) / 100)
    * (1 + (masonJarStampBonus
      + starSignExtraCap) / 100)
    * (1 + extraBagsTalentBonus / 100) * allCapacity)
};

export const getSpeedBonusFromAgility = (agility = 0) => {
  let base = (Math.pow(agility + 1, 0.37) - 1) / 40;
  if (agility > 1000) {
    base = ((agility - 1000) / (agility + 2500)) * 0.5 + 0.297;
  }
  return base * 2 + 1;
};

export const getHighestLevelOf = (characters, className) => {
  const classes = characters?.filter((character) => checkCharClass(character?.class, className));
  return classes?.reduce((res, { level }) => {
    if (level > res) {
      return level;
    }
    return res;
  }, 0);
}

export const getHighestLevelOfClass = (characters, className, exactSearch) => {
  const highest = characters?.reduce((res, { level, class: cName }) => {
    if (res?.[cName]) {
      res[cName] = Math.max(res?.[cName], level);
    } else {
      res[cName] = level;
    }
    return res;
  }, {});
  let allClasses = talentPagesMap?.[className];
  if (exactSearch) {
    allClasses = allClasses.filter((cName) => cName === className);
  }
  const classAlias = allClasses?.find((cName) => highest?.[cName]);
  return highest?.[classAlias] || 0;
};

export const getCharacterByHighestLevel = (characters, className) => {
  let filteredObjects = characters.filter(obj => obj.class === className);
  return filteredObjects.reduce((maxObj, currentObj) => {
    return currentObj.level > maxObj.level ? currentObj : maxObj;
  }, filteredObjects[0]);
};

export const getCharacterByHighestSkillLevel = (characters, className, skillName) => {
  if (!characters) return null;
  let array;
  if (className) {
    const allClasses = talentPagesMap?.[className];
    array = characters.filter(obj => allClasses.includes(obj.class))
  } else {
    array = characters;
  }
  return array.reduce((maxObj, currentObj) => {
    return currentObj?.skillsInfo?.[skillName]?.level > maxObj?.skillsInfo?.[skillName]?.level ? currentObj : maxObj;
  }, array[0]);
};

export const getHighestLevelCharacter = (characters) => {
  const levels = characters?.map(({ level }) => level ?? 0);
  return Math.max(...levels);
};

export const getHighestCharacterSkill = (characters = [], skillName) => {
  const levels = characters?.map(({ skillsInfo }) => skillsInfo?.[skillName]?.level ?? 0);
  return Math.max(...levels);
};

export const calculateLeaderboard = (characters) => {
  const leaderboardObject = characters.reduce((res, { name, skillsInfo }) => {
    if (!skillsInfo) return res;
    for (const [skillName, skillLevel] of Object.entries(skillsInfo)) {
      if (!res[skillName]) {
        res[skillName] = { ...res[skillName], [name]: skillLevel };
      } else {
        const joined = { ...res[skillName], [name]: skillLevel };
        let lowestIndex = Object.keys(joined).length;
        res[skillName] = Object.entries(joined)
          .sort(
            ([, { level: aLevel, exp: aExp }], [, { level: bLevel, exp: bExp }]) =>
              bLevel - aLevel || bExp - aExp
          )
          .reduceRight((res, [charName, charSkillLevel]) => {
            return { ...res, [charName]: { ...charSkillLevel, rank: lowestIndex-- } };
          }, {});
      }
    }
    return res;
  }, {});
  return Object.entries(leaderboardObject)?.reduce((res, [skillName, characters]) => {
    const charsObjects = Object.entries(characters).reduce((response, [charName, charSkill]) => {
      return { ...response, [charName]: { [skillName]: charSkill } };
    }, {});
    return Object.entries(charsObjects).reduce((response, [charName, charSkill]) => {
      return { ...response, [charName]: { ...(res[charName] || {}), ...charSkill } };
    }, {});
  }, {});
};

export const calculateTotalSkillsLevel = (characters) => {
  const allSkills = characters?.reduce((res, { skillsInfo }) => {
    if (!skillsInfo) return res;
    for (const [skillName, skillData] of Object.entries(skillsInfo)) {
      if (res?.[skillName]) {
        res[skillName] = { ...res[skillName], level: res[skillName].level + skillData?.level ?? 0 }
      } else {
        res[skillName] = { level: skillData?.level, index: skillData?.index - 1, icon: skillData?.icon };
      }
    }
    return res;
  }, {})
  return Object.entries(allSkills)?.reduce((res, [skillName, { level }]) => {
    const rank = getSkillRank(level);
    return {
      ...res, [skillName]: {
        ...res?.[skillName],
        rank,
        color: getSkillRankColor(level)
      }
    };
  }, allSkills);
}

export const getSkillRankColor = (level) => {
  return level < 300 ? 'white' : level >= 300 && level < 400 ? '#ffc277' : level >= 400 && level < 600
    ? '#cadadb'
    : level >= 600 && level < 1000 ? 'gold' : '#56ccff'
}

const getSkillRank = (level) => {
  return 150 > level ? 0 : 200 > level ? 1 : 300 > level ? 2 : 400 > level ? 3 : 500 > level ? 4 : 750 > level
    ? 5
    : 1e3 > level ? 6 : 7;
}

export const isMasteryBonusUnlocked = (rift, skillRank, bonusIndex) => {
  return rift?.currentRift < 15 ? 0 : skillRank > bonusIndex ? 1 : 0;
}

const getSkillRankByIndex = (skills, index) => {
  for (const [, skillData] of Object.entries(skills)) {
    if (skillData?.level > 0 && skillData?.index === index) {
      return skillData?.rank;
    }
  }
  return null;
}

export const getSkillMasteryBonusByIndex = (skills, rift, riftBonusIndex) => {
  const array = new Array(18).fill(1);
  return array.reduce((sum, skill, index) => {
    const skillRank = getSkillRankByIndex(skills, index);
    if (riftBonusIndex === 1) {
      sum += 10 * isMasteryBonusUnlocked(rift, skillRank, Math.round(riftBonusIndex + 2));
    } else if (riftBonusIndex === 3) {
      sum += isMasteryBonusUnlocked(rift, skillRank, Math.round(riftBonusIndex + 2));
    } else if (riftBonusIndex === 4) {
      sum += 25 * isMasteryBonusUnlocked(rift, skillRank, Math.round(riftBonusIndex + 2));
    } else if (index !== 0 && index !== 2 && index !== 3 && index !== 5 && index !== 6 && index !== 8) {
      sum += 5 * isMasteryBonusUnlocked(rift, skillRank, Math.round(riftBonusIndex + 2));
    }
    return sum;
  }, 7);
};

export const getExpReq = (skillIndex, t) => {
  return 0 === skillIndex ?
    (15 + Math.pow(t, 1.9) + 11 * t) * Math.pow(1.208 - Math.min(0.164, (0.215 * t) / (t + 100)), t) - 15 :
    2 === skillIndex
      ? (15 + Math.pow(t, 2) + 13 * t) * Math.pow(1.225 - Math.min(0.114, (0.135 * t) / (t + 50)), t) - 26
      :
      8 === skillIndex ? (71 > t
          ? ((10 + Math.pow(t, 2.81) + 4 * t) * Math.pow(1.117 - (0.135 * t) / (t + 5), t) - 6) * (1 + Math.pow(t, 1.72) / 300)
          :
          (((10 + Math.pow(t, 2.81) + 4 * t) * Math.pow(1.003, t) - 6) / 2.35) * (1 + Math.pow(t, 1.72) / 300)) :
        9 === skillIndex
          ? (15 + Math.pow(t, 1.3) + 6 * t) * Math.pow(1.17 - Math.min(0.07, (0.135 * t) / (t + 50)), t) - 26
          :
          (15 + Math.pow(t, 2) + 15 * t) * Math.pow(1.225 - Math.min(0.18, (0.135 * t) / (t + 50)), t) - 30;
}

export const getGiantMobChance = (character, account) => {
  const giantsAlreadySpawned = account?.accountOptions?.[57];
  // const tachionOfTitansPrayer = getPrayerBonusAndCurse(character?.activePrayers, 'Tachion_of_the_Titans')?.bonus > 5;
  const glitterbugPrayer = getPrayerBonusAndCurse(character?.activePrayers, 'Glitterbug', account)?.curse;
  const crescentShrineBonus = getShrineBonus(account?.shrines, 6, character?.mapIndex, account?.cards, account?.sailing?.artifacts);
  const giantMobVial = getVialsBonusByStat(account?.alchemy?.vials, 'GiantMob');
  let chance;
  if (giantsAlreadySpawned < 5) {
    chance = (1 / ((100 + 50 * Math.pow(giantsAlreadySpawned + 1, 2)) * (1 + glitterbugPrayer / 100))) * (1 + (crescentShrineBonus + giantMobVial) / 100);
  } else {
    chance = (1 / (2 * Math.pow(giantsAlreadySpawned + 1, 1.95)
        * (1 + glitterbugPrayer / 100)
        * Math.pow(giantsAlreadySpawned + 1, 1.5 + giantsAlreadySpawned / 15)))
      * (1 + (crescentShrineBonus + giantMobVial) / 100);
  }
  return {
    chance,
    crescentShrineBonus,
    giantMobVial,
    glitterbugPrayer
  }
}

export const getGoldenFoodMulti = (character, account, characters) => {
  const highestLevelShaman = getHighestLevelOfClass(account?.charactersLevels, CLASSES.Bubonic_Conjuror) ?? getHighestLevelOfClass(account?.charactersLevels, CLASSES.Shaman) ?? 0;
  const theFamilyGuy = getTalentBonus(character?.flatTalents, 'THE_FAMILY_GUY');
  const familyBonus = getFamilyBonusBonus(classFamilyBonuses, 'GOLDEN_FOODS', highestLevelShaman);
  const isShaman = checkCharClass(character?.class, CLASSES.Shaman);
  const amplifiedFamilyBonus = familyBonus * (theFamilyGuy > 0 ? (1 + theFamilyGuy / 100) : 1) || 0;
  const equipmentGoldFoodBonus = getStatsFromGear(character, 8, account);
  const toolGoldFoodBonus = getStatsFromGear(character, 8, account, true);
  const obolsBonus = getObolsBonus(character?.obols, bonuses?.etcBonuses?.[47]);
  const hungryForGoldTalentBonus = getTalentBonus(character?.flatTalents, 'HAUNGRY_FOR_GOLD');
  const goldenAppleStamp = getStampsBonusByEffect(account, 'Effect_from_Golden_Food._Sparkle_sparkle!');
  const goldenFoodAchievement = getAchievementStatus(account?.achievements, 37);
  const goldenFoodBubbleBonus = getBubbleBonus(account, 'SHIMMERON', false, mainStatMap?.[character?.class] === 'strength');
  const goldenFoodSigilBonus = getSigilBonus(account?.alchemy?.p2w?.sigils, 'EMOJI_VEGGIE');
  const charmBonus = getCharmBonus(account, 'Gumm_Stick');
  const mealBonus = getMealsBonusByEffectOrStat(account, null, 'zGoldFood');
  const starSignBonus = getStarSignBonus(character, account, 'Golden_Food');
  const bribeBonus = getBribeBonus(account?.bribes, 'Gold_from_Lead');
  const achievementBonus = getAchievementStatus(account?.achievements, 380);
  const secondAchievementBonus = getAchievementStatus(account?.achievements, 383);
  const voteBonus = getVoteBonus(account, 26);
  // select first death bringer
  const deathBringer = characters?.find((character) => checkCharClass(character?.class, CLASSES.Death_Bringer));
  const apocalypseWow = getTalentBonus(deathBringer?.flatTalents, 'APOCALYPSE_WOW');
  const apocalypses = deathBringer?.wow?.finished?.at(0) || 0;
  const armorSetBonus = getArmorSetBonus(account, 'SECRET_SET');

  return {
    value: (1 + armorSetBonus / 100)
      * (Math.max(isShaman ? amplifiedFamilyBonus : familyBonus, 1)
        + ((equipmentGoldFoodBonus + toolGoldFoodBonus + obolsBonus)
          + (hungryForGoldTalentBonus
            + (goldenAppleStamp
              + (goldenFoodAchievement
                + (goldenFoodBubbleBonus
                  + goldenFoodSigilBonus) + mealBonus + starSignBonus + bribeBonus + charmBonus
                + (2 * achievementBonus + 3 * secondAchievementBonus + voteBonus + apocalypseWow * apocalypses))))) / 100),
    expression: `(1 + armorSetBonus / 100)
* (Math.max(isShaman ? amplifiedFamilyBonus : familyBonus, 1)
+ (equipmentGoldFoodBonus
+ (hungryForGoldTalentBonus
+ (goldenAppleStamp
+ (goldenFoodAchievement
+ (goldenFoodBubbleBonus
+ goldenFoodSigilBonus) 
+ mealBonus 
+ starSignBonus
+ bribeBonus 
+ charmBonus
+ (2 * achievementBonus + 3 * secondAchievementBonus
+ voteBonus
+ apocalypseWow * apocalypses))))) / 100)`
  };
}

export const getGoldenFoodBonus = (foodName, character, account, characters) => {
  if (!character) return 0;
  const goldenFood = character?.food?.find(({ name }) => name === foodName);
  const goldenFoodMulti = getGoldenFoodMulti(character, account, characters);
  const baseBonus = !goldenFood?.Amount || !goldenFood?.amount
    ? 0
    : goldenFood?.Amount * goldenFoodMulti?.value * 0.05 * lavaLog(1 + goldenFood?.amount) * (1 + lavaLog(1 + goldenFood?.amount) / 2.14);
  if (isJadeBonusUnlocked(account, 'Gold_Food_Beanstalk')) {
    const beanstalkData = account?.sneaking?.beanstalkData;
    const beanstalkGoldenFoods = ninjaExtraInfo[29].split(' ').filter((str) => isNaN(str))
      .map((gFood, index) => ({ ...(items?.[gFood] || {}), active: beanstalkData?.[index] > 0, index }));
    const beanstalkFood = beanstalkGoldenFoods?.find(({ displayName, active }) => displayName === foodName & active);
    if (!beanstalkFood) return baseBonus;
    return baseBonus + beanstalkFood?.Amount * goldenFoodMulti?.value * .05 * lavaLog(1 + 1e3 * Math.pow(10, beanstalkData?.[beanstalkFood?.index]))
      * (1 + lavaLog(1 + 1e3 * Math.pow(10, beanstalkData?.[beanstalkFood?.index])) / 2.14);
  }
  return baseBonus;
};


export const getRandomEvents = (account) => {
  if (!account) return [];
  const { serverVars, timeAway } = account || {};
  const eventList = []
  const seed = Math.round(Math.floor(timeAway?.GlobalTime / 3600));
  for (let i = 0; i < 100; i++) {
    const actualSeed = seed + i + serverVars?.RandEvntHr;
    const eventRng = new LavaRand(actualSeed);
    const eventRandom = eventRng.rand();
    const eventType = getEventType(eventRandom);
    const mapRng = new LavaRand(actualSeed + 1);
    const mapRandom = mapRng.rand();
    const eventMaps = getEventMaps(eventType);
    if (eventMaps.length === 0) continue;
    const mapIndex = Math.min(Math.floor(mapRandom * eventMaps.length), eventMaps.length - 1);
    const realMapIndex = rawMapNames?.indexOf(eventMaps?.[mapIndex]);
    if (realMapIndex === -1) continue;
    const mapName = mapNames?.[realMapIndex];
    const eventName = getEventName(eventType);
    let dateInMs = (seed + i + 1) * 3600 * 1000;
    if (isPast(dateInMs)) continue;
    const date = new Date(dateInMs);
    if (date.isDstObserved()) {
      dateInMs -= 3600 * 1000;
    }
    eventList.push({ mapName, eventName, date: dateInMs })
  }
  return eventList;
}

const getEventMaps = (eventType) => {
  const [world1, world2, world3] = randomList.slice(68, 71)
  let events = [];
  if (0 === eventType || 1 === eventType || 3 === eventType || 4 === eventType) {
    events = events.concat(world1.split(' '))
  }
  if (0 === eventType || 1 === eventType || 3 === eventType) {
    events = events.concat(world2.split(' '))
  }
  if (0 === eventType || 2 === eventType) {
    events = events.concat(world3.split(' '))
  }
  return events;
}

const getEventName = (eventType) => {
  const eventNames = {
    0: 'Meteorite',
    1: 'Mega_Grumblo',
    2: 'Glacial_Guild',
    3: 'Snake_Swarm',
    4: 'Angry_Frogs'
  }
  return eventNames?.[eventType] ?? '';
}

const getEventType = (index) => {
  return .045 > index ? 0 : .087 > index ? 1 : .129 > index ? 2 : .171 > index ? 3 : .213 > index ? 4 : -1
}

export const getHighestCapacityCharacter = (item, characters, account, forceMaxCapacity) => {
  return characters?.reduce((res, character) => {
    const itemCapacity = item?.itemType === 'Equip'
      ? 1
      : getItemCapacity(item?.typeGen, character, account, forceMaxCapacity)?.value;
    const maxCapacity = character?.inventorySlots * itemCapacity;
    if (maxCapacity > res?.maxCapacity) {
      res = {
        capacityPerSlot: itemCapacity,
        maxCapacity,
        character: character?.name,
        skillsInfoArray: character?.skillsInfoArray
      }
    }
    return res;
  }, { capacityPerSlot: 0, maxCapacity: 0, character: '' })
}
export const getAllCap = (character, account, forceMaxCapacity) => {
  const guildBonus = getGuildBonusBonus(account?.guild?.guildBonuses, 2);
  const talentBonus = getTalentBonus(character?.flatStarTalents, 'TELEKINETIC_STORAGE');
  const shrineBonus = getShrineBonus(account?.shrines, 3, character?.mapIndex, account?.cards, account?.sailing?.artifacts);
  const prayerCurse = forceMaxCapacity
    ? 0
    : getPrayerBonusAndCurse(character?.activePrayers, 'Zerg_Rushogen', account)?.curse;
  const prayerBonus = getPrayerBonusAndCurse(character?.activePrayers, 'Ruck_Sack', account, forceMaxCapacity)?.bonus;
  const bribeBonus = account?.bribes?.[23]?.done ? account?.bribes?.[23]?.value : 0;
  const companionBonus = isCompanionBonusActive(account, 18) ? account?.companions?.list?.at(18)?.bonus : 0;

  return {
    value: (1 + (guildBonus + talentBonus) / 100)
      * (1 + companionBonus / 100)
      * (1 + shrineBonus / 100) * Math.max(1 - prayerCurse / 100, 0.4)
      * (1 + (prayerBonus + bribeBonus) / 100),
    breakdown: [
      { value: guildBonus, name: 'Guild' },
      { value: talentBonus, name: 'Talent' },
      { value: shrineBonus, name: 'Shrine' },
      { value: prayerBonus + (-prayerCurse), name: 'Prayer' },
      { value: bribeBonus, name: 'Bribe' },
      { value: companionBonus, name: 'Companion' }
    ]
  }
}
export const getItemCapacity = (type = '', character, account, forceMaxCapacity) => {
  const gemshop = account?.gemShopPurchases?.find((value, index) => index === 58);
  const hasNanoChip = account?.lab?.playersChips.flat().concat(account?.lab?.chips).find(({ name }) => name === 'Silkrode_Nanochip');
  const starSignBonus = getStarSignBonus(character, account, 'Carry_Cap', forceMaxCapacity && hasNanoChip, forceMaxCapacity);
  const minCapStamps = getStampsBonusByEffect(account, 'Carrying_Capacity_for_Mining_Items', character);
  const chopCapStamps = getStampsBonusByEffect(account, 'Carrying_Capacity_for_Choppin\'_Items', character);
  const fishCapStamps = getStampsBonusByEffect(account, 'Carry_Capacity_for_Fishing_Items', character);
  const catchCapStamps = getStampsBonusByEffect(account, 'Carry_Capacity_for_Catching_Items', character);
  const matCapStamps = getStampsBonusByEffect(account, 'Carrying_Capacity_for_Material_Items', character);
  const allCarryStamps = getStampsBonusByEffect(account, 'Carry_Capacity_for_ALL_item_types!');
  const talentBonus = getTalentBonus(character?.flatTalents, 'EXTRA_BAGS', false, false, character?.addedLevels, true, forceMaxCapacity);
  const upgradeVaultBonus = getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 17);
  const allCap = getAllCap(character, account, forceMaxCapacity);
  // return Math.floor((v._customBlock_MaxCapacity("AllCapBASE")
  //     + c.asNumber(a.engine.getGameAttribute("MaxCarryCap").h.bCraft))
  //   * (1 + k._customBlock_StampBonusOfTypeX("MatCap") / 100)
  //   * (1 + 25 * c.asNumber(a.engine.getGameAttribute("GemItemsPurchased")[58]) / 100)
  //   * (1 + (k._customBlock_StampBonusOfTypeX("AllCarryCap")
  //     + c.asNumber(a.engine.getGameAttribute("DNSM").h.StarSigns.h.CarryCap)) / 100) *
  //   (1 + k._customBlock_GetTalentNumber(1, 78) / 100
  //   ) * v._customBlock_MaxCapacity("AllCapBonuses"));

  let value, breakdown = [
    { title: 'Base' },
    { name: '' },
    ...allCap?.breakdown,
    { value: upgradeVaultBonus, name: 'Upgrade Vault' },
    { name: '' }
  ];
  if ('bOre' === type || 'bBar' === type || 'cOil' === type) {
    value = Math.floor((upgradeVaultBonus + character?.maxCarryCap?.Mining) * (1 + minCapStamps / 100) * (1 + (25 * gemshop) / 100) * (1 + (allCarryStamps + starSignBonus) / 100) * allCap?.value);
    breakdown = [
      ...breakdown,
      { title: 'Mining' },
      { name: '' },
      { value: character?.maxCarryCap?.Mining, name: 'Base Bag' },
      { value: minCapStamps, name: 'Stamps' },
      { value: gemshop, name: 'Gemshop' },
      { value: allCarryStamps, name: 'All Stamps' },
      { value: starSignBonus, name: 'Star Sign' }
    ]
  } else if ('dFish' === type) {
    value = Math.floor((upgradeVaultBonus + character?.maxCarryCap?.Fishing) * (1 + (25 * gemshop) / 100) * (1 + fishCapStamps / 100) * (1 + (allCarryStamps + starSignBonus) / 100) * allCap?.value);
    breakdown = [
      ...breakdown,
      { title: 'Fishing' },
      { name: '' },
      { value: character?.maxCarryCap?.Fishing, name: 'Base Bag' },
      { value: fishCapStamps, name: 'Stamps' },
      { value: gemshop, name: 'Gemshop' },
      { value: allCarryStamps, name: 'All Stamps' },
      { value: starSignBonus, name: 'Star Sign' }
    ]
  } else if ('dBugs' === type) {
    value = Math.floor((upgradeVaultBonus + character?.maxCarryCap?.Bugs) * (1 + (25 * gemshop) / 100) * (1 + catchCapStamps / 100) * (1 + (allCarryStamps + starSignBonus) / 100) * allCap?.value);
    breakdown = [
      ...breakdown,
      { title: 'Catching' },
      { name: '' },
      { value: character?.maxCarryCap?.Bugs, name: 'Base Bag' },
      { value: catchCapStamps, name: 'Stamps' },
      { value: gemshop, name: 'Gemshop' },
      { value: allCarryStamps, name: 'All Stamps' },
      { value: starSignBonus, name: 'Star Sign' }
    ]
  } else if ('bLog' === type || 'bLeaf' === type) {
    value = Math.floor((upgradeVaultBonus + character?.maxCarryCap?.Chopping) * (1 + chopCapStamps / 100) * (1 + (25 * gemshop) / 100) * (1 + (allCarryStamps + starSignBonus) / 100) * allCap?.value);
    breakdown = [
      ...breakdown,
      { title: 'Chopping' },
      { name: '' },
      { value: character?.maxCarryCap?.Chopping, name: 'Base Bag' },
      { value: chopCapStamps, name: 'Stamps' },
      { value: gemshop, name: 'Gemshop' },
      { value: allCarryStamps, name: 'All Stamps' },
      { value: starSignBonus, name: 'Star Sign' }
    ]
  } else if ('cFood' === type) {
    value = Math.floor((upgradeVaultBonus + character?.maxCarryCap?.Foods) * (1 + (25 * gemshop) / 100) * (1 + (allCarryStamps + starSignBonus) / 100) * allCap?.value);
    breakdown = [
      ...breakdown,
      { title: 'Food' },
      { name: '' },
      { value: character?.maxCarryCap?.Foods, name: 'Base Bag' },
      { value: gemshop, name: 'Gemshop' },
      { value: allCarryStamps, name: 'All Stamps' },
      { value: starSignBonus, name: 'Star Sign' }
    ]
  } else if ('dCritters' === type) {
    value = Math.floor((upgradeVaultBonus + character?.maxCarryCap?.Critters) * (1 + (25 * gemshop) / 100) * (1 + (allCarryStamps + starSignBonus) / 100) * allCap?.value);
    breakdown = [
      ...breakdown,
      { title: 'Critters' },
      { name: '' },
      { value: character?.maxCarryCap?.Critters, name: 'Base Bag' },
      { value: gemshop, name: 'Gemshop' },
      { value: allCarryStamps, name: 'All Stamps' },
      { value: starSignBonus, name: 'Star Sign' }
    ]
  } else if ('dSouls' === type) {
    value = Math.floor((upgradeVaultBonus + character?.maxCarryCap?.Souls) * (1 + (25 * gemshop) / 100) * (1 + (allCarryStamps + starSignBonus) / 100) * allCap?.value);
    breakdown = [
      ...breakdown,
      { title: 'Souls' },
      { name: '' },
      { value: character?.maxCarryCap?.Souls, name: 'Base Bag' },
      { value: gemshop, name: 'Gemshop' },
      { value: allCarryStamps, name: 'All Stamps' },
      { value: starSignBonus, name: 'Star Sign' }
    ]
  } else if ('dCurrency' === type || 'dQuest' === type || 'dStatueStone' === type) {
    value = 999999;
  } else if ('bCraft' === type) {
    value = Math.floor((upgradeVaultBonus + character?.maxCarryCap?.bCraft)
      * (1 + matCapStamps / 100) * (1 + (25 * gemshop) / 100)
      * (1 + (allCarryStamps + starSignBonus) / 100) * (1 + talentBonus / 100) * allCap?.value);
    breakdown = [
      ...breakdown,
      { title: 'Materials' },
      { name: '' },
      { value: character?.maxCarryCap?.bCraft, name: 'Base Bag' },
      { value: matCapStamps, name: 'Stamps' },
      { value: gemshop, name: 'Gemshop' },
      { value: allCarryStamps, name: 'All Stamps' },
      { value: talentBonus, name: 'Talent' },
      { value: starSignBonus, name: 'Star Sign' }
    ]
  } else if ('dExpOrb' === type || 'dStone' === type || 'dFishToolkit' === type) {
    value = 999999;
  } else if ('fillerz' === type) {
    value = character?.maxCarryCap?.fillerz;
  } else if ('d' === type.charAt(0)) {
    value = 999999;
  } else {
    value = 2;
  }

  return {
    value,
    breakdown
  };
}

export const getTypeGen = (type) => {
  const capacities = {
    bCraft: 'bCraft',
    Foods: 'cFood',
    Mining: 'bOre',
    Quests: 'dQuest',
    Statues: 'dStatueStone',
    Chopping: 'bLog',
    Fishing: 'dFish',
    Bugs: 'dBugs',
    Critters: 'dCritters',
    Souls: 'dSouls'
  }
  return capacities?.[type];
}

export const getFoodBonus = (character, account, bonusName, ignoreFoodBonus = false) => {
  const foodBonus = getPlayerFoodBonus(character, account);
  return character?.food?.reduce((res, {
    Amount,
    Effect
  }) => res + (Effect === bonusName ? Amount * (ignoreFoodBonus ? 1 : foodBonus) : 0), 0);
}

export const getHealthFoodBonus = (character, account, bonusName) => {
  const foodBonus = getPlayerFoodBonus(character, account, true);
  return character?.food?.reduce((res, {
    Trigger,
    Amount,
    Cooldown,
    Effect
  }) => res + (Trigger > 0 && Effect === bonusName ? Amount * foodBonus / Math.max(Cooldown, 1) * 3600 : 0), 0);
}

export const getMinigameScore = (account, name) => {
  return account?.highscores?.minigameHighscores?.find(({ minigame }) => minigame === name)?.score || 0;
}

export const getCompanions = (companionObject = {}) => {
  const maxStorage = 40;
  const [companionIndex] = companionObject?.e?.split(',') || [];
  const companion = companions?.[companionIndex];
  const ownedCompanions = companionObject?.l?.reduce((result, comp) => {
    const [companionIndex] = comp?.split(',');
    return {
      ...result,
      [companionIndex]: true
    }
  }, {});

  const updatedCompanions = companions?.map((comp, index) => ({
    ...comp,
    acquired: !!ownedCompanions?.[index]
  }))
  return {
    totalBoxesOpened: companionObject?.x,
    currentCompanion: companion,
    list: updatedCompanions,
    lastFreeClaim: companionObject?.t,
    petCrystals: companionObject?.s,
    maxStorage
  };
}

export const isCompanionBonusActive = (account, index) => {
  return account?.companions?.list?.at(index)?.acquired;
}

export const getRandomEventItems = (account) => {
  const list = randomList.slice(82, 87).flat();
  const uniqueLooty = new Set(account?.looty?.lootyRaw);
  return list.reduce((count, value) => {
    return uniqueLooty.has(value) ? count + 1 : count;
  }, 0);
}
const getDays = (name, daysSince) => {
  const days = {
    mini3b: Math.min(10, Math.floor(Math.pow((daysSince < 3 ? 3 : daysSince) - 3, .55))),
    mini4b: Math.min(8, Math.floor(Math.pow((daysSince < 3 ? 3 : daysSince) - 3, .5))),
    mini5a: Math.min(6, Math.floor(Math.pow((daysSince < 3 ? 3 : daysSince) - 3, .5))),
    mini6a: Math.min(6, Math.floor(Math.pow((daysSince < 3 ? 3 : daysSince) - 3, .5)))
  }
  return days[name];
}
const getDaysTillNext = (name, daysSinceLastKill, currentCount) => {
  return createRange(1, 100).find(value => {
    const countOnDay = getDays(name, daysSinceLastKill + value);
    if (countOnDay > currentCount) {
      return value;
    }
  })
}

export const getMiniBossesData = (account) => {
  const daysSinceSlush = account?.accountOptions?.[96] ?? 0;
  const daysSinceMush = account?.accountOptions?.[98] ?? 0;
  const daysSinceMagmus = account?.accountOptions?.[225] ?? 0;
  const daysSinceSpiritlord = account?.accountOptions?.[226] ?? 0;

  const max = [10, 8, 6, 6];
  const quantity = [
    getDays('mini3b', daysSinceSlush),
    getDays('mini4b', daysSinceMush),
    getDays('mini5a', daysSinceMagmus),
    getDays('mini6a', daysSinceSpiritlord)
  ]
  return [
    {
      current: quantity[0],
      maxed: quantity[0] >= max[0],
      rawName: 'mini3b',
      name: 'Dilapidated_Slush',
      unlocked: account?.finishedWorlds?.World3,
      daysTillNext: getDaysTillNext('mini3b', daysSinceSlush, quantity[0])
    },
    {
      current: quantity[1],
      maxed: quantity[1] >= max[1],
      rawName: 'mini4b',
      name: 'Mutated_Mush',
      unlocked: account?.finishedWorlds?.World2,
      daysTillNext: getDaysTillNext('mini4b', daysSinceMush, quantity[1])
    },
    {
      current: quantity[2],
      maxed: quantity[2] >= max[2],
      rawName: 'mini5a',
      name: 'Domeo_Magmus',
      unlocked: account?.finishedWorlds?.World4,
      daysTillNext: getDaysTillNext('mini5a', daysSinceMagmus, quantity[2])
    },
    {
      current: quantity[3],
      maxed: quantity[3] >= max[3],
      rawName: 'mini6a',
      name: 'Demented_Spiritlord',
      unlocked: account?.finishedWorlds?.World5,
      daysTillNext: getDaysTillNext('mini6a', daysSinceSpiritlord, quantity[3])
    }
  ].filter(({ unlocked }) => unlocked);
}

export const getKillRoy = (idleonData, charactersData, accountData, serverVars) => {
  const skulls = accountData?.accountOptions?.[105];
  const killRoyKills = tryToParse(idleonData?.KRbest);
  const totalKills = Object.values(killRoyKills || {}).reduce((sum, num) => sum + num, 0);
  const totalDamageMulti = 1 + Math.floor(Math.pow(totalKills, 0.4)) / 100;
  const unlockedThirdKillRoy = accountData?.accountOptions?.[227] === 1;
  const rooms = unlockedThirdKillRoy ? 3 : 2;
  const killRoyClasses = getKillRoyClasses(rooms, accountData, serverVars);
  const upgrades = [
    {
      level: accountData?.accountOptions?.[106],
      description: 'Increases your maximum time in room. Base time is 100 seconds.',
      upgrade: '+1 Second Timer'
    },
    {
      level: accountData?.accountOptions?.[107],
      description: 'Increases chance for Talent Point drop, depends on how many Talent Point drops already got',
      upgrade: '+ Talent Drops'
    },
    {
      level: accountData?.accountOptions?.[108],
      description: 'Increases chance of dropping skulls by mobs',
      upgrade: '+1% Bonus Skulls'
    },
    {
      level: accountData?.accountOptions?.[109],
      description: 'Faster Respawn'
    },
    {
      level: accountData?.accountOptions?.[110],
      description: 'Mobs can drop Dungeon Credits now',
      upgrade: 'Dungeon Drops'
    },
    {
      level: accountData?.accountOptions?.[111],
      description: 'Mobs can drop Pearls now',
      upgrade: 'Pearl Drops'
    }
  ];
  const permanentUpgrades = killRoySkullShop?.slice(10)?.map((upgrade, i) => {
    const bonus = getKillRoyShopBonus(accountData, (i === 0 || i === 1)
      ? 0
      : (i === 2 || i === 3) ? 1 : (i === 4) ? 2 : 3);
    return {
      ...upgrade,
      level: i === 0 ? accountData?.accountOptions?.[227]
        : (i === 1)
          ? accountData?.accountOptions?.[228]
          : (i === 2)
            ? 0
            : (i === 3)
              ? accountData?.accountOptions?.[229]
              : (i === 4)
                ? accountData?.accountOptions?.[230]
                : 1,
      bonus,
      description: upgrade?.description?.replace('{', Math.floor(bonus * 100) / 100)
    }
  });
  return {
    list: deathNote.map((monster) => {
      const monsterWithIcon = { ...monster, icon: `Mface${monsters?.[monster.rawName].MonsterFace}`, name: monsters?.[monster.rawName]?.Name };
      return killRoyKills?.[monster.rawName] ? ({
        ...monsterWithIcon,
        killRoyKills: killRoyKills?.[monster.rawName] ?? 0
      }) : monsterWithIcon
    }),
    permanentUpgrades,
    totalKills,
    totalDamageMulti,
    rooms,
    killRoyClasses,
    upgrades,
    skulls
  };
}

export const getKillroyBonus = (account, index) => {
  return account?.killroy?.permanentUpgrades?.[index]?.bonus;
}
const getKillRoyShopBonus = (account, index) => {
  return 0 === index
    ? 1 + (account?.accountOptions?.[228]) / (300 + (account?.accountOptions?.[228]))
    : 1 === index
      ? 1 + ((account?.accountOptions?.[229]) / (300 + (account?.accountOptions?.[229]))) * 9
      : 2 === index
        ? 1 + ((account?.accountOptions?.[230]) / (300 + (account?.accountOptions?.[230]))) * 2
        : 1
}

export const calcTotalQuestCompleted = (characters) => {
  const mappedQuests = characters.reduce((result, { questComplete }) => {
    Object.entries(questComplete || {})?.forEach(([key, value]) => {
      if (!result[key] && value === 1) {
        result[key] = 1;
      }
    }, 0)
    return result;
  }, {});
  return Object.values(mappedQuests).reduce((sum, level) => sum + level, 0);
}

export const getKillroySchedule = (account, characters, serverVars) => {
  const unlockedThirdKillRoy = account?.accountOptions?.[227] === 1;
  const rooms = unlockedThirdKillRoy ? 3 : 2;
  const schedule = [];
  for (let i = 0; i < 20; i++) {
    schedule.push(getKillRoyClasses(rooms, account, serverVars, true, i, characters));
  }

  return schedule;
}

export const getKillRoyClasses = (rooms, account, serverVars, ignoreSkipConditions = false, iteration = 0, characters) => {
  const classes = [];
  const monstersList = [];
  const done = account?.accountOptions?.[113];
  const skipConditions = {
    1: [0],
    21: [0, 1],
    321: [0, 1, 2]
  };
  const unlockedMap = characters?.some(({ kills }) => kills?.[200] >= 0);
  const baseSeed = Math.floor((account?.timeAway?.GlobalTime + Math.round((account?.timeAway?.ShopRestock + 86400 * account?.accountOptions?.[39]))) / 604800);
  for (let i = 0; i < rooms; i++) {
    if (!ignoreSkipConditions && skipConditions[done] && skipConditions[done].includes(i)) {
      continue;
    }
    const seed = Math.round(baseSeed + iteration + (50 * i + serverVars.KillroySwap));
    const rng = new LavaRand(seed);
    const random = 3 * rng.rand();
    const classIndex = Math.max(0, Math.min(3, Math.ceil(random - Math.floor(i / 2))));
    classes.push(classIndex);
  }
  for (let i = 0; i < rooms; i++) {
    const seed = Math.round(baseSeed + iteration + (50 * i + serverVars.KillroySwap));
    const rng = new LavaRand(seed);
    const random = Math.floor(1e3 * rng.rand());
    if (random < 300 || i === 0) {
      const monsterList = randomList[Math.round(68 + i)].split(' ');
      const baseIndex = Math.floor(random / monsterList.length);
      const monsterIndex = Math.round(random - baseIndex * monsterList.length);
      monstersList.push(monsterList[monsterIndex]);
    } else {
      if (random < 400 && unlockedMap) {
        const monsterList = randomList[72].split(' ');
        const baseIndex = Math.floor(random / monsterList.length);
        const monsterIndex = Math.round(random - baseIndex * monsterList.length);
        monstersList.push(monsterList[monsterIndex])
      } else if (random < 500 && account?.summoning?.summoningStuff?.[2] >= 4) {
        const monsterList = randomList[99].split(' ');
        const baseIndex = Math.floor(random / monsterList.length);
        const monsterIndex = Math.round(random - baseIndex * monsterList.length);
        monstersList.push(monsterList[monsterIndex]);
      } else {
        const monsterList = randomList[Math.round(69 + i)].split(' ');
        const baseIndex = Math.floor(random / monsterList.length);
        const monsterIndex = Math.round(random - baseIndex * monsterList.length);
        monstersList.push(monsterList[monsterIndex]);
      }
    }
  }
  if (ignoreSkipConditions) {
    return {
      monsters: monstersList.map((mapName) => monsters[mapEnemiesArray[rawMapNames.indexOf(mapName)]]),
      classes: classes.map((classIndex) => ({
        className: classIndex === 0 ? CLASSES.Beginner : classIndex === 1 ? CLASSES.Warrior : classIndex === 2 ? CLASSES.Archer : CLASSES.Mage,
        classIndex: classIndex === 0 ? 1 : classIndex === 1 ? 6 : classIndex === 2 ? 18 : 30
      })),
      date: Math.floor((baseSeed + iteration - 1) * 604800 * 1000)
    };
  }

  return classes.map((classIndex) => {
    return classIndex === 0 ? CLASSES.Beginner : classIndex === 1 ? CLASSES.Warrior : classIndex === 2 ? CLASSES.Archer : CLASSES.Mage
  });
}

// a.engine.getGameAttribute("OptionsListAccount")[310] - event currency
export const getEventShopBonus = (account, bonusId) => {
  if (!account?.accountOptions?.[311]) return false;
  return -1 !== (account?.accountOptions?.[311]).indexOf(number2letter[bonusId]);
}