import { commaNotation, lavaLog, notateNumber, numberWithCommas, tryToParse } from '@utility/helpers';
import { cosmoUpgrades, gods, holesBuildings, holesInfo, lampWishes } from '../../data/website-data';
import { getSchematicBonus, getTheWell } from '@parsers/world-5/caverns/the-well';
import { getMotherlode } from '@parsers/world-5/caverns/motherlode';
import { getTheDen } from '@parsers/world-5/caverns/the-den';
import { getBravery, getMonumentBonus } from '@parsers/world-5/caverns/bravery';
import { getBellBonus, getTheBell } from '@parsers/world-5/caverns/the-bell';
import { getStringSlots, getTheHarp } from '@parsers/world-5/caverns/the-harp';
import { getLamp } from '@parsers/world-5/caverns/the-lamp';
import { getHive } from '@parsers/world-5/caverns/the-hive';
import { getGrotto } from '@parsers/world-5/caverns/grotto';
import { getEventShopBonus, isBundlePurchased, isCompanionBonusActive } from '@parsers/misc';
import { getCardBonusByEffect } from '@parsers/cards';
import { getWinnerBonus } from '@parsers/world-6/summoning';
import { getJustice } from '@parsers/world-5/caverns/justice';
import { getGrimoireBonus } from '@parsers/grimoire';
import { getArcadeBonus } from '@parsers/arcade';
import { getJarBonus, getNewCollectibleChance, getTheJars } from '@parsers/world-5/caverns/the-jars';
import { getEvertree } from '@parsers/world-5/caverns/evertree';
import { getWisdom } from '@parsers/world-5/caverns/wisdom';
import { getGambit } from '@parsers/world-5/caverns/gambit';
import { getTheTemple } from '@parsers/world-5/caverns/the-temple';
import { getStampsBonusByEffect } from '@parsers/stamps';
import { getStatueBonus } from '@parsers/statues';
import { getCompassBonus } from '@parsers/compass';
import { getCharmBonus } from '@parsers/world-6/sneaking';
import { getTesseractBonus } from '@parsers/tesseract';

const VILLAGERS = {
  EXPLORE: 0,
  ENGINEER: 1,
  BONUSES: 2,
  MEASURE: 3,
  STUDIES: 4
}

export const getHole = (idleonData, accountData) => {
  const holeRaw = tryToParse(idleonData?.Holes) || idleonData?.Holes;
  const jarsRaw = tryToParse(idleonData?.Jars) || idleonData?.Jars;
  return parseHole(holeRaw, jarsRaw, accountData);
}

const parseHole = (holeRaw, jarsRaw, accountData) => {
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
    parallelVillagersGemShop = [], // 23
    jarStuff, // 24,
    jarProgress, // 25
    studyStuff, // 26
    studyProgress, // 27
    gambitStuff // 28
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
    parallelVillagersGemShop,
    jarStuff,
    jarProgress,
    studyStuff,
    studyProgress,
    gambitStuff
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
    const { description, value: totalBonus } = getEngineerTotalBonus(upgrade, holesObject, Number(index));

    return {
      ...upgrade,
      unlocked: engineerSchematics?.[index],
      index,
      description,
      totalBonus,
      owned: isNaN(owned) ? 0 : owned,
      cost: getEngineerUpgradeCost({ ...upgrade, index: order, discountWish: lampWishesList?.[5]?.level })
    }
  });

  const unlockedCaverns = Math.min(15, villagersLevels?.[0]);
  const unlockedVillagers = villagersLevels?.slice(0, 5)?.filter((level) => level >= 1)?.length;
  const leastOpalInvestedVillager = Math.min(...opalsInvested?.slice(0, unlockedVillagers));
  const villagers = villagersExp?.slice(0, 5).map((exp, index) => {
    const level = villagersLevels?.[index];
    const expReq = getVillagerExpReq(level, index);
    const opalInvested = opalsInvested?.[index];
    const expRate = getVillagerExpPerHour(holesObject, accountData, index, leastOpalInvestedVillager, unlockedCaverns)
    const timeLeft = (expReq - exp) / expRate?.value * 1000 * 3600;
    return {
      index,
      name: Object.keys(VILLAGERS)?.[index].toLowerCase().camelToTitleCase(),
      exp: exp < 1e6 ? commaNotation(exp) : notateNumber(exp, 'Big'),
      expReq: expReq < 1e6 ? commaNotation(expReq) : notateNumber(expReq, 'Big'),
      readyToLevel: exp >= expReq,
      level,
      opalInvested,
      expRate,
      timeLeft
    }
  });

  const studies = getStudies(holesObject, villagers?.[VILLAGERS.STUDIES]?.level, accountData);

  const theWell = getTheWell(holesObject, accountData);
  const motherlode = getMotherlode(holesObject);
  const theDen = getTheDen(holesObject);
  const bravery = getBravery(holesObject, accountData);
  const theBell = getTheBell(holesObject, accountData);
  const theHarp = getTheHarp(holesObject, accountData);
  const theLamp = getLamp(holesObject, accountData, unlockedCaverns);
  const theHive = getHive(holesObject);
  const grotto = getGrotto(holesObject);
  const justice = getJustice(holesObject, accountData);
  const theJars = getTheJars(holesObject, jarsRaw, accountData);
  const evertree = getEvertree(holesObject);
  const wisdom = getWisdom(holesObject, accountData);
  const gambit = getGambit(holesObject, accountData);
  const theTemple = getTheTemple(holesObject);

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
      const maxLevel = Number(holesInfo?.[56 + majikIndex]?.[bonusIndex]) + 1;
      return {
        ...bonusRaw,
        level: majiksRaw?.[majikIndex]?.[bonusIndex],
        maxLevel,
        bonus: getCosmoBonus({ majik: majiksRaw?.[majikIndex], t: majikIndex, i: bonusIndex }),
        godsLinks,
        hasDoot
      }
    })
  })
  const cosmoSchematics = getCosSchematic(holesObject);
  const sediments = [0, 2, 5, 7, 9];
  const notes = [1, 3, 4, 6, 8];
  const rupies = [10, 11, 12, 13, 14, 15];
  const measureIndexes = holesInfo[52]?.split(' ');
  const measurements = holesInfo?.[54]?.split(' ').map((description, index) => {
    const measureIndex = Number(measureIndexes[index]);
    const baseBonus = getMeasurementBaseBonus({ holesObject, t: index });
    const totalBonus = getMeasurementBonus({ holesObject, accountData, t: index });
    const multi = getMeasurementMulti({ holesObject, accountData, t: measureIndex })
    const cost = (250 + 50 * measurementBuffLevels[index]) * Math.pow(1.6, index - 6 * Math.floor(index / 10)) * Math.pow(1.1, measurementBuffLevels[index])

    const measuredBy = getMeasurementQuantity({ holesObject, accountData, t: measureIndex });
    const itemReqIndex = holesInfo[50]?.split(' ')[index];
    const owned = Math.max(0, wellSediment?.[itemReqIndex] ?? 0);
    let icon;
    if (sediments.includes(index)) {
      icon = 'HoleWellFill' + (Number(itemReqIndex) + 1);
    } else if (notes.includes(index)) {
      icon = 'HoleHarpNote' + (Number(itemReqIndex) - 10);
    } else if (rupies.includes(index)) {
      icon = 'HoleJarR' + (Number(itemReqIndex) - 20);
    }
    return {
      description,
      baseBonus,
      totalBonus,
      multi,
      level: holesObject?.measurementBuffLevels[index],
      cost,
      owned,
      icon,
      measuredBy,
      measureIndex
    };
  });
  const totalResources = wellSediment?.reduce((sum, amount) => sum + Math.ceil(lavaLog(amount)), 0);
  const totalLayerResources = extraCalculations ? [1, 3, 5, 7].reduce((sum, index) =>
    sum + Math.round(Math.max(0, extraCalculations[index] || 0)), 0) : 0;
  const totalVillagersLevels = villagersLevels?.reduce((sum, amount) => sum + amount, 0);
  const totalOpalsFound = opalsPerCavern?.reduce((sum, amount) => sum + amount, 0);

  return {
    villagers,
    unlockedCaverns,
    charactersCavernLocation,
    engineerBonuses,
    unlockedSchematics: Math.min(Math.min(93,
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
      grotto,
      justice,
      theJars,
      evertree,
      wisdom,
      gambit,
      theTemple
    },
    totalResources,
    totalLayerResources,
    totalOpalsFound,
    totalVillagersLevels,
    holesObject,
    majiks,
    cosmoSchematics,
    godsLinks,
    measurements,
    studies,
    leastOpalInvestedVillager
  }
}

export const getEngineerTotalBonus = (upgrade, holesObject, index) => {
  let formattedDescription = upgrade?.description;
  let value = 0;

  switch (index) {
    case 14:
      value = getSchematicBonus({ holesObject, t: index, i: 0 });
      formattedDescription = formattedDescription.replace('{', notateNumber(value, 'Big'));
      break;

    case 15:
      value = Math.pow(1.1, Number(holesObject?.extraCalculations?.[1]));
      formattedDescription = formattedDescription.replace('{', notateNumber(value, 'Small'));
      break;

    case 38:
      value = getStringSlots(holesObject);
      const percent38 = Math.round(30 * value);
      formattedDescription = formattedDescription.replace('$', String(value))
        .replace('#', String(percent38));
      break;

    case 41:
      value = Math.pow(1.1, Number(holesObject?.extraCalculations?.[3]));
      formattedDescription = formattedDescription.replace('{', notateNumber(value, 'Small'));
      break;

    case 45:
      value = getSchematicBonus({ holesObject, t: index, i: 0 });
      formattedDescription = formattedDescription.replace('}', notateNumber(value, value < 1000 ? 'Small' : 'Big'));
      break;

    case 46:
    case 47:
    case 48:
    case 52:
    case 55:
    case 57:
      value = getSchematicBonus({ holesObject, t: index, i: 0 });
      formattedDescription = formattedDescription.replace('{', notateNumber(value, 'Big'));
      break;

    case 53:
    case 54:
    case 56:
    case 80:
      value = getSchematicBonus({ holesObject, t: index, i: 0 });
      formattedDescription = formattedDescription.replace('{', notateNumber(value, 'Small'));
      break;

    case 58:
      value = getSchematicBonus({ holesObject, t: index, i: 0 });
      formattedDescription = formattedDescription.replace('{', notateNumber(value, 'Big'))
        .replace('#', notateNumber(holesObject?.extraCalculations?.[32], 'Big'));
      break;

    case 59:
      value = getSchematicBonus({ holesObject, t: index, i: 0 });
      formattedDescription = formattedDescription.replace('{', notateNumber(value, 'Big'))
        .replace('!', numberWithCommas(Number(holesObject?.extraCalculations?.[33])))
        .replace('#', numberWithCommas(Number(holesObject?.extraCalculations?.[34])))
        .replace('$', numberWithCommas(Number(holesObject?.extraCalculations?.[35])))
        .replace('%', numberWithCommas(Number(holesObject?.extraCalculations?.[36])));
      break;

    case 72:
      value = 10 * lavaLog(Number(holesObject?.extraCalculations?.[38]));
      formattedDescription = formattedDescription.replace('{', notateNumber(value, 'Small'));
      break;

    case 73:
      value = Math.pow(1.1, lavaLog(Number(holesObject?.extraCalculations?.[39])));
      formattedDescription = formattedDescription.replace('{', notateNumber(value, 'Small'));
      break;

    case 76:
      value = Math.pow(1.02, getNewCollectibleChance(holesObject));
      formattedDescription = formattedDescription.replace('{', notateNumber(value, 'Small'));
      break;

    case 82:
    case 83:
    case 84:
      const paramIndex = index === 82 ? 20 : index === 83 ? 40 : 100;
      value = getSchematicBonus({ holesObject, t: index, i: paramIndex });
      formattedDescription = formattedDescription.replace('{', notateNumber(value, 'Small'));
      break;

    default:
      // No change
      break;
  }

  return { description: formattedDescription, value };
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
    ? Math.floor(Math.max(1, Math.pow(3, (majik?.[i]))))
    : Math.floor((cosmoUpgrades?.[t]?.[i]?.x0)
      * (majik?.[i]))
}
const getMeasurementBaseBonus = ({ holesObject, t }) => {
  const info = holesInfo[55].split(' ');
  return -1 !== info[t].indexOf('TOT')
    ? (1 + getCosmoBonus({ majik: holesObject?.villageMajiks, t: 1, i: 3 }) / 100)
    * ((info[t].replace('TOT', '')
      * holesObject?.measurementBuffLevels[t]) / (100 + holesObject?.measurementBuffLevels[t]))
    : (1 + getCosmoBonus({ majik: holesObject?.villageMajiks, t: 1, i: 3 }) / 100)
    * info[t] * holesObject?.measurementBuffLevels[t];
}
const getMeasurementMulti = ({ holesObject, accountData, t }) => {
  const formula = getMeasurementQuantityFound({ holesObject, accountData, t, i: 99 });
  return 5 > formula
    ? 1 + (18 * formula) / 100
    : 1 + (18 * formula + 8 * (formula - 5)) / 100;
}
const getMeasurementQuantity = ({ holesObject, accountData, t }) => {
  const mapping = {
    0: { label: 'Gloomie Kills', value: holesObject?.extraCalculations?.[28] },
    1: { label: 'Crops', value: accountData?.farming?.cropsFound },
    2: { label: 'Account lv', value: accountData?.tome?.tome?.[5]?.quantity },
    3: { label: 'Tome score', value: accountData?.tome?.totalPoints },
    4: { label: 'All skill lv', value: accountData?.tome?.tome?.[13]?.quantity },
    5: { label: 'N/A', value: 0 },
    6: {
      label: 'Deathnote pts',
      value: Object.values(accountData?.deathNote || {}).reduce((sum, { rank }) => sum + rank, 0)
    },
    7: { label: 'Highest DMG', value: accountData?.tasks?.[0]?.[1]?.[0] },
    8: { label: 'Slab Items', value: accountData?.looty?.lootedItems },
    9: { label: 'Studies done', value: holesObject?.studyStuff?.reduce((sum, level) => sum + level, 0) },
    10: { label: 'Golem kills', value: Math.floor(holesObject?.extraCalculations?.[63]) }
  };

  return mapping[t] ?? { label: 'Unknown', value: 0 };
};
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
      let tomeQuantityAdditional = accountData?.tome?.tome?.[13]?.quantity;
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
    case 9:
      let studiesDone = holesObject?.studyStuff?.reduce((sum, level) => sum + level, 0);
      result = i === 99 ? studiesDone / 6 : studiesDone;
      return result;
    case 10:
      let golemKills = holesObject?.extraCalculations?.[63];
      result = i === 99 ? Math.max(0, lavaLog(golemKills) - 2) : golemKills;
      return result;
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
  const measureIndexes = holesInfo[52]?.split(' ');
  const multi = getMeasurementMulti({ holesObject, accountData, t: Number(measureIndexes[t]) });
  return base * multi;
}

const getEngineerUpgradeCost = ({ x2, x3, x4, index, discountWish }) => {
  return 1 === x4
    ? Math.max(0.01, Math.pow(0.85, discountWish)) * x3
    : 10 > x2
      ? 50 * Math.max(0.01, Math.pow(0.85, discountWish)) * Math.pow(1.28, index + Math.floor(index / 2.7))
      : 20 > x2
        ? 50 * Math.max(0.01, Math.pow(0.85, discountWish)) * Math.pow(1.28, index - 16 + Math.floor((index - 16) / 2.7))
        * Math.pow(1.23, Math.min(Math.max(0, (index - 16) / 2), 14))
        : 40 * Math.max(0.01, Math.pow(0.85, discountWish)) * Math.pow(1.34, index - 54 + Math.floor((index - 54) / 2.7))
        * Math.pow(1.26, Math.min(Math.max(0, (index - 54) / 2), 14));
}

const getVillagerExpPerHour = (holesObject, accountData, t, leastOpalInvestedVillager, unlockedCaverns) => {
  // VillagerExpPerHour
  const hasBundle = isBundlePurchased(accountData?.bundles, 'bun_u')?.owned ? 1 : 0;
  const cardBonus = getCardBonusByEffect(accountData?.cards, 'Villager_EXP_(Passive)');
  const eventBonus = getEventShopBonus(accountData, 6);
  const grimoireBonus = getGrimoireBonus(accountData?.grimoire?.upgrades, 29);
  const tesseractBonus = getTesseractBonus(accountData, 32);
  const arcadeBonus = (getArcadeBonus(accountData?.arcade?.shop, 'Villager_XP_multi')?.bonus ?? 0);
  const companionBonus = isCompanionBonusActive(accountData, 13) ? 1 : 0;
  const statueBonus = getStatueBonus(accountData, 28);
  const jarBonuses = getJarBonus({ holesObject, i: 4 })
    + (getJarBonus({ holesObject, i: 10 })
      + (getJarBonus({ holesObject, i: 12 })
        + (getJarBonus({ holesObject, i: 22 })
          + (getJarBonus({ holesObject, i: 29 })
            + getJarBonus({ holesObject, i: 35 })))));
  const compassBonus = getCompassBonus(accountData, 59);
  const charmBonus = getCharmBonus(accountData, 'Candy_Cache');
  const firstVillagerExp = t === 0 && unlockedCaverns < 13 ? Math.pow(1.5, accountData?.accountOptions?.[355]) : 1;
  const value = firstVillagerExp
    * (100 + getSchematicBonus({ holesObject, t: 0, i: 25 }))
    * Math.max(1, (1 + compassBonus / 100)
      * (1 + charmBonus / 100)
      * (1 + 2 * companionBonus)
      * (1 + statueBonus / 100)
      * (1 + jarBonuses / 100)
      * (1 + (25 * eventBonus) / 100)
      * (1 + (50 * hasBundle) / 100))
    * holesObject?.opalsInvested[t]
    * (1 + holesObject?.parallelVillagersGemShop[t] ?? 0)
    * (1 + arcadeBonus / 100)
    * (1 + grimoireBonus / 100)
    * (1 + tesseractBonus / 100)
    * (1 + (getCosmoBonus({ majik: holesObject?.villageMajiks, t: 1, i: 5 })
      * Math.floor(leastOpalInvestedVillager / 5)) / 100)
    * (1 + (getMonumentBonus({ holesObject, t: 0, i: 3 })
      + (getMonumentBonus({ holesObject, t: 1, i: 3 })
        + getMonumentBonus({ holesObject, t: 2, i: 3 })
        + (getMeasurementBonus({ holesObject, accountData, t: 7 })
          + (Math.floor(holesObject?.opalsInvested[t] / 10)
            * getCosmoBonus({ majik: holesObject?.villageMajiks, t: 1, i: 0 })
            + (getCosmoBonus({ majik: holesObject?.villageMajiks, t: 1, i: 1 })
              * getCosSchematic(holesObject)
              + (getCosmoBonus({ majik: holesObject?.villageMajiks, t: 1, i: 2 })
                + (getSchematicBonus({ holesObject, t: 48, i: 0 })
                  + (cardBonus
                    + (getBellBonus({ holesObject, t: 1 })
                      + (getMeasurementBonus({ holesObject, accountData, t: 0 })
                        + getWinnerBonus(accountData, '+{% Villager EXP'))))))))))) / 100);

  const breakdown = [
    { title: 'Base Value' },
    { name: 'Opal Dividends', value: 100 + getSchematicBonus({ holesObject, t: 0, i: 25 }) },
    { title: 'Multiplicative' },
    { name: 'Opal Invested', value: holesObject?.opalsInvested[t] },
    { name: 'Companion', value: companionBonus ? 3 : 0 },
    { name: 'Statue', value: 1 + statueBonus / 100 },
    { name: 'Jar', value: 1 + jarBonuses / 100 },
    { name: 'Event shop', value: 1 + (25 * eventBonus) / 100 },
    { name: 'Bundle', value: 1 + (50 * hasBundle) / 100 },
    { name: 'Arcade', value: 1 + arcadeBonus / 100 },
    { name: 'Grimoire', value: 1 + grimoireBonus / 100 },
    { name: 'Tesseract', value: 1 + tesseractBonus / 100 },
    { name: 'Gem shop', value: holesObject?.parallelVillagersGemShop[t] ? 2 : 0 },
    { name: 'Compass', value: 1 + compassBonus / 100 },
    { name: 'Charm', value: 1 + charmBonus / 100 },
    { title: 'Additive' },
    { name: 'Gloomie Opie', value: getSchematicBonus({ holesObject, t: 48, i: 0 }) },
    { name: 'Num. of Schematics', value: getCosSchematic(holesObject) },
    {
      name: 'Village Majik', value: (
          getCosmoBonus({ majik: holesObject?.villageMajiks, t: 1, i: 5 }) * Math.floor(leastOpalInvestedVillager / 5)) +
        (Math.floor(holesObject?.opalsInvested[t] / 10) * getCosmoBonus({
          majik: holesObject?.villageMajiks,
          t: 1,
          i: 0
        })) + (getCosmoBonus({ majik: holesObject?.villageMajiks, t: 1, i: 1 }) * getCosSchematic(holesObject)) +
        getCosmoBonus({ majik: holesObject?.villageMajiks, t: 1, i: 2 })
    },
    {
      name: 'Monument', value: getMonumentBonus({ holesObject, t: 0, i: 3 }) +
        getMonumentBonus({ holesObject, t: 1, i: 3 }) + getMonumentBonus({ holesObject, t: 2, i: 3 })
    },
    {
      name: 'Measurements', value: getMeasurementBonus({ holesObject, accountData, t: 7 }) +
        getMeasurementBonus({ holesObject, accountData, t: 0 })
    },
    { name: 'Cards', value: cardBonus },
    { name: 'Bell', value: getBellBonus({ holesObject, t: 1 }) },
    { name: 'Summoning', value: getWinnerBonus(accountData, '+{% Villager EXP') }
  ];

  return {
    value,
    breakdown
  }
}

const getVillagerExpReq = (level, index) => {
  return 1 === level && 0 === index ? 5 : 0 === index ? 10 * (-1.5 + (10 + 7 * Math.pow(level, 2.1))
    * Math.pow(2.1, level)
    * (1 + .75 * Math.max(0, level - 4))
    * Math.pow(3.4, Math.min(1, Math.max(0, Math.floor((1E5 + 248.3) / 100247.3)))
      * Math.max(0, level - 12))) :
    1 === index ? 30 * (10 + 6 * Math.pow(level, 1.8))
      * Math.pow(1.57, level) : 2 === index ? 50
      * (10 + 5 * Math.pow(level, 1.7))
      * Math.pow(1.4, level) : 3 === index ? 120
      * (30 + 10 * Math.pow(level, 2))
      * Math.pow(2, level) : 4 === index ? 500
      * (10 + 5 * Math.pow(level, 1.3))
      * Math.pow(1.13, level) : 10 * Math.pow(10, 20);
}
const getStudyReq = (holesObject, t) => {
  return 4e3 *
    Math.pow(1.25, holesObject?.studyStuff?.[t])
    * Math.pow(1.5, Math.floor(t / 5));
}
export const getStudyBonus = (holesObject, t, i) => {
  const multiList = holesInfo[70]?.split(' ');
  return 99 === i
    ? (1 <= holesObject?.studyStuff?.[t] ? 1 : 0)
    : 9 === t
      ? (1 <= holesObject?.studyStuff?.[t] ? 50 + holesObject?.studyStuff?.[t] * Number(multiList[t]) : 0)
      : 3 === t ? (1 <= holesObject?.studyStuff?.[t]
          ? Math.min(32, 12 + holesObject?.studyStuff?.[t] * Number(multiList[t]))
          : 0)
        : holesObject?.studyStuff?.[t] * Number(multiList[t]);

}
const getStudies = (holesObject, villagerLevel, account) => {
  const locations = ['Shallow Caverns', 'Glowshroom Tunnels', 'Underground Overgrowth']
  const names = holesInfo?.[68]?.split(' ');
  const studies = holesInfo?.[69]?.split(' ')?.map((description, index) => {
    const listIndex = Math.floor(index / 5);
    const bonus = getStudyBonus(holesObject, index, 0);
    const progress = holesObject?.studyProgress?.[index];
    const req = getStudyReq(holesObject, index);
    return {
      name: names?.[index]?.toLowerCase().camelToTitleCase(),
      description: description.replace('{', Math.round(bonus)).replace('}', Math.round(100 * (1 + bonus / 100)) / 100),
      listIndex,
      active: holesObject?.extraCalculations?.[61] === index,
      progress,
      req,
      location: locations?.[listIndex],
      bonus: bonus,
      level: holesObject?.studyStuff?.[index],
      readyToLevel: progress >= req
    }
  });

  const stampBonus = getStampsBonusByEffect(account, 'Study_rate_for_Bolaia');
  const studyPerHour = 100 * (1 + ((5 +
      (getSchematicBonus({ holesObject, t: 85, i: 2 })
        + (getSchematicBonus({ holesObject, t: 87, i: 3 })
          + getSchematicBonus({ holesObject, t: 88, i: 5 })))) * villagerLevel) / 100)
    * (1 + (getJarBonus({ holesObject, i: 16 })
      + (stampBonus
        + getCosmoBonus({ majik: holesObject?.villageMajiks, t: 1, i: 4 }))) / 100);

  return {
    studyPerHour,
    studies
  }
}