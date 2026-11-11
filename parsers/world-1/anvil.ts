import { anvilProducts, anvilUpgradeCost, items } from '@website-data';
import { getSpeedBonusFromAgility, isMasteryBonusUnlocked } from '@parsers/misc';
import { getActiveBubbleBonus, getBubbleBonus } from '@parsers/world-2/alchemy';
import { checkCharClass, CLASSES, getMaestroHand, getTalentBonus } from '@parsers/talents';
import { getStarSignBonus } from '@parsers/starSigns';
import { getCardBonusByEffect } from '@parsers/cards';
import { getStampBonus, getStampsBonusByEffect } from '@parsers/world-1/stamps';
import { getStatueBonus } from '@parsers/world-1/statues';
import { getPostOfficeBonus } from '@parsers/world-3/postoffice';
import { getUpgradeVaultBonus } from '@parsers/misc/upgradeVault';
import { getAllSkillsExp } from '@parsers/character';
import { additiveGroup, createBreakdown, evaluateBreakdownNode, flat, multiplier, NUMBERED_GROUP, percent, sumGroup } from '@parsers/breakdown';
import type { BreakdownGroup, BreakdownLine } from '@parsers/breakdown';
import { cleanUnderscore, notateNumber } from '@utility/helpers';

export const getAnvilSpeed = (agility = 0, speedPoints: any, stampBonus = 0, poBoxBonus = 0, hammerHammerBonus = 0, statueBonus = 0, starSignTownSpeed = 0, talentTownSpeed = 0, upgradeVaultBonus = 0) => {
  const boxAndStatueMath = 1 + ((poBoxBonus + statueBonus + upgradeVaultBonus) / 100);
  const agilityBonus = getSpeedBonusFromAgility(agility);
  return (1 + (stampBonus + (2 * speedPoints)) / 100)
    * boxAndStatueMath
    * (1 + (hammerHammerBonus / 100))
    * agilityBonus
    * (1 + (starSignTownSpeed + talentTownSpeed) / 100);
}

export const getTotalMonsterMatCost = ({ costThreshold, startingIndex }: any = {}, pointsFromMats: any, anvilCostReduction: any) => {
  if (!costThreshold) return 0;
  let totalMaterials = 0;
  for (let point = startingIndex; point < pointsFromMats; point++) {
    totalMaterials += getMonsterMatCost(point, anvilCostReduction);
  }
  return totalMaterials;
}

export const getMonsterMatCost = (pointsFromMats: any, anvilCostReduction: any) => {
  return Math.round((Math.pow(pointsFromMats + 1, 1.5) + pointsFromMats) * Math.max(0.1, 1 - anvilCostReduction / 100))
}

export const getAnvilUpgradeCostItem = (pointsFromMats: any) => {
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


export const getTotalCoinCost = (pointsFromMats: any, anvilCostReduction: any) => {
  let totalMaterials = 0;
  for (let point = 0; point < pointsFromMats; point++) {
    totalMaterials += getCoinCost(point, anvilCostReduction);
  }
  return totalMaterials;
}

export const getCoinCost = (pointsFromCoins: any, anvilCostReduction: any, _unused2?: any) => {
  const baseCost = Math.pow(pointsFromCoins, 3) + 50;
  return Math.round(baseCost * (1 + pointsFromCoins / 100) * Math.max(0.1, 1 - anvilCostReduction / 100));
}

// game: the anvil sells points for coins below 600 and for monster materials below 700
const MAX_POINTS_FROM_COINS = 600;
const MAX_POINTS_FROM_MATS = 700;

// game: Costs2TypeAnvilPA, the material the point after `points` costs
const getMatItemForPoint = (points: number) =>
  (anvilUpgradeCost.find(({ costThreshold }) => points < costThreshold) ?? anvilUpgradeCost[anvilUpgradeCost.length - 1])?.rawName;

// Every material the points still for sale cost, in the order the anvil asks for them
export const getMatsToMax = (pointsFromMats = 0, anvilCostReduction = 0) => {
  const totals: { rawName: string, amount: number, points: number }[] = [];
  for (let point = pointsFromMats; point < MAX_POINTS_FROM_MATS; point++) {
    const rawName = getMatItemForPoint(point);
    const last = totals[totals.length - 1];
    const cost = getMonsterMatCost(point, anvilCostReduction);
    if (last?.rawName === rawName) {
      last.amount += cost;
      last.points += 1;
    } else totals.push({ rawName, amount: cost, points: 1 });
  }
  return totals;
}

// game: AnvilPAstats[0] is set to this less the points spent: Smithing level, Acme Anvil and the bought points
export const getAnvilTotalPoints = ({ pointsFromCoins = 0, pointsFromMats = 0, pointsFromAcme = 0 }: any = {}, smithingLevel = 0) =>
  pointsFromCoins + pointsFromMats + pointsFromAcme + smithingLevel;
export const getCoinToMax = (pointsFromCoins: any, anvilCostReduction: any) => {
  let costToMax = 0;
  for (let i = pointsFromCoins; i < MAX_POINTS_FROM_COINS; i++) {
    costToMax += getCoinCost(i, anvilCostReduction, true);
  }
  return costToMax ?? 0;
}

export const getAnvilExp = (xpPoints: any, smithingExpMulti: any) => {
  // "ProdExpBonus" == e
  const baseMath = (1 + (3 * xpPoints / 100)) * smithingExpMulti;
  if (baseMath < 20) return baseMath;
  return Math.min(20 + ((baseMath - 20) / (baseMath - 20 + 70)) * 50, 75);
}

export const getAnvil = (char: any, character: any) => {
  const anvilProduction = char?.[`AnvilPA`];
  const basePointsFromAcme = getTalentBonus(character?.flatTalents, 'ACME_ANVIL');
  let pointsFromAcme = 0;
  if (basePointsFromAcme) {
    // A low-progress save's SkillLevels array stops short of 281, and a brand new character has no
    // smithing level yet. Both are additive point sources, so the identity is 0.
    pointsFromAcme = (char?.['SkillLevels']?.[281] ?? 0)
      + basePointsFromAcme * Math.floor((character?.skillsInfo?.smithing?.level ?? 0) / 10);
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

export const getPlayerAnvil = (character: any, characters: any, account: any) => {
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
  const production = anvilProduction?.reduce((res: any, item: any, index: any) => {
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
        hammers: anvilSelected?.filter((item: any) => item === index)?.length
      }
    ]
  }, []);

  const stats: any = {
    availablePoints,
    pointsFromCoins,
    pointsFromMats,
    pointsFromAcme,
    xpPoints,
    speedPoints,
    capPoints
  };

  const isArcher = checkCharClass(character?.class, CLASSES.Archer);
  const anvilCostReduction = getBubbleBonus(account, 'ANVILNOMICS', false, isArcher);
  const anvilCost = getAnvilUpgradeCostItem(pointsFromMats);

  stats.anvilCost = {
    ...anvilCost,
    totalMats: getTotalMonsterMatCost(anvilCost, pointsFromMats, anvilCostReduction),
    nextMatUpgrade: getMonsterMatCost(pointsFromMats, anvilCostReduction),
    totalCoins: getTotalCoinCost(pointsFromCoins, anvilCostReduction),
    nextCoinUpgrade: getCoinCost(pointsFromCoins, anvilCostReduction, true),
    coinsToMax: getCoinToMax(pointsFromCoins, anvilCostReduction),
    matsToMax: getMatsToMax(pointsFromMats, anvilCostReduction)
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
  stats.speedBreakdown = createBreakdown('Anvil speed', `${notateNumber(stats.anvilSpeed, 'Big')} / hr`, [
    flat('Base', 3600),
    additiveGroup(NUMBERED_GROUP, [percent('Anvil Zoomer Stamp', anvilZoomerBonus), percent('Speed points', 2 * (speedPoints ?? 0))]),
    additiveGroup(NUMBERED_GROUP, [percent('Blacksmith Box', blackSmithBoxBonus1), percent('Anvil Statue', anvilStatueBonus),
      percent('Upgrade Vault', upgradeVaultBonus)]),
    multiplier('Hammer Hammer (Bubble)', 1 + hammerHammerBonus / 100),
    multiplier('Agility', getSpeedBonusFromAgility(character?.stats?.agility)),
    additiveGroup(NUMBERED_GROUP, [percent('Star Signs', bobBuildGuyStarSign), percent('Broken Time (Talent)', talentTownSpeedBonus)])
  ]);
  // game: ProdExpBonus, what each craft's EXP is multiplied by
  stats.expMulti = 1 + calcAnvilExp(character, characters, account, stats.baseAnvilExp, xpPoints) / 100;

  const charMaterialBag = character?.carryCapBags?.find(({ Class }: any) => Class === 'bCraft');
  stats.anvilCapacity = Math.round(Math.min(2e9, charMaterialBag?.capacityPerSlot * (2 + 0.1 * capPoints)));
  const selectedProducts = anvilSelected
    .sort((a: any, b: any) => a - b)
    .map((item: any) => anvilProducts[item]);

  return {
    guild: account?.guild?.unlocked === true,
    stats,
    production,
    selected: selectedProducts
  };
}

export const calcAnvilExp = (character: any, characters: any, account: any, anvilExp: any, xpPoints: any) => {
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
                               }: any) => {
  const productionRate = (stats?.anvilSpeed / 3600 / requiredAmount) * (hammers ?? 0);

  if (fromZero) {
    return stats?.anvilCapacity / productionRate;
  }

  const futureProduction = getAnvilFutureProduction({ hammers, currentAmount, currentProgress, requiredAmount, afkTime, stats });

  return (stats?.anvilCapacity - futureProduction) / productionRate;
};

// game: AFKcode("AnvilPA") adds ProductionSpeed * seconds to the product's progress once per hammer on it,
// then turns whole requiredAmount chunks into items, floored and capped at the anvil capacity
export const getAnvilFutureProduction = ({
                                           hammers,
                                           currentAmount = 0,
                                           currentProgress = 0,
                                           requiredAmount,
                                           afkTime,
                                           stats
                                         }: any) => {
  const timePassed = (Date.now() - afkTime) / 1000;
  const progress = currentProgress + (hammers ?? 0) * timePassed * stats?.anvilSpeed / 3600;
  return Math.min(currentAmount + Math.floor(progress / requiredAmount), stats?.anvilCapacity);
};
// game: each craft adds its EXP times ProdExpBonus to the slot's EXP, so the EXP waiting grows with the items made
export const getAnvilFutureExp = (slot: any) => {
  const made = Math.max(0, getAnvilFutureProduction(slot) - (slot?.currentAmount ?? 0));
  return (slot?.currentXP ?? 0) + made * (slot?.stats?.expMulti ?? 1) * (slot?.exp ?? 0);
};

// A character's Smithing EXP an hour from the anvil, every product being made counted until it fills
export const getAnvilExpPerHour = (stats: any, production: any[] = []) => production
  .filter(({ hammers }: any) => hammers > 0)
  .reduce((sum: number, slot: any) => sum + getAnvilSlotPerHour(stats, slot) * (stats?.expMulti ?? 1) * (slot?.exp ?? 0), 0);

export const getAnvilProductCatalog = () => Object.values(anvilProducts as Record<string, any>)
  .map((product: any) => ({
    ...product,
    displayName: items?.[product?.rawName]?.displayName ?? product?.rawName
  }));

// A slot's hourly output: it makes no more an hour than its cap holds
export const getAnvilSlotPerHour = (stats: any, { hammers, requiredAmount }: any): number =>
  Math.min((stats?.anvilSpeed ?? 0) * hammers / requiredAmount, stats?.anvilCapacity ?? 0);

// Each product's hourly output, one line per character producing it
const getAnvilProductionGroups = (account: any, characters: any): Record<string, BreakdownGroup> => {
  const lines: Record<string, BreakdownLine[]> = {};
  account?.anvil?.forEach((_: any, index: any) => {
    const { stats, production } = getPlayerAnvil(characters?.[index], characters, account);
    production?.filter(({ hammers }: any) => hammers > 0)?.forEach((slot: any) => {
      (lines[slot.rawName] ??= []).push(flat(characters?.[index]?.name ?? `Character ${index + 1}`, getAnvilSlotPerHour(stats, slot)));
    });
  });
  return Object.fromEntries(Object.entries(lines).map(([rawName, productLines]) =>
    [rawName, sumGroup('Anvil output', productLines)]));
}

export const calcTotals = (account: any, characters: any) => Object.fromEntries(Object.entries(getAnvilProductionGroups(account, characters))
  .map(([rawName, group]) => [rawName, evaluateBreakdownNode(group)]));

export const getAnvilTotalsBreakdowns = (account: any, characters: any) => Object.fromEntries(Object.entries(getAnvilProductionGroups(account, characters))
  .map(([rawName, group]) => {
    const perHour = evaluateBreakdownNode(group);
    const name = cleanUnderscore((items as any)?.[rawName]?.displayName ?? rawName);
    return [rawName, createBreakdown(`${name} per hour`, `${notateNumber(perHour, 'Big')} / hr`, group.children, { combine: 'sum' })];
  }));
// Smithing EXP an hour from every character's anvil, one line per character
export const getAnvilExpBreakdown = (account: any, characters: any) => {
  const lines = (account?.anvil ?? []).map((_: any, index: any) => {
    const { stats, production } = getPlayerAnvil(characters?.[index], characters, account);
    return flat(characters?.[index]?.name ?? `Character ${index + 1}`, getAnvilExpPerHour(stats, production));
  }).filter(({ value }: any) => value > 0);
  const perHour = evaluateBreakdownNode(sumGroup('Smithing EXP', lines));
  return { perHour, breakdown: createBreakdown('Smithing EXP per hour', `${notateNumber(perHour, 'Big')} / hr`, lines, { combine: 'sum' }) };
};
