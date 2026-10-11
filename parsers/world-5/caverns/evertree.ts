import { commaNotation, notateNumber } from '@utility/helpers';
import { getShownLayerEfficiency, getTotalOreReq, LAYER_CAVERN } from '@parsers/world-5/caverns/motherlode';

export const getEvertree = (holesObject: any, accountData: any) => {
  const choppingEff = notateNumber(getShownLayerEfficiency(holesObject, LAYER_CAVERN.EVERTREE), 'Big');
  const layer = holesObject?.extraCalculations?.[5];
  const choppedLogs = holesObject?.extraCalculations?.[4];
  const reqLogs = getTotalOreReq(holesObject, accountData, LAYER_CAVERN.EVERTREE);

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
