import { getBubbleBonus, getVialsBonusByStat } from '@parsers/world-2/alchemy';
import { getStarSignBonus } from '@parsers/starSigns';
import { getMealsBonusByEffectOrStat } from '@parsers/world-4/cooking';
import { getPostOfficeBonus } from '@parsers/world-3/postoffice';
import {
  checkCharClass,
  CLASSES,
  getCharacterByHighestTalent,
  getHighestTalentByClass, getMaestroHand,
  getTalentBonus,
  getTalentBonusIfActive,
  mainStatMap
} from '@parsers/talents';
import {
  calcTotalQuestCompleted,
  getFriendBonus,
  getGoldenFoodMultiplier,
  getSkillMasteryBonusByIndex,
  getSkillCardBonus,
  isCompanionBonusActive,
  isMasteryBonusUnlocked
} from '@parsers/misc';
import { getVoteBonus } from '@parsers/world-2/voteBallot';
import { getArmorSetBonus } from '@parsers/world-3/armorSmithy';
import { getMonumentBonus } from '@parsers/world-5/caverns/bravery';
import { bonuses } from '@website-data';
import { calculateItemTotalAmount, getStatsFromGear } from '@parsers/items';
import { getJewelBonus, getLabBonus } from '@parsers/world-4/lab';
import { getCardBonusByEffect, getCardLevel, getEquippedCardBonus } from '@parsers/cards';
import { getPaletteBonus } from '@parsers/world-5/gaming';
import { getPrayerBonusAndCurse } from '@parsers/world-3/prayers';
import { getGuildBonusBonus } from '@parsers/guild';
import { TOOLS } from '@utility/consts';
import { getStatueBonus } from '@parsers/world-1/statues';
import { getStampsBonusByEffect } from '@parsers/world-1/stamps';
import { getShinyBonus } from '@parsers/world-4/breeding';
import { getObolsBonus } from '@parsers/obols';
import { isArtifactAcquired } from '@parsers/world-5/sailing';
import { getAtomBonus } from '@parsers/world-3/atomCollider';
import { lavaLog, notateNumber } from '@utility/helpers';
import { breakdownCategory, breakdownSubSection, createBreakdown } from '@parsers/breakdown';
import { getSchematicBonus } from '@parsers/world-5/caverns/the-well';
import { getWinnerBonus } from '@parsers/world-6/summoning';

export const allProwess = (character: any, account: any) => {
  const mainStat = mainStatMap?.[character?.class];
  const prowessBubble = getBubbleBonus(account, 'PROWESESSARY', false, false);
  const starSignProwess = getStarSignBonus(character, account, 'All_Skill_Prowess');
  const skillProwessMeals = getMealsBonusByEffectOrStat(account, null, 'Sprow');
  return Math.max(0, Math.min(.1, (prowessBubble - 1) / 10 + (.001 * (starSignProwess) + 5e-4 * skillProwessMeals)));
}

export const getNobisectBonus = (character: any, account: any, characters: any, playerInfo: any) => {
  const mainStat = mainStatMap?.[character?.class];
  const { strength, wisdom, agility } = character?.stats || {};
  const strBubbleBonus = getBubbleBonus(account, 'HEARTY_DIGGY', false, mainStat === 'strength');
  const wisBubbleBonus = getBubbleBonus(account, 'HOCUS_CHOPPUS', false, mainStat === 'wisdom');
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

// game: "AllBaseSkillEff", a plain sum of these lines
const getAllBaseSkillEffSources = (character: any, account: any, characters: any, playerInfo: any) => {
  const shinyBonus = getShinyBonus(account?.breeding?.pets, 'Base_Efficiency_for_All_Skills')
  const stampBonus = getStampsBonusByEffect(account, 'All_Skill_Efficiency', character);
  const blessingBonus = getNobisectBonus(character, account, characters, playerInfo);
  const postOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Myriad_Crate', 1);
  const chipBonus = account?.lab?.playersChips?.[character?.playerId].find((chip: any) => chip.index === 11)?.baseVal ?? 0;
  const talentBonus = getTalentBonus(character?.flatStarTalents, 'SUPERSOURCE');
  const spelunkerObolMulti = getLabBonus(account?.lab?.labBonuses, 8); // gem multi
  const jewelBonus = getJewelBonus(account?.lab.jewels, 12, spelunkerObolMulti);
  const allGreenActive = account.lab.jewels?.slice(11, 16)?.every(({ active }: any) => active) ? 2 : 1;

  return [
    { name: 'Shiny', value: shinyBonus },
    { name: 'Stamp', value: stampBonus },
    { name: 'Nobisect blessing', value: blessingBonus },
    { name: 'Post office', value: postOfficeBonus },
    { name: 'Chip', value: chipBonus },
    { name: 'Supersource talent', value: talentBonus },
    { name: 'Jewel', value: jewelBonus * allGreenActive }
  ];
}

export const getAllBaseSkillEff = (character: any, account: any, characters: any, playerInfo: any) =>
  getAllBaseSkillEffSources(character, account, characters, playerInfo).reduce((total, { value }) => total + value, 0);

export const getAllBaseSkillEffBreakdown = (character: any, account: any, characters: any, playerInfo: any) =>
  breakdownSubSection('All base skill efficiency', getAllBaseSkillEffSources(character, account, characters, playerInfo));

// game: SkillStats("AllEfficiencies"), the product of these factors
const getAllEffFactors = (character: any, characters: any, account: any) => {
  // FamBonusQTYs[42], as the played character sees it
  const familyEffBonus = character?.familyBonuses?.[CLASSES.Hunter] ?? 0;
  const vialBonus = getVialsBonusByStat(account?.alchemy?.vials, '6SkillEff');
  const { value: effFromEquipment } = getStatsFromGear(character, 48, account);
  const effFromObols = getObolsBonus(character?.obols, bonuses?.etcBonuses?.[48]);
  const artifactBonus = isArtifactAcquired(account?.sailing?.artifacts, 'Frost_Relic')?.bonus ?? 0;
  const talentBonus = getTalentBonus(character?.flatStarTalents, 'STUDIOUS_QUESTER');
  // game: ArbitraryCode("TotalQuestsComplete") - unique quests done across the account (TomeQTY[4])
  const totalQuests = Number(calcTotalQuestCompleted(characters)) || 0;
  const mealBonus = getMealsBonusByEffectOrStat(account, null, 'Seff');
  const tomeBonus = account?.tome?.bonuses?.[1]?.bonus ?? 0;
  const chipBonus = account?.lab?.playersChips?.[character?.playerId]?.find((chip: any) => chip.index === 11)?.baseVal ?? 0;
  // game: 3 * CardLv("Crystal4")
  const cardBonus = getCardLevel(account?.cards, 'Crystal4');
  const multitoolBonus = getTalentBonus(character?.flatStarTalents, 'ANCIENT_MULTITOOL');
  const paletteBonus = getPaletteBonus(account, 10) ?? 0;
  const friendBonus = getFriendBonus(account, 2) ?? 0;
  const option422 = Number(account?.accountOptions?.[422]) || 0;
  const masteryBonus = getSkillMasteryBonusByIndex(account?.totalSkillsLevels, account?.rift, 2)
  const schematicBonus = getSchematicBonus({ holesObject: account?.hole?.holesObject, t: 49, i: 15 });
  const chaoticTrollBonus = getEquippedCardBonus(character?.cards, 'Boss4B' as any);
  const companionBonus = isCompanionBonusActive(account, 5) ? account?.companions?.list?.at(5)?.bonus : 0;
  const winnerBonus = getWinnerBonus(account, '<x Skill Effncy.');

  const cardSetBonus = character?.cards?.cardSet?.rawName === 'CardSet2' ? character?.cards?.cardSet?.bonus : 0;
  const prayerBonus = getPrayerBonusAndCurse(character?.activePrayers, 'Skilled_Dimwit', account)?.bonus;
  const prayerCurse = getPrayerBonusAndCurse(character?.activePrayers, 'Balance_of_Proficiency', account)?.curse;
  const secondTalentBonus = getTalentBonusIfActive(character?.activeBuffs, 'MAESTRO_TRANSFUSION');
  let guildBonus = 0;
  if (account?.guild?.guildBonuses?.length > 0) {
    guildBonus = getGuildBonusBonus(account?.guild?.guildBonuses, 6);
  }

  return [
    {
      name: 'Family, gear, obols, vial, artifact, quests',
      value: 1 + (familyEffBonus + effFromEquipment + effFromObols + vialBonus + artifactBonus
        + Math.min(0.1 * totalQuests, talentBonus)) / 100
    },
    {
      name: 'Meal, tome, palette, chip, card, mastery, shimmer',
      value: 1 + (mealBonus + multitoolBonus + tomeBonus + paletteBonus + chipBonus + 3 * cardBonus + friendBonus
        + masteryBonus + schematicBonus + option422
        + (account?.accountOptions?.[180] ?? 0) * account?.islands?.allShimmerBonus) / 100
    },
    { name: 'Chaotic Troll card, companion', value: 1 + (chaoticTrollBonus + companionBonus) / 100 },
    { name: 'Summoning', value: 1 + winnerBonus / 100 },
    { name: 'Guild, card set, prayer', value: 1 + (guildBonus + cardSetBonus + prayerBonus) / 100 },
    { name: 'Maestro Transfusion, prayer curse', value: Math.max(1 - (secondTalentBonus + prayerCurse) / 100, 0.01) }
  ];
}

export const getAllEff = (character: any, characters: any, account: any) =>
  getAllEffFactors(character, characters, account).reduce((total, { value }) => total * value, 1);

export const getAllEffBreakdown = (character: any, characters: any, account: any) =>
  breakdownSubSection('All efficiencies', getAllEffFactors(character, characters, account), { multiplicative: true });

// game: SkillStats("MiningEfficiency"): 12 + base power * every multiplier
const getMiningEffParts = (character: any, characters: any, account: any, playerInfo: any) => {
  const mainStat = mainStatMap?.[character?.class];
  const effFromTool = character?.tools?.[TOOLS.PICKAXE]?.Weapon_Power || 0;
  const talentBonus = getTalentBonus(character?.flatTalents, 'TOOL_PROFICIENCY');
  const bubbleBonus = getBubbleBonus(account, 'STRONK_TOOLS', false, mainStat === 'strength');
  const miningLevel = character?.skillsInfo?.mining?.level;
  const scaledTool = effFromTool * (1 + talentBonus * (character?.skillsInfo?.mining?.level / 10) / 100) * (1 + bubbleBonus / 100);
  const statueBonus = getStatueBonus(account, 2, character?.flatTalents);
  const secondBubbleBonus = getBubbleBonus(account, 'SLABI_OREFISH', false, mainStat === 'strength');
  const lootedItems = account?.looty?.rawLootedItems;
  // game: TotalStats("Mining_Power") adds AlchBubbles.W7, ENDGAME_EFF_I scaled by every 10 class levels past 500
  const endgameBubbleBonus = getBubbleBonus(account, 'ENDGAME_EFF_I', false, mainStat === 'strength')
    * Math.max(1, Math.floor((character?.level - 500) / 10));
  const miningPowerSources = [
    { name: 'Pickaxe (Tool Proficiency, Stronk Tools)', value: scaledTool },
    { name: 'Base', value: 4 },
    { name: 'Pickaxe', value: effFromTool },
    { name: 'Statue', value: statueBonus },
    { name: 'Slabi Orefish bubble', value: secondBubbleBonus * Math.floor(lootedItems / 100) },
    { name: 'Endgame Eff I bubble', value: endgameBubbleBonus }
  ];
  const baseMiningEff = miningPowerSources.reduce((total, { value }) => total + value, 0);

  const secondTalentBonus = getTalentBonus(character?.flatTalents, 'SKILL_STRENGTHEN');
  const stampBonus = getStampsBonusByEffect(account, 'Base_Mining', character);
  const allBaseSkillEff = getAllBaseSkillEff(character, account, characters, playerInfo);
  const postOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Dwarven_Supplies', 0);
  const rightHandBonus = getMaestroHand(character, 'mining', characters, account, 'RIGHT_HAND_OF_ACTION');
  const goldenFoodMulti = getGoldenFoodMultiplier('Golden_Peanut', character, account, characters);
  const thirdTalentBonus = getTalentBonus(character?.flatTalents, 'BRUTE_EFFICIENCY');
  const { value: etcFromGear } = getStatsFromGear(character, 10, account);
  const etcFromObols = getObolsBonus(character?.obols, bonuses?.etcBonuses?.[10]);
  const masteryBonus = isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.mining?.rank, 1);
  const cardBonus = getSkillCardBonus(character, account, 'mining', 'Total_Mining_Efficiency');
  const voteBonus = getVoteBonus(account, 7);
  const copperSetBonus = getArmorSetBonus(account, 'COPPER_SET');
  const monumentBonus = getMonumentBonus({ holesObject: account?.hole?.holesObject, t: 0, i: 0 });
  const starSignBonus = getStarSignBonus(character, account, 'Mining_Efficency');
  const vialBonus = getVialsBonusByStat(account?.alchemy?.vials, 'MinEff');
  const thirdBubbleBonus = getBubbleBonus(account, 'HEARTY_DIGGY', false, mainStat === 'strength');
  const fourthTalentBonus = getTalentBonus(character?.flatTalents, 'COPPER_COLLECTOR');
  const atomBonus = getAtomBonus(account, 'Helium_-_Talent_Power_Stacker');
  const copperOwned = calculateItemTotalAmount(account?.storage?.list, 'Copper_Ore', true);
  const allEfficiencies = getAllEff(character, characters, account);

  const value = 12 + (Math.pow(baseMiningEff, 1.3)
      + (Math.pow(character?.stats?.strength + 1, .6)
        * (1 + secondTalentBonus / 100)
        + (stampBonus
          + allBaseSkillEff)))
    * (1 + miningLevel / 200)
    * (1 + (postOfficeBonus
      + rightHandBonus) / 100)
    * (1 + Math.pow(character?.stats?.strength / 100, .35)
      * (1 + secondTalentBonus / 100))
    * goldenFoodMulti
    * (1 + (thirdTalentBonus
      + ((etcFromGear + etcFromObols)
        + (10 * masteryBonus + (voteBonus + copperSetBonus)))) / 100)
    * (1 + (cardBonus
      + (starSignBonus
        + (vialBonus + monumentBonus))) / 100)
    * (1 + baseMiningEff / 100)
    * 1 // BIG PICK
    * (1 + thirdBubbleBonus * lavaLog(playerInfo?.maxHp) / 100)
    * (1 + fourthTalentBonus
      * (atomBonus
        + lavaLog(copperOwned)) / 100)
    * allEfficiencies;

  const categories = [
    breakdownCategory('Flat', [{ name: 'Base', value: 12 }]),
    // Shown for reference: the base power and the pickaxe multiplier below are both built from it
    breakdownCategory('Mining power', miningPowerSources),
    breakdownCategory('Base power', [
      { name: 'Mining power ^ 1.3', value: Math.pow(baseMiningEff, 1.3) },
      { name: 'Strength', value: Math.pow(character?.stats?.strength + 1, .6) * (1 + secondTalentBonus / 100) },
      { name: 'Stamp', value: stampBonus },
      getAllBaseSkillEffBreakdown(character, account, characters, playerInfo)
    ]),
    breakdownCategory('Multiplicative', [
      { name: 'Mining level', value: 1 + miningLevel / 200 },
      { name: 'Strength', value: 1 + Math.pow(character?.stats?.strength / 100, .35) * (1 + secondTalentBonus / 100) },
      { name: 'Golden food', value: goldenFoodMulti },
      { name: 'Mining power', value: 1 + baseMiningEff / 100 },
      { name: 'Hearty Diggy bubble', value: 1 + thirdBubbleBonus * lavaLog(playerInfo?.maxHp) / 100 },
      { name: 'Copper Collector talent', value: 1 + fourthTalentBonus * (atomBonus + lavaLog(copperOwned)) / 100 },
      getAllEffBreakdown(character, characters, account)
    ]),
    breakdownCategory('Additive: post office, right hand', [
      { name: 'Post office', value: postOfficeBonus / 100 },
      { name: 'Right Hand of Action', value: rightHandBonus / 100 }
    ], { additive: true }),
    breakdownCategory('Additive: talent, gear, mastery', [
      { name: 'Brute Efficiency talent', value: thirdTalentBonus / 100 },
      { name: 'Gear', value: etcFromGear / 100 },
      { name: 'Obols', value: etcFromObols / 100 },
      { name: 'Skill mastery', value: 10 * masteryBonus / 100 },
      { name: 'Vote', value: voteBonus / 100 },
      { name: 'Copper set', value: copperSetBonus / 100 }
    ], { additive: true }),
    breakdownCategory('Additive: card, star sign, vial, monument', [
      { name: 'Card', value: cardBonus / 100 },
      { name: 'Star sign', value: starSignBonus / 100 },
      { name: 'Vial', value: vialBonus / 100 },
      { name: 'Monument', value: monumentBonus / 100 }
    ], { additive: true })
  ];
  return { value, categories };
}

export const getMiningEff = (character: any, characters: any, account: any, playerInfo: any) =>
  getMiningEffParts(character, characters, account, playerInfo).value;

export const getMiningEffBreakdown = (character: any, characters: any, account: any, playerInfo: any) => {
  const { value, categories } = getMiningEffParts(character, characters, account, playerInfo);
  return createBreakdown('Mining Efficiency', String(notateNumber(value)), categories);
}

const getMaestroRightHandBonus = (character: any, skillName: any, characters: any) => {
  const bestMaestro = characters?.filter((character: any) => checkCharClass(character?.class, CLASSES.Maestro))?.at(-1);
  const rightHandOfLearningTalentBonus = getTalentBonus(bestMaestro?.flatTalents, 'RIGHT_HAND_OF_ACTION', false, true);
  if (character?.skillsInfo?.[skillName]?.level < bestMaestro?.skillsInfo?.[skillName]?.level) {
    return rightHandOfLearningTalentBonus
  }
  return 0;
}