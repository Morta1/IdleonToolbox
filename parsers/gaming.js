import { gamingImports, gamingUpgrades, randomList2, superbitsUpgrades } from '../data/website-data';
import { notateNumber, number2letter } from '../utility/helpers';
import { getMinorDivinityBonus } from './divinity';
import { getHighestCharacterSkill, isMasteryBonusUnlocked } from './misc';
import { getEquinoxBonus } from './equinox';
import { getVoteBonus } from '@parsers/world-2/voteBallot';
import { isArtifactAcquired } from '@parsers/sailing';
import { getMonumentBonus } from '@parsers/world-5/caverns/bravery';
import { getJewelBonus, getLabBonus } from '@parsers/lab';
import { getMealsBonusByEffectOrStat } from '@parsers/cooking';
import { getBubbleBonus, getVialsBonusByStat } from '@parsers/alchemy';
import { CLASSES, getHighestTalentByClass } from '@parsers/talents';
import { getAchievementStatus } from '@parsers/achievements';
import { getWinnerBonus } from '@parsers/world-6/summoning';
import { getLampBonus } from '@parsers/world-5/caverns/the-lamp';
import { getEmperorBonus } from '@parsers/world-6/emperor';

const { tryToParse } = require('../utility/helpers');

export const getGaming = (idleonData, characters, account, serverVars) => {
  const gamingRaw = tryToParse(idleonData?.Gaming) || idleonData?.Gaming;
  const gamingSproutRaw = tryToParse(idleonData?.GamingSprout) || idleonData?.GamingSprout;
  if (!gamingRaw || !gamingSproutRaw) return null;
  return parseGaming(gamingRaw, gamingSproutRaw, characters, account, serverVars);
}

const parseGaming = (gamingRaw, gamingSproutRaw, characters, account, serverVars) => {
  const logBook = []
  const baseValue = 'hhhhhhhhh';
  for (let i = 0; i < 9; i++) {
    let s = 0;
    for (let r = number2letter.indexOf((baseValue)?.charAt(i)); s < r; s++) {
      logBook.push({
        rawName: ('GamingPlant' + (number2letter[i + 1]) + s + '.png'),
        unlocked: gamingRaw?.[11] ? s < number2letter.indexOf((gamingRaw?.[11])?.charAt(i)) : false
      });
    }
  }
  const [, snailLevel, snailEncouragement] = gamingSproutRaw?.[32];
  const envelopes = gamingRaw?.[13];
  const availableSprouts = gamingSproutRaw.slice(0, 25).reduce((res, sprout) => sprout?.[1] > 0 ? res + 1 : res, 0);
  const bits = gamingRaw?.[0];
  const poingHighscore = gamingRaw?.[10];
  const poingMulti = Math.max(1 + Math.pow(poingHighscore, 0.5) / 100, 1);
  const bestNugget = gamingRaw?.[8];
  const elegantShellRank = gamingSproutRaw?.[28]?.[2];
  const totalPlantsPicked = gamingSproutRaw?.[28]?.[1];
  const lastShovelClicked = gamingSproutRaw?.[26]?.[1];
  const goldNuggets = calcGoldNuggets(lastShovelClicked);
  const [squirrelLevel, lastAcornClicked, squirrelMulti] = gamingSproutRaw?.[27];
  const acorns = calcAcorns(lastAcornClicked, squirrelLevel);
  const nuggetsBreakpoints = calcResourcePerTime('nugget');
  const acornsBreakpoints = calcResourcePerTime('acorn', squirrelLevel);
  const acornShop = calcAcornShop(gamingSproutRaw);
  const gamingImportsStartIndex = 25;
  const gamingImportsValues = gamingSproutRaw?.slice(gamingImportsStartIndex, gamingImportsStartIndex + gamingImports?.length + 1);
  const goldenSprinkler = account?.gemShopPurchases?.find((value, index) => index === 131) ?? 0;
  const saveSprinklerChance = calcSprinklerSave(account?.gemShopPurchases?.find((value, index) => index === 131) ?? 0);
  const imports = gamingImports?.map((item, index) => {
    const bonus = calcImportBonus(index, item?.minorBonus, gamingImportsValues);
    return {
      ...item,
      level: gamingImportsValues?.[index]?.[0],
      rawName: index === 3 ? `GamingItem${index}_0` : index === 0 ? goldenSprinkler > 0
        ? `GamingItem${index}b`
        : `GamingItem${index}` : `GamingItem${index}`,
      minorBonus: bonus?.description,
      bonus: bonus?.value,
      cost: calcImportCost(index, gamingImportsValues),
      acquired: gamingImportsValues?.[index]?.[0] > 0,
      ...(index === 0 ? {
        saveSprinklerChance: saveSprinklerChance * 100
      } : {}),
      ...(index === 1 ? {
        maxNuggetValue: maxNuggetValue(bonus?.result, getEquinoxBonus(account?.equinox?.upgrades, 'Metal_Detector'), account?.accountOptions?.[192])
      } : {}),
      ...(index === 2 ? {
        acornShop
      } : {})
    }
  }).filter((_, index) => index < 8);

  const fertilizerUpgrades = gamingRaw?.slice(1, gamingUpgrades?.length + 1)?.map((level, index) => {
    const bonus = calcFertilizerBonus(index, gamingRaw, gamingSproutRaw, characters, account, acornShop, imports);
    return {
      ...gamingUpgrades?.[index],
      level,
      bonus,
      description: gamingUpgrades?.[index]?.description.replace(/{/, bonus),
      cost: calcFertilizerCost(index, gamingRaw, serverVars)
    }
  });
  const availableDrops = getDropsAmount(gamingSproutRaw?.[25]?.[1], imports);
  const superbitsUnlocks = gamingRaw?.[12] || [];
  const superbitsUpg = superbitsUpgrades?.map((upgrade, index) => ({
    ...upgrade,
    unlocked: superbitsUnlocks?.indexOf(number2letter?.[index]) !== -1,
    cost: upgrade?.x1 * Math.pow(10, upgrade?.x2),
    ...calcSuperbitBonus(characters, account, index)
  }));
  const dna = gamingRaw?.[5];
  const unlockedMutations = gamingRaw?.[4];
  const evolutionLevel = gamingRaw?.[7];
  const mutations = getMutations();
  const mutationCost = (25 + (10 * (evolutionLevel + 1) + Math.pow(evolutionLevel + 1, 2))) * Math.pow(1.3, evolutionLevel);
  const voteBonus = (1 + getVoteBonus(account, 21) / 100);
  const newMutationChance = getNewMutationChance(unlockedMutations, dna, voteBonus);
  const mutationChanceBreakpoints = [100, 200, 300, 400, 500].map((bp) => ({
    value: bp,
    chance: getNewMutationChance(unlockedMutations, bp)
  }));
  return {
    bestNugget,
    bits,
    envelopes,
    snailLevel, snailEncouragement,
    squirrelMulti,
    elegantShellRank,
    fertilizerUpgrades,
    availableSprouts,
    availableDrops,
    sproutsCapacity: fertilizerUpgrades?.[2]?.bonus,
    imports,
    lastShovelClicked,
    goldNuggets,
    lastAcornClicked,
    acorns,
    nuggetsBreakpoints,
    acornsBreakpoints,
    superbitsUpgrades: superbitsUpg,
    mutations,
    unlockedMutations,
    mutationCost,
    dna,
    newMutationChance,
    mutationChanceBreakpoints,
    logBook,
    poingHighscore,
    poingMulti,
    totalPlantsPicked
  };
}

export const getBitsMulti = (account, characters) => {
  // 'SproutValueNonPlantMulti' == e
  const gummyOrbArtifactBonus = isArtifactAcquired(account?.sailing?.artifacts, 'Gummy_Orb')?.bonus ?? 0;
  const weatherbookArtifactBonus = isArtifactAcquired(account?.sailing?.artifacts, 'Weatherbook')?.bonus ?? 0;
  const snailBonus = Math.pow(2, Math.max(0, Math.min(25, account?.gaming?.snailLevel)));
  const acornBonus = 1 + (8 * account?.gaming?.squirrelMulti) / (250 + account?.gaming?.squirrelMulti);
  const elegantShellBonus = account?.gaming?.imports?.[3]?.bonus;
  const mealBonus = getMealsBonusByEffectOrStat(account, null, 'GamingBits');
  const vialBonus = getVialsBonusByStat(account?.alchemy?.vials, 'GameBits');
  const bittyLittlyTalentBonus = getHighestTalentByClass(characters, CLASSES.Divine_Knight, 'BITTY_LITTY') ?? 0;
  const highestGaming = getHighestCharacterSkill(characters, 'gaming');
  const winBonus = getWinnerBonus(account, '<x Gaming Bits');
  const lampBonus = getLampBonus({ holesObject: account?.hole?.holesObject, t: 1, i: 1 });
  const emperorBonus = getEmperorBonus(account, 7);
  const skillMastery = isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.gaming?.rank, 1) || 0;
  const bubbleBonus = getBubbleBonus(account, 'BIT_BY_BIT', false);
  const ownedLogBooks = account?.gaming?.logBook?.reduce((sum, { unlocked }) => sum + (unlocked ? 1 : 0), 0);
  const logBookBitBonus = Math.max(1, Math.pow(1.08, ownedLogBooks) + (bubbleBonus * ownedLogBooks) / 100);

  const breakdown = [
    { title: 'Multiplicative' },
    { name: 'Gummy Orb Artifact', value: gummyOrbArtifactBonus / 100 },
    { name: 'Weatherbook Artifact', value: weatherbookArtifactBonus / 100 },
    { name: 'Monument', value: getMonumentBonus({ holesObject: account?.hole?.holesObject, t: 0, i: 4 }) / 100 },
    { name: 'Skill mastery', value: 15 * skillMastery / 100 },
    { name: 'MSA Bonus', value: account?.msaTotalizer?.bit?.value / 100 },
    { name: 'Snail', value: snailBonus },
    { name: 'Acorn', value: acornBonus },
    { name: 'Nugget', value: account?.gaming?.bestNugget },
    { name: 'Elegant Shell', value: (account?.gaming?.elegantShellRank * elegantShellBonus) / 100 },
    { name: 'Logbook', value: logBookBitBonus },
    { name: 'Meal', value: mealBonus / 100 },
    { name: 'Vial', value: vialBonus / 100 },
    { name: 'Bitty Litty Talent', value: bittyLittlyTalentBonus * highestGaming / 100 },
    { name: 'Achievements', value: (1 + (getAchievementStatus(account?.achievements, 296) + getAchievementStatus(account?.achievements, 307)) / 20) },
    { name: 'Poing', value: Math.max(1, Math.min(25, account?.gaming?.poingMulti)) },
    { name: 'Summoning', value: winBonus / 100 },
    { name: 'Lamp', value: lampBonus / 100 },
    { name: 'Emperor', value: emperorBonus / 100 },
  ]

  return {
    value: (1 + gummyOrbArtifactBonus / 100)
      * (1 + weatherbookArtifactBonus / 100)
      * (1 + getMonumentBonus({ holesObject: account?.hole?.holesObject, t: 0, i: 4 }) / 100)
      * (1 + (15 * skillMastery) / 100)
      * (1 + account?.msaTotalizer?.bit?.value / 100)
      * Math.max(1, snailBonus)
      * Math.max(1, acornBonus)
      * Math.max(1, account?.gaming?.bestNugget)
      * (1 + (account?.gaming?.elegantShellRank * elegantShellBonus) / 100)
      * Math.max(1, logBookBitBonus)
      * (1 + (mealBonus + vialBonus) / 100)
      * (1 + (bittyLittlyTalentBonus * highestGaming) / 100)
      * Math.max(1, Math.min(25, account?.gaming?.poingMulti))
      * (1 + (getAchievementStatus(account?.achievements, 296) + getAchievementStatus(account?.achievements, 307)) / 20)
      * (1 + winBonus / 100) *
      (1 + lampBonus / 100) *
      (1 + emperorBonus / 100),
    breakdown,
    expression: `(1 + gummyOrbArtifactBonus / 100)
  * (1 + weatherbookArtifactBonus / 100)
  * (1 + monumentBonus / 100)
  * (1 + (15 * skillMastery) / 100)
  * (1 + msaBitBonus / 100)
  * Math.max(1, snailBonus)
  * Math.max(1, acornBonus)
  * Math.max(1, bestNugget)
  * (1 + (account?.gaming?.elegantShellRank * elegantShellBonus) / 100)
  * Math.max(1, logBookBitBonus)
  * (1 + (mealBonus + vialBonus) / 100)
  * (1 + (bittyLittlyTalentBonus * highestGaming) / 100)
  * Math.max(1, Math.min(25, account?.gaming?.poingMulti))
  * (1 + (achievement1 + achievement1) / 20)
  * (1 + winBonus / 100) *
  (1 + lampBonus / 100) *
  (1 + emperorBonus / 100)`
  }
}

export const getNewMutationChance = (unlockedMutations, dna, voteBonus = 1) => {
  return Math.floor(1e3 * (0 === unlockedMutations
    ? Math.min(0.8, (7 * dna) / (100 + dna) * voteBonus)
    : Math.min(0.99, ((42 * dna) / (100 + dna)) * Math.pow(0.31, unlockedMutations) * voteBonus))) / 10
}

const getMutations = () => {
  const mutations = ['FunGi', 'Bonsai', 'Cactus', 'Blossom', 'Voraci', 'Berri Bush', 'EverGreen', 'Chemical']
  const plantsBonuses = randomList2?.[0]?.split(' ');
  return mutations.map((mutation, index) => ({
    name: mutation,
    index,
    description: plantsBonuses?.[index]?.replace(/₣/g, 'bits')
  }))
}

const calcSuperbitBonus = (characters, account, index) => {
  let bonus, totalBonus, additionalInfo;
  if (index === 0) {
    bonus = account?.achievements?.filter(({ completed }) => completed)?.length ?? 0;
    totalBonus = Math.pow(1.03, bonus);
  } else if (index === 3 || index === 11 || index === 16) {
    bonus = Math.floor(account?.towers?.totalWaves / 10);
    additionalInfo = `Total Bonus: ${bonus}% (${account?.towers?.totalWaves} waves)`
  } else if (index === 13) {
    bonus = Math.floor(account?.towers?.totalWaves / 10) * 10;
    additionalInfo = `Total Bonus: ${bonus}% (${account?.towers?.totalWaves} waves)`
  } else if (index === 7) {
    bonus = Math.floor(account?.towers?.totalWaves / 10);
    additionalInfo = `Total Bonus: ${bonus}% (${account?.towers?.totalWaves} waves)`
  } else if (index === 20) {
    bonus = Math.floor(account?.towers?.totalWaves / 10) * 50;
    additionalInfo = `Total Bonus: ${bonus}% (${account?.towers?.totalWaves} waves)`
  } else if (index === 12) {
    // skill level doesn't update if the character is away for a long time
    const highestGaming = getHighestCharacterSkill(characters, 'gaming');
    totalBonus = Math.floor(highestGaming);
  }
  return { bonus, totalBonus, additionalInfo }
}

const getDropsAmount = (baseValue, fertilizerUpgrades) => {
  const importBonus = fertilizerUpgrades?.[0]?.level;
  return Math.floor(Math.pow(baseValue
    * (1 + importBonus / 100) / 3600, .75));

}

const maxNuggetValue = (bonus, equinoxBonus, nbNuggetsSinceUpgrade) => {
  return bonus * (1 / Math.pow(1e-5, 0.64)) * (1 + equinoxBonus * nbNuggetsSinceUpgrade / 100);
}

const calcResourcePerTime = (type, squirrelLevel) => {
  const bpObject = [1, 2, 3, 4, 5, 6].reduce(({ breakpoints, lastClicked }, _, index) => {
    let time = (Math.floor(lastClicked) * 3600) + ((lastClicked % 1) * 60 * 100);
    let amount = type === 'nugget' ? calcGoldNuggets(time) : calcAcorns(time, squirrelLevel);
    if (breakpoints.length === 0) {
      return { breakpoints: [...breakpoints, { time, amount }], lastClicked: lastClicked + .1 }
    }
    while (amount <= breakpoints?.[index - 1]?.amount && lastClicked % 1 !== 0) {
      amount = type === 'nugget' ? calcGoldNuggets(time) : calcAcorns(time, squirrelLevel);
      if (amount <= breakpoints?.[index - 1]?.amount) {
        lastClicked += 0.1;
        time = (Math.floor(lastClicked) * 3600) + ((lastClicked % 1) * 60 * 100);
      }
    }
    return { breakpoints: [...breakpoints, { time, amount }], lastClicked };
  }, { breakpoints: [], lastClicked: 1 });
  return bpObject?.breakpoints;
}

export const calcGoldNuggets = (lastClick) => {
  return Math.floor(Math.pow(lastClick / 3600, 0.44));
}

export const calcAcorns = (lastClick, squirrelLevel) => {
  return Math.floor(Math.pow(lastClick * (1 + squirrelLevel / 100) / 3600, .85));
}

const calcSprinklerSave = (goldenSprinkler) => {
  return 1 === goldenSprinkler ? 0.3 : 2 === goldenSprinkler ? 0.43 : 3 === goldenSprinkler
    ? 0.53
    : 4 === goldenSprinkler ? 0.6 : 0;
}

const calcImportBonus = (index, minorBonus, gamingImportsValues) => {
  const value = gamingImportsValues?.[index]?.[0];
  let fixedMinorBonus = minorBonus;
  if (index === 1) {
    const result = Math.floor(10 * (1 + Math.pow((60 * value) / (250 + value), 1.7))) / 10;
    return { description: fixedMinorBonus.replace(/{/, result), result };
  }
  if (index === 2) {
    const result = Math.round(5 * (value))
    return { description: fixedMinorBonus.replace(/{/, result), result };
  }
  if (index === 5) {
    const result = Math.floor(((60 * value) / (100 + (value))) * 10) / 10;
    return { description: fixedMinorBonus.replace(/{/, result), result };
  }
  return { description: fixedMinorBonus.replace(/{/, Math.round(value)), value: Math.round(value) };
}

const calcImportCost = (index, gamingImportsValues) => {
  return (gamingImports?.[index]?.x1 *
    Math.pow(10, gamingImports?.[index]?.x2)) / 4 * Math.pow(1.4, gamingImportsValues?.[index]?.[0]);
}

const calcFertilizerBonus = (index, gamingRaw, gamingSproutRaw, characters, account, acornShop, imports) => {
  if (index === 0) {
    const baseValue = gamingRaw?.[1];
    return notateNumber((1 + 4 * baseValue) * Math.pow(1.065, baseValue), 'bits');
  } else if (index === 1) {
    const baseValue = gamingRaw?.[2];
    const purrmepPlayer = characters?.find(({ linkedDeity }) => linkedDeity === 6); // purrmep is limited to only 1 player linked.
    const godBonus = getMinorDivinityBonus(purrmepPlayer, account, 6, characters) ?? 0;
    const baseMath = 1 + (acornShop?.[1]?.bonus + godBonus) / 100;
    const moreMath = 3 + imports?.[4]?.level / 100;
    const baseValue2 = gamingSproutRaw?.[29]?.[1];
    const growTime = 5e3 / ((1 + (2 * baseValue) / 100) * baseMath * (1 + moreMath * (baseValue2)));
    const growChance = 1 / calcSproutGrowChance(gamingRaw);
    const final = (growTime * growChance) / 60;
    const time = 100 * final / 100;
    return time > 60 ? `${100 * time / 60 / 100} Hr` : `${(Math.trunc(time * 1000) / 1000)} Min`;
  } else if (index === 2) {
    const baseValue = gamingRaw?.[3];
    const maxSprouts = account?.gemShopPurchases?.find((value, index) => index === 133) ?? 0;
    return notateNumber(Math.round(Math.min(24, 3 + baseValue + (maxSprouts))));
  }
}

const calcSproutGrowChance = (gamingRaw) => {
  const baseValue = gamingRaw?.[7];
  return .13 + (.11 * baseValue) / (150 + baseValue);
}

const calcFertilizerCost = (index, gamingRaw, serverVars) => {
  if (index === 0) {
    const baseValue = gamingRaw?.[1];
    const baseMath = 1 + (3 * baseValue + Math.pow(baseValue, 2));
    const moreMath = Math.min(1.25, Math.max(1.13, 1 + serverVars?.GamingFertCostExpA / 1e3));
    const finalMath = moreMath + Math.max(0, Math.min(0.15, (0.18 * (baseValue - 50)) / ((baseValue) + 100)));
    return baseMath * Math.pow(finalMath, baseValue);
  }
  if (index === 1) {
    const baseValue = gamingRaw?.[2];
    const baseMath = 2 + (5 * baseValue + Math.pow(baseValue, 2));
    return baseMath * Math.pow(1.22, baseValue);
  }
  if (index === 2) {
    const baseValue = gamingRaw?.[3];
    if (11 > baseValue) {
      const baseMath = 25 * (baseValue + 1) + Math.pow((baseValue) + 1, 3);
      return baseMath * Math.pow(5 + 3.7 * baseValue, baseValue);
    }
    return 9999 * Math.pow(10, 63);
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

export const isSuperbitUnlocked = (account, superbitName) => {
  return account?.gaming?.superbitsUpgrades?.find(({ name, unlocked }) => name === superbitName && unlocked)
}

export const calculateSnailEncouragementForSuccessChance = (snailLevel, desiredSuccessChance) => {
  const epsilon = 1; // Set epsilon to 1 to work with whole numbers
  let low = 0;
  let high = 1000; // Adjust the upper bound based on your specific scenario.
  while (high - low > epsilon) {
    const mid = Math.floor((low + high) / 2); // Use Math.floor to ensure whole numbers
    const midValue = (1 - 0.1 * Math.pow(snailLevel, 0.72)) * (1 + (100 * mid) / (25 + mid) / 100);

    if (midValue < desiredSuccessChance) {
      low = mid + 1; // Increment low by 1 to ensure progress
    } else {
      high = mid;
    }
  }
  return low; // Return low as a whole number
}