import {
  bonuses,
  cardBonuses,
  carryBags,
  classes,
  classFamilyBonuses,
  divStyles,
  fishingKits,
  gods,
  invBags,
  items,
  mapDetails,
  mapEnemiesArray,
  mapNames,
  mapPortals,
  monsters,
  ninjaExtraInfo,
  randomList,
  starSignByIndexMap
} from '../data/website-data';
import {
  calculateAfkTime,
  getEventShopBonus,
  getFoodBonus,
  getGoldenFoodBonus,
  getHighestLevelOf,
  getHighestLevelOfClass,
  getMaterialCapacity,
  getRandomEventItems,
  getSkillMasteryBonusByIndex,
  isArenaBonusActive,
  isBundlePurchased,
  isCompanionBonusActive,
  isMasteryBonusUnlocked
} from './misc';
import { calculateItemTotalAmount, createItemsWithUpgrades, getStatsFromGear } from './items';
import { getInventoryList } from './storage';
import { skillIndexMap, skillsMaps } from './parseMaps';
import {
  applyTalentAddedLevels,
  checkCharClass,
  CLASSES,
  createTalentPage,
  getActiveBuffs,
  getBubonicGreenTube,
  getHighestTalentByClass,
  getMaestroHand,
  getTalentAddedLevels,
  getTalentBonus,
  getTalentBonusIfActive,
  getVoidWalkerTalentEnhancements,
  mainStatMap,
  starTalentsPages,
  talentPagesMap
} from './talents';
import {
  calcCardBonus,
  getCardBonusByEffect,
  getEquippedCardBonus,
  getEquippedCardsData,
  getPlayerCards
} from './cards';
import { getStampBonus, getStampsBonusByEffect } from './stamps';
import { getPlayerPostOffice, getPostOfficeBonus, getPostOfficeBoxLevel } from './postoffice';
import {
  getActiveBubbleBonus,
  getBubbleBonus,
  getSigilBonus,
  getVialsBonusByEffect,
  getVialsBonusByStat
} from './alchemy';
import { getStatueBonus } from './statues';
import { getStarSignBonus, getStarSignByEffect } from './starSigns';
import { getAnvil } from './anvil';
import { getPrayerBonusAndCurse } from './prayers';
import { getGuildBonusBonus } from './guild';
import { getShrineBonus } from './shrines';
import { getFamilyBonusBonus, getUpdatedFamilyBonus } from './family';
import { getSaltLickBonus } from './saltLick';
import { getDungeonFlurboStatBonus, getDungeonStatBonus } from './dungeons';
import { getCookingEff, getCookingProwess, getMealsBonusByEffectOrStat } from './cooking';
import { getObols, getObolsBonus, mergeCharacterAndAccountObols } from './obols';
import { getPlayerWorship } from './worship';
import { getPlayerQuests } from './quests';
import { getJewelBonus, getLabBonus, getLabEfficiency, getPlayerLabChipBonus, isGodEnabledBySorcerer } from './lab';
import { getAchievementStatus } from './achievements';
import { lavaLog, notateNumber } from '../utility/helpers';
import { getArcadeBonus } from './arcade';
import { isArtifactAcquired } from './sailing';
import { getShinyBonus } from './breeding';
import { getDeityLinkedIndex, getDivStylePerHour, getGodByIndex, getMinorDivinityBonus } from './divinity';
import { getEquinoxBonus } from './equinox';
import { getConstructMastery } from './world-4/rift';
import { getAtomBonus } from './atomCollider';
import {
  getCharmBonus,
  getInventoryNinjaItem,
  getJadeEmporiumBonus,
  getNinjaEquipmentBonus,
  getNinjaUpgradeBonus
} from '@parsers/world-6/sneaking';
import { getWinnerBonus } from '@parsers/world-6/summoning';
import { getOwlBonus } from '@parsers/world-1/owl';
import { getLandRank, getLandRankTotalBonus, getMarketBonus } from '@parsers/world-6/farming';
import { getVoteBonus } from '@parsers/world-2/voteBallot';
import { getKangarooBonus } from '@parsers/world-2/kangaroo';
import { getSchematicBonus } from '@parsers/world-5/caverns/the-well';
import { getGrimoireBonus } from '@parsers/grimoire';
import { getUpgradeVaultBonus } from '@parsers/misc/upgradeVault';
import { getGambitBonus } from '@parsers/world-5/caverns/gambit';
import { getMeasurementBonus } from '@parsers/world-5/hole';
import { getMonumentBonus } from '@parsers/world-5/caverns/bravery';
import { isSuperbitUnlocked } from '@parsers/gaming';
import { getCompassBonus } from '@parsers/compass';
import { getArmorSetBonus } from '@parsers/misc/armorSmithy';
import { getEmperorBonus } from '@parsers/world-6/emperor';
import { getBribeBonus } from '@parsers/bribes';
import { allProwess } from '@parsers/efficiency';
import { getLampBonus } from '@parsers/world-5/caverns/the-lamp';

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
            }
            else {
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
            }
            else {
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
          case key.includes('PVFishingToolkit'): {
            updatedKey = `PersonalValuesMap`;
            updatedDetails = { ...(res?.[updatedKey] || {}), FishingToolkit: tryToParse(details) };
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
          case key.includes('SLpre_'): {
            updatedKey = `SkillPreset`;
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
      return { ...res };
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
  character.afkType = monsters?.[char?.AFKtarget]?.AFKtype;
  character.targetMonster = char?.AFKtarget;
  const currentMapIndex = char?.CurrentMap;
  character.mapIndex = currentMapIndex;
  character.currentMap = mapNames?.[currentMapIndex];
  character.money = parseFloat(char?.Money);
  character.cooldowns = char?.[`AttackCooldowns`];
  const [bait, line] = char?.PersonalValuesMap?.FishingToolkit;
  character.fishingKit = {
    bait: fishingKits?.fishingBaits?.[bait],
    line: fishingKits?.fishingLines?.[line]
  }
  const statMap = { 0: 'strength', 1: 'agility', 2: 'wisdom', 3: 'luck', 4: 'level' };
  character.stats = char?.PersonalValuesMap?.StatList?.reduce((res, statValue, index) => {
    if (!statMap[index]) return res;
    return {
      ...res,
      [statMap[index]]: statValue
    }
  }, {});
  character.level = char?.[`Lv0`]?.[0] || 0;
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
      [equipmentMapping?.[index]]: item
    }), {});
  const equipapbleAmount = char[`EquipmentQuantity`]?.reduce((result, item, index) => ({
    ...result,
    [equipmentMapping?.[index]]: item
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
  character.inventory = getInventoryList(inventoryArr, inventoryQuantityArr, character.name, inventoryMap);
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
      index < 19 ? {
        ...res,
        [skillIndexMap[index]?.name]: {
          level: level !== -1 ? level : 0,
          exp: parseFloat(levelsRaw[index]),
          expReq: parseFloat(levelsReqRaw[index]),
          icon: skillIndexMap[index]?.icon,
          index
        }
      } : res, {});
  character.skillsInfoArray = Object.entries(character.skillsInfo || {}).reduce((result, [skillName, skillData]) => (
    [...result, { ...skillData, skillName }]), []).sort((a, b) => a.index - b.index);

  const [, selectedTalentPreset, selectedCardPreset] = char?.PlayerStuff || [];
  character.selectedTalentPreset = selectedTalentPreset;
  const talentsObject = char?.[`SkillLevels`];
  const talentPresetObject = char?.[`SkillPreset`];
  const maxTalentsObject = char?.[`SkillLevelsMAX`];
  const {
    talents, flatTalents, starTalents, flatStarTalents
  } = createTalentPreset(character?.class, talentsObject, maxTalentsObject);
  if (talentPresetObject) {
    character.talentPreset = createTalentPreset(character?.class, talentPresetObject, maxTalentsObject);
  }
  character.talents = talents;
  character.flatTalents = flatTalents;
  character.starTalents = starTalents;
  character.flatStarTalents = flatStarTalents;

  const activeBuffs = char?.[`BuffsActive`];
  character.activeBuffs = getActiveBuffs(activeBuffs, [...(flatTalents || []), ...(flatStarTalents || [])]);

  character.activePrayers = char?.Prayers?.filter((prayer) => prayer !== -1).map((prayerId) => account?.prayers?.[prayerId])?.filter((p) => p);
  character.postOffice = getPlayerPostOffice(char?.PostOfficeInfo, account);
  character.selectedCardPreset = selectedCardPreset;
  character.cardPresets = char?.CardPreset?.map((cardPreset) => getEquippedCardsData(cardPreset, account));
  character.cards = getPlayerCards(char, account);

  const omegaNanochipBonus = account?.lab?.playersChips?.[char?.playerId]?.find((chip) => chip.index === 20);
  const omegaMotherboardChipBonus = account?.lab?.playersChips?.[char?.playerId]?.find((chip) => chip.index === 21);
  character.cards.equippedCards = character?.cards?.equippedCards?.map((card, index) => ((index === 0 && omegaNanochipBonus) || (index === 7 && omegaMotherboardChipBonus))
    ? ({
      ...card,
      chipBoost: 2
    })
    : card);
  const charObols = getObols(char, false);
  character.obols = {
    ...charObols,
    stats: mergeCharacterAndAccountObols(charObols, account.obols)
  };
  character.worship = getPlayerWorship(character, account, char?.PlayerStuff?.[0]);
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
  }
  else if (isFishingMap) {
    current = character.skillsInfo?.fishing?.level;
    currentIcon = 'ClassIcons45';
  }
  else {
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
  character.wow = getBarbarianZowChow(kills, [1e9]);
  const bigPBubble = getActiveBubbleBonus(character.equippedBubbles, 'BIG_P', account);
  const divinityLevel = character.skillsInfo?.divinity?.level;
  const linkedDeity = account?.divinity?.linkedDeities?.[character.playerId];
  character.linkedDeity = linkedDeity;
  if (linkedDeity !== -1) {
    character.deityMinorBonus = getMinorDivinityBonus(character, account);
  }
  let secondLinkedDeity;
  if (checkCharClass(character?.class, CLASSES.Elemental_Sorcerer)) {
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
  const divPerHour = getDivStylePerHour(divStyleIndex);
  character.divStyle = { ...divStyles?.[divStyleIndex], index: divStyleIndex, divPerHour };
  character.isDivinityConnected = account?.divinity?.linkedDeities?.[character?.playerId] === 4 || isGodEnabledBySorcerer(character, 4);

  // Initial calculation without added levels
  let familyEffBonus = getUpdatedFamilyBonus(character, charactersLevels);
  let addedLevels = getTalentAddedLevels(talents, null, linkedDeity, character.secondLinkedDeityIndex, character.deityMinorBonus, character.secondDeityMinorBonus, familyEffBonus, account, character);

  let iterations = 0;
  const maxIterations = 3;

  while (iterations < maxIterations) {
    const tempCharacter = Object.assign({}, character);
    tempCharacter.talents = applyTalentAddedLevels(talents, null, addedLevels?.value || 0);
    familyEffBonus = getUpdatedFamilyBonus(tempCharacter, charactersLevels);
    addedLevels = getTalentAddedLevels(talents, null, linkedDeity, character.secondLinkedDeityIndex, character.deityMinorBonus, character.secondDeityMinorBonus, familyEffBonus, account, character);

    iterations++;
  }

  character.addedLevelsBreakdown = addedLevels?.breakdown;
  character.addedLevels = addedLevels?.value;
  character.talents = applyTalentAddedLevels(talents, null, character.addedLevels);
  character.flatTalents = applyTalentAddedLevels(talents, flatTalents, character.addedLevels);
  if (talentPresetObject) {
    const presetAddedLevels = getTalentAddedLevels(character?.talentPreset?.talents, null, linkedDeity, character.secondLinkedDeityIndex, character.deityMinorBonus, character.secondDeityMinorBonus, familyEffBonus, account, character);
    character.talentPreset = {
      ...character.talentPreset,
      talents: applyTalentAddedLevels(character?.talentPreset?.talents, null, presetAddedLevels?.value),
      flatTalents: applyTalentAddedLevels(character?.talentPreset?.talents, null, presetAddedLevels?.value),
      addedLevels: presetAddedLevels?.value,
      addedLevelsBreakdown: presetAddedLevels?.breakdown
    }
  }

  character.activeBuffs = character.activeBuffs?.map(({ name }) => {
    return character.flatTalents?.find(({ name: tName }) => tName === name);
  });
  character.talentsLoadout = char?.AttackLoadout?.flat()?.filter((skill) => skill !== 'Null')?.map((skillIndex) =>
    character.flatTalents?.find(({ skillIndex: sIndex }) => skillIndex === sIndex)
    || character.flatStarTalents?.find(({ skillIndex: sIndex }) => skillIndex === sIndex))
  character.npcDialog = char?.NPCdialogue;
  character.questComplete = char?.QuestComplete;
  character.questCompleted = Object.entries(char?.QuestComplete || {})?.reduce((res, [key, value]) => res + (value === 1
    ? 1
    : 0), 0);
  character.printerSample = getPrinterSampleRate(character, account, charactersLevels);
  character.anvil = getAnvil(char, character);
  return character;
}

export const getSkillExpMulti = (skillName, character, characters, account, playerInfo) => {
  const mainStat = mainStatMap?.[character?.class];
  const allSkillExp = getAllSkillsExp(character, characters, account);
  const happyDudeTalentBonus = getTalentBonus(character?.flatTalents, 'HAPPY_DUDE');
  const fishingLv = character?.skillsInfo?.fishing?.level;
  const miningLv = character?.skillsInfo?.mining?.level;
  if (skillName === 'mining') {
    const bubbleBonus = getBubbleBonus(account, 'REELY_SMART', false, mainStat === 'strength');
    let base;
    if (fishingLv > miningLv) {
      base = 2 * bubbleBonus;
    }
    else {
      base = bubbleBonus;
    }

    const talentBonus = getTalentBonus(character?.flatTalents, 'TEMPESTUOUS_EMOTIONS');
    const stampBonus = getStampsBonusByEffect(account, 'Mining_Exp_Gain');
    const masteryBonus = isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.mining?.rank, 0);
    const miningCardsArePassives = isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.mining?.rank, 2);
    const cardBonus = miningCardsArePassives
      ? getCardBonusByEffect(account?.cards, 'Mining_EXP')
      : getCardBonusByEffect(character?.cards?.equippedCards, 'Mining_EXP')
    const arcadeBonus = getArcadeBonus(account?.arcade?.shop, 'Mining_EXP_gain')?.bonus;
    const achievementBonus = getAchievementStatus(account?.achievements, 27);
    const equipBonus = getStatsFromGear(character, 55, account);
    const voteBonus = getVoteBonus(account, 13);
    const leftHandTalentBonus = getMaestroHand(character, 'mining', characters, account, 'LEFT_HAND_OF_LEARNING');
    const value = Math.max(
      0.1,
      1 +
      (
        talentBonus +
        stampBonus +
        cardBonus +
        base +
        happyDudeTalentBonus +
        arcadeBonus +
        achievementBonus +
        equipBonus +
        25 * masteryBonus +
        voteBonus
      ) /
      100 +
      (
        allSkillExp?.value +
        leftHandTalentBonus
      ) /
      100
    )
    return {
      value: value,
      breakdown: [
        { name: 'All skill exp', value: allSkillExp?.value / 100 },
        { name: 'Talent', value: (talentBonus + happyDudeTalentBonus) / 100 },
        { name: 'Stamps', value: stampBonus / 100 },
        { name: 'Cards', value: cardBonus / 100 },
        { name: 'Bubble', value: base / 100 },
        { name: 'Arcade', value: arcadeBonus / 100 },
        { name: 'Achievement', value: achievementBonus / 100 },
        { name: 'Equipment', value: equipBonus / 100 },
        { name: 'Skill Mastery', value: 25 * masteryBonus / 100 },
        { name: 'Vote', value: voteBonus / 100 },
        { name: 'Left Hand', value: leftHandTalentBonus / 100 }
      ]
    };
  }
  else if (skillName === 'chopping') {
    const choppingCardsArePassives = isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.chopping?.rank, 2);
    const talentBonus = getTalentBonus(character?.flatTalents, 'INNER_PEACE');
    const stampBonus = getStampsBonusByEffect(account, 'Choppin_Exp_Gain');
    const bubbleBonus = getBubbleBonus(account, 'NOODUBBLE', false, mainStat === 'wisdom');
    const cardBonus = choppingCardsArePassives
      ? getCardBonusByEffect(account?.cards, 'Choppin_EXP')
      : getCardBonusByEffect(character?.cards?.equippedCards, 'Choppin_EXP');
    const leftHandTalentBonus = getMaestroHand(character, 'chopping', characters, account, 'LEFT_HAND_OF_LEARNING');
    const achievementBonus = getAchievementStatus(account?.achievements, 4);
    const masteryBonus = isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.chopping?.rank, 0);
    const voteBonus = getVoteBonus(account, 9);


    const value = 1 + (talentBonus
      + (stampBonus
        + (bubbleBonus
          + (cardBonus
            + happyDudeTalentBonus
            + (achievementBonus
              + (25 * masteryBonus
                + voteBonus)))))) / 100 + (allSkillExp?.value + leftHandTalentBonus) / 100;
    return {
      value,
      breakdown: [
        { name: 'All skill exp', value: allSkillExp?.value / 100 },
        { name: 'Talent', value: (talentBonus + happyDudeTalentBonus) / 100 },
        { name: 'Stamps', value: stampBonus / 100 },
        { name: 'Cards', value: cardBonus / 100 },
        { name: 'Bubble', value: bubbleBonus / 100 },
        { name: 'Achievement', value: achievementBonus / 100 },
        { name: 'Skill Mastery', value: 25 * masteryBonus / 100 },
        { name: 'Vote', value: voteBonus / 100 },
        { name: 'Left Hand', value: leftHandTalentBonus / 100 }
      ]
    }
  }
  else if (skillName === 'smithing') {
    const talentBonus = getTalentBonus(character?.flatTalents, 'FOCUSED_SOUL');
    const cardBonus = getCardBonusByEffect(account?.cards, 'Smithing_EXP_(Passive)');
    const postOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Blacksmith_Box', 0);
    const stampBonus = getStampsBonusByEffect(account, 'SmithExp', character);
    const skillMasteryBonus = isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.smithing?.rank, 0);
    const leftHandTalentBonus = getMaestroHand(character, 'smithing', characters, account, 'LEFT_HAND_OF_LEARNING');

    const value = Math.max(0.1, (1 +
        (talentBonus
          + (stampBonus
            + (happyDudeTalentBonus
              + 25 * skillMasteryBonus))) / 100)
      * (1 + cardBonus / 100) *
      (1 + postOfficeBonus / 100)
      + (allSkillExp?.value + leftHandTalentBonus) / 100);

    return {
      value,
      breakdown: [
        { name: 'All skill exp', value: allSkillExp?.value / 100 },
        { name: 'Talent', value: (talentBonus + happyDudeTalentBonus) / 100 },
        { name: 'Stamps', value: stampBonus / 100 },
        { name: 'Cards', value: cardBonus / 100 },
        { name: 'Post office', value: postOfficeBonus / 100 },
        { name: 'Skill Mastery', value: 25 * skillMasteryBonus / 100 },
        { name: 'Left Hand', value: leftHandTalentBonus / 100 }
      ]
    }
  }
  else if (skillName === 'fishing') {
    const bubbleBonus = getBubbleBonus(account, 'REELY_SMART', false, mainStat === 'strength');
    let base;
    if (miningLv > fishingLv) {
      base = 2 * bubbleBonus;
    }
    else {
      base = bubbleBonus;
    }

    const talentBonus = getTalentBonus(character?.flatTalents, 'ALL_FISH_DIET');
    const talentBonus2 = getTalentBonus(character?.flatTalents, 'TEMPESTUOUS_EMOTIONS');
    const stampBonus = getStampsBonusByEffect(account, 'Fishing_Exp_Gain');
    const arcadeBonus = getArcadeBonus(account?.arcade?.shop, 'Fishing_EXP_gain')?.bonus;
    const achievementBonus = getAchievementStatus(account?.achievements, 117);
    const equipBonus = getStatsFromGear(character, 49, account);
    const bribeBonus = getBribeBonus(account?.bribes, 'Fishermaster');
    const kangarooBonus = getKangarooBonus(account?.kangaroo?.bonuses, 'Fishing XP');
    const voteBonus = getVoteBonus(account, 8);
    const upgradeVaultBonus = getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 30);
    const leftHandTalentBonus = getMaestroHand(character, 'fishing', characters, account, 'LEFT_HAND_OF_LEARNING');
    const masteryBonus = isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.fishing?.rank, 0);
    const fishingCardsArePassives = isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.fishing?.rank, 2);
    const cardBonus = fishingCardsArePassives
      ? getCardBonusByEffect(account?.cards, 'Fishing_EXP')
      : getCardBonusByEffect(character?.cards?.equippedCards, 'Fishing_EXP')
    const fishingKit = character?.fishingKit?.bait?.exp + character?.fishingKit?.line?.exp;
    const value = Math.max(
      0.1,
      1 +
      (
        fishingKit +
        talentBonus +
        talentBonus2 +
        base +
        cardBonus +
        stampBonus +
        happyDudeTalentBonus +
        arcadeBonus +
        achievementBonus +
        equipBonus +
        25 * masteryBonus +
        25 * bribeBonus +
        kangarooBonus +
        voteBonus +
        upgradeVaultBonus
      ) /
      100 +
      (
        allSkillExp?.value +
        leftHandTalentBonus
      ) /
      100
    )
    return {
      value,
      breakdown: [
        { name: 'All skill exp', value: allSkillExp?.value / 100 },
        { name: 'Fishing kit', value: (fishingKit) / 100 },
        { name: 'Talent', value: (talentBonus + talentBonus2 + happyDudeTalentBonus) / 100 },
        { name: 'Stamps', value: stampBonus / 100 },
        { name: 'Cards', value: cardBonus / 100 },
        { name: 'Bubble', value: base / 100 },
        { name: 'Arcade', value: arcadeBonus / 100 },
        { name: 'Achievement', value: achievementBonus / 100 },
        { name: 'Equipment', value: equipBonus / 100 },
        { name: 'Skill Mastery', value: 25 * masteryBonus / 100 },
        { name: 'Bribe', value: 25 * bribeBonus / 100 },
        { name: 'Kangaroo', value: kangarooBonus / 100 },
        { name: 'Vote', value: voteBonus / 100 },
        { name: 'Vault', value: upgradeVaultBonus / 100 },
        { name: 'Left Hand', value: leftHandTalentBonus / 100 }
      ]
    };
  }
  else if (skillName === 'alchemy') {
    const stampBonus = getStampsBonusByEffect(account, 'Alchemy_Exp_Gain');
    const postOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Potion_Package', 1);
    const statueBonus = getStatueBonus(account, 12, character?.flatTalents);
    const talentBonus = getTalentBonus(character?.flatTalents, 'BUBBLE_BREAKTHROUGH');
    const talentBonus2 = getTalentBonus(character?.flatTalents, 'SHARING_SOME_SMARTS');
    const masteryBonus = isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.alchemy?.rank, 0);
    const bubbleBonus = getBubbleBonus(account, 'NOODUBBLE', false, mainStat === 'wisdom');
    const activeBubbleBonus = getActiveBubbleBonus(character?.equippedBubbles, 'COOKIN_ROADKILL', account);
    const upgradeVaultBonus = getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 28);

    const value = 1 + allSkillExp?.value / 100
      + (account?.alchemy?.p2w?.player?.extraExp
        + (stampBonus
          + (happyDudeTalentBonus
            + (postOfficeBonus
              + statueBonus)))
        + (talentBonus
          + (talentBonus2
            + 25 * masteryBonus))
        + (bubbleBonus
          + (activeBubbleBonus
            + upgradeVaultBonus))) / 100;

    return {
      value,
      breakdown: [
        { name: 'Talent', value: talentBonus / 100 },
        { name: 'Task', value: 10 * account?.tasks?.[2]?.[4]?.[4] / 100 },
        { name: 'Skill mastery', value: 25 * masteryBonus / 100 }
      ]
    }
  }
  else if (skillName === 'catching') {
    const talentBonus = getTalentBonus(character?.flatTalents, 'FOCUSED_SOUL');
    const talentBonus2 = getTalentBonus(character?.flatTalents, 'BUG_ENTHUSIAST');
    const stampBonus = getStampsBonusByEffect(account, 'Catching_Exp_Gain');
    const arcadeBonus = getArcadeBonus(account?.arcade?.shop, 'Catching_EXP_gain')?.bonus;
    const achievementBonus = getAchievementStatus(account?.achievements, 107);
    const voteBonus = getVoteBonus(account, 10);
    const upgradeVaultBonus = getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 29);
    const leftHandTalentBonus = getMaestroHand(character, 'catching', characters, account, 'LEFT_HAND_OF_LEARNING');
    const masteryBonus = isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.catching?.rank, 0);
    const catchingCardsArePassives = isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.catching?.rank, 2);
    const cardBonus = catchingCardsArePassives
      ? getCardBonusByEffect(account?.cards, 'Catching_EXP')
      : getCardBonusByEffect(character?.cards?.equippedCards, 'Catching_EXP')

    const value = Math.max(
      0.1,
      1 +
      (
        talentBonus +
        talentBonus2 +
        cardBonus +
        stampBonus +
        happyDudeTalentBonus +
        arcadeBonus +
        achievementBonus +
        25 * masteryBonus +
        voteBonus +
        upgradeVaultBonus
      ) /
      100 +
      (
        allSkillExp?.value +
        leftHandTalentBonus
      ) /
      100
    );

    return {
      value,
      breakdown: [
        { name: 'All skill exp', value: allSkillExp?.value / 100 },
        { name: 'Talent', value: (talentBonus + talentBonus2 + happyDudeTalentBonus) / 100 },
        { name: 'Stamps', value: stampBonus / 100 },
        { name: 'Cards', value: cardBonus / 100 },
        { name: 'Arcade', value: arcadeBonus / 100 },
        { name: 'Achievement', value: achievementBonus / 100 },
        { name: 'Skill Mastery', value: 25 * masteryBonus / 100 },
        { name: 'Vote', value: voteBonus / 100 },
        { name: 'Vault', value: upgradeVaultBonus / 100 },
        { name: 'Left Hand', value: leftHandTalentBonus / 100 }
      ]
    };
  }
  else if (skillName === 'trapping') {
    const talentBonus = getTalentBonus(character?.flatTalents, 'SHROOM_BAIT');
    const talentBonus2 = getTalentBonus(character?.flatTalents, 'FOCUSED_SOUL');
    const stampBonus = getStampsBonusByEffect(account, 'Trapping_Exp_Gain');
    const choppingCardsArePassives = isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.trapping?.rank, 2);
    const cardBonus = choppingCardsArePassives
      ? getCardBonusByEffect(account?.cards, 'Trapping_EXP')
      : getCardBonusByEffect(character?.cards?.equippedCards, 'Trapping_EXP');
    const leftHandTalentBonus = getMaestroHand(character, 'trapping', characters, account, 'LEFT_HAND_OF_LEARNING');
    const masteryBonus = isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.trapping?.rank, 0);
    const voteBonus = getVoteBonus(account, 30);
    const postOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Trapping_Lockbox', 1);
    const trappingBonus = getTrappingStuff('TrapMGbonus', 0, account)
    const trappingBonus2 = getTrappingStuff('TrapMGbonus', 3, account)
    const arcadeBonus = getArcadeBonus(account?.arcade?.shop, 'Trapping_EXP')?.bonus;

    const value = Math.max(0.1, 1 + (talentBonus
        + (stampBonus +
          (talentBonus2 +
            (cardBonus
              + (happyDudeTalentBonus +
                (postOfficeBonus
                  + (trappingBonus +
                    (trappingBonus2 +
                      (arcadeBonus +
                        (25 * masteryBonus
                          + voteBonus)))))))))) / 100
      + (allSkillExp?.value
        + leftHandTalentBonus) / 100);

    return {
      value,
      breakdown: [
        { name: 'All skill exp', value: allSkillExp?.value / 100 },
        { name: 'Talent', value: (talentBonus + talentBonus2 + happyDudeTalentBonus) / 100 },
        { name: 'Stamps', value: stampBonus / 100 },
        { name: 'Cards', value: cardBonus / 100 },
        { name: 'Post office', value: postOfficeBonus / 100 },
        { name: 'Trapping', value: (trappingBonus + trappingBonus2) / 100 },
        { name: 'Skill Mastery', value: 25 * masteryBonus / 100 },
        { name: 'Arcade', value: arcadeBonus / 100 },
        { name: 'Vote', value: voteBonus / 100 },
        { name: 'Left Hand', value: leftHandTalentBonus / 100 }
      ]
    }
  }
  else if (skillName === 'construction') {
    const activeBubbleBonus = getActiveBubbleBonus(character?.equippedBubbles, 'CALL_ME_BOB', account);
    const stampBonus = getStampsBonusByEffect(account, 'Construction_Exp_Gain');
    const voteBonus = getVoteBonus(account, 18);
    const statueBonus = getStatueBonus(account, 18, character?.flatTalents);

    const value = 1 + (activeBubbleBonus
      + (stampBonus
        + (voteBonus
          + statueBonus))) / 100
    return {
      value,
      breakdown: [
        { name: 'Bubble', value: activeBubbleBonus / 100 },
        { name: 'Stamps', value: stampBonus / 100 },
        { name: 'Vote', value: voteBonus / 100 },
        { name: 'Statue', value: statueBonus / 100 }
      ]
    }
  }
  else if (skillName === 'worship') {
    const talentBonus = getTalentBonus(character?.flatTalents, 'BLESS_UP');
    const talentBonus2 = getTalentBonus(character?.flatTalents, 'INNER_PEACE');
    const starSignBonus = getStarSignBonus(character, account, 'Worship_EXP');
    const masteryBonus = isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.worship?.rank, 0);
    const voteBonus = getVoteBonus(account, 30);
    const leftHandTalentBonus = getMaestroHand(character, 'worship', characters, account, 'LEFT_HAND_OF_LEARNING');

    const value = Math.max(0.1, 1 + (character?.skillsInfo?.worship?.level / 3
        + (talentBonus
          + (talentBonus2
            + (happyDudeTalentBonus
              + (starSignBonus +
                (25 * masteryBonus +
                  voteBonus)))))) / 100
      + (allSkillExp?.value +
        leftHandTalentBonus) / 100);

    return {
      value,
      breakdown: [
        { name: 'All skill exp', value: allSkillExp?.value / 100 },
        { name: 'Skill level', value: (character?.skillsInfo?.worship?.level / 3) / 100 },
        { name: 'Talent', value: (talentBonus + talentBonus2 + happyDudeTalentBonus) / 100 },
        { name: 'Star sign', value: starSignBonus / 100 },
        { name: 'Skill Mastery', value: 25 * masteryBonus / 100 },
        { name: 'Vote', value: voteBonus / 100 },
        { name: 'Left Hand', value: leftHandTalentBonus / 100 }
      ]
    }
  }
  else if (skillName === 'cooking') {
    const cookingEff = getCookingEff(character, characters, account, playerInfo);
    const upgradeVaultBonus = getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 60);
    const leftHandTalentBonus = getMaestroHand(character, 'cooking', characters, account, 'LEFT_HAND_OF_LEARNING');
    const mealBonus = getMealsBonusByEffectOrStat(account, null, 'CookExp');
    const postOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Cooking_EXP_gain', 1);
    const talentBonus = getTalentBonus(character?.flatTalents, 'APOCALYPSE_CHOW');
    const chows = character?.chow?.finished?.[0] ?? 1;
    const cardBonus = getCardBonusByEffect(account?.cards, 'Cooking_EXP_gain')
    const talentBonus2 = getTalentBonus(character?.flatTalents, 'TEMPESTUOUS_EMOTIONS');
    const statueBonus = getStatueBonus(account, 20, character?.flatTalents);
    const masteryBonus = isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.cooking?.rank, 0);
    const voteBonus = getVoteBonus(account, 13);
    const cookingDef = monsters?.Cooking?.Defence;

    const value = Math.max(0.1, (1 + upgradeVaultBonus / 100)
      * (Math.min(Math.pow(cookingEff / (10 * cookingDef),
          0.25 + getCookingProwess(character, account)), 1)
        + (allSkillExp?.value +
          (leftHandTalentBonus +
            (mealBonus +
              (postOfficeBonus +
                (cardBonus +
                  ((talentBonus * chows)
                    + (talentBonus2
                      + (statueBonus
                        + (25 * masteryBonus
                          + voteBonus))))))))) / 100));

    return {
      value,
      breakdown: [
        { name: 'All skill exp', value: allSkillExp?.value / 100 },
        { name: 'Upgrade vault', value: upgradeVaultBonus / 100 },
        { name: 'Cooking Eff', value: cookingEff / 100 },
        { name: 'Prowess', value: 0.25 + getCookingProwess(character, account) / 100 },
        { name: 'Left hand', value: leftHandTalentBonus / 100 },
        { name: 'Meal', value: mealBonus / 100 },
        { name: 'Post office', value: postOfficeBonus / 100 },
        { name: 'Card', value: cardBonus / 100 },
        { name: 'Talent', value: (talentBonus * chows) + talentBonus2 / 100 },
        { name: 'Statue', value: statueBonus / 100 },
        { name: 'Skill mastery', value: 25 * masteryBonus / 100 },
        { name: 'Vote', value: voteBonus / 100 }
      ]
    }
  }
  else if (skillName === 'breeding') {
    const talentBonus = getHighestTalentByClass(characters, CLASSES.Beast_Master, 'SHINING_BEACON_OF_EGG');
    const sapphireRhombol = getJewelBonus(account?.lab?.jewels, 5)
    const mealBonus = getMealsBonusByEffectOrStat(account, null, 'BrExp');
    const cardBonus = getCardBonusByEffect(account?.cards, 'Breeding_EXP')
    const stampBonus = getStampsBonusByEffect(account, 'Breeding_EXP_Gain');
    const vialBonus = getVialsBonusByStat(account?.alchemy?.vials, 'BreedXP');
    const statueBonus = getStatueBonus(account, 21, character?.flatTalents);
    const masteryBonus = isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.breeding?.rank, 0);
    const voteBonus = getVoteBonus(account, 16);
    const upgradeVaultBonus = getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 59);


    const value = Math.max(0.1, 1 + (talentBonus
      + sapphireRhombol
      + (mealBonus
        + (2 * account?.breeding?.petUpgrades?.[0]?.level
          + (Math.min(cardBonus, 50)
            + (stampBonus
              + (vialBonus
                + (statueBonus +
                  (25 * masteryBonus
                    + (voteBonus
                      + upgradeVaultBonus))))))))) / 100);

    return {
      value,
      breakdown: [
        { name: 'Talent', value: talentBonus / 100 },
        { name: 'Jewel', value: sapphireRhombol / 100 },
        { name: 'Meal', value: mealBonus / 100 },
        { name: 'Pet upgrade', value: 2 * account?.breeding?.petUpgrades?.[2]?.level / 100 },
        { name: 'Card', value: Math.min(cardBonus, 50) / 100 },
        { name: 'Stamp', value: stampBonus / 100 },
        { name: 'Vial', value: vialBonus / 100 },
        { name: 'Statue', value: statueBonus / 100 },
        { name: 'Skill mastery', value: 25 * masteryBonus / 100 },
        { name: 'Vote', value: voteBonus / 100 },
        { name: 'Vault', value: upgradeVaultBonus / 100 }
      ]
    }
  }
  else if (skillName === 'laboratory') {
    const labEfficiency = getLabEfficiency(character, characters, account, playerInfo);
    const labDefence = monsters?.Laboratory?.Defence;
    const prowess = allProwess(character, account);
    const postOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Science_Spare_Parts', 1);
    const companionBonus = isCompanionBonusActive(account, 16) ? account?.companions?.list?.at(16)?.bonus : 0;
    const cardBonus = getCardBonusByEffect(character?.cards?.equippedCards, cardBonuses[79]);
    const chipBonus = getPlayerLabChipBonus(character, account, 5);
    const bubonicGreen = getBubonicGreenTube(character, characters, account);
    const talentBonus = getTalentBonus(character?.flatTalents, 'UPLOAD_SQUARED');
    const jewelBonus = getJewelBonus(account?.lab?.jewels, 2);
    const mealBonus = getMealsBonusByEffectOrStat(account, null, 'Lexp');
    const stampBonus = getStampsBonusByEffect(account, 'Lab_Exp_Gain');
    const vialBonus = getVialsBonusByEffect(account?.alchemy?.vials, null, 'LabXP');
    const bubbleBonus = getActiveBubbleBonus(character?.equippedBubbles, 'MATRIX_EVOLVED', account);
    const equipBonus = getStatsFromGear(character, 65, account);
    const sigilBonus = getSigilBonus(account?.alchemy?.p2w?.sigils, 'LAB_TESSTUBE');
    const masteryBonus = isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.laboratory?.rank, 0);
    const starSignBonus = getStarSignBonus(character, account, 'Lab_EXP_Gain');
    const arcadeBonus = getArcadeBonus(account?.arcade?.shop, 'Lab_EXP_gain')?.bonus
    const voteBonus = getVoteBonus(account, 31);
    const lampBonus = getLampBonus({ holesObject: account?.hole?.holesObject, t: 0, i: 2 });
    const vaultUpgradeBonus = getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 55);
    const armorSetBonus = getArmorSetBonus(account, 'MAGMA_SET');
    const soupedPlayerBonus = account?.lab?.playersCords?.find(({ playerId }) => character?.playerId === playerId)?.soupedUp
      ? 30
      : 0;
    const talentBonus2 = getTalentBonus(character?.flatTalents, 'INNER_PEACE');

    const real = 1 > Math.pow(labEfficiency / (10 * labDefence), 0.25 + prowess)
      ? Math.max(0.1, Math.pow(prowess / (10 * labDefence), 0.25)
        * (1 + companionBonus)
        * (1 + (postOfficeBonus + cardBonus + chipBonus + bubonicGreen + talentBonus
          + jewelBonus + mealBonus + stampBonus + vialBonus + bubbleBonus
          + Math.min(100, 4 * soupedPlayerBonus) + equipBonus + sigilBonus + 25 * masteryBonus
          + starSignBonus + arcadeBonus + voteBonus + lampBonus
          + vaultUpgradeBonus + armorSetBonus)) / 100)
      : Math.max(0.1, Math.pow(labEfficiency / (10 * labDefence), 0.25)
        * (1 + companionBonus)
        * (1 + (postOfficeBonus + cardBonus + chipBonus + bubonicGreen + talentBonus + talentBonus2
          + jewelBonus + mealBonus + stampBonus + vialBonus + bubbleBonus
          + Math.min(100, 4 * soupedPlayerBonus) + equipBonus + sigilBonus + 25 * masteryBonus
          + starSignBonus + arcadeBonus + voteBonus + lampBonus
          + vaultUpgradeBonus + armorSetBonus)) / 100);

    const value = (1 + companionBonus)
      * (1 + (postOfficeBonus + cardBonus + (chipBonus + bubonicGreen + (talentBonus + talentBonus2)
        + (jewelBonus + (mealBonus + (stampBonus + (vialBonus + (bubbleBonus
          + (Math.min(100, 4 * soupedPlayerBonus) + (equipBonus + (sigilBonus + (starSignBonus
            + (arcadeBonus + (voteBonus + (lampBonus + (vaultUpgradeBonus + armorSetBonus))))))))))))))) / 100);

    return {
      value,
      real,
      breakdown: [
        { name: 'Lab eff', value: labEfficiency },
        { name: 'Prowess', value: 0.25 + prowess },
        { name: 'Companion', value: companionBonus / 100 },
        { name: 'Post Office', value: postOfficeBonus / 100 },
        { name: 'Card', value: cardBonus / 100 },
        { name: 'Chip', value: chipBonus / 100 },
        { name: 'Bubonic Green', value: bubonicGreen / 100 },
        { name: 'Talent', value: (talentBonus + talentBonus2) / 100 },
        { name: 'Jewel', value: jewelBonus / 100 },
        { name: 'Meal', value: mealBonus / 100 },
        { name: 'Stamp', value: stampBonus / 100 },
        { name: 'Vial', value: vialBonus / 100 },
        { name: 'Bubble', value: bubbleBonus / 100 },
        { name: 'Souped Player', value: Math.min(100, soupedPlayerBonus) / 100 },
        { name: 'Equipment', value: equipBonus / 100 },
        { name: 'Sigil', value: sigilBonus / 100 },
        { name: 'Skill mastery', value: 25 * masteryBonus / 100 },
        { name: 'Star Sign', value: starSignBonus / 100 },
        { name: 'Arcade', value: arcadeBonus / 100 },
        { name: 'Vote', value: voteBonus / 100 },
        { name: 'Lamp', value: lampBonus / 100 },
        { name: 'Vault Upgrade', value: vaultUpgradeBonus / 100 },
        { name: 'Armor Set', value: armorSetBonus / 100 }
      ]
    }
  }
  else if (skillName === 'sailing') {
    const talentBonus = getHighestTalentByClass(characters, CLASSES.Siege_Breaker, 'EXPERTLY_SAILED');
    const vialBonus = getVialsBonusByStat(account?.alchemy?.vials, 'SailXP');
    const masteryBonus = isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.sailing?.rank, 0);
    const guildBonus = getGuildBonusBonus(account?.guild?.guildBonuses, 14);

    const value = 1 + (talentBonus
      + (vialBonus
        + (10 * account?.tasks?.[2]?.[4]?.[4] +
          (25 * masteryBonus + guildBonus)))) / 100;

    return {
      value,
      breakdown: [
        { name: 'Talent', value: talentBonus / 100 },
        { name: 'Vial', value: vialBonus / 100 },
        { name: 'Task', value: 10 * account?.tasks?.[2]?.[4]?.[4] / 100 },
        { name: 'Skill mastery', value: 25 * masteryBonus / 100 },
        { name: 'Guild', value: guildBonus / 100 }

      ]
    }
  }
  else if (skillName === 'divinity') {
    const gemShopBonus = account?.gemShopPurchases?.find((value, index) => index === 130) ?? 0;
    const purrmepPlayer = characters?.find(({ linkedDeity }) => linkedDeity === 6); // purrmep is limited to only 1 player linked.\
    const companionBonus = isCompanionBonusActive(account, 16) ? account?.companions?.list?.at(16)?.bonus : 0;
    const talentBonus = getHighestTalentByClass(characters, CLASSES.Elemental_Sorcerer, 'SHARED_BELIEFS');
    const unlockedGods = account?.divinity?.unlockedDeities ?? 0;
    const postOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Box_of_Gosh', 0);
    const sigilBonus = getSigilBonus(account?.alchemy?.p2w?.sigils, 'DIV_SPIRAL');
    const cardBonus = getCardBonusByEffect(account?.cards, 'Divinity_EXP')
    const stampBonus = getStampsBonusByEffect(account, 'Divinity_EXP_Gain');
    const activeBubbleBonus = getActiveBubbleBonus(character?.equippedBubbles, 'PIOUS_AT_HEART', account);
    const statueBonus = getStatueBonus(account, 23, character?.flatTalents);
    const mealBonus = getMealsBonusByEffectOrStat(account, null, 'DivExp');
    const vialBonus = getVialsBonusByStat(account?.alchemy?.vials, 'DivXP');
    const talentBonus2 = getTalentBonus(character?.flatTalents, 'INNER_PEACE');
    const starSignBonus = getStarSignBonus(character, account, 'Divinity_EXP');
    const guildBonus = getGuildBonusBonus(account?.guild?.guildBonuses, 14);
    const masteryBonus = isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.divinity?.rank, 0);
    const arcadeBonus = getArcadeBonus(account?.arcade?.shop, 'Divinity_EXP')?.bonus;
    const equipBonus = getStatsFromGear(character, 74, account);
    const voteBonus = getVoteBonus(account, 23);
    const armorSetBonus = getArmorSetBonus(account, 'MAGMA_SET');

    const value = character?.divStyle?.divPerHour
      * (1 + gemShopBonus / 4)
      * Math.max(1, 1 + (purrmepPlayer ? 1 : 0)) *
      (1 + talentBonus / 100) * (1 + companionBonus)
      * (1 + (10 * Math.max(0, unlockedGods - 10)
        + (postOfficeBonus +
          (sigilBonus +
            (cardBonus +
              (stampBonus +
                (activeBubbleBonus +
                  (statueBonus +
                    (mealBonus +
                      (vialBonus
                        + (talentBonus2 +
                          (10 * account?.tasks?.[2]?.[4]?.[4] +
                            (25 * masteryBonus +
                              (starSignBonus
                                + (guildBonus + (arcadeBonus
                                  + (equipBonus +
                                    (voteBonus +
                                      armorSetBonus))))))))))))))))) / 100);
    return {
      value,
      breakdown: [
        { name: 'Div style', value: character?.divStyle?.divPerHour / 100 },
        { name: 'Gem shop', value: gemShopBonus / 100 },
        { name: 'Major', value: (purrmepPlayer ? 1 : 0) / 100 },
        { name: 'Talent', value: (talentBonus + talentBonus2) / 100 },
        { name: 'Companion', value: companionBonus / 100 },
        { name: 'Div rank', value: (10 * Math.max(0, unlockedGods - 10)) / 100 },
        { name: 'Postoffice', value: postOfficeBonus / 100 },
        { name: 'Sigil', value: sigilBonus / 100 },
        { name: 'Card', value: cardBonus / 100 },
        { name: 'Stamp', value: stampBonus / 100 },
        { name: 'Active bubble', value: activeBubbleBonus / 100 },
        { name: 'Statue', value: statueBonus / 100 },
        { name: 'Meal', value: mealBonus / 100 },
        { name: 'Vial', value: vialBonus / 100 },
        { name: 'Task', value: 10 * account?.tasks?.[2]?.[4]?.[4] / 100 },
        { name: 'Skill mastery', value: 25 * masteryBonus / 100 },
        { name: 'Starsign', value: starSignBonus / 100 },
        { name: 'Guild', value: guildBonus / 100 },
        { name: 'Arcade', value: arcadeBonus / 100 },
        { name: 'Equip', value: equipBonus / 100 },
        { name: 'Vote', value: voteBonus / 100 },
        { name: 'Armor set', value: armorSetBonus / 100 }

      ]
    }
  }
  else if (skillName === 'gaming') {
    const stampBonus = getStampsBonusByEffect(account, 'Gaming_EXP_Gain');
    const mealBonus = getMealsBonusByEffectOrStat(account, null, 'BrExp');
    const talentBonus = getHighestTalentByClass(characters, CLASSES.Divine_Knight, '1000_HOURS_PLAYED');
    const talentBonus2 = getTalentBonus(character?.flatTalents, 'TEMPESTUOUS_EMOTIONS');
    const vialBonus = getVialsBonusByStat(account?.alchemy?.vials, 'GameXP');
    const masteryBonus = isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.gaming?.rank, 0);
    const guildBonus = getGuildBonusBonus(account?.guild?.guildBonuses, 14);

    const value = stampBonus
      + (mealBonus +
        (vialBonus
          + (talentBonus
            + (talentBonus2
              + (10 * account?.tasks?.[2]?.[4]?.[4]
                + (25 * masteryBonus
                  + guildBonus))))));

    return {
      value,
      breakdown: [
        { name: 'Stamp', value: stampBonus / 100 },
        { name: 'Meal', value: mealBonus / 100 },
        { name: 'Vial', value: vialBonus / 100 },
        { name: 'Talent', value: (talentBonus + talentBonus2) / 100 },
        { name: 'Task', value: 10 * account?.tasks?.[2]?.[4]?.[4] / 100 },
        { name: 'Skill mastery', value: 25 * masteryBonus / 100 },
        { name: 'Guild', value: guildBonus / 100 }
      ]
    }
  }
  else if (skillName === 'farming') {
    const marketBonus = getMarketBonus(account?.farming?.market, 'EXP_GMO', 'value');
    const marketBonus2 = getMarketBonus(account?.farming?.market, 'SMARTER_SEEDS');
    const msaBonus = account?.msaTotalizer?.farmingExp?.value;
    const skillMasteryBonus = isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.farming?.rank, 0);
    const mealBonus = getMealsBonusByEffectOrStat(account, null, 'zFarmExp')
    const arcadeBonus = getArcadeBonus(account?.arcade?.shop, 'Farming_EXP')?.bonus;
    const winnerBonus = getWinnerBonus(account, '<x Farming EXP');
    const vialBonus = getVialsBonusByEffect(account?.alchemy?.vials, null, '6FarmEXP');
    const statueBonus = getStatueBonus(account, 25, character?.flatTalents);
    const cardBonus = getCardBonusByEffect(account?.cards, 'Farming_EXP_(Passive)');
    const charmBonus = getCharmBonus(account, 'Rock_Candy');
    const labBonus = getLabBonus(account?.lab.labBonuses, 16);
    const starSignBonus = getStarSignBonus(character, account, 'Farming_EXP');
    const guildBonus = getGuildBonusBonus(account?.guild?.guildBonuses, 14);
    const achievementBonus = getAchievementStatus(account?.achievements, 360);
    const achievementBonus2 = getAchievementStatus(account?.achievements, 356);
    const voteBonus = getVoteBonus(account, 29);
    const shinyBonus = getShinyBonus(account?.breeding?.pets, 'Farming_EXP_gain');
    const landRankBonus = getLandRankTotalBonus(account, 4);
    const talentBonus = getHighestTalentByClass(characters, CLASSES.Death_Bringer, 'AGRICULTURAL_\'PRECIATION');

    let value = Math.max(1, marketBonus)
      * (1 + (marketBonus2
        + (msaBonus + 25
          * skillMasteryBonus
          + (mealBonus + arcadeBonus))) / 100)
      * (1 + winnerBonus / 100)
      * (1 + (vialBonus
        + (statueBonus +
          (cardBonus
            + charmBonus)) +
        (labBonus +
          (starSignBonus
            + (guildBonus +
              (10 * achievementBonus
                + (15 * achievementBonus2 +
                  voteBonus)))))) / 100)
      * (1 + (shinyBonus +
        2 * account?.tasks?.[2]?.[5]?.[2]) / 100)
      * (1 + landRankBonus / 100)
      * (1 + talentBonus / 100);

    let formattedValue;
    if (value > 1e8) {
      formattedValue = Math.round(value / 1e6) + 'M'
    }
    else if (value > 1e4) {
      formattedValue = Math.round(value);
    }
    else {
      formattedValue = notateNumber(value, 'MultiplierInfo');
    }

    return {
      value,
      formattedValue,
      breakdown: [
        { name: 'Market', value: (marketBonus + marketBonus2) / 100 },
        { name: 'Msa', value: msaBonus / 100 },
        { name: 'Skill mastery', value: 25 * skillMasteryBonus / 100 },
        { name: 'Summoning', value: winnerBonus / 100 },
        { name: 'Vial', value: vialBonus / 100 },
        { name: 'Statue', value: statueBonus / 100 },
        { name: 'Card', value: cardBonus / 100 },
        { name: 'Charm', value: charmBonus / 100 },
        { name: 'Lab', value: labBonus / 100 },
        { name: 'Starsign', value: starSignBonus / 100 },
        { name: 'Guild', value: guildBonus / 100 },
        { name: 'Achievement', value: (10 * achievementBonus + 15 * achievementBonus2) / 100 },
        { name: 'Task', value: 10 * account?.tasks?.[2]?.[5]?.[2] / 100 },
        { name: 'Vote', value: voteBonus / 100 },
        { name: 'Shiny', value: shinyBonus / 100 },
        { name: 'Land rank', value: landRankBonus / 100 },
        { name: 'Talent', value: talentBonus / 100 }
      ]
    }
  }
  else if (skillName === 'sneaking') {
    const playerFloor = account?.sneaking?.players?.[character?.playerId]?.floor;
    const baseExp = ninjaExtraInfo[11]?.split(' ')[playerFloor];
    const ninjaUpgradeBonus = getNinjaUpgradeBonus(account, 'Respect_for_the_Art');
    const arcadeBonus = getArcadeBonus(account?.arcade?.shop, 'Sneaking_XP_multi')?.bonus;
    const ninjaEquip = getInventoryNinjaItem(account, 'Gold_Eye');
    const compassBonus = getCompassBonus(account, 51);
    const gemstoneBonus = account?.sneaking?.gemStones?.[4]?.bonus;
    const vialBonus = getVialsBonusByEffect(account?.alchemy?.vials, null, '6SneakEXP');
    const mealBonus = getMealsBonusByEffectOrStat(account, null, 'zSneakExp');
    const skillMasteryBonus = isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.sneaking?.rank, 0);
    const charmBonus = getCharmBonus(account, 'Sour_Wowzer');
    const cardBonus = getCardBonusByEffect(account?.cards, 'Sneaking_EXP_(Passive)');
    const labBonus = getLabBonus(account?.lab.labBonuses, 16);
    const stampBonus = getStampsBonusByEffect(account, 'Sneaking_EXP_Gain');
    const starSignBonus = getStarSignBonus(character, account, 'Sneaking_EXP');
    const guildBonus = getGuildBonusBonus(account?.guild?.guildBonuses, 14);
    const talentBonus = getHighestTalentByClass(characters, CLASSES.Wind_Walker, 'SNEAKY_SKILLING');
    const achievementBonus = getAchievementStatus(account?.achievements, 370);
    const voteBonus = getVoteBonus(account, 25);
    const winBonus = getWinnerBonus(account, '<x Sneak EXP');

    let value = baseExp *
      (1 + ninjaUpgradeBonus / 100) *
      (1 + arcadeBonus / 100) *
      (1 + ninjaEquip / 100) *
      (1 + compassBonus / 100) *
      (1 + gemstoneBonus / 100) *
      (
        1 +
        (
          vialBonus +
          mealBonus +
          25 * skillMasteryBonus +
          charmBonus +
          cardBonus +
          labBonus +
          stampBonus +
          starSignBonus +
          guildBonus +
          talentBonus +
          10 * achievementBonus +
          voteBonus
        ) / 100
      ) *
      (
        1 +
        (
          0 + //n._customBlock_Ninja('NinjaBonus', t, 13) +
          0 + //n._customBlock_Ninja('NinjaBonus', t, 19) +
          0 + //n._customBlock_Ninja('NinjaBonus', t, 3) +
          0  //n._customBlock_Ninja('NinjaBonus', t, 7)
        ) / 100
      ) *
      Math.max(0, 1 - 100 * 0 * //n._customBlock_Ninja('NinjaBonus', t, 5)) *
        (1 + winBonus / 100) *
        Math.max(1, talentBonus));

    return {
      value,
      breakdown: [
        { name: 'Ninja upgrade', value: ninjaUpgradeBonus / 100 },
        { name: 'Arcade', value: arcadeBonus / 100 },
        { name: 'Gold item', value: ninjaEquip / 100 },
        { name: 'Ninja equip', value: 0 / 100 },
        { name: 'Compass', value: compassBonus / 100 },
        { name: 'Gemstone', value: gemstoneBonus / 100 },
        { name: 'Vial', value: vialBonus / 100 },
        { name: 'Meal', value: mealBonus / 100 },
        { name: 'Skill mastery', value: 25 * skillMasteryBonus / 100 },
        { name: 'Charm', value: charmBonus / 100 },
        { name: 'Card', value: cardBonus / 100 },
        { name: 'Lab', value: labBonus / 100 },
        { name: 'Stamp', value: stampBonus / 100 },
        { name: 'Starsign', value: starSignBonus / 100 },
        { name: 'Guild', value: guildBonus / 100 },
        { name: 'Talent', value: talentBonus / 100 },
        { name: 'Achievement', value: (10 * achievementBonus) / 100 },
        { name: 'Vote', value: voteBonus / 100 }
      ]
    }
  }
  else if (skillName === 'summoning') {
    const talentBonus = getHighestTalentByClass(characters, CLASSES.Arcane_Cultist, 'PASSION_OF_THE_SUMMON');
    const vialBonus = getVialsBonusByStat(account?.alchemy?.vials, '6SummEXP');
    const cardBonus = getCardBonusByEffect(account?.cards, 'Summoning_EXP_(Passive)');
    const mealBonus = getMealsBonusByEffectOrStat(account, null, 'zSummonExp');
    const labBonus = getLabBonus(account?.lab.labBonuses, 16);
    const arcadeBonus = getArcadeBonus(account?.arcade?.shop, 'Summon_XP_multi')?.bonus;
    const shinyBonus = getShinyBonus(account?.breeding?.pets, 'Summoning_EXP_gain');
    const skillMasteryBonus = isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.summoning?.rank, 0);
    const stampBonus = getStampsBonusByEffect(account, 'Summoning_EXP_Gain');
    const starSignBonus = getStarSignBonus(character, account, 'Summoning_EXP');
    const guildBonus = getGuildBonusBonus(account?.guild?.guildBonuses, 14);
    const voteBonus = getVoteBonus(account, 28)

    const value = Math.max(1, talentBonus)
      * (1 + (vialBonus
        + (cardBonus +
          (mealBonus
            + labBonus))) / 100)
      * (1 + arcadeBonus / 100) *
      (1 + (shinyBonus
        + 25 * skillMasteryBonus +
        (stampBonus +
          (starSignBonus
            + (guildBonus
              + voteBonus)))) / 100);
    return {
      value,
      breakdown: [
        { name: 'Talent', value: talentBonus / 100 },
        { name: 'Vial', value: vialBonus / 100 },
        { name: 'Card', value: cardBonus / 100 },
        { name: 'Meal', value: mealBonus / 100 },
        { name: 'Lab', value: labBonus / 100 },
        { name: 'Arcade', value: arcadeBonus / 100 },
        { name: 'Shiny', value: shinyBonus / 100 },
        { name: 'Skill mastery', value: 25 * skillMasteryBonus / 100 },
        { name: 'Stamp', value: stampBonus / 100 },
        { name: 'Starsign', value: starSignBonus / 100 },
        { name: 'Guild', value: guildBonus / 100 },
        { name: 'Vote', value: voteBonus / 100 }
      ]
    }
  }
}

// "AllSkillxpz" == e
export const getAllSkillsExp = (character, characters, account) => {
  const starSignBonus = getStarSignBonus(character, account, 'Skill_EXP_gain');
  const cEfauntCardBonus = getEquippedCardBonus(character?.cards, 'Z7');
  const passiveCardBonus = getCardBonusByEffect(account?.cards, 'Skill_EXP_(Passive)')
  const arcadeBonus = getArcadeBonus(account?.arcade?.shop, 'Skill_EXP_gain')?.bonus;
  const goldenFoodBonus = getGoldenFoodBonus('Golden_Ham', character, account, characters);
  const cardSetBonus = character?.cards?.cardSet?.rawName === 'CardSet3' ? character?.cards?.cardSet?.bonus : 0;
  const voidWalkerEnhancementEclipse = getHighestTalentByClass(characters, CLASSES.Voidwalker, 'ENHANCEMENT_ECLIPSE');
  const greenTubeEnhancement = getVoidWalkerTalentEnhancements(characters, account, voidWalkerEnhancementEclipse, 536);
  const luckyCharmEnhancement = getVoidWalkerTalentEnhancements(characters, account, voidWalkerEnhancementEclipse, 35, character);
  const bubonicGreen = getBubonicGreenTube(character, characters, account);
  const shrineBonus = getShrineBonus(account?.shrines, 5, character?.mapIndex, account.cards, account?.sailing?.artifacts);
  const statueBonus = getStatueBonus(account, 17, character?.flatTalents);
  const unendingEnergyBonus = getPrayerBonusAndCurse(character?.activePrayers, 'Unending_Energy', account)?.bonus
  const balanceOfEffBonus = getPrayerBonusAndCurse(character?.activePrayers, 'Balance_of_Proficiency', account)?.bonus;
  const skilledDimwitCurse = getPrayerBonusAndCurse(character?.activePrayers, 'Skilled_Dimwit', account)?.curse;
  const theRoyalSamplerCurse = getPrayerBonusAndCurse(character?.activePrayers, 'The_Royal_Sampler', account)?.curse;
  const equipmentBonus = getStatsFromGear(character, 27, account);
  const maestroTransfusionTalentBonus = getTalentBonusIfActive(character?.activeBuffs, 'MAESTRO_TRANSFUSION');
  const saltLickBonus = getSaltLickBonus(account?.saltLick, 3);
  const dungeonSkillExpBonus = getDungeonStatBonus(account?.dungeons?.upgrades, 'Class_Exp');
  const myriadPostOfficeBox = getPostOfficeBonus(character?.postOffice, 'Myriad_Crate', 2);
  const firstAchievementBonus = getAchievementStatus(account?.achievements, 283);
  const secondAchievementBonus = getAchievementStatus(account?.achievements, 284);
  const thirdAchievementBonus = getAchievementStatus(account?.achievements, 294);
  const fourthAchievementBonus = getAchievementStatus(account?.achievements, 359);
  const smithingSkillMasteryBonus = getSkillMasteryBonusByIndex(account?.totalSkillsLevels, account?.rift, 1);
  const allSkillMasteryBonus = getSkillMasteryBonusByIndex(account?.totalSkillsLevels, account?.rift, 4);
  const shinyBonus = getShinyBonus(account?.breeding?.pets, 'Skill_EXP');
  const superbitBonus = isSuperbitUnlocked(account, 'MSA_Skill_EXP')?.bonus ?? 0;
  const winnerBonus = getWinnerBonus(account, '+{% Skill EXP');
  const companionBonus = isCompanionBonusActive(account, 9) ? 20 : 0;
  const schematicBonus = getSchematicBonus({ holesObject: account?.hole?.holesObject, t: 49, i: 10 });
  let godBonus = 0;
  const flutterbisIndexes = getDeityLinkedIndex(account, characters, 7);
  if (flutterbisIndexes?.[character?.playerId] !== -1) {
    godBonus = getGodByIndex(account?.divinity?.linkedDeities, characters, 7) || 0;
  }
  const guildBonus = getGuildBonusBonus(account?.guild?.guildBonuses, 14);
  const owlBonus = getOwlBonus(account?.owl?.bonuses, 'Skill XP');
  const armorSetBonus = getArmorSetBonus(account, 'CHIZOAR_SET');

  const value = starSignBonus
    + (cEfauntCardBonus
      + arcadeBonus
      + goldenFoodBonus
      + bubonicGreen
      * Math.min(1, greenTubeEnhancement ? bubonicGreen : 0)
      + (cardSetBonus
        + passiveCardBonus
        + (Math.min(150, 100 * (checkCharClass(character?.class, CLASSES.Maestro)
          ? luckyCharmEnhancement
          : 0)) + shrineBonus)
        + statueBonus
        + unendingEnergyBonus
        + balanceOfEffBonus
        - skilledDimwitCurse
        - theRoyalSamplerCurse
        + (equipmentBonus
          + (maestroTransfusionTalentBonus
            + (saltLickBonus
              + (dungeonSkillExpBonus
                + (myriadPostOfficeBox
                  + (godBonus
                    + (10 * firstAchievementBonus + (25 * secondAchievementBonus
                      + (10 * thirdAchievementBonus + 15 * fourthAchievementBonus
                        + (smithingSkillMasteryBonus + (allSkillMasteryBonus
                          + (shinyBonus + superbitBonus) + companionBonus
                          + winnerBonus
                          + guildBonus
                          + owlBonus
                          + armorSetBonus
                          + schematicBonus)))))))))))))
  return {
    value,
    breakdown: [
      { name: '', value: 1 }
    ]
  }
}

const createTalentPreset = (charClass, skillLevels, maxSkillLevels) => {
  const pages = talentPagesMap?.[charClass];
  const { flat: flatTalents, talents } = createTalentPage(charClass, pages, skillLevels, maxSkillLevels);
  const {
    flat: flatStarTalents,
    talents: orderedStarTalents
  } = createTalentPage(charClass, starTalentsPages, skillLevels, maxSkillLevels, true);
  return {
    talents,
    flatTalents,
    starTalents: orderedStarTalents,
    flatStarTalents
  }
}

const getStealthRate = (character, account) => {
  const playerFloor = account?.sneaking?.players?.[character?.playerId]?.floor; // NjaDN1
  const sneakingLevel = character?.skillsInfo?.sneaking?.level; // NjaDN3
  const mainStat = mainStatMap?.[character?.class];
  const bubbleBonus = getBubbleBonus(account, 'STEALTH_CHAPTER', false, mainStat === 'agility');
  const starSignBonus = getStarSignBonus(character, account, 'Ninja_Twin')
  const statueBonus = getStatueBonus(account, 26, character?.flatTalents);
  const passiveCardBonus = getCardBonusByEffect(account?.cards, 'Sneaking_Stealth_(Passive)');
  const ninjaUpgradeBonus = getNinjaUpgradeBonus(account, 'Way_of_Stealth');
  let stealthMulti = 1;
  account.sneaking.players?.forEach((player, playerIndex) => {
    player?.equipment?.forEach((item) => {
      if (item.name === 'Smoke_Bomb') {
        if (playerFloor === player.floor && character?.playerId !== playerIndex) {
          stealthMulti += item.value / 100;
        }
      }
      if (item.name === 'Lotus_Flower') {
        if (playerFloor === player.floor && character?.playerId !== playerIndex) {
          stealthMulti += item.value / 100;
        }
      }
    })
  })
  const ninjaEquip = getNinjaEquipmentBonus(account, character.playerId, 'Scroll_of_Power');
  const anotherNinjaEquip = getNinjaEquipmentBonus(account, character.playerId, 'Silk_Veil');
  const yetAnotherNinjaEquip = getNinjaEquipmentBonus(account, character.playerId, 'Rosaries');
  const math = stealthMulti
    * (1 + ninjaEquip / 100)
    * (1 + anotherNinjaEquip / 100)
    * (1 + yetAnotherNinjaEquip / 100)
    * (1 + (bubbleBonus
      + starSignBonus) / 100)
    * (1 + statueBonus / 100)
    * (1 + passiveCardBonus / 100)

  return (10 + ninjaUpgradeBonus * sneakingLevel) * math;
}
const getDetectionRate = (character, account) => {
  const floor = account?.sneaking?.players?.[character?.playerId]?.floor;
  const floorDetectionModifier = ninjaExtraInfo[9].split(' ')[floor];
  return Math.max(0, Math.min(1, 1 - 1.1 * getStealthRate(character, account)
    / (getStealthRate(character, account) + parseFloat(floorDetectionModifier))));
}
export const getJadeRate = (character, account) => {
  const floor = account?.sneaking?.players?.[character?.playerId]?.floor;
  const floorJadeModifier = ninjaExtraInfo[10].split(' ')[floor];
  const charmBonus = getCharmBonus(account, 'Treat_Sack');
  const sneakingLevel = character?.skillsInfo?.sneaking?.level;
  const ninjaUpgradeBonus = getNinjaUpgradeBonus(account, 'Currency_Conduit');
  // Equipped Ninja Items
  const sameFloor = account.sneaking.players.filter(({ floor: f }) => f === floor);
  const floorSolo = sameFloor.length === 1;
  const ninjaEquip = getNinjaEquipmentBonus(account, character.playerId, 'Green_Belt') * (floorSolo ? 3 : 1);
  const ninjaEquip1 = getNinjaEquipmentBonus(account, character.playerId, 'Black_Belt') * (floorSolo ? 3 : 1);
  const ninjaEquip2 = getInventoryNinjaItem(account, 'Gold_Coin');
  const detectionRate = getDetectionRate(character, account);
  const ninjaEquip3 = getNinjaEquipmentBonus(account, character.playerId, 'Shiny_Smoke') * (detectionRate <= 0 ? 3 : 1);
  const ninjaEquip4 = getNinjaEquipmentBonus(account, character.playerId, 'Scroll_of_Power');
  const ninjaEquip5 = getNinjaEquipmentBonus(account, character.playerId, 'Goodie_Bag');
  const vialBonus = getVialsBonusByEffect(account?.alchemy?.vials, null, '6Jade');
  const mealBonus = getMealsBonusByEffectOrStat(account, null, 'zJade');
  const passiveCardBonus = getCardBonusByEffect(account?.cards, 'Jade_Coin_gain_(Passive)');
  const jadeEmporiumBonus = getJadeEmporiumBonus(account, 'Jade_Coin_Magnetism');
  const stampBonus = getStampsBonusByEffect(account, '+{%_Jade_Coin_Gain');
  const farmingBonus = account?.farming?.cropDepot?.jadeCoin?.value;
  const summoningBonus = getWinnerBonus(account, '<x Jade Gain');
  const msaBonus = account?.msaTotalizer?.jadeCoin?.value;
  const sigilBonus = getSigilBonus(account?.alchemy?.p2w?.sigils, 'COOL_COIN');
  const starSignBonus = getStarSignBonus(character, account, 'Jade_Gain')
  const masteryBonus = isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.sneaking?.rank, 1);

  return parseFloat(floorJadeModifier)
    * (1 + (ninjaUpgradeBonus * sneakingLevel) / 100) * (1 + ninjaEquip / 100) * (1 + ninjaEquip1 / 100)
    * (1 + charmBonus / 100) * (1 + ninjaEquip2 / 100) * (1 + (vialBonus
      + mealBonus + passiveCardBonus) / 100) * (1 + (ninjaEquip3 + (ninjaEquip4
      + ninjaEquip5)) / 100) * (1 + (jadeEmporiumBonus + stampBonus) / 100) * (1 + farmingBonus / 100)
    * (1 + summoningBonus / 100) *
    (1 + (msaBonus
      + sigilBonus) / 100)
    * (1 + starSignBonus / 100)
    * (1 + (10 * masteryBonus) / 100);
}
export const getRespawnRate = (character, account) => {
  const { targetMonster } = character;
  const monster = monsters?.[targetMonster];
  const expression = `monsterRespawnTime / (1 + (shrineBonus
  + chipBonus
  + (equipmentBonus + obolsBonus)
  + achievementBonus
  + starSignBonus
  + meritBonus) / 100);`
  if (!monster || monster?.AFKtype === 'Nothing') return {
    respawnRate: 0,
    expression,
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

  const worldSixMeritBonus = account?.tasks?.[2]?.[5]?.[1];
  const worldSixMeritBonusPerLevel = account?.meritsDescriptions?.[5]?.[1]?.bonusPerLevel;

  const meritBonus = (worldIndex === 1 || isRift) ? worldOneMeritBonus * worldOneMeritBonusPerLevel
    : worldIndex === 2 ? worldTwoMeritBonus * worldTwoMeritBonusPerLevel
      : worldIndex === 3 ? worldThreeMeritBonus * worldThreeMeritBonusPerLevel
        : worldIndex === 4 ? worldFourMeritBonus * worldFourMeritBonusPerLevel
          : worldIndex === 5 ? worldFiveMeritBonus * worldFiveMeritBonusPerLevel :
            worldIndex === 6 ? worldSixMeritBonus * worldSixMeritBonusPerLevel : 0;

  const achievementBonus = (worldIndex === 1 || isRift) ? worldOneAchievement
    : worldIndex === 2 ? worldTwoAchievement
      : worldIndex === 5 ? 2 * worldFiveAchievement : 0;

  const monsterRespawnTime = isRift ? 45 : RespawnTime;

  const respawnRate = monsterRespawnTime
    / (1 + (shrineBonus
      + chipBonus
      + (equipmentBonus + obolsBonus)
      + achievementBonus
      + starSignBonus
      + meritBonus) / 100);

  const breakdown = [
    { title: 'Additive' },
    { name: '' },
    { name: 'Base', value: monsterRespawnTime },
    { name: 'Achievement', value: achievementBonus / 100 },
    { name: 'Chip', value: chipBonus / 100 },
    { name: 'Equipment', value: equipmentBonus / 100 },
    { name: 'Merit', value: meritBonus / 100 },
    { name: 'Shrine', value: shrineBonus / 100 },
    { name: 'Starsigns', value: starSignBonus / 100 }
  ];

  return {
    respawnRate,
    breakdown,
    expression
  };
}

export const getClassExpMulti = (character, account, characters) => {
  // _customBlock_ExpMulti
  const { luck } = character?.stats || {};
  let expBonus1;
  if (luck < 1e3) {
    expBonus1 = (Math.pow(luck + 1, 0.37) - 1) / 30;
  }
  else {
    expBonus1 = (luck - 1e3) / (luck + 2500) * 0.8 + .3963;
  }

  // Lowest character bonus
  const lowestLevel = characters?.reduce((res, { level }) => (level < res ? level : res), Infinity);
  const isLowestLevel = character?.level === lowestLevel;
  // This is the right calculation!
  // const lowestCharacterBonus = account?.tasks?.[2]?.[0]?.[2] * account?.meritsDescriptions?.[0]?.[2]?.bonusPerLevel;
  const upgradeVaultBonus = getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 12);
  const meritBonus = account?.tasks?.[2]?.[0]?.[2] * 3;
  const superbitBonus = isSuperbitUnlocked(account, 'Noobie_Gains')?.unlocked ? 50 : 0;
  let expBonus2 = 0;
  let expBonus3 = 0;
  let superbitApplied;
  if (isLowestLevel) {
    expBonus2 = meritBonus + upgradeVaultBonus;
    expBonus3 += superbitBonus;
    superbitApplied = true;
  }

  if (character?.level < 50) {
    expBonus2 += character?.cards?.cardSet?.rawName === 'CardSet0' ? character?.cards?.cardSet?.bonus : 0;
  }

  if (character?.level < 120) {
    expBonus2 += getMealsBonusByEffectOrStat(account, null, 'Clexp')
  }
  const weeklyBossBonus = Math.min(150, (account?.weeklyBossesRaw?.c || 0))
  if (account?.weeklyBossesRaw?.c) {
    expBonus2 += weeklyBossBonus;
  }
  //
  if (character?.level < 10) {
    expBonus2 += 150;
  }
  else if (character?.level < 30) {
    expBonus2 += 100;
  }
  else if (character?.level < 50) {
    expBonus2 += 50;
  }

  const godLinks = getDeityLinkedIndex(account, characters, 5);
  const minorGodBonus = getMinorDivinityBonus(character, account, 5, characters);
  if (godLinks.includes(character?.playerId)) {
    expBonus2 += minorGodBonus;
  }

  const cardSetBonus = character?.cards?.cardSet?.rawName === 'CardSet26' ? character?.cards?.cardSet?.bonus : 0;
  expBonus2 += cardSetBonus;

  const hasBundle = isBundlePurchased(account?.bundles, 'bun_q');
  const bundleBonus = hasBundle ? 20 : 0;
  if (hasBundle) {
    expBonus3 += bundleBonus;
  }

  const compassBonus = getCompassBonus(account, 51);
  const schematicBonus = getSchematicBonus({ holesObject: account?.hole?.holesObject, t: 47, i: 0 });
  const winnerBonus = getWinnerBonus(account, '+{% Class EXP');
  const grimoireBonus = getGrimoireBonus(account?.grimoire?.upgrades, 24);
  const upgradeVaultBonus2 = getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 3);
  const upgradeVaultBonus3 = getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 35);
  const schematicBonus2 = getSchematicBonus({ holesObject: account?.hole?.holesObject, t: 83, i: 40 });

  const expBonus4 = compassBonus
    + (schematicBonus
      + (winnerBonus
        + (grimoireBonus
          + (upgradeVaultBonus2
            + (upgradeVaultBonus3 * lavaLog(account?.accountOptions?.[345])
              + schematicBonus2)))));

  // Wind walker bonuses
  const hasMedallion = account?.compass?.medallions?.find(({ Name }) => Name === character?.afkTarget);
  const talentBonus1 = getHighestTalentByClass(characters, CLASSES.Wind_Walker, 'SHINY_MEDALLIONS');
  const talentBonus2 = getHighestTalentByClass(characters, CLASSES.Wind_Walker, 'SLAYER_ABOMINATOR');
  const equipBonus = getStatsFromGear(character, 84, account);
  const windWalkerBonus = (hasMedallion?.acquired ? talentBonus1 : 1) * (1 + equipBonus / 100) *
    Math.pow(Math.max(1, talentBonus2), account?.compass?.totalKilledAbominations)

  const talentBonus3 = getHighestTalentByClass(characters, CLASSES.Siege_Breaker, 'ARCHLORD_OF_THE_PIRATES');
  const siegeBreakerBonus = 1 + talentBonus3 * lavaLog(account?.accountOptions?.[139] ?? 0) / 100;

  const forthTalentBonus = getTalentBonus(character?.flatTalents, 'LUCKY_CHARMS');
  const equipBonus2 = getStatsFromGear(character, 78, account);
  const equipBonus3 = getStatsFromGear(character, 4, account);
  const postOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Box_of_Unwanted_Stats', 2);
  const foodBonus = getFoodBonus(character, account, 'ClassEXP', true)
  const starSignBonus = getStarSignBonus(character, account, 'Class_EXP_Gain');
  const vialBonus = getVialsBonusByStat(account?.alchemy?.vials, 'MonsterEXP');
  const bubbleBonus = getBubbleBonus(account, 'GRIND_TIME', false);
  const cardBonus = getCardBonusByEffect(character?.cards?.equippedCards, cardBonuses[44]);
  const statueBonus = getStatueBonus(account, 10, character?.flatTalents);
  const starTalent = getTalentBonus(character?.flatStarTalents, 'JUST_EXP');
  const shrineBonus = getShrineBonus(account?.shrines, 5, character?.mapIndex, account.cards, account?.sailing?.artifacts);
  const saltLickBonus = getSaltLickBonus(account?.saltLick, 3);
  const prayerBonus1 = getPrayerBonusAndCurse(character?.prayers, 'Big_Brain_Time')?.bonus
  const prayerBonus2 = getPrayerBonusAndCurse(character?.prayers, 'Unending_Energy')?.bonus
  const prayerBonus3 = getPrayerBonusAndCurse(character?.prayers, 'The_Royal_Sampler')?.curse
  const flurboBonus = getDungeonFlurboStatBonus(account?.dungeons?.upgrades, 'Class_Exp');
  const achievement1 = getAchievementStatus(account?.achievements, 57);
  const achievement2 = getAchievementStatus(account?.achievements, 357);
  const achievement3 = getAchievementStatus(account?.achievements, 61);
  const achievement4 = getAchievementStatus(account?.achievements, 124);
  const achievement5 = getAchievementStatus(account?.achievements, 188);
  const arcadeBonus = getArcadeBonus(account?.arcade?.shop, 'Class_EXP_gain')?.bonus
  const sigilBonus = getSigilBonus(account?.alchemy?.p2w?.sigils, 'METAL_EXTERIOR');
  const achievement6 = getAchievementStatus(account?.achievements, 286);
  const shinyBonus = getShinyBonus(account?.breeding?.pets, 'Class_EXP');
  const msaBonus = account?.msaTotalizer?.classExp?.value ?? 0;
  const talentBonus4 = getHighestTalentByClass(characters, CLASSES.Voidwalker, 'EXP_CULTIVATION');
  const passiveCardBonus = getCardBonusByEffect(account?.cards, 'Class_EXP_(Passive)')
  const companionBonus = isCompanionBonusActive(account, 3) ? account?.companions?.list?.at(3)?.bonus : 0;
  const goldenFoodBonus = getGoldenFoodBonus('Golden_Nigiri', character, account, characters);
  const owlBonus = getOwlBonus(account?.owl?.bonuses, 'Class XP');
  const voteBonus = getVoteBonus(account, 15) || 0;
  const monumentBonus = getMonumentBonus({ holesObject: account?.hole?.holesObject, t: 1, i: 6 });
  const armorSetBonus = getArmorSetBonus(account, 'IRON_SET');

  const value = siegeBreakerBonus
    * (1 + expBonus3 / 100)
    * windWalkerBonus
    * (1 + equipBonus2 / 100)
    * (expBonus1
      * (1 + forthTalentBonus / 100) / 1.8
      + (equipBonus3 +
        (postOfficeBonus
          + (foodBonus
            + starSignBonus
            + (vialBonus
              + (bubbleBonus
                + (cardBonus
                  + (expBonus2
                    + (statueBonus +
                      (starTalent
                        + (shrineBonus
                          + (saltLickBonus
                            + (prayerBonus1
                              + (prayerBonus2
                                - prayerBonus3
                                + flurboBonus
                                + (achievement1
                                  + 20 * achievement2
                                  + (3 * achievement3 + (2 * achievement4
                                    + (5 * achievement5 + (arcadeBonus +
                                      (sigilBonus +
                                        (25 * achievement6
                                          + (shinyBonus
                                            + (msaBonus
                                              + (talentBonus4
                                                + (passiveCardBonus
                                                  + (companionBonus
                                                    + (account?.accountOptions?.[179]) * account?.islands?.allShimmerBonus
                                                    + (goldenFoodBonus
                                                      + (owlBonus
                                                        + (voteBonus
                                                          + (monumentBonus
                                                            + expBonus4 + armorSetBonus)))))))))))))))))))))))))))))) / 100 + 1;

  return {
    value,
    breakdown: [
      { title: 'Additive Bonuses' },
      { name: '' },
      {
        name: 'Achievements',
        value: (achievement1 + 20 * achievement2 + 3 * achievement3 + 2 * achievement4 + 5 * achievement5 + 25 * achievement6) / 100
      },
      { name: 'Arcade', value: arcadeBonus / 100 },
      { name: 'Bubble', value: bubbleBonus / 100 },
      { name: 'Card Set', value: cardSetBonus / 100 },
      { name: 'Cards', value: cardBonus / 100 },
      { name: 'Compass', value: compassBonus / 100 },
      { name: 'Companion', value: companionBonus / 100 },
      { name: 'Dungeon (Flurbo)', value: flurboBonus / 100 },
      { name: 'Equipment', value: equipBonus3 / 100 },
      { name: 'Food', value: foodBonus / 100 },
      { name: 'God', value: minorGodBonus / 100 },
      { name: 'Golden Food', value: goldenFoodBonus / 100 },
      { name: 'Grimoire', value: grimoireBonus / 100 },
      {
        name: 'Island Bonus',
        value: (account?.accountOptions?.[179] ?? 0) * (account?.islands?.allShimmerBonus ?? 0) / 100
      },
      { name: 'Luck', value: expBonus1 },
      { name: 'Monument', value: monumentBonus / 100 },
      { name: 'MSA', value: msaBonus / 100 },
      { name: 'Owl', value: owlBonus / 100 },
      { name: 'Passive Card Bonus', value: passiveCardBonus / 100 },
      { name: 'Post Office', value: postOfficeBonus / 100 },
      { name: 'Prayers', value: prayerBonus1 + prayerBonus2 - prayerBonus3 / 100 },
      { name: 'Salt Lick', value: saltLickBonus / 100 },
      { name: 'Schematic', value: (schematicBonus + schematicBonus2) / 100 },
      { name: 'Shiny', value: shinyBonus / 100 },
      { name: 'Sigil', value: sigilBonus / 100 },
      { name: 'Star Sign', value: starSignBonus / 100 },
      { name: 'Star Talent', value: starTalent / 100 },
      { name: 'Statue', value: statueBonus / 100 },
      { name: 'Talent', value: forthTalentBonus / 100 },
      {
        name: 'Upgrade Vault',
        value: ((isLowestLevel
          ? upgradeVaultBonus
          : 0) + upgradeVaultBonus2 + upgradeVaultBonus3 * lavaLog(account?.accountOptions?.[345])) / 100
      },
      { name: 'Vote', value: voteBonus / 100 },
      { name: 'Iron set', value: armorSetBonus / 100 },
      { name: 'Weekly Boss', value: weeklyBossBonus },
      { name: 'Summoning', value: winnerBonus / 100 },
      { name: 'Vials', value: vialBonus / 100 },
      { name: 'Superbit', value: (isLowestLevel ? superbitBonus : 0) / 100 },
      { name: 'EXP Cultivation', value: talentBonus4 / 100 },
      { name: '' },
      { title: 'Multiplicative Bonuses' },
      { name: '' },
      { name: 'Wind Walker', value: windWalkerBonus },
      { name: 'Bundle', value: hasBundle ? expBonus3 / 100 : 0 },
      { name: 'Equipment (Exp Multi)', value: equipBonus2 / 100 },
      { name: 'Siege Breaker', value: siegeBreakerBonus }
    ],
    expression: `siegeBreakerBonus
* (1 + (
    ${superbitApplied ? 'superbit + ' : ''}${hasBundle ? 'bundleBonus' : ''}
) / 100)
* shinyMedallionTalentBonus
* (1 + bonusClassExpEquip / 100)
* Math.pow(
    Math.max(1, slayerAbominationTalentBonus),
    account?.compass?.totalKilledAbominations
)
* (1 + classExpMultiEquip / 100)
* (
    luckMulti * (1 + luckyCharmTalentBonus / 100) / 1.8
    + (
        xpFromMonstersEquip
        + postOfficeBonus
        + foodBonus
        + starSignBonus
        + vialBonus
        + bubbleBonus
        + cardBonus
        + omniphauGodBonus
        + expCardSet
        + statueBonus
        + starTalent
        + shrineBonus
        + saltLickBonus
        + prayerBonus1
        + (prayerBonus2 - prayerBonus3)
        + flurboBonus
        + achievement1
        + 20 * achievement2
        + (3 * achievement3)
        + (2 * achievement4)
        + (5 * achievement5)
        + arcadeBonus
        + sigilBonus
        + 25 * achievement6
        + shinyBonus
        + msaBonus
        + talentBonus4
        + passiveCardBonus
        + companionBonus
        + account?.accountOptions?.[179] * account?.islands?.allShimmerBonus
        + goldenFoodBonus
        + owlBonus
        + voteBonus
        + monumentBonus
        + compassBonus
        + gloomieExpSchematic
        + winnerBonus
        + grimoireBonus
        + wickedSmartVault
        + schoolinTheFishVault * lavaLog(fishCaught)
        + sanctumOfExpSchematic
        + armorSetBonus
    ) / 100 + 1
)`
  };
}

export const getDropRate = (character, account, characters) => {
  // _customBlock_TotalStats
  // "Drop_Rarity" == e
  const { luck } = character?.stats || {};
  let luckMulti;
  if (luck < 1e3) {
    luckMulti = (Math.pow(luck + 1, 0.37) - 1) / 40;
  }
  else {
    luckMulti = (luck - 1e3) / (luck + 2500) * 0.5 + 0.297;
  }
  const postOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Non_Predatory_Loot_Box', 0);
  const robbingHoodTalentBonus = getTalentBonus(character?.flatTalents, 'ROBBINGHOOD');
  const lootyCurseTalentBonus = getTalentBonus(character?.flatTalents, 'CURSE_OF_MR_LOOTY_BOOTY');
  const bossBattleTalentBonus = getTalentBonus(character?.flatStarTalents, 'BOSS_BATTLE_SPILLOVER');
  const dropChanceEquip = getStatsFromGear(character, 2, account);
  const equipmentDrMulti = getStatsFromGear(character, 91, account);
  const dropChanceTools = getStatsFromGear(character, 2, account, true);
  const dropChanceObols = getObolsBonus(character?.obols, bonuses?.etcBonuses?.[2]);
  const bubbleBonus = getBubbleBonus(account, 'DROPPIN_LOADS', false);
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
  const starSignRarityBonus = getStarSignBonus(character, account, 'Drop_Rarity');
  const stampBonus = getStampsBonusByEffect(account, '+{%_Drop_Rate');
  const thirdTalentBonus = getHighestTalentByClass(characters, CLASSES.Siege_Breaker, 'ARCHLORD_OF_THE_PIRATES');
  const extraDropRate = 1 + thirdTalentBonus * lavaLog(account?.accountOptions?.[139] ?? 0) / 100;
  const companionDropRate = isCompanionBonusActive(account, 3) ? account?.companions?.list?.at(3)?.bonus : 0;
  const secondCompanionDropRate = isCompanionBonusActive(account, 22) ? account?.companions?.list?.at(22)?.bonus : 0;
  const arcadeBonus = getArcadeBonus(account?.arcade?.shop, 'Drop_Rate')?.bonus;
  const equinoxDropRateBonus = getEquinoxBonus(account?.equinox?.upgrades, 'Faux_Jewels');
  const chipBonus = getPlayerLabChipBonus(character, account, 3);
  const summoningBonus = getWinnerBonus(account, '+{% Drop Rate');
  const achievementBonus = getAchievementStatus(account?.achievements, 377);
  const secondAchievementBonus = getAchievementStatus(account?.achievements, 381);
  const goldenFoodBonus = getGoldenFoodBonus('Golden_Cake', character, account, characters);
  const passiveCardBonus = getCardBonusByEffect(account?.cards, 'Drop_Rate_(Passive)');
  const tomeBonus = account?.tome?.bonuses?.[2]?.bonus ?? 0;
  const owlBonus = getOwlBonus(account?.owl?.bonuses, 'Drop Rate');
  const landRankBonus = getLandRank(account?.farming?.ranks, 9);
  const voteBonus = getVoteBonus(account, 27);
  const schematicBonus = getSchematicBonus({ holesObject: account?.hole?.holesObject, t: 46, i: 0 });
  const secondSchematicBonus = getSchematicBonus({ holesObject: account?.hole?.holesObject, t: 82, i: 20 });
  const grimoireBonus = getGrimoireBonus(account?.grimoire?.upgrades, 44);
  const upgradeVaultBonus = getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 18);
  const cropDepotBonus = account?.farming?.cropDepot?.dropRate?.value;
  const measurementBonus = getMeasurementBonus({
    holesObject: account?.hole?.holesObject,
    accountData: account,
    t: 15
  });
  const monumentBonus = getMonumentBonus({ holesObject: account?.hole?.holesObject, t: 2, i: 6 });
  const armorSetBonus = getArmorSetBonus(account, 'EFAUNT_SET');
  const emperorBonus = getEmperorBonus(account, 11);

  const additive =
    robbingHoodTalentBonus +
    postOfficeBonus +
    (dropChanceEquip + dropChanceObols + dropChanceTools) +
    bubbleBonus +
    cardBonus +
    lootyCurseTalentBonus +
    starSignBonus +
    starSignRarityBonus +
    guildBonus +
    cardSetBonus +
    shrineBonus +
    prayerBonus +
    sigilBonus +
    shinyBonus +
    arcadeBonus +
    companionDropRate +
    stampBonus +
    (bossBattleTalentBonus * (account?.accountOptions?.[189] ?? 0)) +
    equinoxDropRateBonus +
    summoningBonus +
    tomeBonus +
    passiveCardBonus +
    goldenFoodBonus +
    (6 * achievementBonus + 4 * secondAchievementBonus) +
    owlBonus +
    landRankBonus +
    voteBonus +
    schematicBonus +
    cropDepotBonus +
    grimoireBonus +
    upgradeVaultBonus +
    measurementBonus +
    secondCompanionDropRate +
    secondSchematicBonus +
    monumentBonus +
    emperorBonus +
    armorSetBonus;

  let dropRate = 1.4 * luckMulti + additive / 100 + 1;
  if (dropRate < 5 && chipBonus > 0) {
    dropRate = Math.min(5, dropRate + chipBonus / 100);
  }
  let final = dropRate;

  const hasAnotherDrBundle = isBundlePurchased(account?.bundles, 'bun_v');
  if (hasAnotherDrBundle) {
    final += 2;
  }

  final *= extraDropRate;

  const ninjaMasteryDropRate = account?.accountOptions?.[232] >= 1;
  if (ninjaMasteryDropRate) {
    final += .3;
  }

  const hasDrBundle = isBundlePurchased(account?.bundles, 'bun_p');
  if (hasDrBundle) {
    final *= 1.2
  }

  const charmBonus = getCharmBonus(account, 'Cotton_Candy');
  final *= (1 + charmBonus / 100);
  final *= (1 + equipmentDrMulti / 100)

  const thirdCompanionDropRate = isCompanionBonusActive(account, 26) ? account?.companions?.list?.at(26)?.bonus : 0;
  if (thirdCompanionDropRate) {
    final *= Math.max(1, Math.min(1.3, 1 + thirdCompanionDropRate));
  }

  const breakdown = [
    // Additive section (affects dropRate directly before multipliers)
    { title: 'Additive' },
    { name: '' },
    { name: 'Base', value: 1 },
    { name: 'Luck', value: 1.4 * luckMulti },
    {
      name: 'Talents',
      value: (robbingHoodTalentBonus + lootyCurseTalentBonus + (bossBattleTalentBonus * account?.accountOptions?.[189])) / 100
    },
    { name: 'Post Office', value: postOfficeBonus / 100 },
    { name: 'Equipment', value: (dropChanceEquip + dropChanceTools) / 100 },
    { name: 'Obols', value: dropChanceObols / 100 },
    { name: 'Bubble', value: bubbleBonus / 100 },
    { name: 'Cards', value: (cardBonus + cardSetBonus + passiveCardBonus) / 100 },
    { name: 'Shrine', value: shrineBonus / 100 },
    { name: 'Prayers', value: prayerBonus / 100 },
    { name: 'Sigil', value: sigilBonus / 100 },
    { name: 'Shiny', value: shinyBonus / 100 },
    { name: 'Arcade', value: arcadeBonus / 100 },
    { name: 'Starsign', value: (starSignBonus + starSignRarityBonus) / 100 },
    { name: 'Guild', value: guildBonus / 100 },
    { name: 'Companion+', value: (companionDropRate + secondCompanionDropRate) / 100 },
    { name: 'Equinox', value: equinoxDropRateBonus / 100 },
    { name: 'Stamps', value: stampBonus / 100 },
    { name: 'Tome', value: tomeBonus / 100 },
    { name: 'Owl', value: owlBonus / 100 },
    { name: 'Summoning', value: summoningBonus / 100 },
    { name: 'Golden food', value: goldenFoodBonus / 100 },
    { name: 'Achievements', value: (6 * achievementBonus + 4 * secondAchievementBonus) / 100 },
    { name: 'Land rank', value: landRankBonus / 100 },
    { name: 'Vote', value: voteBonus },
    { name: 'Schematics', value: (schematicBonus + secondSchematicBonus) / 100 },
    { name: 'Grimoire', value: grimoireBonus / 100 },
    { name: 'Upgrade vault', value: upgradeVaultBonus / 100 },
    { name: 'Crop Depot', value: cropDepotBonus / 100 },
    { name: 'Monument', value: monumentBonus / 100 },
    { name: 'Measurement', value: measurementBonus / 100 },
    { name: 'Emperor', value: emperorBonus / 100 },
    { name: 'Efaunt set', value: armorSetBonus / 100 },
    { name: 'Gem Bundle2', value: hasAnotherDrBundle ? 2 : 0 },
    { name: 'Ninja Mastery', value: ninjaMasteryDropRate ? 0.3 : 0 },

    // Multiplicative section (applied to final)
    { name: '' },
    { title: 'Multiplicative' },
    { name: '' },
    { name: 'Equipment', value: equipmentDrMulti / 100 },
    { name: 'Pristine Charm', value: charmBonus / 100 },
    { name: 'Companion', value: thirdCompanionDropRate },
    { name: 'Gem Bundle', value: hasDrBundle ? 1.2 : 0 },
    { name: 'Siege Breaker*', value: extraDropRate }
  ];
  return {
    dropRate: final,
    breakdown,
    expression: `let dropRate = 1.4 * luckMulti
  + (
    robbingHoodTalentBonus
    + postOfficeBonus
    + dropChanceEquip
    + dropChanceObols
    + dropChanceTools
    + bubbleBonus
    + cardBonus
    + lootyCurseTalentBonus
    + starSignBonus
    + starSignRarityBonus
    + guildBonus
    + cardSetBonus
    + shrineBonus
    + prayerBonus
    + sigilBonus
    + shinyBonus
    + arcadeBonus
    + companionDropRate
    + stampBonus
    + (bossBattleTalentBonus * account?.accountOptions?.[189])
    + equinoxDropRateBonus
    + summoningBonus
    + tomeBonus
    + passiveCardBonus
    + goldenFoodBonus
    + (6 * achievementBonus + 4 * secondAchievementBonus)
    + owlBonus
    + landRankBonus
    + voteBonus
    + schematicBonus
    + cropDepotBonus
    + grimoireBonus
    + upgradeVaultBonus
    + measurementBonus
    + secondCompanionDropRate
    + secondSchematicBonus
    + monumentBonus
    + emperorBonus
    + armorSetBonus
  ) / 100 + 1;

if (dropRate < 5 && chipBonus > 0) {
  dropRate = Math.min(5, dropRate + chipBonus / 100);
}

let final = dropRate;

if (hasAnotherDrBundle) {
  final += 2;
}

final *= extraDropRate;

if (ninjaMasteryDropRate) {
  final += 0.3;
}

if (hasDrBundle) {
  final *= 1.2;
}

final *= (1 + charmBonus / 100);
final *= (1 + equipmentDrMulti / 100);

if (thirdCompanionDropRate) {
  final *= Math.max(1, Math.min(1.3, 1 + thirdCompanionDropRate));
}`
  };
}

export const getCashMulti = (character, account, characters) => {
  // "MonsterCash" == e
  const { strength, agility, wisdom } = character?.stats || {};
  const cashStrBubble = getBubbleBonus(account, 'PENNY_OF_STRENGTH', false, mainStatMap?.[character?.class] === 'strength');
  const cashAgiBubble = getBubbleBonus(account, 'DOLLAR_OF_AGILITY', false, mainStatMap?.[character?.class] === 'agility');
  const cashWisBubble = getBubbleBonus(account, 'NICKEL_OF_WISDOM', false, mainStatMap?.[character?.class] === 'wisdom');
  const mealBonus = getMealsBonusByEffectOrStat(account, null, 'Cash');
  const artifactBonus = isArtifactAcquired(account?.sailing?.artifacts, 'Maneki_Kat')?.bonus ?? 0;
  const arenaWave = account?.accountOptions?.[89];
  const waveReqs = randomList?.[53];
  const arenaBonusUnlock = +(isArenaBonusActive(arenaWave, waveReqs, 5));
  const secondArenaBonusUnlock = +(isArenaBonusActive(arenaWave, waveReqs, 14));
  const statueBonus = getStatueBonus(account, 19, character?.flatTalents);
  const labBonus = getLabBonus(account?.lab.labBonuses, 9);
  const prayerBonus = getPrayerBonusAndCurse(character?.activePrayers, 'Jawbreaker', account)?.bonus;
  const harriepGodUsers = getDeityLinkedIndex(account, characters, 3);
  const divinityMinorBonus = characters?.reduce((sum, char, index) => {
    if (harriepGodUsers?.includes(index)) {
      return sum + getMinorDivinityBonus(char, account, 3, characters);
    }
    if (char?.linkedDeity === 3) {
      return sum + char?.deityMinorBonus;
    }
    return sum;
  }, 0);
  const vialBonus = getVialsBonusByEffect(account?.alchemy?.vials, null, 'MonsterCash');
  const cashFromEquipment = getStatsFromGear(character, 3, account);
  const cashFromTools = getStatsFromGear(character, 3, account, true);
  const cashFromObols = getObolsBonus(character?.obols, bonuses?.etcBonuses?.[3])
  const passiveCardBonus = getCardBonusByEffect(account?.cards, 'Money_from_mobs_(Passive)');
  const equippedCardBonus = getCardBonusByEffect(character?.cards?.equippedCards, 'Money_from_Monsters');
  const talentBonus = getTalentBonus(character?.flatTalents, 'CHACHING!');
  const flurboBonus = getDungeonFlurboStatBonus(account?.dungeons?.upgrades, 'Monster_Cash');
  const arcadeBonus = account?.arcade?.shop?.[10]?.bonus;
  const secondArcadeBonus = account?.arcade?.shop?.[11]?.bonus;
  const postOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Utilitarian_Capsule', 2)
  const guildBonus = getGuildBonusBonus(account?.guild?.guildBonuses, 8);
  const multikill = 1; // can't calculate multikill =/
  const coinsForCharonBonus = multikill * getTalentBonus(character?.flatStarTalents, 'COINS_FOR_CHARON');
  const cashPerCookingLv = character?.skillsInfo?.cooking?.level / 10;
  const americanTipperBonus = cashPerCookingLv * getTalentBonus(character?.flatStarTalents, 'AMERICAN_TIPPER');
  const goldFoodBonus = getGoldenFoodBonus('Golden_Bread', character, account, characters)
  const achievementBonus = getAchievementStatus(account?.achievements, 235);
  const secondAchievementBonus = getAchievementStatus(account?.achievements, 350);
  const thirdAchievementBonus = getAchievementStatus(account?.achievements, 376);
  const { dropRate } = getDropRate(character, account, characters);
  const dropRateMulti = (dropRate < 2 ? dropRate : Math.floor(dropRate < 5 ? dropRate : dropRate + 1)) * 100;
  const voteBonus = getVoteBonus(account, 34);
  const kangarooBonus = getKangarooBonus(account?.kangaroo?.bonuses, 'Cash');
  const eventBonus = getEventShopBonus(account, 9);
  const eventBonus2 = getEventShopBonus(account, 20);
  const equipmentBonusMoney = getStatsFromGear(character, 77, account);
  const bonusMoneyTools = getStatsFromGear(character, 77, account, true);
  const obolsBonusMoney = getObolsBonus(character?.obols, bonuses?.etcBonuses?.[77]);
  const hasCashBundle = isBundlePurchased(account?.bundles, 'bun_y') ? 1 : 0;
  const firstVaultUpgradeBonus = getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 34);
  const secondVaultUpgradeBonus = getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 37);
  const charmBonus = getCharmBonus(account, 'Gumball_Necklace');
  const starTalent = getTalentBonus(character?.flatStarTalents, 'CASH_MONEY');
  const thirdVaultUpgradeBonus = getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 11);
  const forthVaultUpgradeBonus = getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 2);
  const fifthVaultUpgradeBonus = getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 14);
  const boredBeansKills = Math.floor(lavaLog(account?.deathNote?.[0]?.mobs?.[3]?.kills) || 0);
  const sixthVaultUpgradeBonus = getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 31);
  const poopKills = Math.floor(lavaLog(account?.deathNote?.[0]?.mobs?.[10]?.kills || 0));
  const armorSetBonus = getArmorSetBonus(account, 'GOLD_SET');
  const companionBonus = isCompanionBonusActive(account, 24) ? account?.companions?.list?.at(24)?.bonus : 0;
  const gambitBonus = getGambitBonus(account, 7);
  const dustWalker = getHighestTalentByClass(characters, 'Winder_Walker', 'DUSTWALKER');

  const bubbles = (cashStrBubble
    * Math.floor(strength / 250)
    + (cashAgiBubble
      * Math.floor(agility / 250)
      + cashWisBubble
      * Math.floor(wisdom / 250)));

  const cashMulti = (1 + bubbles / 100)
    * (1 + Math.min(4, companionBonus))
    * (1 + 0.5 * eventBonus)
    * (1 + 0.6 * eventBonus2)
    * (1 + (obolsBonusMoney + equipmentBonusMoney + bonusMoneyTools) / 100)
    * (1 + armorSetBonus / 100)
    * (1 + gambitBonus / 100)
    * (1 + (250 * hasCashBundle) / 100)
    * (1 + (Math.max(1, dustWalker) * lavaLog(account?.accountOptions[362])) / 100)
    * (1 + (mealBonus + artifactBonus + (kangarooBonus + voteBonus)) / 100)
    * (1 + (0.5 * arenaBonusUnlock + (secondArenaBonusUnlock + statueBonus / 100)))
    * (1 + (labBonus + (firstVaultUpgradeBonus * account?.unlockedRecipes
      + secondVaultUpgradeBonus * account?.alchemy?.totalBubbleLevelsTill100)) / 100)
    * (1 + charmBonus / 100)
    * (1 + prayerBonus / 100)
    * (1 + (divinityMinorBonus + account?.farming?.cropDepot?.cash?.value) / 100)
    * (1 + (starTalent
      + vialBonus
      + ((cashFromEquipment + cashFromObols + cashFromTools)
        + (equippedCardBonus
          + passiveCardBonus
          + (talentBonus
            + (flurboBonus
              + (arcadeBonus + secondArcadeBonus)
              + (postOfficeBonus
                + (guildBonus
                  * (1 + Math.floor(character?.mapIndex / 50))
                  + (coinsForCharonBonus
                    + (americanTipperBonus
                      + (goldFoodBonus
                        + thirdVaultUpgradeBonus * lavaLog(account?.accountOptions?.[340])
                        + (5 * achievementBonus
                          + (10 * secondAchievementBonus
                            + (20 * thirdAchievementBonus
                              + (forthVaultUpgradeBonus
                                + (fifthVaultUpgradeBonus
                                  * boredBeansKills
                                  + sixthVaultUpgradeBonus
                                  * poopKills))))))))))))))) / 100);

  const breakdown = [
    { title: 'Multiplicative' },
    { name: '' },
    {
      name: 'Achievements',
      value: (5 * achievementBonus) + (10 * secondAchievementBonus) + (20 * thirdAchievementBonus)
    },
    { name: 'Arcade', value: arcadeBonus + secondArcadeBonus },
    { name: 'Artifact', value: artifactBonus },
    { name: 'Bubbles', value: bubbles },
    { name: 'Bundle', value: 250 * hasCashBundle },
    { name: 'Cards', value: equippedCardBonus + passiveCardBonus },
    { name: 'Charm', value: charmBonus },
    { name: 'Companion', value: companionBonus },
    { name: 'Crop Depot', value: account?.farming?.cropDepot?.cash?.value },
    { name: 'Divinity', value: divinityMinorBonus },
    { name: 'Dungeons', value: flurboBonus },
    { name: 'Drop Rate', value: dropRateMulti },
    { name: 'Dust Walker', value: Math.max(1, dustWalker) * lavaLog(account?.accountOptions[362]) },
    {
      name: 'Equipment',
      value: equipmentBonusMoney + obolsBonusMoney + cashFromEquipment + cashFromObols + cashFromTools + bonusMoneyTools
    },
    { name: 'Event shop', value: 0.5 * eventBonus },
    { name: 'Event shop2', value: 0.6 * eventBonus2 },
    { name: 'Food', value: goldFoodBonus }, // Assuming you meant to alphabetize under "Golden Food"
    { name: 'Golden Food', value: goldFoodBonus },
    { name: 'Gold set', value: armorSetBonus },
    { name: 'Guild', value: guildBonus * (1 + Math.floor(character?.mapIndex / 50)) },
    { name: 'Kangaroo', value: kangarooBonus },
    { name: 'Lab', value: labBonus },
    { name: 'Meal', value: mealBonus },
    { name: 'Obols', value: cashFromObols },
    { name: 'Pet Arena', value: 100 * (.5 * arenaBonusUnlock + secondArenaBonusUnlock) },
    { name: 'Post Office', value: postOfficeBonus },
    { name: 'Prayers', value: prayerBonus },
    { name: 'Star talent', value: starTalent + americanTipperBonus },
    { name: 'Statues', value: statueBonus },
    { name: 'Talents', value: coinsForCharonBonus + talentBonus },
    { name: 'Vault Bored Beans', value: fifthVaultUpgradeBonus * boredBeansKills },
    { name: 'Vault Bubble', value: secondVaultUpgradeBonus * account?.alchemy?.totalBubbleLevelsTill100 },
    { name: 'Vault Ores', value: thirdVaultUpgradeBonus * lavaLog(account?.accountOptions?.[340]) },
    { name: 'Vault Poop', value: sixthVaultUpgradeBonus * poopKills },
    { name: 'Vault Recipe', value: firstVaultUpgradeBonus * account?.unlockedRecipes },
    { name: 'Vault Tax', value: forthVaultUpgradeBonus },
    { name: 'Vials', value: vialBonus },
    { name: 'Vote', value: voteBonus }
  ];

  return {
    cashMulti,
    breakdown,
    expression: `(1 + (
    cashStrBubble * Math.floor(strength / 250) +
    cashAgiBubble * Math.floor(agility / 250) +
    cashWisBubble * Math.floor(wisdom / 250)
) / 100)
* (1 + Math.min(4, companionBonus))
* (1 + 0.5 * eventBonus)
* (1 + 0.6 * eventBonus2)
* (1 + (obolsBonusMoney + equipmentBonusMoney + bonusMoneyTools) / 100)
* (1 + armorSetBonus / 100)
* (1 + gambitBonus / 100)
* (1 + (250 * hasCashBundle) / 100)
* (1 + (Math.max(1, dustWalker) * lavaLog(account?.accountOptions[362])) / 100)
* (1 + (mealBonus
    mealBonus +
    artifactBonus +
    kangarooBonus +
    voteBonus
) / 100)
* (1 + (0.5 * arenaBonusUnlock + secondArenaBonusUnlock + statueBonus / 100))
* (1 + (
    labBonus +
    recipeForProfitVaultBonus * account?.unlockedRecipes +
    bubbleMoneyVaultBonus * account?.alchemy?.totalBubbleLevelsTill100
) / 100)
* (1 + charmBonus / 100)
* (1 + prayerBonus / 100)
* (1 + (divinityMinorBonus + account?.farming?.cropDepot?.cash?.value) / 100)
* (1 + (
    starTalent +
    vialBonus +
    cashFromEquipment +
    cashFromObols +
    equippedCardBonus +
    passiveCardBonus +
    talentBonus +
    flurboBonus +
    arcadeBonus +
    secondArcadeBonus +
    postOfficeBonus +
    guildBonus * (1 + Math.floor(character?.mapIndex / 50)) +
    coinsForCharonBonus +
    americanTipperBonus +
    goldFoodBonus +
    miningPaydayVaultBonus * lavaLog(oresMined) +
    5 * achievementBonus +
    10 * secondAchievementBonus +
    20 * thirdAchievementBonus +
    monsterTaxVaultBonus +
    boredToDeathVaultBonus * boredBeansKills +
    sixthVaultUpgradeBonus * poopKills
) / 100)`
  }
}
const getPrinterSampleRate = (character, account, charactersLevels) => {
  const printerSamplingTalent = getTalentBonus(character?.flatStarTalents, 'PRINTER_SAMPLING');
  const saltLickBonus = getSaltLickBonus(account?.saltLick, 0);
  const equipSampling = getStatsFromGear(character, 60, account);
  const sampleItBubble = getBubbleBonus(account, 'SAMPLE_IT', false);
  const superSampleTalent = getTalentBonus(character?.flatStarTalents, 'SUPER_SAMPLES');
  const sampleAchievement = getAchievementStatus(account?.achievements, 158);
  const vialBonus = getVialsBonusByEffect(account?.alchemy?.vials, 'Printer_sample');
  const theRoyalSamplerPrayer = getPrayerBonusAndCurse(character?.activePrayers, 'The_Royal_Sampler', account)?.bonus;
  const stampBonus = getStampsBonusByEffect(account, '3D_Printer_Sampling_Size');
  const meritBonus = account?.tasks?.[2]?.[2]?.[4];
  const highestLevelMaestro = getHighestLevelOfClass(charactersLevels, CLASSES.Voidwalker);
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
    'Efaunt\'s_Tomb', 'Eycicles\'s_Nest', 'Enclave_a_la_Troll',
    'Chizoar\'s_Cavern', 'KattleKruk\'s_Volcano', 'Castle_Interior', 'Emperor\'s_Castle'].toSimpleObject();
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
      done: thresholds?.map((threshold) => kills >= threshold)
    }
  }).filter(({
               mapName,
               afkType
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
  const crystallinStampBonus = getStampBonus(account, 'misc', 'StampC3', character);
  const poopCard = character?.cards?.equippedCards?.find(({ cardIndex }) => cardIndex === 'A10');
  const poopCardBonus = poopCard ? calcCardBonus(poopCard) : 0;
  const demonGenie = character?.cards?.equippedCards?.find(({ cardIndex }) => cardIndex === 'G4');
  const demonGenieBonus = demonGenie ? calcCardBonus(demonGenie) : 0;
  const crystals4DaysBonus = getTalentBonus(character?.flatStarTalents, 'CRYSTALS_4_DAYYS');
  const cmonOutCrystalsBonus = getTalentBonus(character?.flatTalents, 'CMON_OUT_CRYSTALS');
  const nonPredatoryBoxBonus = getPostOfficeBonus(character?.postOffice, 'Non_Predatory_Loot_Box', 2);
  const breakdown = [
    { name: 'Cmon Out Crystals', value: cmonOutCrystalsBonus },
    { name: 'Crystal Shrine Crescent', value: crystalShrineBonus },
    { name: 'Post Office', value: nonPredatoryBoxBonus },
    { name: 'Crystals 4 Days', value: crystals4DaysBonus },
    { name: 'Crystallin Stamp', value: crystallinStampBonus },
    { name: 'Poop Card', value: poopCardBonus },
    { name: 'Demon Genie Card', value: demonGenieBonus }
  ]
  breakdown.sort((a, b) => a?.name.localeCompare(b?.name, 'en'))
  return {
    breakdown,
    value: 0.0005 * (1 + cmonOutCrystalsBonus / 100) * (1 + (nonPredatoryBoxBonus + crystalShrineBonus) / 100) * (1 + crystals4DaysBonus / 100)
      * (1 + crystallinStampBonus / 100) * (1 + (poopCardBonus + demonGenieBonus) / 100),
    expression: `0.0005
 * (1 + cmonOutCrystalsBonus / 100)
 * (1 + (nonPredatoryBoxBonus + crystalShrineBonus) / 100)
 * (1 + crystals4DaysBonus / 100)
 * (1 + crystallinStampBonus / 100)
 * (1 + (poopCardBonus + demonGenieBonus) / 100)`
  }
}
export const getPlayerFoodBonus = (character, account, isHealth) => {
  const postOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Carepack_From_Mum', 2)
  const statuePower = getStatueBonus(account, 3, character?.flatTalents);
  const equipmentFoodEffectBonus = getStatsFromGear(character, 9, account);
  const stampBonus = getStampsBonusByEffect(account, 'Effect_from_Boost_Food', character)
  const starSignBonus = getStarSignBonus(character, account, 'All_Food_Effect');
  const cardBonus = getEquippedCardBonus(character?.cards, 'Y5');
  const cardSet = character?.cards?.cardSet?.rawName === 'CardSet1' ? character?.cards?.cardSet?.bonus : 0;
  const talentBonus = getTalentBonus(character?.flatStarTalents, 'FROTHY_MALK');

  if (isHealth) {
    const goldenHealthFood = 1;
    const secondPostOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Carepack_From_Mum', 1);
    const stampBonus = getStampsBonusByEffect(account, 'Boost_Health_Effect', character)
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
  const featherWeight = getTalentBonus(character?.flatTalents, 'FEATHERWEIGHT');
  const featherFlight = getTalentBonus(character?.flatTalents, 'FEATHER_FLIGHT');
  const stampBonus = getStampsBonusByEffect(account, 'Movement_Speed', character)
  const strafe = getTalentBonusIfActive(character?.activeBuffs, 'STRAFE');
  const foodBonus = getFoodBonus(character, account, 'MoveSpdBoosts')
  let baseMath = foodBonus + featherWeight + stampBonus + strafe;
  let agiMulti;
  if (character.stats?.agility < 1000) {
    agiMulti = (Math.pow(character.stats?.agility + 1, .4) - 1) / 40;
  }
  else {
    agiMulti = (character.stats?.agility - 1e3) / (character.stats?.agility + 2500) * .5 + .371;
  }
  const statuePower = getStatueBonus(account, 1, character?.flatTalents);
  // const speedFromStatue = 1 + (speedBonusFromPotions + (statuePower) / 2.2);
  const speedStarSign = getStarSignBonus(character, account, 'Movement_Speed');
  const equipmentSpeedEffectBonus = getStatsFromGear(character, 1, account);
  const cardBonus = getCardBonusByEffect(character?.cards?.equippedCards, 'Move_Spd');
  finalSpeed = (baseMath + (statuePower + ((speedStarSign) + (equipmentSpeedEffectBonus + (cardBonus + featherFlight))))) / 100; // 1.708730398284699
  finalSpeed = 1 + (finalSpeed + (agiMulti) / 2.2); // 2.829035843985983
  const tipToeQuickness = getTalentBonus(character?.flatStarTalents, 'TIPTOE_QUICKNESS');
  if (finalSpeed > 2) {
    finalSpeed = Math.floor(100 * finalSpeed) / 100;
  }
  else if (finalSpeed > 1.75) {
    finalSpeed = Math.min(2, Math.floor(100 * ((finalSpeed) + tipToeQuickness / 100)) / 100)
  }
  else {
    const saltLickBonus = getSaltLickBonus(account?.saltLick, 7);
    const groundedMotherboard = account?.lab?.playersChips?.[character?.playerId]?.find((chip) => chip.index === 15)?.baseVal ?? 0;
    const sigilBonus = getSigilBonus(account?.alchemy?.p2w?.sigils, 'TUFT_OF_HAIR');
    finalSpeed = Math.min(1.75, Math.floor(100 * (finalSpeed + (saltLickBonus + groundedMotherboard + (tipToeQuickness + sigilBonus)) / 100)) / 100)
  }
  return Math.round(finalSpeed * 100);
}
export const getAfkGain = (character, characters, account) => {
  let breakdown = [], gains = 0;
  const { afkType } = character;
  const { guild, bribes, shrines, charactersLevels, tasks } = account;
  const afkGainsTaskBonus = tasks?.[2]?.[1]?.[2] > character?.playerId ? 2 : 0;
  const highestLevelBM = getHighestLevelOf(characters, CLASSES.Beast_Master)
  const familyBonus = getFamilyBonusBonus(classFamilyBonuses, 'ALL_SKILL_AFK_GAINS', highestLevelBM);
  const cardBonus = getCardBonusByEffect(character?.cards?.equippedCards, 'Skill_AFK_gain_rate');
  let guildBonus = 0;
  if (guild?.guildBonuses?.length > 0) {
    guildBonus = getGuildBonusBonus(guild?.guildBonuses, 7);
  }
  const cardSetBonus = character?.cards?.cardSet?.rawName === 'CardSet5' ? character?.cards?.cardSet?.bonus : 0;
  const voidWalkerEnhancementEclipse = getHighestTalentByClass(characters, CLASSES.Voidwalker, 'ENHANCEMENT_ECLIPSE');
  const enhancementBonus = getVoidWalkerTalentEnhancements(characters, account, voidWalkerEnhancementEclipse, 79);
  const sleepinOnTheJob = enhancementBonus ? getTalentBonus(character?.flatTalents, 'SLEEPIN\'_ON_THE_JOB') : 0;
  const sigilBonus = getSigilBonus(account?.alchemy?.p2w?.sigils, 'DREAM_CATCHER');
  const chipBonus = getPlayerLabChipBonus(character, account, 8);
  const afkEquipmentBonus = getStatsFromGear(character, 59, account);
  const afkObolsBonus = getObolsBonus(character?.obols, bonuses?.etcBonuses?.[59])
  const skillAfkEquipmentBonus = getStatsFromGear(character, 24, account);
  const skillAfkObolsBonus = getObolsBonus(character?.obols, bonuses?.etcBonuses?.[24])
  const prayerBonus = getPrayerBonusAndCurse(character?.activePrayers, 'Zerg_Rushogen', account)?.bonus;
  const prayerCurse = getPrayerBonusAndCurse(character?.activePrayers, 'Ruck_Sack', account)?.curse;
  const eventBonus = getEventShopBonus(account, 5);

  const baseAfkGains = afkGainsTaskBonus +
    (familyBonus +
      (2 + cardBonus) + (guildBonus
        + cardSetBonus + (sleepinOnTheJob +
          (sigilBonus + chipBonus)
          + ((skillAfkEquipmentBonus + skillAfkObolsBonus) + (afkEquipmentBonus + afkObolsBonus) + (prayerBonus - prayerCurse)))));
  const arcadeBonus = getArcadeBonus(account?.arcade?.shop, 'AFK_Gains_Rate')?.bonus;
  const flurboBonus = getDungeonFlurboStatBonus(account?.dungeons?.upgrades, 'AFK_Gains');
  const majorBonus = isCompanionBonusActive(account, 0) || character?.linkedDeity === 0 || character?.secondLinkedDeityIndex === 0
    ? 1
    : 0;
  const divinityMinorBonus = characters?.reduce((sum, char) => {
    if (isCompanionBonusActive(account, 0)) {
      return sum + getMinorDivinityBonus(char, account, 4, characters);
    }
    if (char?.linkedDeity === 4) {
      return char?.deityMinorBonus > sum ? char?.deityMinorBonus : sum;
    }
    else if (char?.secondLinkedDeityIndex === 4) {
      return char?.secondDeityMinorBonus > sum ? char?.secondDeityMinorBonus : sum;
    }
    return sum;
  }, 0);
  const compBonus = isCompanionBonusActive(account, 6) && 5;
  const randomItemsFound = getRandomEventItems(account)
  const randoEventLooty = getTalentBonus(character?.flatStarTalents, 'RANDO_EVENT_LOOTY');
  // const summoningBonus = getWinnerBonus(account, '+{% AFK Gains');

  const additionalAfkGains =
    +(arcadeBonus
      + (flurboBonus
        + (30 * majorBonus
          + (divinityMinorBonus
            + (compBonus
              + randoEventLooty * randomItemsFound)))));
  const actualBaseAfkGains = baseAfkGains + additionalAfkGains;
  breakdown = [
    { title: 'Base' },
    { name: '' },
    { name: 'Tasks', value: afkGainsTaskBonus },
    { name: 'Family', value: familyBonus },
    { name: 'Cards', value: cardBonus },
    { name: 'Guild', value: guildBonus },
    { name: 'Card Set', value: cardSetBonus },
    { name: 'Sleepin On The Job (VW Eclipse)', value: sleepinOnTheJob },
    { name: 'Sigil', value: sigilBonus },
    { name: 'Chips', value: chipBonus },
    { name: 'Equipment', value: afkEquipmentBonus + skillAfkEquipmentBonus },
    { name: 'Obols', value: afkObolsBonus + skillAfkObolsBonus },
    { name: 'Prayers', value: prayerBonus - prayerCurse },
    { name: 'Arcade', value: arcadeBonus },
    { name: 'Dungeons', value: flurboBonus },
    { name: 'Divinity Major', value: majorBonus * 30 },
    { name: 'Divinity Minor', value: divinityMinorBonus },
    { name: 'Companion', value: compBonus },
    { name: 'Rando Event Looty', value: randoEventLooty * randomItemsFound },
    // { name: 'Event bonus', value: 20 * eventBonus },
    { name: '' }
  ]
  const bribeAfkGains = bribes?.[24]?.done ? bribes?.[24]?.value : 0;
  const shrineAfkGains = getShrineBonus(shrines, 8, character?.mapIndex, account.cards, account?.sailing?.artifacts);
  const tickTockTalentBonus = getTalentBonus(character?.flatStarTalents, 'TICK_TOCK');
  const idleSkillingBonus = getTalentBonus(character?.flatTalents, 'IDLE_SKILLING');
  const activeAfkerBonus = getTalentBonus(character?.flatTalents, 'ACTIVE_AFK\'ER');
  const catchingSomeZzzBonus = getTalentBonus(character?.flatTalents, 'CATCHING_SOME_ZZZ\'S');
  const trappingBonus = getTrappingStuff('TrapMGbonus', 8, account)
  const starSignBonus = getStarSignBonus(character, account, 'Skill_AFK_Gain');

  // Fighting AFK Gains
  if (afkType === 'FIGHTING') {
    const highestVoidwalker = getHighestLevelOfClass(charactersLevels, CLASSES.Voidwalker);
    const familyEffBonus = getFamilyBonusBonus(classFamilyBonuses, 'FIGHTING_AFK_GAINS', highestVoidwalker);
    const postOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Civil_War_Memory_Box', 1);
    const firstTalentBonus = getTalentBonus(character?.flatTalents, 'IDLE_BRAWLING');
    const secondTalentBonus = getTalentBonus(character?.flatTalents, 'IDLE_CASTING');
    const thirdTalentBonus = getTalentBonus(character?.flatTalents, 'IDLE_SHOOTING');
    const fourthTalentBonus = getTalentBonus(character?.flatTalents, 'SLEEPIN\'_ON_THE_JOB');
    const bribeBonus = bribes?.[3]?.done ? bribes?.[3]?.value : 0;
    const cardSetBonus = character?.cards?.cardSet?.rawName === 'CardSet8' ? character?.cards?.cardSet?.bonus : 0;
    const equippedCardBonus = getCardBonusByEffect(character?.cards?.equippedCards, cardBonuses[43]);
    const fightEquipmentBonus = getStatsFromGear(character, 20, account);
    const fightObolsBonus = getObolsBonus(character?.obols, bonuses?.etcBonuses?.[20])

    const starSignBonus = getStarSignBonus(character, account, 'Fight_AFK_Gain');
    let guildBonus = 0;
    if (guild?.guildBonuses?.length > 0) {
      guildBonus = getGuildBonusBonus(guild?.guildBonuses, 4);
    }
    const chipBonus = account?.lab?.playersChips?.[character?.playerId]?.find((chip) => chip.index === 7)?.baseVal ?? 0;
    gains = 0.2 + (familyEffBonus + postOfficeBonus
      + firstTalentBonus + bribeBonus + (thirdTalentBonus + cardSetBonus
        + (secondTalentBonus + (tickTockTalentBonus + ((afkGainsTaskBonus + additionalAfkGains)
          + (equippedCardBonus + (fourthTalentBonus + ((fightEquipmentBonus + fightObolsBonus) + (afkEquipmentBonus + afkObolsBonus)
            + (starSignBonus + (guildBonus + (prayerBonus - prayerCurse + chipBonus))))))))))) / 100;

    breakdown = [
      ...breakdown,
      { title: 'Fighting' },
      { name: '' },
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
      { name: 'Starsign', value: starSignBonus }
    ]
  }
  else if (afkType === 'COOKING') {
    const secondTalentBonus = getTalentBonus(character?.flatTalents, 'WAITING_TO_COOL')
    gains = 0.25
      + (idleSkillingBonus
        + tickTockTalentBonus
        + (actualBaseAfkGains
          + (trappingBonus
            + (starSignBonus
              + (bribeAfkGains + secondTalentBonus))))) / 100;
    breakdown = [
      ...breakdown,
      { title: 'Cooking' },
      { name: '' },
      { name: 'Talents', value: idleSkillingBonus + secondTalentBonus + tickTockTalentBonus },
      { name: 'Starsign', value: starSignBonus },
      { name: 'Trapping Bonus', value: trappingBonus },
      { name: 'Bribe', value: bribeAfkGains }
    ]
  }
  else if (afkType === 'MINING') {
    const dwarvenSupliesBonus = getPostOfficeBonus(character?.postOffice, 'Dwarven_Supplies', 2);
    const miningCardsArePassives = isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.mining?.rank, 2);
    const cardBonus = miningCardsArePassives
      ? getCardBonusByEffect(account?.cards, 'Mining_Away_Gains')
      : getCardBonusByEffect(character?.cards?.equippedCards, 'Mining_Away_Gains')

    const mainStat = mainStatMap?.[character?.class];
    const bubbleBonus = getBubbleBonus(account, 'DREAM_OF_IRONFISH', false, mainStat === 'strength');
    gains = 0.25 + (idleSkillingBonus
      + (dwarvenSupliesBonus
        + (trappingBonus
          + tickTockTalentBonus
          + (actualBaseAfkGains
            + (cardBonus
              + (starSignBonus
                + (bribeAfkGains
                  + bubbleBonus))))))) / 100;

    breakdown = [
      ...breakdown,
      { title: 'Mining' },
      { name: '' },
      { name: 'Talents', value: idleSkillingBonus + tickTockTalentBonus },
      { name: 'Starsign', value: starSignBonus },
      { name: 'Trapping Bonus', value: trappingBonus },
      { name: 'Bribe', value: bribeAfkGains },
      { name: 'Card', value: cardBonus },
      { name: 'Post Office', value: dwarvenSupliesBonus },
      { name: 'Bubble', value: bubbleBonus }
    ]
  }
  else if (afkType === 'CHOPPIN') {
    const tapedUpTimberBonus = getPostOfficeBonus(character?.postOffice, 'Taped_Up_Timber', 2);
    const choppingCardsArePassives = isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.chopping?.rank, 2);
    const cardBonus = choppingCardsArePassives
      ? getCardBonusByEffect(account?.cards, cardBonuses[36])
      : getCardBonusByEffect(character?.cards?.equippedCards, cardBonuses[36]);

    const mainStat = mainStatMap?.[character?.class];
    const bubbleBonus = getBubbleBonus(account, 'TREE_SLEEPER', false, mainStat === 'wisdom');

    gains = 0.25 + (activeAfkerBonus
      + (tapedUpTimberBonus
        + (trappingBonus
          + tickTockTalentBonus
          + (actualBaseAfkGains
            + (cardBonus
              + (starSignBonus
                + (bribeAfkGains
                  + bubbleBonus))))))) / 100;

    breakdown = [
      ...breakdown,
      { title: 'Choppin' },
      { name: '' },
      { name: 'Talents', value: activeAfkerBonus + tickTockTalentBonus },
      { name: 'Starsign', value: starSignBonus },
      { name: 'Trapping Bonus', value: trappingBonus },
      { name: 'Bribe', value: bribeAfkGains },
      { name: 'Card', value: cardBonus },
      { name: 'Post Office', value: tapedUpTimberBonus },
      { name: 'Bubble', value: bubbleBonus }
    ]
  }
  else if (afkType === 'FISHING') {
    const sealedFishheadsBonus = getPostOfficeBonus(character?.postOffice, 'Sealed_Fishheads', 2);
    const fishingCardsArePassives = isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.fishing?.rank, 2);
    const cardBonus = fishingCardsArePassives
      ? getCardBonusByEffect(account?.cards, cardBonuses[39])
      : getCardBonusByEffect(character?.cards?.equippedCards, cardBonuses[39]);
    const mainStat = mainStatMap?.[character?.class];
    const bubbleBonus = getBubbleBonus(account, 'DREAM_OF_IRONFISH', false, mainStat === 'strength');
    const equipmentBonus = getStatsFromGear(character, 64, account);
    const toolsBonus = getStatsFromGear(character, 64, account, true);
    const obolsBonus = getObolsBonus(character?.obols, bonuses?.etcBonuses?.[64]);

    gains = 0.25 +
      (idleSkillingBonus
        + (catchingSomeZzzBonus
          + (trappingBonus
            + sealedFishheadsBonus
            + (tickTockTalentBonus
              + (actualBaseAfkGains
                + (cardBonus
                  + (starSignBonus
                    + (bribeAfkGains
                      + (bubbleBonus
                        + (equipmentBonus + obolsBonus + toolsBonus)))))))))) / 100;

    breakdown = [
      ...breakdown,
      { title: 'Fishing' },
      { name: '' },
      { name: 'Talents', value: idleSkillingBonus + catchingSomeZzzBonus + tickTockTalentBonus },
      { name: 'Starsign', value: starSignBonus },
      { name: 'Trapping Bonus', value: trappingBonus },
      { name: 'Bribe', value: bribeAfkGains },
      { name: 'Card', value: cardBonus },
      { name: 'Post Office', value: sealedFishheadsBonus },
      { name: 'Bubble', value: bubbleBonus },
      { name: 'Equipment', value: equipmentBonus },
      { name: 'Obols', value: obolsBonus },
      { name: 'Tools', value: toolsBonus }
    ]
  }
  else if (afkType === 'CATCHING') {
    const bugHuntingSuppliesBonus = getPostOfficeBonus(character?.postOffice, 'Bug_Hunting_Supplies', 2);
    const sunsetOnTheHivesBonus = getTalentBonus(character?.flatTalents, 'SUNSET_ON_THE_HIVES');
    const catchingCardsArePassives = isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.catching?.rank, 2);
    const cardBonus = catchingCardsArePassives
      ? getCardBonusByEffect(account?.cards, cardBonuses[41])
      : getCardBonusByEffect(character?.cards?.equippedCards, cardBonuses[41]);
    const mainStat = mainStatMap?.[character?.class];
    const bubbleBonus = getBubbleBonus(account, 'FLY_IN_MIND', false, mainStat === 'agility');
    gains = 0.25
      + (sunsetOnTheHivesBonus
        + (trappingBonus
          + bugHuntingSuppliesBonus
          + (tickTockTalentBonus
            + (actualBaseAfkGains
              + (cardBonus
                + (starSignBonus
                  + (bribeAfkGains
                    + bubbleBonus))))))) / 100

    breakdown = [
      ...breakdown,
      { title: 'Catching' },
      { name: '' },
      { name: 'Talents', value: sunsetOnTheHivesBonus + tickTockTalentBonus },
      { name: 'Starsign', value: starSignBonus },
      { name: 'Trapping Bonus', value: trappingBonus },
      { name: 'Bribe', value: bribeAfkGains },
      { name: 'Card', value: cardBonus },
      { name: 'Post Office', value: bugHuntingSuppliesBonus },
      { name: 'Bubble', value: bubbleBonus }
    ]
  }
  else if (afkType === 'LABORATORY') {
    gains = 0.25
      + (tickTockTalentBonus
        + (actualBaseAfkGains
          + (trappingBonus
            + (starSignBonus
              + bribeAfkGains)))) / 100;

    breakdown = [
      ...breakdown,
      { title: 'Laboratory' },
      { name: '' },
      { name: 'Talents', value: tickTockTalentBonus },
      { name: 'Starsign', value: starSignBonus },
      { name: 'Trapping Bonus', value: trappingBonus },
      { name: 'Bribe', value: bribeAfkGains }
    ]
  }

  let math = gains;
  if (gains < 1.5) {
    math = Math.min(1.5, gains + shrineAfkGains / 100);
  }
  breakdown = [
    ...breakdown,
    { name: 'Shrine (< 150)', value: gains < 1.5 ? shrineAfkGains : 0 }
  ]
  const final = Math.max(.01, math);
  return {
    afkGains: final,
    breakdown
  };
}
const getTrappingStuff = (type, index, account) => {
  if (type === 'TrapMGbonus') {
    const value = account?.accountOptions?.[99];
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
  const { starSigns, cards, postOffice, talents, flatTalents, equippedBubbles } = character;
  const { lab } = account;
  const spelunkerObolMulti = getLabBonus(lab?.labBonuses, 8); // gem multi
  const nonConsumeJewelBonus = getJewelBonus(lab?.jewels, 8, spelunkerObolMulti);
  const baseMath = 90 + 5 * nonConsumeJewelBonus;
  const biteButNotChewBubbleBonus = getActiveBubbleBonus(equippedBubbles, 'BITE_BUT_NOT_CHEW', account);
  const bubbleMath = Math.min(baseMath, 98 + Math.min(biteButNotChewBubbleBonus, 1));
  const jewelMath = Math.max(1, nonConsumeJewelBonus);
  const freeMealBonus = getTalentBonus(flatTalents, 'FREE_MEAL');
  const carePackFromMumBonus = getPostOfficeBonus(postOffice, 'Carepack_From_Mum', 0);
  const crabCakeBonus = getEquippedCardBonus(cards?.equippedCards, 'B3');
  const starSingBonus = getStarSignByEffect(starSigns, account, 'chance_to_not');
  return Math.min(bubbleMath, jewelMath * (freeMealBonus + (carePackFromMumBonus + (crabCakeBonus + starSingBonus + biteButNotChewBubbleBonus))))
}
export const getPlayerConstructionSpeed = (character, account) => {
  const constructionLevel = character?.skillsInfo?.construction?.level;
  const baseMath = 3 * Math.pow((constructionLevel) / 2 + 0.7, 1.6);
  const mainStat = mainStatMap?.[character?.class];
  const bubbleBonus = getBubbleBonus(account, 'CARPENTER', false, mainStat === 'strength');
  const stampsBonus = getStampsBonusByEffect(account, 'Building_Speed', character);
  const postOffice = getPostOfficeBoxLevel(character?.postOffice, 'Construction_Container');
  const guildBonus = getGuildBonusBonus(account?.guild?.guildBonuses, 5);
  const equipmentConstructionEffectBonus = getStatsFromGear(character, 30, account);
  const obolsBonus = getObolsBonus(character?.obols, bonuses?.etcBonuses?.[30]);
  const constructionAchievement = getAchievementStatus(account?.achievements, 153);
  const constructMastery = getConstructMastery(account?.towers?.totalLevels, 'Build Spd');
  const vialBonus = getVialsBonusByEffect(account?.alchemy?.vials, null, 'Contspd');
  const moreMath = 1 + (stampsBonus + 0.25 * postOffice + (guildBonus + (equipmentConstructionEffectBonus + obolsBonus) + Math.min(5, 5 * constructionAchievement) + constructMastery + vialBonus)) / 100;
  const talentBonus = getTalentBonus(character?.flatTalents, 'REDOX_RATES', false, true);
  const atomBonus = getAtomBonus(account, 'Helium_-_Talent_Power_Stacker');
  const redSaltAmount = calculateItemTotalAmount([...account?.storage?.list,
    ...(account?.refinery?.refineryStorage || [])], 'Refinery1', true, true);
  return Math.floor(baseMath * (1 + (constructionLevel * bubbleBonus) / 100) * moreMath * (1 + (talentBonus * (atomBonus + lavaLog(redSaltAmount))) / 100));
}
export const getPlayerConstructionExpPerHour = (character, account) => {
  const playerBuildSpeed = character?.constructionSpeed;
  const activeBubbleBonus = getActiveBubbleBonus(character.equippedBubbles, 'CALL_ME_BOB', account);
  const talentBonus = getTalentBonus(character?.flatTalents, 'SHARPER_SAWS');
  const secondTalentBonus = getTalentBonus(character?.flatTalents, 'TEMPESTUOUS_EMOTIONS');
  const vialBonus = getVialsBonusByEffect(account?.alchemy?.vials, null, 'ConsExp');
  const statueBonus = getStatueBonus(account, 18, character?.flatTalents);
  const stampBonus = getStampsBonusByEffect(account, '+{%_Construction_Exp_Gain', character);
  const starSignBonus = getStarSignBonus(character, account, 'Construct_Exp');
  const postOfficeBonus = getPostOfficeBoxLevel(character?.postOffice, 'Construction_Container');
  return Math.ceil((Math.pow(playerBuildSpeed, 0.7) / 2 + (2 + 6 * character?.skillsInfo?.construction?.level))
    * (1 + (activeBubbleBonus + (talentBonus + secondTalentBonus + (vialBonus + (statueBonus + (stampBonus + (starSignBonus + Math.max(0, 0.5 *
      ((postOfficeBonus) - 100)))))))) / 100));
}