import { tryToParse } from "@utility/helpers";
import { marketInfo, ninjaExtraInfo, seedInfo } from '../../data/website-data';
import { getCharmBonus, isJadeBonusUnlocked } from "@parsers/world-6/sneaking";
import { getStarSignBonus } from "@parsers/starSigns";
import { getVialsBonusByStat } from "@parsers/alchemy";
import { getJewelBonus, getLabBonus } from "@parsers/lab";
import { getWinnerBonus } from "@parsers/world-6/summoning";
import { getAchievementStatus } from "@parsers/achievements";
import { getVoteBonus } from "@parsers/world-2/voteBallot";
import { getGrimoireBonus } from "@parsers/grimoire";
import { getHighestTalentByClass } from "@parsers/talents";

export const getFarming = (idleonData: any, accountData: any, charactersData: any) => {
  const rawFarmingUpgrades = tryToParse(idleonData?.FarmUpg);
  const rawFarmingPlot = tryToParse(idleonData?.FarmPlot);
  const rawFarmingCrop = tryToParse(idleonData?.FarmCrop);
  const rawFarmingRanks = tryToParse(idleonData?.FarmRank);
  return parseFarming(rawFarmingUpgrades, rawFarmingPlot, rawFarmingCrop, rawFarmingRanks, accountData, charactersData);
}

const parseFarming = (rawFarmingUpgrades: any, rawFarmingPlot: any, rawFarmingCrop: any, rawFarmingRanks: any, account: any, charactersData: any) => {
  const gemVineBonus = account?.gemShopPurchases?.find((value: number, index: number) => index === 139);
  const marketLevels = rawFarmingUpgrades?.slice(2, marketInfo.length + 2);
  const beans = rawFarmingUpgrades?.[1];
  const instaGrow = rawFarmingUpgrades?.[19];
  const market = marketInfo?.map((upgrade, index) => {
    const { cropId, cropIdIncrement, cost, costExponent, bonusPerLvl, maxLvl, bonus } = upgrade;
    const level = marketLevels?.[index] ?? 0;
    return {
      ...upgrade,
      level,
      type: getCropType({ index, cropId, cropIdIncrement, level }),
      cost: cost * Math.pow(costExponent, level),
      nextUpgrades: getNextUpgradesReq({ index, cropId, cropIdIncrement, level, maxLvl, cost, costExponent }),
      costToMax: calcCostToMax({ level, maxLvl, cost, costExponent }),
      baseValue: bonus.includes('}') ? (1 + (level * bonusPerLvl) / 100) : level * bonusPerLvl
    }
  });
  let [farmingRanks, ranksProgress, upgradesLevels] = rawFarmingRanks || [];
  if (!Array.isArray(farmingRanks)) {
    farmingRanks = []
  }
  if (!Array.isArray(ranksProgress)) {
    ranksProgress = []
  }
  if (!Array.isArray(upgradesLevels)) {
    upgradesLevels = []
  }
  const totalPoints = farmingRanks?.reduce((sum: number, level: number) => sum + level, 0)
  const usedPoints = upgradesLevels?.reduce((sum: number, level: number) => sum + level, 0);
  const unlocks = (ninjaExtraInfo?.[37] as any)?.split(' ');
  const names = (ninjaExtraInfo?.[34] as any)?.split(' ');
  const bases = (ninjaExtraInfo?.[36] as any)?.split(' ')?.map((base: string) => parseFloat(base));
  const apocalypseWow = getHighestTalentByClass(charactersData, 4, 'Death_Bringer', 'DANK_RANKS') ?? 0;
  const ranks = (ninjaExtraInfo?.[35] as any)?.split(' ')?.map((description: string, index: number) => {
    const name = names?.[index];
    const base = bases?.[index];
    const upgradeLevel = upgradesLevels?.[index];
    const unlockAt = unlocks?.[index];
    const bonus = 4 === index || 9 === index || 14 === index || 19 === index
      ? Math.max(1, apocalypseWow) * base * upgradeLevel
      : Math.max(1, apocalypseWow) * ((1.7 * base * upgradeLevel) / (upgradeLevel + 80))

    return {
      name,
      description,
      bonus,
      upgradeLevel,
      unlockAt
    }
  });

  const plot = rawFarmingPlot?.map(([seedType, progress, cropType, isLocked, cropQuantity, currentOG, cropProgress]: number[], index: number) => {
    const type = Math.round(seedInfo?.[seedType]?.cropIdMin + cropType);
    const growthReq = 14400 * Math.pow(1.5, seedType);
    const rank = farmingRanks?.[index];
    const rankProgress = ranksProgress?.[index];
    const rankRequirement = (7 * rank + 25 * Math.floor(rank / 5) + 10) * Math.pow(1.11, rank);
    return {
      rank,
      rankProgress,
      rankRequirement,
      seedType,
      cropType: type,
      cropQuantity,
      cropProgress,
      progress,
      growthReq,
      isLocked,
      currentOG,
      cropRawName: `FarmCrop${type}.png`,
      seedRawName: `Seed_${seedType}.png`
    }
  });
  const marketExtraPlots = getMarketBonus(market, "LAND_PLOTS");
  const cropsOnVine = Math.floor(1 + ((marketExtraPlots + 20 * gemVineBonus) / 100))
  const cropsForBeans = Object.entries(rawFarmingCrop || {}).reduce((sum, [type, amount]: any) => {
    const seed = seedInfo.find((seed) => parseFloat(type) >= seed.cropIdMin && parseFloat(type) <= seed.cropIdMax);
    return sum + (parseFloat(amount) * Math.pow(2.5, (seed?.seedId ?? 0)) * Math.pow(1.08, type - (seed?.cropIdMin ?? 0)));
  }, 0);
  const jadeUpgrade = isJadeBonusUnlocked(account, 'Deal_Sweetening') ?? 0;
  const marketBonus = getMarketBonus(market, "MORE_BEENZ");
  const hasLandRank = getMarketBonus(market, "LAND_RANK");
  const achievementBonus = getAchievementStatus(account?.achievements, 363);
  const beanTrade = Math.pow(cropsForBeans, 0.5) * (1 + marketBonus / 100) * (1 + (25 * jadeUpgrade + 5 * achievementBonus) / 100);
  return {
    plot,
    crop: { ...rawFarmingCrop, beans },
    market,
    cropsFound: Object.keys(rawFarmingCrop || {}).length,
    cropsOnVine,
    instaGrow,
    beanTrade,
    ranks,
    totalPoints,
    usedPoints,
    hasLandRank,
    totalRanks: farmingRanks?.reduce((sum: number, rank: number) => sum + rank, 0)
  };
}

export const getRanksTotalBonus = (ranks: any, index: number) => {
  return 0 === index ? (1 + ranks?.[3]?.bonus / 100) * (1 + ranks?.[10]?.bonus / 100) * (1 + ranks?.[15]?.bonus / 100)
    : 1 === index ? ranks?.[8]?.bonus + ranks?.[17]?.bonus
      : 2 === index ? ranks?.[6]?.bonus + ranks?.[13]?.bonus
        : 3 === index ? ranks?.[7]?.bonus + (ranks?.[11]?.bonus + ranks?.[18]?.bonus)
          : 4 === index ? ranks?.[5]?.bonus + (ranks?.[12]?.bonus + ranks?.[16]?.bonus) : 1;
}

const getCropsWithStockEqualOrGreaterThan = (cropDepot: any, stockLimit: number): number => {
  return Object.values(cropDepot)?.filter((value: any) => value >= stockLimit).length;
}

const getMarketUpgradeBonusValue = (marketUpgrades: any[], cropDepot: any, upgradeId: number): number => {
  const upgrade = marketUpgrades.find((upgrade: any, index) => index === upgradeId);

  if (upgrade) {
    switch (upgradeId) {
      case 7:
        return upgrade.level * upgrade.bonusPerLvl;
      case 9: // GMO
        return getMarketUpgradeBonusValue(marketUpgrades, cropDepot, 15) * Math.pow(1 + upgrade.level * upgrade.bonusPerLvl / 100, getCropsWithStockEqualOrGreaterThan(cropDepot, 200));
      case 11:
        return 1 + (upgrade.level * upgrade.bonusPerLvl) / 100;
      case 10: //GMO
        return getMarketUpgradeBonusValue(marketUpgrades, cropDepot, 15) * (1 + upgrade.level * upgrade.bonusPerLvl * getCropsWithStockEqualOrGreaterThan(cropDepot, 1000) / 100);
      case 12: //GMO
        return getMarketUpgradeBonusValue(marketUpgrades, cropDepot, 15) * (1 + upgrade.level * upgrade.bonusPerLvl * getCropsWithStockEqualOrGreaterThan(cropDepot, 2500) / 100);
      case 13:
        // No bonus there yet
        return 0;
      case 14: //GMO
        return getMarketUpgradeBonusValue(marketUpgrades, cropDepot, 15) * (1 + (upgrade.level * upgrade.bonusPerLvl * getCropsWithStockEqualOrGreaterThan(cropDepot, 10000)) / 100);
      case 15: //GMO
        return 1 + (upgrade.level * upgrade.bonusPerLvl * getCropsWithStockEqualOrGreaterThan(cropDepot, 100000)) / 100;
      default:
        return upgrade.bonus.includes('}') ? (1 + (upgrade.level * upgrade.bonusPerLvl) / 100) : upgrade.level * upgrade.bonusPerLvl;
    }
  } else {
    return 0;
  }
}

export const updateFarming = (characters: any, account: any) => {
  const newMarket = account?.farming?.market?.map((upgrade: any, index: number) => {
    return {
      ...upgrade,
      value: getMarketUpgradeBonusValue(account?.farming?.market, account?.farming?.crop, index)
    }
  });
  // Growth
  const marketGrowthRate = getMarketBonus(newMarket, "NUTRITIOUS_SOIL");
  const speedGMO = getMarketBonus(newMarket, "SPEED_GMO", 'value');
  const vialBonus = getVialsBonusByStat(account?.alchemy?.vials, '6FarmSpd');
  const summoningBonus = getWinnerBonus(account, '<x Farming SPD');
  const growthRate = Math.max(1, speedGMO)
    * (1 + (marketGrowthRate + vialBonus) / 100)
    * (1 + summoningBonus / 100);
  const maxTimes = [0, 1, 2, 3, 4, 5].map((seedType) => {
    const growthReq = 14400 * Math.pow(1.5, seedType);
    const value = growthReq / growthRate;
    const breakdown = [
      { name: 'Base Growth Time', value: growthReq },
      { name: 'Speed GMO', value: Math.max(1, speedGMO) },
      { name: 'Nutritious Soil', value: 1 + marketGrowthRate / 100 },
      { name: 'Vial Bonus', value: 1 + vialBonus / 100 },
      { name: 'Summoning Bonus', value: 1 + summoningBonus / 100 }
    ];
    return { value, breakdown };
  });
  const newPlot = account?.farming?.plot?.map((crop: any) => {
    // OG Chance
    const marketOGChance = getMarketBonus(account?.farming?.market, "OG_FERTILIZER");
    const charmOGChange = getCharmBonus(account, 'Taffy_Disc');
    const starSignBonus = getStarSignBonus(characters?.[0], account, 'OG_Chance');
    const achievementBonus = getAchievementStatus(account?.achievements, 365)
    const nextOGChance = Math.pow(0.4, crop?.currentOG + 1)
      * Math.max(1, marketOGChance)
      * (1 + charmOGChange / 100)
      * (1 + starSignBonus / 100)
      * (1 + (2 * account?.tasks?.[2]?.[5]?.[2]) / 100)
      * (1 + (15 * achievementBonus) / 100);

    const timeLeft = (crop?.growthReq - crop?.cropProgress) / growthRate;
    const maxTimeLeft = crop?.growthReq / growthRate;
    const ogMulti = Math.min(1e9, Math.max(1, Math.pow(2, crop?.currentOG)));
    return {
      ...crop,
      nextOGChance,
      growthRate,
      ogMulti,
      timeLeft,
      maxTimeLeft
    }
  });
  return {
    ...(account?.farming || {}),
    plot: newPlot,
    cropDepot: getCropDepotBonuses(account),
    market: newMarket,
    maxTimes
  }
}

const getNextUpgradesReq = ({
                              index,
                              cropId,
                              cropIdIncrement,
                              level,
                              maxLvl,
                              cost,
                              costExponent,
                              isUnique = true
                            }: any) => {
  const upgradeMap = new Map();

  let extraLv = 0;

  while (upgradeMap.size < 4 && (level + extraLv < maxLvl)) {
    const type = getCropType({
      index,
      cropId,
      cropIdIncrement,
      level: level + extraLv
    });

    const localCost = cost * Math.pow(costExponent, level + extraLv);

    if (upgradeMap.has(type) && isUnique) {
      // If the type exists, add the cost to the existing total
      upgradeMap.set(type, upgradeMap.get(type) + localCost);
    } else {
      // Otherwise, initialize a new entry in the map
      upgradeMap.set(type, localCost);
    }

    extraLv++;
  }

  // Convert map to array of objects for easier manipulation
  return Array.from(upgradeMap.entries()).map(([type, cost]) => ({ type, cost }));
}

const getCropType = ({ index, cropId, cropIdIncrement, level }: any) => {
  return index === 0 ? Math.floor(cropId + cropIdIncrement *
      (level + (2 * Math.floor(level / 3) + Math.floor(level / 4))))
    : Math.floor(cropId + cropIdIncrement
      * level)
}

const getCropDepotBonuses = (account: any) => {
  // 'CropSCbonus' == e
  const labBonus = getLabBonus(account?.lab?.labBonuses, 17);
  const spelunkerObolMulti = getLabBonus(account?.lab.labBonuses, 8); // gem multi
  const pureOpalRhombolJewel = getJewelBonus(account?.lab?.jewels, 20, spelunkerObolMulti);
  const grimoireBonus = 1 + getGrimoireBonus(account?.grimoire?.upgrades, 22) / 100;

  let bonuses = {
    damage: { name: 'DMG', value: 0 },
    gamingEvo: { name: 'Gaming Evo', value: 0 },
    jadeCoin: { name: 'Jade Coin', value: 0 },
    cookingSpeed: { name: 'Meal Spd', value: 0 },
    cash: { name: 'Cash', value: 0 },
    shiny: { name: 'Pet Rate', value: 0 },
    critters: { name: 'Critters', value: 0 },
    dropRate: { name: 'Drop Rate', value: 0 },
  };
  if (isJadeBonusUnlocked(account, 'Reinforced_Science_Pencil')) {
    bonuses.damage.value = 20 * Math.round(account?.farming?.cropsFound) * (1 + (labBonus + pureOpalRhombolJewel) / 100) * grimoireBonus;
  }
  if (isJadeBonusUnlocked(account, 'Science_Pen')) {
    bonuses.gamingEvo.value = Math.pow(1.02, Math.round(account?.farming?.cropsFound)) * (1 + (labBonus + pureOpalRhombolJewel) / 100) * grimoireBonus;
  }
  if (isJadeBonusUnlocked(account, 'Science_Marker')) {
    bonuses.jadeCoin.value = 8 * Math.round(account?.farming?.cropsFound) * (1 + (labBonus + pureOpalRhombolJewel) / 100) * grimoireBonus;
  }
  if (isJadeBonusUnlocked(account, 'Science_Featherpen')) {
    bonuses.cookingSpeed.value = Math.pow(1.1, Math.round(account?.farming?.cropsFound)) * (1 + (labBonus + pureOpalRhombolJewel) / 100) * grimoireBonus;
  }
  if (isJadeBonusUnlocked(account, 'Science_Environmentally_Sourced_Pencil')) {
    bonuses.cash.value = 15 * Math.round(account?.farming?.cropsFound) * (1 + (labBonus + pureOpalRhombolJewel) / 100) * grimoireBonus;
  }
  if (isJadeBonusUnlocked(account, 'Science_Crayon')) {
    bonuses.shiny.value = 7 * Math.round(account?.farming?.cropsFound) * (1 + (labBonus + pureOpalRhombolJewel) / 100) * grimoireBonus;
  }
  if (isJadeBonusUnlocked(account, 'Science_Paintbrush')) {
    bonuses.critters.value = 0.1 * Math.round(account?.farming?.cropsFound) * (1 + (labBonus + pureOpalRhombolJewel) / 100) * grimoireBonus;
  }
  if (isJadeBonusUnlocked(account, 'Science_Highlighter')) {
    bonuses.dropRate.value = Math.round(Math.max(0, account?.farming?.cropsFound - 100)) * (1 + (labBonus + pureOpalRhombolJewel) / 100) * grimoireBonus;
  }
  return bonuses;
}

const getMarketBonus = (market: any, bonusName: string, value = 'baseValue') => {
  return (market?.find(({ name }: { name: string }) => name === bonusName) as any)?.[value] ?? 0;
}

export const getLandRank = (ranks: any, bonusName: string) => {
  return (ranks?.find(({ name }: { name: string }) => name === bonusName) as any);
}

const calcCostToMax = ({ level, maxLvl, cost, costExponent }: any) => {
  let costToMax = 0;
  for (let i = level; i < maxLvl; i++) {
    costToMax += cost * Math.pow(costExponent, i)
  }
  return costToMax ?? 0;
}

export const getTotalCrop = (plot: any[], market: any[], ranks: any[], account: any) => {
  return plot?.reduce((total, { seedType, cropQuantity, cropRawName, ogMulti, rank }) => {
    if (seedType === -1) return total;
    const { productDoubler } = getProductDoubler(market);
    const productionBoost = getLandRank(ranks, 'Production_Boost');
    const voteBonus = getVoteBonus(account, 29);
    const speedGMO = getMarketBonus(account?.farming?.market, "VALUE_GMO", 'value');
    const finalMulti = Math.min(1e4, Math.round(Math.max(1, Math.floor(1 + (productDoubler / 100)))
      * (1 + getRanksTotalBonus(ranks, 1) / 100)
      * Math.max(1, speedGMO)
      * (1 + (productionBoost?.bonus * (rank ?? 0)
        + voteBonus) / 100)));
    return {
      ...total,
      [cropRawName]: (total?.[cropRawName] || 0) + (cropQuantity * ogMulti * finalMulti)
    }
  }, {});
}

export const getProductDoubler = (market: any[]): { productDoubler: any, percent: number, multi: number } => {
  const productDoubler = (market?.[5]?.value || 0);
  const multi = productDoubler / 100;
  const percent = productDoubler % 100;
  return { productDoubler, percent, multi: Math.max(2, Math.floor(multi) + 1) };
}