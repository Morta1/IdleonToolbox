import { commaNotation, notateNumber } from '@utility/helpers';
import { getStudyBonus } from '@parsers/world-5/hole';
import { getJarBonus } from '@parsers/world-5/caverns/the-jars';

// The four layered caverns share one formula, indexed by t. Each keeps its progress at
// Holes[11][2t] and its destroyed layers at Holes[11][2t + 1]
export const LAYER_CAVERN = { MOTHERLODE: 0, HIVE: 1, EVERTREE: 2, TRENCH: 3 } as const;
// The cavern UI shows a quarter of MotherlodeEffBase as the efficiency to aim for
const SHOWN_EFFICIENCY_SHARE = 0.25;

const getLayerCavernScale = (t: number) => 1 + 99 * Math.floor(t / 3);

// game: Holes("TotalOreREQ", t)
export const getTotalOreReq = (holesObject: any, account: any, t: number) => {
  const layers = holesObject?.extraCalculations;
  const reduction = getJarBonus({ holesObject, i: 5, account })
    + getStudyBonus(holesObject, 1, 0) * layers?.[1]
    + getStudyBonus(holesObject, 7, 0) * layers?.[3]
    + getStudyBonus(holesObject, 11, 0) * layers?.[5]
    + getStudyBonus(holesObject, 16, 0) * layers?.[7];
  return getLayerCavernScale(t) * (200 * Math.pow(2.2, 1 + layers?.[Math.round(1 + 2 * t)]))
    / (1 + reduction / 100);
}

// game: Holes("MotherlodeEffBase", t)
export const getMotherlodeEffBase = (holesObject: any, t: number) => {
  return 2e4 * getLayerCavernScale(t) * Math.pow(1.8, 1 + holesObject?.extraCalculations?.[Math.round(1 + 2 * t)]);
}

export const getShownLayerEfficiency = (holesObject: any, t: number) => SHOWN_EFFICIENCY_SHARE * getMotherlodeEffBase(holesObject, t);

export const getMotherlode = (holesObject: any, accountData: any) => {
  const miningEff = notateNumber(getShownLayerEfficiency(holesObject, LAYER_CAVERN.MOTHERLODE), 'Big');
  const layer = holesObject?.extraCalculations?.[1];
  const minedOres = holesObject?.extraCalculations?.[0];
  const reqOres = getTotalOreReq(holesObject, accountData, LAYER_CAVERN.MOTHERLODE);
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
