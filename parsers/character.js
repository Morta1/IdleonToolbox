import {
  bonuses,
  carryBags,
  classes,
  classFamilyBonuses,
  divStyles,
  gods,
  invBags,
  items,
  mapDetails,
  mapEnemiesArray,
  mapNames,
  mapPortals,
  monsters,
  randomList,
  starSignByIndexMap
} from '../data/website-data';
import {
  calculateAfkTime,
  getFoodBonus,
  getGoldenFoodBonus,
  getHighestLevelOfClass,
  getMaterialCapacity,
  isArenaBonusActive,
  isBundlePurchased,
  isCompanionBonusActive
} from './misc';
import { calculateItemTotalAmount, createItemsWithUpgrades, getStatsFromGear } from './items';
import { getInventory } from './storage';
import { skillIndexMap, skillsMaps } from './parseMaps';
import {
  applyTalentAddedLevels,
  createTalentPage,
  getActiveBuffs,
  getFamilyBonusValue,
  getHighestTalentByClass,
  getTalentAddedLevels,
  getTalentBonus,
  getTalentBonusIfActive,
  mainStatMap,
  talentPagesMap
} from './talents';
import { calcCardBonus, getCardBonusByEffect, getEquippedCardBonus, getPlayerCards } from './cards';
import { getStampBonus, getStampsBonusByEffect } from './stamps';
import { getPlayerPostOffice, getPostOfficeBonus, getPostOfficeBoxLevel } from './postoffice';
import { getActiveBubbleBonus, getBubbleBonus, getSigilBonus, getVialsBonusByEffect } from './alchemy';
import { getStatueBonus } from './statues';
import { getStarSignBonus, getStarSignByEffect } from './starSigns';
import { getAnvil } from './anvil';
import { getPrayerBonusAndCurse } from './prayers';
import { getGuildBonusBonus } from './guild';
import { getShrineBonus } from './shrines';
import { getFamilyBonus, getFamilyBonusBonus } from './family';
import { getSaltLickBonus } from './saltLick';
import { getDungeonFlurboStatBonus } from './dungeons';
import { getMealsBonusByEffectOrStat } from './cooking';
import { getObols, getObolsBonus, mergeCharacterAndAccountObols } from './obols';
import { getPlayerWorship } from './worship';
import { getPlayerQuests } from './quests';
import { getJewelBonus, getLabBonus, getPlayerLabChipBonus, isGodEnabledBySorcerer } from './lab';
import { getAchievementStatus } from './achievements';
import { lavaLog } from '../utility/helpers';
import { getArcadeBonus } from './arcade';
import { isArtifactAcquired } from './sailing';
import { getShinyBonus } from './breeding';
import { getMinorDivinityBonus } from './divinity';
import { getEquinoxBonus } from './equinox';
import { getConstructMastery } from './world-4/rift';
import { getAtomBonus } from './atomCollider';

const { tryToParse, createIndexedArray, createArrayOfArrays } = require('../utility/helpers');

export const getCharacters = (idleonData, charsNames) => {
  const chars = charsNames ? charsNames : [0, 1, 2, 3, 4, 5, 6, 7, 8];
  return chars?.map((charName, playerId) => {
    const characterDetails = Object.entries(idleonData)?.reduce((res, [key, details]) => {
      const reg = new RegExp(`_${playerId}`, 'g');
      if (reg.test(key)) {
        let updatedDetails = tryToParse(details);
        let updatedKey = key;
        let arr = [];
        switch (true) {
          case key.includes('EquipOrder'): {
            updatedKey = `EquipmentOrder`;
            details = createArrayOfArrays(details);
            break;
          }
          case key.includes('EquipQTY'): {
            updatedKey = `EquipmentQuantity`;
            details = createArrayOfArrays(details);
            break;
          }
          case key.includes('AnvilPA_'): {
            updatedKey = `AnvilPA`;
            updatedDetails = createArrayOfArrays(details);
            break;
          }
          case key.includes('EMm0'): {
            updatedKey = `EquipmentMap`;
            arr = res?.[updatedKey];
            const det = createIndexedArray(updatedDetails);
            if (arr) {
              arr.splice(0, 0, det);
            } else {
              arr = [det];
            }
            break;
          }
          case key.includes('IMm_'): {
            updatedKey = `InventoryMap`;
            updatedDetails = tryToParse(details);
            break;
          }
          case key.includes('EMm1'): {
            updatedKey = `EquipmentMap`;
            arr = res?.[updatedKey];
            const det = createIndexedArray(updatedDetails);
            if (arr) {
              arr.splice(1, 0, det);
            } else {
              arr = [det];
            }
            break;
          }
          case key.includes('BuffsActive'): {
            updatedKey = `BuffsActive`;
            arr = createArrayOfArrays(updatedDetails);
            break;
          }
          case key.includes('ItemQTY'): {
            updatedKey = `ItemQuantity`;
            break;
          }
          case key.includes('PVStatList'): {
            updatedKey = `PersonalValuesMap`;
            updatedDetails = { ...(res?.[updatedKey] || {}), StatList: tryToParse(details) };
            break;
          }
          case key.includes('PVtStarSign'): {
            updatedKey = `PersonalValuesMap`;
            updatedDetails = { ...(res?.[updatedKey] || {}), StarSign: tryToParse(details) };
            break;
          }
          case key.includes('ObolEqO0'): {
            updatedKey = `ObolEquippedOrder`;
            break;
          }
          case key.includes('ObolEqMAP'): {
            updatedKey = `ObolEquippedMap`;
            break;
          }
          case key.includes('SL_'): {
            updatedKey = `SkillLevels`;
            break;
          }
          case key.includes('SM_'): {
            updatedKey = `SkillLevelsMAX`;
            break;
          }
          case key.includes('KLA_'): {
            updatedKey = `KillsLeft2Advance`;
            break;
          }
          case key.includes('AtkCD_'): {
            updatedKey = `AttackCooldowns`;
            break;
          }
          case key.includes('POu_'): {
            updatedKey = `PostOfficeInfo`;
            break;
          }
          case key.includes('PTimeAway'): {
            updatedKey = `PlayerAwayTime`;
            updatedDetails = updatedDetails * 1e3;
            break;
          }
          default : {
            updatedKey = key?.split('_')?.[0];
            break;
          }
        }
        return { ...res, [updatedKey]: arr?.length ? arr : updatedDetails }
      }
      return { ...res, };
    }, {});
    return {
      name: charName,
      playerId,
      ...characterDetails
    }
  })
}

export const initializeCharacter = (char, charactersLevels, account, idleonData) => {
  const character = {};
  character.playerId = char.playerId;
  character.name = char.name;
  if (!char?.CharacterClass) return character;
  character.classIndex = char?.CharacterClass;
  character.class = classes?.[char?.CharacterClass];
  character.afkTime = calculateAfkTime(char?.PlayerAwayTime, account?.timeAway?.GlobalTime);
  character.afkTarget = monsters?.[char?.AFKtarget]?.Name;
  character.targetMonster = char?.AFKtarget;
  const currentMapIndex = char?.CurrentMap;
  character.mapIndex = currentMapIndex;
  character.currentMap = mapNames?.[currentMapIndex];
  character.money = parseFloat(char?.Money);
  character.cooldowns = char?.[`AttackCooldowns`];
  const statMap = { 0: 'strength', 1: 'agility', 2: 'wisdom', 3: 'luck', 4: 'level' };
  character.stats = char?.PersonalValuesMap?.StatList?.reduce((res, statValue, index) => {
    if (!statMap[index]) return res;
    return {
      ...res,
      [statMap[index]]: statValue
    }
  }, {});
  character.level = character?.stats?.level || 0;
  // inventory bags used
  const rawInvBagsUsed = char?.[`InvBagsUsed`]
  const bags = Object.keys(rawInvBagsUsed);
  character.invBagsUsed = Object.entries(invBags).map(([bagName, details]) => {
    let bagNumber = bagName.match(/[0-9]+/g)[0];
    bagNumber = parseInt(bagNumber) < 100 ? bagNumber - 1 : bagNumber;
    if (bags.includes(String(bagNumber))) {
      return { ...details, rawName: bagName, acquired: true };
    }
    return { ...details, rawName: bagName };
  });
  const carryCapacityObject = char?.[`MaxCarryCap`] || [];
  character.maxCarryCap = carryCapacityObject;
  character.carryCapBags = Object.keys(carryCapacityObject).sort(function (a, b) {
    return a.localeCompare(b);
  }).map((bagName) => {
    if (bagName === 'Quests' || bagName === 'fillerz' || bagName === 'Statues') return;
    const bag = carryBags?.[bagName]?.[carryCapacityObject[bagName]];
    return bag ? bag : {
      rawName: 'MaxCapBagNone',
      displayName: bagName,
      Class: bagName,
      capacity: carryCapacityObject[bagName],
      Type: 'CARRY'
    };
  }).filter((bag) => bag);
  character.statues = char?.StatueLevels;

  // equipment indices (0 = armor, 1 = tools, 2 = food)
  const equipmentMapping = { 0: 'armor', 1: 'tools', 2: 'food' };
  const equippableNames = char?.[
    `EquipmentOrder`
    ]?.reduce(
    (result, item, index) => ({
      ...result,
      [equipmentMapping?.[index]]: item,
    }), {});
  const equipapbleAmount = char[`EquipmentQuantity`]?.reduce((result, item, index) => ({
    ...result,
    [equipmentMapping?.[index]]: item,
  }), {});

  const equipmentStoneData = char[`EquipmentMap`]?.[0];
  character.equipment = createItemsWithUpgrades(equippableNames.armor, equipmentStoneData, character.name);
  const toolsStoneData = char[`EquipmentMap`]?.[1];
  character.tools = createItemsWithUpgrades(equippableNames.tools, toolsStoneData, character.name);
  character.food = Array.from(Object.values(equippableNames.food)).reduce((res, item, index) =>
    item
      ? [...res, {
        name: items?.[item]?.displayName,
        rawName: item,
        owner: character.name,
        amount: parseInt(equipapbleAmount.food[index] || equipapbleAmount.food[index]),
        ...(items?.[item] || {})
      }] : res, []);

  const inventoryArr = char[`InventoryOrder`];
  const inventoryQuantityArr = char[`ItemQuantity`];
  const inventoryMap = char[`InventoryMap`];
  character.inventory = getInventory(inventoryArr, inventoryQuantityArr, character.name, inventoryMap);
  character.inventorySlots = inventoryArr?.reduce((sum, itemName) => sum + (itemName !== 'LockedInvSpace' ? 1 : 0), 0);

  // star signs
  const starSignsObject = char?.PersonalValuesMap?.StarSign || '';
  character.starSigns = starSignsObject
    .split(',')
    .map((starSign) => {
      if (!starSign || starSign === '_') return null;
      return starSignByIndexMap?.[starSign];
    })
    .filter(item => item);

  character.equippedBubbles = account?.equippedBubbles?.[char?.playerId];
  const levelsRaw = char?.[`Exp0`];
  const levelsReqRaw = char?.[`ExpReq0`];
  const skillsInfoObject = char?.[`Lv0`] || [];

  character.skillsInfo = skillsInfoObject.reduce(
    (res, level, index) =>
      index < 16 ? {
        ...res,
        [skillIndexMap[index]?.name]: {
          level: level !== -1 ? level : 0,
          exp: parseFloat(levelsRaw[index]),
          expReq: parseFloat(levelsReqRaw[index]),
          icon: skillIndexMap[index]?.icon,
          index
        },
      } : res, {});
  character.skillsInfoArray = Object.entries(character.skillsInfo || {}).reduce((result, [skillName, skillData]) => (
    [...result, { ...skillData, skillName }]), []).sort((a, b) => a.index - b.index);

  const talentsObject = char?.[`SkillLevels`];
  const maxTalentsObject = char?.[`SkillLevelsMAX`];
  const pages = talentPagesMap?.[character?.class];
  const {
    flat: flatTalents,
    talents
  } = createTalentPage(character?.class, pages, talentsObject, maxTalentsObject);
  character.talents = talents;
  character.flatTalents = flatTalents;
  const {
    flat: flatStarTalents,
    talents: orderedStarTalents
  } = createTalentPage(character?.class, ['Special Talent 1', 'Special Talent 2',
    'Special Talent 3', 'Special Talent 4', 'Special Talent 5'], talentsObject, maxTalentsObject, true);
  character.starTalents = orderedStarTalents;
  character.flatStarTalents = flatStarTalents;

  const activeBuffs = char?.[`BuffsActive`];
  character.activeBuffs = getActiveBuffs(activeBuffs, [...(flatTalents || []), ...(flatStarTalents || [])]);

  character.activePrayers = char?.Prayers?.filter((prayer) => prayer !== -1).map((prayerId) => account?.prayers?.[prayerId])?.filter((p) => p);
  character.postOffice = getPlayerPostOffice(char?.PostOfficeInfo, account);
  character.cards = getPlayerCards(char, account);

  const omegaNanochipBonus = account?.lab?.playersChips?.[char?.playerId]?.find((chip) => chip.index === 20);
  const omegaMotherboardChipBonus = account?.lab?.playersChips?.[char?.playerId]?.find((chip) => chip.index === 21);
  character.cards.equippedCards = character?.cards?.equippedCards?.map((card, index) => ((index === 0 && omegaNanochipBonus) || (index === 7 && omegaMotherboardChipBonus))
    ? ({
      ...card,
      chipBoost: 2
    })
    : card);
  character.anvil = getAnvil(char);
  const charObols = getObols(char, false);
  character.obols = {
    ...charObols,
    stats: mergeCharacterAndAccountObols(charObols, account.obols)
  };
  character.worship = getPlayerWorship(character, pages, account, char?.PlayerStuff?.[0]);
  character.quests = getPlayerQuests(char?.QuestComplete);
  character.crystalSpawnChance = getPlayerCrystalChance(character, account, idleonData);
  // starSigns, cards, postOffice, talents, bubbles, jewels, labBonuses
  character.nonConsumeChance = getNonConsumeChance(character, account);
  // character.constructionSpeed = getPlayerConstructionSpeed(character, account);
  // character.constructionExpPerHour = getPlayerConstructionExpPerHour(character, account);
  const kills = char?.[`KillsLeft2Advance`];
  character.kills = kills?.reduce((res, map, index) => [...res,
    parseFloat(mapPortals?.[index]?.[0]) - parseFloat(map?.[0])], []);
  const isMiningMap = skillsMaps.mining?.[currentMapIndex];
  const isFishingMap = skillsMaps.fishing?.[currentMapIndex];
  let current = 0, currentIcon;
  if (isMiningMap) {
    current = character.skillsInfo?.mining?.level;
    currentIcon = 'ClassIconsM';
  } else if (isFishingMap) {
    current = character.skillsInfo?.fishing?.level;
    currentIcon = 'ClassIcons45';
  } else {
    current = parseFloat(mapPortals?.[currentMapIndex]?.[0]) - parseFloat(kills?.[currentMapIndex]) ?? 0;
    currentIcon = 'ClassIconsF';
  }
  character.nextPortal = {
    goal: mapPortals?.[currentMapIndex]?.[0] ?? 0,
    current,
    currentIcon
  };
  character.zow = getBarbarianZowChow(kills, [1e5]);
  character.chow = getBarbarianZowChow(kills, [1e6, 1e8]);
  const bigPBubble = getActiveBubbleBonus(character.equippedBubbles, 'kazam', 'BIG_P', account);
  const divinityLevel = character.skillsInfo?.divinity?.level;
  const linkedDeity = account?.divinity?.linkedDeities?.[character.playerId];
  character.linkedDeity = linkedDeity;
  if (linkedDeity !== -1) {
    character.deityMinorBonus = getMinorDivinityBonus(character, account);
  }
  let secondLinkedDeity;
  if (character?.class === 'Elemental_Sorcerer') {
    const polytheism = char?.SkillLevels?.[505];
    const gIndex = polytheism % 10;
    const god = gods?.[gIndex];
    if (god && (god?.godIndex !== linkedDeity)) {
      secondLinkedDeity = god?.godIndex;
      const multiplier = gods?.[secondLinkedDeity]?.minorBonusMultiplier;
      character.secondLinkedDeityIndex = gIndex;
      character.secondDeityMinorBonus = Math.max(1, bigPBubble) * (divinityLevel / (60 + divinityLevel)) * multiplier;
    }
  }
  const divStyleIndex = account?.divinity?.linkedStyles?.[character?.playerId];
  character.divStyle = { ...divStyles?.[divStyleIndex], index: divStyleIndex };
  // if (linkedDeity === 2) {
  //   character.nobisectBlessing = calcNobisectBlessing(character, account, charactersLevels);
  // }
  character.isDivinityConnected = account?.divinity?.linkedDeities?.[character?.playerId] === 4 || isGodEnabledBySorcerer(character, 4);
  const highestLevelElementalSorc = getHighestLevelOfClass(charactersLevels, 'Elemental_Sorcerer');
  let familyEffBonus = getFamilyBonusBonus(classFamilyBonuses, 'LV_FOR_ALL_TALENTS_ABOVE_LV_1', highestLevelElementalSorc);
  if (character?.class === 'Elemental_Sorcerer') {
    familyEffBonus *= (1 + getTalentBonus(character?.talents, 3, 'THE_FAMILY_GUY') / 100);
    const familyBonus = getFamilyBonus(classFamilyBonuses, 'LV_FOR_ALL_TALENTS_ABOVE_LV_1');
    familyEffBonus = getFamilyBonusValue(familyEffBonus, familyBonus?.func, familyBonus?.x1, familyBonus?.x2);
  }
  character.addedLevels = getTalentAddedLevels(talents, null, linkedDeity, character.secondLinkedDeityIndex, character.deityMinorBonus, character.secondDeityMinorBonus, familyEffBonus, account, character);
  character.talents = applyTalentAddedLevels(talents, null, character.addedLevels);
  character.flatTalents = applyTalentAddedLevels(talents, flatTalents, character.addedLevels);
  character.activeBuffs = character.activeBuffs?.map(({ name }) => {
    return character.flatTalents?.find(({ name: tName }) => tName === name);
  });
  character.talentsLoadout = char?.AttackLoadout?.flat()?.filter((skill) => skill !== 'Null')?.map((skillIndex) =>
    character.flatTalents?.find(({ skillIndex: sIndex }) => skillIndex === sIndex)
    || character.flatStarTalents?.find(({ skillIndex: sIndex }) => skillIndex === sIndex))
  character.npcDialog = char?.NPCdialogue;
  character.questComplete = char?.QuestComplete;
  character.questCompleted = Object.entries(char?.QuestComplete)?.reduce((res, [key, value]) => res + (value === 1
    ? 1
    : 0), 0);
  character.printerSample = getPrinterSampleRate(character, account, charactersLevels);
  return character;
}

export const getRespawnRate = (character, account) => {
  const { targetMonster } = character;
  const monster = monsters?.[targetMonster];
  if (!monster || monster?.AFKtype === 'Nothing') return {
    respawnRate: 0,
    breakdown: [
      { name: 'Not fighting', value: 'TOWN' }
    ]
  };
  const isRift = targetMonster === 'riftAll';
  const { RespawnTime, worldIndex } = monster;
  const shrineBonus = getShrineBonus(account?.shrines, 7, character?.mapIndex, account?.cards, account?.sailing?.artifacts);
  const chipBonus = getPlayerLabChipBonus(character, account, 10);
  const equipmentBonus = getStatsFromGear(character, 47, account);
  const obolsBonus = getObolsBonus(character?.obols, bonuses?.etcBonuses?.[47]);
  const starSignBonus = getStarSignBonus(character, account, 'Mob_Respawn_rate')

  const worldOneAchievement = getAchievementStatus(account?.achievements, 44);
  const worldOneMeritBonus = account?.tasks?.[2]?.[0]?.[1];
  const worldOneMeritBonusPerLevel = account?.meritsDescriptions?.[0]?.[1]?.bonusPerLevel;

  const worldTwoAchievement = getAchievementStatus(account?.achievements, 109);
  const worldTwoMeritBonus = account?.tasks?.[2]?.[1]?.[1];
  const worldTwoMeritBonusPerLevel = account?.meritsDescriptions?.[1]?.[1]?.bonusPerLevel;

  const worldThreeMeritBonus = account?.tasks?.[2]?.[1]?.[1];
  const worldThreeMeritBonusPerLevel = account?.meritsDescriptions?.[1]?.[1]?.bonusPerLevel;

  const worldFourMeritBonus = account?.tasks?.[2]?.[3]?.[1];
  const worldFourMeritBonusPerLevel = account?.meritsDescriptions?.[3]?.[1]?.bonusPerLevel;

  const worldFiveAchievement = getAchievementStatus(account?.achievements, 308);
  const worldFiveMeritBonus = account?.tasks?.[2]?.[4]?.[1];
  const worldFiveMeritBonusPerLevel = account?.meritsDescriptions?.[4]?.[1]?.bonusPerLevel;

  const meritBonus = (worldIndex === 1 || isRift) ? worldOneMeritBonus * worldOneMeritBonusPerLevel
    : worldIndex === 2 ? worldTwoMeritBonus * worldTwoMeritBonusPerLevel
      : worldIndex === 3 ? worldThreeMeritBonus * worldThreeMeritBonusPerLevel
        : worldIndex === 4 ? worldFourMeritBonus * worldFourMeritBonusPerLevel
          : worldIndex === 5 ? worldFiveMeritBonus * worldFiveMeritBonusPerLevel : 0;

  const achievementBonus = (worldIndex === 1 || isRift) ? worldOneAchievement
    : worldIndex === 2 ? worldTwoAchievement
      : worldIndex === 5 ? 2 * worldFiveAchievement : 0;

  const monsterRespawnTime = isRift ? 45 : RespawnTime;

  const respawnRate = monsterRespawnTime
    / (1 + (shrineBonus
      + chipBonus
      + (equipmentBonus + obolsBonus)
      + achievementBonus
      + (starSignBonus)
      + meritBonus) / 100);

  const breakdown = [
    { name: 'Shrine', value: shrineBonus / 100 },
    { name: 'Equipment', value: equipmentBonus / 100 },
    { name: 'Achievement', value: achievementBonus / 100 },
    { name: 'Chip', value: chipBonus / 100 },
    { name: 'Starsigns', value: starSignBonus / 100 },
    { name: 'Merit', value: meritBonus / 100 },
  ];
  breakdown.sort((a, b) => a?.name.localeCompare(b?.name, 'en'))

  return {
    respawnRate,
    breakdown
  };
}

export const getDropRate = (character, account, characters) => {
  const { luck } = character?.stats || {};
  let luckMulti;
  if (luck < 1e3) {
    luckMulti = (Math.pow(luck + 1, 0.37) - 1) / 40;
  } else {
    luckMulti = (luck - 1e3) / (luck + 2500) * 0.5 + 0.297;
  }
  const postOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Non_Predatory_Loot_Box', 0);
  const firstTalentBonus = getTalentBonus(character?.talents, 1, 'ROBBINGHOOD');
  const secondTalentBonus = getTalentBonus(character?.talents, 1, 'CURSE_OF_MR_LOOTY_BOOTY');
  const starTalentBonus = getTalentBonus(character?.starTalents, null, 'BOSS_BATTLE_SPILLOVER');
  const drFromEquipment = getStatsFromGear(character, 2, account);
  const drFromObols = getObolsBonus(character?.obols, bonuses?.etcBonuses?.[2]);
  const bubbleBonus = getBubbleBonus(account?.alchemy?.bubbles, 'kazam', 'DROPPIN_LOADS', false);
  const cardBonus = getCardBonusByEffect(character?.cards?.equippedCards, 'Total_Drop_Rate');
  const guildBonus = getGuildBonusBonus(account?.guild?.guildBonuses, 10);
  const cardSetBonus = character?.cards?.cardSet?.rawName === 'CardSet26' || character?.cards?.cardSet?.rawName === 'CardSet25'
    ? character?.cards?.cardSet?.bonus
    : 0;
  const shrineBonus = getShrineBonus(account?.shrines, 4, character?.mapIndex, account?.cards, account?.sailing?.artifacts);
  const prayerBonus = getPrayerBonusAndCurse(character?.activePrayers, 'Midas_Minded', account)?.bonus
  const sigilBonus = getSigilBonus(account?.alchemy?.p2w?.sigils, 'TROVE');
  const shinyBonus = getShinyBonus(account?.breeding?.pets, 'Drop_Rate');
  const starSignBonus = getStarSignBonus(character, account, 'Drop_Rate');
  const stampBonus = getStampsBonusByEffect(account?.stamps, '+{%_Drop_Rate');
  const thirdTalentBonus = getHighestTalentByClass(characters, 3, 'Siege_Breaker', 'ARCHLORD_OF_THE_PIRATES', null, true);
  const extraDropRate = 1 + (thirdTalentBonus * lavaLog(account?.accountOptions?.[139])) / 100;
  const companionDropRate = isCompanionBonusActive(account, 3) ? account?.companions?.list?.at(3)?.bonus : 0;
  const arcadeBonus = getArcadeBonus(account?.arcade?.shop, 'Drop_Rate')?.bonus;
  const equinoxDropRateBonus = getEquinoxBonus(account?.equinox?.upgrades, 'Faux_Jewels');
  const chipBonus = getPlayerLabChipBonus(character, account, 3);

  const additive =
    firstTalentBonus +
    postOfficeBonus +
    (drFromEquipment + drFromObols) +
    bubbleBonus +
    cardBonus +
    secondTalentBonus +
    starSignBonus +
    guildBonus +
    cardSetBonus +
    shrineBonus +
    prayerBonus +
    sigilBonus +
    shinyBonus +
    arcadeBonus +
    companionDropRate +
    stampBonus;
  let dropRate = 1.4 * luckMulti
    + (additive + (starTalentBonus * account?.accountOptions?.[189] + equinoxDropRateBonus)) / 100 + 1;
  if (dropRate < 5 && chipBonus > 0) {
    dropRate = Math.min(5, dropRate + chipBonus / 100);
  }
  let final = dropRate * extraDropRate;
  const hasDrBundle = isBundlePurchased(account?.bundles, 'bun_p');
  if (hasDrBundle) {
    final *= 1.2
  }
  const breakdown = [
    { name: 'Luck', value: 1.4 * luckMulti },
    { name: 'Talents', value: (firstTalentBonus + secondTalentBonus) / 100 },
    { name: 'Post Office', value: postOfficeBonus / 100 },
    { name: 'Equipment', value: drFromEquipment / 100 },
    { name: 'Obols', value: drFromObols / 100 },
    { name: 'Bubble', value: bubbleBonus / 100 },
    { name: 'Cards', value: (cardBonus + cardSetBonus) / 100 },
    { name: 'Shrine', value: shrineBonus / 100 },
    { name: 'Prayers', value: prayerBonus / 100 },
    { name: 'Sigil', value: sigilBonus / 100 },
    { name: 'Shiny', value: shinyBonus / 100 },
    { name: 'Arcade', value: arcadeBonus / 100 },
    { name: 'Starsign', value: starSignBonus / 100 },
    { name: 'Guild', value: guildBonus / 100 },
    { name: 'Siege Breaker', value: extraDropRate },
    { name: 'Companion', value: companionDropRate / 100 },
    { name: 'Equinox', value: 5 * equinoxDropRateBonus / 100 },
    { name: 'Gem Bundle', value: hasDrBundle ? 1.2 : 0 },
    { name: 'Base', value: 1 },
  ]
  breakdown.sort((a, b) => a?.name.localeCompare(b?.name, 'en'))
  return {
    dropRate: final,
    breakdown
  };
}

export const getCashMulti = (character, account, characters) => {
  const { strength, agility, wisdom } = character?.stats || {};
  const cashStrBubble = getBubbleBonus(account?.alchemy?.bubbles, 'power', 'PENNY_OF_STRENGTH', false, mainStatMap?.[character?.class] === 'strength');
  const cashAgiBubble = getBubbleBonus(account?.alchemy?.bubbles, 'quicc', 'DOLLAR_OF_AGILITY', false, mainStatMap?.[character?.class] === 'agility');
  const cashWisBubble = getBubbleBonus(account?.alchemy?.bubbles, 'high-iq', 'NICKEL_OF_WISDOM', false, mainStatMap?.[character?.class] === 'wisdom');
  const spelunkerObolMulti = getLabBonus(account?.lab.labBonuses, 8); // gem multi
  const blackDiamondRhinestone = getJewelBonus(account?.lab.jewels, 16, spelunkerObolMulti);
  const mealBonus = getMealsBonusByEffectOrStat(account, null, 'Cash', blackDiamondRhinestone);
  const artifactBonus = isArtifactAcquired(account?.sailing?.artifacts, 'Maneki_Kat')?.bonus ?? 0;
  const arenaWave = account?.accountOptions?.[89];
  const waveReqs = randomList?.[53];
  const arenaBonusUnlock = +(isArenaBonusActive(arenaWave, waveReqs, 5));
  const secondArenaBonusUnlock = +(isArenaBonusActive(arenaWave, waveReqs, 14));
  const statueBonus = getStatueBonus(account?.statues, 'StatueG20');
  const labBonus = getLabBonus(account?.lab.labBonuses, 9);
  const prayerBonus = getPrayerBonusAndCurse(character?.activePrayers, 'Jawbreaker', account)?.bonus;
  const divinityMinorBonus = characters?.reduce((sum, char) => {
    if (isCompanionBonusActive(account, 3)) {
      return sum + getMinorDivinityBonus(char, account, 3, characters);
    }
    if (char?.linkedDeity === 3) {
      return sum + char?.deityMinorBonus;
    }
    return sum;
  }, 0);
  const vialBonus = getVialsBonusByEffect(account?.alchemy?.vials, null, 'MonsterCash');
  const cashFromEquipment = getStatsFromGear(character, 3, account);
  const cashFromObols = getObolsBonus(character?.obols, bonuses?.etcBonuses?.[3])
  const passiveCardBonus = getCardBonusByEffect(account?.cards, 'Money_from_mobs_(Passive)');
  const equippedCardBonus = getCardBonusByEffect(character?.cards?.equippedCards, 'Money_from_Monsters');
  const talentBonus = getTalentBonus(character?.talents, 1, 'CHACHING!');
  const flurboBonus = getDungeonFlurboStatBonus(account?.dungeons?.upgrades, 'Monster_Cash');
  const arcadeBonus = account?.arcade?.shop?.[10]?.bonus + account?.arcade?.shop?.[11]?.bonus;
  const postOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Utilitarian_Capsule', 2)
  const guildBonus = getGuildBonusBonus(account?.guild?.guildBonuses, 8);
  const multikill = 1; // can't calculate multikill =/
  const coinsForCharonBonus = multikill * getTalentBonus(character?.starTalents, null, 'COINS_FOR_CHARON');
  const cashPerCookingLv = character?.skillsInfo?.cooking?.level / 10;
  const americanTipperBonus = cashPerCookingLv * getTalentBonus(character?.starTalents, null, 'AMERICAN_TIPPER');
  const goldFoodBonus = getGoldenFoodBonus('Golden_Bread', character, account)
  const achievementBonus = getAchievementStatus(account?.achievements, 235);
  const { dropRate } = getDropRate(character, account, characters);
  const dropRateMulti = (dropRate < 2 ? dropRate : Math.floor(dropRate < 5 ? dropRate : dropRate + 1)) * 100;

  const bubbles = (cashStrBubble
    * Math.floor(strength / 250)
    + (cashAgiBubble
      * Math.floor(agility / 250)
      + cashWisBubble
      * Math.floor(wisdom / 250)));

  const cashMulti = (1 + (bubbles) / 100)
    * (1 + (mealBonus
      + artifactBonus) / 100)
    * (1 + (0.5 * arenaBonusUnlock
      + (secondArenaBonusUnlock
        + statueBonus / 100)))
    * (1 + labBonus / 100)
    * (1 + prayerBonus / 100)
    * (1 + divinityMinorBonus / 100)
    * (1 + (vialBonus
      + ((cashFromEquipment + cashFromObols)
        + (equippedCardBonus
          + passiveCardBonus
          + (talentBonus
            + (flurboBonus + (arcadeBonus)
              + (postOfficeBonus
                + (guildBonus
                  * (1 + Math.floor(character?.mapIndex / 50))
                  + (coinsForCharonBonus
                    + (americanTipperBonus
                      + ((1 + goldFoodBonus / 100) + 5 * achievementBonus)))))))))) / 100);
  const breakdown = [
    { name: 'Bubbles*', value: bubbles },
    { name: 'Meal*', value: mealBonus },
    { name: 'Artifact*', value: artifactBonus },
    { name: 'Pet Arena*', value: 100 * (.5 * arenaBonusUnlock + secondArenaBonusUnlock) },
    { name: 'Statues', value: statueBonus },
    { name: 'Lab*', value: labBonus },
    { name: 'Prayers*', value: prayerBonus },
    { name: 'Divinity*', value: divinityMinorBonus },
    { name: 'Vials', value: vialBonus },
    { name: 'Equipment', value: cashFromEquipment },
    { name: 'Obols', value: cashFromObols },
    { name: 'Cards', value: equippedCardBonus + passiveCardBonus },
    { name: 'Guild', value: guildBonus * (1 + Math.floor(character?.mapIndex / 50)) },
    { name: 'Talents', value: coinsForCharonBonus + americanTipperBonus },
    { name: 'Golden Food', value: goldFoodBonus },
    { name: 'Achievements', value: 5 * achievementBonus },
    { name: 'Dungeons', value: flurboBonus },
    { name: 'Arcade', value: arcadeBonus },
    { name: 'Post Office', value: postOfficeBonus },
    { name: 'Drop Rate*', value: dropRateMulti },
  ];
  breakdown.sort((a, b) => a?.name.localeCompare(b?.name, 'en'))
  // cashMulti: cashMulti * (1 + dropRateMulti / 100),

  return {
    cashMulti,
    breakdown
  }
}

const getPrinterSampleRate = (character, account, charactersLevels) => {
  const printerSamplingTalent = getTalentBonus(character?.starTalents, null, 'PRINTER_SAMPLING');
  const saltLickBonus = getSaltLickBonus(account?.saltLick, 0);
  const equipSampling = getStatsFromGear(character, 60, account);
  const sampleItBubble = getBubbleBonus(account?.alchemy?.bubbles, 'kazam', 'SAMPLE_IT', false);
  const superSampleTalent = getTalentBonus(character?.talents, null, 'SUPER_SAMPLES');
  const sampleAchievement = getAchievementStatus(account?.achievements, 158);
  const vialBonus = getVialsBonusByEffect(account?.alchemy?.vials, 'Printer_sample');
  const theRoyalSamplerPrayer = getPrayerBonusAndCurse(character?.activePrayers, 'The_Royal_Sampler', account)?.bonus;
  const stampBonus = getStampsBonusByEffect(account?.stamps, '3D_Printer_Sampling_Size');
  const meritBonus = account?.tasks?.[2]?.[2]?.[4];
  const highestLevelMaestro = getHighestLevelOfClass(charactersLevels, 'Voidwalker');
  const familyPrinterSample = getFamilyBonusBonus(classFamilyBonuses, 'PRINTER_SAMPLE_SIZE', highestLevelMaestro) || 0;
  const arcadeSampleBonus = getArcadeBonus(account?.arcade?.shop, 'Sample_Size')?.bonus;
  const postofficeSampleBonus = getPostOfficeBonus(character?.postOffice, 'Utilitarian_Capsule', 0);

  const printerSample = (printerSamplingTalent
    + (saltLickBonus + equipSampling)
    + (sampleItBubble + (superSampleTalent + Math.min(1, sampleAchievement)))
    + (vialBonus)
    + (theRoyalSamplerPrayer)
    + (stampBonus)
    + (Math.min(5, 0.5 * meritBonus))
    + (Math.min(5, familyPrinterSample))
    + (arcadeSampleBonus + postofficeSampleBonus)) / 100
  ;

  return Math.floor(1e3 * printerSample) / 10;
}


export const getBarbarianZowChow = (allKills, thresholds) => {
  const excludedMaps = [
    'Nothing', 'Z', 'Copper',
    'Iron', 'Starfire', 'Plat', 'Void',
    'Filler', 'JungleZ', 'Grandfrog\'s_Gazebo',
    'Grandfrog\'s_Backyard', 'Gravel_Tomb', 'Heaty_Hole',
    'Igloo\'s_Basement', 'Inside_the_Igloo', 'End_Of_The_Road',
    'Efaunt\'s_Tomb', 'Eycicles\'s_Nest', 'Enclave_a_la_Troll', 'Chizoar\'s_Cavern'].toSimpleObject();
  const list = Object.values(mapNames).map((mapName, index) => {
    const rawName = mapEnemiesArray?.[index];
    const { MonsterFace, Name, AFKtype } = monsters?.[rawName] || {};
    const kills = Math.abs(allKills?.[index]?.[0] - mapDetails?.[index]?.[0]?.[0]);
    return {
      mapName,
      afkTarget: rawName,
      kills,
      monsterFace: MonsterFace,
      name: Name,
      afkType: AFKtype,
      done: thresholds?.map((threshold) => kills >= threshold),
    }
  }).filter(({
               mapName,
               afkTarget,
               name,
               afkType,
               kills,
               mapThreshold
             }) => afkType === 'FIGHTING' && !excludedMaps[mapName] && !afkType.includes('Fish') && !afkType.includes('Bug') && !mapName.includes('Colosseum'));

  const finished = list?.reduce((sum, { done }) => [done?.[0] ? sum?.[0] + 1 : sum?.[0],
    done?.[1] ? sum?.[1] + 1 : sum?.[1]], [0, 0]);
  return {
    finished,
    list
  }
}

export const getPlayerCrystalChance = (character, account, idleonData) => {
  const sailingRaw = tryToParse(idleonData?.Sailing) || idleonData?.Sailing;
  const acquiredArtifacts = sailingRaw?.[3];
  const moaiiHead = acquiredArtifacts?.[0] > 0;
  const crystalShrineBonus = getShrineBonus(account?.shrines, 6, character.mapIndex, account.cards, moaiiHead);
  const crystallinStampBonus = getStampBonus(account?.stamps, 'misc', 'StampC3', character);
  const poopCard = character?.cards?.equippedCards?.find(({ cardIndex }) => cardIndex === 'A10');
  const poopCardBonus = poopCard ? calcCardBonus(poopCard) : 0;
  const demonGenie = character?.cards?.equippedCards?.find(({ cardIndex }) => cardIndex === 'G4');
  const demonGenieBonus = demonGenie ? calcCardBonus(demonGenie) : 0;
  const crystals4DaysBonus = getTalentBonus(character?.starTalents, null, 'CRYSTALS_4_DAYYS');
  const cmonOutCrystalsBonus = getTalentBonus(character?.talents, 1, 'CMON_OUT_CRYSTALS');
  const nonPredatoryBoxBonus = getPostOfficeBonus(character?.postOffice, 'Non_Predatory_Loot_Box', 2);
  const breakdown = [
    { name: 'Cmon Out Crystals', value: cmonOutCrystalsBonus },
    { name: 'Crystal Shrine Bonus', value: crystalShrineBonus },
    { name: 'Post Office', value: nonPredatoryBoxBonus },
    { name: 'Crystals 4 Days', value: crystals4DaysBonus },
    { name: 'Crystallin Stamp', value: crystallinStampBonus },
    { name: 'Poop Card', value: poopCardBonus },
    { name: 'Demon Genie Card', value: demonGenieBonus },
  ]
  breakdown.sort((a, b) => a?.name.localeCompare(b?.name, 'en'))
  return {
    value: 0.0005 * (1 + cmonOutCrystalsBonus / 100) * (1 + (nonPredatoryBoxBonus + crystalShrineBonus) / 100) * (1 + crystals4DaysBonus / 100)
      * (1 + crystallinStampBonus / 100) * (1 + (poopCardBonus + demonGenieBonus) / 100),
    breakdown
  }
}

export const getPlayerFoodBonus = (character, account, isHealth) => {
  const postOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Carepack_From_Mum', 2)
  const statuePower = getStatueBonus(account?.statues, 'StatueG4', character?.talents);
  const equipmentFoodEffectBonus = getStatsFromGear(character, 9, account);
  const stampBonus = getStampsBonusByEffect(account?.stamps, 'Effect_from_Boost_Food', character)
  const starSignBonus = getStarSignBonus(character, account, 'All_Food_Effect');
  const cardBonus = getEquippedCardBonus(character?.cards, 'Y5');
  const cardSet = character?.cards?.cardSet?.rawName === 'CardSet1' ? character?.cards?.cardSet?.bonus : 0;
  const talentBonus = getTalentBonus(character?.starTalents, null, 'FROTHY_MALK');

  if (isHealth) {
    const goldenHealthFood = 1;
    const secondPostOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Carepack_From_Mum', 1);
    const stampBonus = getStampsBonusByEffect(account?.stamps, 'Boost_Health_Effect', character)
    return goldenHealthFood
      + (secondPostOfficeBonus
        + (statuePower
          + (equipmentFoodEffectBonus
            + (stampBonus
              + (starSignBonus
                + cardSet))))) / 100;
  }
  return 1 + (postOfficeBonus + (statuePower +
    (equipmentFoodEffectBonus + (stampBonus + ((starSignBonus) +
      (cardBonus + (cardSet + talentBonus))))))) / 100;
}

export const getPlayerSpeedBonus = (character, characters, account) => {
  let finalSpeed;
  const featherWeight = getTalentBonus(character?.talents, 0, 'FEATHERWEIGHT');
  const featherFlight = getTalentBonus(character?.talents, 0, 'FEATHER_FLIGHT');
  const stampBonus = getStampsBonusByEffect(account?.stamps, 'Movement_Speed', character)
  const strafe = getTalentBonusIfActive(character?.activeBuffs, 'STRAFE');
  const foodBonus = getFoodBonus(character, account, 'MoveSpdBoosts')
  let baseMath = foodBonus + featherWeight + stampBonus + strafe;
  let agiMulti;
  if (character.stats?.agility < 1000) {
    agiMulti = (Math.pow(character.stats?.agility + 1, .4) - 1) / 40;
  } else {
    agiMulti = (character.stats?.agility - 1e3) / (character.stats?.agility + 2500) * .5 + .371;
  }
  const statuePower = getStatueBonus(account?.statues, 'StatueG2', character?.talents);
  // const speedFromStatue = 1 + (speedBonusFromPotions + (statuePower) / 2.2);
  const speedStarSign = getStarSignBonus(character, account, 'Movement_Speed');
  const equipmentSpeedEffectBonus = getStatsFromGear(character, 1, account);
  const cardBonus = getCardBonusByEffect(character?.cards?.equippedCards, 'Move_Spd');
  finalSpeed = (baseMath + (statuePower + ((speedStarSign) + (equipmentSpeedEffectBonus + (cardBonus + featherFlight))))) / 100; // 1.708730398284699
  finalSpeed = 1 + (finalSpeed + (agiMulti) / 2.2); // 2.829035843985983
  const tipToeQuickness = getTalentBonus(character?.starTalents, null, 'TIPTOE_QUICKNESS');
  if (finalSpeed > 2) {
    finalSpeed = Math.floor(100 * finalSpeed) / 100;
  } else if (finalSpeed > 1.75) {
    finalSpeed = Math.min(2, Math.floor(100 * ((finalSpeed) + tipToeQuickness / 100)) / 100)
  } else {
    const saltLickBonus = getSaltLickBonus(account?.saltLick, 7);
    const groundedMotherboard = account?.lab?.playersChips?.[character?.playerId]?.find((chip) => chip.index === 15)?.baseVal ?? 0;
    const sigilBonus = getSigilBonus(account?.alchemy?.p2w?.sigils, 'TUFT_OF_HAIR');
    finalSpeed = Math.min(1.75, Math.floor(100 * (finalSpeed + (saltLickBonus + groundedMotherboard + (tipToeQuickness + sigilBonus)) / 100)) / 100)
  }
  return Math.round(finalSpeed * 100);
}

export const getAfkGain = (character, characters, account) => {
  const { targetMonster } = character;
  const { lab, guild, dungeons, accountOptions, bribes, shrines, charactersLevels, tasks } = account;
  const afkGainsTaskBonus = tasks?.[2]?.[1]?.[2] > character?.playerId ? 2 : 0;
  const monster = monsters?.[targetMonster];

  const bribeAfkGains = bribes?.[24]?.done ? bribes?.[24]?.value : 0;
  const shrineAfkGains = getShrineBonus(shrines, 8, character?.mapIndex, account.cards, account?.sailing?.artifacts);
  if (monster?.Name !== '_') {
    const highestVoidwalker = getHighestLevelOfClass(charactersLevels, 'Voidwalker');
    const familyEffBonus = getFamilyBonusBonus(classFamilyBonuses, 'FIGHTING_AFK_GAINS', highestVoidwalker);
    const postOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Civil_War_Memory_Box', 1);
    const firstTalentBonus = getTalentBonus(character?.talents, 0, 'IDLE_BRAWLING');
    const secondTalentBonus = getTalentBonus(character?.talents, 0, 'IDLE_CASTING');
    const thirdTalentBonus = getTalentBonus(character?.talents, 0, 'IDLE_SHOOTING');
    const fourthTalentBonus = getTalentBonus(character?.talents, 0, 'SLEEPIN\'_ON_THE_JOB');
    const firstStarTalentBonus = getTalentBonus(character?.starTalents, null, 'TICK_TOCK');
    const bribeBonus = bribes?.[3]?.done ? bribes?.[3]?.value : 0;
    const cardSetBonus = character?.cards?.cardSet?.rawName === 'CardSet8' ? character?.cards?.cardSet?.bonus : 0;
    const equippedCardBonus = getCardBonusByEffect(character?.cards?.equippedCards, 'Fighting_AFK_gain_rate');
    const fightEquipmentBonus = getStatsFromGear(character, 20, account);
    const fightObolsBonus = getObolsBonus(character?.obols, bonuses?.etcBonuses?.[20])
    const afkEquipmentBonus = getStatsFromGear(character, 59, account);
    const afkObolsBonus = getObolsBonus(character?.obols, bonuses?.etcBonuses?.[59])
    const starSignBonus = getStarSignBonus(character, account, 'Fight_AFK_Gain');
    let guildBonus = 0;
    if (guild?.guildBonuses?.length > 0) {
      guildBonus = getGuildBonusBonus(guild?.guildBonuses, 4);
    }
    const prayerBonus = getPrayerBonusAndCurse(character?.activePrayers, 'Zerg_Rushogen', account)?.bonus;
    const prayerCurse = getPrayerBonusAndCurse(character?.activePrayers, 'Ruck_Sack', account)?.curse;
    const chipBonus = account?.lab?.playersChips?.[character?.playerId]?.find((chip) => chip.index === 7)?.baseVal ?? 0;
    const arcadeBonus = getArcadeBonus(account?.arcade?.shop, 'AFK_Gains_Rate')?.bonus;
    const dungeonBonus = getDungeonFlurboStatBonus(account?.dungeons?.upgrades, 'AFK_Gains');
    const majorBonus = isCompanionBonusActive(account, 0) || character?.linkedDeity === 0 || character?.secondLinkedDeityIndex === 0
      ? 1
      : 0;
    const divinityMinorBonus = characters?.reduce((sum, char) => {
      if (isCompanionBonusActive(account, 0)) {
        return sum + getMinorDivinityBonus(char, account, 4, characters);
      }
      if (char?.linkedDeity === 4) {
        return char?.deityMinorBonus > sum ? char?.deityMinorBonus : sum;
      } else if (char?.secondLinkedDeityIndex === 4) {
        return char?.secondDeityMinorBonus > sum ? char?.secondDeityMinorBonus : sum;
      }
      return sum;
    }, 0);
    const compBonus = isCompanionBonusActive(account, 6) && 5;
    const base = afkGainsTaskBonus
      + (arcadeBonus
        + (dungeonBonus
          + (30 * majorBonus
            + divinityMinorBonus + compBonus)));

    let gains = 0.2 + (familyEffBonus + postOfficeBonus
      + firstTalentBonus + bribeBonus + (thirdTalentBonus + cardSetBonus
        + (secondTalentBonus + (firstStarTalentBonus + (base
          + (equippedCardBonus + (fourthTalentBonus + ((fightEquipmentBonus + fightObolsBonus) + (afkEquipmentBonus + afkObolsBonus)
            + (starSignBonus + (guildBonus + (prayerBonus - prayerCurse + chipBonus))))))))))) / 100;

    let math = gains;
    if (gains < 1.5) {
      math = Math.min(1.5, gains + shrineAfkGains / 100);
    }
    const final = Math.max(.01, math);

    const breakdown = [
      { name: 'Tasks', value: afkGainsTaskBonus },
      { name: 'Arcade Shop', value: arcadeBonus },
      { name: 'Flurbo', value: dungeonBonus },
      { name: 'Major God', value: 30 * majorBonus },
      { name: 'Minor God', value: divinityMinorBonus },
      { name: 'Family', value: familyEffBonus },
      { name: 'Post Office', value: postOfficeBonus },
      { name: 'Talents', value: firstTalentBonus + secondTalentBonus + thirdTalentBonus + fourthTalentBonus },
      { name: 'Bribe', value: bribeBonus },
      { name: 'Card Set', value: cardSetBonus },
      { name: 'Cards', value: equippedCardBonus },
      { name: 'Equipment', value: fightEquipmentBonus + afkEquipmentBonus },
      { name: 'Obols', value: fightObolsBonus + afkObolsBonus },
      { name: 'Prayers', value: prayerBonus - prayerCurse },
      { name: 'Chips', value: chipBonus },
      { name: 'Guild', value: guildBonus },
      { name: 'Starsign', value: starSignBonus },
      { name: 'Shrine (< 150)', value: gains < 1.5 ? shrineAfkGains : 0 },
    ]

    return {
      afkGains: final,
      breakdown
    };
  }
  // if (skillName !== 'fighting') {
  //   let guildAfkGains = 0;
  //   const amarokBonus = getEquippedCardBonus(character?.cards, 'Z2');
  //   const bunnyBonus = getEquippedCardBonus(character?.cards, 'F7');
  //   if (guild?.guildBonuses?.length > 0) {
  //     guildAfkGains = getGuildBonusBonus(guild?.guildBonuses?.bonuses, 7);
  //   }
  //   const cardSet = character?.cards?.cardSet?.rawName === 'CardSet7' ? character?.cards?.cardSet?.bonus : 0;
  //   const conductiveProcessor = lab?.playersChips.find((chip) => chip.index === 8)?.baseVal ?? 0;
  //   const equipmentAfkEffectBonus = getStatsFromGear(character, 24, account);
  //   const equipmentShrineEffectBonus = getStatsFromGear(character, 59, account);
  //   const zergRushogen = getPrayerBonusAndCurse(character?.activePrayers, 'Zerg_Rushogen', account)?.bonus;
  //   const ruckSack = getPrayerBonusAndCurse(character?.activePrayers, 'Ruck_Sack', account)?.curse;
  //   const nonFightingGains = 2 + (amarokBonus + bunnyBonus) + (guildAfkGains + cardSet +
  //     (conductiveProcessor + (equipmentAfkEffectBonus + equipmentShrineEffectBonus + (zergRushogen - ruckSack))));
  //   const dungeonAfkGains = getDungeonStatBonus(dungeons?.upgrades, 'AFK_Gains');
  //   const arcadeAfkGains = getArcadeBonus(account?.arcade?.shop, 'AFK_Gains_Rate')?.bonus;
  //   const baseMath = (nonFightingGains) + (arcadeAfkGains + dungeonAfkGains);
  //
  //   if ("cooking") {
  //     const tickTockBonus = getTalentBonus(character?.starTalents, null, 'TICK_TOCK');
  //     const trappingBonus = getTrappingStuff('TrapMGbonus', 8, accountOptions)
  //     const starSignAfkGains = getStarSignBonus(character, account, 'Skill_AFK_Gain');
  //     const bribeAfkGains = bribes?.[24]?.done ? bribes?.[24]?.value : 0;
  //     let afkGains = .25 + (tickTockBonus + (baseMath + (trappingBonus + ((starSignAfkGains) + bribeAfkGains)))) / 100;
  //     if (afkGains < .8) {
  //       const shrineAfkGains = getShrineBonus(shrines, 8, character?.mapIndex, account.cards, account?.sailing?.artifacts);
  //       afkGains = Math.min(.8, afkGains + shrineAfkGains / 100);
  //     }
  //     return afkGains;
  //   }
  // }
  return {
    afkGains: 0,
    breakdown: []
  }
}

const getTrappingStuff = (type, index, optionsList) => {
  if (type === 'TrapMGbonus') {
    const value = optionsList?.[99];
    if (value >= 25 * (index + 1)) {
      const parsed = randomList?.[59]?.split(' ')?.map((num) => parseFloat(num));
      return parsed?.[index];
    }
    return 0;
  }
  return 1;
}

export const getPlayerCapacity = (bag, capacities) => {
  if (bag) {
    return getMaterialCapacity(bag, capacities);
  }
  return 50;
}

export const getSmithingExpMulti = (focusedSoulTalentBonus, happyDudeTalentBonus, smithingCards, blackSmithBoxBonus0, allSkillExp, leftHandOfLearningTalentBonus) => {
  // missing smartas smithing stamp
  const talentsBonus = 1 + (focusedSoulTalentBonus + happyDudeTalentBonus) / 100;
  const cardsBonus = 1 + smithingCards / 100;
  return Math.max(0.1, talentsBonus * cardsBonus * (1 + blackSmithBoxBonus0 / 100) + (allSkillExp + leftHandOfLearningTalentBonus) / 100);
}

const getNonConsumeChance = (character, account) => {
  const { starSigns, cards, postOffice, talents, equippedBubbles } = character;
  const { lab } = account;
  const spelunkerObolMulti = getLabBonus(lab?.labBonuses, 8); // gem multi
  const nonConsumeJewelBonus = getJewelBonus(lab?.jewels, 8, spelunkerObolMulti);
  const baseMath = 90 + 5 * nonConsumeJewelBonus;
  const biteButNotChewBubbleBonus = getActiveBubbleBonus(equippedBubbles, 'power', 'BITE_BUT_NOT_CHEW', account);
  const bubbleMath = Math.min(baseMath, 98 + Math.min(biteButNotChewBubbleBonus, 1));
  const jewelMath = Math.max(1, nonConsumeJewelBonus);
  const freeMealBonus = getTalentBonus(talents, 1, 'FREE_MEAL');
  const carePackFromMumBonus = getPostOfficeBonus(postOffice, 'Carepack_From_Mum', 0);
  const crabCakeBonus = getEquippedCardBonus(cards?.equippedCards, 'B3');
  const starSingBonus = getStarSignByEffect(starSigns, account, 'chance_to_not');
  return Math.min(bubbleMath, jewelMath * (freeMealBonus + (carePackFromMumBonus + (crabCakeBonus + starSingBonus + biteButNotChewBubbleBonus))))
}

export const getPlayerConstructionSpeed = (character, account) => {
  const constructionLevel = character?.skillsInfo?.construction?.level;
  const baseMath = 3 * Math.pow((constructionLevel) / 2 + 0.7, 1.6);
  const mainStat = mainStatMap?.[character?.class];
  const bubbleBonus = getBubbleBonus(account?.alchemy?.bubbles, 'power', 'CARPENTER', false, mainStat === 'strength');
  const stampsBonus = getStampsBonusByEffect(account?.stamps, 'Building_Speed', character);
  const postOffice = getPostOfficeBoxLevel(character?.postOffice, 'Construction_Container');
  const guildBonus = getGuildBonusBonus(account?.guild?.guildBonuses, 5);
  const equipmentConstructionEffectBonus = getStatsFromGear(character, 30, account);
  const obolsBonus = getObolsBonus(character?.obols, bonuses?.etcBonuses?.[30]);
  const constructionAchievement = getAchievementStatus(account?.achievements, 153);
  const constructMastery = getConstructMastery(account?.towers?.totalLevels, 'Build Spd');
  const vialBonus = getVialsBonusByEffect(account?.alchemy?.vials, null, 'Contspd');
  const moreMath = 1 + (stampsBonus + 0.25 * postOffice + (guildBonus + (equipmentConstructionEffectBonus + obolsBonus) + Math.min(5, 5 * constructionAchievement) + constructMastery + vialBonus)) / 100;
  const talentBonus = getTalentBonus(character?.talents, 2, 'REDOX_RATES', false, true);
  const atomBonus = getAtomBonus(account, 'Helium_-_Talent_Power_Stacker');
  const redSaltAmount = calculateItemTotalAmount([...account?.storage,
    ...account?.refinery?.refineryStorage], 'Refinery1', true, true);
  return Math.floor(baseMath * (1 + (constructionLevel * bubbleBonus) / 100) * moreMath * (1 + (talentBonus * (atomBonus + lavaLog(redSaltAmount))) / 100));
}

export const getPlayerConstructionExpPerHour = (character, account) => {
  const playerBuildSpeed = character?.constructionSpeed;
  const activeBubbleBonus = getActiveBubbleBonus(character.equippedBubbles, 'power', 'CALL_ME_BOB', account);
  const talentBonus = getTalentBonus(character?.talents, 2, 'SHARPER_SAWS');
  const secondTalentBonus = getTalentBonus(character?.talents, 1, 'TEMPESTUOUS_EMOTIONS');
  const vialBonus = getVialsBonusByEffect(account?.alchemy?.vials, null, 'ConsExp');
  const statueBonus = getStatueBonus(account?.statues, 'StatueG19', character?.talents);
  const stampBonus = getStampsBonusByEffect(account?.stamps, '+{%_Construction_Exp_Gain', character);
  const starSignBonus = getStarSignBonus(character, account, 'Construct_Exp');
  const postOfficeBonus = getPostOfficeBoxLevel(character?.postOffice, 'Construction_Container');
  return Math.ceil((Math.pow(playerBuildSpeed, 0.7) / 2 + (2 + 6 * character?.skillsInfo?.construction?.level))
    * (1 + (activeBubbleBonus + (talentBonus + secondTalentBonus + (vialBonus + (statueBonus + (stampBonus + (starSignBonus + Math.max(0, 0.5 *
      ((postOfficeBonus) - 100)))))))) / 100));
}