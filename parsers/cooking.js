import { atomsInfo, cookingMenu, monsters, randomList, bonuses } from '../data/website-data';
import { getStampsBonusByEffect } from './stamps';
import { getStatsFromGear } from './items';
import { tryToParse } from '@utility/helpers';
import { getPostOfficeBonus } from './postoffice';
import { getJewelBonus, getLabBonus } from './lab';
import { getBubbleBonus, getSigilBonus, getVialsBonusByEffect, getVialsBonusByStat } from './alchemy';
import { getHighestCharacterSkill, isArenaBonusActive, isMasteryBonusUnlocked } from './misc';
import { getAchievementStatus } from './achievements';
import { isArtifactAcquired } from './sailing';
import { getShinyBonus } from './breeding';
import { isSuperbitUnlocked } from './gaming';
import { CLASSES, getHighestTalentByClass, getTalentBonus, getVoidWalkerTalentEnhancements } from './talents';
import { getEquinoxBonus } from './equinox';
import LavaRand from '@utility/lavaRand';
import account from '@components/dashboard/Account';
import { allProwess, getAllBaseSkillEff, getAllEff } from '@parsers/efficiency';
import { getCardBonusByEffect } from '@parsers/cards';
import { getArcadeBonus } from '@parsers/arcade';
import { getWinnerBonus } from '@parsers/world-6/summoning';
import { getIsland } from '@parsers/world-2/islands';
import { getStarSignBonus } from '@parsers/starSigns';
import { isJadeBonusUnlocked } from '@parsers/world-6/sneaking';
import { getVoteBonus } from '@parsers/world-2/voteBallot';
import { getMonumentBonus } from '@parsers/world-5/caverns/bravery';
import { getSchematicBonus } from '@parsers/world-5/caverns/the-well';
import { getLampBonus } from '@parsers/world-5/caverns/the-lamp';
import { getUpgradeVaultBonus } from '@parsers/misc/upgradeVault';
import { getGrimoireBonus } from '@parsers/grimoire';
import { getArmorSetBonus } from '@parsers/misc/armorSmithy';
import { getObolsBonus } from '@parsers/obols';

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
  'Spirit Fields',
  'Bamboo Forest',
  'Lullaby Airway',
  'Dharma Mesa'
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
  const mealMaxLevel = getMealMaxLevel(account);

  return {
    meals,
    spices,
    mealMaxLevel
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
    if (!cookingMenu?.[index]) return null;
    const levelCost = getMealLevelCost(mealLevel, account?.achievements, account);
    return {
      index,
      level: mealLevel,
      amount: parseFloat(mealsQuantityListRaw?.[index]),
      shinyMulti: shinyMealBonus,
      levelCost,
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

export const getCookingEff = (character, characters, account, playerInfo) => {
  const allEfficiencies = getAllEff(character, characters, account);
  const talentBonus = getTalentBonus(character?.flatTalents, 'APOCALYPSE_CHOW');
  const chows = character?.chow?.finished?.[0] ?? 1;
  const talentBonus2 = getTalentBonus(character?.flatTalents, 'BRUTE_EFFICIENCY');
  const equipBonus = getStatsFromGear(character, 67, account);
  const obolsBonus = getObolsBonus(character?.obols, bonuses?.etcBonuses?.[67]);
  const talentBonus3 = getTalentBonus(character?.flatTalents, 'SKILL_STRENGTHEN');
  const stampBonus = getStampsBonusByEffect(account, 'Cooking_Efficiency', character);
  const equipBonus2 = getStatsFromGear(character, 62, account);
  const obolsBonus2 = getObolsBonus(character?.obols, bonuses?.etcBonuses?.[62]);
  const masteryBonus = isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.cooking?.rank, 0);
  const postOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Chefs_Essentials', 0);
  const allBaseSkillEff = getAllBaseSkillEff(character, account, characters, playerInfo);

  return allEfficiencies
  * (1 + ((talentBonus * chows)
    + (talentBonus2
      + (equipBonus + obolsBonus))) / 100)
  * (250 + (Math.pow(character?.stats?.strength, .6)
    * (1 + talentBonus3 / 100)
    + (stampBonus
      + ((equipBonus2 + obolsBonus2)
        + 10 * masteryBonus
        + postOfficeBonus))
    + allBaseSkillEff))
}

export const getCookingProwess = (character, account) => {
  return allProwess(character, account);
}

export const getSpiceUpgradeCost = (upgradeLevel) => {
  return (upgradeLevel
      + 1 + Math.floor(Math.max(0, upgradeLevel - 10) / 2)
      + Math.pow(Math.max(0, upgradeLevel - 30), 1.2))
    * Math.pow(1.02, Math.max(0, upgradeLevel - 60))
}


export const getMealsBonusByEffectOrStat = (account, effectName, statName) => {
  const blackDiamondRhinestone = getJewelBonus(account?.lab?.jewels, 16) ?? 0;
  const shinyMealBonus = getShinyBonus(account?.breeding?.pets, 'Bonuses_from_All_Meals');
  const winBonus = getWinnerBonus(account, '<x Meal Bonuses');
  return account?.cooking?.meals?.reduce((sum, meal, index) => {
    const { level, baseStat, effect, stat } = meal;
    if (effectName) {
      if (!effect.includes(effectName)) return sum;
    } else {
      if (stat !== statName) return sum;
    }
    if (statName === 'PxLine') {
      return sum + (level * baseStat ?? 0);
    }
    const ribbonBonus = getRibbonBonus(account, account?.grimoire?.ribbons?.[28 + index]);
    return sum + ((1 + (blackDiamondRhinestone + shinyMealBonus) / 100) * (1 + winBonus / 100) * ribbonBonus * level * baseStat ?? 0);
  }, 0) ?? 0;
}

export const getRibbonBonus = (account, t) => {
  const armorSetBonus = getArmorSetBonus(account, 'EMPEROR_SET');
  return 1 + (Math.floor(5 * t + Math.floor(t / 2) *
    (4 + 6.5 * Math.floor(t / 5))) + Math.floor(t / 4) * (armorSetBonus / 4)) / 100;
}

export const getKitchens = (idleonData, characters, account) => {
  const cookingRaw = tryToParse(idleonData?.Cooking) || idleonData?.Cooking;
  const atomsRaw = tryToParse(idleonData?.Atoms) || idleonData?.Atoms;
  return parseKitchens(cookingRaw, atomsRaw, characters, account);
}

export const parseKitchens = (cookingRaw, atomsRaw, characters, account, options) => {
  const { characterIndex, enableNanoChip } = options || {};
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
    const cookingSpeedJewelMultiplier = getJewelBonus(account?.lab?.jewels, 14); // meal cooking speed
    const cookingSpeedFromJewel = Math.floor(globalKitchenUpgrades / 25) * (cookingSpeedJewelMultiplier || 0);

    const cookingSpeedStamps = getStampsBonusByEffect(account, 'Meal_Cooking_Speed');
    const cookingSpeedVials = getVialsBonusByStat(account?.alchemy?.vials, 'MealCook');
    const turtleVial = getVialsBonusByStat(account?.alchemy?.vials, '6turtle');
    const extraCookingSpeedVials = getVialsBonusByStat(account?.alchemy?.vials, '6CookSpd');
    const cookingSpeedMeals = getMealsBonusByEffectOrStat(account, null, 'Mcook');
    const diamondChef = getBubbleBonus(account, 'DIAMOND_CHEF', false);
    const kitchenEffMeals = getMealsBonusByEffectOrStat(account, null, 'KitchenEff');
    const trollCard = account?.cards?.Massive_Troll; // Kitchen Eff card
    const trollCardStars = trollCard?.stars ?? 0;
    const trollBonus = trollCardStars === 0 ? 0 : trollCardStars + 1;
    const allPurpleActive = account?.lab?.jewels?.slice(0, 3)?.every(({ active }) => active) ? 2 : 1;
    const amethystRhinestone = getJewelBonus(account?.lab?.jewels, 0) * allPurpleActive;
    const isRichelin = kitchenIndex < account?.gemShopPurchases?.find((value, index) => index === 120);
    const triagulonArtifactBonus = isArtifactAcquired(account?.sailing?.artifacts, 'Triagulon')?.bonus ?? 0;
    const richelinBonus = isRichelin ? 2 : 0;
    const bubbleBonus = Math.pow(diamondChef, diamondMeals);
    const firstAchievement = getAchievementStatus(account?.achievements, 225);
    const secondAchievement = getAchievementStatus(account?.achievements, 224);
    const marshmallowBonus = getMealsBonusByEffectOrStat(account, null, 'zMealFarm');
    const cardCookingMulti = getCardBonusByEffect(account?.cards, 'Cooking_Spd_Multi_(Passive)');
    const arcadeBonus = getArcadeBonus(account?.arcade?.shop, 'Cook_SPD_multi')?.bonus ?? 0;
    const winnerBonus = getWinnerBonus(account, '<x Cooking SPD');
    const highestFarming = getHighestCharacterSkill(characters, 'farming');
    let starSignBonus;
    if (characters?.[characterIndex]) {
      starSignBonus = getStarSignBonus(characters?.[characterIndex], account, 'Cooking_SPD', enableNanoChip);
    } else {
      starSignBonus = characters?.reduce((acc, character) => {
        const bonus = getStarSignBonus(character, account, 'Cooking_SPD') ?? 0;
        if (bonus > acc) {
          return bonus;
        }
        return acc;
      }, 0);
    }
    const superbit = isSuperbitUnlocked(account, 'MSA_Mealing');
    let superbitBonus = 0;
    if (superbit) {
      superbitBonus = superbit?.bonus;
    }

    const voidWalkerEnhancementEclipse = getHighestTalentByClass(characters, CLASSES.Voidwalker, 'ENHANCEMENT_ECLIPSE');
    const voidWalkerBloodMarrow = getHighestTalentByClass(characters, CLASSES.Voidwalker, 'BLOOD_MARROW');
    const voidWalkerBonusTalent = Math.pow(Math.min(1.012, 1 + voidWalkerBloodMarrow / 100), totalMeals);
    const voidWalkerEnhancement = getVoidWalkerTalentEnhancements(characters, account, voidWalkerEnhancementEclipse, 146);
    const voidWalkerApocalypseBonus = Math.max(1, voidWalkerEnhancement);

    const voidPlateChefIndex = atomsInfo.findIndex(({ name }) => name === 'Fluoride_-_Void_Plate_Chef');
    let voidPlateChefBonus = 0;
    const voidPlateChefLevel = atomsRaw?.[voidPlateChefIndex];
    if (voidPlateChefLevel) {
      voidPlateChefBonus = Math.pow(1 + atomsInfo?.[voidPlateChefIndex]?.baseBonus * voidPlateChefLevel / 100, voidMeals);
    }

    const voteBonus = getVoteBonus(account, 13);
    const holesObject = account?.hole?.holesObject;
    const monumentBonus = getMonumentBonus({ holesObject, t: 0, i: 2 });
    const schematicBonus = getSchematicBonus({ holesObject, t: 56, i: 0 });
    const lampBonus = getLampBonus({ holesObject, t: 0, i: 0 });
    const upgradeVaultBonus = getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 54);

    const mealSpeed = 10
      * (1 + voidWalkerBonusTalent / 100)
      * Math.max(1, account?.farming?.cropDepot?.cookingSpeed?.value)
      * Math.max(1, voidWalkerApocalypseBonus)
      * (1 + richelinBonus)
      * (1 + voteBonus / 100)
      * (1 + upgradeVaultBonus / 100)
      * (1 + marshmallowBonus
        * Math.ceil((highestFarming + 1) / 50) / 100)
      * Math.max(1, bubbleBonus)
      * Math.max(1, voidPlateChefBonus)
      * (1 + superbitBonus / 100)
      * (1 + speedLv / 10)
      * (1 + triagulonArtifactBonus / 100)
      * (1 + arcadeBonus / 100)
      * (1 + turtleVial / 100)
      * (1 + cookingSpeedVials / 100)
      * (1 + (cookingSpeedStamps
        + Math.max(0, cookingSpeedFromJewel)) / 100)
      * (1 + cookingSpeedMeals / 100)
      * (1 + starSignBonus / 100)
      * (1 + winnerBonus / 100)
      * (1 + monumentBonus / 100)
      * Math.max(1, schematicBonus)
      * (1 + cardCookingMulti / 100)
      * (1 + lampBonus / 100)
      * (1 + extraCookingSpeedVials / 100)
      * Math.max(1, amethystRhinestone)
      * (1 + Math.min(6 * trollBonus
        + (20 * firstAchievement + 10 * secondAchievement), 100) / 100)
      * (1 + kitchenEffMeals
        * Math.floor((speedLv
          + (fireLv
            + luckLv)) / 10) / 100);
    // if (characterIndex === 8 && kitchenIndex === 0){
    //   console.log('voidWalkerBonusTalent:', voidWalkerBonusTalent);
    //   console.log('account?.farming?.cropDepot?.cookingSpeed?.value:', account?.farming?.cropDepot?.cookingSpeed?.value);
    //   console.log('voidWalkerApocalypseBonus:', voidWalkerApocalypseBonus);
    //   console.log('richelinBonus:', richelinBonus);
    //   console.log('voteBonus:', voteBonus);
    //   console.log('upgradeVaultBonus:', upgradeVaultBonus);
    //   console.log('marshmallowBonus:', marshmallowBonus);
    //   console.log('highestFarming:', highestFarming);
    //   console.log('bubbleBonus:', bubbleBonus);
    //   console.log('voidPlateChefBonus:', voidPlateChefBonus);
    //   console.log('superbitBonus:', superbitBonus);
    //   console.log('speedLv:', speedLv);
    //   console.log('triagulonArtifactBonus:', triagulonArtifactBonus);
    //   console.log('arcadeBonus:', arcadeBonus);
    //   console.log('turtleVial:', turtleVial);
    //   console.log('cookingSpeedVials:', cookingSpeedVials);
    //   console.log('cookingSpeedStamps:', cookingSpeedStamps);
    //   console.log('cookingSpeedFromJewel:', cookingSpeedFromJewel);
    //   console.log('cookingSpeedMeals:', cookingSpeedMeals);
    //   console.log('starSignBonus:', starSignBonus);
    //   console.log('winnerBonus:', winnerBonus);
    //   console.log('monumentBonus:', monumentBonus);
    //   console.log('schematicBonus:', schematicBonus);
    //   console.log('cardCookingMulti:', cardCookingMulti);
    //   console.log('lampBonus:', lampBonus);
    //   console.log('extraCookingSpeedVials:', extraCookingSpeedVials);
    //   console.log('amethystRhinestone:', amethystRhinestone);
    //   console.log('trollBonus:', trollBonus);
    //   console.log('firstAchievement:', firstAchievement);
    //   console.log('secondAchievement:', secondAchievement);
    //   console.log('kitchenEffMeals:', kitchenEffMeals);
    //   console.log('speedLv:', speedLv);
    //   console.log('fireLv:', fireLv);
    //   console.log('luckLv:', luckLv);
    //   console.log('###################');
    // }

    // Fire Speed
    const recipeSpeedVials = getVialsBonusByEffect(account?.alchemy?.vials, 'Recipe_Cooking_Speed');
    const recipeSpeedStamps = getStampsBonusByEffect(account, 'New_Recipe_Cooking_Speed');
    const recipeSpeedMeals = getMealsBonusByEffectOrStat(account, null, 'Rcook');

    const fireSpeed = 5
      * (1 + (isRichelin ? 1 : 0))
      * (1 + voteBonus / 100)
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
    const kitchenCostVials = getVialsBonusByEffect(account?.alchemy?.vials, null, 'Kcosts');
    const kitchenCostMeals = getMealsBonusByEffectOrStat(account, null, 'KitchC');
    const arenaBonusActive = isArenaBonusActive(arenaWave, waveReqs, 7);
    const sigilBonus = getSigilBonus(account?.alchemy?.p2w?.sigils, 'GARLIC_GLOVE');

    const fractalIsland = getIsland(account, 'Fractal');
    const reductionUnlocked = fractalIsland?.shop?.find(({
                                                           effect,
                                                           unlocked
                                                         }) => effect.includes('Kitchen_Upgrade_Costs') && unlocked);

    const baseMath = 1 / ((1 + (kitchenCostVials
        + sigilBonus) / 100)
      * (1 + (reductionUnlocked ? 30 : 0) / 100)
      * (1 + kitchenCostMeals / 100)
      * (1 + (isRichelin ? 40 : 0) / 100)
      * (1 + .5 * (arenaBonusActive ? 1 : 0)));

    const speedCost = 1 + baseMath * getSpiceUpgradeCost(speedLv);
    const fireCost = 1 + baseMath * getSpiceUpgradeCost(fireLv);
    const luckCost = 1 + baseMath * getSpiceUpgradeCost(luckLv);

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
        ...(account?.cooking?.meals?.[foodIndex] || {})
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


export const calcMealTime = (maxLevel, meal, totalMealSpeed, achievements, equinoxUpgrades, account) => {
  const { amount, level, cookReq } = meal;
  if (level >= maxLevel) return 0;
  let amountNeeded = 0;
  for (let i = level; i < maxLevel; i++) {
    amountNeeded += getMealLevelCost(i, achievements, account, equinoxUpgrades);
  }
  amountNeeded -= amount;
  if (amountNeeded < 0) return 0;
  return calcTimeToNextLevel(amountNeeded, cookReq, totalMealSpeed);
}

export const DEFAULT_MEAL_MAX_LEVEL = 30;
export const getMealMaxLevel = (account) => {
  const causticolumnArtifact = isArtifactAcquired(account?.sailing?.artifacts, 'Causticolumn');
  const firstJadeUnlocked = isJadeBonusUnlocked(account, 'Papa_Blob\'s_Quality_Guarantee');
  const secondJadeUnlocked = isJadeBonusUnlocked(account, 'Chef_Geustloaf\'s_Cutting_Edge_Philosophy');
  const grimoireBonus = getGrimoireBonus(account?.grimoire?.upgrades, 26);
  return DEFAULT_MEAL_MAX_LEVEL
    + grimoireBonus
    + (causticolumnArtifact?.bonus ?? 0)
    + (firstJadeUnlocked ? 10 : 0)
    + (secondJadeUnlocked ? 10 : 0)
}
export const getMealLevelCost = (level, achievements, account, localEquinoxUpgrades) => {
  const foodLustChallenge = account?.equinox?.challenges.find(challenge => challenge.current === -1
    && challenge.reward.includes('\'Food_Lust\'_Equinox_Upg_now_reduces_cost_by_-42%_per_stack')) ? 1 : 0;
  return (1 / Math.min(5, Math.max(1, 1 + (10 * getAchievementStatus(achievements, 233)) / 100)))
    * Math.max(0.001, Math.pow(Math.max(0.58, 0.8 - 0.22 * foodLustChallenge), getEquinoxBonus(localEquinoxUpgrades || account?.equinox?.upgrades, 'Food_Lust')))
    * (10 + (level + Math.pow(level, 2)))
    * Math.pow(1.2 + 0.05 * level, level)
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
    let rotation = [];
    const firstRng = new LavaRand(Math.round((seed + i)));
    const firstRandom = Math.floor(1E3 * firstRng.rand());
    rotation.push(Math.round(firstRandom - Math.floor(firstRandom / (chips.length - 10)) * (chips.length - 10)));
    const secondRng = new LavaRand(Math.round((seed + i) + 500));
    const secondRandom = Math.floor(1E3 * secondRng.rand());
    rotation.push(Math.round(secondRandom - Math.floor(secondRandom / chips.length) * chips.length));
    const thirdRng = new LavaRand(Math.round((seed + i) + 1E3));
    const thirdRandom = Math.floor(1E3 * thirdRng.rand());
    rotation.push(Math.round(thirdRandom - Math.floor(thirdRandom / jewels.length) * jewels.length));
    for (let b = 0; 3 > b; b++) {
      const tempRotation = [];
      for (let f = 0; 2 > f; f++) {
        const anotherRng = new LavaRand(Math.round((seed + i) + 500 * b + (-1 + 2 * f)));
        const anotherRandom = Math.floor(1E3 * anotherRng.rand());
        const index = 2 === b
          ? Math.round(anotherRandom - Math.floor(anotherRandom / jewels.length) * jewels.length)
          : Math.round(anotherRandom - Math.floor(anotherRandom / (chips.length - 10 * (1 - b))) * (chips.length - Math.round(10 * (1 - b))));
        tempRotation.push(index);
      }
      if (tempRotation[0] === rotation[b])
        for (let e = 0; 100 > e; e++) {
          const yetAnotherRng = new LavaRand(Math.round((seed + i) + 500 * b + 765 * (e + 1)));
          const yetAnotherRandom = Math.floor(1E3 * yetAnotherRng.rand());
          const index = 2 === b
            ? Math.round(yetAnotherRandom - Math.floor(yetAnotherRandom / jewels.length) * jewels.length)
            : Math.round(yetAnotherRandom - Math.floor(yetAnotherRandom / (chips.length - 10 * (1 - b))) * (chips.length - Math.round(10 * (1 - b))));
          if (tempRotation[0] !== index && tempRotation[1] !== index) {
            rotation[b] = index;
            break
          }
        }
    }

    for (let b = 0; 3 > b; b++) {
      if (-1 !== serverVars.ChipRepo?.[b]) {
        rotation[b] = serverVars.ChipRepo?.[b];
      }
      const unlocked = isJadeBonusUnlocked(account, 'Laboratory_Bling');
      if ((rotation[b] >= 21 && rotation[b] <= 23) || (rotation[b] >= 18 && rotation[b] <= 20 && !unlocked)) {
        rotation[b] = Math.max(1, rotation[b] - 10);
      }
    }

    const dateInMs = Math.floor((seed + i) * 604800 * 1000);
    rotation = rotation.map((rotationIndex, index) => index === 2 ? jewels[rotationIndex] : chips[rotationIndex])

    rotations.push({ items: rotation, date: new Date(dateInMs) });
  }

  return rotations;
}

export const calcTotalMeals = (meals) => {
  return meals?.reduce((res, { level }) => res + level, 0);
}