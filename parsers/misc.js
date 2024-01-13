import { lavaLog, tryToParse } from '../utility/helpers';
import { filteredGemShopItems, filteredLootyItems, keysMap } from './parseMaps';
import { classFamilyBonuses, companions, items, mapNames, randomList, rawMapNames, slab } from '../data/website-data';
import { checkCharClass, getTalentBonus, mainStatMap, talentPagesMap } from './talents';
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

export const getLibraryBookTimes = (idleonData, characters, account) => {
  const { bookCount, libTime } = calcBookCount(account, characters, idleonData);
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
    next: getTimeToNextBooks(bookCount, account, characters, idleonData) - libTime,
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
  while (libTime > getTimeToNextBooks(bookCount, account, characters, idleonData)) {
    libTime -= getTimeToNextBooks(bookCount, account, characters, idleonData);
    bookCount += 1;
  }
  return { bookCount, libTime };
}

const calcTimeToXBooks = (bookCount, maxCount, account, characters, idleonData) => {
  let time = 0;
  for (let i = bookCount; i < maxCount; i++) {
    time += getTimeToNextBooks(i, account, characters, idleonData);
  }
  return time;
}

export const getTimeToNextBooks = (bookCount, account, characters, idleonData) => {
  const towersLevels = tryToParse(idleonData?.Tower) || idleonData?.Tower;
  const spelunkerObolMulti = getLabBonus(account?.lab.labBonuses, 8); // gem multi
  const blackDiamondRhinestone = getJewelBonus(account?.lab?.jewels, 16, spelunkerObolMulti);
  const mealBonus = 1 + getMealsBonusByEffectOrStat(account, 'Library_checkout_Speed', null, blackDiamondRhinestone) / 100;
  const bubbleBonus = getBubbleBonus(account?.alchemy?.bubbles, 'kazam', 'IGNORE_OVERDUES', false);
  const vialBonus = getVialsBonusByEffect(account?.alchemy?.vials, 'Talent_Book_Library');
  const stampBonus = getStampsBonusByEffect(account?.stamps, 'Talent_Book_Library_Refresh_Speed')
  const libraryTowerLevel = towersLevels?.[1];
  const libraryBooker = getAtomBonus(account, 'Oxygen_-_Library_Booker');
  const superbit = isSuperbitUnlocked(account, 'Library_Checkouts');
  let superbitBonus = 0;
  if (superbit) {
    superbitBonus = superbit?.totalBonus;
  }
  const math = 3600 / ((mealBonus * (1 + libraryBooker / 100) * (1 + (5 * libraryTowerLevel + bubbleBonus + ((vialBonus)
    + (stampBonus + superbitBonus + Math.min(30, Math.max(0, 30 * getAchievementStatus(account?.achievements, 145)))))) / 100))) * 4;

  return Math.round(math * (1 + (10 * Math.pow(bookCount, 1.4)) / 100));
}

export const getLooty = (idleonData) => {
  const lootyRaw = idleonData?.Cards?.[1] || tryToParse(idleonData?.Cards1);
  const allItems = JSON.parse(JSON.stringify(items)); // Deep clone
  const slabItems = slab?.map((name) => ({
    name: allItems?.[name]?.displayName,
    rawName: name,
    obtained: lootyRaw?.includes(name),
    onRotation: filteredGemShopItems?.[name]
  }))
  const missingItems = slabItems?.filter(({
                                            obtained,
                                            rawName
                                          }) => !obtained && !filteredLootyItems?.[rawName])?.length;
  return {
    slabItems,
    lootyRaw,
    lootedItems: lootyRaw?.length,
    missingItems,
    totalItems: slab?.length,
    rawLootedItems: lootyRaw?.length
  };
};

export const getCurrencies = (idleonData) => {
  const keys = idleonData?.CurrenciesOwned?.['KeysAll'] || idleonData?.CYKeysAll;
  if (idleonData?.CurrenciesOwned) {
    return {
      ...idleonData?.CurrenciesOwned,
      KeysAll: getKeysObject(keys)
    };
  }

  return {
    WorldTeleports: idleonData?.CYWorldTeleports,
    KeysAll: getKeysObject(keys),
    ColosseumTickets: idleonData?.CYColosseumTickets,
    ObolFragments: idleonData?.CYObolFragments,
    SilverPens: idleonData?.CYSilverPens,
    GoldPens: idleonData?.CYGoldPens,
    DeliveryBoxComplete: idleonData?.CYDeliveryBoxComplete,
    DeliveryBoxStreak: idleonData?.CYDeliveryBoxStreak,
    DeliveryBoxMisc: idleonData?.CYDeliveryBoxMisc,
    minigamePlays: idleonData?.PVMinigamePlays_1,
  };
};

export const enhanceColoTickets = (tickets, characters, account) => {
  const npcs = {
    0: { name: 'Typhoon', dialogThreshold: 3, daysSinceIndex: 15 },
    1: { name: 'Centurion', dialogThreshold: 4, daysSinceIndex: 35 },
    2: { name: 'Lonely_Hunter', dialogThreshold: 6, daysSinceIndex: 56 },
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

export const getHighestLevelOfClass = (characters, className) => {
  const highest = characters?.reduce((res, { level, class: cName }) => {
    if (res?.[cName]) {
      res[cName] = Math.max(res?.[cName], level);
    } else {
      res[cName] = level;
    }
    return res;
  }, {});
  const allClasses = talentPagesMap?.[className];
  const classAlias = allClasses?.find((cName) => highest?.[cName]);
  return highest?.[classAlias];
};

export const getCharacterByHighestLevel = (characters, className) => {
  let filteredObjects = characters.filter(obj => obj.class === className);
  return filteredObjects.reduce((maxObj, currentObj) => {
    return currentObj.level > maxObj.level ? currentObj : maxObj;
  }, filteredObjects[0]);
};

export const getCharacterByHighestSkillLevel = (characters, className, skillName) => {
  const allClasses = talentPagesMap?.[className];
  let filteredObjects = characters.filter(obj => allClasses.includes(obj.class));
  return filteredObjects.reduce((maxObj, currentObj) => {
    return currentObj?.skillsInfo?.[skillName]?.level > maxObj?.skillsInfo?.[skillName]?.level ? currentObj : maxObj;
  }, filteredObjects[0]);
};

export const getHighestLevelCharacter = (characters) => {
  const levels = characters?.map(({ level }) => level);
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
          .sort(([_, { level: aLevel }], [__, { level: bLevel }]) => bLevel - aLevel)
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
  const array = new Array(15).fill(1);
  return array?.reduce((sum, skill, index) => {
    const skillRank = getSkillRankByIndex(skills, index);
    if (riftBonusIndex === 1) {
      sum += 10 * isMasteryBonusUnlocked(rift, skillRank, Math.round(riftBonusIndex + 2));
    } else if (riftBonusIndex === 3) {
      sum += isMasteryBonusUnlocked(rift, skillRank, Math.round(riftBonusIndex + 2));
    } else if (riftBonusIndex === 4) {
      sum += 25 * isMasteryBonusUnlocked(rift, skillRank, Math.round(riftBonusIndex + 2));
    } else if (0 !== index && 2 !== index && 3 !== index && 5 !== index && 6 !== index && 8 !== index && 8 !== index) {
      sum += 5 * isMasteryBonusUnlocked(rift, skillRank, Math.round(riftBonusIndex + 2));
    }
    return sum;
  }, 7);
}

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

export const getGoldenFoodBonus = (foodName, character, account) => {
  const goldenFood = character?.food?.find(({ name }) => name === foodName);
  const highestLevelShaman = getHighestLevelOfClass(account?.charactersLevels, 'Bubonic_Conjuror') ?? getHighestLevelOfClass(account?.charactersLevels, 'Shaman') ?? 0;
  const theFamilyGuy = getTalentBonus(character?.talents, 3, 'THE_FAMILY_GUY');
  const familyBonus = getFamilyBonusBonus(classFamilyBonuses, 'GOLDEN_FOODS', highestLevelShaman);
  const isShaman = talentPagesMap[character?.class]?.includes('Shaman');
  const amplifiedFamilyBonus = familyBonus * (theFamilyGuy > 0 ? (1 + theFamilyGuy / 100) : 1) || 0;
  const equipmentGoldFoodBonus = getStatsFromGear(character, 8, account);
  const hungryForGoldTalentBonus = getTalentBonus(character?.talents, 1, 'HAUNGRY_FOR_GOLD');
  const goldenAppleStamp = getStampsBonusByEffect(account?.stamps, 'Effect_from_Golden_Food._Sparkle_sparkle!');
  const goldenFoodAchievement = getAchievementStatus(account?.achievements, 37);
  const goldenFoodBubbleBonus = getBubbleBonus(account?.alchemy?.bubbles, 'power', 'SHIMMERON', false,
    mainStatMap?.[character?.class] === 'strength');
  const goldenFoodSigilBonus = getSigilBonus(account?.alchemy?.p2w?.sigils, 'EMOJI_VEGGIE');
  const goldenFoodMulti = Math.max(isShaman ? amplifiedFamilyBonus : familyBonus, 1)
    + (equipmentGoldFoodBonus
      + (hungryForGoldTalentBonus
        + (goldenAppleStamp
          + (goldenFoodAchievement
            + (goldenFoodBubbleBonus
              + goldenFoodSigilBonus))))) / 100;
  if (!goldenFood?.Amount || !goldenFood?.amount) return 0;
  return goldenFood?.Amount * goldenFoodMulti * 0.05 * lavaLog(1 + goldenFood?.amount) * (1 + lavaLog(1 + goldenFood?.amount) / 2.14);
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
  return eventList
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

export const getHighestCapacityCharacter = (item, characters, account) => {
  return characters?.reduce((res, character) => {
    const itemCapacity = item?.itemType === 'Equip' ? 1 : getItemCapacity(item?.typeGen, character, account);
    const maxCapacity = character?.inventorySlots * itemCapacity;
    if (maxCapacity > res?.maxCapacity) {
      res = {
        capacityPerSlot: itemCapacity,
        maxCapacity,
        character: character?.name
      }
    }
    return res;
  }, { capacityPerSlot: 0, maxCapacity: 0, character: '' })
}
export const getAllCap = (character, account) => {
  const guildBonus = getGuildBonusBonus(account?.guild?.guildBonuses, 2);
  const talentBonus = getTalentBonus(character?.starTalents, null, 'TELEKINETIC_STORAGE');
  const shrineBonus = getShrineBonus(account?.shrines, 3, character?.mapIndex, account?.cards, account?.sailing?.artifacts);
  const prayerCurse = getPrayerBonusAndCurse(character?.activePrayers, 'Zerg_Rushogen', account)?.curse;
  const prayerBonus = getPrayerBonusAndCurse(character?.activePrayers, 'Ruck_Sack', account)?.bonus;
  const bribeBonus = account?.bribes?.[23]?.done ? account?.bribes?.[23]?.value : 0;

  return (1 + (guildBonus + talentBonus) / 100)
    * (1 + shrineBonus / 100) * Math.max(1 - prayerCurse / 100, 0.4)
    * (1 + (prayerBonus + bribeBonus) / 100);
}
export const getItemCapacity = (type = '', character, account) => {
  const gemshop = account?.gemShopPurchases?.find((value, index) => index === 58);
  const starSignBonus = getStarSignBonus(character, account, 'Carry_Cap');
  const minCapStamps = getStampsBonusByEffect(account?.stamps, 'Carrying_Capacity_for_Mining_Items', character);
  const chopCapStamps = getStampsBonusByEffect(account?.stamps, 'Carrying_Capacity_for_Choppin\'_Items', character);
  const fishCapStamps = getStampsBonusByEffect(account?.stamps, 'Carry_Capacity_for_Fishing_Items', character);
  const catchCapStamps = getStampsBonusByEffect(account?.stamps, 'Carry_Capacity_for_Catching_Items', character);
  const matCapStamps = getStampsBonusByEffect(account?.stamps, 'Carrying_Capacity_for_Material_Items', character);
  const allCarryStamps = getStampsBonusByEffect(account?.stamps, 'Carry_Capacity_for_ALL_item_types!');
  const talentBonus = getTalentBonus(character?.talents, 0, 'EXTRA_BAGS');
  const allCap = getAllCap(character, account);


  return 'bOre' === type || 'bBar' === type || 'cOil' === type ? Math.floor(character?.maxCarryCap?.Mining
    * (1 + minCapStamps / 100) * (1 + (25 * gemshop) / 100)
    * (1 + (allCarryStamps + starSignBonus) / 100)
    * allCap) : 'dFish' === type ? Math.floor(character?.maxCarryCap?.Fishing
    * (1 + (25 * gemshop) / 100) * (1 + fishCapStamps / 100) *
    (1 + (allCarryStamps + starSignBonus) / 100)
    * allCap) : 'dBugs' === type ? Math.floor(character?.maxCarryCap?.Bugs
    * (1 + (25 * gemshop) / 100) * (1 + catchCapStamps / 100)
    * (1 + (allCarryStamps + starSignBonus) / 100)
    * allCap) : 'bLog' === type || 'bLeaf' === type ? Math.floor(character?.maxCarryCap?.Chopping
    * (1 + chopCapStamps / 100) * (1 + (25 * gemshop) / 100) *
    (1 + (allCarryStamps + starSignBonus) / 100) *
    allCap) : 'cFood' === type ? Math.floor(character?.maxCarryCap?.Foods *
      (1 + (25 * gemshop) / 100) * (1 + (allCarryStamps
        + starSignBonus) / 100) * allCap) :
    'dCritters' === type ? Math.floor(character?.maxCarryCap?.Critters * (1 + (25 * gemshop) / 100) *
        (1 + (allCarryStamps + starSignBonus) / 100) * allCap)
      : 'dSouls' === type ? Math.floor(character?.maxCarryCap?.Souls * (1 + (25 * gemshop) / 100) *
          (1 + (allCarryStamps + starSignBonus) / 100) * allCap)
        : 'dCurrency' === type || 'dQuest' === type || 'dStatueStone' === type ? 999999 : 'bCraft' === type
          ? Math.floor(character?.maxCarryCap?.bCraft
            * (1 + matCapStamps / 100)
            * (1 + (25 * gemshop) / 100) * (1 + (allCarryStamps + starSignBonus) / 100)
            * (1 + talentBonus / 100) * allCap)
          : 'dExpOrb' === type || 'dStone' === type || 'dFishToolkit' === type ? 999999 :
            'fillerz' === type ? character?.maxCarryCap?.fillerz : 'd' === type.charAt(0) ? 999999 : 2
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

export const getFoodBonus = (character, account, bonusName) => {
  const foodBonus = getPlayerFoodBonus(character, account);
  return character?.food?.reduce((res, {
    Amount,
    Effect
  }) => res + (Effect === bonusName ? Amount * foodBonus : 0), 0);
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
  }, {})
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