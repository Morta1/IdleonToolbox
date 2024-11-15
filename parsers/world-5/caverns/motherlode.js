import { commaNotation, notateNumber } from '@utility/helpers';

export const getMotherlode = (holesObject) => {
  const miningEff = notateNumber(getEfficiency(holesObject), 'Big');
  const layer = holesObject?.extraCalculations?.[1];
  const minedOres = holesObject?.extraCalculations?.[0];
  const reqOres = 200 * Math.pow(2.2, 1 + layer);
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