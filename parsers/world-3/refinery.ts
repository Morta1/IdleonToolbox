import { growth, tryToParse } from '@utility/helpers';
import { items, randomList, refinery } from '@website-data';
import { liveEntries } from '@parsers/catalog';
import { calculateItemTotalAmount } from '@parsers/items';
import { getPostOfficeBonus } from '@parsers/world-3/postoffice';
import { getVialsBonusByEffect } from '@parsers/world-2/alchemy';
import { getStampsBonusByEffect } from '@parsers/world-1/stamps';
import { getShinyBonus } from '@parsers/world-4/breeding';
import { isRiftBonusUnlocked } from '@parsers/world-4/rift';
import { constructionMasteryThresholds } from '@parsers/world-3/construction';
import { getArcadeBonus } from '@parsers/world-2/arcade';
import { checkCharClass, CLASSES } from '@parsers/talents';
import { getFamilyBonusesOfActive } from '@parsers/family';
import { getVoteBonus } from '@parsers/world-2/voteBallot';
import { getLegendTalentBonus } from '@parsers/world-7/legendTalents';
import { getSaltLickBonus } from '@parsers/world-3/saltLick';
import { isCompanionBonusActive } from '@parsers/misc';
import { getResearchGridBonus } from '@parsers/world-7/research';
import { getMealsBonusByEffectOrStat } from '@parsers/world-4/cooking';
import type { IdleonData, Account } from '../types';
import { additiveGroup, createBreakdown, flat, multiplier, percent, productGroup } from '@parsers/breakdown';
import type { BreakdownNode } from '@parsers/breakdown';

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

// game: "PowerCAP"
export const getPowerCap = (rank: number) => {
  const powerCap = randomList[18];
  return parseFloat(String(Math.max(Number(powerCap?.[Math.min(rank, powerCap?.length - 2)]), 25)))
}

const MAX_POWER_PER_CYCLE = 25e4;

// game: "PowerPerCycle"
export const getPowerPerCycle = (rank: number, account: Account | null = null) => {
  const companionBonus = isCompanionBonusActive(account, 35) ? account?.companions?.list?.at(35)?.bonus : 0;
  return Math.floor(Math.min(MAX_POWER_PER_CYCLE, Math.pow(rank, 1.3) * (1 + (companionBonus ?? 0))));
}

// The rank at which power per cycle hits its cap - ranking past it only raises the salt's cost.
const getMaxUsefulRank = (account: Account | null = null) => {
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
  // FamBonusQTYs[24]: buffed by the account's best THE_FAMILY_GUY, whoever is played
  const amplifiedFamilyBonus = getFamilyBonusesOfActive(charactersLevels, characters)?.[CLASSES.Divine_Knight] ?? 0;
  const voteBonus = getVoteBonus(account, 33);
  const researchGridBonus1 = getResearchGridBonus(account, 49, 0);

  const bonusBreakdown = [
    percent('Red Malt (Vial)', redMaltVial),
    percent('Salt lick', saltLickUpgrade),
    percent('Family', amplifiedFamilyBonus),
    percent('Pipe Gauge (Sigil)', sigilRefinerySpeed),
    percent('Stamps', stampRefinerySpeed),
    percent('Shinies', shinyRefineryBonus),
    percent('Construction mastery', constructionMastery),
    percent('Arcade', arcadeBonus),
    percent('Vote', voteBonus),
    percent('Polymer Refinery (Research)', researchGridBonus1)
  ]
  return {
    bonusBreakdown,
    bonus: redMaltVial + saltLickUpgrade + amplifiedFamilyBonus
      + sigilRefinerySpeed + stampRefinerySpeed + shinyRefineryBonus
      + constructionMastery + arcadeBonus + voteBonus + researchGridBonus1
  }
}
// Seconds per cycle before any speed bonus
const REFINERY_BASE_CYCLE_TIMES = { combustion: 900, synthesis: 3600, polymerize: 14400 * 25 };

const formatCycleTime = (seconds: number) => {
  const rounded = Math.ceil(seconds);
  const minutes = Math.floor(rounded / 60);
  return `${minutes}m:${String(rounded % 60).padStart(2, '0')}s`;
}

// Exported so one alert evaluation can compute the stamp/shiny/vial/talent stack once and feed it
// to both getSaltMatsTimeLeft and getSaltsBalance.
export const getRefineryCycleTimes = (account: Account, characters: any[]) => computeRefineryCycleTimes(account, characters);

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
    combustionTime: REFINERY_BASE_CYCLE_TIMES.combustion / baseSpeedFactor,
    synthesisTime: REFINERY_BASE_CYCLE_TIMES.synthesis / baseSpeedFactor,
    polymerizeTime: REFINERY_BASE_CYCLE_TIMES.polymerize / (baseSpeedFactor * (1 + (researchGridBonus + mealBonus) / 100))
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
  const speedLines = [
    additiveGroup('Cycle speed', bonusBreakdown),
    multiplier('Gilded Cyclical Tubing (Lab)', labCycleBonus),
    multiplier('Legend talent', 1 + legendBonus / 100)
  ];
  // The cycle time is the base time over the speed
  const cycleBreakdown = (name: string, baseTime: number, time: number, extraSpeed: BreakdownNode[] = []) =>
    createBreakdown(`${name} cycle time`, formatCycleTime(time), [
      flat('Base time', baseTime, { formatted: formatCycleTime(baseTime) }),
      productGroup('Speed', [...speedLines, ...extraSpeed])
    ]);
  const combustion = {
    name: 'Combustion',
    time: Math.ceil(combustionTime),
    timePast: (account?.refinery?.timePastCombustion ?? 0) + timePassed,
    breakdown: cycleBreakdown('Combustion', REFINERY_BASE_CYCLE_TIMES.combustion, combustionTime)
  };
  const synthesis = {
    name: 'Synthesis',
    time: Math.ceil(synthesisTime),
    timePast: (account?.refinery?.timePastSynthesis ?? 0) + timePassed,
    breakdown: cycleBreakdown('Synthesis', REFINERY_BASE_CYCLE_TIMES.synthesis, synthesisTime)
  }
  const polymerize = {
    name: 'Polymerize',
    time: Math.ceil(polymerizeTime),
    timePast: (account?.refinery?.timePastPolymerize ?? 0) + timePassed,
    breakdown: cycleBreakdown('Polymerize', REFINERY_BASE_CYCLE_TIMES.polymerize, polymerizeTime, [
      additiveGroup('Materials Science', [
        percent('Research', researchGridBonus),
        percent('Meal', mealBonus)
      ])
    ])
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
  // The game rounds the remaining cycles and clamps power to the cap, so a salt within half a
  // cycle of its cap never refines again: it waits for a manual rank up.
  const cyclesLeft = Math.max(0, Math.round((powerCap - refined) / Math.max(powerPerCycle, 1)));
  const timeLeft = cyclesLeft / cyclesPerDay * 24;
  const totalTime = ((powerCap - 0) / powerPerCycle) / cyclesPerDay * 24;
  return {
    timeLeft: new Date().getTime() + (timeLeft * 3600 * 1000),
    totalTime: new Date().getTime() + (totalTime * 3600 * 1000),
    ready: cyclesLeft === 0
  };
};

export const calcCost = (refinery: any, rank: number, quantity: number, item: string, index: number) => {
  const isSalt = item?.includes('Refinery');
  return Math.floor(Math.pow(rank, (isSalt && index <= refinery?.refinerySaltTaskLevel) ? 1.3 : 1.5)) * quantity;
};

// The game ceils cycle times (CycleInitialTime), and at high refinery speed that rounding is a
// meaningful slice of the cycle - round the same way so output and cost land on the game's rates.
// game: "CycleInitialTime"
const getSaltCycleTime = (index: number, cycleTimes: any) => Math.ceil(index <= 2
  ? cycleTimes?.combustionTime
  : index <= 5 ? cycleTimes?.synthesisTime : cycleTimes?.polymerizeTime);

// Largest rank whose per-cycle cost still fits in what the previous salt produces in that time.
const solveMaxRank = (allowedCostPerCycle: number, quantity: number, scaling: number) => {
  if (!(quantity > 0) || !(allowedCostPerCycle > 0)) return 0;
  // Tolerance for salts on different cycle lengths, where the allowance is still a float ratio.
  const allowed = allowedCostPerCycle + 1e-9;
  const costFor = (rank: number) => Math.floor(Math.pow(rank, scaling)) * quantity;
  let rank = Math.max(0, Math.floor(Math.pow(allowed / quantity, 1 / scaling)));
  while (costFor(rank + 1) <= allowed) rank++;
  while (rank > 0 && costFor(rank) > allowed) rank--;
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
  // Lower of the salt limit and every printer limit.
  maxSafeRank: number;
  saltMaxSafeRank: number;
  printerLimits: PrinterLimit[];
  limitedBy: { rawName: string; name: string; isPrinter: boolean } | null;
}

export interface PrinterLimit {
  rawName: string;
  name: string;
  printedPerHour: number;
  neededPerHour: number;
  maxRank: number;
}

// Printer samples are per-hour rates; only the slots currently printing count.
const getPrintedPerHour = (account: Account) => ((account as any)?.printer ?? []).reduce((res: Record<string, number>, slots: any[]) => {
  (slots ?? []).forEach(({ item, active, boostedValue }: any) => {
    if (!active || !item || item === 'Blank') return;
    res[item] = (res[item] ?? 0) + (boostedValue ?? 0);
  });
  return res;
}, {});

// Each salt is fuelled by the one before it in the chain, so ranking a salt up raises what it
// drains from its predecessor. Compares both sides per hour to find the rank where that flips.
// Printed inputs cap the rank the same way, but only for materials the printer is actually printing:
// a stockpiled material has no rate to compare against, and the fuel timer covers it.
export const getSaltsBalance = (account: Account, characters: any[], precomputedCycleTimes?: any): SaltBalance[] => {
  const salts: any[] = account?.refinery?.salts ?? [];
  const cycleTimes = precomputedCycleTimes ?? computeRefineryCycleTimes(account, characters);
  const maxUsefulRank = getMaxUsefulRank(account);
  const saltTaskLevel = account?.refinery?.refinerySaltTaskLevel ?? 0;
  const printedPerHour = getPrintedPerHour(account);

  return salts.reduce((res: SaltBalance[], salt: any, index: number) => {
    const { rawName, saltName, rank, cost, active, autoRefinePercentage, unlocked } = salt;
    const cycleTime = getSaltCycleTime(index, cycleTimes);
    const powerPerCycle = getPowerPerCycle(rank, account);
    const outputPerHour = unlocked && active ? powerPerCycle * 3600 / cycleTime : 0;

    const nextSalt = salts?.[index + 1];
    const nextSaltCost = nextSalt?.cost?.find((item: any) => item?.rawName === rawName);
    const consumedPerHour = unlocked && nextSalt?.unlocked && nextSalt?.active && nextSaltCost
      ? calcCost(account?.refinery, nextSalt?.rank, nextSaltCost?.quantity, nextSaltCost?.rawName, index + 1)
      * 3600 / getSaltCycleTime(index + 1, cycleTimes)
      : 0;

    const previous = res?.[index - 1];
    const previousCost = cost?.find((item: any) => item?.rawName === salts?.[index - 1]?.rawName);
    let saltMaxSafeRank = rank;
    if (unlocked) {
      // Per cycle, not via the per-hour rate: the round trip turns an exact 8 into 7.999... and
      // rejects a rank whose cost lands exactly on the previous salt's output.
      const allowedCostPerCycle = (previous?.outputPerHour ?? 0) > 0
        ? getPowerPerCycle(salts?.[index - 1]?.rank, account) * cycleTime / getSaltCycleTime(index - 1, cycleTimes)
        : 0;
      saltMaxSafeRank = previousCost
        ? Math.min(maxUsefulRank, solveMaxRank(allowedCostPerCycle,
          previousCost?.quantity, index <= saltTaskLevel ? 1.3 : 1.5))
        : maxUsefulRank;
    }

    const printerLimits: PrinterLimit[] = unlocked ? (cost ?? []).reduce((res: PrinterLimit[], item: any) => {
      const printed = printedPerHour[item?.rawName] ?? 0;
      if (item?.rawName?.includes('Refinery') || !(printed > 0)) return res;
      return [...res, {
        rawName: item?.rawName,
        name: item?.name,
        printedPerHour: printed,
        neededPerHour: calcCost(account?.refinery, rank, item?.quantity, item?.rawName, index) * 3600 / cycleTime,
        maxRank: Math.min(maxUsefulRank, solveMaxRank(printed * cycleTime / 3600, item?.quantity, 1.5))
      }];
    }, []) : [];

    const tightestPrinter = printerLimits.reduce((min: PrinterLimit | null, limit) =>
      !min || limit.maxRank < min.maxRank ? limit : min, null);
    const previousSalt = salts?.[index - 1];
    const maxSafeRank = tightestPrinter && tightestPrinter.maxRank < saltMaxSafeRank
      ? tightestPrinter.maxRank
      : saltMaxSafeRank;
    const limitedBy = tightestPrinter && tightestPrinter.maxRank < saltMaxSafeRank
      ? { rawName: tightestPrinter.rawName, name: tightestPrinter.name, isPrinter: true }
      : previousCost
        ? { rawName: previousSalt?.rawName, name: previousSalt?.saltName, isPrinter: false }
        : null;

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
      maxSafeRank,
      saltMaxSafeRank,
      printerLimits,
      limitedBy
    }];
  }, []);
}

export const calcResourceToRankUp = (rank: number, refined: number, powerCap: number, itemCost: number, account: Account | null = null) => {
  const powerPerCycle = getPowerPerCycle(rank, account);
  const remainingProgress = powerCap - refined;
  return (remainingProgress / powerPerCycle) * itemCost;
}


export interface SaltMatTimeLeft {
  rawName: string;
  hoursLeft: number;
}

export interface SaltMatsTimeLeft {
  rawName: string;
  hoursLeft: number;
  mats: SaltMatTimeLeft[];
}

// How long each running salt can keep cycling before one of its inputs runs dry. A material fed by
// another salt only drains by the difference between the two rates, the same per-hour model
// getSaltsBalance compares with; printed materials have no continuous income, so their stock is
// treated as fixed until the player collects the printer again.
export const getSaltMatsTimeLeft = (account: Account, characters: any[], precomputedCycleTimes?: any): SaltMatsTimeLeft[] => {
  const salts: any[] = account?.refinery?.salts ?? [];
  const cycleTimes = precomputedCycleTimes ?? computeRefineryCycleTimes(account, characters);

  return salts.reduce((res: SaltMatsTimeLeft[], salt: any, index: number) => {
    const { rawName, rank, cost, active, unlocked } = salt;
    // An idle salt consumes nothing, so it has no depletion time at all.
    if (!unlocked || !active) return res;
    const cycleTime = getSaltCycleTime(index, cycleTimes);
    if (!(cycleTime > 0)) return res;

    const mats = (cost ?? []).map((item: any) => {
      const totalAmount = item?.totalAmount ?? 0;
      const drainPerHour = calcCost(account?.refinery, rank, item?.quantity, item?.rawName, index) * 3600 / cycleTime;
      const producerIndex = salts.findIndex((producer: any) => producer?.rawName === item?.rawName);
      const producer = producerIndex >= 0 ? salts[producerIndex] : null;
      // A salt outputs `powerPerCycle` of its own item each cycle, which is the unit the next salt's
      // cost is priced in.
      const incomePerHour = producer?.unlocked && producer?.active
        ? getPowerPerCycle(producer?.rank, account) * 3600 / getSaltCycleTime(producerIndex, cycleTimes)
        : 0;
      const netPerHour = drainPerHour - incomePerHour;
      return {
        rawName: item?.rawName,
        hoursLeft: netPerHour > 0 ? totalAmount / netPerHour : Infinity
      };
    });

    const hoursLeft = mats.length > 0 ? Math.min(...mats.map(({ hoursLeft }: SaltMatTimeLeft) => hoursLeft)) : Infinity;
    // Nothing is depleting - income covers every input - so there is no countdown to show.
    if (!isFinite(hoursLeft)) return res;

    return [...res, { rawName, hoursLeft, mats }];
  }, []);
};
