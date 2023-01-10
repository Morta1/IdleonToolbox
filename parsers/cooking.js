import { bonuses, cookingMenu, monsters, randomList } from "../data/website-data";
import { allProwess, getAllBaseSkillEff, getAllEff } from "./character";
import { getStampsBonusByEffect } from "./stamps";
import { getStatFromEquipment } from "./items";
import { tryToParse } from "../utility/helpers";
import { getPostOfficeBonus } from "./postoffice";
import { getJewelBonus, getLabBonus } from "./lab";
import { getBubbleBonus, getVialsBonusByEffect, getVialsBonusByStat } from "./alchemy";
import { isArenaBonusActive } from "./misc";
import { getAchievementStatus } from "./achievements";
import { isArtifactAcquired } from "./sailing";

export const getCooking = (idleonData, account) => {
  const cookingRaw = tryToParse(idleonData?.Cooking) || idleonData?.Cooking;
  const mealsRaw = tryToParse(idleonData?.Meals) || idleonData?.Meals;
  const territoryRaw = tryToParse(idleonData?.Territory) || idleonData?.Territory;
  return parseCooking(mealsRaw, territoryRaw, cookingRaw, account);
}

const parseCooking = (mealsRaw, territoryRaw, cookingRaw, account) => {
  const meals = getMeals(mealsRaw);
  const spices = getSpices(mealsRaw, territoryRaw, account);
  return {
    meals,
    spices
  }
}

const getSpices = (mealsRaw, territoryRaw, account) => {
  const toClaim = territoryRaw?.reduce((res, territory) => {
    const [progress, amount, , spiceName] = territory;
    return [
      ...res,
      {
        progress,
        amount,
        rawName: spiceName
      }
    ]
  }, []);

  const available = mealsRaw?.[3]?.filter((spiceAmount) => spiceAmount > 0).map((amount, index) => ({
    amount,
    toClaim: toClaim?.[index]?.amount,
    rawName: `CookingSpice${index}`
  }));

  const numberOfClaims = account?.accountOptions?.[100];
  return {
    toClaim,
    available,
    numberOfClaims
  }
}

const getMeals = (mealsRaw) => {
  const mealsLevelsListRaw = mealsRaw?.[0];
  const mealsQuantityListRaw = mealsRaw?.[2];
  return mealsLevelsListRaw?.map((mealLevel, index) => {
    if (index > 56) return null;
    return {
      level: mealLevel,
      amount: mealsQuantityListRaw?.[index],
      ...(cookingMenu?.[index] || {})
    }
  }).filter(meal => meal);
}

export const applyMealsMulti = (meals, multiplier) => {
  return meals?.map((meal) => ({ ...meal, multiplier: (1 + multiplier / 100) }));
}

export const getLadlesPerDay = (character, jewels, stamps, meals, playerChips, cards, guildBonuses, charactersLevels, bubbles) => {
  const cookingMonster = monsters.Cooking.Defence;
  const cookingEff = getCookingEff(character, jewels, stamps, meals, playerChips, cards, guildBonuses, charactersLevels);
  return 15 * Math.floor(Math.max(Math.pow(cookingEff / (10 * (cookingMonster)), .25 + getCookingProwess(character, meals, bubbles)), 1))
}

const getCookingEff = (character, jewels, stamps, meals, playerChips, cards, guildBonuses, charactersLevels) => {
  const allBaseSkillEff = getAllBaseSkillEff(character, playerChips, jewels);
  const allEfficiencies = getAllEff(character, meals, playerChips, cards, guildBonuses, charactersLevels);
  const stampBonus = getStampsBonusByEffect(stamps, 'Cooking_Efficiency');
  const equipmentCookingEffectBonus = character?.equipment?.reduce((res, item) => res + getStatFromEquipment(item, bonuses?.etcBonuses?.[62]), 0);
  const postOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Chefs_Essentials', 0);
  return allEfficiencies * (250 + (stampBonus + (equipmentCookingEffectBonus + (postOfficeBonus)) + allBaseSkillEff));
}

const getCookingProwess = (character, meals, bubbles) => {
  return allProwess(character, meals, bubbles);
}

export const getSpiceUpgradeCost = (baseMath, upgradeLevel) => {
  let upgradeMath = upgradeLevel + 1 + Math.floor(Math.max(0, upgradeLevel - 10) / 2);
  upgradeMath = upgradeMath + Math.pow(Math.max(0, upgradeLevel - 30), 1.2);
  return Math.ceil(1 + baseMath * upgradeMath * Math.pow(1.02, Math.max(0, (upgradeLevel) - 60)))
}


export const getMealsBonusByEffectOrStat = (meals, effectName, statName, labBonus = 0) => {
  return meals?.reduce((sum, meal) => {
    const { level, baseStat, effect, stat } = meal;
    if (effectName) {
      if (!effect.includes(effectName)) return sum;
    } else {
      if (!stat.includes(statName)) return sum;
    }
    return sum + ((1 + labBonus / 100) * level * baseStat ?? 0);
  }, 0);
}

export const getKitchens = (idleonData, account) => {
  const cookingRaw = tryToParse(idleonData?.Cooking) || idleonData?.Cooking;
  return parseKitchens(cookingRaw, account);
}

const parseKitchens = (cookingRaw, account) => {
  const arenaWave = account?.accountOptions?.[89];
  const waveReqs = randomList?.[53];
  const globalKitchenUpgrades = cookingRaw?.reduce((sum, table) => {
    const [speedLv, fireLv, luckLv] = table.slice(6, 9);
    return sum + speedLv + fireLv + luckLv
  }, 0);
  const diamondMeals = account?.cooking?.meals?.reduce((res, { level }) => level >= 11 ? res + 1 : res, 0);
  return cookingRaw?.map((table, kitchenIndex) => {
    const [status, foodIndex, spice1, spice2, spice3, spice4, speedLv, fireLv, luckLv, , currentProgress] = table;
    if (status <= 0) return null;

    // Multipliers
    // X2 from stamps (Certified stamp book) - Cooked_Meal_Stamp
    // X2 from vials (My 1st chemistry set) - LONG_ISLAND_TEA
    // jewel multiplier X1.5 (Spelunker Obol)

    // jewel meal multiplier X1.24 (* jewel multiplier) (Black diamond rhinestone)
    // jewel cooking multiplier X1 per 25 kitchen levels (* jewel multiplier) (Emerald Pyramite)
    // jewel cooking speed - X2.25 (Amethyst_Rhinestone)
    // all purple jewels active - X2.25
    // diamond chef - cooking speed per diamond meal
    // cabbage - cooking speed per 10 kitchen levels
    // Cooking Speed meals - Egg, Corndog, Soda
    // kitchen upgrade from gemshop X2
    // troll card
    const spelunkerObolMulti = getLabBonus(account.lab.labBonuses, 8); // gem multi
    const blackDiamondRhinestone = getJewelBonus(account.lab.jewels, 16, spelunkerObolMulti);
    const totalKitchenUpgrades = speedLv + fireLv + luckLv;
    const cookingSpeedJewelMultiplier = getJewelBonus(account.lab.jewels, 14, spelunkerObolMulti); // meal cooking speed
    const cookingSpeedFromJewel = Math.floor(globalKitchenUpgrades / 25) * (cookingSpeedJewelMultiplier || 0);

    const cookingSpeedStamps = getStampsBonusByEffect(account?.stamps, 'Meal_Cooking_Spd');
    const cookingSpeedVials = getVialsBonusByStat(account?.alchemy?.vials, 'MealCook');
    const cookingSpeedMeals = getMealsBonusByEffectOrStat(account?.cooking?.meals, 'Meal_Cooking_Speed', null, blackDiamondRhinestone);
    const diamondChef = getBubbleBonus(account?.alchemy?.bubbles, 'kazam', 'DIAMOND_CHEF', false);
    const kitchenEffMeals = getMealsBonusByEffectOrStat(account?.cooking?.meals, null, 'KitchenEff', blackDiamondRhinestone);
    const trollCard = account?.cards?.Massive_Troll; // Kitchen Eff card
    const trollCardStars = trollCard?.stars ?? 0;
    // const pyritePyramite = getJewelBonus(account.lab.jewels, 10, spelunkerObolMulti);
    // const allOrangeActive = account.lab.jewels?.slice(7, 10)?.every(({ active }) => active) ? pyritePyramite * 2 : 1;
    // const emeraldNavette = getJewelBonus(account.lab.jewels, 12, spelunkerObolMulti);
    // const allGreenActive = account.lab.jewels?.slice(11, 15)?.every(({ active }) => active) ? emeraldNavette * 2 : 1; // Change bonus
    const allPurpleActive = account.lab.jewels?.slice(0, 3)?.every(({ active }) => active) ? 2 : 1;
    const amethystRhinestone = getJewelBonus(account.lab.jewels, 0, spelunkerObolMulti) * allPurpleActive;
    const isRichelin = kitchenIndex < account?.gemShopPurchases?.find((value, index) => index === 120);
    const triagulonArtifactBonus = isArtifactAcquired(account?.sailing?.artifacts, 'Triagulon')?.bonus;
    const triagulonSpeedBonus = triagulonArtifactBonus ? (1 + triagulonArtifactBonus / 100) : 1;

    const mealSpeedBonusMath = (1 + (cookingSpeedStamps + Math.max(0, cookingSpeedFromJewel)) / 100) * (1 + cookingSpeedMeals / 100) * Math.max(1, (amethystRhinestone));
    const mealSpeedCardImpact = 1 + Math.min(6 * (trollCardStars === 0 ? 0 : trollCardStars + 1)
      + (20 * getAchievementStatus(account?.achievements, 225) +
        10 * getAchievementStatus(account?.achievements, 224)), 100) / 100;

    const firstMath = 10 * (1 + (isRichelin ? 2 : 0)) * Math.max(1, Math.pow(diamondChef, diamondMeals));
    const secondMath = ((1 + speedLv / 10) * (triagulonSpeedBonus));
    const thirdMath = (1 + cookingSpeedVials / 100);
    const mealSpeed = firstMath * secondMath * thirdMath * mealSpeedBonusMath * mealSpeedCardImpact * (1 + (kitchenEffMeals * Math.floor((totalKitchenUpgrades) / 10)) / 100);

    // Fire Speed
    const recipeSpeedVials = getVialsBonusByEffect(account?.alchemy?.vials, 'Recipe_Cooking_Speed');
    const recipeSpeedStamps = getStampsBonusByEffect(account?.stamps, 'New_Recipe_Spd');
    const recipeSpeedMeals = getMealsBonusByEffectOrStat(account?.cooking?.meals, null, 'Rcook', blackDiamondRhinestone);
    const fireSpeedCardImpact = 1 + Math.min(6 * ((trollCardStars === 0 ? 0 : trollCardStars + 1)), 50) / 100;
    const fireSpeed = 5 *
      (1 + (isRichelin ? 1 : 0)) *
      Math.max(1, Math.pow(diamondChef, diamondMeals)) *
      (1 + fireLv / 10) *
      (1 + recipeSpeedVials / 100) *
      (1 + recipeSpeedStamps / 100) *
      (1 + recipeSpeedMeals / 100) *
      fireSpeedCardImpact *
      (1 + kitchenEffMeals * Math.floor(totalKitchenUpgrades / 10) / 100);

    // New Recipe Luck
    const mealLuck = 1 + Math.pow(5 * luckLv, 0.85) / 100;

    // Spices Cost
    const kitchenCostVials = getVialsBonusByEffect(account?.alchemy?.vials, 'Kitchen_Upgrading_Cost');
    const kitchenCostMeals = getMealsBonusByEffectOrStat(account?.cooking?.meals, null, 'KitchC', blackDiamondRhinestone);
    const arenaBonusActive = isArenaBonusActive(arenaWave, waveReqs, 7);
    const baseMath = 1 /
      ((1 + kitchenCostVials / 100) *
        (1 + kitchenCostMeals / 100) *
        (1 + (isRichelin ? 40 : 0) / 100) *
        (1 + (0.5 * (arenaBonusActive ? 1 : 0))));

    const speedCost = getSpiceUpgradeCost(baseMath, speedLv);
    const fireCost = getSpiceUpgradeCost(baseMath, fireLv);
    const luckCost = getSpiceUpgradeCost(baseMath, luckLv);

    const spices = [spice1, spice2, spice3, spice4].filter((spice) => spice !== -1);
    const spicesValues = spices.map((spiceValue) => parseInt(randomList[49]?.split(' ')[spiceValue]));
    const possibleMeals = getMealsFromSpiceValues(randomList[49], spicesValues).filter((foodIndex) => foodIndex > 0).map((foodIndex) => ({
      index: foodIndex,
      rawName: cookingMenu?.[foodIndex]?.rawName,
      cookReq: cookingMenu?.[foodIndex]?.cookReq
    }));

    return {
      status,
      meal: {
        ...(cookingMenu?.[foodIndex] || {}),
        ...(account?.cooking?.meals?.[foodIndex] || {}),
      },
      luckLv,
      fireLv,
      speedLv,
      currentProgress,
      mealSpeed,
      mealLuck,
      fireSpeed,
      speedCost,
      fireCost,
      luckCost,
      ...(status === 3 ? { spices } : {}),
      ...(status === 3 ? { possibleMeals } : {})
    }
  }).filter((kitchen) => kitchen);
}


export const getMealsFromSpiceValues = (spiceValues, valueOfSpices) => {
  const possibleMeals = [];
  // Each spice value is also a possible meal.
  valueOfSpices.forEach(value => {
    if (!possibleMeals.includes(value)) {
      possibleMeals.push(value);
    }
  });
  // the sum of spice indexes is a possible meal.
  const spiceValuesArr = spiceValues.split(' ').map(num => parseFloat(num));
  const sum = valueOfSpices.reduce((sum, value) => sum + spiceValuesArr.indexOf(value), 0);
  if (!spiceValues.includes(sum)) {
    possibleMeals.push(sum);
  }

  // if we have 3 or more spices, add sum - 1.
  if (valueOfSpices.length > 2 && !possibleMeals.includes(sum - 1) && !spiceValuesArr.includes(sum - 1)) {
    possibleMeals.push(sum - 1);
  }
  // if we have more than one spice, add sum + 1.
  if (valueOfSpices.length > 1 && !possibleMeals.includes(sum + 1) && !spiceValuesArr.includes(sum + 1)) {
    possibleMeals.push(sum + 1);
  }

  // return sorted by lowest meal to highest.
  return possibleMeals.sort((meal1, meal2) => meal1 < meal2 ? -1 : 1);
}


export const calcMealTime = (maxLevel, meal, totalMealSpeed, achievements) => {
  const { amount, level, cookReq } = meal;
  if (level >= maxLevel) return 0;
  let amountNeeded = 0;
  for (let i = level; i < maxLevel; i++) {
    amountNeeded += getMealLevelCost(i, achievements);
  }
  amountNeeded -= amount;
  if (amountNeeded < 0) return 0;
  return calcTimeToNextLevel(amountNeeded, cookReq, totalMealSpeed);
}

export const getMealLevelCost = (level, achievements) => {
  // if ("CookingMenuMealCosts" == s) {
  //   var Zn = 1 / Math.min(5, Math.max(1, 1 + (10 * w._customBlock_AchieveStatus(233)) / 100)),
  //     Hn = b.engine.getGameAttribute("Meals")[0][0 | a],
  //     Jn = Hn,
  //     jn = b.engine.getGameAttribute("Meals")[0][0 | a],
  //     qn = Zn * (10 + (Jn + Math.pow(jn, 2))),
  //     Kn = b.engine.getGameAttribute("Meals")[0][0 | a],
  //     $n = Kn,
  //     es = b.engine.getGameAttribute("Meals")[0][0 | a];
  //   return qn * Math.pow(1.2 + 0.05 * $n, es);
  // }
  const baseMath = 1 / Math.min(5, Math.max(1, 1 + (10 * getAchievementStatus(achievements, 233)) / 100))
  const morBaseMath = baseMath * (10 + (level + Math.pow(level, 2)));
  return morBaseMath * Math.pow(1.2 + 0.05 * level, level);
}

export const calcTimeToNextLevel = (amountNeeded, cookReq, totalMealSpeed) => {
  return amountNeeded * cookReq / totalMealSpeed;
}
