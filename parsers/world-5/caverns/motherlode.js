import { commaNotation, notateNumber } from '@utility/helpers';
import { getStudyBonus } from '@parsers/world-5/hole';
import { getJarBonus } from '@parsers/world-5/caverns/the-jars';

export const getMotherlode = (holesObject) => {
  const miningEff = notateNumber(getEfficiency(holesObject), 'Big');
  const layer = holesObject?.extraCalculations?.[1];
  const minedOres = holesObject?.extraCalculations?.[0];
  const reqOres = (200 * Math.pow(2.2, 1 + layer)) / (1 + (getJarBonus({ holesObject, i: 5 }) +
    getStudyBonus(holesObject, 1, 0) *
    holesObject?.extraCalculations?.[1]
    + getStudyBonus(holesObject, 7, 0)
    * holesObject?.extraCalculations?.[3]
    + getStudyBonus(holesObject, 11, 0)
    * holesObject?.extraCalculations?.[5]) / 100);
  return {
    miningEff,
    layer: layer + 1,
    ores: {
      mined: minedOres < 1e9 ? commaNotation(minedOres) : notateNumber(minedOres, 'Big'),
      required: reqOres < 1e9 ? commaNotation(reqOres) : notateNumber(reqOres, 'Big'),
      maxed: minedOres >= reqOres
    }
  };
}

const getEfficiency = (holesObject) => {
  return (2e4 * Math.pow(1.8, 1 + (holesObject?.extraCalculations[1]))) * .25;
}