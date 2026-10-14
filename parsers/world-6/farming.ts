import { notateNumber, tryToParse } from '@utility/helpers';
import { exoticMarketInfo, mapPortals, marketInfo, ninjaExtraInfo, research as researchData, seedInfo } from '@website-data';
import { getCharmBonus, isJadeBonusUnlocked } from '@parsers/world-6/sneaking';
import { getStarSignBonus } from '@parsers/starSigns';
import { getBubbleBonus, getVialsBonusByEffect, getVialsBonusByStat } from '@parsers/world-2/alchemy';
import { getLabBonus } from '@parsers/world-4/lab';
import { getWinnerBonus } from '@parsers/world-6/summoning';
import { getAchievementStatus } from '@parsers/achievements';
import { getVoteBonus } from '@parsers/world-2/voteBallot';
import { getGrimoireBonus } from '@parsers/class-specific/grimoire';
import { getTalentBonus, getBestActiveCharacter, getHighestTalentAcrossCharacters } from '@parsers/talents';
import {
  getEventShopBonus,
  getKillroyBonus,
  getLoggedInSkillLevel,
  isCompanionBonusActive,
  isMasteryBonusUnlocked
} from '@parsers/misc';
import { getLampBonus } from '@parsers/world-5/caverns/the-lamp';
import { getMealsBonusByEffectOrStat } from '@parsers/world-4/cooking';
import { getMonumentBonus } from '@parsers/world-5/caverns/bravery';
import { getMineheadBonusQTY } from '@parsers/world-7/minehead';
import { getStampsBonusByEffect } from '@parsers/world-1/stamps';
import { getEmperorBonus } from './emperor';
import { getResearchGridBonus } from '@parsers/world-7/research';
import { getMegacropSuperbitMulti, isSuperbitUnlocked } from '@parsers/world-5/gaming';
import { getArcadeBonus } from '@parsers/world-2/arcade';
import { getUpgradeVaultBonus } from '@parsers/misc/upgradeVault';
import { getSushiBonus } from '@parsers/world-7/sushiStation';
import { getJellyBonus } from '@parsers/world-7/jellyOperator';
import { getButtonBonus } from '@parsers/world-7/button';
import { EQUINOX_CLOUD, getCloudBonus } from '@parsers/world-3/equinox';
import { getCardBonusByEffect } from '@parsers/cards';
import { getLegendTalentBonus } from '@parsers/world-7/legendTalents';
import { getTomeBubbleMulti } from '@parsers/world-4/tome';
import LavaRand from '../../utility/lavaRand';
import { NUMBERED_GROUP, additiveGroup, createBreakdown, evaluateBreakdownNode, flat, listGroup, multiplier, percent, productGroup } from '@parsers/breakdown';

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
  const gemVineBonus = account?.gemShopPurchases?.find((value: any, index: any) => index === 139) ?? 0;
  const marketLevels = rawFarmingUpgrades?.slice(2, marketInfo.length + 2);
  const beans = rawFarmingUpgrades?.[1] ?? 0;
  const instaGrow = rawFarmingUpgrades?.[19] ?? 0;
  const researchBonus171 = getResearchGridBonus(account, 171, 0);
  const cheaperDayMarket = Math.max(0.1, 1 - (getExoticMarketBonus(account, 34) ?? 0) / 100)
    * Math.max(0.1, 1 - (getExoticMarketBonus(account, 35) ?? 0) / 100);
  const cheaperNightMarket = Math.max(0.1, 1 - (getExoticMarketBonus(account, 36) ?? 0) / 100)
    * Math.max(0.1, 1 - (getExoticMarketBonus(account, 37) ?? 0) / 100);
  const market = marketInfo?.map((upgrade, index) => {
    const { cropId, cropIdIncrement, cost, costExponent, bonusPerLvl, maxLvl, bonus } = upgrade;
    const level = marketLevels?.[index] ?? 0;
    const emperorBonus = getEmperorBonus(account, 2);
    const emperorCostCalc = Math.max(0.001, 1 - emperorBonus / (emperorBonus + 100));
    const t = Math.floor(index / 8);
    const i = index % 8;
    const marketCostReduction = t === 1 ? cheaperNightMarket : cheaperDayMarket;
    const calculatedCost = emperorCostCalc * cost * Math.pow(costExponent, level) * marketCostReduction;
    const isHardCapped = i === 0 || (t === 1 && i === 5);
    const effectiveMaxLvl = isHardCapped
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
        // hard-capped upgrades (eg Land Plots) can't go past effectiveMaxLvl even with more research,
        // so only extend the preview past the cap for research-extendable upgrades
        maxLvl: isHardCapped ? effectiveMaxLvl : Infinity,
        cost,
        costExponent,
        emperorCostCalc,
        marketCostReduction
      }),
      costToMax: calcCostToMax({ level, maxLvl: effectiveMaxLvl, cost, costExponent, emperorCostCalc, marketCostReduction }),
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
      index,
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
  const apocalypseWow = getHighestTalentAcrossCharacters(charactersData, 'DANK_RANKS', getBestActiveCharacter(charactersData)) ?? 0;
  const exoticBonus14 = getExoticMarketBonus(account, 14) ?? 0;
  const exoticMulti = 1 + exoticBonus14 / 100;
  // Only the 5th column upgrades (4/9/14/19) have a level cap, and it grows with grimoire/exotic/legend.
  const fifthColumnMaxLevel = Math.round(1 + (getGrimoireBonus(account?.grimoire?.upgrades, 9)
    + Math.ceil(getExoticMarketBonus(account, 15)))
    + (getLegendTalentBonus(account, 3) ?? 0));
  const rankMulti = Math.max(1, apocalypseWow) * exoticMulti;
  const ranks = ninjaExtraInfo?.[35]?.map((description: any, index: any) => {
    const name = names?.[index];
    const base = bases?.[index];
    const upgradeLevel = upgradesLevels?.[index];
    const unlockAt = parseFloat(unlocks?.[index]);
    const bonus = calcRankBonus(index, apocalypseWow, exoticMulti, base, upgradeLevel);

    return {
      name,
      description,
      bonus,
      base,
      upgradeLevel,
      unlockAt,
      exoticMulti,
      maxLevel: isFifthColumnRank(index) ? fifthColumnMaxLevel : null
    }
  });

  const MAX_PLOTS = 36;
  const plotSource = rawFarmingPlot ?? Array.from({ length: MAX_PLOTS }, () => [0, 0, 0, 1, 0, 0, 0]);

  const plot = plotSource?.map(([seedType, progress, cropType, isLocked, cropQuantity, currentOG, cropProgress]: any, cropIndex: any) => {
    const seed = seedInfo?.[seedType];
    const type = Math.round((seed?.cropIdMin ?? 0) + cropType);
    const growthReq = 14400 * Math.pow(1.5, seedType);
    const rank = farmingRanks?.[cropIndex];
    const rankProgress = ranksProgress?.[cropIndex];
    const rankForMath = rank ?? 0;
    const rankRequirement = (7 * rankForMath + 25 * Math.floor(rankForMath / 5) + 10) * Math.pow(1.11, rankForMath);
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
    availablePoints: Math.max(0, (totalPoints ?? 0) - (usedPoints ?? 0)),
    fifthColumnMaxLevel,
    rankMulti,
    hasLandRank,
    totalRanks: farmingRanks?.reduce((sum: any, rank: any) => sum + rank, 0),
    exoticMarkeMaxPurchases: Math.round(4 + (getMineheadBonusQTY(account, 8) + 8 * getEventShopBonus(account, 43)
      + getSushiBonus(account, 33) + 3 * getCloudBonus(account?.equinox?.challenges, EQUINOX_CLOUD.EXOTIC_MARKET_PURCHASES)
      + getJellyBonus(account, 34))),
    pctExoticPurchasesFree: Math.min(80, 30 * getEventShopBonus(account, 43)) + Math.min(25, 25 * getMineheadBonusQTY(account, 8)),
    exoticMarketUpgradesPurchased: account?.accountOptions?.[416]
  };
}

const EXOTIC_MARKET_WEEK_SECONDS = 604_800;

const getExoticMarketCurrentWeek = (account: any) => {
  if (!account?.timeAway?.GlobalTime) return null;
  return Math.floor(account.timeAway.GlobalTime / EXOTIC_MARKET_WEEK_SECONDS);
};

/**
 * The 8 upgrade indices (0-59) the game rolls for a given absolute week.
 * Mirrors the game's seeded LavaRand loop: retries with +1000 per attempt until 8 distinct indices.
 */
export const rollExoticMarketWeek = (week: number) => {
  const seed = Math.round(100 * week);
  const selectedUpgrades: number[] = [];

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

export const getExoticMarketRotation = (account: any) => {
  const currentWeek = getExoticMarketCurrentWeek(account);
  if (currentWeek === null) return [];
  return rollExoticMarketWeek(currentWeek);
};

export const EXOTIC_MARKET_RETURN_LOOKAHEAD = 104;

/**
 * Weeks until an upgrade next appears in the rotation, strictly after `afterWeekOffset`
 * (0 = the current week). Null when it doesn't show up within `lookahead` weeks of now.
 * Only the index-only schedule is built here: the caller pairs it with the rotation cards it
 * already renders, so the planner's 10-50 week selector doesn't cap the answer.
 */
export const getExoticMarketReturnWeeks = (account: any, lookahead = EXOTIC_MARKET_RETURN_LOOKAHEAD) => {
  const currentWeek = getExoticMarketCurrentWeek(account);
  if (currentWeek === null) return () => null;

  const schedule: number[][] = [];
  for (let weekOffset = 0; weekOffset <= lookahead; weekOffset++) {
    schedule.push(rollExoticMarketWeek(currentWeek + weekOffset));
  }

  return (upgradeIndex: number, afterWeekOffset = 0): number | null => {
    for (let weekOffset = afterWeekOffset + 1; weekOffset < schedule.length; weekOffset++) {
      if (schedule[weekOffset].includes(upgradeIndex)) return weekOffset - afterWeekOffset;
    }
    return null;
  };
};

export const getExoticMarketRotations = (account: any, weeks = 10) => {
  const currentWeek = getExoticMarketCurrentWeek(account);
  if (currentWeek === null) return [];

  const rotations = [];
  const processedExoticMarket = account?.farming?.exoticMarket || [];

  for (let weekOffset = 0; weekOffset < weeks; weekOffset++) {
    const selectedUpgrades = rollExoticMarketWeek(currentWeek + weekOffset);

    // Calculate the date for this rotation
    const dateInMs = Math.floor((currentWeek + weekOffset) * EXOTIC_MARKET_WEEK_SECONDS * 1000);

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

/**
 * The game rolls for an OG once per growth cycle (N.js growth tick), so the wait until the next
 * one is geometric and its average is one cycle divided by the chance. Returns that average in
 * seconds - a readable stand-in for a per-cycle percentage that means nothing on its own.
 *
 * The average, not a high percentile: a 95% figure is 3x longer than the typical wait, which
 * reads as "how long until it doubles" while actually describing the pessimistic tail.
 *
 * Null when the plot isn't rolling at all: the game only rolls once a crop is on the vine
 * (cropQuantity > 0), so an empty or still-growing plot has no meaningful wait.
 */
export const getNextOGEta = (crop: any, nextOGChance: number, maxTimeLeft: number): number | null => {
  if (crop?.seedType === -1 || !(crop?.cropQuantity > 0)) return null;
  const chance = Math.min(1, nextOGChance);
  if (!(chance > 0) || !(maxTimeLeft > 0)) return null;
  return maxTimeLeft / chance;
}

// The depot also carries the magic bean count under 'beans' (the market pays in it), which is not a crop.
const getCropsWithStockEqualOrGreaterThan = (cropDepot: any, stockLimit: any) => {
  return Object.entries(cropDepot || {}).filter(([type, value]: any) => type !== 'beans' && value >= stockLimit).length;
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

// game: "StickerBonus"
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
  const farmingLevel = getLoggedInSkillLevel(characters, 'farming');
  const sushiBonus55 = getSushiBonus(account, 55);
  // Gelatinous Cuboid (109): bonus 9 (19 upgraded) -> 10x (20x) sticker odds
  const cuboidCompanion = isCompanionBonusActive(account, 109) ? (account?.companions?.list?.at(109)?.bonus ?? 0) : 0;
  // W4 Golden Tome (opt[607]) multiplies sticker odds: 2^min(12,lvl) then +1500 per level past 11
  const goldenTome = Number(account?.accountOptions?.[607]) || 0;
  const goldenTomeMulti = Math.max(1, Math.pow(2, Math.min(12, goldenTome)) + 1500 * Math.max(0, goldenTome - 11));
  return goldenTomeMulti
    * (1 + grid67bonus / 100)
    * (1 + grid88bonus / 100)
    * (1 + sticker5bonus / 100)
    * (1 + arcade64 / 100)
    * (superBit55 ? getMegacropSuperbitMulti(farmingLevel) : 1)
    * (1 + sushiBonus55 / 100)
    * (1 + cuboidCompanion);
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
  const growthSpeedBreakdown = createBreakdown('Growth Speed', growthRate, [
    multiplier('Speed GMO', Math.max(1, speedGMO)),
    additiveGroup(NUMBERED_GROUP, [
      percent('Nutritious Soil', marketGrowthRate),
      percent('Vial', vialBonus),
      percent('Gogogrow (Exotic)', exoticGrowth)
    ]),
    multiplier('Summoning', 1 + summoningBonus / 100)
  ]);
  const maxTimes = [0, 1, 2, 3, 4, 5, 6].map((seedType, index) => {
    const growthReq = index === 6 ? 25200 * growthRate : 14400 * Math.pow(1.5, seedType);
    const value = growthReq / growthRate;
    return { value, breakdown: growthSpeedBreakdown };
  });

  // OG Chance (multiplier portion, without per-plot 0.4^OG base)
  const marketOGChance = getMarketBonus(account?.farming?.market, 'OG_FERTILIZER');
  const charmOGBonus = getCharmBonus(account, 'Taffy_Disc');
  const ogStarSignBonus = getStarSignBonus(getBestActiveCharacter(characters), account, 'OG_Chance');
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
  const ogChanceBreakdown = createBreakdown('OG Chance Multiplier', ogMultiplier, [
    multiplier('OG Fertilizer (Market)', Math.max(1, marketOGChance)),
    multiplier('Taffy Disc (Charm)', 1 + charmOGBonus / 100),
    multiplier('Star Sign', 1 + ogStarSignBonus / 100),
    multiplier('Task', 1 + ogTaskBonus / 100),
    multiplier('Achievement', 1 + (15 * ogAchievementBonus) / 100),
    multiplier('Land Rank', 1 + ogLandRankBonus / 100),
    multiplier('Evergrow I (Exotic)', 1 + ogExotic26 / 100),
    multiplier('Evergrow II (Exotic)', 1 + ogExotic27 / 100)
  ]);

  const newPlot = account?.farming?.plot?.map((crop: any) => {
    const nextOGChance = Math.pow(0.4, crop?.currentOG + 1) * ogMultiplier;

    const growthReq = crop?.seedType === 6 ? 25200 * growthRate : 14400 * Math.pow(1.5, crop?.seedType);
    const timeLeft = (growthReq - crop?.progress) / growthRate;
    const maxTimeLeft = growthReq / growthRate;
    const ogMulti = Math.min(1e9, Math.max(1, Math.pow(2, crop?.currentOG)));
    return {
      ...crop,
      nextOGChance,
      nextOGEta: getNextOGEta(crop, nextOGChance, maxTimeLeft),
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

// Soil Exp Boost reads the rank of the land before each plot; the first plot reads its own
const getPrevPlotRank = (plots: any[], index: number) => plots?.[Math.max(0, index - 1)]?.rank ?? 0;

// The previous-land rank of every plot that counts: the growing ones, or all of them between
// harvests. Paired before filtering, since the neighbour is the physical one, empty or not.
const getScoredPlotPrevRanks = (plots: any[] = []) => {
  const isGrowing = ({ seedType }: any) => seedType !== -1;
  const anyGrowing = plots.some(isGrowing);
  return plots
    .map((plot: any, index: number) => ({ plot, prevRank: getPrevPlotRank(plots, index) }))
    .filter(({ plot }: any) => !anyGrowing || isGrowing(plot))
    .map(({ prevRank }: any) => prevRank);
};

// The game's collect adds rank EXP from the market and the Soil Exp land ranks only. The talent
// and the Stableroot / Vigouroot exotics feed the farming screen's Land Rank EXP stat, which
// nothing else reads.
const getLandRankExpBreakdown = (account: any, characters: any) => {
  const talentBonus = getHighestTalentAcrossCharacters(characters, 'AGRICULTURAL_\'PRECIATION', getBestActiveCharacter(characters)) ?? 0;
  const marketBonus = getMarketBonus(account?.farming?.market, 'RANK_BOOST');
  const soilExpBoost = getLandRank(account?.farming?.ranks, 2) ?? 0;
  const soilExpSuperboost = getLandRank(account?.farming?.ranks, 6) ?? 0;
  const soilExpMegaboost = getLandRank(account?.farming?.ranks, 13) ?? 0;
  const exotic9 = getExoticMarketBonus(account, 9);
  const exotic10 = getExoticMarketBonus(account, 10);
  const exotic11 = getExoticMarketBonus(account, 11);
  const exotic12 = getExoticMarketBonus(account, 12);
  const exotic13 = getExoticMarketBonus(account, 13);

  const prevRanks = getScoredPlotPrevRanks(account?.farming?.plot);
  const avgPrevRank = prevRanks.reduce((sum: number, rank: number) => sum + rank, 0) / (prevRanks.length || 1);
  const soilExpBoostMulti = 1 + (soilExpBoost * avgPrevRank) / 100;

  const value = (1 + marketBonus / 100)
    * soilExpBoostMulti
    * (1 + (soilExpSuperboost + soilExpMegaboost) / 100);

  return createBreakdown('Land Rank EXP', value, [
    multiplier('Rank Boost (Market)', 1 + marketBonus / 100),
    multiplier('Soil Exp Boost (Land Rank)', soilExpBoostMulti, {
      note: 'Average over your plots: each plot uses the rank of the land before it'
    }),
    additiveGroup(NUMBERED_GROUP, [
      percent('Soil Exp Superboost (Land Rank)', soilExpSuperboost),
      percent('Soil Exp Megaboost (Land Rank)', soilExpMegaboost)
    ]),
    listGroup('Not applied by the game', [
      multiplier('Talent (Ag. Appreciation)', 1 + talentBonus / 100),
      percent('Stableroot I (Exotic)', exotic9),
      percent('Stableroot II (Exotic)', exotic10),
      percent('Stableroot III (Exotic)', exotic11),
      multiplier('Vigouroot I (Exotic)', 1 + exotic12 / 100),
      multiplier('Vigouroot II (Exotic)', 1 + exotic13 / 100)
    ], { note: 'Shown on the farming screen only' })
  ]);
};

const getCropsOnVineBreakdown = (account: any) => {
  const marketBonus = getMarketBonus(account?.farming?.market, 'STRONGER_VINES');
  const gemVineBonus = account?.gemShopPurchases?.find((_: any, index: any) => index === 139) ?? 0;
  const exotic31 = getExoticMarketBonus(account, 31);
  const exotic32 = getExoticMarketBonus(account, 32);
  const exotic33 = getExoticMarketBonus(account, 33);

  const totalBonus = marketBonus + 20 * gemVineBonus + exotic31 + exotic32 + exotic33;
  const value = Math.floor(1 + totalBonus / 100);

  return createBreakdown('Crops on Vine', value, [
    additiveGroup(NUMBERED_GROUP, [
      percent('Stronger Vines (Market)', marketBonus),
      percent('Gem Shop (Vineyard)', 20 * gemVineBonus),
      percent('Bountiful I (Exotic)', exotic31),
      percent('Bountiful II (Exotic)', exotic32),
      percent('Bountiful III (Exotic)', exotic33)
    ], { unit: 'flat', round: 'floor', note: 'Rounded down to whole crops' })
  ]);
};

// Stalk Value exotics raise this
const CROP_VALUE_BASE_CAP = 10000;

const getCropValueBreakdown = (account: any, market: any) => {
  const landRankTotal = getLandRankTotalBonus(account, 1);
  const valueGMO = getMarketBonus(market, 'VALUE_GMO', 'value');
  const landRankPerPlot = getLandRank(account?.farming?.ranks, 1);
  const exotic23 = getExoticMarketBonus(account, 23);
  const exotic24 = getExoticMarketBonus(account, 24);
  const exotic25 = getExoticMarketBonus(account, 25);
  const voteBonus = getVoteBonus(account, 29);
  const avgRank = (account?.farming?.plot?.reduce((sum: any, p: any) => sum + (p?.rank ?? 0), 0) ?? 0)
    / (account?.farming?.plot?.length || 1);

  const cap = CROP_VALUE_BASE_CAP * (1 + (exotic23 + exotic24 + exotic25) / 100);
  const uncappedValue = (1 + landRankTotal / 100)
    * Math.max(1, valueGMO)
    * (1 + (landRankPerPlot * avgRank + voteBonus) / 100);
  const value = Math.min(cap, Math.round(uncappedValue));

  return createBreakdown('Crop Value', value, [
    productGroup(NUMBERED_GROUP, [
      multiplier('Land Rank Total', 1 + landRankTotal / 100),
      multiplier('Value GMO (Market)', Math.max(1, valueGMO)),
      additiveGroup(NUMBERED_GROUP, [
        percent('Land Rank (per plot avg)', landRankPerPlot * avgRank),
        percent('Vote', voteBonus)
      ])
    ], { round: 'round', note: 'Rounded to a whole number' }),
    productGroup('Crop value cap', [
      flat('Base cap', CROP_VALUE_BASE_CAP),
      additiveGroup(NUMBERED_GROUP, [
        percent('Stalk Value I (Exotic)', exotic23),
        percent('Stalk Value II (Exotic)', exotic24),
        percent('Stalk Value III (Exotic)', exotic25)
      ])
    ], { unit: 'flat' })
  ], { combine: 'min' });
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

  return createBreakdown('Magic Bean Trade', value, [
    flat('Crop Value', baseValue),
    productGroup(NUMBERED_GROUP, [
      multiplier('More Beenz (Market)', 1 + marketBonus / 100),
      additiveGroup(NUMBERED_GROUP, [
        percent('Deal Sweetening (Jade)', 25 * jadeUpgrade),
        percent('Achievement', 5 * achievementBonus),
        percent('Legumioso I (Exotic)', exotic16),
        percent('Legumioso II (Exotic)', exotic17),
        percent('Legumioso III (Exotic)', exotic18),
        percent('Vault', vaultBonus85)
      ]),
      multiplier('Largumes I (Exotic)', 1 + exotic19 / 100),
      multiplier('Largumes II (Exotic)', 1 + exotic20 / 100)
    ])
  ]);
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
                              emperorCostCalc,
                              marketCostReduction = 1
                            }: any) => {
  // Night market (index >= 8) pays magic beans for every level - N.js only resolves a crop type for
  // the day and exotic markets. Grouping its levels by crop type collapses several levels onto one
  // key and sums their costs, so preview the next individual levels instead.
  if (index >= 8) {
    const upgrades = [];
    for (let nextLevel = level + 1; upgrades.length < 4 && nextLevel < maxLvl; nextLevel++) {
      upgrades.push({
        type: getCropType({ index, cropId, cropIdIncrement, level: nextLevel }),
        cost: emperorCostCalc * cost * Math.pow(costExponent, nextLevel) * marketCostReduction
      });
    }
    return upgrades;
  }

  const upgradeMap = new Map();

  let extraLv = 0;

  while (upgradeMap.size < 4 && (level + extraLv < maxLvl)) {
    const type = getCropType({
      index,
      cropId,
      cropIdIncrement,
      level: level + extraLv
    });

    const localCost = emperorCostCalc * cost * Math.pow(costExponent, level + extraLv) * marketCostReduction;

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
  // MainframeBonus(17): Depot Studies PhD plus the Pure Opal Rhombol
  const labBonus = getLabBonus(account?.lab?.labBonuses, 17);
  const grimoireBonus = getGrimoireBonus(account?.grimoire?.upgrades, 22);
  const exoticBonus40 = getExoticMarketBonus(account, 40) ?? 0;
  const vaultBonus79 = getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 79);
  const extraBonus = (1 + labBonus / 100)
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
  const level = upgradeLevel ?? 0;
  return 4 === index || 9 === index || 14 === index || 19 === index
    ? Math.max(1, apocalypseWow) * exoticMulti * base * level
    : Math.max(1, apocalypseWow) * exoticMulti * ((1.7 * base * level) / (level + 80));
}

/** The 5th column of the land rank grid (4/9/14/19) scales linearly and is the only capped column. */
export const isFifthColumnRank = (index: any) => 0 === (index + 1) % 5;

export const getLandRank = (ranks: any, index: any, characters?: any, activeCharacter?: any) => {
  const rank = ranks?.[index];
  if (!rank || !characters || !activeCharacter) return rank?.bonus;
  const { base, upgradeLevel, exoticMulti } = rank;
  const apocalypseWow = getHighestTalentAcrossCharacters(characters, 'DANK_RANKS', activeCharacter) ?? 0;
  return calcRankBonus(index, apocalypseWow, exoticMulti, base, upgradeLevel);
}

// The ranks scale with DANK_RANKS, which the game reads as the active character sees it: pass the
// character to get its view, or leave it out for the value stored at parse time.
export const getLandRankTotalBonus = (account: any, index: any, characters?: any, character?: any) => {
  const rank = (rankIndex: number) => getLandRank(account?.farming?.ranks, rankIndex, characters, character);
  return 0 === index ? (1 + rank(3) / 100)
    * (1 + rank(10) / 100) *
    (1 + rank(15) / 100) :
    1 === index ? rank(8)
      + rank(17) :
      2 === index ? rank(6)
        + rank(13) :
        3 === index ? rank(7)
          + (rank(11)
            + rank(18))
          : 4 === index ? rank(5)
            + (rank(12) +
              rank(16)) : 1;
}

/**
 * Land rank upgrades all cost exactly 1 rank point (N.js LankRankPTSleft is just
 * sum(plot ranks) - sum(upgrade levels)), and every non-5th-column upgrade is concave
 * (1.7 * base * lv / (lv + 80)), so allocating points greedily by marginal gain is optimal.
 * Goals group the upgrades by what they actually boost - comparing +1% total damage against
 * +1% rank EXP would be meaningless.
 */
export const LAND_RANK_GOALS: any = {
  evolution: { name: 'Crop Evolution', upgrades: [0, 3, 10, 15] },
  cropValue: { name: 'Crop Value', upgrades: [1, 8, 17] },
  rankExp: { name: 'Rank EXP', upgrades: [2, 6, 13] },
  overgrowth: { name: 'Overgrowth', upgrades: [7, 11, 18] },
  farmingExp: { name: 'Farming EXP', upgrades: [5, 12, 16] },
  character: { name: 'Character Stats', upgrades: [4, 9, 14, 19] }
};

const getLandRankGoalOfUpgrade = (index: any) => Object.keys(LAND_RANK_GOALS)
  .find((goal) => LAND_RANK_GOALS[goal].upgrades.includes(index));

/**
 * Score of a goal, in log space. Bonuses that multiply into the same stat are multiplied, ones
 * that stack additively are summed, mirroring getLandRankTotalBonus / getRanksTotalBonus. The
 * upgrades that scale with a plot's own rank (0/1/2) are summed over the plots rather than applied
 * to an average one, so the game's per-plot caps land on the right plots. The character goal
 * covers four unrelated stats, so it sums their logs instead.
 */
const getLandRankGoalScore = (goal: any, bonusAt: any, context: any) => {
  const { plotRanks, plotPrevRanks, voteBonus, cropValueConstant, cropValueCap } = context;
  const b = (index: any) => bonusAt(index);
  // No plots at all (farming barely started) - the three goals below sum over the plots, and a sum
  // over none is log(0) = -Infinity, which would poison the combined 'all' score.
  const plotless = !plotRanks.length;
  if ('evolution' === goal) {
    // A plot already sitting at 100% evolution chance is capped for the crop it currently grows,
    // not for good: pushing the bonus higher is what carries it onto a deeper crop, where the
    // decay has eaten the chance back down. Scoring this against the 100% cap would call the whole
    // evolution branch worthless the moment it starts working.
    if (plotless) return 0;
    const shared = (1 + b(3) / 100) * (1 + b(10) / 100) * (1 + b(15) / 100);
    return Math.log(plotRanks.reduce((sum: any, rank: any) =>
      sum + shared * (1 + (b(0) * rank + voteBonus) / 100), 0));
  }
  if ('cropValue' === goal) {
    // getTotalCrop caps each plot's multiplier, and unlike the evolution cap this one doesn't move
    // with the crop being grown - past it, more crop value bonus does nothing at all, ever. Scoring
    // the capped value is what stops the plan recommending points that buy zero.
    if (plotless) return 0;
    const shared = cropValueConstant * (1 + (b(8) + b(17)) / 100);
    return Math.log(plotRanks.reduce((sum: any, rank: any) =>
      sum + Math.min(cropValueCap, shared * (1 + (b(1) * rank + voteBonus) / 100)), 0));
  }
  if ('rankExp' === goal) {
    // Upgrade 2 reads the rank of the *previous* land, so each plot is scored against its
    // physically adjacent neighbour, empty plots included.
    if (plotless) return 0;
    const shared = 1 + (b(6) + b(13)) / 100;
    return Math.log(plotRanks.reduce((sum: any, _: any, index: any) =>
      sum + shared * (1 + (b(2) * (plotPrevRanks?.[index] ?? 0)) / 100), 0));
  }
  if ('overgrowth' === goal) {
    return Math.log(1 + (b(7) + b(11) + b(18)) / 100);
  }
  if ('farmingExp' === goal) {
    return Math.log(1 + (b(5) + b(12) + b(16)) / 100);
  }
  if ('character' === goal) {
    return LAND_RANK_GOALS.character.upgrades.reduce((sum: any, index: any) => sum + Math.log(1 + b(index) / 100), 0);
  }
  return 0;
};

/**
 * True when every plot's crop multiplier already sits at the game cap. The crop value land ranks
 * feed that multiplier and nothing else, so past this point they buy nothing at all and the plan
 * correctly comes back empty - which reads as "something is locked" unless the page says otherwise.
 */
export const isCropValueCapped = (account: any) => {
  const farming = account?.farming;
  const plots = (farming?.plot ?? []).filter(({ seedType }: any) => seedType !== -1);
  if (!plots.length) return false;
  const parts = getPlotCropMultiParts(account, farming?.market, farming?.ranks);
  return plots.every(({ rank }: any) => getPlotCropMulti(parts, rank) >= parts.cap);
};

/**
 * The per-plot crop multiplier (N.js CropsBonusValue), split in two: the constant factors
 * (product doubler, VALUE GMO, vote, cap) and the land-rank-driven ones (ranksMulti,
 * productionBoost), so the land-rank optimizer can re-derive the rank-driven part from candidate
 * levels while getTotalCrop and isCropValueCapped take the whole thing.
 */
// game: "CropsBonusValue"
const getPlotCropMultiParts = (account: any, market: any, ranks: any) => ({
  constantMulti: Math.max(1, Math.floor(1 + (getProductDoubler(market)?.productDoubler ?? 0) / 100))
    * Math.max(1, getMarketBonus(market, 'VALUE_GMO', 'value')),
  ranksMulti: 1 + getRanksTotalBonus(ranks, 1) / 100,
  productionBoost: getLandRank(ranks, 1),
  voteBonus: getVoteBonus(account, 29),
  cap: getCropValueMultiCap(account)
});

const getPlotCropMulti = ({ constantMulti, ranksMulti, productionBoost, voteBonus, cap }: any, rank: any) =>
  Math.min(cap, Math.round(constantMulti * ranksMulti * (1 + (productionBoost * (rank ?? 0) + voteBonus) / 100)));

export const getOptimizedLandRankUpgrades = (account: any, maxUpgrades = 10, options: any = {}) => {
  const { goal = 'evolution', onlyAffordable = false } = options;
  const farming = account?.farming;
  const ranks = farming?.ranks;
  if (!ranks?.length) return [];

  const rankMulti = farming?.rankMulti ?? 1;
  const totalRanks = farming?.totalPoints ?? 0;
  const fifthColumnMaxLevel = farming?.fifthColumnMaxLevel ?? Infinity;
  const availablePoints = farming?.availablePoints ?? 0;
  // Mirrors getTotalCrop / getCropEvolution: the same plots, the same vote bonus, and the same
  // constant factors around the part the land ranks actually move.
  const allPlots = farming?.plot ?? [];
  // Between harvests every plot sits empty, and the goals that sum over the growing ones would then
  // sum over nothing - log(0) = -Infinity, which drags the combined 'all' score down with it and
  // leaves the whole plan empty. Land ranks are permanent, so score every plot instead: the answer
  // to "where do these points go" shouldn't flip to "nowhere" just because the crops were collected.
  const growingPlots = allPlots.filter(({ seedType }: any) => seedType !== -1);
  const scoredPlots = growingPlots.length ? growingPlots : allPlots;
  const plotRanks = scoredPlots.map(({ rank }: any) => rank ?? 0);
  const plotPrevRanks = getScoredPlotPrevRanks(allPlots);
  const cropMultiParts = getPlotCropMultiParts(account, farming?.market, ranks);
  const context = {
    plotRanks,
    plotPrevRanks,
    voteBonus: cropMultiParts.voteBonus,
    cropValueConstant: cropMultiParts.constantMulti,
    cropValueCap: cropMultiParts.cap
  };

  const levels = ranks.map(({ upgradeLevel }: any) => upgradeLevel ?? 0);
  const bonusOf = (index: any, level: any) => rankMulti * (isFifthColumnRank(index)
    ? ranks[index]?.base * level
    : (1.7 * ranks[index]?.base * level) / (level + 80));

  const goals = 'all' === goal ? Object.keys(LAND_RANK_GOALS) : [goal];
  const scoreOf = (currentLevels: any) => {
    const bonusAt = (index: any) => bonusOf(index, currentLevels[index]);
    return goals.reduce((sum: any, key: any) => sum + getLandRankGoalScore(key, bonusAt, context), 0);
  };

  const candidates = 'all' === goal
    ? ranks.map((_: any, index: any) => index)
    : (LAND_RANK_GOALS[goal]?.upgrades ?? []);

  const limit = onlyAffordable ? Math.min(maxUpgrades, availablePoints) : maxUpgrades;
  const upgrades = [];
  let currentScore = scoreOf(levels);

  for (let step = 0; step < limit; step++) {
    let best = null;
    for (const index of candidates) {
      if (totalRanks < (ranks[index]?.unlockAt ?? 0)) continue;
      if (isFifthColumnRank(index) && levels[index] >= fifthColumnMaxLevel) continue;
      levels[index] += 1;
      const score = scoreOf(levels);
      levels[index] -= 1;
      if (!best || score > best.score) {
        best = { index, score };
      }
    }
    if (!best || best.score <= currentScore) break;

    const { index } = best;
    const level = levels[index];
    const bonusBefore = bonusOf(index, level);
    const bonusAfter = bonusOf(index, level + 1);
    upgrades.push({
      index,
      name: ranks[index]?.name,
      description: ranks[index]?.description,
      goal: getLandRankGoalOfUpgrade(index),
      level,
      newLevel: level + 1,
      maxLevel: isFifthColumnRank(index) ? fifthColumnMaxLevel : null,
      bonusBefore,
      bonusAfter,
      bonusChange: bonusAfter - bonusBefore,
      // Composite gain across the whole goal, not just this upgrade's own bonus.
      percentChange: 100 * (Math.exp(best.score - currentScore) - 1),
      cost: 1,
      cumulativeCost: step + 1,
      pointsLeft: availablePoints - (step + 1)
    });
    levels[index] += 1;
    currentScore = best.score;
  }

  return upgrades;
};

const calcCostToMax = ({ level, maxLvl, cost, costExponent, emperorCostCalc, marketCostReduction = 1 }: any) => {
  let costToMax = 0;
  for (let i = level; i < maxLvl; i++) {
    costToMax += emperorCostCalc * cost * Math.pow(costExponent, i) * marketCostReduction
  }
  return costToMax ?? 0;
}

/** The game clamps each plot's crop multiplier here (N.js CropsBonusValue), before exotics. */
const CROP_VALUE_MULTI_BASE_CAP = 1e4;

/**
 * Exotic market 23/24/25 scale the crop multiplier cap, so it isn't a flat 1e4 (N.js
 * CropsBonusValue: Math.min(1e4 * (1 + (Exotic23 + Exotic24 + Exotic25) / 100), ...)).
 */
const getCropValueMultiCap = (account: any) => CROP_VALUE_MULTI_BASE_CAP
  * (1 + (getExoticMarketBonus(account, 23)
    + getExoticMarketBonus(account, 24)
    + getExoticMarketBonus(account, 25)) / 100);

export const getTotalCrop = (plot: any, market: any, ranks: any, account: any) => {
  // Everything except the plot's own rank is account-wide, so it is computed once, not per plot.
  const parts = getPlotCropMultiParts(account, market, ranks);
  return plot?.reduce((total: any, { seedType, cropQuantity, cropRawName, ogMulti, rank }: any) => {
    if (seedType === -1) return total;
    const finalMulti = getPlotCropMulti(parts, rank);
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

const CROP_EVO_MAX_CHANCE = 100;
// The chance is rounded to one decimal
const CROP_EVO_CHANCE_STEP = 0.1;

// game: TalentCalc counts, across every character, the 13 World 6 maps (251-263) with no kills left
const WORLD_6_FIRST_MAP = 251;
const WORLD_6_MAP_COUNT = 13;
const getClearedWorld6Maps = (characters: any[] = []) => characters.reduce((sum, { kills }: any) => {
  for (let map = WORLD_6_FIRST_MAP; map < WORLD_6_FIRST_MAP + WORLD_6_MAP_COUNT; map++) {
    // kills holds kills done, so "less than 1 kill left" is kills > requirement - 1
    if ((kills?.[map] ?? 0) > parseFloat(mapPortals?.[map]?.[0] as any) - 1) sum++;
  }
  return sum;
}, 0);

// characters: getbonus2(1, 205, -1) and the World 6 map count read every character; without them the
// viewed character's own Mass Irrigation is used and Cropius Mapper counts nothing
export const getCropEvolution = (account: any, character: any, crop: any, forceStarSign: any, characters?: any[]) => {
  const marketBonus1 = getMarketBonus(account?.farming?.market, 'BIOLOGY_BOOST');
  const winBonus = getWinnerBonus(account, '<x Crop EVO');
  const lampBonus = getLampBonus({ holesObject: account?.hole?.holesObject, t: 2, i: 0, account });
  // AlchBubbles.W10AllCharz
  const tomePoints = account?.tome?.totalPoints ?? 0;
  const bubbleBonus1 = getBubbleBonus(account, 'CROP_CHAPTER', false) * getTomeBubbleMulti(tomePoints);
  // AlchBubbles.Y6: per cleared World 6 map, every character
  const bubbleBonus2 = getBubbleBonus(account, 'CROPIUS_MAPPER', false) * getClearedWorld6Maps(characters);
  const vialBonus = getVialsBonusByEffect(account?.alchemy?.vials, null, '6FarmEvo');
  const mealBonus1 = getMealsBonusByEffectOrStat(account, null, 'zCropEvo');
  const mealBonus2 = getMealsBonusByEffectOrStat(account, null, 'zCropEvoSumm');
  const monumentBonus = getMonumentBonus({ holesObject: account?.hole?.holesObject, t: 2, i: 4 });
  const stampBonus = getStampsBonusByEffect(account, 'Crop_Evolution_Chance', character);
  const grimoireBonus = getGrimoireBonus(account?.grimoire?.upgrades, 14);
  const killroyBonus = getKillroyBonus(account, 3);
  // BasketUpgQTY(99, 1): the GMO compounds per crop type stocked, so it is the computed value, not the level bonus
  const marketBonus2 = getMarketBonus(account?.farming?.market, 'EVOLUTION_GMO', 'value');
  const skillMasteryBonus = isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.farming?.rank, 1);
  const starSignBonus = getStarSignBonus(character, account, 'Crop_Evo', forceStarSign);
  const talentBonus = characters?.length
    ? getHighestTalentAcrossCharacters(characters, 'MASS_IRRIGATION', character) ?? 0
    : getTalentBonus(character?.flatTalents, 'MASS_IRRIGATION');
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
  const summoningLevel = character?.skillsInfo?.summoning?.level ?? 0;
  const summoningMealBonus = mealBonus2 * Math.ceil((summoningLevel + 1) / 50);
  const landRankPerPlot = getLandRank(account?.farming?.ranks, 0) * (account?.farming?.plot?.[crop?.index]?.rank ?? 0) + voteBonus;

  // The game fills its per-seed base chance list with SeedInfo[0][5] for every seed, so all seeds share it
  const nextCropChance = crop?.seed ? seedInfo?.[0]?.nextCropChance ?? 0 : 0;
  const nextCropDecay = crop?.seed?.nextCropDecay ?? 0;
  const baseCropType = crop?.baseCropType ?? 0;

  // In percent, so the product of both sections is the chance shown
  const baseChance = productGroup('Base evolution chance', [
    flat('Seed', 100 * nextCropChance),
    multiplier('Crop tier decay', Math.pow(nextCropDecay, baseCropType))
  ], { unit: 'flat' });
  const multipliers = productGroup(NUMBERED_GROUP, [
    multiplier('Biology Boost (Market)', 1 + marketBonus1 / 100),
    multiplier('Evolution GMO (Market)', Math.max(1, marketBonus2)),
    multiplier('Summoning', 1 + winBonus / 100),
    multiplier('Lamp', 1 + lampBonus / 100),
    multiplier('Crop Chapter (Bubble)', 1 + bubbleBonus1 / 100),
    multiplier('Cropius Mapper (Bubble)', 1 + bubbleBonus2 / 100),
    multiplier('Vial', 1 + vialBonus / 100),
    multiplier('Card', 1 + cardBonus / 100),
    multiplier('Meal', 1 + mealBonus1 / 100),
    multiplier('Summoning meal', 1 + summoningMealBonus / 100),
    multiplier('Upgrade vault', 1 + vaultBonus78 / 100),
    multiplier('Monument', 1 + monumentBonus / 100),
    multiplier('Stamp', 1 + stampBonus / 100),
    multiplier('Grimoire', 1 + grimoireBonus / 100),
    multiplier('Achievement', 1 + (5 * achievementBonus) / 100),
    multiplier('Killroy', Math.max(1, killroyBonus)),
    multiplier('Skill mastery', 1 + (15 * skillMasteryBonus) / 100),
    multiplier('Star sign', 1 + (starSignBonus * farmingLevel) / 100),
    multiplier('Land rank total', Math.max(1, getLandRankTotalBonus(account, 0))),
    multiplier('Mass Irrigation (Talent)', Math.max(1, talentBonus)),
    multiplier('Land rank and vote', 1 + landRankPerPlot / 100),
    multiplier('Sproutluck I', 1 + exotic0 / 100),
    multiplier('Button', 1 + buttonBonus / 100),
    multiplier('Sproutluck II', 1 + exotic1 / 100),
    multiplier('Sticker', 1 + stickerBonus / 100),
    multiplier('Sproutluck III', 1 + exotic2 / 100),
    multiplier('Sproutluck IV', 1 + exotic3 / 100),
    multiplier('Geneology (level scaling)', 1 + scalingExotics / 100),
    multiplier('Sushi', 1 + sushiBonus / 100)
  ]);

  const uncappedChance = evaluateBreakdownNode(baseChance) * evaluateBreakdownNode(multipliers);
  let value = Math.round(10 * Math.min(CROP_EVO_MAX_CHANCE, uncappedChance)) / 10;
  // A plot's lock is exactly this roll's off switch - the game skips the crop type increment
  // while it's set, and shows "NO" in place of the percentage. The bonuses below are still worth
  // seeing, so only the chance itself is zeroed.
  const isLocked = Boolean(crop?.isLocked);
  if (isLocked) value = 0;
  if (uncappedChance > CROP_EVO_MAX_CHANCE) multipliers.note = `Capped at ${CROP_EVO_MAX_CHANCE}%`;

  return {
    value,
    isLocked,
    breakdown: createBreakdown('Crop evolution chance', isLocked ? 'Locked' : `${value}%`, [baseChance, multipliers],
      isLocked ? { combine: 'list' } : { max: CROP_EVO_MAX_CHANCE, round: 'round', step: CROP_EVO_CHANCE_STEP })
  }
}