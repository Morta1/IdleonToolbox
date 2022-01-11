import { anvilUpgradeCost, deathNote, items, mapEnemies, monsters, quests, talents } from "../data/website-data";
import { getDeathNoteRank, round } from "../Utilities";
import { getDaysInMonth, intervalToDuration } from 'date-fns';
import { growth } from "../components/General/calculationHelper";

export const createSerializedData = (data, charNames) => {
  const PlayerDATABASE = charNames?.map((charName, index) => {
    const characterDetails = Object.entries(data)?.reduce((res, [key, details]) => {
      const reg = new RegExp(`_${index}`, 'g');
      if (reg.test(key)) {
        let updatedDetails = tryToParse(details);
        let updatedKey = key;
        let arr = [];
        switch (true) {
          case key.includes('EquipOrder'): {
            updatedKey = `EquipmentOrder_${index}`;
            details = createArrayOfArrays(details);
            break;
          }
          case key.includes('EquipQTY'): {
            updatedKey = `EquipmentQuantity_${index}`;
            details = createArrayOfArrays(details);
            break;
          }
          case key.includes('AnvilPA_'): {
            updatedDetails = createArrayOfArrays(details);
            break;
          }
          case key.includes('EMm0'): {
            updatedKey = `EquipmentMap_${index}`;
            arr = [...(res?.[updatedKey] || []), createIndexedArray(updatedDetails)];
            break;
          }
          case key.includes('EMm1'): {
            updatedKey = `EquipmentMap_${index}`;
            arr = [...(res?.[updatedKey] || []), createIndexedArray(updatedDetails)];
            break;
          }
          case key.includes('ItemQTY'): {
            updatedKey = `ItemQuantity_${index}`;
            break;
          }
          case key.includes('PVStatList'): {
            updatedKey = `PersonalValuesMap_${index}`;
            updatedDetails = { ...(res?.[updatedKey] || {}), StatList: tryToParse(details) };
            break;
          }
          case key.includes('PVtStarSign'): {
            updatedKey = `PersonalValuesMap_${index}`;
            updatedDetails = { ...(res?.[updatedKey] || {}), StarSign: tryToParse(details) };
            break;
          }
          case key.includes('ObolEqO0'): {
            updatedKey = `ObolEquippedOrder_${index}`;
            break;
          }
          case key.includes('ObolEqMAP'): {
            updatedKey = `ObolEquippedMap_${index}`;
            break;
          }
          case key.includes('SL_'): {
            updatedKey = `SkillLevels_${index}`;
            break;
          }
          case key.includes('SM_'): {
            updatedKey = `SkillLevelsMAX_${index}`;
            break;
          }
          case key.includes('KLA_'): {
            updatedKey = `KillsLeft2Advance_${index}`;
            break;
          }
          case key.includes('AtkCD_'): {
            updatedKey = `AttackCooldowns_${index}`;
            break;
          }
          case key.includes('POu_'): {
            updatedKey = `PostOfficeInfo_${index}`;
            break;
          }
          case key.includes('PTimeAway'): {
            updatedKey = `PlayerAwayTime_${index}`;
            updatedDetails = updatedDetails * 1e3;
            break;
          }
        }
        return { ...res, [updatedKey]: arr?.length ? arr : updatedDetails }
      }
      return res;
    }, {});
    return {
      name: charName,
      ...characterDetails
    }
  });
  const serialized = {
    Cards: [tryToParse(data?.Cards0), tryToParse(data?.Cards1)],
    ObolEquippedOrder: [null, tryToParse(data?.ObolEqO1)],
    ObolEquippedMap: [null, tryToParse(data?.ObolEqMAPz1)],
    StampLevel: tryToParse(data?.StampLv),
    StatueG: tryToParse(data?.StuG),
    MoneyBANK: data?.MoneyBANK,
    ChestOrder: tryToParse(data?.ChestOrder),
    ChestQuantity: tryToParse(data?.ChestQuantity),
    ShrineInfo: tryToParse(data?.Shrine),
    FamilyValuesMap: {
      ColosseumHighscores: data?.FamValColosseumHighscores,
      MinigameHiscores: data?.FamValMinigameHiscores
    },
    GemItemsPurchased: tryToParse(data?.GemItemsPurchased),
    ShopStock: tryToParse(data?.ShopStock),
    CauldronInfo: createArrayOfArrays(data?.CauldronInfo),
    BribeStatus: tryToParse(data?.BribeStatus),
    StarSignProg: tryToParse(data?.SSprog),
    StarSignsUnlocked: tryToParse(data?.StarSg),
    AchieveReg: tryToParse(data?.AchieveReg),
    SteamAchieve: tryToParse(data?.SteamAchieve),
    Refinery: tryToParse(data?.Refinery),
    Printer: tryToParse(data?.Print),
    CauldronBubbles: tryToParse(data?.CauldronBubbles),
    PrayersUnlocked: tryToParse(data?.PrayOwned),
    TimeAway: tryToParse(data?.TimeAway),
    Tasks: [
      tryToParse(data?.TaskZZ0),
      tryToParse(data?.TaskZZ1),
      tryToParse(data?.TaskZZ2),
      tryToParse(data?.TaskZZ3),
      tryToParse(data?.TaskZZ4),
      tryToParse(data?.TaskZZ5),
    ],
    BundlesReceived: tryToParse(data?.BundlesReceived),
    SaltLick: tryToParse(data?.SaltLick),
    DungUpg: tryToParse(data?.DungUpg),
    CurrenciesOwned: {
      WorldTeleports: data?.CYWorldTeleports,
      KeysAll: data?.CYKeysAll,
      ColosseumTickets: data?.CYColosseumTickets,
      ObolFragments: data?.CYObolFragments,
      SilverPens: data?.CYSilverPens,
      GoldPens: data?.CYGoldPens,
      DeliveryBoxComplete: data?.CYDeliveryBoxComplete,
      DeliveryBoxStreak: data?.CYDeliveryBoxStreak,
      DeliveryBoxMisc: data?.CYDeliveryBoxMisc,
    },
  };

  return { serializedData: serialized, chars: PlayerDATABASE };
}

export const getGlobalTime = (data) => {
  const timeAway = tryToParse(data?.TimeAway);
  return timeAway?.GlobalTime;
}

const createIndexedArray = (object) => {
  const highest = Math.max(...Object.keys(object));
  let result = [];
  for (let i = 0; i <= highest; i++) {
    if (object?.[i]) {
      result[i] = object?.[i];
    } else {
      result[i] = {};
    }
  }
  return result;
}

const createArrayOfArrays = (array) => {
  return array?.map((object) => {
    delete object?.length;
    return Object.values(object);
  });
}

const tryToParse = (str) => {
  try {
    return JSON.parse(str);
  } catch (err) {
    return str;
  }
}

export const calculateAfkTime = (playerTime) => {
  return parseFloat(playerTime) * 1e3;
}

export const getDuration = (start, end) => {
  const parsedStartTime = new Date(start);
  const parsedEndTime = new Date(end);
  let duration = intervalToDuration({ start: parsedStartTime, end: parsedEndTime });
  if (duration?.months) {
    const daysInMonth = getDaysInMonth(new Date())
    duration.days = duration.days + daysInMonth;
  }
  return duration;
}

export const getEquippedCardBonus = (cards, cardInd) => {
  const card = cards?.equippedCards?.find(({ cardIndex }) => cardIndex === cardInd);
  if (!card) return 0;
  return calcCardBonus(card);
}

export const calcCardBonus = (card) => {
  if (!card) return 0;
  return (card?.bonus * ((card?.stars ?? 0) + 1)) ?? 0;
}

export const getStampBonus = (stamps, stampTree, stampName, skillLevel) => {
  const stamp = stamps?.[stampTree]?.find(({ rawName }) => rawName === stampName);
  if (!stamp) return 0;
  const normalLevel = stamp?.level * 10 / stamp?.reqItemMultiplicationLevel;
  const lvlDiff = 3 + (normalLevel - 3) * Math.pow(skillLevel / (normalLevel - 3), 0.75)
  const reducedLevel = lvlDiff * stamp?.reqItemMultiplicationLevel / 10
  if (skillLevel > 0 && reducedLevel < stamp?.level && stampTree === 'skills') {
    return growth(stamp?.func, reducedLevel, stamp?.x1, stamp?.x2) ?? 0;
  }
  return growth(stamp?.func, stamp?.level, stamp?.x1, stamp?.x2) ?? 0;
}

export const getTalentBonus = (talents, talentTree, talentName, yBonus) => {
  const talentsObj = talentTree !== null ? talents?.[talentTree]?.orderedTalents : talents?.orderedTalents;
  const talent = talentsObj?.find(({ name }) => name === talentName);
  if (!talent) return 0;
  if (yBonus) {
    return growth(talent?.funcY, talent?.level, talent?.y1, talent?.y2) ?? 0
  }
  return growth(talent?.funcX, talent?.level, talent?.x1, talent?.x2) ?? 0;
}

export const getSaltLickBonus = (saltLicks, saltIndex) => {
  const saltLick = saltLicks?.find(({ rawName }) => rawName === saltIndex);
  if (saltLick === 0) return 0;
  return round(saltLick.baseBonus * (saltLick.level ?? 0)) ?? 0;
}

export const getShrineBonus = (shrines, shrineIndex, playerMapId, cards, cardIndex) => {
  const shrine = shrines?.[shrineIndex];
  if (shrine?.level === 0 || playerMapId !== shrine?.mapId) {
    return 0;
  }
  const cardBonus = getEquippedCardBonus(cards, cardIndex) ?? 0;
  return shrine?.bonus * (1 + cardBonus / 100);
}

export const getPrayerBonusAndCurse = (prayers, prayerName) => {
  const prayer = prayers?.find(({ name }) => name === prayerName);
  if (!prayer) return { bonus: 0, curse: 0 };
  const bonus = prayer.x1 + (prayer.x1 * (prayer.level - 1)) / 10;
  const curse = prayer.x2 + (prayer.x2 * (prayer.level - 1)) / 10;
  return { bonus, curse }
}

export const getActiveBubbleBonus = (equippedBubbles, bubbleName) => {
  const bubble = equippedBubbles?.find(({ rawName }) => rawName === bubbleName);
  if (!bubble) return 0;
  return growth(bubble?.func, bubble?.level, bubble?.x1, bubble?.x2) ?? 0;
}

export const getBubbleBonus = (cauldrons, cauldronName, bubbleName) => {
  const bubble = cauldrons?.[cauldronName]?.find(({ rawName }) => rawName === bubbleName);
  if (!bubble) return 0;
  return growth(bubble?.func, bubble?.level, bubble?.x1, bubble?.x2) ?? 0;
}

export const getDungeonStatBonus = (dungeonStats, statName) => {
  const stat = dungeonStats?.find(({ effect }) => effect === statName);
  if (!stat) return 0;
  return growth(stat?.func, stat?.level, stat?.x1, stat?.x2) ?? 0;
}

export const getAllCapsBonus = (guildBonus, telekineticStorageBonus, shrineBonus, zergPrayer, ruckSackPrayer) => {
  return (
    (1 + (guildBonus + telekineticStorageBonus) / 100) *
    (1 + (shrineBonus / 100)) *
    Math.max(1 - zergPrayer / 100, 0.4) *
    (1 + ruckSackPrayer / 100)
  );
}


export const getAllSkillExp = (
  sirSavvyStarSign,
  cEfauntCardBonus,
  goldenHamBonus,
  skillExpCardSetBonus,
  summereadingShrineBonus,
  ehexpeeStatueBonus,
  unendingEnergyBonus,
  skilledDimwitCurse,
  theRoyalSamplerCurse,
  equipmentBonus,
  maestroTransfusionTalentBonus,
  duneSoulLickBonus,
  dungeonSkillExpBonus,
) => {
  return sirSavvyStarSign + cEfauntCardBonus + goldenHamBonus +
    skillExpCardSetBonus + summereadingShrineBonus + ehexpeeStatueBonus +
    unendingEnergyBonus - skilledDimwitCurse - theRoyalSamplerCurse + equipmentBonus +
    maestroTransfusionTalentBonus + duneSoulLickBonus + dungeonSkillExpBonus;
}

export const getSmithingExpMutli = (focusedSoulTalentBonus, happyDudeTalentBonus, fireForgeCardBonus, cinderForgeCardBonus, blackSmithBoxBonus0, allSkillExp, leftHandOfLearningTalentBonus) => {
  const talentsBonus = 1 + (focusedSoulTalentBonus + happyDudeTalentBonus) / 100;
  const cardsBonus = 1 + (fireForgeCardBonus + cinderForgeCardBonus) / 100;
  return Math.max(0.1, talentsBonus * cardsBonus * (1 + blackSmithBoxBonus0 / 100) + (allSkillExp + leftHandOfLearningTalentBonus / 100));
}

export const getAnvilExp = (xpPoints, smithingExp) => {
  const baseExp = 1 + (3 * xpPoints / 100) * smithingExp;
  if (baseExp > 20) return baseExp;
  return Math.min(20 + ((baseExp - 20) / baseExp - 20 + 70) * 50, 75);
}

export const getPlayerCapacity = (bag, capacities) => {
  if (bag) {
    return getMaterialCapacity(bag, capacities);
  }
  return bag?.capacity;
}

const getMaterialCapacity = (bag, capacities) => {
  const {
    allCapacity,
    mattyBagStampBonus,
    gemShopCarryBonus,
    masonJarStampBonus,
    extraBagsTalentBonus,
    starSignExtraCap
  } = capacities;
  const stampMatCapMath = (1 + mattyBagStampBonus / 100);
  const gemPurchaseMath = (1 + (25 * gemShopCarryBonus) / 100);
  const additionalCapMath = (1 + (masonJarStampBonus + starSignExtraCap) / 100); // ignoring star sign
  const talentBonusMath = (1 + extraBagsTalentBonus / 100);
  const bCraftCap = bag?.capacity;
  return Math.floor(bCraftCap * stampMatCapMath * gemPurchaseMath * additionalCapMath * talentBonusMath * allCapacity);
}

export const getAnvilUpgradeCostItem = (pointsFromMats) => {
  const costIndex = anvilUpgradeCost.findIndex(({ costThreshold }, index) => (pointsFromMats < costThreshold) || (index === anvilUpgradeCost?.length - 1)) || {};
  const costObject = anvilUpgradeCost?.[costIndex];
  const startingIndex = costIndex === 0 ? 1 : pointsFromMats < costObject?.costThreshold ? anvilUpgradeCost?.[costIndex - 1]?.costThreshold : costObject?.costThreshold;
  return costObject ? {
    ...costObject,
    startingIndex: startingIndex
  } : { costThreshold: null, itemName: null };
}

export const getTotalMonsterMatCost = ({ costThreshold, startingIndex } = {}, pointsFromMats, anvilCostReduction) => {
  if (!costThreshold) return 0;
  let totalMaterials = 0;
  for (let point = startingIndex; point < pointsFromMats; point++) {
    totalMaterials += getMonsterMatCost(point, anvilCostReduction);
  }
  return totalMaterials;
}

export const getTotalCoinCost = (pointsFromMats, anvilCostReduction) => {
  let totalMaterials = 0;
  for (let point = 0; point < pointsFromMats; point++) {
    totalMaterials += getCoinCost(point, anvilCostReduction);
  }
  return String(totalMaterials).split(/(?=(?:..)*$)/);
}

export const getCoinCost = (pointsFromCoins, anvilCostReduction, format) => {
  const baseCost = Math.pow(pointsFromCoins, 3) + 50;
  const cost = Math.round(baseCost * (1 + pointsFromCoins / 100) * Math.max(0.1, 1 - anvilCostReduction / 100));
  return format ? String(cost).split(/(?=(?:..)*$)/) : cost;
}

export const getMonsterMatCost = (pointsFromMats, anvilCostReduction) => {
  return Math.round((Math.pow(pointsFromMats + 1, 1.5) + pointsFromMats) * Math.max(0.1, 1 - anvilCostReduction / 100))
}

export const getGoldenFoodBonus = (amount, stack) => {
  if (!amount || !stack) return 0;
  return round(amount * 0.05 * lavaLog(1 + stack) * (1 + lavaLog(1 + stack) / 2.14));
}

export const getGuildBonusBonus = (guildBonuses, bonusIndex) => {
  const guildBonus = guildBonuses?.[bonusIndex];
  if (!guildBonus) return 0;
  return growth(guildBonus.func, guildBonus.level, guildBonus.x1, guildBonus.x2) ?? 0;
}

export const getStatueBonus = (statues, statueName, talents) => {
  const statue = statues?.find(({ rawName }) => rawName === statueName);
  if (!statue) return 0;
  let talentBonus = 1;

  switch (statue?.name) {
    case "POWER":
    case "MINING":
    case "DEFENSE":
    case "OCEANMAN":
      talentBonus += (getTalentBonus(talents, 2, 'SHIELDIEST_STATUES')
        || getTalentBonus(talents, 2, 'STRONGEST_STATUES')) / 100;
      break;
    case "SPEED":
    case "ANVIL":
    case "BULLSEYE":
    case "OL_RELIABLE":
      talentBonus += (getTalentBonus(talents, 2, 'STRAIGHTSHOT_STATUES')
        || getTalentBonus(talents, 2, 'SHWIFTY_STATUES')) / 100;
      break;
    case "EXP":
    case "LUMBERBOB":
    case "BEHOLDER":
    case "CAULDRON":
      talentBonus += (getTalentBonus(talents, 2, 'STARING_STATUES')
        || getTalentBonus(talents, 2, 'STUPENDOUS_STATUES')) / 100;
      break;
    case "EHEXPEE":
    case "KACHOW":
    case "FEASTY":
      talentBonus += getTalentBonus(talents, 2, 'SKILLIEST_STATUE') / 100;
      break;
    default:
      talentBonus = 1;
  }
  return statue?.level * statue?.bonus * talentBonus;
}

export const getStarSignBonus = (equippedStarSigns, starSignName, starEffect) => {
  const starSign = equippedStarSigns?.find(({ name }) => name === starSignName);
  if (!starSign) return 0;
  return starSign?.find(({ effect }) => effect === starEffect)?.bonus ?? 0;
}

export const getPostOfficeBonus = (postOffice, boxName, bonusIndex) => {
  const box = postOffice?.boxes?.find(({ name }) => name === boxName);
  if (!box) return 0;
  const updatedLevel = bonusIndex === 0 ? box?.level : index === 1 ? box?.level - 25 : box?.level - 100;
  return growth(box?.func, updatedLevel > 0 ? updatedLevel : 0, box?.x1, box?.x2) ?? 0;
}

export const getAnvilSpeed = (agility = 0, speedPoints, stampBonus = 0, poBoxBonus = 0, hammerHammerBonus = 0, statueBonus = 0, starSignTownSpeed = 0, talentTownSpeed = 0) => {
  const boxAndStatueMath = 1 + ((poBoxBonus + statueBonus) / 100);
  const agilityBonus = getSpeedBonusFromAgility(agility);
  return (1 + (stampBonus + (2 * speedPoints)) / 100) * boxAndStatueMath * (1 + (hammerHammerBonus / 100)) * agilityBonus * (1 + (starSignTownSpeed + talentTownSpeed) / 100);
}

export const getSpeedBonusFromAgility = (agility = 0) => {
  let base = (Math.pow(agility + 1, 0.37) - 1) / 40;
  if (agility > 1000) {
    base = ((agility - 1000) / (agility + 2500)) * 0.5 + 0.255;
  }
  return (base * 2) + 1;
}

export const getStatFromEquipment = (item, statName) => {
  // %_SKILL_EXP
  const misc1 = item?.UQ1txt === statName ? item?.UQ1val : 0;
  const misc2 = item?.UQ2txt === statName ? item?.UQ2val : 0;
  return misc1 + misc2;
}

export const getMaxCharge = (skull, cardBonus, prayDayStamp, gospelBonus, worshipLevel, popeBonus) => {
  const skullSpeed = skull?.lvReqToCraft;
  const base = prayDayStamp + gospelBonus * Math.floor(worshipLevel / 10);
  return Math.floor(Math.max(50, cardBonus + (base + skullSpeed * Math.max(popeBonus, 1))))
}

export const getChargeRate = (skull, worshipLevel, popeBonus, cardBonus, stampBonus, talentBonus) => {
  const skullSpeed = skull?.Speed ?? 0;
  const speedMath = 0.2 * Math.pow(skullSpeed, 1.3);
  const levelMath = (0.9 * Math.pow(worshipLevel, 0.5)) / (Math.pow(worshipLevel, 0.5) + 250);
  const base = 6 / Math.max(5.7 - (speedMath + (levelMath + (0.6 * worshipLevel) / (worshipLevel + 40))), 0.57);
  return base * Math.max(1, popeBonus) * (1 + (cardBonus + stampBonus) / 100) * Math.max(talentBonus, 1)
}


export const mapAccountQuests = (characters) => {
  const questsKeys = Object.keys(quests);
  let mappedQuests = questsKeys?.reduce((res, npcName) => {
    const npcQuests = cloneObject(quests[npcName]);
    const worldName = worldNpcMap?.[npcName]?.world;
    const npcIndex = worldNpcMap?.[npcName]?.index;
    if (!worldName) return res;
    for (let i = 0; i < characters?.length; i++) {
      const rawQuest = cloneObject(characters?.[i]?.quests?.[npcName]) || {};
      const questIndices = Object.keys(rawQuest);
      let skip = false;
      for (let j = 0; j < questIndices?.length; j++) {
        const questIndex = questIndices[j];
        const questStatus = rawQuest[questIndex];
        if (!npcQuests[questIndex]) continue;
        if (npcQuests?.[questIndex - 1] && (!skip && (questStatus === 0 || questStatus === -1) || questStatus === 1)) {
          npcQuests[questIndex - 1].progress = npcQuests[questIndex - 1]?.progress?.filter(({ charIndex }) => charIndex !== i);
        }
        if (questStatus === 1) { // completed
          npcQuests[questIndex].completed = [...(npcQuests[questIndex]?.completed || []), {
            charIndex: i,
            status: questStatus
          }];
          npcQuests[questIndex].progress = [...(npcQuests[questIndex]?.progress || []), {
            charIndex: i,
            status: questStatus
          }];
        } else if (!skip && (questStatus === 0 || questStatus === -1)) {
          npcQuests[questIndex].progress = [...(npcQuests[questIndex]?.progress || []), {
            charIndex: i,
            status: questStatus
          }]
          skip = true;
        }
      }
    }
    return {
      ...res,
      [worldName]: [
        ...(res?.[worldName] || []),
        {
          name: npcName,
          index: npcIndex,
          npcQuests: Object.values(npcQuests)
        }
      ]
    };
  }, {});
  for (const mappedQuest in mappedQuests) {
    let val = mappedQuests[mappedQuest];
    val?.sort((a, b) => a?.index - b?.index);
  }
  return mappedQuests;
};

export const calculateLeaderboard = (characters) => {
  const leaderboardObject = characters.reduce((res, { name, skillsInfo }) => {
    for (const [skillName, skillLevel] of Object.entries(skillsInfo)) {
      if (!res[skillName]) {
        res[skillName] = { ...(res[skillName]), [name]: skillLevel }
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
  }, {})
}

export const calculateDeathNote = (characters) => {
  const allKills = characters?.reduce((res, character) => {
    const { kills } = character;
    if (res?.length === 0) return kills;
    return kills?.map((mapKills, innerInd) => mapKills + res[innerInd]);
  }, []);
  return deathNote.reduce((res, { rawName, world }) => {
    const mobIndex = mapEnemies?.[rawName];
    const kills = allKills?.[mobIndex];
    const rank = getDeathNoteRank(kills);
    return {
      ...res,
      [world]: {
        ...(res?.[world] || {}),
        rank: (res?.[world]?.rank || 0) + rank,
        mobs: [...(res?.[world]?.mobs || []), { rawName, displayName: monsters?.[rawName]?.Name, kills }]
      }
    };
  }, {});
}

export const keysMap = {
  0: { name: "Forest_Villa_Key", rawName: 'Key1' },
  1: { name: "Efaunt's_Tomb_Key", rawName: 'Key2' },
  2: { name: "Chizoar's_Cavern_Key", rawName: 'Key3' }
};


export const getInventory = (inventoryArr, inventoryQuantityArr, owner) => {
  return inventoryArr.reduce((res, itemName, index) => (itemName !== 'LockedInvSpace' && itemName !== 'Blank' ? [
    ...res, {
      owner,
      name: items?.[itemName]?.displayName,
      type: items?.[itemName]?.itemType,
      subType: items?.[itemName]?.Type,
      rawName: itemName,
      amount: parseInt(inventoryQuantityArr?.[index]),
    }
  ] : res), []);
};

export const calculateStars = (tierReq, amountOfCards) => {
  if (amountOfCards > tierReq * 9) {
    return 3;
  } else if (amountOfCards > tierReq * 4) {
    return 2;
  } else if (amountOfCards > tierReq) {
    return 1;
  }
  return 0;
};

export const createItemsWithUpgrades = (charItems, stoneData, owner) => {
  return Array.from(Object.values(charItems)).reduce((res, item, itemIndex) => {
    const stoneResult = addStoneDataToEquip(items?.[item], stoneData[itemIndex]);
    return item ? [...res, {
      name: items?.[item]?.displayName, rawName: item,
      owner,
      ...(item === 'Blank' ? {} : { ...items?.[item], ...stoneResult })
    }] : res
  }, []);
}

export const createObolsWithUpgrades = (charItems, stoneData) => {
  return charItems.reduce((res, item, itemIndex) => {
    const { rawName } = item;
    if (rawName === 'Blank') return [...res, item];
    const stoneResult = addStoneDataToEquip(items?.[rawName], stoneData[itemIndex]);
    return rawName ? [...res, {
      ...(rawName === 'Blank' ? {} : { ...item, ...items?.[rawName], ...stoneResult })
    }] : res
  }, []);
}

export const addStoneDataToEquip = (baseItem, stoneData) => {
  if (!baseItem || !stoneData) return {};
  return Object.keys(stoneData)?.reduce((res, statName) => {
    if (statName === 'UQ1txt' || statName === 'UQ2txt') {
      return { ...res, [statName]: baseItem?.[statName] || stoneData?.[statName] };
    }
    const baseItemStat = baseItem?.[statName];
    const stoneStat = stoneData?.[statName];
    let sum = baseItemStat;
    if (stoneStat) {
      sum = (baseItemStat || 0) + stoneStat;
      return { ...res, [statName]: parseFloat(sum) };
    }
    return { ...res, [statName]: parseFloat(baseItemStat) };
  }, {});
}

export const calculateWeirdObolIndex = (index) => {
  switch (index) {
    case 12:
      return 13;
    case 13:
      return 14;
    case 14:
      return 12;
    case 17:
      return 15;

    case 15:
      return 17;
    case 16:
      return 19;
    case 18:
      return 16;
    case 19:
      return 18;
    default:
      return index;
  }
}

export const calculateCardSetStars = (card, bonus) => {
  if (!card || !bonus) return null;
  if (card.base === bonus) {
    return 0;
  } else if (bonus >= card.base * 4) {
    return 3;
  } else if (bonus >= card.base * 3) {
    return 2;
  } else if (bonus >= card.base * 2) {
    return 1;
  }
  return null;
};

export const createTalentPage = (className, pages, talentsObject, maxTalentsObject, mergeArray) => {
  return pages.reduce((res, className, index) => {
    const orderedTalents = Object.entries(talents?.[className])?.map(([talentId, talentDetails]) => {
      return {
        talentId: talentDetails.skillIndex,
        ...talentDetails,
        level: talentsObject[talentDetails.skillIndex] || 0,
        maxLevel: maxTalentsObject[talentDetails.skillIndex] || -1,
      }
    });
    if (mergeArray) {
      return {
        ...res,
        orderedTalents: [...(res?.orderedTalents || []), ...orderedTalents]
      }
    }
    return {
      ...res,
      [index]: { name: className, orderedTalents }
    }
  }, {})
}

export const calculateItemTotalAmount = (array, itemName, exact) => {
  return array?.reduce((result, item) => {
    if (exact) {
      if (itemName === item?.name) {
        result += item?.amount;
      }
    } else {
      if (item?.name?.includes(itemName)) {
        result += item?.amount;
      }
    }
    return result;
  }, 0);
}

export const talentPagesMap = {
  "Beginner": ["Beginner"],
  "Journeyman": ["Beginner", "Journeyman"],
  "Maestro": ["Beginner", "Journeyman", "Maestro"],
  "Warrior": ["Rage_Basics", "Warrior"],
  "Barbarian": ["Rage_Basics", "Warrior", "Barbarian"],
  "Squire": ["Rage_Basics", "Warrior", "Squire"],
  "Archer": ["Calm_Basics", "Archer"],
  "Bowman": ["Calm_Basics", "Archer", "Bowman"],
  "Hunter": ["Calm_Basics", "Archer", "Hunter"],
  "Mage": ["Savvy_Basics", "Mage"],
  "Shaman": ["Savvy_Basics", "Mage", "Shaman"],
  "Wizard": ["Savvy_Basics", "Mage", "Wizard"]
};

// TODO: check if able to pull from Z.js
export const skillIndexMap = {
  0: "character",
  1: "mining",
  2: "smithing",
  3: "chopping",
  4: "fishing",
  5: "alchemy",
  6: "catching",
  7: "trapping",
  8: "construction",
  9: "worship",
};

// TODO: check if able to pull from Z.js
export const shopMapping = {
  0: {
    included: {
      0: true, 1: true, 4: true, 5: true, 6: true, 7: true, 13: true, 18: true, 23: true, 24: true
    }, name: 'Blunder_Hills'
  },
  1: {
    included: {
      0: true, 3: true, 4: true, 8: true, 9: true, 12: true, 13: true
    }, name: 'Encroaching_Forest_Villas'
  },
  2: {
    included: {
      0: true, 1: true, 2: true, 3: true, 4: true, 8: true, 9: true, 10: true, 11: true, 17: true, 18: true
    }, name: 'YumYum_Grotto'
  },
  3: {
    included: {
      12: true
    }, name: 'Faraway_Piers'
  },
  4: {
    included: {
      0: true, 1: true, 2: true, 5: true, 6: true, 7: true, 8: true, 9: true, 10: true, 11: true, 18: true, 19: true
    }, name: 'Frostbite_Towndra'
  }
};

export const starSignsIndicesMap = {
  "The_Book_Worm": "1",
  "The_Buff_Guy": "1a",
  "The_Fuzzy_Dice": "1b",
  "Flexo_Bendo": "2",
  "Dwarfo_Beardus": "3",
  "Hipster_Logger": "4",
  "Pie_Seas": "4a",
  "Miniature_Game": "4b",
  "Shoe_Fly": "4c",
  "Pack_Mule": "5",
  "Pirate_Booty": "6",
  "All_Rounder": "7",
  "Muscle_Man": "7a",
  "Fast_Frog": "7b",
  "Smart_Stooge": "7c",
  "Lucky_Larry": "7d",
  "Fatty_Doodoo": "8",
  "Robinhood": "9",
  "Blue_Hedgehog": "9a",
  "Ned_Kelly": "10",
  "The_Fallen_Titan": "10a",
  "Chronus_Cosmos": "CR",
  "Activelius": "11",
  "Gum_Drop": "11a",
  "Mount_Eaterest": "12",
  "Bob_Build_Guy": "13",
  "The_Big_Comatose": "14",
  "Sir_Savvy": "14a",
  "Silly_Snoozer": "15",
  "The_Big_Brain": "15a",
  "Grim_Reaper": "16",
  "The_Forsaken": "16a",
  "The_OG_Skiller": "17",
  "Mr_No_Sleep": "18",
  "All_Rounderi": "1",
  "Centaurii": "2",
  "Murmollio": "3",
  "Strandissi": "4",
  "Agitagi": "4B",
  "Wispommo": "5",
  "Lukiris": "5B",
  "Pokaminni": "6",
  "Gor_Bowzor": "7",
  "Hydron_Cosmos": "8",
  "Trapezoidburg": "8B",
  "Sawsaw_Salala": "9",
  "Preys_Bea": "9B",
  "Cullingo": "10",
  "Gum_Drop_Major": "10B",
  "Grim_Reaper_Major": "11",
  "Sir_Savvy_Major": "12",
  "The_Bulwark": "13",
  "Big_Brain_Major": "14",
  "The_Fiesty": "15",
  "The_Overachiever": "15B",
  "Comatose_Major": "16",
  "S._Snoozer_Major": "17",
  // "Unknown":"18",
  // "Unknown":"19",
  // "Unknown":"19B",
  // "Unknown":"20",
  // "Unknown":"21",
  // "Unknown":"22",
  // "Unknown":"23",
}

export const filteredLootyItems = {
  'EquipmentShirts4': true,
  'EquipmentShirts6': true,
  'EquipmentShirts8': true,
  'EquipmentShirts9': true,
  'EquipmentShoes2': true,
  'EquipmentShoes6': true,
  'EquipmentShoes8': true,
  'EquipmentShoes10': true,
  'EquipmentShoes13': true,
  'EquipmentShoes11': true,
  'EquipmentShoes12': true,
  'EquipmentShoes14': true,
  "EquipmentPendant1": true,
  "EquipmentPendant2": true,
  "EquipmentPendant3": true,
  "EquipmentPendant4": true,
  "EquipmentPendant5": true,
  "EquipmentPendant6": true,
  "EquipmentPendant7": true,
  "EquipmentPendant8": true,
  "EquipmentPendant13": true,
  "EquipmentPendant15": true,
  "EquipmentPendant18": true,
  "EquipmentRings1": true,
  "EquipmentRings4": true,
  "EquipmentRings5": true,
  "EquipmentRings8": true,
  "EquipmentRings9": true,
  "EquipmentRings10": true,
  "EquipmentRingsFishing1": true,
  "EquipmentRingsFishing2": true,
  "EquipmentRingsFishing3": true,
  "EquipmentHatsBeg1": true,
  "EquipmentHats10": true,
  "EquipmentHats23": true,
  "EquipmentHats24": true,
  "EquipmentHats27": true,
  "EquipmentWeapons1": true,
  "EquipmentWeapons2": true,
  "EquipmentWands3": true,
  "EquipmentWands4": true,
  "TestObj2": true,
  "TestObj3": true,
  "TestObj4": true,
  "TestObj5": true,
  "TestObj8": true,
  "TestObj14": true,
  "TestObj15": true,
  "TestObj16": true,
  "EquipmentPants7": true,
  "EquipmentPants8": true,
  "EquipmentPants9": true,
  "EquipmentPants11": true,
  "EquipmentPants12": true,
  "EquipmentPants13": true,
  "EquipmentPants14": true,
  'Blank': true,
  'LockedInvSpace': true,
  'FillerMaterial': true,
  'Fish5': true,
  'Fish6': true,
  'Fish7': true,
  'Fish8': true,
  'EquipmentSmithingTabs5': true,
  'EquipmentSmithingTabs6': true,
  'EquipmentSmithingTabs7': true,
  'EquipmentSmithingTabs8': true,
  'StampA22': true,
  'StampA25': true,
  'StampA29': true,
  'StampA30': true,
  'StampA31': true,
  'StampA32': true,
  'StampA33': true,
  'StampA34': true,
  'StampA35': true,
  'CraftMat11': true,
  'CraftMat12': true,
  'CraftMat13': true,
  'CraftMat14': true,
  'CraftMat15': true,
  'CraftMat16': true,
  'CraftMat17': true,
  'GemQ1': true,
  'GemQ2': true,
  'GemQ3': true,
  'GemQ4': true,
  'GemQ5': true,
  'GemQ6': true,
  'GemQ7': true,
  'GemQ8': true,
  'EquipmentHats35': true,
  'EquipmentHats38': true,
  'EquipmentHats46': true,
  'EquipmentHats47': true,
  'EquipmentHats48': true,
  'EquipmentHats49': true,
  'EquipmentHats50': true,
  'CardPack1': true,
  'CardPack2': true,
  'CardPack3': true,
  'InvBag21': true,
  'InvBag22': true,
  'InvBag23': true,
  'InvBag24': true,
  'InvBag25': true,
  'InvBag26': true,
  'InvStorage31': true,
  'InvStorage32': true,
  'InvStorage33': true,
  'InvStorage34': true,
  'InvStorage35': true,
  'InvStorage36': true,
  'InvStorage37': true,
  'InvStorage38': true,
  'InvStorage39': true,
  'InvStorage40': true,
  'InvStorage41': true,
  'InvStorage42': true,
  "COIN": true,
  "EXP": true,
  'Dreadlo': true,
  'Godshard': true,
  'DreadloBar': true,
  'GodshardBar': true,
  'AlienTree': true,
  "TestObj18": true,
  "TestObj9": true,
  "TestObj10": true,
  "EquipmentShirts7": true,
  'EquipmentRingsChat2': true,
  'EquipmentRingsChat3': true,
  'EquipmentRingsChat4': true,
  'EquipmentRingsChat5': true,
  'EquipmentRingsChat6': true,
  'EquipmentRingsChat8': true,
  'EquipmentRingsChat9': true,
  'EquipmentTools8': true,
  'EquipmentTools9': true,
  "EquipmentToolsHatchet6": true,
  "EquipmentToolsHatchet8": true,
  "EquipmentToolsHatchet9": true,
  "EquipmentToolsHatchet10": true,
  "Quest8": true,
  "ClassSwap": true,
  "ResetBox": true,
  "Ht": true,
  'StonePremRestore': true,
  'SmithingRecipes3': true,
  'SmithingRecipes4': true,
  'EquipmentSmithingTabs4': true,
  'Quest28': true,
  'TrapBoxSet6': true,
  'NPCtoken8"': true,
  'StampB28': true,
  'StampB29': true,
  'StampB32': true,
  'StampB33': true,
  'StampB35': true,
  'StampC4': true,
  'StampC5': true,
  'StampC10': true,
  'StampC11': true,
  'StampC12': true,
  'ExpSmith1': true,
  'StonePremSTR': true,
  'StonePremAGI': true,
  'StonePremWIS': true,
  'StonePremLUK': true,
  'GemP1': true,
  'GemP9': true,
  'GemP10': true,
  'GemP11': true,
  'GemP12': true,
  'GemP13': true,
  'GemP14': true,
  'GemP15': true,
  'GemQ9': true,
  'EquipmentHats57': true,
  'EquipmentHats45': true,
  'EquipmentHats43': true,
  'EquipmentHats37': true,
  'EquipmentHats40': true,
  'EquipmentHats36': true,
  'EquipmentHats33': true,
  'EquipmentHats32': true,
  'EquipmentHats31': true,
  'EquipmentHats34': true,
  'CardsC13': true,
  'CardsC14': true,
  'CardsC15': true,
  'CardsD12': true,
  'CardsD13': true,
  'Trophy4': true,
  'Trophy7': true,
  'Line8': true,
  'Line9': true,
  'Line11': true,
  'Line12': true,
  'Line13': true,
  'Line14': true,
  'Weight4': true,
  'Weight7': true,
  'Weight9': true,
  'Weight13': true,
  'Weight14': true,
  'StampsA22': true,
  'StampsA25': true,
  'TalentPoint1': true,
  'TalentPoint4': true,
  'TalentPoint5': true,
  'TalentPoint6': true,
  'DoubleAFKtix': true,
  'ObolFrag': true,
  'StampC14': true,
  'StampC15': true,
  'DeliveryBox': true,
  'StampC16': true,
  'StampC17': true,
  'StampC18': true,
  'StampC8': true,
  'DungWeaponBow1': true,
  'DungWeaponWand1': true,
  'DungWeaponSword1': true,
  'FishingRod1': true,
  'CatchingNet1': true,
  'DungRNG4': true,
  'DungRNG3': true
};

export const worldNpcMap = {
  "Scripticus": {
    "world": "Blunder_Hills",
    index: 0
  },
  "Glumlee": {
    "world": "Blunder_Hills",
    index: 1
  },
  "Krunk": {
    "world": "Blunder_Hills",
    index: 2
  },
  "Mutton": {
    "world": "Blunder_Hills",
    index: 3
  },
  "Woodsman": {
    "world": "Blunder_Hills",
    index: 4
  },
  "Hamish": {
    "world": "Blunder_Hills",
    index: 5
  },
  "Toadstall": {
    "world": "Blunder_Hills",
    index: 5
  },
  "Picnic_Stowaway": {
    "world": "Blunder_Hills",
    index: 6
  },
  "Typhoon": {
    "world": "Blunder_Hills",
    index: 7
  },
  "Sprout": {
    "world": "Blunder_Hills",
    index: 8
  },
  "Dazey": {
    "world": "Blunder_Hills",
    index: 9
  },
  "Telescope": {
    "world": "Blunder_Hills",
    index: 10
  },
  "Stiltzcho": {
    "world": "Blunder_Hills",
    index: 11
  },
  "Funguy": {
    "world": "Blunder_Hills",
    index: 12
  },
  "Tiki_Chief": {
    "world": "Blunder_Hills",
    index: 13
  },
  "Dog_Bone": {
    "world": "Blunder_Hills",
    index: 14
  },
  "Papua_Piggea": {
    "world": "Blunder_Hills",
    index: 15
  },
  "TP_Pete": {
    "world": "Blunder_Hills",
    index: 16
  },
  "Meel": {
    "world": "Blunder_Hills",
    index: 17
  },
  "Town_Marble": {
    "world": ""
  },
  "Mr_Pigibank": {
    "world": ""
  },
  "Secretkeeper": {
    "world": ""
  },
  "Promotheus": {
    "world": ""
  },
  "Bushlyte": {
    "world": ""
  },
  "Rocklyte": {
    "world": ""
  },
  "Cowbo_Jones": {
    "world": "Yum-Yum_Desert",
    index: 0
  },
  "Fishpaste97": {
    "world": "Yum-Yum_Desert",
    index: 1
  },
  "Scubidew": {
    "world": "Yum-Yum_Desert",
    index: 2
  },
  "Whattso": {
    "world": "Yum-Yum_Desert",
    index: 3
  },
  "Bandit_Bob": {
    "world": "Yum-Yum_Desert",
    index: 4
  },
  "Carpetiem": {
    "world": "Yum-Yum_Desert",
    index: 5
  },
  "Centurion": {
    "world": "Yum-Yum_Desert",
    index: 6
  },
  "Goldric": {
    "world": "Yum-Yum_Desert",
    index: 7
  },
  "Snake_Jar": {
    "world": "Yum-Yum_Desert",
    index: 8
  },
  "XxX_Cattleprod_XxX": {
    "world": "Yum-Yum_Desert",
    index: 9
  },
  "Loominadi": {
    "world": "Yum-Yum_Desert",
    index: 10
  },
  "Wellington": {
    "world": "Yum-Yum_Desert",
    index: 11
  },
  "Djonnut": {
    "world": "Yum-Yum_Desert",
    index: 12
  },
  "Walupiggy": {
    "world": "Yum-Yum_Desert",
    index: 13
  },
  "Gangster_Gus": {
    "world": "Yum-Yum_Desert",
    index: 14
  },
  "Builder_Bird": {
    "world": ""
  },
  "Speccius": {
    "world": ""
  },
  "Postboy_Pablob": {
    "world": ""
  },
  "Desert_Davey": {
    "world": ""
  },
  "Giftmas_Blobulyte": {
    "world": ""
  },
  "Loveulyte": {
    "world": ""
  },
  "Constructor_Crow": {
    "world": ""
  },
  "Iceland_Irwin": {
    "world": ""
  },
  "Egggulyte": {
    "world": ""
  },
  "Hoggindaz": {
    "world": "Frostbite_Tundra",
    index: 0
  },
  "Worldo": {
    "world": "Frostbite_Tundra",
    index: 0
  },
  "Lord_of_the_Hunt": {
    "world": "Frostbite_Tundra",
    index: 1
  },
  "Lonely_Hunter": {
    "world": "Frostbite_Tundra",
    index: 2
  },
  "Snouts": {
    "world": "Frostbite_Tundra",
    index: 3
  },
  "Shuvelle": {
    "world": "Frostbite_Tundra",
    index: 4
  },
  "Yondergreen": {
    "world": "Frostbite_Tundra",
    index: 5
  },
  "Crystalswine": {
    "world": "Frostbite_Tundra",
    index: 6
  },
  "Bill_Brr": {
    "world": "Frostbite_Tundra",
    index: 7
  },
  "Bellows": {
    "world": "Frostbite_Tundra",
    index: 8
  },
  "Cactolyte": {
    "world": ""
  },
  "Coastiolyte": {
    "world": ""
  },
};

const lavaLog = (num) => {
  return Math.log(Math.max(num, 1)) / 2.303;
};

const cloneObject = (data) => {
  try {
    return JSON.parse(JSON.stringify(data));
  } catch (err) {
    return data;
  }
}
