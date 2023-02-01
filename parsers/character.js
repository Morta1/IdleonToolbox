import {
  bonuses,
  carryBags,
  classes,
  classFamilyBonuses,
  deathNote,
  divStyles,
  gods,
  invBags,
  items,
  mapEnemies,
  mapNames,
  mapPortals,
  monsters,
  randomList,
  starSignByIndexMap
} from "../data/website-data";
import { calculateAfkTime, getHighestLevelOfClass, getMaterialCapacity } from "./misc";
import { calculateItemTotalAmount, createItemsWithUpgrades, getStatFromEquipment } from "./items";
import { getInventory } from "./storage";
import { skillIndexMap } from "./parseMaps";
import {
  applyTalentAddedLevels,
  createTalentPage,
  getActiveBuffs, getHighestTalentByClass,
  getTalentBonus,
  getTalentBonusIfActive,
  talentPagesMap
} from "./talents";
import { calcCardBonus, getEquippedCardBonus, getPlayerCards } from "./cards";
import { getStampBonus, getStampsBonusByEffect } from "./stamps";
import { getPlayerPostOffice, getPostOfficeBonus } from "./postoffice";
import { getActiveBubbleBonus, getBubbleBonus } from "./alchemy";
import { getStatueBonus } from "./statues";
import { getStarSignBonus, getStarSignByEffect } from "./starSigns";
import { getPlayerAnvil } from "./anvil";
import { getPrayerBonusAndCurse } from "./prayers";
import { getGuildBonusBonus } from "./guild";
import { getShrineBonus } from "./shrines";
import { getFamilyBonusBonus } from "./family";
import { getSaltLickBonus } from "./saltLick";
import { getDungeonStatBonus } from "./dungeons";
import { getMealsBonusByEffectOrStat } from "./cooking";
import { getObols, getObolsBonus, mergeCharacterAndAccountObols } from "./obols";
import { getPlayerWorship } from "./worship";
import { getPlayerQuests } from "./quests";
import { getJewelBonus, getLabBonus } from "./lab";
import { getAchievementStatus } from "./achievements";
import { lavaLog, notateNumber } from "../utility/helpers";

const { tryToParse, createIndexedArray, createArrayOfArrays } = require("../utility/helpers");

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
  character.classIndex = char?.CharacterClass;
  character.class = classes?.[char?.CharacterClass];
  character.afkTime = calculateAfkTime(char?.PlayerAwayTime, account?.timeAway?.GlobalTime);
  character.afkTarget = monsters?.[char?.AFKtarget]?.Name;
  const currentMapIndex = char?.CurrentMap;
  character.mapIndex = currentMapIndex;
  character.currentMap = mapNames?.[currentMapIndex];
  character.money = parseInt(char?.Money);
  character.cooldowns = char?.[`AttackCooldowns`];
  const statMap = { 0: 'strength', 1: 'agility', 2: 'wisdom', 3: 'luck', 4: 'level' };
  character.stats = char?.PersonalValuesMap?.StatList?.reduce((res, statValue, index) => {
    if (!statMap[index]) return res;
    return {
      ...res,
      [statMap[index]]: statValue
    }
  }, {});
  character.level = character.stats.level;
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
  const carryCapacityObject = char?.[`MaxCarryCap`];
  character.carryCapBags = Object.keys(carryCapacityObject).map((bagName) => (carryBags?.[bagName]?.[carryCapacityObject[bagName]])).filter(bag => bag);

  character.statues = char?.StatueLevels;

  // equipment indices (0 = armor, 1 = tools, 2 = food)
  const equipmentMapping = { 0: "armor", 1: "tools", 2: "food" };
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
  character.inventory = getInventory(inventoryArr, inventoryQuantityArr, character.name);

  // star signs
  const starSignsObject = char?.PersonalValuesMap?.StarSign;
  character.starSigns = starSignsObject
    .split(",")
    .map((starSign) => {
      if (!starSign || starSign === '_') return null;
      const silkrodeNanochipBonus = account?.lab?.playersChips?.[char?.playerId]?.find((chip) => chip.index === 15);
      const updatedBonuses = starSignByIndexMap?.[starSign]?.bonuses?.map((star) => {
        const extraBonus = (silkrodeNanochipBonus ? 2 : 1);
        return {
          ...star,
          chipBoost: extraBonus,
          bonus: star?.bonus * extraBonus,
          rawName: star?.rawName?.replace('{', star?.bonus * extraBonus)
        }
      });
      return { ...starSignByIndexMap?.[starSign], bonuses: updatedBonuses };
    })
    .filter(item => item);

  character.equippedBubbles = account?.equippedBubbles?.[char?.playerId];
  const levelsRaw = char?.[`Exp0`];
  const levelsReqRaw = char?.[`ExpReq0`];
  const skillsInfoObject = char?.[`Lv0`];

  character.skillsInfo = skillsInfoObject.reduce(
    (res, level, index) =>
      index < 16 ? {
        ...res,
        [skillIndexMap[index]?.name]: {
          level: level !== -1 ? level : 0,
          exp: parseFloat(levelsRaw[index]),
          expReq: parseFloat(levelsReqRaw[index]),
          icon: skillIndexMap[index]?.icon
        },
      } : res, {});

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
  } = createTalentPage(character?.class, ["Special Talent 1", "Special Talent 2",
    "Special Talent 3"], talentsObject, maxTalentsObject, true);
  character.starTalents = orderedStarTalents;
  character.flatStarTalents = flatStarTalents;

  const activeBuffs = char?.[`BuffsActive`];
  character.activeBuffs = getActiveBuffs(activeBuffs, [...flatTalents, ...flatStarTalents]);

  character.activePrayers = char?.Prayers?.filter((prayer) => prayer !== -1).map((prayerId) => account?.prayers?.[prayerId]);
  character.postOffice = getPlayerPostOffice(char?.PostOfficeInfo, account);
  character.cards = getPlayerCards(char, account);

  const omegaNanochipBonus = account?.lab?.playersChips?.[char?.playerId]?.find((chip) => chip.index === 20);
  const omegaMotherboardChipBonus = account?.lab?.playersChips?.[char?.playerId]?.find((chip) => chip.index === 21);
  character.cards.equippedCards = character?.cards?.equippedCards?.map((card, index) => ((index === 0 && omegaNanochipBonus) || (index === 7 && omegaMotherboardChipBonus)) ? ({
    ...card,
    chipBoost: 2
  }) : card);

  character.anvil = getPlayerAnvil(char, character, account, charactersLevels, idleonData);
  const charObols = getObols(char, false);
  character.obols = {
    ...charObols,
    stats: mergeCharacterAndAccountObols(charObols, account.obols)
  };
  character.worship = getPlayerWorship(character, pages, account, char?.PlayerStuff?.[0]);
  character.quests = getPlayerQuests(char?.QuestComplete);
  character.crystalSpawnChance = getPlayerCrystalChance(character, account, idleonData);
  // starSigns, cards, postOffice, talents, bubbles, jewels, labBonuses
  character.nonConsumeChance = getNonConsumeChance(character?.starSigns, character?.cards, character?.postOffice, character?.talents, account?.alchemy?.bubbles, account?.lab?.jewels, account?.lab?.labBonuses);
  character.constructionSpeed = getPlayerConstructionSpeed(character, account);

  const kills = char?.[`KillsLeft2Advance`];
  const isBarbarian = talentPagesMap[character.class].includes('Barbarian');
  const isBloodBerserker = talentPagesMap[character.class].includes('Blood_Berserker');
  character.kills = kills?.reduce((res, map, index) => [...res,
    parseFloat(mapPortals?.[index]?.[0]) - parseFloat(map?.[0])], []);
  character.nextPortal = {
    goal: mapPortals?.[currentMapIndex]?.[0] ?? 0,
    current: parseFloat(mapPortals?.[currentMapIndex]?.[0]) - parseFloat(kills?.[currentMapIndex]) ?? 0
  };
  if (isBarbarian) { // zow
    character.zow = getBarbarianZowChow(character.kills, 1e5);
  }
  if (isBloodBerserker) {
    character.chow = getBarbarianZowChow(character.kills, 1e6);
  }
  const bigPBubble = getActiveBubbleBonus(character.equippedBubbles, 'c21')
  const divinityLevel = character.skillsInfo?.divinity?.level;
  const linkedDeity = account?.divinity?.linkedDeities?.[character.playerId];
  if (linkedDeity !== -1) {
    const godIndex = gods?.[linkedDeity]?.godIndex;
    const multiplier = gods?.[godIndex]?.minorBonusMultiplier;
    character.deityMinorBonus = (divinityLevel / (60 + divinityLevel)) * Math.max(1, bigPBubble) * multiplier;
  }
  const divStyleIndex = account?.divinity?.linkedStyles?.[character?.playerId];
  character.divStyle = { ...divStyles?.[divStyleIndex], index: divStyleIndex };
  // if (linkedDeity === 2) {
  //   character.nobisectBlessing = calcNobisectBlessing(character, account, charactersLevels);
  // }
  character.isDivinityConnected = account?.divinity?.linkedDeities?.[character?.playerId] === 4;
  character.talents = applyTalentAddedLevels(talents, linkedDeity, character.deityMinorBonus);
  return character;
}

// const calcNobisectBlessing = (character, account, charactersLevels) => {
//   // account?.cooking?.meals, account?.lab?.playersChips, character?.cards, account?.guild?.guildBonuses
//   const { cooking, lab, guild, alchemy, divinity, cards: accountCards } = account;
//   const { cards: playerCards, stats } = character
//   const allEff = getAllEff(character, cooking?.meals, lab, accountCards, guild?.guildBonuses, charactersLevels);
//   console.log('allEff - 5.219746817679558', allEff)
//   const minEff = getBubbleBonus(alchemy?.bubbles, 'power', 'HEARTY_DIGGY', false);
//   console.log('minEff - 193.79715134472335', minEff)
//   const minEffVial = getVialsBonusByEffect(alchemy?.vials, 'Mining_Efficiency');
//   const minEffStamp = getStampsBonusByEffect(account?.stamps, 'Mining_Efficiency');
//   // 189.54575009335448
//   const chopEff = getBubbleBonus(alchemy?.bubbles, 'power', 'HOCUS_CHOPPUS', false);
//   console.log('chopEff - 418.5292587293732', chopEff)
//   // 420.9397074334178
//   const base = Math.max(1, allEff + Math.pow((minEff + (chopEff)) / 100, 2) + Math.pow((stats.strength + (stats.agility + stats.wisdom)) / 3, 0.5) / 7);
//   console.log('base', base)
//   // 48.237034655800514
//   const baseBlessingMulti = divinity?.blessingBases?.[2];
//   const blessingMulti = gods?.[2]?.blessingMultiplier;
//   return baseBlessingMulti * blessingMulti * Math.min(1.8, Math.max(0.1, 4 * Math.pow(((base + 1e4) / Math.max(10 * (base) + 10, 1)) * 0.01, 2)));
//   // 8.32963478122674
// }

// const getPlayerHp = (character, account) => {
//
// }

export const getBarbarianZowChow = (allKills, threshold) => {
  let list = deathNote.map(({ rawName }) => {
    const mobIndex = mapEnemies?.[rawName];
    const { MonsterFace, Name } = monsters?.[rawName];
    const kills = allKills?.[mobIndex];
    return {
      name: Name,
      monsterFace: MonsterFace,
      done: kills >= threshold,
      kills,
      threshold
    }
  });
  const boopKills = allKills[38];
  list = [...list, {
    name: 'Boop',
    monsterFace: 33,
    done: boopKills >= threshold,
    kills: boopKills,
    threshold
  }];
  const finished = list?.reduce((sum, { done }) => sum + (done ? 1 : 0), 0);
  return {
    finished,
    list
  }
}

export const getPlayerCrystalChance = (character, account, idleonData) => {
  const sailingRaw = tryToParse(idleonData?.Sailing) || idleonData?.Sailing;
  const acquiredArtifacts = sailingRaw?.[3];
  const moaiiHead =  acquiredArtifacts?.[0] > 0;
  const crystalShrineBonus = getShrineBonus(account?.shrines, 6, character.mapIndex, account.cards, moaiiHead);
  const crystallinStampBonus = getStampBonus(account?.stamps, 'misc', 'StampC3', 0);
  const poopCard = character?.cards?.equippedCards?.find(({ cardIndex }) => cardIndex === 'A10');
  const poopCardBonus = poopCard ? calcCardBonus(poopCard) : 0;
  const demonGenie = character?.cards?.equippedCards?.find(({ cardIndex }) => cardIndex === 'G4');
  const demonGenieBonus = demonGenie ? calcCardBonus(demonGenie) : 0;
  const crystals4DaysBonus = getTalentBonus(character?.starTalents, null, 'CRYSTALS_4_DAYYS');
  const cmonOutCrystalsBonus = getTalentBonus(character?.talents, 1, 'CMON_OUT_CRYSTALS');
  const nonPredatoryBoxBonus = getPostOfficeBonus(character?.postOffice, 'Non_Predatory_Loot_Box', 2);
  const breakdown = {
    'Cmon Out Crystals': notateNumber(cmonOutCrystalsBonus),
    'Crystal Shrine Bonus': notateNumber(crystalShrineBonus),
    'Post Office': notateNumber(nonPredatoryBoxBonus),
    'Crystals 4 Days': notateNumber(crystals4DaysBonus),
    'Crystallin Stamp': notateNumber(crystallinStampBonus),
    'Poop Card': notateNumber(poopCardBonus),
    'Demon Genie Card': notateNumber(demonGenieBonus)
  }
  return {
    value: 0.0005 * (1 + cmonOutCrystalsBonus / 100) * (1 + (nonPredatoryBoxBonus + crystalShrineBonus) / 100) * (1 + crystals4DaysBonus / 100)
      * (1 + crystallinStampBonus / 100) * (1 + (poopCardBonus + demonGenieBonus) / 100),
    breakdown
  }
}

export const getPlayerFoodBonus = (character, statues, stamps) => {
  const postOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Carepack_From_Mum', 2)
  const statuePower = getStatueBonus(statues, 'StatueG4', character?.talents);
  const equipmentFoodEffectBonus = character?.equipment?.reduce((res, item) => res + getStatFromEquipment(item, bonuses?.etcBonuses?.[9]), 0);
  const stampBonus = getStampsBonusByEffect(stamps, 'Boost_Food_Effect', 0)
  const starSignBonus = getStarSignBonus(character?.starSigns, 'Mount_Eaterest', 'All_Food_Effect');
  const cardBonus = getEquippedCardBonus(character?.cards, 'Y5');
  const cardSet = character?.cards?.cardSet?.rawName === 'CardSet1' ? character?.cards?.cardSet?.bonus : 0;
  const talentBonus = getTalentBonus(character?.starTalents, null, 'FROTHY_MALK');
  return 1 + (postOfficeBonus + (statuePower +
    (equipmentFoodEffectBonus + (stampBonus + ((starSignBonus) +
      (cardBonus + (cardSet + talentBonus))))))) / 100;
}

export const getPlayerSpeedBonus = (speedBonusFromPotions, character, playerChips, statues, saltLicks, stamps) => {
  let finalSpeed;
  const featherWeight = getTalentBonus(character?.talents, 0, 'FEATHERWEIGHT');
  const featherFlight = getTalentBonus(character?.talents, 0, 'FEATHER_FLIGHT');
  const stampBonus = getStampsBonusByEffect(stamps, 'Base_Move_Speed', 0)
  const strafe = getTalentBonusIfActive(character?.activeBuffs, 'STRAFE');
  let baseMath = speedBonusFromPotions + featherWeight + stampBonus + strafe;
  let agiMulti;
  if (character.stats?.agility < 1000) {
    agiMulti = (Math.pow(character.stats?.agility + 1, .4) - 1) / 40;
  } else {
    agiMulti = (character.stats?.agility - 1e3) / (character.stats?.agility + 2500) * .5 + .371;
  }
  const statuePower = getStatueBonus(statues, 'StatueG2', character?.talents);
  // const speedFromStatue = 1 + (speedBonusFromPotions + (statuePower) / 2.2);
  const speedStarSign = getStarSignByEffect(character?.starSigns, 'Movement_Speed');
  const equipmentSpeedEffectBonus = character?.equipment?.reduce((res, item) => res + getStatFromEquipment(item, bonuses?.etcBonuses?.[1]), 0);
  const cardBonus = getEquippedCardBonus(character?.cards, 'A5');
  finalSpeed = (baseMath + (statuePower + ((speedStarSign) + (equipmentSpeedEffectBonus + (cardBonus + featherFlight))))) / 100; // 1.708730398284699
  finalSpeed = 1 + (finalSpeed + (agiMulti) / 2.2); // 2.829035843985983
  const tipToeQuickness = getTalentBonus(character?.starTalents, null, 'TIPTOE_QUICKNESS');
  if (finalSpeed > 2) {
    finalSpeed = Math.floor(100 * finalSpeed) / 100;
  } else if (finalSpeed > 1.75) {
    finalSpeed = Math.min(2, Math.floor(100 * ((finalSpeed) + tipToeQuickness / 100)) / 100)
  } else {
    const saltLickBonus = getSaltLickBonus(saltLicks, 7);
    const groundedMotherboard = playerChips?.find((chip) => chip.index === 15)?.baseVal ?? 0;
    finalSpeed = Math.min(1.75, Math.floor(100 * (finalSpeed + (saltLickBonus + groundedMotherboard + tipToeQuickness) / 100)) / 100)
  }
  // 2 < (finalSpeed) ? (s = b.engine.getGameAttribute("DummyNumbersStatManager"),
  return Math.round(finalSpeed * 100);
}

export const getAfkGain = (character, skillName, bribes, arcadeShop, dungeonUpgrades, playerChips, afkGainsTask, guildBonuses, optionsList, shrines) => {
  // const afkGainsTaskBonus = afkGainsTask < character?.playerId ? 2 : 0;
  if (skillName !== 'fighting') {
    let guildAfkGains = 0;
    const amarokBonus = getEquippedCardBonus(character?.cards, 'Z2');
    const bunnyBonus = getEquippedCardBonus(character?.cards, 'F7');
    if (guildBonuses.length > 0) {
      guildAfkGains = getGuildBonusBonus(guildBonuses, 7);
    }
    const cardSet = character?.cards?.cardSet?.rawName === 'CardSet7' ? character?.cards?.cardSet?.bonus : 0;
    const conductiveProcessor = playerChips.find((chip) => chip.index === 8)?.baseVal ?? 0;
    const equipmentAfkEffectBonus = character?.equipment?.reduce((res, item) => res + getStatFromEquipment(item, bonuses?.etcBonuses?.[24]), 0);
    const equipmentShrineEffectBonus = character?.equipment?.reduce((res, item) => res + getStatFromEquipment(item, bonuses?.etcBonuses?.[59]), 0);
    const zergRushogen = getPrayerBonusAndCurse(character?.prayers, 'Zerg_Rushogen')?.bonus;
    const ruckSack = getPrayerBonusAndCurse(character?.prayers, 'Ruck_Sack')?.curse;
    const nonFightingGains = 2 + (amarokBonus + bunnyBonus) + (guildAfkGains + cardSet +
      (conductiveProcessor + (equipmentAfkEffectBonus + equipmentShrineEffectBonus + (zergRushogen - ruckSack))));
    const dungeonAfkGains = getDungeonStatBonus(dungeonUpgrades, 'AFK_Gains');
    const arcadeAfkGains = arcadeShop?.[6]?.bonus ?? 0;
    const baseMath = (nonFightingGains) + (arcadeAfkGains + dungeonAfkGains);

    if ("cooking") {
      const tickTockBonus = getTalentBonus(character?.starTalents, null, 'TICK_TOCK');
      const trappingBonus = getTrappingStuff('TrapMGbonus', 8, optionsList)
      const starSignAfkGains = getStarSignByEffect(character?.starSigns, 'Skill_AFK_Gain');
      const bribeAfkGains = bribes?.[24]?.done ? bribes?.[24]?.value : 0;
      let afkGains = .25 + (tickTockBonus + (baseMath + (trappingBonus + ((starSignAfkGains) + bribeAfkGains)))) / 100;
      if (afkGains < .8) {
        const shrineAfkGains = getShrineBonus(shrines, 8, character?.mapIndex, account.cards, account?.sailing?.artifacts);
        afkGains = Math.min(.8, afkGains + shrineAfkGains / 100);
      }
      return afkGains;
    }
  }
  return 1;
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

export const allProwess = (character, meals, bubbles) => {
  const prowessBubble = getBubbleBonus(bubbles, 'kazam', 'PROWESESSARY', false);
  const starSignProwess = getStarSignByEffect(character?.starSigns, 'All_Skill_Prowess');
  const skillProwessMeals = getMealsBonusByEffectOrStat(meals, null, 'Sprow')
  return Math.max(0, Math.min(.1, (prowessBubble - 1) / 10 + (.001 * (starSignProwess) + 5e-4 * skillProwessMeals)));
}

export const getAllBaseSkillEff = (character, playerChips, jewels) => {
  const baseAllEffBox = getPostOfficeBonus(character?.postOffice, 'Myriad_Crate', 1);
  const galvanicMotherboard = playerChips.find((chip) => chip.index === 11)?.baseVal ?? 0;
  const superSource = getTalentBonus(character?.starTalents, null, 'SUPERSOURCE');
  const emeraldNavetteBonus = jewels.filter(jewel => jewel.active && jewel.name === 'Emerald_Navette').reduce((sum, jewel) => sum + (jewel.bonus * jewel.multiplier), 0);
  return (baseAllEffBox) + galvanicMotherboard + (superSource + emeraldNavetteBonus);
}

export const getAllEff = (character, meals, lab, accountCards, guildBonuses, charactersLevels) => {
  const highestLevelHunter = getHighestLevelOfClass(charactersLevels, 'Hunter');
  const theFamilyGuy = getHighestTalentByClass(state?.characters, 3, 'Beast_Master', 'THE_FAMILY_GUY')
  const familyEffBonus = getFamilyBonusBonus(classFamilyBonuses, 'EFFICIENCY_FOR_ALL_SKILLS', highestLevelHunter);
  const amplifiedFamilyBonus = familyEffBonus * (theFamilyGuy > 0 ? (1 + theFamilyGuy / 100) : 1)
  const equipmentEffEffectBonus = character?.equipment?.reduce((res, item) => res + getStatFromEquipment(item, bonuses?.etcBonuses?.[48]), 0);
  const spelunkerObolMulti = getLabBonus(lab.labBonuses, 8); // gem multi
  const blackDiamondRhinestone = getJewelBonus(lab.jewels, 16, spelunkerObolMulti);
  const mealEff = getMealsBonusByEffectOrStat(meals, null, 'Seff', blackDiamondRhinestone);
  const groundedMotherboard = lab?.playersChips.find((chip) => chip.index === 11)?.baseVal ?? 0;
  const chaoticTrollBonus = getEquippedCardBonus(character?.cards, 'Boss4B');
  const crystalCapybaraBonus = accountCards?.Crystal_Capybara?.stars + 1 ?? 0;
  const cardSet = character?.cards?.cardSet?.rawName === 'CardSet2' ? character?.cards?.cardSet?.bonus : 0;
  const skilledDimwit = getPrayerBonusAndCurse(character?.prayers, 'Skilled_Dimwit')?.bonus;
  const balanceOfProficiency = getPrayerBonusAndCurse(character?.prayers, 'Balance_of_Proficiency')?.curse;
  const maestroTransfusion = getTalentBonusIfActive(character?.activeBuffs, 'MAESTRO_TRANSFUSION');
  let guildSKillEff = 0;
  if (guildBonuses.length > 0) {
    guildSKillEff = getGuildBonusBonus(guildBonuses, 6);
  }
  // return (1 + ((familyEffBonus) + equipmentEffEffectBonus) / 100) *
  //   (1 + (mealEff + groundedMotherboard) / 100)
  //   * (1 + chaoticTrollBonus / 100)
  //   * (1 + (guildSKillEff + (cardSet + skilledDimwit)) / 100)
  //   * Math.max(1 - (maestroTransfusion + balanceOfProficiency) / 100, .01);

  return (1 + ((amplifiedFamilyBonus) + (equipmentEffEffectBonus + 0)) / 100) *
    (1 + (mealEff + (groundedMotherboard + 3 * crystalCapybaraBonus)) / 100) *
    (1 + chaoticTrollBonus / 100) *
    (1 + (guildSKillEff + (cardSet + skilledDimwit)) / 100) *
    Math.max(1 - (maestroTransfusion + balanceOfProficiency) / 100, 0.01);
}

export const getPlayerCapacity = (bag, capacities) => {
  if (bag) {
    return getMaterialCapacity(bag, capacities);
  }
  return 50; // TODO: check for better solution
}


export const getSmithingExpMulti = (focusedSoulTalentBonus, happyDudeTalentBonus, smithingCards, blackSmithBoxBonus0, allSkillExp, leftHandOfLearningTalentBonus) => {
  // missing smartas smithing stamp
  const talentsBonus = 1 + (focusedSoulTalentBonus + happyDudeTalentBonus) / 100;
  const cardsBonus = 1 + smithingCards / 100;
  return Math.max(0.1, talentsBonus * cardsBonus * (1 + blackSmithBoxBonus0 / 100) + (allSkillExp + leftHandOfLearningTalentBonus) / 100);
}

const getNonConsumeChance = (starSigns, cards, postOffice, talents, bubbles, jewels, labBonuses) => {
  // if ("FoodNOTconsume" == s) {
  //   var baseMath = 90 + 5 * w._customBlock_MainframeBonus(108),
  //     Co = b.engine.getGameAttribute("DNSM"),
  //     Bo = null != d.AlchBubbles ? Co.getReserved("AlchBubbles") : Co.h.AlchBubbles,
  //     bubbleBonus = null != d.nonFoodACTIVE ? Bo.getReserved("nonFoodACTIVE") : Bo.h.nonFoodACTIVE,
  //     realBaseMath = Math.min(baseMath, 98 + Math.min(bubbleBonus, 1)),
  //     jewel = Math.max(1, w._customBlock_MainframeBonus(108)),
  //     freeMeal = t._customBlock_GetTalentNumber(1, 458),
  //     xo = b.engine.getGameAttribute("DNSM"),
  //     Qo = null != d.BoxRewards ? xo.getReserved("BoxRewards") : xo.h.BoxRewards,
  //     Lo = null != d.NonConsume ? Qo.getReserved("NonConsume") : Qo.h.NonConsume,
  //     postOffice = Lo,
  //     cards = O._customBlock_CardBonusREAL(16),
  //     Yo = b.engine.getGameAttribute("DNSM"),
  //     Wo = null != d.StarSigns ? Yo.getReserved("StarSigns") : Yo.h.StarSigns,
  //     Zo = null != d.NoConsumeFood ? Wo.getReserved("NoConsumeFood") : Wo.h.NoConsumeFood,
  //     starSign = Zo,
  //     Jo = b.engine.getGameAttribute("DNSM"),
  //     jo = null != d.AlchBubbles ? Jo.getReserved("AlchBubbles") : Jo.h.AlchBubbles,
  //     bubble = null != d.nonFoodACTIVE ? jo.getReserved("nonFoodACTIVE") : jo.h.nonFoodACTIVE;
  //   return Math.min(realBaseMath, jewel * (freeMeal + (postOffice + (cards + starSign + (bubble)))));
  // }
  const spelunkerObolMulti = getLabBonus(labBonuses, 8); // gem multi
  const nonConsumeJewelBonus = getJewelBonus(jewels, 8, spelunkerObolMulti);
  const baseMath = 90 + 5 * nonConsumeJewelBonus;
  const biteButNotChewBubbleBonus = getBubbleBonus(bubbles, 'power', 'BITE_BUT_NOT_CHEW', false);
  const bubbleMath = Math.min(baseMath, 98 + Math.min(biteButNotChewBubbleBonus, 1));
  const jewelMath = Math.max(1, nonConsumeJewelBonus);
  const freeMealBonus = getTalentBonus(talents, 1, 'FREE_MEAL');
  const carePackFromMumBonus = getPostOfficeBonus(postOffice, 'Carepack_From_Mum', 0);
  const crabCakeBonus = getEquippedCardBonus(cards?.equippedCards, "B3");
  const starSingBonus = getStarSignByEffect(starSigns, 'chance_to_not');
  return Math.min(bubbleMath, jewelMath * (freeMealBonus + (carePackFromMumBonus + (crabCakeBonus + starSingBonus + biteButNotChewBubbleBonus))))
}

const getPlayerConstructionSpeed = (character, account) => {
  const constructionLevel = character?.skillsInfo?.construction?.level;
  const baseMath = 3 * Math.pow((constructionLevel) / 2 + 0.7, 1.6);
  const carpenterBonus = getBubbleBonus(account?.alchemy?.bubbles, 'power', 'CARPENTER', false);
  const stampsBonus = getStampsBonusByEffect(account?.stamps, 'Building_Spd', constructionLevel);
  const postOffice = getPostOfficeBonus(account?.postOffice, 'Construction_Container', 0);
  const guildBonus = getGuildBonusBonus(account?.guild?.guildBonuses, 5);
  const equipmentConstructionEffectBonus = character?.equipment?.reduce((res, item) => res + getStatFromEquipment(item, bonuses?.etcBonuses?.[30]), 0);
  const obolsBonus = getObolsBonus(character?.obols, bonuses?.etcBonuses?.[30]);
  const constructionAchievement = getAchievementStatus(account?.achievements, 153);
  const moreMath = 1 + (stampsBonus + 0.25 * (postOffice) + (guildBonus + (equipmentConstructionEffectBonus + obolsBonus) + Math.min(5, 5 * constructionAchievement))) / 100;
  const reduxRates = getTalentBonus(character?.talents, 2, 'REDUX_RATES');
  const redSaltAmount = calculateItemTotalAmount(account?.storage, 'Refinery1', true);
  return Math.floor(baseMath * (1 + (constructionLevel * carpenterBonus) / 100) * moreMath * (1 + (reduxRates * lavaLog(redSaltAmount)) / 100));
}