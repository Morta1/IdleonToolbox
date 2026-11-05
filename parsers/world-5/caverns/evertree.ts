import { getShownLayerEfficiency, getTotalOreReq, LAYER_CAVERN } from '@parsers/world-5/caverns/motherlode';

export const getEvertree = (holesObject: any, accountData: any) => {
  const choppingEff = getShownLayerEfficiency(holesObject, LAYER_CAVERN.EVERTREE);
  const layer = holesObject?.extraCalculations?.[5];
  const choppedLogs = holesObject?.extraCalculations?.[4];
  const reqLogs = getTotalOreReq(holesObject, accountData, LAYER_CAVERN.EVERTREE);

  return {
    choppingEff,
    layer: layer + 1,
    logs: {
      chopped: choppedLogs,
      required: reqLogs,
      maxed: choppedLogs >= reqLogs
    }
  };
}
