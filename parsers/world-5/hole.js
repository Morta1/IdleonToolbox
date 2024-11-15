import { commaNotation, lavaLog, notateNumber, tryToParse } from '@utility/helpers';
import { cosmoUpgrades, gods, holesBuildings, holesInfo, lampWishes } from '../../data/website-data';
import { getBucketBonus, getTheWell } from '@parsers/world-5/caverns/the-well';
import { getMotherlode } from '@parsers/world-5/caverns/motherlode';
import { getTheDen } from '@parsers/world-5/caverns/the-den';
import { getBravery, getMonumentBonus } from '@parsers/world-5/caverns/bravery';
import { getBellBonus, getTheBell } from '@parsers/world-5/caverns/the-bell';
import { getTheHarp } from '@parsers/world-5/caverns/the-harp';
import { getLamp } from '@parsers/world-5/caverns/the-lamp';
import { getHive } from '@parsers/world-5/caverns/the-hive';
import { getGrotto } from '@parsers/world-5/caverns/grotto';
import { isBundlePurchased, isCompanionBonusActive } from '@parsers/misc';
import { getCardBonusByEffect } from '@parsers/cards';
import { getWinnerBonus } from '@parsers/world-6/summoning';

export const getHole = (idleonData, accountData) => {
  const holeRaw = tryToParse(idleonData?.Holes) || idleonData?.Holes;
  return parseHole(holeRaw, accountData);
}

const parseHole = (holeRaw, accountData) => {
  const [
    charactersCavernLocation = [], // 0
    villagersLevels = [], // 1
    villagersExp = [], // 2
    opalsInvested = [], // 3
    holeMajiks = [], // 4
    villageMajiks = [], // 5
    idleonMajiks = [], // 6
    opalsPerCavern = [], // 7
    sedimentMulti = [], // 8
    wellSediment = [], // 9
    wellBuckets = [], // 10
    extraCalculations = [], // 11
    dawgDenAmplifierLevels = [], // 12
    engineerSchematics = [], // 13
    braveryMonument = [], // 14
    braveryBonuses = [], // 15
    bellImprovementMethods = [], // 16
    bellRingLevels = [], // 17
    bellRelated = [],  // 18
    harpRelated = [], // 19
    ,// 20
    wishesUsed = [], // 21
    measurementBuffLevels = [], // 22
    unlockedWishes = [] // 23
  ] = holeRaw || [];
  const holesObject = {
    charactersCavernLocation,
    villagersLevels,
    villagersExp,
    opalsInvested,
    holeMajiks,
    villageMajiks,
    idleonMajiks,
    opalsPerCavern,
    sedimentMulti,
    wellSediment,
    wellBuckets,
    extraCalculations,
    dawgDenAmplifierLevels,
    engineerSchematics,
    braveryMonument,
    braveryBonuses,
    bellImprovementMethods,
    bellRingLevels,
    bellRelated,
    harpRelated,
    wishesUsed,
    measurementBuffLevels,
    unlockedWishes
  }

  const lampWishesList = lampWishes.map((wish, index) => {
    return {
      ...wish,
      level: wishesUsed?.[index]
    }
  })

  const engineerIndexes = holesInfo?.[40]?.split(' ');
  const engineerBonuses = engineerIndexes?.map((index, order) => {
    const upgrade = holesBuildings?.[index];
    const owned = wellSediment?.[upgrade?.x2];
    return {
      ...upgrade,
      unlocked: engineerSchematics?.[index],
      index,
      owned: isNaN(owned) ? 0 : owned,
      cost: getEngineerUpgradeCost({ ...upgrade, index: order, discountWish: lampWishesList?.[5]?.level })
    }
  });

  const villagers = villagersExp?.map((exp, index) => {
    const level = villagersLevels?.[index];
    const expReq = getVillagerExpReq(level, index);
    const opalInvested = opalsInvested?.[index];
    const expRate = getVillagerExpPerHour(holesObject, accountData, index)
    return {
      exp: exp < 1e6 ? commaNotation(exp) : notateNumber(exp, 'Big'),
      expReq: expReq < 1e6 ? commaNotation(expReq) : notateNumber(expReq, 'Big'),
      level,
      opalInvested,
      expRate
    }
  });
  const unlockedCaverns = Math.min(10, villagersLevels?.[0]);

  const theWell = getTheWell(holesObject, accountData);
  const motherlode = getMotherlode(holesObject);
  const theDen = getTheDen(holesObject);
  const bravery = getBravery(holesObject);
  const theBell = getTheBell(holesObject, accountData);
  const theHarp = getTheHarp(holesObject, accountData);
  const theLamp = getLamp(holesObject, accountData, unlockedCaverns);
  const theHive = getHive(holesObject);
  const grotto = getGrotto(holesObject);

  const majiksRaw = [holeMajiks, villageMajiks, idleonMajiks];
  let godsLinks = [];
  const majiks = cosmoUpgrades.map((majik, majikIndex) => {
    return majik.map((bonusRaw, bonusIndex) => {
      let hasDoot;
      if (isCompanionBonusActive(accountData, 0)) {
        hasDoot = true;
      } else {
        if (majikIndex === 2 && bonusIndex === 0) {
          if (extraCalculations?.[29] !== -1) {
            godsLinks.push({ index: extraCalculations?.[29], name: gods?.[extraCalculations?.[29]]?.name })
          }
          if (extraCalculations?.[30] !== -1) {
            godsLinks.push({ index: extraCalculations?.[30], name: gods?.[extraCalculations?.[30]]?.name })
          }
        }

      }
      return {
        ...bonusRaw,
        level: majiksRaw?.[majikIndex]?.[bonusIndex],
        bonus: getCosmoBonus({ majik: majiksRaw?.[majikIndex], t: majikIndex, i: bonusIndex }),
        godsLinks,
        hasDoot
      }
    })
  })
  const cosmoSchematics = getCosSchematic(holesObject);
  const measurements = holesInfo?.[54]?.split(' ').map((description, index) => {
    const bonus = getMeasurementBonus({ holesObject, accountData, t: index })
    const multi = getMeasurementMulti({ holesObject, accountData, t: Number(holesInfo[52][index]) })
    return { description, bonus, multi, level: holesObject?.measurementBuffLevels[index] };
  });
  return {
    villagers,
    unlockedCaverns,
    charactersCavernLocation,
    engineerBonuses,
    unlockedSchematics: Math.min(Math.min(56,
      Math.round(1 + 3 * villagers?.[1]?.level + Math.floor(villagers?.[1]?.level / 5))), holesBuildings?.length),
    caverns: {
      theWell,
      motherlode,
      theDen,
      bravery,
      theBell,
      theHarp,
      theLamp,
      theHive,
      grotto
    },
    holesObject,
    majiks,
    cosmoSchematics,
    godsLinks,
    measurements
  }
}


export const getCosSchematic = (holesObject) => {
  let result = 0;

  const schematics = holesObject?.engineerSchematics;
  for (let index = 0; index < schematics.length; index++) {
    if (schematics[index] === 1) {
      result = Math.round(result + 1);
    }
  }
  return result;
}

export const getCosmoBonus = ({ majik, t, i }) => {
  return 2 === t && 1 === i
    ? Math.floor(Math.max(1, Math.pow(3, (majik[i]))))
    : Math.floor((cosmoUpgrades[t][i]?.x0)
      * (majik[i]))
}

const getMeasurementBaseBonus = ({ holesObject, t }) => {
  const info = holesInfo[55].split(' ');
  return -1 !== info[t].indexOf('TOT')
    ? (1 + getCosmoBonus({ majik: holesObject?.villageMajiks, t: 1, i: 3 }) / 100)
    * ((info[t].replace('TOT', '')
      * holesObject?.measurementBuffLevels[t]) / (100 + holesObject?.measurementBuffLevels[t]))
    : (1 + getCosmoBonus({
    majik: holesObject?.villageMajiks,
    t: 1,
    i: 3
  }) / 100) * info[t] * holesObject?.measurementBuffLevels[t];
}

const getMeasurementMulti = ({ holesObject, accountData, t }) => {
  const formula = getMeasurementQuantityFound({ holesObject, accountData, t, i: 99 });
  return 5 > formula
    ? 1 + (18 * formula) / 100
    : 1 + (18 * formula + 8 * (formula - 5)) / 100;
}
const getMeasurementQuantityFound = ({ holesObject, accountData, t, i }) => {
  let result;
  switch (t) {
    case 0:
      // Case 0: Extra Calculations
      const extraCalcValue = holesObject?.extraCalculations?.[28];
      result = (i === 99) ? lavaLog(extraCalcValue) : extraCalcValue;
      break;
    case 1:
      result = (i === 99) ? accountData?.farming?.cropsFound / 14 : accountData?.farming?.cropsFound;
      break;
    case 2:
      // Case 2: Tome Quantity Check
      const tomeQuantity = accountData?.tome?.tome?.[5]?.quantity;
      result = (i === 99) ? tomeQuantity / 500 : tomeQuantity;
      break;
    case 3:
      const points = accountData?.tome?.totalPoints;
      result = (i === 99) ? points / 2500 : points;
      break;
    case 4:
      let tomeQuantityAdditional = accountData?.tome?.tome?.[12]?.quantity;
      result = (i === 99)
        ? tomeQuantityAdditional / 5e3 + Math.max(0, tomeQuantityAdditional - 18e3) / 1500
        : tomeQuantityAdditional;
      break;
    case 5:
      // Case 5: Direct Zero Result
      result = 0;
      break;
    case 6:
      // Case 6: Overkill Quantity Summation
      let overkillSum = Object.values(accountData?.deathNote || {})?.reduce((sum, { rank }) => sum + rank, 0);
      result = (i === 99) ? overkillSum / 125 : overkillSum;
      break;

    case 7:
      // Case 7: Tasks Calculation
      let tasksValue = accountData?.tasks?.[0]?.[1]?.[0]
      result = (i === 99) ? lavaLog(tasksValue) / 2 : tasksValue;
      break;

    case 8:
      // Case 8: Cards Length
      let cardsLength = accountData?.looty?.lootedItems;
      result = (i === 99) ? cardsLength / 150 : cardsLength;
      break;

    default:
      // Default case: Zero Result
      result = 0;
      break;
  }

  return result;
}

// MeasurementBonusTOTAL
export const getMeasurementBonus = ({ holesObject, accountData, t }) => {
  const base = getMeasurementBaseBonus({ holesObject, t });
  const multi = getMeasurementMulti({ holesObject, accountData, t: Number(holesInfo[52][t]) });
  return base * multi;
}


const getEngineerUpgradeCost = ({ x2, x3, x4, index, discountWish }) => {
  return 1 === x4
    ? Math.max(0.01, Math.pow(0.85, discountWish)) * x3
    : 10 > x2
      ? 50 * Math.max(0.01, Math.pow(0.85, discountWish)) * Math.pow(1.28, index + Math.floor(index / 2.7))
      : 50 * Math.max(0.01, Math.pow(0.85, discountWish)) * Math.pow(1.28, index - 16 + Math.floor((index - 16) / 2.7))
      * Math.pow(1.23, Math.min(Math.max(0, (index - 16) / 2), 14));
}
const getVillagerExpPerHour = (holesObject, accountData, t) => {
  const hasBundle = isBundlePurchased(accountData?.bundles, 'bun_u');
  const cardBonus = getCardBonusByEffect(accountData?.cards, 'Villager_EXP_(Passive)');
  return (100 + getBucketBonus({ ...holesObject, t: 0, i: 25 }))
    * Math.max(1, 1 + (50 * (hasBundle ? 1 : 0)) / 100)
    * (holesObject?.opalsInvested[t])
    * (1 + (holesObject?.unlockedWishes[t]))
    * (1 + (getMonumentBonus({ holesObject, t: 0, i: 3 })
      + (getMonumentBonus({ holesObject, t: 1, i: 3 })
        + (getMeasurementBonus({ holesObject, accountData, t: 7 })
          + (Math.floor((holesObject?.opalsInvested[t]) / 10)
            * getCosmoBonus({ majik: holesObject?.villageMajiks, t: 1, i: 0 })
            + (getCosmoBonus({ majik: holesObject?.villageMajiks, t: 1, i: 1 })
              * getCosSchematic(holesObject)
              + (getCosmoBonus({ majik: holesObject?.villageMajiks, t: 1, i: 2 })
                + (getBucketBonus({ ...holesObject, t: 48, i: 0 })
                  + (cardBonus
                    + (getBellBonus({ holesObject, t: 1 })
                      + getMeasurementBonus({ holesObject, accountData, t: 0 })
                      + getWinnerBonus(accountData, 'Villager EXP')))))))))) / 100);
}
const getVillagerExpReq = (level, index) => {
  return 1 === level && 0 === index ? 5 : 0 === index
    ? 10 * ((10 + 7 * Math.pow(level, 2.1)) * Math.pow(2.1, level) * (1 + 0.75 * Math.max(0, level - 4)) - 1.5)
    : 1 === index
      ? 30 * (10 + 6 * Math.pow(level, 1.8)) * Math.pow(1.57, level)
      : 2 === index
        ? 50 * (10 + 5 * Math.pow(level, 1.7)) * Math.pow(1.4, level)
        : 3 === index
          ? 120 * (30 + 10 * Math.pow(level, 2)) * Math.pow(2, level)
          : 10 * Math.pow(10, 20);
}

export const cavernNames = [
  'The well',
  'Motherlode',
  'The den',
  'Bravery',
  'The bell',
  'The harp',
  'The Lamp',
  'The hive',
  'Grotto',
  'Justice'
]