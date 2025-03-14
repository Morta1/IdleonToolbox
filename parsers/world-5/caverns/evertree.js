import { commaNotation, notateNumber } from '@utility/helpers';
import { getJarBonus } from '@parsers/world-5/caverns/the-jars';
import { getStudyBonus } from '@parsers/world-5/hole';

export const getEvertree = (holesObject) => {
  const choppingEff = notateNumber(getEfficiency(holesObject), 'Big');
  const layer = holesObject?.extraCalculations?.[5];
  const choppedLogs = holesObject?.extraCalculations?.[4];
  const reqLogs = (200 * Math.pow(2.2, 1 + layer)) / (1 + (getJarBonus({ holesObject, i: 5 }) +
    getStudyBonus(holesObject, 1, 0) *
    holesObject?.extraCalculations?.[1]
    + getStudyBonus(holesObject, 7, 0)
    * holesObject?.extraCalculations?.[3]
    + getStudyBonus(holesObject, 11, 0)
    * holesObject?.extraCalculations?.[5]) / 100);

  return {
    choppingEff,
    layer: layer + 1,
    logs: {
      chopped: choppedLogs < 1e9 ? commaNotation(choppedLogs) : notateNumber(choppedLogs, 'Big'),
      required: reqLogs < 1e9 ? commaNotation(reqLogs) : notateNumber(reqLogs, 'Big'),
      maxed: choppedLogs >= reqLogs
    }
  };
}

const getEfficiency = (holesObject) => {
  return (2e4 * Math.pow(1.8, 1 + (holesObject?.extraCalculations[5]))) * .25;
}