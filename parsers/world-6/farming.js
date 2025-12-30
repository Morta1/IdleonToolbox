import { tryToParse } from "@utility/helpers";
import { exoticMarketInfo, marketInfo, ninjaExtraInfo, seedInfo } from '@website-data';
import { getCharmBonus, isJadeBonusUnlocked } from "@parsers/world-6/sneaking";
import { getStarSignBonus } from "@parsers/starSigns";
import { getBubbleBonus, getVialsBonusByEffect, getVialsBonusByStat } from "@parsers/alchemy";
import { getJewelBonus, getLabBonus } from "@parsers/lab";
import { getWinnerBonus } from "@parsers/world-6/summoning";
import { getAchievementStatus } from "@parsers/achievements";
import { getVoteBonus } from "@parsers/world-2/voteBallot";
import { getGrimoireBonus } from "@parsers/grimoire";
import { CLASSES, getHighestTalentByClass, getTalentBonus } from "@parsers/talents";
import { getKillroyBonus, isMasteryBonusUnlocked } from "@parsers/misc";
import { getLampBonus } from "@parsers/world-5/caverns/the-lamp";
import { getMealsBonusByEffectOrStat } from "@parsers/cooking";
import { getMonumentBonus } from "@parsers/world-5/caverns/bravery";
import { getStampsBonusByEffect } from "@parsers/stamps";
import { getEmperorBonus } from "./emperor";
import LavaRand from '../../utility/lavaRand';

export const getFarming = (idleonData, accountData, charactersData) => {
  const rawFarmingUpgrades = tryToParse(idleonData?.FarmUpg);
  const rawFarmingPlot = tryToParse(idleonData?.FarmPlot);
  const rawFarmingCrop = tryToParse(idleonData?.FarmCrop);
  const rawFarmingRanks = tryToParse(idleonData?.FarmRank);
  return parseFarming(rawFarmingUpgrades, rawFarmingPlot, rawFarmingCrop, rawFarmingRanks, accountData, charactersData);
}

const parseFarming = (rawFarmingUpgrades, rawFarmingPlot, rawFarmingCrop, rawFarmingRanks, account, charactersData) => {
  const gemVineBonus = account?.gemShopPurchases?.find((value, index) => index === 139);
  const marketLevels = rawFarmingUpgrades?.slice(2, marketInfo.length + 2);
  const beans = rawFarmingUpgrades?.[1];
  const instaGrow = rawFarmingUpgrades?.[19];
  const market = marketInfo?.map((upgrade, index) => {
    const { cropId, cropIdIncrement, cost, costExponent, bonusPerLvl, maxLvl, bonus } = upgrade;
    const level = marketLevels?.[index] ?? 0;
    const emperorBonus = getEmperorBonus(account, 2);
    const emperorCostCalc = Math.max(0.001, 1 - emperorBonus / (emperorBonus + 100));
    const calculatedCost = emperorCostCalc * cost * Math.pow(costExponent, level);
    return {
      ...upgrade,
      level,
      type: getCropType({ index, cropId, cropIdIncrement, level }),
      cost: calculatedCost,
      nextUpgrades: getNextUpgradesReq({
        index,
        cropId,
        cropIdIncrement,
        level,
        maxLvl,
        cost,
        costExponent,
        emperorCostCalc
      }),
      costToMax: calcCostToMax({ level, maxLvl, cost, costExponent, emperorCostCalc }),
      baseValue: bonus.includes('}') ? (1 + (level * bonusPerLvl) / 100) : level * bonusPerLvl
    }
  });
  const availableExoticIndices = getExoticMarketRotation(account);

  const exoticMarket = exoticMarketInfo?.map((upgrade, index) => {
    const level = rawFarmingUpgrades?.[20 + index] ?? 0;

    // Calculate the actual bonus based on the formula type
    let calculatedBonus;
    if (upgrade.type === 1) {
      // Diminishing returns formula
      calculatedBonus = upgrade.baseValue * (level / (1000 + level));
    } else {
      // Linear formula (x4 === 0)
      calculatedBonus = upgrade.baseValue * level;
    }

    let displayText;
    if (level === 0) {
      displayText = upgrade.bonus.replace(/[{}$]/g, "0");
    } else {
      displayText = upgrade.bonus
        .replace('{', Math.round(calculatedBonus * 100) / 100 + "")
        .replace('}', Math.round((1 + calculatedBonus / 100) * 100) / 100 + "")
        .replace('$', Math.ceil(calculatedBonus) + "");
    }

    return {
      ...upgrade,
      level,
      value: calculatedBonus, // Round for display,
      isAvailableThisWeek: availableExoticIndices.includes(index),
      displayText
    }
  }).filter(({ name }) => name !== 'NAME_MAGNI');

  // Calculate total levels purchased (equivalent to ExoticFarmDN)
  const totalExoticLevels = exoticMarket.reduce((sum, item) => sum + item.level, 0);

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
  const totalPoints = farmingRanks?.reduce((sum, level) => sum + level, 0)
  const usedPoints = upgradesLevels?.reduce((sum, level) => sum + level, 0);
  const unlocks = (ninjaExtraInfo?.[37])?.split(' ');
  const names = (ninjaExtraInfo?.[34])?.split(' ');
  const bases = (ninjaExtraInfo?.[36])?.split(' ')?.map((base) => parseFloat(base));
  const apocalypseWow = getHighestTalentByClass(charactersData, CLASSES.Death_Bringer, 'DANK_RANKS') ?? 0;
  const exoticBonus14 = getExoticMarketBonus(account, 14) ?? 0;
  const ranks = (ninjaExtraInfo?.[35])?.split(' ')?.map((description, index) => {
    const name = names?.[index];
    const base = bases?.[index];
    const upgradeLevel = upgradesLevels?.[index];
    const unlockAt = unlocks?.[index];
    const bonus = 4 === index || 9 === index || 14 === index || 19 === index
      ? Math.max(1, apocalypseWow) * (1 + exoticBonus14 / 100) * base * upgradeLevel
      : Math.max(1, apocalypseWow) * (1 + exoticBonus14 / 100) * ((1.7 * base * upgradeLevel) / (upgradeLevel + 80))

    return {
      name,
      description,
      bonus,
      upgradeLevel,
      unlockAt
    }
  });

  const plot = rawFarmingPlot?.map(([seedType, progress, cropType, isLocked, cropQuantity, currentOG, cropProgress], cropIndex) => {
    const seed = seedInfo?.[seedType];
    const type = Math.round(seed?.cropIdMin + cropType);
    const growthReq = 14400 * Math.pow(1.5, seedType);
    const rank = farmingRanks?.[cropIndex];
    const rankProgress = ranksProgress?.[cropIndex];
    const rankRequirement = (7 * rank + 25 * Math.floor(rank / 5) + 10) * Math.pow(1.11, rank);
    return {
      seed,
      index: cropIndex,
      rank,
      rankProgress,
      rankRequirement,
      seedType,
      baseCropType: cropType,
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
  const cropsForBeans = Object.entries(rawFarmingCrop || {}).reduce((sum, [type, amount]) => {
    const seed = seedInfo.find((seed) => parseFloat(type) >= seed.cropIdMin && parseFloat(type) <= seed.cropIdMax);
    return sum + (parseFloat(amount) * Math.pow(2.5, (seed?.seedId ?? 0)) * Math.pow(1.08, type - (seed?.cropIdMin ?? 0)));
  }, 0);
  const jadeUpgrade = isJadeBonusUnlocked(account, 'Deal_Sweetening') ?? 0;
  const marketBonus = getMarketBonus(market, "MORE_BEENZ");
  const hasLandRank = getMarketBonus(market, "LAND_RANK");
  const achievementBonus = getAchievementStatus(account?.achievements, 363);
  const exoticBonus16 = getExoticMarketBonus(account, 16) ?? 0;
  const exoticBonus17 = getExoticMarketBonus(account, 17) ?? 0;
  const exoticBonus18 = getExoticMarketBonus(account, 18) ?? 0;
  const exoticBonus19 = getExoticMarketBonus(account, 19) ?? 0;
  const exoticBonus20 = getExoticMarketBonus(account, 20) ?? 0;

  const beanTrade = Math.pow(cropsForBeans, 0.5)
    * (1 + marketBonus / 100)
    * (1 + (25 * jadeUpgrade + (5 * achievementBonus + (exoticBonus16 + (exoticBonus17 + exoticBonus18)))) / 100)
    * (1 + exoticBonus19 / 100)
    * (1 + exoticBonus20 / 100);

  return {
    plot,
    crop: { ...rawFarmingCrop, beans },
    market,
    exoticMarket,
    totalExoticLevels,
    cropsFound: Object.keys(rawFarmingCrop || {}).length,
    cropsOnVine,
    instaGrow,
    beanTrade,
    ranks,
    totalPoints,
    usedPoints,
    hasLandRank,
    totalRanks: farmingRanks?.reduce((sum, rank) => sum + rank, 0),
    exoticMarkeMaxPurchases: 4,
    exoticMarketUpgradesPurchased: account?.accountOptions?.[416]
  };
}

export const getExoticMarketRotation = (account) => {
  if (!account?.timeAway?.GlobalTime) return [];

  const currentWeek = Math.floor(account.timeAway.GlobalTime / 604_800); // 1 week in seconds
  const seed = Math.round(100 * currentWeek);

  const selectedUpgrades = [];

  for (let i = 0; i < 8; i++) {
    let attempts = 0;
    let upgradeIndex;

    do {
      const currentSeed = seed + i + attempts * 1000;
      const rng = new LavaRand(currentSeed);
      const random = rng.rand();

      // Generate index 0–59
      upgradeIndex = Math.floor(Math.max(0, Math.min(59, 60 * random)));

      attempts++;
    } while (selectedUpgrades.includes(upgradeIndex));

    selectedUpgrades.push(upgradeIndex);
  }

  return selectedUpgrades;
};

export const getExoticMarketRotations = (account, weeks = 10) => {
  if (!account?.timeAway?.GlobalTime) return [];

  const currentWeek = Math.floor(account.timeAway.GlobalTime / 604_800); // 1 week in seconds
  const rotations = [];
  const processedExoticMarket = account?.farming?.exoticMarket || [];

  for (let weekOffset = 0; weekOffset < weeks; weekOffset++) {
    const seed = Math.round(100 * (currentWeek + weekOffset));
    const selectedUpgrades = [];

    for (let i = 0; i < 8; i++) {
      let attempts = 0;
      let upgradeIndex;

      do {
        const currentSeed = seed + i + attempts * 1000;
        const rng = new LavaRand(currentSeed);
        const random = rng.rand();

        // Generate index 0–59
        upgradeIndex = Math.floor(Math.max(0, Math.min(59, 60 * random)));

        attempts++;
      } while (selectedUpgrades.includes(upgradeIndex));

      selectedUpgrades.push(upgradeIndex);
    }

    // Calculate the date for this rotation
    const dateInMs = Math.floor((currentWeek + weekOffset) * 604_800 * 1000);

    rotations.push({
      weekOffset,
      date: new Date(dateInMs),
      upgradeIndices: selectedUpgrades,
      upgrades: selectedUpgrades.map((index) => {
        // Use processed data from account if available, otherwise fall back to raw data
        const processedUpgrade = processedExoticMarket?.[index];
        const rawUpgrade = exoticMarketInfo?.[index];
        if (!rawUpgrade || rawUpgrade.name === 'NAME_MAGNI') return null;
        return {
          ...rawUpgrade,
          ...processedUpgrade,
          index,
          // Use processed displayText if available, otherwise clean the raw bonus
          displayText: processedUpgrade?.displayText || rawUpgrade.bonus.replace(/[{}$]/g, '')
        };
      }).filter(Boolean)
    });
  }

  return rotations;
};

export const getRanksTotalBonus = (ranks, index) => {
  return 0 === index ? (1 + ranks?.[3]?.bonus / 100) * (1 + ranks?.[10]?.bonus / 100) * (1 + ranks?.[15]?.bonus / 100)
    : 1 === index ? ranks?.[8]?.bonus + ranks?.[17]?.bonus
      : 2 === index ? ranks?.[6]?.bonus + ranks?.[13]?.bonus
        : 3 === index ? ranks?.[7]?.bonus + (ranks?.[11]?.bonus + ranks?.[18]?.bonus)
          : 4 === index ? ranks?.[5]?.bonus + (ranks?.[12]?.bonus + ranks?.[16]?.bonus) : 1;
}

const getCropsWithStockEqualOrGreaterThan = (cropDepot, stockLimit) => {
  return Object.values(cropDepot)?.filter((value) => value >= stockLimit).length;
}

const getMarketUpgradeBonusValue = (marketUpgrades, cropDepot, upgradeId) => {
  const upgrade = marketUpgrades.find((upgrade, index) => index === upgradeId);

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

export const updateFarming = (characters, account) => {
  const newMarket = account?.farming?.market?.map((upgrade, index) => {
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
  const exoticBonus = getExoticMarketBonus(account, 30);
  const growthRate = Math.max(1, speedGMO)
    * (1 + (marketGrowthRate + vialBonus + exoticBonus) / 100)
    * (1 + summoningBonus / 100);
  const maxTimes = [0, 1, 2, 3, 4, 5, 6].map((seedType, index) => {
    const growthReq = index === 6 ? 25200 * growthRate : 14400 * Math.pow(1.5, seedType);
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

  const newPlot = account?.farming?.plot?.map((crop, index) => {
    // OG Chance
    const marketOGChance = getMarketBonus(account?.farming?.market, "OG_FERTILIZER");
    const charmOGChange = getCharmBonus(account, 'Taffy_Disc');
    const starSignBonus = getStarSignBonus(characters?.[0], account, 'OG_Chance');
    const achievementBonus = getAchievementStatus(account?.achievements, 365)
    const landRankBonus = getLandRankTotalBonus(account, 3);
    const nextOGChance = Math.pow(0.4, crop?.currentOG + 1)
      * Math.max(1, marketOGChance)
      * (1 + charmOGChange / 100)
      * (1 + starSignBonus / 100)
      * (1 + (2 * account?.tasks?.[2]?.[5]?.[2]) / 100)
      * (1 + (15 * achievementBonus) / 100)
      * (1 + landRankBonus / 100);

    const growthReq = crop?.seedType === 6 ? 25200 * growthRate : 14400 * Math.pow(1.5, crop?.seedType);
    const timeLeft = (growthReq - crop?.progress) / growthRate;
    const maxTimeLeft = growthReq / growthRate;
    const ogMulti = Math.min(1e9, Math.max(1, Math.pow(2, crop?.currentOG)));
    return {
      ...crop,
      nextOGChance,
      growthRate,
      ogMulti,
      timeLeft,
      maxTimeLeft,
      growthReq
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
  isUnique = true,
  emperorCostCalc
}) => {
  const upgradeMap = new Map();

  let extraLv = 0;

  while (upgradeMap.size < 4 && (level + extraLv < maxLvl)) {
    const type = getCropType({
      index,
      cropId,
      cropIdIncrement,
      level: level + extraLv
    });

    const localCost = emperorCostCalc * cost * Math.pow(costExponent, level + extraLv);

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

const getCropType = ({ index, cropId, cropIdIncrement, level }) => {
  return index === 0 ? Math.floor(cropId + cropIdIncrement *
    (level + (2 * Math.floor(level / 3) + Math.floor(level / 4))))
    : Math.floor(cropId + cropIdIncrement
      * level)
}

const getCropDepotBonuses = (account) => {
  // 'CropSCbonus' == e
  const labBonus = getLabBonus(account?.lab?.labBonuses, 17);
  const spelunkerObolMulti = getLabBonus(account?.lab.labBonuses, 8); // gem multi
  const pureOpalRhombolJewel = getJewelBonus(account?.lab?.jewels, 20, spelunkerObolMulti);
  const grimoireBonus = getGrimoireBonus(account?.grimoire?.upgrades, 22);
  const exoticBonus40 = getExoticMarketBonus(account, 40) ?? 0;
  const extraBonus = (1 + (labBonus + pureOpalRhombolJewel) / 100) * (1 + (grimoireBonus + exoticBonus40) / 100);

  let bonuses = {
    damage: { name: 'DMG', value: 0 },
    gamingEvo: { name: 'Gaming Evo', value: 0 },
    jadeCoin: { name: 'Jade Coin', value: 0 },
    cookingSpeed: { name: 'Meal Spd', value: 0 },
    cash: { name: 'Cash', value: 0 },
    shiny: { name: 'Pet Rate', value: 0 },
    critters: { name: 'Critters', value: 0 },
    dropRate: { name: 'Drop Rate', value: 0 },
    spelunky: { name: 'Spelunky', value: 0 }
  };
  if (isJadeBonusUnlocked(account, 'Reinforced_Science_Pencil')) {
    bonuses.damage.value = 20 * Math.round(account?.farming?.cropsFound) * extraBonus;
  }
  if (isJadeBonusUnlocked(account, 'Science_Pen')) {
    bonuses.gamingEvo.value = Math.pow(1.02, Math.round(account?.farming?.cropsFound)) * extraBonus;
  }
  if (isJadeBonusUnlocked(account, 'Science_Marker')) {
    bonuses.jadeCoin.value = 8 * Math.round(account?.farming?.cropsFound) * extraBonus;
  }
  if (isJadeBonusUnlocked(account, 'Science_Featherpen')) {
    bonuses.cookingSpeed.value = Math.pow(1.1, Math.round(account?.farming?.cropsFound)) * extraBonus;
  }
  if (isJadeBonusUnlocked(account, 'Science_Environmentally_Sourced_Pencil')) {
    bonuses.cash.value = 15 * Math.round(account?.farming?.cropsFound) * extraBonus;
  }
  if (isJadeBonusUnlocked(account, 'Science_Crayon')) {
    bonuses.shiny.value = 7 * Math.round(account?.farming?.cropsFound) * extraBonus;
  }
  if (isJadeBonusUnlocked(account, 'Science_Paintbrush')) {
    bonuses.critters.value = 0.1 * Math.round(account?.farming?.cropsFound) * extraBonus;
  }
  if (isJadeBonusUnlocked(account, 'Science_Highlighter')) {
    bonuses.dropRate.value = Math.round(Math.max(0, account?.farming?.cropsFound - 100)) * extraBonus;
  }
  if (isJadeBonusUnlocked(account, 'Science_Fancy_Pen')) {
    bonuses.spelunky.value = 5 * Math.round(Math.max(0, account?.farming?.cropsFound - 200)) * extraBonus;
  }
  return bonuses;
}

export const getMarketBonus = (market, bonusName, value = 'baseValue') => {
  return (market?.find(({ name }) => name === bonusName))?.[value] ?? 0;
}
export const getExoticMarketBonus = (account, index) => {
  return (account?.farming?.exoticMarket?.[index])?.value ?? 0;
}

export const getLandRank = (ranks, index) => {
  return ranks?.[index]?.bonus;
}

export const getLandRankTotalBonus = (account, index) => {
  return 0 === index ? (1 + getLandRank(account?.farming?.ranks, 3) / 100)
    * (1 + getLandRank(account?.farming?.ranks, 10) / 100) *
    (1 + getLandRank(account?.farming?.ranks, 15) / 100) :
    1 === index ? getLandRank(account?.farming?.ranks, 8)
      + getLandRank(account?.farming?.ranks, 17) :
      2 === index ? getLandRank(account?.farming?.ranks, 6)
        + getLandRank(account?.farming?.ranks, 13) :
        3 === index ? getLandRank(account?.farming?.ranks, 7)
          + (getLandRank(account?.farming?.ranks, 11)
            + getLandRank(account?.farming?.ranks, 18))
          : 4 === index ? getLandRank(account?.farming?.ranks, 5)
            + (getLandRank(account?.farming?.ranks, 12) +
              getLandRank(account?.farming?.ranks, 16)) : 1;
}

const calcCostToMax = ({ level, maxLvl, cost, costExponent, emperorCostCalc }) => {
  let costToMax = 0;
  for (let i = level; i < maxLvl; i++) {
    costToMax += emperorCostCalc * cost * Math.pow(costExponent, i)
  }
  return costToMax ?? 0;
}

export const getTotalCrop = (plot, market, ranks, account) => {
  return plot?.reduce((total, { seedType, cropQuantity, cropRawName, ogMulti, rank }) => {
    if (seedType === -1) return total;
    const { productDoubler } = getProductDoubler(market);
    const productionBoost = getLandRank(ranks, 1);
    const voteBonus = getVoteBonus(account, 29);
    const speedGMO = getMarketBonus(account?.farming?.market, "VALUE_GMO", 'value');
    const finalMulti = Math.min(1e4, Math.round(Math.max(1, Math.floor(1 + (productDoubler / 100)))
      * (1 + getRanksTotalBonus(ranks, 1) / 100)
      * Math.max(1, speedGMO)
      * (1 + (productionBoost * (rank ?? 0)
        + voteBonus) / 100)));
    return {
      ...total,
      [cropRawName]: (total?.[cropRawName] || 0) + (cropQuantity * ogMulti * finalMulti)
    }
  }, {});
}

export const getProductDoubler = (market) => {
  const productDoubler = (market?.[5]?.value || 0);
  const multi = productDoubler / 100;
  const percent = productDoubler % 100;
  return { productDoubler, percent, multi: Math.max(2, Math.floor(multi) + 1) };
}

export const getCropEvolution = (account, character, crop, forceStarSign) => {
  const marketBonus1 = getMarketBonus(account?.farming?.market, "BIOLOGY_BOOST");
  const winBonus = getWinnerBonus(account, '<x Crop EVO');
  const lampBonus = getLampBonus({ holesObject: account?.hole?.holesObject, t: 2, i: 0, account });
  const bubbleBonus1 = getBubbleBonus(account, 'W10AllCharz', false);
  const bubbleBonus2 = getBubbleBonus(account, 'CROPIUS_MAPPER', false);
  const vialBonus = getVialsBonusByEffect(account?.alchemy?.vials, null, '6FarmEvo');
  const mealBonus1 = getMealsBonusByEffectOrStat(account, null, 'zCropEvo');
  const mealBonus2 = getMealsBonusByEffectOrStat(account, null, 'zCropEvoSumm');
  const monumentBonus = getMonumentBonus({ holesObject: account?.hole?.holesObject, t: 2, i: 4 });
  const stampBonus = getStampsBonusByEffect(account, 'Crop_Evolution_Chance', character); // Stamp
  const grimoireBonus = getGrimoireBonus(account?.grimoire?.upgrades, 14);
  const killroyBonus = getKillroyBonus(account, 3);
  const marketBonus2 = getMarketBonus(account?.farming?.market, "EVOLUTION_GMO");
  const skillMasteryBonus = isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.farming?.rank, 1);
  const starSignBonus = getStarSignBonus(character, account, 'Crop_Evo', forceStarSign);
  const talentBonus = getTalentBonus(character?.flatTalents, 'MASS_IRRIGATION'); // Death Bringer
  const voteBonus = getVoteBonus(account, 29);

  let value = (1 + marketBonus1 / 100)
    * (1 + winBonus / 100)
    * (1 + lampBonus / 100)
    * (1 + bubbleBonus1 / 100)
    * (1 + bubbleBonus2 / 100)
    * (1 + vialBonus / 100)
    * (1 + mealBonus1 / 100)
    * (1 + monumentBonus / 100)
    * (1 + stampBonus / 100)
    * (1 + grimoireBonus / 100)
    * (1 + (mealBonus2
      * Math.ceil((character?.skillsInfo?.summoning?.level + 1) / 50)) / 100)
    * (1 + (5 * getAchievementStatus(account?.achievements, 355)) / 100)
    * Math.max(1, killroyBonus)
    * Math.max(1, marketBonus2)
    * (1 + (15 * skillMasteryBonus) / 100)
    * (1 + (starSignBonus * character?.skillsInfo?.farming?.level) / 100)
    * Math.max(1, getLandRankTotalBonus(account, 0))
    * Math.max(1, talentBonus)
    * (1 + (getLandRank(account?.farming?.ranks, 0) * account?.farming?.plot?.[crop?.index]?.rank + voteBonus) / 100)
    * crop?.seed?.nextCropChance
    * Math.pow(crop?.seed?.nextCropDecay, crop?.baseCropType);

  value = Math.min(100, 100 * value);
  value = Math.round(10 * value) / 10;

  return {
    value,
    breakdown: [
      { title: 'Additive' },
      { name: 'Base Chance', value: crop?.seed?.nextCropChance.toExponential(3) },
      { name: 'Decay Rate', value: Math.pow(crop?.seed?.nextCropDecay, crop?.baseCropType).toExponential(3) },
      { name: 'Market', value: Number(((1 + marketBonus1 / 100) * (1 + marketBonus2 / 100)).toFixed(3)) },
      { name: 'Summoning', value: Number((1 + winBonus / 100).toFixed(3)) },
      { name: 'Lamp', value: Number((1 + lampBonus / 100).toFixed(3)) },
      { name: 'Bubble', value: Number(((1 + bubbleBonus1 / 100) * (1 + bubbleBonus2 / 100)).toFixed(3)) },
      { name: 'Vial', value: Number((1 + vialBonus / 100).toFixed(3)) },
      {
        name: 'Meal',
        value: Number(((1 + mealBonus1 / 100) * (1 + (mealBonus2 * Math.ceil((character?.skillsInfo?.summoning?.level + 1) / 50)) / 100)).toFixed(3))
      },
      { name: 'Monument', value: Number((1 + monumentBonus / 100).toFixed(3)) },
      { name: 'Stamp', value: Number((1 + stampBonus / 100).toFixed(3)) },
      { name: 'Grimoire', value: Number((1 + grimoireBonus / 100).toFixed(3)) },
      {
        name: 'Achievement',
        value: Number((1 + (5 * getAchievementStatus(account?.achievements, 355)) / 100).toFixed(3))
      },
      { title: 'Multiplicative' },
      { name: 'Killroy', value: Number(Math.max(1, killroyBonus).toFixed(3)) },
      { name: 'Skill Mastery', value: Number((1 + (15 * skillMasteryBonus) / 100).toFixed(3)) },
      {
        name: 'Star Sign',
        value: Number((1 + (starSignBonus * character?.skillsInfo?.farming?.level) / 100).toFixed(3))
      },
      { name: 'Land Rank Total', value: Number(Math.max(1, getLandRankTotalBonus(account, 0)).toFixed(3)) },
      { name: 'Talent', value: Number(Math.max(1, talentBonus).toFixed(3)) },
      {
        name: 'Land Rank + Vote',
        value: Number((1 + (getLandRank(account?.farming?.ranks, 0) * account?.farming?.plot?.[crop?.index]?.rank + voteBonus) / 100).toFixed(3))
      }
    ],
    expression: `let value = (1 + marketBonus1 / 100)
    * (1 + winBonus / 100)
    * (1 + lampBonus / 100)
    * (1 + bubbleBonus1 / 100)
    * (1 + bubbleBonus2 / 100)
    * (1 + vialBonus / 100)
    * (1 + mealBonus1 / 100)
    * (1 + monumentBonus / 100)
    * (1 + stampBonus / 100)
    * (1 + grimoireBonus / 100)
    * (1 + (mealBonus2
      * Math.ceil((character?.skillsInfo?.summoning?.level + 1) / 50)) / 100)
    * (1 + (5 * getAchievementStatus(account?.achievements, 355)) / 100)
    * Math.max(1, killroyBonus)
    * Math.max(1, marketBonus2)
    * (1 + (15 * skillMasteryBonus) / 100)
    * (1 + (starSignBonus * character?.skillsInfo?.farming?.level) / 100)
    * Math.max(1, getLandRankTotalBonus(account, 0))
    * Math.max(1, talentBonus)
    * (1 + (getLandRank(account?.farming?.ranks, 0) * account?.farming?.plot?.[crop?.index]?.rank + voteBonus) / 100)
    * crop?.seed?.nextCropChance
    * Math.pow(crop?.seed?.nextCropDecay, crop?.baseCropType);

  value = Math.min(100, 100 * value);
  value = Math.round(10 * value) / 10;`
  }
}