import { atomsInfo, cookingMenu, monsters, randomList } from '../data/website-data';
import { getStampsBonusByEffect } from './stamps';
import { getStatsFromGear } from './items';
import { tryToParse } from '@utility/helpers';
import { getPostOfficeBonus } from './postoffice';
import { getJewelBonus, getLabBonus } from './lab';
import { getBubbleBonus, getVialsBonusByEffect, getVialsBonusByStat } from './alchemy';
import { isArenaBonusActive } from './misc';
import { getAchievementStatus } from './achievements';
import { isArtifactAcquired } from './sailing';
import { getShinyBonus } from './breeding';
import { isSuperbitUnlocked } from './gaming';
import { getHighestTalentByClass, getVoidWalkerTalentEnhancements } from './talents';
import { getEquinoxBonus } from './equinox';
import LavaRand from '@utility/lavaRand';
import account from '@components/dashboard/Account';
import { allProwess, getAllBaseSkillEff, getAllEff } from '@parsers/efficiency';
import { getCardBonusByEffect } from '@parsers/cards';

export const spicesNames = [
  'Grasslands',
  'Jungle',
  'Encroaching Forest',
  'Tree Interior',
  'Stinky Sewers',
  'Desert Oasis',
  'Beach Docks',
  'Coarse Mountains',
  'Twilight Desert',
  'The Crypt',
  'Frosty Peaks',
  'Tundra Outback',
  'Crystal Caverns',
  'Pristalle Lake',
  'Nebulon Mantle',
  'Starfield Skies',
  'Shores of Eternity',
  'Molten Bay',
  'Smokey Lake',
  'Wurm Catacombs',
]

export const getCooking = (idleonData, account) => {
  const cookingRaw = tryToParse(idleonData?.Cooking) || idleonData?.Cooking;
  const mealsRaw = tryToParse(idleonData?.Meals) || idleonData?.Meals;
  const territoryRaw = tryToParse(idleonData?.Territory) || idleonData?.Territory;
  return parseCooking(mealsRaw, territoryRaw, cookingRaw, account);
}

const parseCooking = (mealsRaw, territoryRaw, cookingRaw, account) => {
  const meals = getMeals(mealsRaw, account);
  const spices = getSpices(mealsRaw, territoryRaw, account);
  return {
    meals,
    spices
  }
}

const getSpices = (mealsRaw, territoryRaw, account) => {
  const toClaim = territoryRaw?.reduce((res, territory, index) => {
    const [progress, , , spiceName, amount] = territory;
    return [
      ...res,
      {
        progress,
        amount,
        rawName: spiceName,
        name: spicesNames[index]
      }
    ]
  }, []);

  const available = mealsRaw?.[3]?.filter((spiceAmount) => spiceAmount > 0).map((amount, index) => ({
    amount,
    toClaim: toClaim?.[index]?.amount,
    rawName: `CookingSpice${index}`,
    name: spicesNames[index]
  }));

  const numberOfClaims = account?.accountOptions?.[100];
  return {
    toClaim,
    available,
    numberOfClaims
  }
}

const getMeals = (mealsRaw, account) => {
  const mealsLevelsListRaw = mealsRaw?.[0];
  const mealsQuantityListRaw = mealsRaw?.[2];
  const shinyMealBonus = getShinyBonus(account?.breeding?.pets, 'Bonuses_from_All_Meals');
  return mealsLevelsListRaw?.map((mealLevel, index) => {
    if (index > 66) return null;
    return {
      level: mealLevel,
      amount: mealsQuantityListRaw?.[index],
      shinyMulti: shinyMealBonus,
      ...(cookingMenu?.[index] || {})
    }
  }).filter(meal => meal);
}

export const applyMealsMulti = (meals, multiplier) => {
  return meals?.map((meal) => ({ ...meal, multiplier: 1 + multiplier / 100 }));
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
  const equipmentCookingEffectBonus = getStatsFromGear(character, 62, account);
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


export const getMealsBonusByEffectOrStat = (account, effectName, statName, labBonus = 0) => {
  const shinyMealBonus = getShinyBonus(account?.breeding?.pets, 'Bonuses_from_All_Meals');
  return account?.cooking?.meals?.reduce((sum, meal) => {
    const { level, baseStat, effect, stat } = meal;
    if (effectName) {
      if (!effect.includes(effectName)) return sum;
    }
    else {
      if (stat !== statName) return sum;
    }
    if (statName === 'PxLine') {
      return sum + (level * baseStat ?? 0);
    }
    return sum + ((1 + (labBonus + shinyMealBonus) / 100) * level * baseStat ?? 0);
  }, 0);
}

export const getKitchens = (idleonData, characters, account) => {
  const cookingRaw = tryToParse(idleonData?.Cooking) || idleonData?.Cooking;
  const atomsRaw = tryToParse(idleonData?.Atoms) || idleonData?.Atoms
  return parseKitchens(cookingRaw, atomsRaw, characters, account);
}

const parseKitchens = (cookingRaw, atomsRaw, characters, account) => {
  const arenaWave = account?.accountOptions?.[89];
  const waveReqs = randomList?.[53];
  const globalKitchenUpgrades = cookingRaw?.reduce((sum, table) => {
    const [speedLv, fireLv, luckLv] = table.slice(6, 9);
    return sum + speedLv + fireLv + luckLv
  }, 0);
  const diamondMeals = account?.cooking?.meals?.reduce((res, { level }) => level >= 11 ? res + 1 : res, 0);
  const voidMeals = account?.cooking?.meals?.reduce((res, { level }) => level >= 30 ? res + 1 : res, 0);
  const totalMeals = account?.cooking?.meals?.reduce((res, { level }) => res + level, 0);
  return cookingRaw?.map((table, kitchenIndex) => {
    const [status, foodIndex, spice1, spice2, spice3, spice4, speedLv, fireLv, luckLv, , currentProgress] = table;
    if (status <= 0) return null;
    const spelunkerObolMulti = getLabBonus(account.lab.labBonuses, 8); // gem multi
    const blackDiamondRhinestone = getJewelBonus(account.lab.jewels, 16, spelunkerObolMulti);
    const cookingSpeedJewelMultiplier = getJewelBonus(account.lab.jewels, 14, spelunkerObolMulti); // meal cooking speed
    const cookingSpeedFromJewel = Math.floor(globalKitchenUpgrades / 25) * (cookingSpeedJewelMultiplier || 0);

    const cookingSpeedStamps = getStampsBonusByEffect(account, 'Meal_Cooking_Speed');
    const cookingSpeedVials = getVialsBonusByStat(account?.alchemy?.vials, 'MealCook');
    const extraCookingSpeedVials = getVialsBonusByStat(account?.alchemy?.vials, '6CookSpd');
    const cookingSpeedMeals = getMealsBonusByEffectOrStat(account, 'Meal_Cooking_Speed', null, blackDiamondRhinestone);
    const diamondChef = getBubbleBonus(account?.alchemy?.bubbles, 'kazam', 'DIAMOND_CHEF', false);
    const kitchenEffMeals = getMealsBonusByEffectOrStat(account, null, 'KitchenEff', blackDiamondRhinestone);
    const trollCard = account?.cards?.Massive_Troll; // Kitchen Eff card
    const trollCardStars = trollCard?.stars ?? 0;
    const trollBonus = trollCardStars === 0 ? 0 : trollCardStars + 1;
    const allPurpleActive = account.lab.jewels?.slice(0, 3)?.every(({ active }) => active) ? 2 : 1;
    const amethystRhinestone = getJewelBonus(account.lab.jewels, 0, spelunkerObolMulti) * allPurpleActive;
    const isRichelin = kitchenIndex < account?.gemShopPurchases?.find((value, index) => index === 120);
    const triagulonArtifactBonus = isArtifactAcquired(account?.sailing?.artifacts, 'Triagulon')?.bonus ?? 0;
    const richelinBonus = isRichelin ? 2 : 0;
    const bubbleBonus = Math.pow(diamondChef, diamondMeals);
    const firstAchievement = getAchievementStatus(account?.achievements, 225);
    const secondAchievement = getAchievementStatus(account?.achievements, 224);
    const marshmallowBonus = getMealsBonusByEffectOrStat(account, null, 'zMealFarm', blackDiamondRhinestone);
    const cardCookingMulti = getCardBonusByEffect(account?.cards, 'Cooking_Spd_Multi_(Passive)');
    // TODO: check how to apply specific character
    // const starSignBonus = getStarSignBonus(character, account, 'Cooking_SPD');
    const superbit = isSuperbitUnlocked(account, 'MSA_Mealing');
    let superbitBonus = 0;
    if (superbit) {
      superbitBonus = superbit?.bonus;
    }

    const voidWalkerEnhancementEclipse = getHighestTalentByClass(characters, 3, 'Voidwalker', 'ENHANCEMENT_ECLIPSE');
    const voidWalkerBloodMarrow = getHighestTalentByClass(characters, 3, 'Voidwalker', 'BLOOD_MARROW');
    const voidWalkerBonusTalent = Math.pow(Math.min(1.012, 1 + voidWalkerBloodMarrow / 100), totalMeals);
    const voidWalkerEnhancement = getVoidWalkerTalentEnhancements(characters, account, voidWalkerEnhancementEclipse, 146);
    const voidWalkerApocalypseBonus = Math.max(1, voidWalkerEnhancement);

    const voidPlateChefIndex = atomsInfo.findIndex(({ name }) => name === 'Fluoride_-_Void_Plate_Chef');
    let voidPlateChefBonus = 0;
    const voidPlateChefLevel = atomsRaw?.[voidPlateChefIndex];
    if (voidPlateChefLevel) {
      voidPlateChefBonus = Math.pow(1 + atomsInfo?.[voidPlateChefIndex]?.baseBonus * voidPlateChefLevel / 100, voidMeals);
    }

    const mealSpeed = (10 * (1 + voidWalkerBonusTalent / 100)
      * Math.max(1, voidWalkerApocalypseBonus)
      * Math.max(1, account?.farming?.cropDepot?.cookingSpeed?.value)
      * (1 + richelinBonus)
      * (1 + (marshmallowBonus * Math.ceil(characters?.[0]?.skillsInfo?.farming?.level / 50)) / 100)
      * Math.max(1, bubbleBonus)
      * Math.max(1, voidPlateChefBonus)
      * (1 + superbitBonus / 100)
      * (1 + speedLv / 10)
      * (1 + triagulonArtifactBonus / 100)
      * (1 + cookingSpeedVials / 100)
      * (1 + (cookingSpeedStamps
        + Math.max(0, cookingSpeedFromJewel)) / 100)
      * (1 + cookingSpeedMeals / 100)
      // * (1 + q._customBlock_Summoning('WinBonus', 15, 0) / 100)
      * (1 + cardCookingMulti / 100)
      * (1 + extraCookingSpeedVials / 100)
      * Math.max(1, amethystRhinestone)
      * (1 + Math.min(6 * trollBonus
        + (20 * firstAchievement + 10 * secondAchievement), 100) / 100)
      * (1 + kitchenEffMeals
        * Math.floor((speedLv
          + (fireLv
            + luckLv)) / 10) / 100));

    // Fire Speed
    const recipeSpeedVials = getVialsBonusByEffect(account?.alchemy?.vials, 'Recipe_Cooking_Speed');
    const recipeSpeedStamps = getStampsBonusByEffect(account, 'New_Recipe_Cooking_Speed');
    const recipeSpeedMeals = getMealsBonusByEffectOrStat(account, null, 'Rcook', blackDiamondRhinestone);

    const fireSpeed = 5
      * (1 + (isRichelin ? 1 : 0))
      * Math.max(1, bubbleBonus)
      * Math.max(1, voidPlateChefBonus)
      * (1 + superbitBonus / 100)
      * (1 + fireLv / 10)
      * (1 + recipeSpeedVials / 100)
      * (1 + recipeSpeedStamps / 100)
      * (1 + recipeSpeedMeals / 100)
      * (1 + Math.min(6 * trollBonus, 50) / 100)
      * (1 + kitchenEffMeals
        * Math.floor((speedLv
          + (fireLv
            + luckLv)) / 10) / 100);

    // New Recipe Luck
    const mealLuck = 1 + Math.pow(5 * luckLv, 0.85) / 100;

    // Spices Cost
    const kitchenCostVials = getVialsBonusByEffect(account?.alchemy?.vials, 'Kitchen_Upgrading_Cost');
    const kitchenCostMeals = getMealsBonusByEffectOrStat(account, null, 'KitchC', blackDiamondRhinestone);
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


export const calcMealTime = (maxLevel, meal, totalMealSpeed, achievements, equinoxUpgrades) => {
  const { amount, level, cookReq } = meal;
  if (level >= maxLevel) return 0;
  let amountNeeded = 0;
  for (let i = level; i < maxLevel; i++) {
    amountNeeded += getMealLevelCost(i, achievements, equinoxUpgrades);
  }
  amountNeeded -= amount;
  if (amountNeeded < 0) return 0;
  return calcTimeToNextLevel(amountNeeded, cookReq, totalMealSpeed);
}

export const getMealLevelCost = (level, achievements, equinoxUpgrades) => {
  const baseMath = 1 / Math.min(5, Math.max(1, 1 + (10 * getAchievementStatus(achievements, 233)) / 100))
  const morBaseMath = baseMath * (10 + (level + Math.pow(level, 2)));
  const equinox = Math.max(0.01, Math.pow(0.8, getEquinoxBonus(equinoxUpgrades, 'Food_Lust')))
  return morBaseMath * Math.pow(1.2 + 0.05 * level, level) * equinox;
}

export const calcTimeToNextLevel = (amountNeeded, cookReq, totalMealSpeed) => {
  return amountNeeded * cookReq / totalMealSpeed;
}

export const getTotalKitchenLevels = (kitchens) => {
  return kitchens?.reduce((sum, { speedLv, luckLv, fireLv }) => {
    return sum + speedLv + luckLv + fireLv;
  }, 0);
}
export const maxNumberOfSpiceClicks = 100;

export const getChipsAndJewels = (account, size = 10) => {
  if (!account) return [];
  const { serverVars, timeAway, lab } = account || {};
  const chips = lab?.chips;
  const jewels = lab?.jewels;
  const seed = Math.floor(timeAway?.GlobalTime / 604800);

  const rotations = [];

  for (let i = 0; i < size; i++) {
    const rotation = [];

    for (let j = 0; j < 3; j++) {
      const itRng = new LavaRand(Math.round(seed + i + (500 * j)));
      const itRandom = Math.floor(1e3 * itRng.rand());
      const isJewel = j === 2;
      const index = isJewel
        ? Math.round(itRandom - Math.floor(itRandom / jewels.length) * jewels.length)
        : Math.round(itRandom - Math.floor(itRandom / (chips.length - (10 * (1 - j)))) * (chips.length - (10 * (1 - j))));
      const extraRng = new LavaRand(Math.round(seed + (2 * j - 1)))
      const extraRandom = Math.floor(1e3 * extraRng.rand());
      const extraIndex = isJewel
        ? Math.round(extraRandom - Math.floor(extraRandom / jewels.length) * jewels.length)
        : Math.round(extraRandom - Math.floor(extraRandom / (chips.length - (10 * (1 - j)))) * (chips.length - (10 * (1 - j))))
      if (extraIndex === index) {
        const finalRng = new LavaRand(Math.round(seed + (500 * j) + 765 * (j + 1)));
        const finalRandom = Math.floor(1e3 * finalRng.rand());
        const finalIndex = isJewel
          ? Math.round(finalRandom - Math.floor(finalRandom / jewels.length) * jewels.length)
          : Math.round(finalRandom - Math.floor(finalRandom / (chips.length - (10 * (1 - j)))) * (chips.length - (10 * (1 - j))))
        rotation.push(isJewel ? jewels[finalIndex] : chips[finalIndex]);
      }
      else {
        rotation.push(isJewel ? jewels[index] : chips[index]);
      }
    }
    const dateInMs = Math.floor((seed + i) * 604800 * 1000);
    rotations.push({ items: rotation, date: new Date(dateInMs) });
  }

  return rotations;
}
