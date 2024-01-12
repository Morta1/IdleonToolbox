import { anvilProducts, anvilUpgradeCost } from '../data/website-data';
import {
  getGoldenFoodBonus,
  getSkillMasteryBonusByIndex,
  getSpeedBonusFromAgility,
  isMasteryBonusUnlocked
} from './misc';
import { getBribeBonus } from './bribes';
import { getActiveBubbleBonus, getBubbleBonus } from './alchemy';
import {
  checkCharClass,
  getBubonicGreenTube,
  getHighestTalentByClass,
  getTalentBonus,
  getTalentBonusIfActive,
  getVoidWalkerTalentEnhancements,
  talentPagesMap
} from './talents';
import { getStarSignBonus } from './starSigns';
import { getCardBonusByEffect, getEquippedCardBonus } from './cards';
import { getStatsFromGear } from './items';
import { getStampBonus, getStampsBonusByEffect } from './stamps';
import { getShrineBonus } from './shrines';
import { getStatueBonus } from './statues';
import { getPrayerBonusAndCurse } from './prayers';
import { getSaltLickBonus } from './saltLick';
import { getDungeonStatBonus } from './dungeons';
import { getPostOfficeBonus } from './postoffice';
import { getGuildBonusBonus } from './guild';
import { getPlayerCapacity } from './character';
import { getDeityLinkedIndex, getGodByIndex } from './divinity';
import { getAchievementStatus } from './achievements';
import { getShinyBonus } from './breeding';
import { isSuperbitUnlocked } from './gaming';

export const getAnvilSpeed = (agility = 0, speedPoints, stampBonus = 0, poBoxBonus = 0, hammerHammerBonus = 0, statueBonus = 0, starSignTownSpeed = 0, talentTownSpeed = 0) => {
  const boxAndStatueMath = 1 + ((poBoxBonus + statueBonus) / 100);
  const agilityBonus = getSpeedBonusFromAgility(agility);
  return (1 + (stampBonus + (2 * speedPoints)) / 100)
    * boxAndStatueMath
    * (1 + (hammerHammerBonus / 100))
    * agilityBonus
    * (1 + (starSignTownSpeed + talentTownSpeed) / 100);
}

export const getTotalMonsterMatCost = ({ costThreshold, startingIndex } = {}, pointsFromMats, anvilCostReduction) => {
  if (!costThreshold) return 0;
  let totalMaterials = 0;
  for (let point = startingIndex; point < pointsFromMats; point++) {
    totalMaterials += getMonsterMatCost(point, anvilCostReduction);
  }
  return totalMaterials;
}

export const getMonsterMatCost = (pointsFromMats, anvilCostReduction) => {
  return Math.round((Math.pow(pointsFromMats + 1, 1.5) + pointsFromMats) * Math.max(0.1, 1 - anvilCostReduction / 100))
}

export const getAnvilUpgradeCostItem = (pointsFromMats) => {
  const costIndex = anvilUpgradeCost.findIndex(({ costThreshold }, index) => (pointsFromMats < costThreshold) || (index === anvilUpgradeCost?.length - 1));
  const costObject = anvilUpgradeCost?.[costIndex];
  const startingIndex = costIndex === 0 ? 1 : pointsFromMats < costObject?.costThreshold
    ? anvilUpgradeCost?.[costIndex - 1]?.costThreshold
    : costObject?.costThreshold;
  return costObject ? {
    ...costObject,
    startingIndex: startingIndex
  } : { costThreshold: null, itemName: null };
}


export const getTotalCoinCost = (pointsFromMats, anvilCostReduction) => {
  let totalMaterials = 0;
  for (let point = 0; point < pointsFromMats; point++) {
    totalMaterials += getCoinCost(point, anvilCostReduction);
  }
  return totalMaterials;
}

export const getCoinCost = (pointsFromCoins, anvilCostReduction) => {
  const baseCost = Math.pow(pointsFromCoins, 3) + 50;
  return Math.round(baseCost * (1 + pointsFromCoins / 100) * Math.max(0.1, 1 - anvilCostReduction / 100));
}

const MAX_POINTS_FROM_COINS = 600;
export const getCoinToMax = (pointsFromCoins, anvilCostReduction) => {
  let costToMax = 0;
  for (let i = pointsFromCoins; i < MAX_POINTS_FROM_COINS; i++) {
    costToMax += getCoinCost(i, anvilCostReduction, true);
  }
  return costToMax ?? 0;
}

export const getAnvilExp = (xpPoints, smithingExpMulti) => {
  // "ProdExpBonus" == e
  const baseMath = (1 + (3 * xpPoints / 100)) * smithingExpMulti;
  if (baseMath < 20) return baseMath;
  return Math.min(20 + ((baseMath - 20) / (baseMath - 20 + 70)) * 50, 75);
}

export const getAnvil = (char) => {
  const anvilProduction = char?.[`AnvilPA`];
  const [availablePoints,
    pointsFromCoins,
    pointsFromMats,
    xpPoints,
    speedPoints,
    capPoints] = char?.[`AnvilPAstats`];
  const anvilStats = {
    availablePoints,
    pointsFromCoins,
    pointsFromMats,
    xpPoints,
    speedPoints,
    capPoints,
  }
  const anvilSelected = char?.[`AnvilPAselect`];

  return {
    anvilProduction,
    anvilStats,
    anvilSelected
  }
}

export const getPlayerAnvil = (character, characters, account) => {
  // crafting material in production
  // AnvilPA - production
  // AnvilPAstats - stats
  // AnvilPAselect - selected
  const { anvil } = character;
  let { anvilProduction, anvilStats, anvilSelected } = anvil || {};
  let {
    availablePoints,
    pointsFromCoins,
    pointsFromMats,
    xpPoints,
    speedPoints,
    capPoints
  } = anvilStats || {};

  if (!Array.isArray(anvilSelected)) {
    anvilSelected = [anvilSelected];
  }

  const production = anvilProduction?.reduce((res, item, index) => {
    const [currentAmount, currentXP, currentProgress, totalProduced] = item;
    return [
      ...res,
      {
        currentAmount,
        currentXP,
        currentProgress: parseFloat(currentProgress),
        totalProduced,
        ...(anvilProducts[index] || {}),
        hammers: anvilSelected?.filter((item) => item === index)?.length
      }
    ]
  }, []);

  const stats = {
    availablePoints,
    pointsFromCoins,
    pointsFromMats,
    xpPoints,
    speedPoints,
    capPoints
  };

  const anvilnomicsBubbleBonus = getBubbleBonus(account?.alchemy?.bubbles, 'quicc', 'ANVILNOMICS');
  const isArcher = talentPagesMap[character?.class]?.includes('Archer');
  const archerMultiBubble = isArcher ? getBubbleBonus(account?.alchemy?.bubbles, 'quicc', 'ARCHER_OR_BUST') : 1;
  const anvilCostReduction = anvilnomicsBubbleBonus * archerMultiBubble;
  const anvilCost = getAnvilUpgradeCostItem(pointsFromMats);

  stats.anvilCost = {
    ...anvilCost,
    totalMats: getTotalMonsterMatCost(anvilCost, pointsFromMats, anvilCostReduction),
    nextMatUpgrade: getMonsterMatCost(pointsFromMats, anvilCostReduction),
    totalCoins: getTotalCoinCost(pointsFromCoins, anvilCostReduction),
    nextCoinUpgrade: getCoinCost(pointsFromCoins, anvilCostReduction, true),
    coinsToMax: getCoinToMax(pointsFromCoins, anvilCostReduction)
  };

  // ANVIL EXP
  const starSignBonus = getStarSignBonus(character, account, 'Skill_EXP_gain');
  const cEfauntCardBonus = getEquippedCardBonus(character?.cards, 'Z7');
  const passiveCardBonus = getCardBonusByEffect(account?.cards, 'Skill_EXP_(Passive)')
  const goldenFoodBonus = getGoldenFoodBonus('Golden_Ham', character, account);
  const cardSetBonus = character?.cards?.cardSet?.rawName === 'CardSet3' ? character?.cards?.cardSet?.bonus : 0;
  const voidWalkerEnhancementEclipse = getHighestTalentByClass(characters, 3, 'Voidwalker', 'ENHANCEMENT_ECLIPSE');
  const greenTubeEnhancement = getVoidWalkerTalentEnhancements(characters, account, voidWalkerEnhancementEclipse, 536);
  const luckyCharmEnhancement = getVoidWalkerTalentEnhancements(characters, account, voidWalkerEnhancementEclipse, 35, character);
  const bubonicGreen = getBubonicGreenTube(character, characters, account);
  const shrineBonus = getShrineBonus(account?.shrines, 5, character?.mapIndex, account.cards, account?.sailing?.artifacts);
  const statueBonus = getStatueBonus(account?.statues, 'StatueG18', character?.talents);
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
  const smithingSkillMasteryBonus = getSkillMasteryBonusByIndex(account?.totalSkillsLevels, account?.rift, 1);
  const allSkillMasteryBonus = getSkillMasteryBonusByIndex(account?.totalSkillsLevels, account?.rift, 4);
  const shinyBonus = getShinyBonus(account?.breeding?.pets, 'Skill_EXP');
  const superbitBonus = isSuperbitUnlocked(account, 'MSA_Skill_EXP')?.bonus ?? 0;
  let godBonus = 0;
  const flutterbisIndexes = getDeityLinkedIndex(account, characters, 7);
  if (flutterbisIndexes?.[character?.playerId] !== -1) {
    godBonus = getGodByIndex(account?.divinity?.linkedDeities, characters, 7)
  }

  // "AllSkillxpz" == e
  stats.baseAnvilExp = starSignBonus
    + (cEfauntCardBonus
      + goldenFoodBonus
      + bubonicGreen
      * Math.min(1, greenTubeEnhancement ? bubonicGreen : 0)
      + (cardSetBonus
        + passiveCardBonus
        + (Math.min(150, 100 * luckyCharmEnhancement) + shrineBonus)
        + statueBonus // TODO: TOO HIGH
        + unendingEnergyBonus
        + balanceOfEffBonus
        - skilledDimwitCurse
        - theRoyalSamplerCurse
        + (equipmentBonus
          + (maestroTransfusionTalentBonus
            + (saltLickBonus
              + (dungeonSkillExpBonus
                + (myriadPostOfficeBox // TODO: TOO HIGH
                  + (godBonus
                    + (10 * firstAchievementBonus + (25 * secondAchievementBonus
                      + (10 * thirdAchievementBonus
                        + (smithingSkillMasteryBonus + (allSkillMasteryBonus
                          + (shinyBonus + superbitBonus))))))))))))));

  // ANVIL SPEED MATH;
  const anvilZoomerBonus = getStampBonus(account?.stamps, 'skills', 'StampB3', character);
  const blackSmithBoxBonus1 = getPostOfficeBonus(character?.postOffice, 'Blacksmith_Box', 1);
  const hammerHammerBonus = getActiveBubbleBonus(character?.equippedBubbles, 'quicc', 'HAMMER_HAMMER', account);
  const anvilStatueBonus = getStatueBonus(account?.statues, 'StatueG12', character?.talents);
  const bobBuildGuyStarSign = getStarSignBonus(character, account, 'Speed_in_Town');
  const talentTownSpeedBonus = getTalentBonus(character?.talents, 0, 'BROKEN_TIME');
  stats.anvilSpeed = 3600 * getAnvilSpeed(character?.stats?.agility, speedPoints, anvilZoomerBonus, blackSmithBoxBonus1, hammerHammerBonus, anvilStatueBonus, bobBuildGuyStarSign, talentTownSpeedBonus);

  let guildCarryBonus = 0;
  let zergPrayerBonus = getPrayerBonusAndCurse(character?.activePrayers, 'Zerg_Rushogen', account)?.curse;
  let ruckSackPrayerBonus = getPrayerBonusAndCurse(character?.activePrayers, 'Ruck_Sack', account)?.bonus;

  if (account?.guild?.guildBonuses?.length > 0) {
    guildCarryBonus = getGuildBonusBonus(account?.guild?.guildBonuses, 2);
  }
  const telekineticStorageBonus = getTalentBonus(character?.starTalents, null, 'TELEKINETIC_STORAGE');
  const carryCapShrineBonus = getShrineBonus(account?.shrines, 3, character?.mapIndex, account.cards, account?.sailing?.artifacts);
  const bribeCapBonus = getBribeBonus(account?.bribes, 'Bottomless_Bags');
  const allCapacity = (1 + (guildCarryBonus + telekineticStorageBonus) / 100) * (1 + carryCapShrineBonus / 100) * Math.max(1 - zergPrayerBonus / 100, 0.4)
    * (1 + (ruckSackPrayerBonus + bribeCapBonus) / 100);

  const mattyBagStampBonus = getStampBonus(account?.stamps, 'skills', 'StampB8', character);
  const masonJarStampBonus = getStampBonus(account?.stamps, 'misc', 'StampC2', character);
  const gemShopCarryBonus = account?.gemShopPurchases?.find((value, index) => index === 58) ?? 0;
  const extraBagsTalentBonus = getTalentBonus(character?.talents, 0, 'EXTRA_BAGS');
  const starSignExtraCap = getStarSignBonus(character, account, 'Carry_Cap');

  const charMaterialBag = character?.carryCapBags?.find(({ Class }) => Class === 'bCraft');
  const playerCapacity = getPlayerCapacity(charMaterialBag, {
    allCapacity,
    mattyBagStampBonus,
    masonJarStampBonus,
    gemShopCarryBonus,
    extraBagsTalentBonus,
    starSignExtraCap
  })

  stats.anvilCapacity = Math.round(playerCapacity * (2 + 0.1 * capPoints));
  const selectedProducts = anvilSelected
    .sort((a, b) => a - b)
    .map((item) => anvilProducts[item]);

  return {
    guild: account?.guild?.guildBonuses?.length > 0,
    stats,
    production,
    selected: selectedProducts,
  };
}

export const calcAnvilExp = (character, characters, account, anvilExp, xpPoints) => {
  const focusedSoulTalentBonus = getTalentBonus(character?.talents, 1, 'FOCUSED_SOUL');
  const happyDudeTalentBonus = getTalentBonus(character?.talents, 0, 'HAPPY_DUDE');
  const smithingCards = getCardBonusByEffect(account?.cards, 'Smithing_EXP_(Passive)');
  const blackSmithBoxBonus0 = getPostOfficeBonus(character?.postOffice, 'Blacksmith_Box', 0);
  const stampBonus = getStampsBonusByEffect(account?.stamps, 'SmithExp', character);
  const skillMasteryBonus = isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.smithing?.rank, 0);
  let leftHandOfLearningTalentBonus = getHighestTalentByClass(characters, 2, 'Maestro', 'LEFT_HAND_OF_LEARNING');
  const voidWalkerEnhancementEclipse = getHighestTalentByClass(characters, 3, 'Voidwalker', 'ENHANCEMENT_ECLIPSE');
  const leftHandEnhancement = getVoidWalkerTalentEnhancements(characters, account, voidWalkerEnhancementEclipse, 42);
  if (checkCharClass(character?.class, 'Maestro') && leftHandEnhancement) {
    leftHandOfLearningTalentBonus *= 2;
  }

  // "SmithingEXPmulti" == e
  const smithingExpMulti = Math.max(0.1, (1 +
      (focusedSoulTalentBonus
        + (stampBonus
          + (happyDudeTalentBonus
            + 25 * skillMasteryBonus))) / 100)
    * (1 + smithingCards / 100) *
    (1 + blackSmithBoxBonus0 / 100)
    + (anvilExp + leftHandOfLearningTalentBonus) / 100);

  const tempAnvilExp = getAnvilExp(xpPoints, smithingExpMulti);
  return 100 * (tempAnvilExp - 1);
};

export const getTimeTillCap = ({ hammers, currentAmount, currentProgress, requiredAmount, afkTime, stats }) => {
  const timePassed = (new Date().getTime() - afkTime) / 1000;
  const futureProduction = Math.min(Math.round(currentAmount + ((currentProgress + (timePassed * stats?.anvilSpeed / 3600)) / requiredAmount) * (hammers ?? 0)), stats?.anvilCapacity);
  return ((stats?.anvilCapacity - futureProduction) / (stats?.anvilSpeed / 3600 / requiredAmount * (hammers ?? 0)));
}

export const calcTotals = (account, characters) => {
  return account?.anvil?.reduce((result, anvil, index) => {
    const { stats, production } = getPlayerAnvil(characters?.[index], characters, account);
    const activeProduction = production?.filter(({ hammers }) => hammers > 0);
    activeProduction?.forEach((slot) => {
      const { hammers, rawName, requiredAmount } = slot;
      const perHour = Math.min(stats?.anvilSpeed * hammers / requiredAmount, stats?.anvilCapacity);
      if (result?.[rawName]) {
        result[rawName] += perHour;
      } else {
        result[rawName] = perHour
      }
    })
    return result;
  }, {})
}