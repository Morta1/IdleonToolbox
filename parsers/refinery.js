import { growth, tryToParse } from '@utility/helpers';
import { classFamilyBonuses, items, randomList, refinery } from '../data/website-data';
import { calculateItemTotalAmount } from './items';
import { getPostOfficeBonus } from '@parsers/postoffice';
import { getVialsBonusByEffect } from '@parsers/alchemy';
import { getStampsBonusByEffect } from '@parsers/stamps';
import { getShinyBonus } from '@parsers/breeding';
import { isRiftBonusUnlocked } from '@parsers/world-4/rift';
import { constructionMasteryThresholds } from '@parsers/construction';
import { getArcadeBonus } from '@parsers/arcade';
import { checkCharClass, CLASSES, getHighestTalentByClass } from '@parsers/talents';
import { getFamilyBonusBonus } from '@parsers/family';
import { getVoteBonus } from '@parsers/world-2/voteBallot';

export const getRefinery = (idleonData, storage, tasks) => {
  const refineryRaw = tryToParse(idleonData?.Refinery) || idleonData?.Refinery;
  return parseRefinery(refineryRaw, storage, tasks);
}

const parseRefinery = (refineryRaw, storage, tasks) => {
  const refineryStorageRaw = refineryRaw?.[1];
  const refineryStorageQuantityRaw = refineryRaw?.[2];
  const refineryStorage = refineryStorageRaw?.reduce((res, saltName, index) => saltName !== 'Blank' ? [...res, {
    rawName: saltName,
    name: items[saltName]?.displayName,
    amount: refineryStorageQuantityRaw?.[index],
    owner: 'refinery'
  }] : res, []);
  const combinedStorage = [...storage, ...(refineryStorage || [])];
  const refinerySaltTaskLevel = tasks?.[2]?.[2]?.[6];
  const salts = refineryRaw?.slice(3, 3 + refineryRaw?.[0]?.[0]);
  const saltsArray = salts?.reduce((res, salt, index) => {
    const name = `Refinery${index + 1}`
    const [refined, rank, , active, autoRefinePercentage] = salt;
    const { saltName, cost } = refinery?.[name] || {};
    const componentsWithTotalAmount = cost?.map((item) => {
      let amount = calculateItemTotalAmount(combinedStorage, item?.name, true);
      return {
        ...item,
        totalAmount: amount
      }
    })
    return [
      ...res,
      {
        saltName,
        cost: componentsWithTotalAmount,
        rawName: name,
        powerCap: getPowerCap(rank),
        refined,
        rank,
        active,
        autoRefinePercentage
      }
    ];
  }, []);

  return {
    salts: saltsArray,
    refinerySaltTaskLevel,
    timePastCombustion: refineryRaw?.[0]?.[1],
    timePastSynthesis: refineryRaw?.[0]?.[2],
    totalLevels: saltsArray?.reduce((sum, { rank }) => sum + rank, 0),
    refineryStorage
  }
}

export const getPowerCap = (rank) => {
  const powerCap = randomList[18]?.split(' ');
  return parseFloat(Math.max(powerCap?.[Math.min(rank, powerCap?.length - 2)], 25))
}

export const hasMissingMats = (saltIndex, rank, cost, account) => {
  return cost?.filter(({
                         rawName,
                         quantity,
                         totalAmount
                       }) => totalAmount < Math.floor(Math.pow(rank, (rawName?.includes('Refinery') &&
    saltIndex <= account?.refinery?.refinerySaltTaskLevel) ? 1.3 : 1.5)) * quantity)
}

export const getRefineryCycleBonuses = (account, characters) => {
  const { alchemy, saltLick, charactersLevels, breeding, rift, towers } = account;
  const vials = alchemy?.vials;
  const redMaltVial = getVialsBonusByEffect(vials, 'Refinery_Cycle_Speed');
  const saltLickUpgrade = saltLick?.[2] ? (saltLick?.[2]?.baseBonus * saltLick?.[2]?.level) : 0;
  const sigilRefinerySpeed = alchemy?.p2w?.sigils?.find((sigil) => sigil?.name === 'PIPE_GAUGE')?.bonus || 0;
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
  const divineKnightsLevels = charactersLevels?.filter((character) =>
    checkCharClass(character?.class, CLASSES.Divine_Knight))?.map(({ level }) => level);
  const highestLevelDivineKnight = divineKnightsLevels?.length > 0 ? Math.max(...divineKnightsLevels) : 0;
  const theFamilyGuy = getHighestTalentByClass(characters, CLASSES.Divine_Knight, 'THE_FAMILY_GUY')
  const familyRefinerySpeed = getFamilyBonusBonus(classFamilyBonuses, 'Refinery_Speed', highestLevelDivineKnight);
  const amplifiedFamilyBonus = (familyRefinerySpeed * (theFamilyGuy > 0 ? (1 + theFamilyGuy / 100) : 1) || 0)
  const voteBonus = getVoteBonus(account, 33);

  const bonusBreakdown = [
    { name: 'Vials', value: redMaltVial / 100 },
    { name: 'Salt lick', value: saltLickUpgrade / 100 },
    { name: 'Family', value: amplifiedFamilyBonus / 100 },
    { name: 'Sigils', value: sigilRefinerySpeed / 100 },
    { name: 'Stamps', value: stampRefinerySpeed / 100 },
    { name: 'Shinies', value: shinyRefineryBonus / 100 },
    { name: 'Const mastery', value: constructionMastery / 100 },
    { name: 'Arcade', value: arcadeBonus / 100 },
    { name: 'Vote', value: voteBonus / 100 }
  ]
  return {
    bonusBreakdown,
    bonus: redMaltVial + saltLickUpgrade + amplifiedFamilyBonus
      + sigilRefinerySpeed + stampRefinerySpeed + shinyRefineryBonus + constructionMastery + arcadeBonus + voteBonus
  }
}
export const getRefineryCycles = (account, characters, lastUpdated) => {
  const {
    bonusBreakdown,
    bonus
  } = getRefineryCycleBonuses(account, characters, lastUpdated);
  const labCycleBonus = account?.lab?.labBonuses?.find((bonus) => bonus.name === 'Gilded_Cyclical_Tubing')?.active
    ? 3
    : 1;
  const squires = characters?.filter((character) => checkCharClass(character?.class, CLASSES.Squire) || checkCharClass(character?.class, CLASSES.Divine_Knight));
  const squiresDataTemp = squires.reduce((res, character) => {
    const { name, talents, cooldowns, postOffice, afkTime } = character;
    const cooldownBonus = getPostOfficeBonus(postOffice, 'Magician_Starterpack', 2);
    const cdReduction = Math.max(0, cooldownBonus);
    const refineryThrottle = talents?.[2]?.orderedTalents.find((talent) => talent?.name === 'REFINERY_THROTTLE');
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
    { name: 'Lab', value: labCycleBonus }
  ];
  const combustion = {
    name: 'Combustion',
    time: Math.ceil(900 / ((1 + bonus / 100) * labCycleBonus)),
    timePast: account?.refinery?.timePastCombustion + timePassed,
    breakdown: [{ title: 'Additive' }, { name: '' }, { name: 'Base', value: 900 * Math.pow(4, 0) }, ...breakdown]
  };
  const synthesis = {
    name: 'Synthesis',
    time: Math.ceil(3600 / ((1 + bonus / 100) * labCycleBonus)),
    timePast: account?.refinery?.timePastSynthesis + timePassed,
    breakdown: [{ title: 'Additive' }, { name: '' }, { name: 'Base', value: 900 * Math.pow(4, 1) }, ...breakdown]
  }
  return {
    ...squiresDataTemp,
    cycles: [combustion, synthesis]
  };
}

export const calcTimeToRankUp = (account, characters, lastUpdated, refineryData, includeSquireCycles, rank, powerCap, refined, index) => {
  const { bonus } = getRefineryCycleBonuses(account, characters, lastUpdated);
  const labCycleBonus = account?.lab?.labBonuses?.find((bonus) => bonus.name === 'Gilded_Cyclical_Tubing')?.active
    ? 3
    : 1;
  const powerPerCycle = Math.floor(Math.pow(rank, 1.3));
  const cycleByType = index <= 2 ? 900 : 3600;
  const combustionCyclesPerDay = (24 * 60 * 60 / (cycleByType / (1 + (bonus) / 100))) + (includeSquireCycles
    ? (refineryData?.squiresCycles ?? 0)
    : 0);
  const timeLeft = Math.floor((powerCap - refined) / powerPerCycle) / combustionCyclesPerDay * 24 / (labCycleBonus);
  const totalTime = ((powerCap - 0) / powerPerCycle) / combustionCyclesPerDay * 24 / (labCycleBonus);
  return {
    timeLeft: new Date().getTime() + (timeLeft * 3600 * 1000),
    totalTime: new Date().getTime() + (totalTime * 3600 * 1000)
  };
};

export const calcCost = (refinery, rank, quantity, item, index) => {
  const isSalt = item?.includes('Refinery');
  return Math.floor(Math.pow(rank, (isSalt && index <= refinery?.refinerySaltTaskLevel) ? 1.3 : 1.5)) * quantity;
};

export const calcResourceToRankUp = (rank, refined, powerCap, itemCost) => {
  const powerPerCycle = Math.floor(Math.pow(rank, 1.3));
  const remainingProgress = powerCap - refined;
  return (remainingProgress / powerPerCycle) * itemCost;
}

