import { fillArrayToLength, lavaLog, notateNumber } from '@utility/helpers';
import { holesInfo } from '../../../data/website-data';
import { getMonumentBonus } from '@parsers/world-5/caverns/bravery';
import { getLampBonus } from '@parsers/world-5/caverns/the-lamp';
import { getMeasurementBonus, getStudyBonus } from '@parsers/world-5/hole';
import { getBellBonus } from '@parsers/world-5/caverns/the-bell';
import { getGambitBonus } from '@parsers/world-5/caverns/gambit';
import { getJarBonus } from '@parsers/world-5/caverns/the-jars';
import { getStampsBonusByEffect } from '@parsers/stamps';

export const getTheWell = (holesObject, accountData) => {
  const { wellSediment, sedimentMulti, wellBuckets } = holesObject;
  const sediments = fillArrayToLength(10).map((_, index) => {
    if (0 <= wellSediment[index]) {
      return {
        current: wellSediment?.[index],
        max: getSedimentMax({ sedimentMulti, index })
      }
    } else if (9999999 < -1 * wellSediment[index]) {
      return { current: wellSediment[index] }
    } else {
      return { current: wellSediment[index] }
    }
  });
  const rockLayerIndex = sediments.findIndex(({ current }) => current < 0);
  sediments.unshift(sediments[rockLayerIndex]);

  const numberOfBuckets = getOwnedBuckets(holesObject);
  const buckets = fillArrayToLength(numberOfBuckets, wellBuckets);
  const fillRate = getBucketFillRate(holesObject, accountData);
  const opalCost = getOpalCost(holesObject)
  const expandWhenFull = holesObject?.extraCalculations?.[10];

  return {
    rockLayerIndex,
    sediments,
    buckets,
    fillRate,
    opalCost: notateNumber(opalCost, 'TinyE'),
    expandWhenFull
  }
}

const getOpalCost = (holesObject) => {
  const base = (1 + (3 * (holesObject?.extraCalculations[9])
      + Math.pow((holesObject?.extraCalculations[9]), 2)))
    * Math.pow(3.5 + (holesObject?.extraCalculations[9]) / 10, (holesObject?.extraCalculations[9]));
  return 1e9 > (base)
    ? (1 === holesObject?.extraCalculations[9] ? 6 : 2 === holesObject?.extraCalculations[9]
      ? 60
      : Math.floor((base)))
    : base

}

const getOwnedBuckets = (holesObject) => {
  return Math.round(1 + (getSchematicBonus({ holesObject, t: 3, i: 1 })
    + (getSchematicBonus({ holesObject, t: 4, i: 1 })
      + (getSchematicBonus({ holesObject, t: 5, i: 1 })
        + (getSchematicBonus({ holesObject, t: 6, i: 1 })
          + (getSchematicBonus({ holesObject, t: 7, i: 1 })
            + (getSchematicBonus({ holesObject, t: 8, i: 1 })
              + (getSchematicBonus({ holesObject, t: 9, i: 1 })
                + (getSchematicBonus({ holesObject, t: 10, i: 1 })
                  + getSchematicBonus({ holesObject, t: 11, i: 1 }))))))))));
}
const getSedimentMax = ({ sedimentMulti, index }) => {
  const anotherSedimentMulti = holesInfo?.[21]?.split(' ');
  return 100 * Math.pow(1.5, sedimentMulti?.[index]) * (1 + anotherSedimentMulti?.[index] / 100);
}
export const getSchematicBonus = ({ holesObject, t, i }) => {
  const {
    wellSediment,
    sedimentMulti,
    extraCalculations,
    bellImprovementMethods,
    engineerSchematics,
    studyStuff
  } = holesObject || {};
  if (0 === engineerSchematics?.[t]) return 0;
  if (14 === t) {
    let result = 0;

    for (let t = 0; t < 10; t++) {
      let currentValue = result;
      let holeValue = sedimentMulti[t];
      result = currentValue + holeValue;
    }
    result *= (20 + getStudyBonus({ studyStuff }, 0, 0));
    return result;
  }
  if (45 === t) {
    let result = 0;
    let holesLength = bellImprovementMethods.length;
    for (let index = 0; index < holesLength; index++) {
      let currentValue = result;
      let holeValue = bellImprovementMethods[index];
      result = currentValue + holeValue;
    }

    return Math.max(1, Math.pow(1.1, Math.floor(result / 25)));
  }
  return 46 === t ? 5 * (extraCalculations[26]) : 47 === t
    ? 25 * (extraCalculations[26])
    : 48 === t ? 10 * (extraCalculations[26]) : 49 === t
      ? i * (extraCalculations[1]
      + (extraCalculations[3]
        * getSchematicBonus({ holesObject, t: 50, i: 1 })
        + extraCalculations[5]
        * getSchematicBonus({ holesObject, t: 79, i: 1 })))
      : 52 === t
        ? 60 * Math.floor(lavaLog((wellSediment[0])))
        : 53 === t
          ? 4 * Math.floor(lavaLog((wellSediment[13])))
          : 54 === t
            ? Math.pow(1.2, Math.floor(lavaLog((wellSediment[15]))))
            : 55 === t
              ? 10 * Math.floor(lavaLog((wellSediment[11])))
              : 56 === t
                ? Math.pow(1.3, Math.floor(lavaLog((wellSediment?.[2]))))
                : 57 === t
                  ? 20 * Math.floor(lavaLog((wellSediment[1])))
                  : 58 === t
                    ? 5 * lavaLog((extraCalculations[32]))
                    : 59 === t
                      ? (((extraCalculations[33]) +
                      ((extraCalculations[34])
                        + ((extraCalculations[35]) + (extraCalculations[36])))) / 100) * 10
                      : 82 === t || 83 === t || 84 === t
                        ? i * extraCalculations[55]
                        : i;
};

const getBucketFillRate = (holesObject, accountData) => {
  const stampBonus = getStampsBonusByEffect(accountData, 'more_Resources_from_all_Caverns') || 0;
  return getSchematicBonus({ holesObject, t: 58, i: 0 })
    + getSchematicBonus({ holesObject, t: 59, i: 0 })
    + (10 + (getSchematicBonus({ holesObject, t: 1, i: 5 })
      + getSchematicBonus({ holesObject, t: 26, i: 5 })))
    * (1 + getSchematicBonus({ holesObject, t: 14, i: 0 }) / 100)
    * (1 + accountData.gemShopPurchases[2] / 2)
    * (1 + getMonumentBonus({ holesObject, t: 0, i: 1 }) / 100)
    * (1 + getLampBonus({ holesObject, t: 99, i: 0 }) / 100)
    * (1 + getGambitBonus(accountData, 3) / 100)
    * Math.max(1, getSchematicBonus({ holesObject, t: 15, i: 1 })
      * Math.pow(1.1, holesObject?.extraCalculations[1]))
    * (1 + getMeasurementBonus({ holesObject, accountData, t: 5 }) / 100)
    * (1 + getBellBonus({ holesObject, t: 0 }) / 100)
    * (1 + getJarBonus({ holesObject, i: 8 }) / 100)
    * (1 + stampBonus / 100);
}
