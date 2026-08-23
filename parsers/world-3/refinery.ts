import { growth, tryToParse } from '@utility/helpers';
import { classFamilyBonuses, items, randomList, refinery } from '@website-data';
import { liveEntries } from '@parsers/catalog';
import { calculateItemTotalAmount } from '@parsers/items';
import { getPostOfficeBonus } from '@parsers/world-3/postoffice';
import { getVialsBonusByEffect } from '@parsers/world-2/alchemy';
import { getStampsBonusByEffect } from '@parsers/world-1/stamps';
import { getShinyBonus } from '@parsers/world-4/breeding';
import { isRiftBonusUnlocked } from '@parsers/world-4/rift';
import { constructionMasteryThresholds } from '@parsers/world-3/construction';
import { getArcadeBonus } from '@parsers/world-2/arcade';
import { checkCharClass, CLASSES, getBestActiveCharacter, getHighestTalentAcrossCharacters } from '@parsers/talents';
import { getFamilyBonusBonus } from '@parsers/family';
import { getVoteBonus } from '@parsers/world-2/voteBallot';
import { getLegendTalentBonus } from '@parsers/world-7/legendTalents';
import { getSaltLickBonus } from '@parsers/world-3/saltLick';
import { isCompanionBonusActive } from '@parsers/misc';
import { getResearchGridBonus } from '@parsers/world-7/research';
import { getMealsBonusByEffectOrStat } from '@parsers/world-4/cooking';
import type { IdleonData, Account } from '../types';

export const getRefinery = (idleonData: IdleonData, storage: any[], tasks: any) => {
  const refineryRaw = tryToParse(idleonData?.Refinery) || idleonData?.Refinery;
  return parseRefinery(refineryRaw, storage, tasks);
}

const parseRefinery = (refineryRaw: any[], storage: any[], tasks: any) => {
  const refineryStorageRaw = refineryRaw?.[1];
  const refineryStorageQuantityRaw = refineryRaw?.[2];
  const refineryStorage = refineryStorageRaw?.reduce((res: any, saltName: any, index: any) => saltName !== 'Blank' ? [...res, {
    rawName: saltName,
    name: items[saltName]?.displayName,
    amount: refineryStorageQuantityRaw?.[index],
    owner: 'refinery'
  }] : res, []);
  const combinedStorage = [...(storage || []), ...(refineryStorage || [])];
  const refinerySaltTaskLevel = tasks?.[2]?.[2]?.[6];
  const refineryCatalog = Object.entries(refinery).map(([name, value]: [string, any]) => ({ rawName: name, ...value }));
  const unlockedSaltCount = refineryRaw?.[0]?.[0] ?? 0;
  const saltsArray = liveEntries<any>(refineryCatalog).map(({ entry, index }) => {
    const { rawName: name, saltName, cost } = entry;
    const unlocked = index < unlockedSaltCount;
    const salt = unlocked ? refineryRaw?.[3 + index] : undefined;
    const [refined = 0, rank = 0, , active = 0, autoRefinePercentage = 0] = salt ?? [];
    const componentsWithTotalAmount = cost?.map((item: any) => {
      let amount = calculateItemTotalAmount(combinedStorage, item?.name, true);
      return {
        ...item,
        totalAmount: amount
      }
    })
    return {
      saltName,
      cost: componentsWithTotalAmount,
      rawName: name,
      powerCap: getPowerCap(rank),
      refined,
      rank,
      active,
      autoRefinePercentage,
      unlocked
    };
  });

  return {
    salts: saltsArray,
    refinerySaltTaskLevel,
    timePastCombustion: refineryRaw?.[0]?.[1],
    timePastSynthesis: refineryRaw?.[0]?.[2],
    timePastPolymerize: refineryRaw?.[0]?.[3],
    totalLevels: saltsArray?.slice(0, 6)?.reduce((sum: any, { rank }: any) => sum + rank, 0),
    refineryStorage
  }
}

export const getPowerCap = (rank: number) => {
  const powerCap = randomList[18];
  return parseFloat(String(Math.max(Number(powerCap?.[Math.min(rank, powerCap?.length - 2)]), 25)))
}

export const MAX_POWER_PER_CYCLE = 25e4;

export const getPowerPerCycle = (rank: number, account: Account | null = null) => {
  const companionBonus = isCompanionBonusActive(account, 35) ? account?.companions?.list?.at(35)?.bonus : 0;
  return Math.floor(Math.min(MAX_POWER_PER_CYCLE, Math.pow(rank, 1.3) * (1 + (companionBonus ?? 0))));
}

// The rank at which power per cycle hits its cap - ranking past it only raises the salt's cost.
export const getMaxUsefulRank = (account: Account | null = null) => {
  const companionBonus = isCompanionBonusActive(account, 35) ? account?.companions?.list?.at(35)?.bonus : 0;
  return Math.ceil(Math.pow(MAX_POWER_PER_CYCLE / (1 + (companionBonus ?? 0)), 1 / 1.3));
}

export const hasMissingMats = (saltIndex: number, rank: number, cost: any[], account: Account) => {
  return cost?.filter(({
                         rawName,
                         quantity,
                         totalAmount
                       }) => totalAmount < Math.floor(Math.pow(rank, (rawName?.includes('Refinery') &&
    saltIndex <= account?.refinery?.refinerySaltTaskLevel) ? 1.3 : 1.5)) * quantity)
}

export const getRefineryCycleBonuses = (account: Account, characters: any[]) => {
  const { alchemy, saltLick, charactersLevels, breeding, rift, towers } = account;
  const vials = alchemy?.vials;
  const redMaltVial = getVialsBonusByEffect(vials, 'Refinery_Cycle_Speed');
  const saltLickUpgrade = getSaltLickBonus(saltLick, 2);
  const sigilRefinerySpeed = alchemy?.p2w?.sigils?.find((sigil: any) => sigil?.name === 'PIPE_GAUGE')?.bonus || 0;
  const stampRefinerySpeed = getStampsBonusByEffect(account, 'Faster_refinery_cycles');
  const shinyRefineryBonus = getShinyBonus(breeding?.pets, 'Faster_Refinery_Speed');
  let constructionMastery = 0;
  const isConstructUnlocked = isRiftBonusUnlocked(rift, 'Construct_Mastery');
  if (isConstructUnlocked) {
    constructionMastery = towers?.totalLevels >= constructionMasteryThresholds?.[0]
      ? Math.floor(towers?.totalLevels / 10)
      : 0
  }
  const arcadeBonus = getArcadeBonus(account?.arcade?.shop, 'Refinery_Speed')?.bonus ?? 0;
  const divineKnightsLevels = charactersLevels?.filter((character: any) =>
    checkCharClass(character?.class, CLASSES.Divine_Knight))?.map(({ level }: any) => level);
  const highestLevelDivineKnight = divineKnightsLevels?.length > 0 ? Math.max(...divineKnightsLevels) : 0;
  const theFamilyGuy = getHighestTalentAcrossCharacters(characters, 'THE_FAMILY_GUY', getBestActiveCharacter(characters))
  const familyRefinerySpeed = getFamilyBonusBonus(classFamilyBonuses, 'Refinery_Speed', highestLevelDivineKnight);
  const amplifiedFamilyBonus = (familyRefinerySpeed * (theFamilyGuy > 0 ? (1 + theFamilyGuy / 100) : 1) || 0)
  const voteBonus = getVoteBonus(account, 33);
  const researchGridBonus1 = getResearchGridBonus(account, 49, 0);

  const bonusBreakdown = [
    { name: 'Vials', value: redMaltVial / 100 },
    { name: 'Salt lick', value: saltLickUpgrade / 100 },
    { name: 'Family', value: amplifiedFamilyBonus / 100 },
    { name: 'Sigils', value: sigilRefinerySpeed / 100 },
    { name: 'Stamps', value: stampRefinerySpeed / 100 },
    { name: 'Shinies', value: shinyRefineryBonus / 100 },
    { name: 'Const mastery', value: constructionMastery / 100 },
    { name: 'Arcade', value: arcadeBonus / 100 },
    { name: 'Vote', value: voteBonus / 100 },
    { name: 'Polymer Refinery', value: researchGridBonus1 / 100 }
  ]
  return {
    bonusBreakdown,
    bonus: redMaltVial + saltLickUpgrade + amplifiedFamilyBonus
      + sigilRefinerySpeed + stampRefinerySpeed + shinyRefineryBonus
      + constructionMastery + arcadeBonus + voteBonus + researchGridBonus1
  }
}
const computeRefineryCycleTimes = (account: Account, characters: any[]) => {
  const { bonus, bonusBreakdown } = getRefineryCycleBonuses(account, characters);
  const legendBonus = getLegendTalentBonus(account, 19);
  const labCycleBonus = account?.lab?.labBonuses?.find((bonus: any) => bonus.name === 'Gilded_Cyclical_Tubing')?.active
    ? 3
    : 1;
  const mealBonus = getMealsBonusByEffectOrStat(account, null, 'PolyRefSpd');
  const researchGridBonus = getResearchGridBonus(account, 48, 0);
  const baseSpeedFactor = (1 + bonus / 100) * labCycleBonus * (1 + legendBonus / 100);
  return {
    bonus,
    bonusBreakdown,
    legendBonus,
    labCycleBonus,
    mealBonus,
    researchGridBonus,
    combustionTime: 900 / baseSpeedFactor,
    synthesisTime: 3600 / baseSpeedFactor,
    polymerizeTime: (14400 * 25) / (baseSpeedFactor * (1 + (researchGridBonus + mealBonus) / 100))
  };
}

export const getRefineryCycles = (account: Account, characters: any[], lastUpdated: number) => {
  const {
    bonusBreakdown,
    legendBonus,
    labCycleBonus,
    mealBonus,
    researchGridBonus,
    combustionTime,
    synthesisTime,
    polymerizeTime
  } = computeRefineryCycleTimes(account, characters);
  const squires = characters?.filter((character) => checkCharClass(character?.class, CLASSES.Squire) || checkCharClass(character?.class, CLASSES.Divine_Knight));
  const squiresDataTemp = squires.reduce((res, character) => {
    const { name, talents, cooldowns, postOffice, afkTime } = character;
    const cooldownBonus = getPostOfficeBonus(postOffice, 'Magician_Starterpack', 2);
    const cdReduction = Math.max(0, cooldownBonus);
    const refineryThrottle = talents?.[2]?.orderedTalents.find((talent: any) => talent?.name === 'REFINERY_THROTTLE');
    let cyclesNum = 0;
    if (refineryThrottle?.maxLevel > 0) {
      cyclesNum = growth(refineryThrottle?.funcX, refineryThrottle?.maxLevel, refineryThrottle?.x1, refineryThrottle?.x2) || 0;
    }

    const timePassed = (new Date().getTime() - afkTime) / 1000;
    const calculatedCooldown = (1 - cdReduction / 100) * (cooldowns?.[130]);
    const actualCd = calculatedCooldown - timePassed;
    return {
      squiresCycles: res?.squiresCycles + cyclesNum,
      squiresCooldowns: [...res?.squiresCooldowns, {
        name,
        cooldown: actualCd < 0 ? actualCd : new Date().getTime() + (actualCd * 1000)
      }]
    };
  }, { squiresCycles: 0, squiresCooldowns: [] });
  const timePassed = (new Date().getTime() - (lastUpdated ?? 0)) / 1000;
  const breakdown = [
    ...bonusBreakdown,
    { title: 'Multiplicative' },
    { name: '' },
    { name: 'Lab', value: labCycleBonus },
    { name: 'Legend', value: legendBonus / 100 }
  ];
  const combustion = {
    name: 'Combustion',
    time: Math.ceil(combustionTime),
    timePast: (account?.refinery?.timePastCombustion ?? 0) + timePassed,
    breakdown: [{ title: 'Additive' }, { name: '' }, { name: 'Base', value: 900 }, ...breakdown]
  };
  const synthesis = {
    name: 'Synthesis',
    time: Math.ceil(synthesisTime),
    timePast: (account?.refinery?.timePastSynthesis ?? 0) + timePassed,
    breakdown: [{ title: 'Additive' }, { name: '' }, { name: 'Base', value: 3600 }, ...breakdown]
  }
  const polymerize = {
    name: 'Polymerize',
    time: Math.ceil(polymerizeTime),
    timePast: (account?.refinery?.timePastPolymerize ?? 0) + timePassed,
    breakdown: [{ title: 'Additive' }, { name: '' }, { name: 'Base', value: 360000 }, ...breakdown,
      { name: 'Materials Science', value: (researchGridBonus + mealBonus) / 100 }
    ]
  }
  return {
    ...squiresDataTemp,
    cycles: [combustion, synthesis, polymerize]
  };
}

export const calcTimeToRankUp = (account: Account, characters: any[], _lastUpdated: number, refineryData: any, includeSquireCycles: boolean, rank: number, powerCap: number, refined: number, index: number) => {
  const { combustionTime, synthesisTime, polymerizeTime } = computeRefineryCycleTimes(account, characters);
  const powerPerCycle = getPowerPerCycle(rank, account);
  const cycleTime = index <= 2 ? combustionTime : index <= 5 ? synthesisTime : polymerizeTime;
  const cyclesPerDay = (24 * 60 * 60 / cycleTime)
    + (includeSquireCycles
    ? (refineryData?.squiresCycles ?? 0)
    : 0);
  const timeLeft = Math.floor((powerCap - refined) / powerPerCycle) / cyclesPerDay * 24;
  const totalTime = ((powerCap - 0) / powerPerCycle) / cyclesPerDay * 24;
  return {
    timeLeft: new Date().getTime() + (timeLeft * 3600 * 1000),
    totalTime: new Date().getTime() + (totalTime * 3600 * 1000)
  };
};

export const calcCost = (refinery: any, rank: number, quantity: number, item: string, index: number) => {
  const isSalt = item?.includes('Refinery');
  return Math.floor(Math.pow(rank, (isSalt && index <= refinery?.refinerySaltTaskLevel) ? 1.3 : 1.5)) * quantity;
};

// The game ceils cycle times (CycleInitialTime), and at high refinery speed that rounding is a
// meaningful slice of the cycle - round the same way so output and cost land on the game's rates.
const getSaltCycleTime = (index: number, cycleTimes: any) => Math.ceil(index <= 2
  ? cycleTimes?.combustionTime
  : index <= 5 ? cycleTimes?.synthesisTime : cycleTimes?.polymerizeTime);

// Largest rank whose per-cycle cost still fits in what the previous salt produces in that time.
const solveMaxRank = (allowedCostPerCycle: number, quantity: number, scaling: number) => {
  if (!(quantity > 0) || !(allowedCostPerCycle > 0)) return 0;
  const costFor = (rank: number) => Math.floor(Math.pow(rank, scaling)) * quantity;
  let rank = Math.max(0, Math.floor(Math.pow(allowedCostPerCycle / quantity, 1 / scaling)));
  while (costFor(rank + 1) <= allowedCostPerCycle) rank++;
  while (rank > 0 && costFor(rank) > allowedCostPerCycle) rank--;
  return rank;
}

export interface SaltBalance {
  index: number;
  rawName: string;
  saltName: string;
  rank: number;
  unlocked: boolean;
  active: number;
  autoRefinePercentage: number;
  outputPerHour: number;
  consumedPerHour: number;
  balancePerHour: number;
  isDeficit: boolean;
  outputMaxed: boolean;
  maxSafeRank: number;
}

// Each salt is fuelled by the one before it in the chain, so ranking a salt up raises what it
// drains from its predecessor. Compares both sides per hour to find the rank where that flips.
export const getSaltsBalance = (account: Account, characters: any[]): SaltBalance[] => {
  const salts: any[] = account?.refinery?.salts ?? [];
  const cycleTimes = computeRefineryCycleTimes(account, characters);
  const maxUsefulRank = getMaxUsefulRank(account);
  const saltTaskLevel = account?.refinery?.refinerySaltTaskLevel ?? 0;

  return salts.reduce((res: SaltBalance[], salt: any, index: number) => {
    const { rawName, saltName, rank, cost, active, autoRefinePercentage, unlocked } = salt;
    const cycleTime = getSaltCycleTime(index, cycleTimes);
    const powerPerCycle = getPowerPerCycle(rank, account);
    const outputPerHour = unlocked ? powerPerCycle * 3600 / cycleTime : 0;

    const nextSalt = salts?.[index + 1];
    const nextSaltCost = nextSalt?.cost?.find((item: any) => item?.rawName === rawName);
    const consumedPerHour = unlocked && nextSalt?.unlocked && nextSalt?.active && nextSaltCost
      ? calcCost(account?.refinery, nextSalt?.rank, nextSaltCost?.quantity, nextSaltCost?.rawName, index + 1)
      * 3600 / getSaltCycleTime(index + 1, cycleTimes)
      : 0;

    const previous = res?.[index - 1];
    const previousCost = cost?.find((item: any) => item?.rawName === salts?.[index - 1]?.rawName);
    let maxSafeRank = rank;
    if (unlocked) {
      maxSafeRank = previousCost
        ? Math.min(maxUsefulRank, solveMaxRank((previous?.outputPerHour ?? 0) * cycleTime / 3600,
          previousCost?.quantity, index <= saltTaskLevel ? 1.3 : 1.5))
        : maxUsefulRank;
    }

    return [...res, {
      index,
      rawName,
      saltName,
      rank,
      unlocked,
      active,
      autoRefinePercentage,
      outputPerHour,
      consumedPerHour,
      balancePerHour: outputPerHour - consumedPerHour,
      isDeficit: consumedPerHour > outputPerHour,
      outputMaxed: powerPerCycle >= MAX_POWER_PER_CYCLE,
      maxSafeRank
    }];
  }, []);
}

export const calcResourceToRankUp = (rank: number, refined: number, powerCap: number, itemCost: number, account: Account | null = null) => {
  const powerPerCycle = getPowerPerCycle(rank, account);
  const remainingProgress = powerCap - refined;
  return (remainingProgress / powerPerCycle) * itemCost;
}

