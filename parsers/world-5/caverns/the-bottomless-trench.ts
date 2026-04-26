import { commaNotation, notateNumber } from '@utility/helpers';
import { getStudyBonus } from '@parsers/world-5/hole';
import { getJarBonus } from '@parsers/world-5/caverns/the-jars';

export const getBottomlessTrench = (holesObject: any, accountData: any) => {
  // Per N.js MotherlodeEffBase: t=3 multiplies by (1 + 99 * floor(t/3)) = 100, then * 0.25 to display
  // and game further halves it (/4) for the Trench specifically (MotherlodeFISH map).
  const fishingEff = notateNumber(getEfficiency(holesObject), 'Big');
  const depth = holesObject?.extraCalculations?.[7] ?? 0;
  const caughtFish = holesObject?.extraCalculations?.[6] ?? 0;
  // TotalOreREQ for t=3: same denominator as motherlode/hive/evertree but with 100x multi and the new study16 term
  const reqFish = (1 + 99 * Math.floor(3 / 3))
    * (200 * Math.pow(2.2, 1 + depth))
    / (1 + (
      getJarBonus({ holesObject, i: 5, account: accountData })
      + getStudyBonus(holesObject, 1, 0) * holesObject?.extraCalculations?.[1]
      + getStudyBonus(holesObject, 7, 0) * holesObject?.extraCalculations?.[3]
      + getStudyBonus(holesObject, 11, 0) * holesObject?.extraCalculations?.[5]
      + getStudyBonus(holesObject, 16, 0) * holesObject?.extraCalculations?.[7]
    ) / 100);

  return {
    fishingEff,
    layer: depth + 1,
    fish: {
      caught: caughtFish < 1e9 ? commaNotation(caughtFish) : notateNumber(caughtFish, 'Big'),
      required: reqFish < 1e9 ? commaNotation(reqFish) : notateNumber(reqFish, 'Big'),
      maxed: caughtFish >= reqFish
    }
  };
};

const getEfficiency = (holesObject: any) => {
  // MotherlodeEffBase(t=3) = 2e4 * 100 * 1.8^(1 + extraCalculations[7])
  // Game UI displays * 0.25 (just like Motherlode) and divides by 4 for the Trench fish pool
  return (2e4 * 100 * Math.pow(1.8, 1 + (holesObject?.extraCalculations?.[7] ?? 0))) * 0.25 / 4;
};
