import { getShownLayerEfficiency, getTotalOreReq, LAYER_CAVERN } from '@parsers/world-5/caverns/motherlode';

export const getHive = (holesObject: any, accountData: any) => {
  const fishingEff = getShownLayerEfficiency(holesObject, LAYER_CAVERN.HIVE);
  const layer = holesObject?.extraCalculations?.[3];
  const caughtBugs = holesObject?.extraCalculations?.[2];
  const reqBugs = getTotalOreReq(holesObject, accountData, LAYER_CAVERN.HIVE);

  return {
    fishingEff,
    layer: layer + 1,
    bugs: {
      mined: caughtBugs,
      required: reqBugs,
      maxed: caughtBugs >= reqBugs
    }
  };
}
