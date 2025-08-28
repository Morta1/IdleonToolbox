import { anvilProducts, anvilUpgradeCost, items } from '../data/website-data';
import { getSpeedBonusFromAgility, isMasteryBonusUnlocked } from './misc';
import { getActiveBubbleBonus, getBubbleBonus } from './alchemy';
import { checkCharClass, CLASSES, getMaestroHand, getTalentBonus } from './talents';
import { getStarSignBonus } from './starSigns';
import { getCardBonusByEffect } from './cards';
import { getStampBonus, getStampsBonusByEffect } from './stamps';
import { getStatueBonus } from './statues';
import { getPostOfficeBonus } from './postoffice';
import { getUpgradeVaultBonus } from '@parsers/misc/upgradeVault';
import { getAllSkillsExp } from '@parsers/character';

export const getAnvilSpeed = (agility = 0, speedPoints, stampBonus = 0, poBoxBonus = 0, hammerHammerBonus = 0, statueBonus = 0, starSignTownSpeed = 0, talentTownSpeed = 0, upgradeVaultBonus = 0) => {
  const boxAndStatueMath = 1 + ((poBoxBonus + statueBonus + upgradeVaultBonus) / 100);
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

export const getAnvil = (char, character) => {
  const anvilProduction = char?.[`AnvilPA`];
  const basePointsFromAcme = getTalentBonus(character?.flatTalents, 'ACME_ANVIL');
  let pointsFromAcme = 0;
  if (basePointsFromAcme) {
    pointsFromAcme = char?.['SkillLevels']?.[281] + basePointsFromAcme * Math.floor(character?.skillsInfo?.smithing?.level / 10);
  }
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
    pointsFromAcme,
    xpPoints,
    speedPoints,
    capPoints
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
    pointsFromAcme,
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
        displayName: items?.[anvilProducts?.[index]?.rawName]?.displayName,
        hammers: anvilSelected?.filter((item) => item === index)?.length
      }
    ]
  }, []);

  const stats = {
    availablePoints,
    pointsFromCoins,
    pointsFromMats,
    pointsFromAcme,
    xpPoints,
    speedPoints,
    capPoints
  };

  const anvilnomicsBubbleBonus = getBubbleBonus(account, 'ANVILNOMICS');
  const isArcher = checkCharClass(character?.class, CLASSES.Archer);
  const archerMultiBubble = isArcher ? getBubbleBonus(account, 'ARCHER_OR_BUST') : 1;
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

  stats.baseAnvilExp = getAllSkillsExp(character, characters, account)?.value;

  // ANVIL SPEED MATH;
  const anvilZoomerBonus = getStampBonus(account, 'skills', 'StampB3', character);
  const blackSmithBoxBonus1 = getPostOfficeBonus(character?.postOffice, 'Blacksmith_Box', 1);
  const hammerHammerBonus = getActiveBubbleBonus(character?.equippedBubbles, 'HAMMER_HAMMER', account);
  const anvilStatueBonus = getStatueBonus(account, 11, character?.flatTalents);
  const bobBuildGuyStarSign = getStarSignBonus(character, account, 'Speed_in_Town');
  const talentTownSpeedBonus = getTalentBonus(character?.flatTalents, 'BROKEN_TIME');
  const upgradeVaultBonus = getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 24);
  stats.anvilSpeed = 3600 * getAnvilSpeed(character?.stats?.agility, speedPoints, anvilZoomerBonus, blackSmithBoxBonus1, hammerHammerBonus, anvilStatueBonus, bobBuildGuyStarSign, talentTownSpeedBonus, upgradeVaultBonus);

  const charMaterialBag = character?.carryCapBags?.find(({ Class }) => Class === 'bCraft');
  stats.anvilCapacity = Math.round(charMaterialBag?.capacityPerSlot * (2 + 0.1 * capPoints));
  const selectedProducts = anvilSelected
    .sort((a, b) => a - b)
    .map((item) => anvilProducts[item]);

  return {
    guild: account?.guild?.guildBonuses?.length > 0,
    stats,
    production,
    selected: selectedProducts
  };
}

export const calcAnvilExp = (character, characters, account, anvilExp, xpPoints) => {
  const focusedSoulTalentBonus = getTalentBonus(character?.flatTalents, 'FOCUSED_SOUL');
  const happyDudeTalentBonus = getTalentBonus(character?.flatTalents, 'HAPPY_DUDE');
  const smithingCards = getCardBonusByEffect(account?.cards, 'Smithing_EXP_(Passive)');
  const blackSmithBoxBonus0 = getPostOfficeBonus(character?.postOffice, 'Blacksmith_Box', 0);
  const stampBonus = getStampsBonusByEffect(account, 'SmithExp', character);
  const skillMasteryBonus = isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.smithing?.rank, 0);
  const leftHandTalentBonus = getMaestroHand(character, 'smithing', characters, account, 'LEFT_HAND_OF_LEARNING');

  // "SmithingEXPmulti" == e
  const smithingExpMulti = Math.max(0.1, (1 +
      (focusedSoulTalentBonus
        + (stampBonus
          + (happyDudeTalentBonus
            + 25 * skillMasteryBonus))) / 100)
    * (1 + smithingCards / 100) *
    (1 + blackSmithBoxBonus0 / 100)
    + (anvilExp + leftHandTalentBonus) / 100);

  const tempAnvilExp = getAnvilExp(xpPoints, smithingExpMulti);
  return 100 * (tempAnvilExp - 1);
};

export const getTimeTillCap = ({
                                 hammers,
                                 currentAmount = 0,
                                 currentProgress = 0,
                                 requiredAmount,
                                 afkTime,
                                 stats,
                                 fromZero = false
                               }) => {
  const productionRate = (stats?.anvilSpeed / 3600 / requiredAmount) * (hammers ?? 0);

  if (fromZero) {
    return stats?.anvilCapacity / productionRate;
  }

  const timePassed = (Date.now() - afkTime) / 1000;

  const futureProduction = Math.min(
    Math.round(
      currentAmount + ((currentProgress + timePassed * stats?.anvilSpeed / 3600) / requiredAmount) * (hammers ?? 0)
    ),
    stats?.anvilCapacity
  );

  return (stats?.anvilCapacity - futureProduction) / productionRate;
};
export const calcTotals = (account, characters) => {
  return account?.anvil?.reduce((result, anvil, index) => {
    const { stats, production } = getPlayerAnvil(characters?.[index], characters, account);
    const activeProduction = production?.filter(({ hammers }) => hammers > 0);
    activeProduction?.forEach((slot) => {
      const { hammers, rawName, requiredAmount } = slot;
      const perHour = Math.min(stats?.anvilSpeed * hammers / requiredAmount, stats?.anvilCapacity);
      if (result?.[rawName]) {
        result[rawName] += perHour;
      }
      else {
        result[rawName] = perHour
      }
    })
    return result;
  }, {})
}