import { commaNotation, notateNumber } from '@utility/helpers';
import { getJarBonus } from '@parsers/world-5/caverns/the-jars';
import { getStudyBonus } from '@parsers/world-5/hole';

export const getHive = (holesObject) => {
  const fishingEff = notateNumber(getEfficiency(holesObject), 'Big');
  const layer = holesObject?.extraCalculations?.[3];
  const caughtBugs = holesObject?.extraCalculations?.[2];
  const reqBugs = (200 * Math.pow(2.2, 1 + layer)) / (1 + (getJarBonus({ holesObject, i: 5 }) +
    getStudyBonus(holesObject, 1, 0) *
    holesObject?.extraCalculations?.[1]
    + getStudyBonus(holesObject, 7, 0)
    * holesObject?.extraCalculations?.[3]
    + getStudyBonus(holesObject, 11, 0)
    * holesObject?.extraCalculations?.[5]) / 100);;

  return {
    fishingEff,
    layer: layer + 1,
    bugs: {
      mined: caughtBugs < 1e9 ? commaNotation(caughtBugs) : notateNumber(caughtBugs, 'Big'),
      required: reqBugs < 1e9 ? commaNotation(reqBugs) : notateNumber(reqBugs, 'Big'),
      maxed: caughtBugs >= reqBugs
    }
  };
}

const getEfficiency = (holesObject) => {
  return (2e4 * Math.pow(1.8, 1 + (holesObject?.extraCalculations[3]))) * .25;
}