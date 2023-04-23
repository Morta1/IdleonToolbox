import { lavaLog, tryToParse } from "../utility/helpers";
import { filteredGemShopItems, filteredLootyItems, keysMap } from "./parseMaps";
import { items, slab } from "../data/website-data";
import { talentPagesMap } from "./talents";
import { getMealsBonusByEffectOrStat } from "./cooking";
import { getBubbleBonus, getVialsBonusByEffect, getVialsBonusByStat } from "./alchemy";
import { getStampsBonusByEffect } from "./stamps";
import { getAchievementStatus } from "./achievements";
import { getJewelBonus, getLabBonus } from "./lab";
import { getAtomBonus } from "./atomCollider";
import { getPrayerBonusAndCurse } from "./prayers";
import { getShrineBonus } from "./shrines";

export const getLibraryBookTimes = (idleonData, account) => {
  const { bookCount, libTime } = calcBookCount(account, idleonData);
  const timeAway = account?.timeAway;
  const breakpoints = [16, 18, 20].map((maxCount) => {
    return {
      breakpoint: maxCount,
      time: calcTimeToXBooks(bookCount, maxCount, account, idleonData) - timeAway?.BookLib
    }
  })
  return {
    bookCount,
    next: getTimeToNextBooks(bookCount, account, idleonData) - libTime,
    breakpoints
  }
}

const calcBookCount = (account, idleonData) => {
  const baseBookCount = account?.accountOptions?.[55];
  const timeAway = account?.timeAway;
  let libTime = timeAway?.BookLib;
  let afk = (new Date).getTime() / 1e3 - timeAway.GlobalTime;
  let bookCount = baseBookCount;
  if (afk > 300) libTime += afk;
  while (libTime > getTimeToNextBooks(bookCount, account, idleonData)) {
    libTime -= getTimeToNextBooks(bookCount, account, idleonData);
    bookCount += 1;
  }
  return { bookCount, libTime };
}

const calcTimeToXBooks = (bookCount, maxCount, account, idleonData) => {
  let time = 0;
  for (let i = bookCount; i < maxCount; i++) {
    time += getTimeToNextBooks(i, account, idleonData);
  }
  return time;
}

export const getTimeToNextBooks = (bookCount, account, idleonData) => {
  const towersLevels = tryToParse(idleonData?.Tower) || idleonData?.Tower;
  const spelunkerObolMulti = getLabBonus(account?.lab.labBonuses, 8); // gem multi
  const blackDiamondRhinestone = getJewelBonus(account?.lab?.jewels, 16, spelunkerObolMulti);
  const mealBonus = 1 + getMealsBonusByEffectOrStat(account, 'Library_checkout_Speed', null, blackDiamondRhinestone) / 100;
  const bubbleBonus = getBubbleBonus(account?.alchemy?.bubbles, 'kazam', 'IGNORE_OVERDUES', false);
  const vialBonus = getVialsBonusByEffect(account?.alchemy?.vials, 'Talent_Book_Library');
  const stampBonus = getStampsBonusByEffect(account?.stamps, 'Faster_Books')
  const libraryTowerLevel = towersLevels?.[1];
  const libraryBooker = getAtomBonus(account?.atoms?.atoms, 'Oxygen_-_Library_Booker');
  const math = 3600 / ((mealBonus * (1 + libraryBooker / 100) * (1 + (5 * libraryTowerLevel + bubbleBonus + ((vialBonus)
    + (stampBonus + Math.min(30, Math.max(0, 30 * getAchievementStatus(account?.achievements, 145)))))) / 100))) * 4;

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
    lootedItems: lootyRaw?.length,
    missingItems,
    totalItems: slab?.length,
    rawLootedItems: lootyRaw?.length
  };
};

export const getCurrencies = (idleonData) => {
  const keys = idleonData?.CurrenciesOwned?.["KeysAll"] || idleonData?.CYKeysAll;
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
  return keys.reduce((res, keyAmount, index) => (keyAmount > 0 ? [...res,
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

const getAmountPerDay = ({ name, dialogThreshold }, characters) => {
  return characters.reduce((res, { npcDialog }) => {
    return npcDialog?.[name] > dialogThreshold ? res + 1 : res;
  }, 0);
}

export const getBundles = (idleonData) => {
  const bundlesRaw = tryToParse(idleonData?.BundlesReceived) || idleonData?.BundlesReceived;
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

export const isArenaBonusActive = (arenaWave, waveReq, bonusNumber) => {
  const waveReqArray = waveReq.split(" ");
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
  const stampMatCapMath = 1 + mattyBagStampBonus / 100;
  const gemPurchaseMath = 1 + (25 * gemShopCarryBonus) / 100;
  const additionalCapMath = 1 + (masonJarStampBonus + starSignExtraCap) / 100; // ignoring star sign
  const talentBonusMath = 1 + extraBagsTalentBonus / 100;
  const bCraftCap = bag?.capacity;
  return Math.floor(bCraftCap * stampMatCapMath * gemPurchaseMath * additionalCapMath * talentBonusMath * allCapacity);
};

export const getSpeedBonusFromAgility = (agility = 0) => {
  let base = (Math.pow(agility + 1, 0.37) - 1) / 40;
  if (agility > 1000) {
    base = ((agility - 1000) / (agility + 2500)) * 0.5 + 0.297;
  }
  return base * 2 + 1;
};

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

export const getHighestLevelCharacter = (characters) => {
  const levels = characters?.map(({ level }) => level);
  return Math.max(...levels);
};

export const getGoldenFoodMulti = (familyBonus, equipmentGoldFoodBonus, hungryForGoldTalentBonus, goldenAppleStamp, goldenFoodAchievement, goldenFoodBubbleBonus, goldenFoodSigilBonus) => {
  return Math.max(familyBonus, 1) + (equipmentGoldFoodBonus + (hungryForGoldTalentBonus + goldenAppleStamp + goldenFoodAchievement + goldenFoodBubbleBonus + goldenFoodSigilBonus)) / 100;
};

export const getGoldenFoodBonus = (goldenFoodMulti, amount, stack) => {
  if (!amount || !stack) return 0;
  return amount * goldenFoodMulti * 0.05 * lavaLog(1 + stack) * (1 + lavaLog(1 + stack) / 2.14);
};

export const getAllSkillExp = (sirSavvyStarSign, cEfauntCardBonus, goldenHamBonus, skillExpCardSetBonus, summereadingShrineBonus, ehexpeeStatueBonus, unendingEnergyBonus, skilledDimwitCurse, theRoyalSamplerCurse, equipmentBonus, maestroTransfusionTalentBonus, duneSoulLickBonus, dungeonSkillExpBonus, myriadPostOfficeBox) => {
  return sirSavvyStarSign + (cEfauntCardBonus + goldenHamBonus) + (skillExpCardSetBonus + summereadingShrineBonus + ehexpeeStatueBonus + (unendingEnergyBonus - skilledDimwitCurse - theRoyalSamplerCurse + (equipmentBonus + (maestroTransfusionTalentBonus + (duneSoulLickBonus + dungeonSkillExpBonus + myriadPostOfficeBox)))));
};

export const calculateLeaderboard = (characters) => {
  const leaderboardObject = characters.reduce((res, { name, skillsInfo }) => {
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
        color: level < 300 ? 'white' : level >= 300 && level < 400 ? '#ffc277' : level >= 400 && level < 600 ? '#cadadb' : level >= 600 && level < 1000 ? 'gold' : '#56ccff'
      }
    };
  }, allSkills);
}

const getSkillRank = (level) => {
  return 150 > level ? 0 : 200 > level ? 1 : 300 > level ? 2 : 400 > level ? 3 : 500 > level ? 4 : 750 > level ? 5 : 1e3 > level ? 6 : 7;
}

const getSkillRiftBonus = (rift, skillRank, index) => {
  return rift?.[0] < 15 ? 0 : skillRank > index ? 1 : 0;
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
      sum += 10 * getSkillRiftBonus(rift, skillRank, Math.round(riftBonusIndex + 2));
    } else if (riftBonusIndex === 3) {
      sum += getSkillRiftBonus(rift, skillRank, Math.round(riftBonusIndex + 2));
    } else if (riftBonusIndex === 4) {
      sum += 25 * getSkillRiftBonus(rift, skillRank, Math.round(riftBonusIndex + 2));
    } else if (0 !== index && 2 !== index && 3 !== index && 5 !== index && 6 !== index && 8 !== index && 8 !== index) {
      sum += 5 * getSkillRiftBonus(rift, skillRank, Math.round(riftBonusIndex + 2));
    }
    return sum;
  }, 7);
}

export const getExpReq = (skillIndex, t) => {
  return 0 === skillIndex ?
    (15 + Math.pow(t, 1.9) + 11 * t) * Math.pow(1.208 - Math.min(0.164, (0.215 * t) / (t + 100)), t) - 15 :
    2 === skillIndex ? (15 + Math.pow(t, 2) + 13 * t) * Math.pow(1.225 - Math.min(0.114, (0.135 * t) / (t + 50)), t) - 26 :
      8 === skillIndex ? (71 > t ? ((10 + Math.pow(t, 2.81) + 4 * t) * Math.pow(1.117 - (0.135 * t) / (t + 5), t) - 6) * (1 + Math.pow(t, 1.72) / 300) :
          (((10 + Math.pow(t, 2.81) + 4 * t) * Math.pow(1.003, t) - 6) / 2.35) * (1 + Math.pow(t, 1.72) / 300)) :
        9 === skillIndex ? (15 + Math.pow(t, 1.3) + 6 * t) * Math.pow(1.17 - Math.min(0.07, (0.135 * t) / (t + 50)), t) - 26 :
          (15 + Math.pow(t, 2) + 15 * t) * Math.pow(1.225 - Math.min(0.18, (0.135 * t) / (t + 50)), t) - 30;
}

export const getGiantMobChance = (character, account) => {
  const giantsAlreadySpawned = account?.accountOptions?.[57];
  // const tachionOfTitansPrayer = getPrayerBonusAndCurse(character?.activePrayers, 'Tachion_of_the_Titans')?.bonus > 5;
  const glitterbugPrayer = getPrayerBonusAndCurse(character?.activePrayers, 'Glitterbug')?.curse;
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