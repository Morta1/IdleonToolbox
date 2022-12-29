import { gamingImports, gamingUpgrades } from "../data/website-data";
import { notateNumber } from "../utility/helpers";
import { getGodByIndex } from "./divinity";

const { tryToParse } = require("../utility/helpers");

export const getGaming = (idleonData, characters, account, serverVars) => {
  const gamingRaw = tryToParse(idleonData?.Gaming) || idleonData?.Gaming;
  const gamingSproutRaw = tryToParse(idleonData?.GamingSprout) || idleonData?.GamingSprout;
  return parseGaming(gamingRaw, gamingSproutRaw, characters, account, serverVars);
}

const parseGaming = (gamingRaw, gamingSproutRaw, characters, account, serverVars) => {
  const bits = gamingRaw?.[0];
  const lastShovelClicked = gamingSproutRaw[26][1];
  const goldNuggets = calcGoldNuggets(lastShovelClicked);
  const lastAcornClicked = gamingSproutRaw[27][1];
  const squirrelLevel = gamingSproutRaw[27][0];
  const acorns = calcAcorns(lastAcornClicked, squirrelLevel);
  const nuggetsBreakpoints = calcResourcePerTime('nugget');
  const acornsBreakpoints = calcResourcePerTime('acorn', squirrelLevel);
  const acornShop = calcAcornShop(gamingSproutRaw);
  const gamingImportsStartIndex = 25;
  const gamingImportsValues = gamingSproutRaw.slice(gamingImportsStartIndex, gamingImportsStartIndex + gamingImports?.length + 1);
  const fertilizerUpgrades = gamingRaw.slice(1, gamingUpgrades?.length + 1)?.map((level, index) => ({
    ...gamingUpgrades?.[index],
    level,
    description: gamingUpgrades?.[index]?.description.replace(/{/, calcFertilizerBonus(index, gamingRaw, gamingSproutRaw, characters, account, acornShop)),
    cost: calcFertilizerCost(index, gamingRaw, serverVars)
  }));
  const goldenSprinkler = account?.gemShopPurchases?.find((value, index) => index === 131) ?? 0;
  console.log('goldenSprinkler', account)
  console.log('goldenSprinkler', goldenSprinkler)
  const saveSprinklerChance = calcSprinklerSave(account?.gemShopPurchases?.find((value, index) => index === 131) ?? 0);
  const imports = gamingImports?.map((item, index) => ({
    ...item,
    level: gamingImportsValues?.[index]?.[0],
    rawName: index === 3 ? `GamingItem${index}_0` : index === 0 ? goldenSprinkler > 0 ? `GamingItem${index}b` : `GamingItem${index}` : `GamingItem${index}`,
    minorBonus: calcImportBonus(index, item?.minorBonus, gamingImportsValues),
    cost: calcImportCost(index, gamingImportsValues),
    acquired: gamingImportsValues?.[index]?.[0] > 0,
    ...(index === 0 ? {
      saveSprinklerChance: saveSprinklerChance * 100
    } : {}),
    ...(index === 2 ? {
      acornShop
    } : {}),
  })).filter((_, index) => index < 8);

  return {
    bits,
    fertilizerUpgrades,
    imports,
    lastShovelClicked,
    goldNuggets,
    lastAcornClicked,
    acorns,
    nuggetsBreakpoints,
    acornsBreakpoints
  };
}

const calcResourcePerTime = (type, squirrelLevel) => {
  const breakpoints = type === 'nugget' ? [1, 4.50, 12.09, 23.22, 38.47, 58.42] : [1, 2.1, 3.4, 5.1, 6.4];
  return breakpoints.map((breakpoint) => {
    const math = (Math.floor(breakpoint) * 3600) + ((breakpoint % 1) * 60 * 100);
    return {
      time: math,
      amount: type === 'nugget' ? calcGoldNuggets(math) : calcAcorns(math, squirrelLevel)
    }
  })
}

export const calcGoldNuggets = (lastClick) => {
  return Math.floor(Math.pow(lastClick / 3600, 0.44));
}

export const calcAcorns = (lastClick, squirrelLevel) => {
  return Math.floor(Math.pow(lastClick * (1 + squirrelLevel / 100) / 3600, .85));
}

const calcSprinklerSave = (goldenSprinkler) => {
  return 1 === goldenSprinkler ? 0.3 : 2 === goldenSprinkler ? 0.43 : 3 === goldenSprinkler ? 0.53 : 4 === goldenSprinkler ? 0.6 : 0;
}

const calcImportBonus = (index, minorBonus, gamingImportsValues) => {
  const value = gamingImportsValues?.[index]?.[0];
  let fixedMinorBonus = minorBonus;
  if (index === 1) {
    return fixedMinorBonus.replace(/{/, Math.floor(10 * (1 + Math.pow((60 * value) / (250 + (value)), 1.7))) / 10);
  }
  if (index === 2) {
    return fixedMinorBonus.replace(/{/, Math.round(5 * (value)));
  }
  if (index === 5) {
    return fixedMinorBonus.replace(/{/, Math.floor(((60 * value) / (100 + (value))) * 10) / 10);
  }
  return fixedMinorBonus.replace(/{/, Math.round(value));
}

const calcImportCost = (index, gamingImportsValues) => {
  return (gamingImports?.[index]?.x1 *
    Math.pow(10, gamingImports?.[index]?.x2)) / 4 * Math.pow(1.4, gamingImportsValues?.[index]?.[0]);
}

const calcFertilizerBonus = (index, gamingRaw, gamingSproutRaw, characters, account, acornShop) => {
  if (index === 0) {
    const baseValue = gamingRaw?.[1];
    return notateNumber((1 + 4 * baseValue) * Math.pow(1.065, baseValue), 'bits');
  } else if (index === 1) {
    const baseValue = gamingRaw?.[2];
    const godBonus = getGodByIndex(account?.divinity?.linkedDeities, characters, 6)?.minorBonusMultiplier ?? 0;
    const baseMath = 1 + (acornShop?.[1]?.bonus + godBonus) / 100;
    const moreMath = 3 + gamingSproutRaw?.[29]?.[0] / 100;
    const baseValue2 = gamingSproutRaw?.[29]?.[1];
    const growTime = 5e3 / ((1 + (2 * baseValue) / 100) * baseMath * (1 + moreMath * (baseValue2)));
    const growChance = 1 / calcSproutGrowChance(gamingRaw);
    const final = (growTime * growChance) / 60;
    const time = Math.floor(100 * (final)) / 100;
    return time > 60 ? `${Math.floor(100 * time / 60) / 100}Hr` : `${(Math.floor(10 * time) / 10)}Min`;
  } else if (index === 2) {
    const baseValue = gamingRaw?.[3];
    const maxSprouts = account?.gemShopPurchases?.find((value, index) => index === 133) ?? 0;
    return notateNumber(Math.round(Math.min(24, 3 + baseValue + (maxSprouts))));
  }
}

const calcSproutGrowChance = (gamingRaw) => {
  const baseValue = gamingRaw?.[7];
  return .13 + (.11 * baseValue) / (150 + baseValue);
  // rd._customBlock_GamingStatType("SproutGrowthTime", 0, 0) * (1 / rd._customBlock_GamingStatType("SproutGrowthCHANCE", -1, 0))
  // if ("SproutGrowthCHANCEperMUT" == e) {
  //   var Ke = a.engine.getGameAttribute("Gaming")[7],
  //     $e = Ke,
  //     et = a.engine.getGameAttribute("Gaming")[7];
  //   return 0.13 + (0.11 * $e) / (150 + (et));
  // }
  // if ("SproutGrowthCHANCE" == e) {
  //   if (-1 == s) return rd._customBlock_GamingStatType("SproutGrowthCHANCEperMUT", 0, 0);
  //   var tt = rd._customBlock_GamingStatType("SproutGrowthCHANCEperMUT", 0, 0),
  //     nt = a.engine.getGameAttribute("GamingSprout")[0 | s][3];
  //   return Math.pow(tt, (nt) + 1);
  // }
}

const calcFertilizerCost = (index, gamingRaw, serverVars) => {
  if (index === 0) {
    const baseValue = gamingRaw?.[1];
    const baseMath = 1 + (3 * baseValue + Math.pow(baseValue, 2));
    const moreMath = Math.min(1.25, Math.max(1.13, 1 + serverVars?.GamingFertCostExpA / 1e3));
    const finalMath = moreMath + Math.max(0, Math.min(0.15, (0.18 * (baseValue - 50)) / ((baseValue) + 100)));
    return notateNumber(baseMath * Math.pow(finalMath, baseValue), 'bits');
  }
  if (index === 1) {
    const baseValue = gamingRaw?.[2];
    const baseMath = 2 + (5 * baseValue + Math.pow(baseValue, 2));
    return notateNumber(baseMath * Math.pow(1.22, baseValue), 'bits');
  }
  if (index === 2) {
    const baseValue = gamingRaw?.[3];
    if (11 > baseValue) {
      const baseMath = 25 * (baseValue + 1) + Math.pow((baseValue) + 1, 3);
      return notateNumber(baseMath * Math.pow(5 + 3.7 * baseValue, baseValue), 'bits');
    }
    return notateNumber(9999 * Math.pow(10, 63), 'bits');
  }
}

const calcAcornShop = (gamingSproutRaw) => {
  const bonusTexts = ['All plants give x{ bits', 'All plants grow {% faster']
  const [, , firstValue, secondValue] = gamingSproutRaw?.[27];
  return [firstValue, secondValue].map((value, index) => {
    const bonus = index === 0 ? 1 + (8 * value) / (250 + (value)) : Math.pow(3 * (value), 0.8);
    return {
      cost: 1 + value + 2 * Math.max(0, (value) - 5),
      description: bonusTexts?.[index].replace(/{/, `${bonus.toFixed(2)}`),
      bonus
    }
  });
}

