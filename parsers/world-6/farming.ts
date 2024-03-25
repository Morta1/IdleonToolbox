import { tryToParse } from "@utility/helpers";
import { marketInfo, seedInfo } from '../../data/website-data';
import { getCharmBonus, getJadeEmporiumBonus, isJadeBonusUnlocked } from "@parsers/world-6/sneaking";
import { getStarSignBonus } from "@parsers/starSigns";
import { getVialsBonusByStat } from "@parsers/alchemy";
import { getLabBonus } from "@parsers/lab";
import { getWinnerBonus } from "@parsers/world-6/summoning";

export const getFarming = (idleonData: any, accountData: any) => {
  const rawFarmingUpgrades = tryToParse(idleonData?.FarmUpg);
  const rawFarmingPlot = tryToParse(idleonData?.FarmPlot);
  const rawFarmingCrop = tryToParse(idleonData?.FarmCrop);
  return parseFarming(rawFarmingUpgrades, rawFarmingPlot, rawFarmingCrop, accountData);
}

const parseFarming = (rawFarmingUpgrades: any, rawFarmingPlot: any, rawFarmingCrop: any, account: any) => {
  const gemVineBonus = account?.gemShopPurchases?.find((value: number, index: number) => index === 139);
  const marketLevels = rawFarmingUpgrades?.slice(2, marketInfo.length + 1);
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
      nextUpgrades: getNextUpgradesReq({ index, cropId, cropIdIncrement, level, cost, costExponent }),
      costToMax: calcCostToMax({ level, maxLvl, cost, costExponent }),
      value: bonus.includes('}') ? (1 + (level * bonusPerLvl) / 100) : level * bonusPerLvl
    }
  });
  const plot = rawFarmingPlot?.map(([seedType, progress, cropType, isLocked, cropQuantity, currentOG, cropProgress]: number[]) => {
    const type = Math.round(seedInfo?.[seedType]?.cropIdMin + cropType);
    const growthReq = 14400 * Math.pow(1.5, seedType);
    return {
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
  const beanTrade = Math.pow(cropsForBeans, 0.5) * (1 + marketBonus / 100) * (1 + 25 * jadeUpgrade / 100);
  // console.log('plot', plot);
  // console.log('crop', rawFarmingCrop);
  // console.log('market', market);
  return {
    plot,
    crop: { ...rawFarmingCrop, beans },
    market,
    cropsFound: Object.keys(rawFarmingCrop || {}).length,
    cropsOnVine,
    instaGrow,
    beanTrade
  };
}

export const updateFarming = (characters: any, account: any) => {
  const newPlot = account?.farming?.plot?.map((crop: any) => {
    // OG Chance
    const marketOGChance = getMarketBonus(account?.farming?.market, "OG_FERTILIZER");
    const charmOGChange = getCharmBonus(account, 'Taffy_Disc');
    const starSignBonus = getStarSignBonus(characters?.[0], account, 'OG_Chance');
    const nextOGChance = Math.pow(0.4, crop?.currentOG + 1)
      * Math.max(1, marketOGChance)
      * (1 + charmOGChange / 100)
      * (1 + starSignBonus / 100);
    // Growth
    const marketGrowthRate = getMarketBonus(account?.farming?.market, "NUTRITIOUS_SOIL");
    const marketGrowthPerCrop = getMarketBonus(account?.farming?.market, "SPEED_GMO");
    const cropsAboveThousand = Object.values(account?.farming?.crop)?.filter((value: any) => value >= 1000)?.length;
    const vialBonus = getVialsBonusByStat(account?.alchemy?.vials, '6FarmSpd');
    const summoningBonus = getWinnerBonus(account, '<x Farming SPD', false);
    const growthRate = Math.max(1, marketGrowthPerCrop * cropsAboveThousand)
      * (1 + (marketGrowthRate + vialBonus) / 100) * summoningBonus;
    const timeLeft = (crop?.growthReq - crop?.cropProgress) / growthRate;
    const ogMulti = Math.min(1e9, Math.max(1, Math.pow(2, crop?.currentOG)));
    return {
      ...crop,
      nextOGChance,
      growthRate,
      ogMulti,
      timeLeft
    }
  });
  return {
    ...(account?.farming || {}),
    plot: newPlot,
    cropDepot: getCropDepotBonuses(account)
  }
}

const getNextUpgradesReq = ({ index, cropId, cropIdIncrement, level, cost, costExponent }: any) => {
  const upgradeMap = new Map();

  let extraLv = 0;

  while (upgradeMap.size < 4) {
    const type = getCropType({
      index,
      cropId,
      cropIdIncrement,
      level: level + extraLv
    });

    const localCost = cost * Math.pow(costExponent, level + extraLv);

    if (upgradeMap.has(type)) {
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
  const labBonus = getLabBonus(account?.lab?.labBonuses, 17);
  let bonuses = {
    damage: { name: 'DMG', value: 0 },
    gamingEvo: { name: 'Gaming Evo', value: 0 },
    jadeCoin: { name: 'Jade Coin', value: 0 },
    cookingSpeed: { name: 'Meal Spd', value: 0 },
    cash: { name: 'Cash', value: 0 },
    shiny: { name: 'Pet Rate', value: 0 },
    critters: { name: 'Critters', value: 0 }
  };
  if (isJadeBonusUnlocked(account, 'Reinforced_Science_Pencil')) {
    bonuses.damage.value = 20 * Math.round(account?.farming?.cropsFound) * (1 + labBonus / 100);
  }
  if (isJadeBonusUnlocked(account, 'Science_Pen')) {
    bonuses.gamingEvo.value = Math.pow(1.02, Math.round(account?.farming?.cropsFound)) * (1 + labBonus / 100);
  }
  if (isJadeBonusUnlocked(account, 'Science_Marker')) {
    bonuses.jadeCoin.value = 8 * Math.round(account?.farming?.cropsFound) * (1 + labBonus / 100);
  }
  if (isJadeBonusUnlocked(account, 'Science_Featherpen')) {
    bonuses.cookingSpeed.value = Math.pow(1.1, Math.round(account?.farming?.cropsFound)) * (1 + labBonus / 100);
  }
  if (isJadeBonusUnlocked(account, 'Science_Environmentally_Sourced_Pencil')) {
    bonuses.cash.value = 15 * Math.round(account?.farming?.cropsFound) * (1 + labBonus / 100);
  }
  if (isJadeBonusUnlocked(account, 'Science_Crayon')) {
    bonuses.shiny.value = 7 * Math.round(account?.farming?.cropsFound) * (1 + labBonus / 100);
  }
  if (isJadeBonusUnlocked(account, 'Science_Paintbrush')) {
    bonuses.critters.value = 0.1 * Math.round(account?.farming?.cropsFound) * (1 + labBonus / 100);
  }
  return bonuses;
}

const getMarketBonus = (market: any, bonusName: string) => {
  return (market?.find(({ name }: { name: string }) => name === bonusName) as any)?.value ?? 0;
}

const calcCostToMax = ({ level, maxLvl, cost, costExponent }: any) => {
  let costToMax = 0;
  for (let i = level; i < maxLvl; i++) {
    costToMax += cost * Math.pow(costExponent, i)
  }
  return costToMax ?? 0;
}