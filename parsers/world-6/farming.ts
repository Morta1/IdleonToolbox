import { notateNumber, tryToParse } from '@utility/helpers';
import { exoticMarketInfo, marketInfo, ninjaExtraInfo, research as researchData, seedInfo } from '@website-data';
import { getCharmBonus, isJadeBonusUnlocked } from '@parsers/world-6/sneaking';
import { getStarSignBonus } from '@parsers/starSigns';
import { getBubbleBonus, getVialsBonusByEffect, getVialsBonusByStat } from '@parsers/world-2/alchemy';
import { getJewelBonus, getLabBonus } from '@parsers/world-4/lab';
import { getWinnerBonus } from '@parsers/world-6/summoning';
import { getAchievementStatus } from '@parsers/achievements';
import { getVoteBonus } from '@parsers/world-2/voteBallot';
import { getGrimoireBonus } from '@parsers/class-specific/grimoire';
import { CLASSES, getHighestTalentByClass, getTalentBonus } from '@parsers/talents';
import { getEventShopBonus, getHighestCharacterSkill, getKillroyBonus, isMasteryBonusUnlocked } from '@parsers/misc';
import { getLampBonus } from '@parsers/world-5/caverns/the-lamp';
import { getMealsBonusByEffectOrStat } from '@parsers/world-4/cooking';
import { getMonumentBonus } from '@parsers/world-5/caverns/bravery';
import { getMineheadBonusQTY } from '@parsers/world-7/minehead';
import { getStampsBonusByEffect } from '@parsers/world-1/stamps';
import { getEmperorBonus } from './emperor';
import { getResearchGridBonus } from '@parsers/world-7/research';
import { isSuperbitUnlocked } from '@parsers/world-5/gaming';
import { getArcadeBonus } from '@parsers/world-2/arcade';
import { getUpgradeVaultBonus } from '@parsers/misc/upgradeVault';
import { getSushiBonus } from '@parsers/world-7/sushiStation';
import { getButtonBonus } from '@parsers/world-7/button';
import { getCardBonusByEffect } from '@parsers/cards';
import LavaRand from '../../utility/lavaRand';

/** Level needed to reach the given percent of cap for exotic capped formula: value = baseValue * level / (1000 + level). */
export const findExoticCappedThresholdLevel = (percent: any, _unused1?: any) => {
  if (percent <= 0 || percent >= 100) return null;
  return (1000 * percent) / (100 - percent);
};

export const getFarming = (idleonData: any, accountData: any, charactersData: any) => {
  const rawFarmingUpgrades = tryToParse(idleonData?.FarmUpg);
  const rawFarmingPlot = tryToParse(idleonData?.FarmPlot);
  const rawFarmingCrop = tryToParse(idleonData?.FarmCrop);
  const rawFarmingRanks = tryToParse(idleonData?.FarmRank);
  return parseFarming(rawFarmingUpgrades, rawFarmingPlot, rawFarmingCrop, rawFarmingRanks, accountData, charactersData);
}

const parseFarming = (rawFarmingUpgrades: any, rawFarmingPlot: any, rawFarmingCrop: any, rawFarmingRanks: any, account: any, charactersData: any) => {
  const gemVineBonus = account?.gemShopPurchases?.find((value: any, index: any) => index === 139);
  const marketLevels = rawFarmingUpgrades?.slice(2, marketInfo.length + 2);
  const beans = rawFarmingUpgrades?.[1];
  const instaGrow = rawFarmingUpgrades?.[19];
  const researchBonus171 = getResearchGridBonus(account, 171, 0);
  const market = marketInfo?.map((upgrade, index) => {
    const { cropId, cropIdIncrement, cost, costExponent, bonusPerLvl, maxLvl, bonus } = upgrade;
    const level = marketLevels?.[index] ?? 0;
    const emperorBonus = getEmperorBonus(account, 2);
    const emperorCostCalc = Math.max(0.001, 1 - emperorBonus / (emperorBonus + 100));
    const calculatedCost = emperorCostCalc * cost * Math.pow(costExponent, level);
    const t = Math.floor(index / 8);
    const i = index % 8;
    const effectiveMaxLvl = (i === 0 || (t === 1 && i === 5))
      ? Math.floor(maxLvl)
      : Math.floor(researchBonus171 + maxLvl);
    return {
      ...upgrade,
      level,
      maxLvl: effectiveMaxLvl,
      type: getCropType({ index, cropId, cropIdIncrement, level }),
      cost: calculatedCost,
      nextUpgrades: getNextUpgradesReq({
        index,
        cropId,
        cropIdIncrement,
        level,
        maxLvl: effectiveMaxLvl,
        cost,
        costExponent,
        emperorCostCalc
      }),
      costToMax: calcCostToMax({ level, maxLvl: effectiveMaxLvl, cost, costExponent, emperorCostCalc }),
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
    }
    else {
      // Linear formula (x4 === 0)
      calculatedBonus = upgrade.baseValue * level;
    }

    let displayText;
    if (level === 0) {
      displayText = upgrade.bonus.replace(/[{}$]/g, '0');
    }
    else {
      displayText = upgrade.bonus
        .replace('{', Math.round(calculatedBonus * 100) / 100 + '')
        .replace('}', Math.round((1 + calculatedBonus / 100) * 100) / 100 + '')
        .replace('$', Math.ceil(calculatedBonus) + '');
    }

    const isCapped = upgrade.type === 1;
    const EFF_THRESHOLD_PERCENT = 99;
    const thresholdLevel = isCapped ? findExoticCappedThresholdLevel(EFF_THRESHOLD_PERCENT, upgrade.baseValue) : null;
    const thresholdMissingLevels = isCapped && thresholdLevel != null
      ? Math.max(0, Math.ceil(thresholdLevel) - level)
      : null;

    return {
      ...upgrade,
      level,
      value: calculatedBonus,
      maxValue: isCapped ? upgrade.baseValue : null,
      percentOfCap: isCapped ? (calculatedBonus / upgrade.baseValue) * 100 : null,
      isCapped,
      thresholdLevel: isCapped ? thresholdLevel : null,
      thresholdMissingLevels,
      isAvailableThisWeek: availableExoticIndices.includes(index),
      displayText
    };
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
  const totalPoints = farmingRanks?.reduce((sum: any, level: any) => sum + level, 0)
  const usedPoints = upgradesLevels?.reduce((sum: any, level: any) => sum + level, 0);
  const unlocks = ninjaExtraInfo?.[37];
  const names = ninjaExtraInfo?.[34];
  const bases = ninjaExtraInfo?.[36]?.map((base: any) => parseFloat(base));
  const apocalypseWow = getHighestTalentByClass(charactersData, CLASSES.Death_Bringer, 'DANK_RANKS') ?? 0;
  const exoticBonus14 = getExoticMarketBonus(account, 14) ?? 0;
  const exoticMulti = 1 + exoticBonus14 / 100;
  const ranks = ninjaExtraInfo?.[35]?.map((description: any, index: any) => {
    const name = names?.[index];
    const base = bases?.[index];
    const upgradeLevel = upgradesLevels?.[index];
    const unlockAt = unlocks?.[index];
    const bonus = calcRankBonus(index, apocalypseWow, exoticMulti, base, upgradeLevel);

    return {
      name,
      description,
      bonus,
      base,
      upgradeLevel,
      unlockAt,
      exoticMulti
    }
  });

  const plot = rawFarmingPlot?.map(([seedType, progress, cropType, isLocked, cropQuantity, currentOG, cropProgress]: any, cropIndex: any) => {
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
  const marketStrongerVines = getMarketBonus(market, 'STRONGER_VINES');
  const cropsOnVine = Math.floor(1 + ((marketStrongerVines + 20 * gemVineBonus) / 100))
  const cropsForBeans = Object.entries(rawFarmingCrop || {}).reduce((sum, [type, amount]) => {
    const seed = seedInfo.find((seed) => parseFloat(type) >= seed.cropIdMin && parseFloat(type) <= seed.cropIdMax);
    return sum + (parseFloat(amount as string) * Math.pow(2.5, (seed?.seedId ?? 0)) * Math.pow(1.08, Number(type) - (seed?.cropIdMin ?? 0)));
  }, 0);
  const jadeUpgrade = isJadeBonusUnlocked(account, 'Deal_Sweetening') ?? 0;
  const marketBonus = getMarketBonus(market, 'MORE_BEENZ');
  const hasLandRank = getMarketBonus(market, 'LAND_RANK');
  const achievementBonus = getAchievementStatus(account?.achievements, 363);
  const exoticBonus16 = getExoticMarketBonus(account, 16) ?? 0;
  const exoticBonus17 = getExoticMarketBonus(account, 17) ?? 0;
  const exoticBonus18 = getExoticMarketBonus(account, 18) ?? 0;
  const exoticBonus19 = getExoticMarketBonus(account, 19) ?? 0;
  const exoticBonus20 = getExoticMarketBonus(account, 20) ?? 0;

  const vaultBonus85 = getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 85);
  const beanTrade = Math.pow(cropsForBeans, 0.5)
    * (1 + marketBonus / 100)
    * (1 + (25 * jadeUpgrade + (5 * achievementBonus + (exoticBonus16 + (exoticBonus17 + (exoticBonus18 + vaultBonus85))))) / 100)
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
    totalRanks: farmingRanks?.reduce((sum: any, rank: any) => sum + rank, 0),
    exoticMarkeMaxPurchases: Math.round(4 + (getMineheadBonusQTY(account, 8) + 8 * getEventShopBonus(account, 43)
      + getSushiBonus(account, 33) + 3 * (account?.equinox?.challenges?.[66]?.current === -1 ? 1 : 0))),
    pctExoticPurchasesFree: Math.min(80, 30 * getEventShopBonus(account, 43)) + Math.min(25, 25 * getMineheadBonusQTY(account, 8)),
    exoticMarketUpgradesPurchased: account?.accountOptions?.[416]
  };
}

export const getExoticMarketRotation = (account: any) => {
  if (!account?.timeAway?.GlobalTime) return [];

  const currentWeek = Math.floor(account.timeAway.GlobalTime / 604_800); // 1 week in seconds
  const seed = Math.round(100 * currentWeek);

  const selectedUpgrades: any[] = [];

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

export const getExoticMarketRotations = (account: any, weeks = 10) => {
  if (!account?.timeAway?.GlobalTime) return [];

  const currentWeek = Math.floor(account.timeAway.GlobalTime / 604_800); // 1 week in seconds
  const rotations = [];
  const processedExoticMarket = account?.farming?.exoticMarket || [];

  for (let weekOffset = 0; weekOffset < weeks; weekOffset++) {
    const seed = Math.round(100 * (currentWeek + weekOffset));
    const selectedUpgrades: any[] = [];

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

export const getRanksTotalBonus = (ranks: any, index: any) => {
  return 0 === index ? (1 + ranks?.[3]?.bonus / 100) * (1 + ranks?.[10]?.bonus / 100) * (1 + ranks?.[15]?.bonus / 100)
    : 1 === index ? ranks?.[8]?.bonus + ranks?.[17]?.bonus
      : 2 === index ? ranks?.[6]?.bonus + ranks?.[13]?.bonus
        : 3 === index ? ranks?.[7]?.bonus + (ranks?.[11]?.bonus + ranks?.[18]?.bonus)
          : 4 === index ? ranks?.[5]?.bonus + (ranks?.[12]?.bonus + ranks?.[16]?.bonus) : 1;
}

const getCropsWithStockEqualOrGreaterThan = (cropDepot: any, stockLimit: any) => {
  return Object.values(cropDepot)?.filter((value: any) => value >= stockLimit).length;
}

const getMarketUpgradeBonusValue = (marketUpgrades: any, cropDepot: any, upgradeId: any): any => {
  const upgrade = marketUpgrades.find((upgrade: any, index: any) => index === upgradeId);

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
        return upgrade.bonus.includes('}')
          ? (1 + (upgrade.level * upgrade.bonusPerLvl) / 100)
          : upgrade.level * upgrade.bonusPerLvl;
    }
  }
  else {
    return 0;
  }
}

export const getStickerBonus = (account: any, index: any) => {
  const stickerLevels = account?.research?.stickerLevels ?? [];
  const baseBonusValues = (researchData?.[25] ?? []).map(Number);
  const count = stickerLevels[index] ?? 0;
  const grid68bonus = getResearchGridBonus(account, 68, 2);
  const eventShopBonus37 = getEventShopBonus(account, 37);
  const superBit62 = isSuperbitUnlocked(account, 'Bettah_Stickahs') ? 1 : 0;
  return (1 + (grid68bonus + 30 * eventShopBonus37) / 100) * (1 + (20 * superBit62) / 100) * count * (baseBonusValues[index] ?? 0);
};

const getStickerOddsMulti = (characters: any, account: any) => {
  const grid67bonus = getResearchGridBonus(account, 67, 2);
  const grid88bonus = getResearchGridBonus(account, 88, 0);
  const sticker5bonus = getStickerBonus(account, 5);
  const arcade64 = getArcadeBonus(account?.arcade?.shop, 'Megacrop_Chance')?.bonus ?? 0;
  const superBit55 = isSuperbitUnlocked(account, 'Mo_Stickers_Mo_Bonusers') ? 1 : 0;
  const farmingLevel = getHighestCharacterSkill(characters, 'farming') ?? 0;
  return (1 + grid67bonus / 100)
    * (1 + grid88bonus / 100)
    * (1 + sticker5bonus / 100)
    * (1 + arcade64 / 100)
    * (1 + 0.02 * superBit55 * Math.max(0, farmingLevel - 300));
};

const getStickerOdds = (characters: any, account: any, index: any) => {
  const count = (account?.research?.stickerLevels ?? [])[index] ?? 0;
  const oddsMulti = getStickerOddsMulti(characters, account);
  return oddsMulti / (5000 * Math.pow(7, index) * Math.pow(Math.max(10 - count, 5), count));
};

const getStickerDMGMulti = (account: any) => {
  if (!account?.research?.farmingStickerDMG_unlocked) return 1;
  const grid47bonus = account?.research?.gridSquares?.[47]?.bonuses?.[0] ?? 0;
  const totalStickers = account?.research?.totalStickers ?? 0;
  return 1 + (grid47bonus * totalStickers) / 100;
};

export const updateFarming = (characters: any, account: any) => {
  const newMarket = account?.farming?.market?.map((upgrade: any, index: any) => {
    return {
      ...upgrade,
      value: getMarketUpgradeBonusValue(account?.farming?.market, account?.farming?.crop, index)
    }
  });
  // Growth
  const marketGrowthRate = getMarketBonus(newMarket, 'NUTRITIOUS_SOIL');
  const speedGMO = getMarketBonus(newMarket, 'SPEED_GMO', 'value');
  const vialBonus = getVialsBonusByStat(account?.alchemy?.vials, '6FarmSpd');
  const summoningBonus = getWinnerBonus(account, '<x Farming SPD');
  const exoticGrowth = getExoticMarketBonus(account, 30);
  const growthRate = Math.max(1, speedGMO)
    * (1 + (marketGrowthRate + vialBonus + exoticGrowth) / 100)
    * (1 + summoningBonus / 100);
  const growthSpeedBreakdown = {
    statName: 'Growth Speed',
    totalValue: growthRate,
    categories: [{
      name: 'Multiplicative',
      sources: [
        { name: 'Speed GMO', value: Math.max(1, speedGMO) },
        { name: 'Nutritious Soil', value: 1 + marketGrowthRate / 100 },
        { name: 'Vial', value: 1 + vialBonus / 100 },
        { name: 'Gogogrow (Exotic)', value: 1 + exoticGrowth / 100 },
        { name: 'Summoning', value: 1 + summoningBonus / 100 }
      ]
    }]
  };
  const maxTimes = [0, 1, 2, 3, 4, 5, 6].map((seedType, index) => {
    const growthReq = index === 6 ? 25200 * growthRate : 14400 * Math.pow(1.5, seedType);
    const value = growthReq / growthRate;
    return { value, breakdown: growthSpeedBreakdown };
  });

  // OG Chance (multiplier portion, without per-plot 0.4^OG base)
  const marketOGChance = getMarketBonus(account?.farming?.market, 'OG_FERTILIZER');
  const charmOGBonus = getCharmBonus(account, 'Taffy_Disc');
  const ogStarSignBonus = getStarSignBonus(characters?.[0], account, 'OG_Chance');
  const ogAchievementBonus = getAchievementStatus(account?.achievements, 365);
  const ogLandRankBonus = getLandRankTotalBonus(account, 3);
  const ogTaskBonus = 2 * (account?.tasks?.[2]?.[5]?.[2] ?? 0);
  const ogExotic26 = getExoticMarketBonus(account, 26);
  const ogExotic27 = getExoticMarketBonus(account, 27);
  const ogMultiplier = Math.max(1, marketOGChance)
    * (1 + charmOGBonus / 100)
    * (1 + ogStarSignBonus / 100)
    * (1 + ogTaskBonus / 100)
    * (1 + (15 * ogAchievementBonus) / 100)
    * (1 + ogLandRankBonus / 100)
    * (1 + ogExotic26 / 100)
    * (1 + ogExotic27 / 100);
  const ogChanceBreakdown = {
    statName: 'OG Chance Multiplier',
    totalValue: ogMultiplier,
    categories: [{
      name: 'Multiplicative',
      sources: [
        { name: 'OG Fertilizer (Market)', value: Math.max(1, marketOGChance) },
        { name: 'Taffy Disc (Charm)', value: 1 + charmOGBonus / 100 },
        { name: 'Star Sign', value: 1 + ogStarSignBonus / 100 },
        { name: 'Task', value: 1 + ogTaskBonus / 100 },
        { name: 'Achievement', value: 1 + (15 * ogAchievementBonus) / 100 },
        { name: 'Land Rank', value: 1 + ogLandRankBonus / 100 },
        { name: 'Evergrow I (Exotic)', value: 1 + ogExotic26 / 100 },
        { name: 'Evergrow II (Exotic)', value: 1 + ogExotic27 / 100 }
      ]
    }]
  };

  const newPlot = account?.farming?.plot?.map((crop: any) => {
    const nextOGChance = Math.pow(0.4, crop?.currentOG + 1) * ogMultiplier;

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
  const stickerNames = researchData?.[23] ?? [];
  const stickerDescriptions = researchData?.[24] ?? [];
  const stickerBaseBonus = (researchData?.[25] ?? []).map(Number);
  const stickers = stickerNames
    .map((name: any, index: any) => {
      if (name === 'Nonexistent_Sticker') return null;
      const count = (account?.research?.stickerLevels ?? [])[index] ?? 0;
      const bonus = getStickerBonus(account, index);
      const odds = getStickerOdds(characters, account, index);
      return { name, description: stickerDescriptions[index] ?? '', count, bonus, odds, baseBonus: stickerBaseBonus[index] ?? 0 };
    })
    .filter(Boolean);

  return {
    ...(account?.farming || {}),
    plot: newPlot,
    cropDepot: getCropDepotBonuses(account),
    market: newMarket,
    maxTimes,
    stickers,
    totalStickers: account?.research?.totalStickers ?? 0,
    dmgMulti: getStickerDMGMulti(account),
    stickersUnlocked: account?.research?.farmingStickersUnlocked ?? 0,
    stats: {
      growthSpeed: growthSpeedBreakdown,
      ogChance: ogChanceBreakdown,
      landRankExp: getLandRankExpBreakdown(account, characters),
      cropsOnVine: getCropsOnVineBreakdown(account),
      cropValue: getCropValueBreakdown(account, newMarket),
      magicBean: getMagicBeanBreakdown(account, newMarket)
    }
  }
}

const getLandRankExpBreakdown = (account: any, characters: any) => {
  const talentBonus = getHighestTalentByClass(characters, CLASSES.Death_Bringer, 'AGRICULTURAL_\'PRECIATION') ?? 0;
  const marketBonus = getMarketBonus(account?.farming?.market, 'RANK_BOOST');
  const exotic9 = getExoticMarketBonus(account, 9);
  const exotic10 = getExoticMarketBonus(account, 10);
  const exotic11 = getExoticMarketBonus(account, 11);
  const exotic12 = getExoticMarketBonus(account, 12);
  const exotic13 = getExoticMarketBonus(account, 13);

  const value = (1 + talentBonus / 100)
    * (1 + (marketBonus + exotic9 + exotic10 + exotic11) / 100)
    * (1 + exotic12 / 100)
    * (1 + exotic13 / 100);

  return {
    statName: 'Land Rank EXP',
    totalValue: value,
    categories: [{
      name: 'Multiplicative',
      sources: [
        { name: 'Talent (Ag. Appreciation)', value: 1 + talentBonus / 100 },
        { name: 'Rank Boost (Market)', value: 1 + marketBonus / 100 },
        { name: 'Stableroot I (Exotic)', value: 1 + exotic9 / 100 },
        { name: 'Stableroot II (Exotic)', value: 1 + exotic10 / 100 },
        { name: 'Stableroot III (Exotic)', value: 1 + exotic11 / 100 },
        { name: 'Vigouroot I (Exotic)', value: 1 + exotic12 / 100 },
        { name: 'Vigouroot II (Exotic)', value: 1 + exotic13 / 100 }
      ]
    }]
  };
};

const getCropsOnVineBreakdown = (account: any) => {
  const marketBonus = getMarketBonus(account?.farming?.market, 'STRONGER_VINES');
  const gemVineBonus = account?.gemShopPurchases?.find((_: any, index: any) => index === 139) ?? 0;
  const exotic31 = getExoticMarketBonus(account, 31);
  const exotic32 = getExoticMarketBonus(account, 32);
  const exotic33 = getExoticMarketBonus(account, 33);

  const totalBonus = marketBonus + 20 * gemVineBonus + exotic31 + exotic32 + exotic33;
  const value = Math.floor(1 + totalBonus / 100);

  return {
    statName: 'Crops on Vine',
    totalValue: value,
    categories: [{
      name: 'Additive (% toward +1 crop)',
      sources: [
        { name: 'Stronger Vines (Market)', value: marketBonus },
        { name: 'Gem Shop (Vineyard)', value: 20 * gemVineBonus },
        { name: 'Bountiful I (Exotic)', value: exotic31 },
        { name: 'Bountiful II (Exotic)', value: exotic32 },
        { name: 'Bountiful III (Exotic)', value: exotic33 }
      ]
    }]
  };
};

const getCropValueBreakdown = (account: any, market: any) => {
  const landRankTotal = getLandRankTotalBonus(account, 1);
  const valueGMO = getMarketBonus(market, 'VALUE_GMO', 'value');
  const landRankPerPlot = getLandRank(account?.farming?.ranks, 1);
  const exotic23 = getExoticMarketBonus(account, 23);
  const exotic24 = getExoticMarketBonus(account, 24);
  const exotic25 = getExoticMarketBonus(account, 25);
  const voteBonus = getVoteBonus(account, 29);
  const avgRank = account?.farming?.plot?.reduce((sum: any, p: any) => sum + (p?.rank ?? 0), 0)
    / (account?.farming?.plot?.length || 1);

  const cap = 10000 * (1 + (exotic23 + exotic24 + exotic25) / 100);
  const uncappedValue = (1 + landRankTotal / 100)
    * Math.max(1, valueGMO)
    * (1 + (landRankPerPlot * avgRank + voteBonus) / 100);
  const value = Math.min(cap, Math.round(uncappedValue));

  return {
    statName: 'Crop Value',
    totalValue: value,
    categories: [
      {
        name: 'Multiplicative',
        sources: [
          { name: 'Land Rank Total', value: 1 + landRankTotal / 100 },
          { name: 'Value GMO (Market)', value: Math.max(1, valueGMO) },
          { name: 'Land Rank (per plot avg)', value: 1 + (landRankPerPlot * avgRank) / 100 },
          { name: 'Vote', value: 1 + voteBonus / 100 }
        ]
      },
      {
        name: 'Cap',
        sources: [
          { name: 'Base Cap', value: 10000 },
          { name: 'Stalk Value I (Exotic)', value: 1 + exotic23 / 100 },
          { name: 'Stalk Value II (Exotic)', value: 1 + exotic24 / 100 },
          { name: 'Stalk Value III (Exotic)', value: 1 + exotic25 / 100 }
        ]
      }
    ]
  };
};

const getMagicBeanBreakdown = (account: any, market: any) => {
  const cropsForBeans = Object.entries(account?.farming?.crop || {}).reduce((sum: any, [type, amount]: any) => {
    if (type === 'beans') return sum;
    const seed = seedInfo.find((seed) => parseFloat(type) >= seed.cropIdMin && parseFloat(type) <= seed.cropIdMax);
    return sum + (parseFloat(amount as string) * Math.pow(2.5, (seed?.seedId ?? 0)) * Math.pow(1.08, Number(type) - (seed?.cropIdMin ?? 0)));
  }, 0);

  const jadeUpgrade = isJadeBonusUnlocked(account, 'Deal_Sweetening') ?? 0;
  const marketBonus = getMarketBonus(market, 'MORE_BEENZ');
  const achievementBonus = getAchievementStatus(account?.achievements, 363);
  const exotic16 = getExoticMarketBonus(account, 16);
  const exotic17 = getExoticMarketBonus(account, 17);
  const exotic18 = getExoticMarketBonus(account, 18);
  const exotic19 = getExoticMarketBonus(account, 19);
  const exotic20 = getExoticMarketBonus(account, 20);
  const vaultBonus85 = getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 85);

  const baseValue = Math.pow(cropsForBeans, 0.5);
  const value = baseValue
    * (1 + marketBonus / 100)
    * (1 + (25 * jadeUpgrade + (5 * achievementBonus + (exotic16 + (exotic17 + (exotic18 + vaultBonus85))))) / 100)
    * (1 + exotic19 / 100)
    * (1 + exotic20 / 100);

  return {
    statName: 'Magic Bean Trade',
    totalValue: value,
    categories: [
      {
        name: 'Base',
        sources: [
          { name: 'Crop Value', value: baseValue }
        ]
      },
      {
        name: 'Multiplicative',
        sources: [
          { name: 'More Beenz (Market)', value: 1 + marketBonus / 100 },
          { name: 'Deal Sweetening (Jade)', value: 1 + (25 * jadeUpgrade) / 100 },
          { name: 'Achievement', value: 1 + (5 * achievementBonus) / 100 },
          { name: 'Legumioso I (Exotic)', value: 1 + exotic16 / 100 },
          { name: 'Legumioso II (Exotic)', value: 1 + exotic17 / 100 },
          { name: 'Legumioso III (Exotic)', value: 1 + exotic18 / 100 },
          { name: 'Vault', value: 1 + vaultBonus85 / 100 },
          { name: 'Largumes I (Exotic)', value: 1 + exotic19 / 100 },
          { name: 'Largumes II (Exotic)', value: 1 + exotic20 / 100 }
        ]
      }
    ]
  };
};

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

    const localCost = emperorCostCalc * cost * Math.pow(costExponent, level + extraLv);

    if (upgradeMap.has(type) && isUnique) {
      // If the type exists, add the cost to the existing total
      upgradeMap.set(type, upgradeMap.get(type) + localCost);
    }
    else {
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
  const grimoireBonus = getGrimoireBonus(account?.grimoire?.upgrades, 22);
  const exoticBonus40 = getExoticMarketBonus(account, 40) ?? 0;
  const vaultBonus79 = getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 79);
  const extraBonus = (1 + (labBonus + pureOpalRhombolJewel) / 100)
    * (1 + (grimoireBonus + exoticBonus40 + vaultBonus79) / 100);

  let bonuses = {
    damage: { name: 'DMG', value: 0 },
    gamingEvo: { name: 'Gaming Evo', value: 0 },
    jadeCoin: { name: 'Jade Coin', value: 0 },
    cookingSpeed: { name: 'Meal Spd', value: 0 },
    cash: { name: 'Cash', value: 0 },
    shiny: { name: 'Pet Rate', value: 0 },
    critters: { name: 'Critters', value: 0 },
    dropRate: { name: 'Drop Rate', value: 0 },
    spelunky: { name: 'Spelunky', value: 0 },
    researchExp: { name: 'Research Exp', value: 0 }
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
  if (isJadeBonusUnlocked(account, 'Science_Chalk')) {
    bonuses.researchExp.value = Math.round(Math.max(0, Math.floor((account?.farming?.cropsFound - 200) / 10))) * extraBonus;
  }
  return bonuses;
}

export const getMarketBonus = (market: any, bonusName: any, value = 'baseValue') => {
  return (market?.find(({ name }: any) => name === bonusName))?.[value] ?? 0;
}
export const getExoticMarketBonus = (account: any, index: any) => {
  return (account?.farming?.exoticMarket?.[index])?.value ?? 0;
}

const calcRankBonus = (index: any, apocalypseWow: any, exoticMulti: any, base: any, upgradeLevel: any) => {
  return 4 === index || 9 === index || 14 === index || 19 === index
    ? Math.max(1, apocalypseWow) * exoticMulti * base * upgradeLevel
    : Math.max(1, apocalypseWow) * exoticMulti * ((1.7 * base * upgradeLevel) / (upgradeLevel + 80));
}

export const getLandRank = (ranks: any, index: any, characters?: any, activeCharacter?: any) => {
  const rank = ranks?.[index];
  if (!rank || !characters || !activeCharacter) return rank?.bonus;
  const { base, upgradeLevel, exoticMulti } = rank;
  const apocalypseWow = getHighestTalentByClass(characters, CLASSES.Death_Bringer, 'DANK_RANKS',
    false, false, false, false, activeCharacter) ?? 0;
  return calcRankBonus(index, apocalypseWow, exoticMulti, base, upgradeLevel);
}

export const getLandRankTotalBonus = (account: any, index: any) => {
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

const calcCostToMax = ({ level, maxLvl, cost, costExponent, emperorCostCalc }: any) => {
  let costToMax = 0;
  for (let i = level; i < maxLvl; i++) {
    costToMax += emperorCostCalc * cost * Math.pow(costExponent, i)
  }
  return costToMax ?? 0;
}

export const getTotalCrop = (plot: any, market: any, ranks: any, account: any) => {
  return plot?.reduce((total: any, { seedType, cropQuantity, cropRawName, ogMulti, rank }: any) => {
    if (seedType === -1) return total;
    const { productDoubler } = getProductDoubler(market);
    const productionBoost = getLandRank(ranks, 1);
    const voteBonus = getVoteBonus(account, 29);
    const speedGMO = getMarketBonus(account?.farming?.market, 'VALUE_GMO', 'value');
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

export const getProductDoubler = (market: any) => {
  const productDoubler = (market?.[5]?.value || 0);
  const multi = productDoubler / 100;
  const percent = productDoubler % 100;
  return { productDoubler, percent, multi: Math.max(2, Math.floor(multi) + 1) };
}

export const getCropEvolution = (account: any, character: any, crop: any, forceStarSign: any) => {
  const marketBonus1 = getMarketBonus(account?.farming?.market, 'BIOLOGY_BOOST');
  const winBonus = getWinnerBonus(account, '<x Crop EVO');
  const lampBonus = getLampBonus({ holesObject: account?.hole?.holesObject, t: 2, i: 0, account });
  const bubbleBonus1 = getBubbleBonus(account, 'W10AllCharz', false);
  const bubbleBonus2 = getBubbleBonus(account, 'CROPIUS_MAPPER', false);
  const vialBonus = getVialsBonusByEffect(account?.alchemy?.vials, null, '6FarmEvo');
  const mealBonus1 = getMealsBonusByEffectOrStat(account, null, 'zCropEvo');
  const mealBonus2 = getMealsBonusByEffectOrStat(account, null, 'zCropEvoSumm');
  const monumentBonus = getMonumentBonus({ holesObject: account?.hole?.holesObject, t: 2, i: 4 });
  const stampBonus = getStampsBonusByEffect(account, 'Crop_Evolution_Chance', character);
  const grimoireBonus = getGrimoireBonus(account?.grimoire?.upgrades, 14);
  const killroyBonus = getKillroyBonus(account, 3);
  const marketBonus2 = getMarketBonus(account?.farming?.market, 'EVOLUTION_GMO');
  const skillMasteryBonus = isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.farming?.rank, 1);
  const starSignBonus = getStarSignBonus(character, account, 'Crop_Evo', forceStarSign);
  const talentBonus = getTalentBonus(character?.flatTalents, 'MASS_IRRIGATION');
  const voteBonus = getVoteBonus(account, 29);
  const vaultBonus78 = getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 78);
  const cardBonus = getCardBonusByEffect(account?.cards, 'Farming_EVO_Multi_(Passive)');
  const sushiBonus = getSushiBonus(account, 35);
  const buttonBonus = getButtonBonus(account, 5);
  const stickerBonus = getStickerBonus(account, 4);

  const exotic0 = getExoticMarketBonus(account, 0);
  const exotic1 = getExoticMarketBonus(account, 1);
  const exotic2 = getExoticMarketBonus(account, 2);
  const exotic3 = getExoticMarketBonus(account, 3);
  const farmingLevel = character?.skillsInfo?.farming?.level ?? 0;
  const exotic4 = getExoticMarketBonus(account, 4);
  const exotic5 = getExoticMarketBonus(account, 5);
  const exotic6 = getExoticMarketBonus(account, 6);
  const exotic7 = getExoticMarketBonus(account, 7);
  const exotic8 = getExoticMarketBonus(account, 8);
  const scalingExotics = Math.max(0, farmingLevel - 50) * exotic4
    + Math.max(0, farmingLevel - 100) * exotic5
    + Math.max(0, farmingLevel - 150) * exotic6
    + Math.max(0, farmingLevel - 200) * exotic7
    + Math.max(0, farmingLevel - 250) * exotic8;

  const achievementBonus = getAchievementStatus(account?.achievements, 355);
  const summoningMealBonus = mealBonus2 * Math.ceil((character?.skillsInfo?.summoning?.level + 1) / 50);
  const landRankPerPlot = getLandRank(account?.farming?.ranks, 0) * (account?.farming?.plot?.[crop?.index]?.rank ?? 0) + voteBonus;

  let value = (1 + marketBonus1 / 100)
    * (1 + winBonus / 100)
    * (1 + lampBonus / 100)
    * (1 + bubbleBonus1 / 100)
    * (1 + bubbleBonus2 / 100)
    * (1 + vialBonus / 100)
    * (1 + cardBonus / 100)
    * (1 + mealBonus1 / 100)
    * (1 + vaultBonus78 / 100)
    * (1 + monumentBonus / 100)
    * (1 + stampBonus / 100)
    * (1 + grimoireBonus / 100)
    * (1 + summoningMealBonus / 100)
    * (1 + (5 * achievementBonus) / 100)
    * Math.max(1, killroyBonus)
    * Math.max(1, marketBonus2)
    * (1 + (15 * skillMasteryBonus) / 100)
    * (1 + (starSignBonus * farmingLevel) / 100)
    * Math.max(1, getLandRankTotalBonus(account, 0))
    * Math.max(1, talentBonus)
    * (1 + landRankPerPlot / 100)
    * (1 + exotic0 / 100)
    * (1 + buttonBonus / 100)
    * (1 + exotic1 / 100)
    * (1 + stickerBonus / 100)
    * (1 + exotic2 / 100)
    * (1 + exotic3 / 100)
    * (1 + scalingExotics / 100)
    * (1 + sushiBonus / 100)
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
      { name: 'Market', value: Number(((1 + marketBonus1 / 100) * Math.max(1, marketBonus2)).toFixed(3)) },
      { name: 'Summoning', value: Number((1 + winBonus / 100).toFixed(3)) },
      { name: 'Lamp', value: Number((1 + lampBonus / 100).toFixed(3)) },
      { name: 'Bubble', value: Number(((1 + bubbleBonus1 / 100) * (1 + bubbleBonus2 / 100)).toFixed(3)) },
      { name: 'Vial', value: Number((1 + vialBonus / 100).toFixed(3)) },
      { name: 'Card', value: Number((1 + cardBonus / 100).toFixed(3)) },
      { name: 'Meal', value: Number(((1 + mealBonus1 / 100) * (1 + summoningMealBonus / 100)).toFixed(3)) },
      { name: 'Monument', value: Number((1 + monumentBonus / 100).toFixed(3)) },
      { name: 'Stamp', value: Number((1 + stampBonus / 100).toFixed(3)) },
      { name: 'Grimoire', value: Number((1 + grimoireBonus / 100).toFixed(3)) },
      { name: 'Achievement', value: Number((1 + (5 * achievementBonus) / 100).toFixed(3)) },
      { name: 'Vault', value: Number((1 + vaultBonus78 / 100).toFixed(3)) },
      { name: 'Sushi', value: Number((1 + sushiBonus / 100).toFixed(3)) },
      { title: 'Multiplicative' },
      { name: 'Killroy', value: Number(Math.max(1, killroyBonus).toFixed(3)) },
      { name: 'Skill Mastery', value: Number((1 + (15 * skillMasteryBonus) / 100).toFixed(3)) },
      { name: 'Star Sign', value: Number((1 + (starSignBonus * farmingLevel) / 100).toFixed(3)) },
      { name: 'Land Rank Total', value: Number(Math.max(1, getLandRankTotalBonus(account, 0)).toFixed(3)) },
      { name: 'Talent', value: Number(Math.max(1, talentBonus).toFixed(3)) },
      { name: 'Land Rank + Vote', value: Number((1 + landRankPerPlot / 100).toFixed(3)) },
      { name: 'Sproutluck I', value: Number((1 + exotic0 / 100).toFixed(3)) },
      { name: 'Button', value: Number((1 + buttonBonus / 100).toFixed(3)) },
      { name: 'Sproutluck II', value: Number((1 + exotic1 / 100).toFixed(3)) },
      { name: 'Sticker', value: Number((1 + stickerBonus / 100).toFixed(3)) },
      { name: 'Sproutluck III', value: Number((1 + exotic2 / 100).toFixed(3)) },
      { name: 'Sproutluck IV', value: Number((1 + exotic3 / 100).toFixed(3)) },
      { name: 'Geneology (Lvl Scaling)', value: Number((1 + scalingExotics / 100).toFixed(3)) }
    ]
  }
}