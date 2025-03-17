import { commaNotation, notateNumber } from '@utility/helpers';
import { getSchematicBonus } from '@parsers/world-5/caverns/the-well';
import { holesInfo } from '../../../data/website-data';

export const getTheDen = (holesObject) => {
  const bestScore = holesObject?.extraCalculations?.[8];
  const nextOpalAt = 12 * (150 + (30 + (holesObject?.opalsPerCavern[2])) * (holesObject?.opalsPerCavern[2])) * Math.pow(1.5, (holesObject?.opalsPerCavern[2]));
  const amplifiers = holesInfo?.[28]?.split(' ').toChunks(2).map(([ampName, ampDescription], index) => {
    return {
      ampName,
      ampDescription,
      level: holesObject?.dawgDenAmplifierLevels?.[index],
      bonus: notateNumber(getAmpDebuff(holesObject, index), 'Big')
    }
  });
  const ampMulti = getAmpStoneMulti(holesObject);
  const ownedAmps = getAmpStonesOwned(holesObject);

  return {
    bestScore: commaNotation(bestScore),
    nextOpalAt,
    ampMulti,
    amplifiers,
    ownedAmps
  };
}

const getAmpStoneMax = (t) => {
  return 2 === t ? 20 : 4 === t ? 30 : 5 === t ? 20 : 6 === t ? 24 : 7 === t ? 40 : 100;
}
const getAmpStoneMulti = (holesObject) => {
  let base = 0;

  for (let t = 0; t < 8; t++) {
    let currentTotal = base;
    let amplifierLevel = (holesObject?.dawgDenAmplifierLevels[t]);
    base = currentTotal + amplifierLevel;
  }
  return 0.5 * getSchematicBonus({ holesObject, t: 23, i: 1 })
    * Math.floor(base / 10)
    + (11 * (holesObject?.dawgDenAmplifierLevels[0])
      + (9 * (holesObject?.dawgDenAmplifierLevels[1])
        + (8 * (holesObject?.dawgDenAmplifierLevels[2])
          + (10 * (holesObject?.dawgDenAmplifierLevels[3])
            + (8 * (holesObject?.dawgDenAmplifierLevels[4])
              + (7 * (holesObject?.dawgDenAmplifierLevels[5])
                + (10 * (holesObject?.dawgDenAmplifierLevels[6])
                  + 7 * (holesObject?.dawgDenAmplifierLevels[7])))))))) / 100 + 1;

}
const getAmpStonesOwned = (holesObject) => {
  return Math.round(1 + (getSchematicBonus({ holesObject, t: 16, i: 1 })
    + (getSchematicBonus({ holesObject, t: 17, i: 1 }) + (getSchematicBonus({ holesObject, t: 18, i: 1 })
      + (getSchematicBonus({ holesObject, t: 19, i: 1 }) + (getSchematicBonus({ holesObject, t: 20, i: 1 })
        + (getSchematicBonus({ holesObject, t: 21, i: 1 }) + getSchematicBonus({ holesObject, t: 22, i: 1 }))))))));

}
const getAmpDebuff = (holesObject, t) => {
  return 0 === t
    ? (5e3 + 800 * (holesObject?.dawgDenAmplifierLevels[0])) * Math.pow(1.25, (holesObject?.dawgDenAmplifierLevels[0]))
    : 1 === t
      ? (6e3 + 4e3 * (holesObject?.dawgDenAmplifierLevels[1])) * Math.pow(1.3, (holesObject?.dawgDenAmplifierLevels[1]))
      : 2 === t
        ? 5 * (holesObject?.dawgDenAmplifierLevels[2])
        : 3 === t
          ? (1 + (holesObject?.dawgDenAmplifierLevels[3])) * Math.pow(1.05, (holesObject?.dawgDenAmplifierLevels[3]))
          : 4 === t
            ? (1 + (holesObject?.dawgDenAmplifierLevels[4])) * Math.pow(1.07, (holesObject?.dawgDenAmplifierLevels[4]))
            : 5 === t
              ? 1 + (holesObject?.dawgDenAmplifierLevels[5])
              : 6 === t
                ? 4 * (holesObject?.dawgDenAmplifierLevels[6])
                : (holesObject?.dawgDenAmplifierLevels[7]) / 10;
}