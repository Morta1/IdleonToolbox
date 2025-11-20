import { growth, lavaLog, notateNumber, commaNotation, tryToParse } from '@utility/helpers';
import { spelunkingUpgrades, spelunkingChapters, generalSpelunky, spelunkingRocks } from '../../data/website-data';
import { getWinnerBonus } from '@parsers/world-6/summoning';
import { isArtifactAcquired } from '@parsers/sailing';
import { getMealsBonusByEffectOrStat } from '@parsers/cooking';
import { getSlabBonus } from '@parsers/sailing';
import { getPaletteBonus } from '@parsers/gaming';
import { getExoticMarketBonus } from '@parsers/world-6/farming';
import { getCardBonusByEffect } from '@parsers/cards';
import { getArcadeBonus } from '@parsers/arcade';
import { getGrimoireBonus } from '@parsers/grimoire';
import { getArmorSetBonus } from '@parsers/misc/armorSmithy';
import { isMasteryBonusUnlocked } from '@parsers/misc';
import { getLampBonus } from '@parsers/world-5/caverns/the-lamp';
import { getStampsBonusByEffect } from '@parsers/stamps';
import { getVialsBonusByEffect } from '@parsers/alchemy';
import { getMeritocracyBonus } from '@parsers/world-2/voteBallot';
import { getLegendTalentBonus } from '@parsers/world-7/legendTalents';
import { getBubbleBonus } from '@parsers/alchemy';
import { getDancingCoralBonus } from '@parsers/world-7/coralReef';
import { getZenithBonus } from '@parsers/statues';

export const getSpelunking = (idleonData, account, characters) => {
  const rawSpelunking = tryToParse(idleonData?.Spelunk) || [];
  const rawTowerInfo = idleonData?.TowerInfo || tryToParse(idleonData?.Tower);
  return parseSpelunking(account, characters, rawSpelunking, rawTowerInfo);
}

const parseSpelunking = (account, characters, rawSpelunking, rawTowerInfo) => {
  const cavesUnlocked = rawSpelunking?.[0]?.reduce((res, level) => res + (level > 0 ? 1 : 0), 0);
  const bestCaveLevels = rawSpelunking?.[1];
  const totalBestCaveLevels = bestCaveLevels?.reduce((res, level) => res + level, 0);
  const rawDiscoveries = rawSpelunking?.[6] ?? 0;
  const discoveriesCount = rawDiscoveries?.length ?? 0;
  const maxDiscoveries = spelunkingRocks?.flat().length ?? 0;
  const discoveries = spelunkingRocks?.map((rockArr, caveIndex) => {
    return rockArr.map((rock, index) => {
      const powerReq = getDiscoveryPowerReq(account, rockArr, rock);
      const isScalingRock = rock?.x4 === 1;
      return {
        ...rock,
        index,
        hp: getDiscoveryHp(rock),
        powerReq,
        powerReqFormatted: formatDiscoveryPowerReq(powerReq, isScalingRock),
        acquired: !!(rawDiscoveries || [])?.find((discovery) => discovery === rock?.name)
      }
    })
  });

  const totalCharactersSpelunkingLevels = characters?.reduce((res, { skillsInfo }) => res + skillsInfo?.spelunking?.level ?? 0, 0) ?? 0;
  const highestSpelunkingLevelCharacter = characters?.reduce((res, { skillsInfo }) => Math.max(res, skillsInfo?.spelunking?.level ?? 0), 0) ?? 0;
  const [currentAmber, overstimLevel, , exaltedFragmentFound, prismaFragmentFound] = rawSpelunking?.[4] || [];
  const biggestHauls = rawSpelunking?.[2] ?? [];
  const biggestHaul = biggestHauls?.reduce((sum, value) => {
    return sum + Math.ceil(lavaLog(value));
  }, 0) ?? 0;
  const rawUpgrades = rawSpelunking?.[5];
  const totalUpgradeLevels = rawUpgrades?.reduce((res, level) => res + Math.max(0, level), 0);
  const rawChapters = rawSpelunking?.[8];
  const rawElixir = rawSpelunking?.[17]
  const rawDancingCoral = rawTowerInfo?.slice(18);
  const coralReefLevels = rawSpelunking?.[13];
  const rawLoreThreshold = coralReefLevels?.[2];
  const totalGrandDiscoveries = rawSpelunking?.[44]?.reduce((res, level) => res + level, 0) ?? 0;

  let upgrades = spelunkingUpgrades.map((upgrade, index) => {
    const level = rawUpgrades?.[index] || 0;
    return {
      ...upgrade,
      level,
      originalIndex: index
    }
  });

  const baseBonuses = upgrades.map(u => (u?.x4 ?? 0) * Math.max(0, u?.level ?? 0));
  const loreBonuses = getLoreBonuses(account);
  const amberGain = getAmberGain(account, loreBonuses);
  const power = getPower(account, upgrades);
  const maxDailyPageReads = 5 + 3 * isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.spelunking?.rank, 4);
  const staminaRegenRate = getStaminaRegenRate(account);
  const taxRate = getSpelunkingBonus(account, 19);
  const prismaDropChance = getPrismaDropChance(account, rawSpelunking);
  const exaltedDropChance = getExaltedDropChance(account, rawSpelunking);
  const grandDiscoveriesChance = 4e-5 * (1 + getSpelunkingBonus(account, 43, 0) / 100)
    * (1 + getZenithBonus(account, 6, 0) / 100)

  upgrades = upgrades.map((upgrade, index) => {
    const baseBonus = baseBonuses?.[index] ?? 0;
    const bonus = getSpelunkingUpgradeBonus(baseBonuses, upgrades, index, {
      totalCharactersSpelunkingLevels,
      totalBestCaveLevels,
      discoveriesCount,
      biggestHaul,
      totalGrandDiscoveries
    }, false);
    const description = replacePlaceholders(upgrade.description, index, {
      baseBonus,
      bonus,
      totalBestCaveLevels,
      discoveriesCount,
      biggestHaul,
      totalCharactersSpelunkingLevels,
      exaltedFragmentFound,
      prismaFragmentFound,
      prismaDropChance,
      exaltedDropChance,
      staminaRegenRate: staminaRegenRate.value,
      overstimRate: 30 + getSpelunkingBonus(account, 6),
      maxElixirDuplicates: baseBonuses?.[25],
      taxRate,
      amberGain: amberGain.value,
      totalGrandDiscoveries,
      grandDiscoveriesChance
    })
    const cost = getSpelunkingUpgradeCost(account, characters, upgrade);
    return {
      ...upgrade,
      description,
      baseBonus,
      bonus,
      cost
    }
  });
  const chapters = spelunkingChapters?.map((chapterArr, chapterArrIndex) => {
    return chapterArr.map((chapter, index) => {
      // The game uses the formula: 4 * chapterArrIndex + index
      // This means each chapter array is allocated 4 slots in the flat array
      const flatIndex = 4 * chapterArrIndex + index;
      const level = rawChapters?.[flatIndex] || 0;
      const artifactBonus = isArtifactAcquired(account?.sailing?.artifacts, 'Pointagon')?.bonus ?? 0;

      // const baseMultiplier = chapter?.x4 ? 1 + artifactBonus / 100 : 1;
      const baseMultiplier = chapter?.x4 === 1 ? 1 + account?.sailing?.artifacts?.[35]?.bonus / 100 : 1; // TODO: remove after this is fixed in-game
      const bonus = baseMultiplier * growth(chapter?.func, level, chapter?.x1, chapter?.x2, false) || 0;
      return {
        ...chapter,
        level,
        bonus
      }
    })
  });

  const loreBosses = generalSpelunky[14]?.split(' ').map((description, index) => {
    const discoveriesData = discoveries?.[index]?.slice(0, -1);
    const discoveriesCount = discoveriesData?.reduce((res, discovery) => res + (discovery?.acquired ? 1 : 0), 0);

    return {
      description,
      index: index,
      maxDiscoveries: discoveriesData?.length > 0 ? discoveriesData?.length : 0,
      discoveriesCount,
      discoveries: discoveriesData,
      defeated: index <= cavesUnlocked,
      biggestHaul: biggestHauls?.[index] ?? 0,
      bestCaveLevel: bestCaveLevels?.[index] ?? 0,
      foundAt: generalSpelunky?.[7]?.split(' ')?.[index] ?? 0,
    }
  }).filter((boss) => boss?.description && isNaN(Number(boss.description)));

  const ownedElixirs = upgrades?.[23]?.baseBonus;
  const ownedSlots = 1 + upgrades?.[24]?.baseBonus;
  const maxElixirDuplicates = upgrades?.[25]?.baseBonus;
  const equippedElixirs = rawSpelunking?.[7] || [];
  const elixirs = generalSpelunky[16].split(' ').map((description, index) => {
    const timesUsed = equippedElixirs.filter(elixirIndex => elixirIndex === index).length;
    return {
      description,
      quantity: rawElixir?.[index] || 0,
      bonus: generalSpelunky?.[17]?.split(' ')?.[index] || 0,
      acquired: index <= ownedElixirs,
      isInUse: timesUsed > 0,
      timesUsed
    }
  });

  const talentSpelunkArrays = (rawSpelunking || [])?.slice(20, 41) || [];

  return {
    sneakingSlots: rawSpelunking?.[14],
    totalGrandDiscoveries,
    grandDiscoveriesChance,
    exaltedFragmentFound,
    prismaFragmentFound,
    highestSpelunkingLevelCharacter,
    totalUpgradeLevels,
    coralReefLevels,
    biggestHaul,
    biggestHauls,
    bestCaveLevels,
    cavesUnlocked,
    totalBestCaveLevels,
    totalCharactersSpelunkingLevels,
    discoveriesCount,
    maxDiscoveries,
    discoveries,
    upgrades,
    chapters,
    power,
    rawDancingCoral,
    rawLoreThreshold,
    elixirs,
    currentAmber,
    overstimLevel,
    overstimReq: 100 * Math.pow(1.3, overstimLevel),
    loreBonuses,
    amberGain,
    maxDailyPageReads,
    staminaRegenRate,
    loreBosses,
    ownedSlots,
    ownedElixirs,
    maxElixirDuplicates,
    talentSpelunkArrays
  }
}


const getPrismaDropChance = (account, rawSpelunking) => {
  return 1 / (1 / (100 * Math.pow(1.5, rawSpelunking?.[4]?.[4] ?? 0)) * (1 + getSpelunkingBonus(account, 28) / 100));
}

const getExaltedDropChance = (account, rawSpelunking) => {
  return 1 / (1 / (60 * Math.pow(8, rawSpelunking?.[4]?.[3] ?? 0)) * (1 + getSpelunkingBonus(account, 27) / 100));
}

export const getDiscoveryPowerReq = (account, allRocks, discovery, currentDepth = 0) => {
  // t = rock
  // i = cave
  const option = account?.accountOptions?.[478] ?? 0;

  // Get base rock data (first rock in the array)
  const baseRockData = allRocks?.[0];
  const rockData = discovery;

  // Return max value if depth >= 3 and option < 10
  if (currentDepth >= 3 && option < 10) {
    return 1e8;
  }

  const basePowerMultiplier = baseRockData?.x7 ?? 0;
  const rockPowerMultiplier = rockData?.x1 ?? 0;
  const isScalingRock = rockData?.x4 === 1;

  if (isScalingRock) {
    const scalingExponent = rockData?.x5 ?? 0;
    const levelRequirement = rockData?.x6 ?? 0;
    const depthAboveRequirement = Math.max(0, currentDepth - levelRequirement);
    const scalingFactor = Math.pow(scalingExponent, Math.round(depthAboveRequirement));
    return 100 * basePowerMultiplier * rockPowerMultiplier * scalingFactor;
  } else {
    return 100 * basePowerMultiplier * rockPowerMultiplier;
  }
}

export const formatDiscoveryPowerReq = (powerReq, isScalingRock = false) => {
  // Format: if > 9999999, use "Big" notation, otherwise use comma notation
  // If scaling rock, append "+"
  let formatted = powerReq > 9999999
    ? notateNumber(powerReq, "Big")
    : commaNotation(powerReq);

  if (isScalingRock) {
    formatted += "+";
  }

  return formatted;
}

export const getDiscoveryHp = (discovery) => {
  const baseHp = discovery?.x2 ?? 0;
  const isScalingRock = discovery?.x4 === 1;
  if (isScalingRock) {
    const scalingFactor = discovery?.x5 ?? 0;
    const levelReq = discovery?.x6 ?? 0;
    const depthAboveRequirement = Math.max(0, 0 - levelReq);
    const hpIncrease = (scalingFactor - 1) * depthAboveRequirement;
    return Math.floor(baseHp + hpIncrease);
  } else {
    return Math.floor(baseHp);
  }
}

export const getOverstimBonus = (account) => {
  const shopUpg6 = getSpelunkingBonus(account, 6);
  const overstimPerLevel = 30 + shopUpg6;
  return overstimPerLevel * account?.spelunking?.overstimLevel;
}

export const getLoreBonus = (account, index) => {
  return account?.spelunking?.loreBonuses?.[index]?.bonus ?? 0;
}

export const getLoreBossBonus = (account, index) => {
  const loreBonus = account?.spelunking?.loreBonuses?.[index];
  if (!loreBonus) return 0;
  return loreBonus?.bonus ?? 0;
}

export const getLoreBonuses = (account) => {
  const loreRawStats = generalSpelunky[20]?.split(" ");
  const loreRawValues = generalSpelunky[21]?.split(' ');
  const threshold = account?.spelunking?.rawLoreThreshold;

  const loreValues = loreRawStats?.map((name, index) => {
    let bonus = 0;
    if (threshold > index) {
      const loreData = loreRawValues?.[index]?.split('|');
      const baseValue = parseFloat(loreData[0]);
      const thresholdValue = parseFloat(loreData[1]);

      const grimoireBonus = getGrimoireBonus(account?.grimoire?.upgrades, 17);
      const armorSetBonus = getArmorSetBonus(account, 'TROLL_SET');
      const bonusMultiplier = 1 + (grimoireBonus + armorSetBonus) / 100;
      const tomeScore = account?.tome?.totalPoints ?? 0;
      const levelDiff = Math.max(0, tomeScore - thresholdValue);
      const levelDiffFloored = Math.floor(levelDiff / 100);
      const powerValue = Math.pow(levelDiffFloored, 0.7);
      const denominator = 25 + powerValue;
      const finalValue = bonusMultiplier * baseValue * Math.max(0, powerValue / denominator);
      bonus = finalValue;
    }

    return {
      name,
      bonus,
      index: index
    }
  });

  return loreValues;
}

export const getAmberGain = (account, loreBonuses) => {
  const arcadeBonus = getArcadeBonus(account?.arcade?.shop, 'Spelunking_Amber')?.bonus;
  const farmingBonus = account?.farming?.cropDepot?.spelunky?.value ?? 0;
  const lampBonus = getLampBonus({ holesObject: account?.hole?.holesObject, t: 3, i: 0, account });
  const stampBonus = getStampsBonusByEffect(account, 'spelunkamb');
  const vialBonus = getVialsBonusByEffect(account?.alchemy?.vials, null, '7amber');
  const mealBonus = getMealsBonusByEffectOrStat(account, null, 'SplkAmb');

  const dancingCoralBonus = getDancingCoralBonus(account, 2, 0);
  const cardBonus = getCardBonusByEffect(account?.cards, 'Spelunk_Amber_(Passive)');
  const summoningBonus = getWinnerBonus(account, '<x Amber Gain');
  const shopUpg7 = getSpelunkingBonus(account, 7, 1);
  const shopUpg20 = getSpelunkingBonus(account, 20);
  const shopUpg6 = getSpelunkingBonus(account, 6);
  const overstimBonus = getOverstimBonus(account);

  const riftBonus = (50 * isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.spelunking?.rank, 6));
  const shopUpg8 = getSpelunkingBonus(account, 8);
  const loreBonus = getLoreBonus({ ...account, spelunking: { ...account?.spelunking, loreBonuses } }, 4); // TODO: need to calcualte this
  const chapterBonus = getChapterBonus(account, 1, 3);
  const exoticBonus = getExoticMarketBonus(account, 43);
  const shopUpg9 = getSpelunkingBonus(account, 9);
  const shopUpg10 = getSpelunkingBonus(account, 10);

  const shopUpg21 = getSpelunkingBonus(account, 21);
  const shopUpg35 = getSpelunkingBonus(account, 35);

  return {
    value: (1 + arcadeBonus / 100)
      * (1 + (farmingBonus + (lampBonus + stampBonus + vialBonus + mealBonus)) / 100)
      * (1 + dancingCoralBonus / 100)
      * (1 + cardBonus / 100)
      * (1 + summoningBonus / 100)
      * (1 + (shopUpg7 + shopUpg20) / 100)
      * (1 + shopUpg6 * overstimBonus / 100)
      * (1 + riftBonus / 100)
      * (1 + shopUpg8 / 100)
      * (1 + loreBonus / 100)
      * Math.max(1, chapterBonus)
      * (1 + exoticBonus / 100)
      * (1 + shopUpg9 / 100)
      * (1 + shopUpg10 / 100)
      * (1 + shopUpg21 * (0 + 1) / 150)
      * (1 + shopUpg35 * 0 / 100),
    breakdown: [
      { name: 'Arcade', value: arcadeBonus / 100 },
      { name: 'Farming', value: farmingBonus / 100 },
      { name: 'Lamp', value: lampBonus / 100 },
      { name: 'Stamp', value: stampBonus / 100 },
      { name: 'Vial', value: vialBonus / 100 },
      { name: 'Meal', value: mealBonus / 100 },
      { name: 'Dancing Coral', value: dancingCoralBonus / 100 },
      { name: 'Card', value: cardBonus / 100 },
      { name: 'Winner', value: summoningBonus / 100 },
      { name: 'Amber on the Rocks', value: shopUpg7 / 100 },
      { name: 'Deep Pockets', value: shopUpg20 / 100 },
      { name: 'Overstim Meter', value: shopUpg6 / 100 },
      { name: 'Overstim', value: overstimBonus / 100 },
      { name: 'Rift Bonus', value: riftBonus / 100 },
      { name: 'Amber on the Brain', value: shopUpg8 },
      { name: 'Lore', value: loreBonus / 100 },
      { name: 'Chapter', value: chapterBonus },
      { name: 'Exotic', value: exoticBonus / 100 },
      { name: 'Amber from the Depths', value: shopUpg9 / 100 },
      { name: "Amber from 'Em All", value: shopUpg10 / 100 },
      { name: 'Rope Subsidy', value: shopUpg21 * (0 + 1) / 150 },
      { name: 'Amber Mitosis', value: shopUpg35 * 0 / 100 },
    ]
  };
}

export const getAmberDenominator = (account) => {
  const upgrade51 = getSpelunkingBonus(account, 51);
  const upgrade41 = getSpelunkingBonus(account, 41);
  const upgrade20 = getSpelunkingBonus(account, 20);
  if (upgrade51 >= 1) {
    return 1e21;
  } else if (upgrade41 >= 1) {
    return 1e9;
  } else if (upgrade20 >= 1) {
    return 1e3;
  } else {
    return 1;
  }
}

export const getAmberIndex = (account) => {
  const denominator = getAmberDenominator(account);
  return denominator === 1e21 ? 3 : denominator === 1e6 ? 2 : denominator === 1e3 ? 1 : 0;
}

export const getSpelunkingBonus = (account, index, isBaseBonus) => {
  const upgrade = account?.spelunking?.upgrades?.[index];
  if (!upgrade) return 0;
  return isBaseBonus ? upgrade?.baseBonus : upgrade?.bonus;
}

const getChapterBonus = (account, chapterArrIndex, innerIndex) => {
  const chapter = account?.spelunking?.chapters?.[chapterArrIndex]?.[innerIndex];
  if (!chapter) return 0;
  return chapter?.bonus;
}

const getPower = (account) => {
  const basePower = 1 + getSpelunkingBonus(account, 0);
  // Power multiplier - combines many different bonuses
  const summoningBonus = getWinnerBonus(account, '<x Spelunk POW');
  const gemShopBonus = account?.gemShopPurchases?.find((value, index) => index === 43) ?? 0;
  const gemItemBonus = Math.max(1, Math.pow(2, gemShopBonus));
  const chapterBonus = Math.max(1, getChapterBonus(account, 1, 2));
  const shopUpg1 = getSpelunkingBonus(account, 1);
  const dancingCoralBonus = getDancingCoralBonus(account, 1, 0);

  const farmingBonus = account?.farming?.cropDepot?.spelunky?.value ?? 0;
  const sailingBonus = getSlabBonus(account, 6);
  const gamingBonus = account?.msaTotalizer?.spelunkingPow?.value ?? 0;
  const mealBonus = getMealsBonusByEffectOrStat(account, null, 'SplkPOW');

  const shopUpg2 = getSpelunkingBonus(account, 2);
  const shopUpg3 = getSpelunkingBonus(account, 3);
  const paletteBonus = getPaletteBonus(account, 13);

  const exoticBonus = getExoticMarketBonus(account, 42);
  const cardBonus = getCardBonusByEffect(account?.cards, 'Spelunk_POW_(Passive)');

  const toolUpg14 = getSpelunkingBonus(account, 14);
  const toolUpg15 = getSpelunkingBonus(account, 15);
  const toolUpg16 = getSpelunkingBonus(account, 16);
  const toolUpg17 = getSpelunkingBonus(account, 17);

  const powerMulti = (1 + summoningBonus / 100)
    * gemItemBonus
    * chapterBonus
    * (1 + shopUpg1 / 100)
    * (1 + dancingCoralBonus / 100)
    * (1 + (farmingBonus + sailingBonus + gamingBonus + mealBonus) / 100)
    * (1 + shopUpg2 / 100)
    * (1 + shopUpg3 / 100)
    * (1 + paletteBonus / 100)
    * (1 + (exoticBonus + cardBonus) / 100)
    * (1 + (toolUpg14 + toolUpg15 + toolUpg16 + toolUpg17) / 100);

  return {
    value: basePower * powerMulti,
    breakdown: [
      { name: 'Learning the POW', value: basePower },
      { name: 'Winner', value: summoningBonus },
      { name: 'Gem Item', value: gemItemBonus },
      { name: 'Chapter', value: chapterBonus },
      { name: 'Discovering the POW', value: shopUpg1 },
      { name: 'Dancing Coral', value: dancingCoralBonus },
      { name: 'Farming', value: farmingBonus },
      { name: 'Sailing', value: sailingBonus },
      { name: 'Gaming', value: gamingBonus },
      { name: 'Meal', value: mealBonus },
      { name: 'Depthing the POW', value: shopUpg2 },
      { name: 'Hauling the POW', value: shopUpg3 },
      { name: 'Palette', value: paletteBonus },
      { name: 'Exotic Market', value: exoticBonus },
      { name: 'Card', value: cardBonus },
      { name: 'The Reliable Mace', value: toolUpg14 },
      { name: 'The Sturdy Mallet', value: toolUpg15 },
      { name: 'The Risque Flail', value: toolUpg16 },
      { name: 'The Unaffiliated Warhammer', value: toolUpg17 }
    ]
  }
}

const getSpelunkingUpgradeCost = (account, characters, upgrade) => {
  const mealBonus = getMealsBonusByEffectOrStat(account, null, 'SplkUpg');
  const firstPlayerSpelunkingLevel = characters?.[0]?.skillsInfo?.spelunking?.level ?? 0;
  const levelMultiplier = Math.max(1, Math.min(2, 1 + Math.floor(firstPlayerSpelunkingLevel / 50)));
  var costReduction = 1 / (1 + (mealBonus * levelMultiplier) / 100);
  var baseCost = costReduction
    * (10 + upgrade?.level ?? 0)
    * upgrade?.x1
    * Math.pow(9.5, upgrade?.x7)
    * Math.pow(6.3, upgrade?.x8);

  if (upgrade?.level !== -1) {
    const levelScaling = 0.25 * baseCost * Math.pow(upgrade?.x2, upgrade?.level);
    const quadraticCost = Math.pow(upgrade?.level, 2) + 5 * upgrade?.level;
    return levelScaling + quadraticCost;
  }
}

const getSpelunkingUpgradeBonus = (
  baseBonuses,
  upgrades = [],
  upgradeIndex,
  { totalCharactersSpelunkingLevels = 0, totalBestCaveLevels = 0, discoveriesCount = 0, biggestHaul = 0, totalGrandDiscoveries = 0 } = {},
  directOnly = false
) => {
  if (directOnly) {
    const upgrade = upgrades[upgradeIndex];
    const base = upgrade?.x4 ?? 0;
    const level = Math.max(0, upgrade?.level ?? 0);
    return base * level;
  }

  const applyModifiers = (bonuses) => {
    const treasureMultiplier = 1 + (5 * discoveriesCount) / 100;
    const caveMultiplier = 1 + totalBestCaveLevels / 100;
    const biggestHaulMultiplier = 1 + (3 * biggestHaul) / 100;

    return bonuses.map((val, i) => {
      switch (i) {
        case 0:
          return val * totalCharactersSpelunkingLevels;
        case 8:
          return val * (1 + totalCharactersSpelunkingLevels / 100);
        case 1:
        case 10:
          return val * treasureMultiplier;
        case 2:
          return val * (2 + totalBestCaveLevels / 100);
        case 9:
          return val * caveMultiplier;
        case 3:
          return val * biggestHaulMultiplier;
        case 7: {
          const raw = val ?? 0;
          return 15 + (raw / (250 + raw)) * 45;
        }
        case 19: {
          const raw = val ?? 0;
          return Math.max(10, 50 - raw);
        }
        case 25: {
          const raw = val ?? 0;
          return 1 + raw;
        }
        case 38: {
          const raw = val ?? 0;
          return 20 + raw;
        }
        case 44:
        case 45:
        case 46: {
          return val * totalGrandDiscoveries;
        }
        default:
          return val;
      }
    });
  };

  const finalBonuses = applyModifiers(baseBonuses);

  return upgradeIndex !== undefined ? finalBonuses[upgradeIndex] : finalBonuses;
};

export const groupUpgradesByColumn = (upgrades) => {
  const columns = {};

  upgrades.forEach(upgrade => {
    const col = upgrade.x7;
    if (!columns[col]) {
      columns[col] = [];
    }
    columns[col].push(upgrade);
  });

  Object.keys(columns).forEach(col => {
    columns[col].sort((a, b) => a.x8 - b.x8);
  });

  return columns;
}

export const getStaminaRegenRate = (account) => {
  const baseRate = 5;
  const meritoracyBonus = 1 + getMeritocracyBonus(account, 17) / 100;
  const legendBonus = 1 + getLegendTalentBonus(account, 30) / 100;
  const shopUpg5 = getSpelunkingBonus(account, 5);
  const bubbleBonus = getBubbleBonus(account, 'FASTER_NRG', false);
  const chapterBonus = getChapterBonus(account, 2, 1);
  const riftBonus = 10 * isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.spelunking?.rank, 5);
  const cardBonus = getCardBonusByEffect(account?.cards, 'Stamina_Regen_(Passive)');
  const regenBonus = 1 + (shopUpg5 + bubbleBonus + chapterBonus + riftBonus + cardBonus) / 100;

  return {
    value: baseRate * meritoracyBonus * legendBonus * regenBonus,
    breakdown: [
      { name: 'Base Rate', value: baseRate },
      { name: 'Meritoracy', value: meritoracyBonus },
      { name: 'Legend', value: legendBonus },
      { name: 'Stamina Resurgence', value: shopUpg5 },
      { name: 'Bubble', value: bubbleBonus },
      { name: 'Chapter', value: chapterBonus },
      { name: 'Rift', value: riftBonus / 100 },
      { name: 'Card', value: cardBonus / 100 },
    ]
  }
}

const replacePlaceholders = (description, upgradeId, mockData = {}) => {
  let text = description;

  // Get bonus value for the upgrade
  const bonus = mockData.bonus;

  // Replace { with the bonus value (comma notation)
  text = text.replace(/\{/g, commaNotation(mockData.baseBonus));

  // Replace } with multiplier notation (e.g., "1.5x") and remove # characters
  const multiplier = 1 + bonus / 100;
  const multiplierFormatted = notateNumber(multiplier, 'MultiplierInfo').replace(/#/g, '');
  text = text.replace(/\}/g, multiplierFormatted);

  // Handle special cases based on upgrade ID
  switch (upgradeId) {
    case 1: // Discovering the POW
    case 10: // Amber from 'Em All
      // ^ = number of discoveries
      const discoveries = mockData.discoveriesCount;
      text = text.replace(/\^/g, commaNotation(discoveries || 0));
      break;

    case 2: // Depthing the POW
    case 9: // Amber from the Depths
      // ^ = total depths reached
      const depths = mockData.totalBestCaveLevels;
      text = text.replace(/\^/g, commaNotation(depths || 0));
      break;

    case 3: // Hauling the POW
      // ^ = digits of biggest haul
      const digits = mockData.biggestHaul;
      text = text.replace(/\^/g, commaNotation(digits || 0));
      break;

    case 8: // Amber on the Brain
      // ^ = total spelunking levels
      const levels = mockData.totalCharactersSpelunkingLevels;
      text = text.replace(/\^/g, commaNotation(levels || 0));
      break;

    case 5: // Stamina Resurgence
      // $ = stamina regen rate (rounded to 1 decimal)
      const regenRate = mockData?.staminaRegenRate; // TODO: need to calcualte this
      if (regenRate != null) {
        text = text.replace(/\$/g, '' + (Math.round(10 * regenRate) / 10));
      }
      break;

    case 6: // Overstim Meter
      // $ = overstim bonus per level (rounded integer)
      const overstimBonus = mockData?.overstimRate; // TODO: need to calcualte this
      if (overstimBonus != null) {
        text = text.replace(/\$/g, '' + Math.round(overstimBonus));
      }
      break;

    case 7: // Amber on the Rocks
      // ~ = drop chance (1 decimal, using baseBonus), $ = amber gain (formatted based on value)
      const dropChance = Math.floor(10 * mockData.baseBonus) / 10;
      text = text.replace(/~/g, '' + dropChance);

      const amberGain = mockData?.amberGain;
      if (amberGain != null) {
        if (amberGain > 1e9) {
          text = text.replace(/\$/g, notateNumber(amberGain, 'Big'));
        } else if (amberGain > 100) {
          text = text.replace(/\$/g, commaNotation(amberGain));
        } else {
          text = text.replace(/\$/g, notateNumber(amberGain, 'MultiplierInfo').replace(/#/g, ''));
        }
      }
      break;

    case 19: // Less Taxes
      // $ = tax percentage (rounded integer)
      const taxRate = mockData?.taxRate; // TODO: need to calcualte this
      if (taxRate != null) {
        text = text.replace(/\$/g, '' + Math.round(taxRate));
      }
      break;

    case 21: // Deep Pockets
      // $ = multiplier at depth 7
      const depthMultiplier = 1 + 7 * mockData.bonus / 100;
      text = text.replace(/\$/g, notateNumber(depthMultiplier, 'MultiplierInfo').replace(/#/g, ''));
      break;

    case 25: // Duplicate Elixirs
      // $ = number of duplicates (rounded integer, 1 + bonus)
      const duplicates = mockData?.maxElixirDuplicates;
      if (duplicates != null) {
        text = text.replace(/\$/g, '' + Math.round(duplicates));
      }
      break;

    case 27: // Exalted Find
      // $ = drop chance (1 in X, comma notation), # = count found (rounded integer)
      text = text.replace(/\$/g, commaNotation(mockData?.exaltedDropChance));
      text = text.replace(/#/g, '' + Math.round(mockData?.exaltedFragmentFound));
      break;

    case 28: // Prismatic Find
      // $ = drop chance (1 in X, comma notation), # = count found (rounded integer)
      text = text.replace(/\$/g, commaNotation(mockData?.prismaDropChance));
      text = text.replace(/#/g, '' + Math.round(mockData?.prismaFragmentFound));
      break;

    case 40: // Min-Maxed Nova Blasts
      // $ = best tool name (string), # = damage multiplier (raw number)
      const toolName = mockData?.toolName; // TODO: need to calcualte this
      const toolDamage = mockData?.toolDamage;
      if (toolName != null) {
        text = text.replace(/\$/g, toolName);
      }
      if (toolDamage != null) {
        text = text.replace(/#/g, '' + toolDamage);
      }
      break;

    case 43: // Grand Discoveries
      // $ = total grand discoveries
      text = text.replace(/\$/g, commaNotation(1 / mockData?.grandDiscoveriesChance));
      break;
    default:
      break;
  }

  // Replace remaining $ with bonus (comma notation)
  text = text.replace(/\$/g, commaNotation(bonus || 0));

  return text;
}

export const isEtherealBonusUnlocked = (account) => {
  return account?.spelunking?.loreBosses?.[6]?.defeated;
}