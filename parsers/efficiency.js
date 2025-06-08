import { getBubbleBonus, getVialsBonusByStat } from '@parsers/alchemy';
import { getStarSignBonus } from '@parsers/starSigns';
import { getMealsBonusByEffectOrStat } from '@parsers/cooking';
import { getPostOfficeBonus } from '@parsers/postoffice';
import {
  getCharacterByHighestTalent,
  getHighestTalentByClass,
  getTalentBonus,
  getTalentBonusIfActive,
  mainStatMap
} from '@parsers/talents';
import {
  getGoldenFoodBonus,
  getHighestLevelOfClass,
  getSkillMasteryBonusByIndex,
  isCompanionBonusActive,
  isMasteryBonusUnlocked
} from '@parsers/misc';
import { getFamilyBonusBonus } from '@parsers/family';
import { bonuses, classFamilyBonuses } from '../data/website-data';
import { calculateItemTotalAmount, getStatsFromGear } from '@parsers/items';
import { getJewelBonus, getLabBonus } from '@parsers/lab';
import { getCardBonusByEffect, getEquippedCardBonus } from '@parsers/cards';
import { getPrayerBonusAndCurse } from '@parsers/prayers';
import { getGuildBonusBonus } from '@parsers/guild';
import { TOOLS } from '@utility/consts';
import { getStatueBonus } from '@parsers/statues';
import { getStampsBonusByEffect } from '@parsers/stamps';
import { getShinyBonus } from '@parsers/breeding';
import { getObolsBonus } from '@parsers/obols';
import { isArtifactAcquired } from '@parsers/sailing';
import { getAtomBonus } from '@parsers/atomCollider';
import { lavaLog } from '@utility/helpers';

export const allProwess = (character, account) => {
  const mainStat = mainStatMap?.[character?.class];
  const prowessBubble = getBubbleBonus(account, 'kazam', 'PROWESESSARY', false, mainStat);
  const starSignProwess = getStarSignBonus(character, account, 'All_Skill_Prowess');
  const skillProwessMeals = getMealsBonusByEffectOrStat(account?.cooking?.meals, null, 'Sprow')
  return Math.max(0, Math.min(.1, (prowessBubble - 1) / 10 + (.001 * (starSignProwess) + 5e-4 * skillProwessMeals)));
}

export const getNobisectBonus = (character, account, characters, playerInfo) => {
  const mainStat = mainStatMap?.[character?.class];
  const { strength, wisdom, agility } = character?.stats || {};
  const strBubbleBonus = getBubbleBonus(account, 'power', 'HEARTY_DIGGY', false, mainStat);
  const wisBubbleBonus = getBubbleBonus(account, 'high-iq', 'HOCUS_CHOPPUS', false, mainStat);
  const base = Math.max(1, getAllEff(character, characters, account)
    + Math.pow(((strBubbleBonus * lavaLog(playerInfo?.maxHp))
      + (wisBubbleBonus * lavaLog(playerInfo?.maxMp))) / 100, 2)
    + Math.pow((strength
      + (wisdom
        + agility)) / 3, 0.5) / 7);
  const nubisect = account?.divinity?.deities?.[2];
  return (nubisect?.level ?? 0)
    * (nubisect?.blessingMultiplier ?? 0)
    * Math.min(1.8, Math.max(0.1, 4
      * Math.pow(((base + 1e4)
        / Math.max(10 * base + 10, 1)) * 0.01, 2)));
}

export const getAllBaseSkillEff = (character, account, characters, playerInfo) => {
  const shinyBonus = getShinyBonus(account?.breeding?.pets, 'Base_Efficiency_for_All_Skills')
  const stampBonus = getStampsBonusByEffect(account, 'All_Skill_Efficiency', character);
  const blessingBonus = getNobisectBonus(character, account, characters, playerInfo);
  const postOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Myriad_Crate', 1);
  const chipBonus = account?.lab?.playersChips?.[character?.playerId].find((chip) => chip.index === 11)?.baseVal ?? 0;
  const talentBonus = getTalentBonus(character?.starTalents, null, 'SUPERSOURCE');
  const spelunkerObolMulti = getLabBonus(account?.lab?.labBonuses, 8); // gem multi
  const jewelBonus = getJewelBonus(account?.lab.jewels, 12, spelunkerObolMulti);
  const allGreenActive = account.lab.jewels?.slice(11, 16)?.every(({ active }) => active) ? 2 : 1;

  return shinyBonus
    + stampBonus
    + blessingBonus
    + postOfficeBonus
    + chipBonus
    + (talentBonus
      + (jewelBonus * allGreenActive));
}

export const getAllEff = (character, characters, account) => {
  const highestLevelHunter = getHighestLevelOfClass(account?.charactersLevels, 'Hunter');
  // const theFamilyGuy = getHighestTalentByClass(characters, 3, 'Beast_Master', 'THE_FAMILY_GUY');
  const familyEffBonus = getFamilyBonusBonus(classFamilyBonuses, 'EFFICIENCY_FOR_ALL_SKILLS', highestLevelHunter);
  // const amplifiedFamilyBonus = familyEffBonus * (theFamilyGuy > 0 ? (1 + theFamilyGuy / 100) : 1);
  const effFromEquipment = getStatsFromGear(character, 48, account);
  const effFromObols = getObolsBonus(character?.obols, bonuses?.etcBonuses?.[48]);
  const artifactBonus = isArtifactAcquired(account?.sailing?.artifacts, 'Frost_Relic')?.bonus ?? 0;
  const talentBonus = getTalentBonus(character?.starTalents, null, 'STUDIOUS_QUESTER');
  const spelunkerObolMulti = getLabBonus(account?.lab?.labBonuses, 8); // gem multi
  const blackDiamondRhinestone = getJewelBonus(account?.lab.jewels, 16, spelunkerObolMulti);
  const mealBonus = getMealsBonusByEffectOrStat(account, null, 'Seff', blackDiamondRhinestone);
  const chipBonus = account?.lab?.playersChips?.[character?.playerId]?.find((chip) => chip.index === 11)?.baseVal ?? 0;
  const cardBonus = account?.cards?.Crystal_Capybara?.stars ? account?.cards?.Crystal_Capybara?.stars + 1 : 0;
  const masteryBonus = getSkillMasteryBonusByIndex(account?.totalSkillsLevels, account?.rift, 2)
  const chaoticTrollBonus = getEquippedCardBonus(character?.cards, 'Boss4B');
  const companionBonus = isCompanionBonusActive(account, 5) ? 5 : 0
  const cardSetBonus = character?.cards?.cardSet?.rawName === 'CardSet2' ? character?.cards?.cardSet?.bonus : 0;
  const prayerBonus = getPrayerBonusAndCurse(character?.activePrayers, 'Skilled_Dimwit', account)?.bonus;
  const prayerCurse = getPrayerBonusAndCurse(character?.activePrayers, 'Balance_of_Proficiency', account)?.curse;
  const secondTalentBonus = getTalentBonusIfActive(character?.activeBuffs, 'MAESTRO_TRANSFUSION');
  let guildBonus = 0;
  if (account?.guild?.guildBonuses?.length > 0) {
    guildBonus = getGuildBonusBonus(account?.guild?.guildBonuses, 6);
  }

  return (1 + (familyEffBonus
      + ((effFromEquipment + effFromObols)
        + (artifactBonus
          + Math.min(0.1 * character?.questCompleted, talentBonus)))) / 100)
    * (1 + (mealBonus
      + (chipBonus
        + 3 * cardBonus)
      + (masteryBonus
        + (account?.accountOptions?.[180] ?? 0))) / 100)
    * (1 + (chaoticTrollBonus
      + companionBonus) / 100)
    * (1 + (guildBonus
      + (cardSetBonus
        + prayerBonus)) / 100)
    * Math.max(1 - (secondTalentBonus + prayerCurse) / 100, 0.01);
}


export const getMiningEff = (character, characters, account, playerInfo) => {
  const mainStat = mainStatMap?.[character?.class];
  const effFromTool = character?.tools?.[TOOLS.PICKAXE]?.Weapon_Power || 0;
  let baseMiningEff = effFromTool;
  const talentBonus = getTalentBonus(character?.talents, 1, 'TOOL_PROFICIENCY');
  const bubbleBonus = getBubbleBonus(account, 'power', 'STRONK_TOOLS', false, mainStat);
  const miningLevel = character?.skillsInfo?.mining?.level;
  baseMiningEff = baseMiningEff * (1 + talentBonus * (character?.skillsInfo?.mining?.level / 10) / 100) * (1 + bubbleBonus / 100);
  baseMiningEff += 4;
  const statueBonus = getStatueBonus(account?.statues, 'StatueG3', character?.talents);
  const secondBubbleBonus = getBubbleBonus(account, 'power', 'SLABI_OREFISH', false, mainStat);
  const lootedItems = account?.looty?.rawLootedItems;
  baseMiningEff += effFromTool + statueBonus + (secondBubbleBonus * Math.floor(lootedItems / 100));

  const secondTalentBonus = getTalentBonus(character?.talents, 3, 'SKILL_STRENGTHEN');
  const stampBonus = getStampsBonusByEffect(account, 'Base_Mining', character);
  const allBaseSkillEff = getAllBaseSkillEff(character, account, characters, playerInfo);
  const postOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Dwarven_Supplies', 0);
  const rightHandBonus = getMaestroRightHandBonus(character, 'mining', characters);
  const goldenFoodBonus = getGoldenFoodBonus('Golden_Peanut', character, account, characters) || 1;
  const thirdTalentBonus = getTalentBonus(character?.talents, 0, 'BRUTE_EFFICIENCY');
  const etcFromTools = getStatsFromGear(character, 10, account, true);
  const etcFromObols = getObolsBonus(character?.obols, bonuses?.etcBonuses?.[10]);
  const masteryBonus = isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.mining?.rank, 1);
  const cardBonus = getCardBonusByEffect(character?.cards?.equippedCards, 'Total_Mining_Efficiency');
  const starSignBonus = getStarSignBonus(character, account, 'Mining_Efficency');
  const vialBonus = getVialsBonusByStat(account?.alchemy?.vials, 'MinEff');
  const thirdBubbleBonus = getBubbleBonus(account, 'power', 'HEARTY_DIGGY', false, mainStat);
  const fourthTalentBonus = getTalentBonus(character?.talents, 1, 'COPPER_COLLECTOR');
  const atomBonus = getAtomBonus(account, 'Helium_-_Talent_Power_Stacker');
  const copperOwned = calculateItemTotalAmount(account?.storage, 'Copper_Ore', true);
  const allEfficiencies = getAllEff(character, characters, account);

  return 12 + (Math.pow(baseMiningEff, 1.3)
      + (Math.pow(character?.stats?.strength + 1, .6)
        * (1 + secondTalentBonus / 100)
        + (stampBonus
          + allBaseSkillEff)))
    * (1 + miningLevel / 200)
    * (1 + (postOfficeBonus
      + rightHandBonus) / 100)
    * (1 + Math.pow(character?.stats?.strength / 100, .35)
      * (1 + secondTalentBonus / 100))
    * goldenFoodBonus
    * (1 + (thirdTalentBonus
      + ((etcFromTools + etcFromObols)
        + 10 * masteryBonus)) / 100)
    * (1 + (cardBonus
      + (starSignBonus
        + vialBonus)) / 100)
    * (1 + baseMiningEff / 100)
    * 1 // BIG PICK
    * (1 + thirdBubbleBonus * lavaLog(playerInfo?.maxHp) / 100)
    * (1 + fourthTalentBonus
      * (atomBonus
        + lavaLog(copperOwned)) / 100)
    * allEfficiencies
}

const getMaestroRightHandBonus = (character, skillName, characters) => {
  const maestroTalentBonus = getHighestTalentByClass(characters, 2, 'Maestro', 'RIGHT_HAND_OF_ACTION', null, true);
  const bestMaestro = getCharacterByHighestTalent(characters, 2, 'Maestro', 'RIGHT_HAND_OF_ACTION', null, true);
  if (character?.skillsInfo?.[skillName]?.level < bestMaestro?.skillsInfo?.[skillName]?.level) {
    return maestroTalentBonus
  }
  return 0;
}