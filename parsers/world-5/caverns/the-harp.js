import { getSchematicBonus } from '@parsers/world-5/caverns/the-well';
import { getCosmoBonus, getMeasurementBonus, getStudyBonus } from '@parsers/world-5/hole';
import { holesInfo } from '../../../data/website-data';
import { commaNotation, fillArrayToLength, notateNumber } from '@utility/helpers';
import { getLampBonus } from '@parsers/world-5/caverns/the-lamp';
import { getMonumentBonus } from '@parsers/world-5/caverns/bravery';
import { getBellBonus } from '@parsers/world-5/caverns/the-bell';
import { getGambitBonus } from '@parsers/world-5/caverns/gambit';
import { getStampsBonusByEffect } from '@parsers/stamps';
import { getJarBonus } from '@parsers/world-5/caverns/the-jars';

export const getTheHarp = (holesObject, accountData) => {
  const stringSlots = getStringSlots(holesObject);
  const stringTypes = getStringTypesOwned(holesObject);
  const newNoteCost = getNewNoteCost(holesObject);
  const power = holesObject?.extraCalculations?.[22];
  const powerRate = getHarpPowerPerHour(holesObject);
  const harpExpGain = getHarpExpGain(holesObject, accountData, stringTypes, power);
  const opalChance = getOpalChance(holesObject, stringTypes, power);
  const notes = holesObject?.wellSediment?.slice(10, 20);
  const chords = fillArrayToLength(6).map((_, index) => {
    const description = holesInfo[45].split(' ')[index];
    const level = holesObject?.harpRelated?.[2 * index];
    const exp = holesObject?.harpRelated?.[2 * index + 1];
    const expReq = getStringExpReq(holesObject, index);
    const ind = index === 0 || index === 1 ? 0 : index === 3 ? 1 : index === 5 ? 2 : index === 4 ? 4 : 0;
    const owned = getHarpNoteProduced({ index: ind, holesObject, stringTypes, power, accountData });
    const bonus = getHarpStringBonus(holesObject, index);
    let result;
    if (index === 0) {
      result = notateNumber(owned, 'Big');
    } else if (index === 1) {
      result = notateNumber(100 * opalChance, 'Small');
    } else if (index === 3) {
      result = notateNumber(owned, 'Big');
    } else if (index === 5) {
      result = notateNumber(owned, 'Big');
    } else if (index === 4) {
      result = commaNotation(harpExpGain);
    }
    return {
      level,
      exp,
      expReq,
      owned,
      description: description?.replace('{', result),
      bonus
    };
  });
  return {
    stringSlots,
    stringTypes,
    newNoteCost,
    powerRate,
    power,
    harpExpGain,
    chords,
    opalChance,
    notes
  };
}

const getHarpNoteProduced = ({ index, holesObject, stringTypes, power, accountData }) => {
  const stampBonus = getStampsBonusByEffect(accountData, 'more_Resources_from_all_Caverns') || 0;
  return ((power / 100)
    * getHarpStringAllBonus(holesObject, stringTypes, power)
    * Math.max(1, getSchematicBonus({ holesObject, t: 41, i: 1 })
      * Math.pow(1.1, holesObject?.extraCalculations?.[3]))
    * (1 + (getHarpStringBonus(holesObject, 0)
      + (getHarpStringBonus(holesObject, 3)
        + getHarpStringBonus(holesObject, 5))) / 100)
    * (1 + getHarpStringBonus(holesObject, 1) / 100)
    * (1 + getLampBonus({ holesObject, t: 99, i: 0 }) / 100)
    * (1 + getGambitBonus(accountData, 3) / 100)
    * (1 + getMonumentBonus({ holesObject, t: 1, i: 1 }) / 100)
    * (1 + getMeasurementBonus({ holesObject, accountData, t: 3 }) / 100)
    * (1 + getMeasurementBonus({ holesObject, accountData, t: 8 }) / 100)
    * (1 + getBellBonus({ holesObject, t: 2 }) / 100)
    * (1 + accountData?.gemShopPurchases?.[2] / 2)
    * (1 + getJarBonus({ holesObject, i: 20 }) / 100)
    * (1 + stampBonus / 100)) / Math.pow(4, index);
}

const getHarpPowerPerHour = (holesObject) => {
  return 200 * (1 + getHarpStringBonus(holesObject, 2) / 100);
}

const getHarpExpGain = (holesObject, accountData, stringTypes, power) => {
  return 1 === getStudyBonus(holesObject, 5, 99)
    ? (1 + getStudyBonus(holesObject, 5, 0))
    * (1 + getStudyBonus(holesObject, 5, 99))
    * (power / 100)
    * getHarpStringAllBonus(holesObject, stringTypes, power)
    * (1 + getHarpStringBonus(holesObject, 4) / 100)
    * (1 + getMeasurementBonus({ holesObject, accountData, t: 6 }) / 100)
    * (1 + accountData?.gemShopPurchases?.[2] / 2)
    : (1 + getStudyBonus(holesObject, 5, 99))
    * (power / 100)
    * getHarpStringAllBonus(holesObject, stringTypes, power)
    * (1 + getHarpStringBonus(holesObject, 4) / 100)
    * (1 + getMeasurementBonus({ holesObject, accountData, t: 6 }) / 100)
    * (1 + accountData?.gemShopPurchases?.[2] / 2);
}

const getHarpStringBonus = (holesObject, t) => {
  return (holesInfo[47].split(' ')[t]) * (holesObject?.harpRelated?.[Math.round(2 * t)]);
}

export const getStringSlots = (holesObject) => {
  return Math.min(15, Math.round(1 + getCosmoBonus({ majik: holesObject?.holeMajiks, t: 0, i: 1 })
    + (getSchematicBonus({ holesObject, t: 32, i: 1 })
      + (getSchematicBonus({ holesObject, t: 33, i: 1 })
        + (getSchematicBonus({ holesObject, t: 34, i: 1 })
          + (getSchematicBonus({ holesObject, t: 35, i: 1 })
            + getSchematicBonus({ holesObject, t: 36, i: 1 })))))))
}

const getStringTypesOwned = (holesObject) => {
  return Math.round(Math.min(7, Math.min(1, (holesObject?.harpRelated?.[0]))
    + (Math.min(1, (holesObject?.harpRelated?.[2]))
      + (Math.min(1, (holesObject?.harpRelated?.[4]))
        + (Math.min(1, (holesObject?.harpRelated?.[6]))
          + (Math.min(1, (holesObject?.harpRelated?.[8]))
            + (Math.min(1, (holesObject?.harpRelated?.[10]))
              + Math.min(1, (holesObject?.harpRelated?.[12])))))))))
}

const getStringExpReq = (holesObject, t) => {
  return (4 + (holesObject?.harpRelated[Math.round(2 * t)]))
    * Math.pow(1.15, (holesObject?.harpRelated[Math.round(2 * t)]))
}
const getNewNoteCost = (holesObject) => {
  return 150 * Math.pow(1 + (holesObject?.extraCalculations?.[20]), 1.5)
    * Math.pow(4.5, (holesObject?.extraCalculations?.[20]))
}

const getHarpStringAllBonus = (holesObject, stringTypes, power) => {
  return 1 + (getSchematicBonus({ holesObject, t: 39, i: 15 })
    + (getSchematicBonus({ holesObject, t: 37, i: 20 })
      * (power)
      + getSchematicBonus({ holesObject, t: 38, i: 30 })
      * (stringTypes)
    )) / 100;
}

const getOpalChance = (holesObject, stringTypes, power) => {
  return Math.min(1, getHarpStringAllBonus(holesObject, stringTypes, power)
    * (1 - Math.pow(1 - Math.pow(0.2, (holesObject?.opalsPerCavern?.[5]) + 1),
      Math.max(1, (power) / 100))));
}