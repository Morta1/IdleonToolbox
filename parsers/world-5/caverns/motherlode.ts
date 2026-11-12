import { getStudyBonus } from '@parsers/world-5/hole';
import { getJarBonus } from '@parsers/world-5/caverns/the-jars';
import { OPT } from '@parsers/accountOptions';

// The four layered caverns share one formula, indexed by t. Each keeps its progress at
// Holes[11][2t] and its destroyed layers at Holes[11][2t + 1]
export const LAYER_CAVERN = { MOTHERLODE: 0, HIVE: 1, EVERTREE: 2, TRENCH: 3 } as const;
// game: a break is refused once OptionsListAccount[318] reaches 6; the count is shared by all four caverns
export const LAYER_BREAKS_PER_DAY = 6;
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
  const miningEff = getShownLayerEfficiency(holesObject, LAYER_CAVERN.MOTHERLODE);
  const layer = holesObject?.extraCalculations?.[1];
  const minedOres = holesObject?.extraCalculations?.[0];
  const reqOres = getTotalOreReq(holesObject, accountData, LAYER_CAVERN.MOTHERLODE);
  const brokenToday = Number(accountData?.accountOptions?.[OPT.motherlodeLayersBrokenToday]) || 0;
  return {
    miningEff,
    layer: layer + 1,
    // Shared by all four layer caverns, so the other three read it from here
    layerBreaksLeft: Math.max(0, LAYER_BREAKS_PER_DAY - brokenToday),
    ores: {
      mined: minedOres,
      required: reqOres,
      maxed: minedOres >= reqOres
    }
  };
}
