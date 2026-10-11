import { commaNotation, notateNumber } from '@utility/helpers';
import { getShownLayerEfficiency, getTotalOreReq, LAYER_CAVERN } from '@parsers/world-5/caverns/motherlode';

export const getBottomlessTrench = (holesObject: any, accountData: any) => {
  // The fish pool itself sits at MotherlodeEffBase / 4, but the cavern UI prints the same quarter of
  // MotherlodeEffBase as the other three layered caverns
  const fishingEff = notateNumber(getShownLayerEfficiency(holesObject, LAYER_CAVERN.TRENCH), 'Big');
  const depth = holesObject?.extraCalculations?.[7] ?? 0;
  const caughtFish = holesObject?.extraCalculations?.[6] ?? 0;
  const reqFish = getTotalOreReq(holesObject, accountData, LAYER_CAVERN.TRENCH);

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
