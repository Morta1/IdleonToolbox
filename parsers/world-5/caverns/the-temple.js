import { lavaLog2, notateNumber } from '@utility/helpers';
import { getStudyBonus } from '@parsers/world-5/hole';
import { getSchematicBonus } from '@parsers/world-5/caverns/the-well';
import { getBellBonus } from '@parsers/world-5/caverns/the-bell';

const bonusNames = [
  { name: 'Illuminate', description: '{x_chance_for_Search' },
  { name: 'Search', description: '{%_Chance_to_awaken_Centurion' },
  { name: 'Amplify', description: '{%_Faster_Golem_Respawn' }
];

export const getTheTemple = (holesObject) => {
  const bonuses = bonusNames.map((data, index) => {
    const rawBonus = getTorchBonus(holesObject, index);
    const bonus = index === 0 ? Math.round(100 * rawBonus) / 100 : index === 1
      ? notateNumber(100 * Math.min(1, rawBonus), 'Small')
      : Math.round(rawBonus);
    return {
      ...data,
      cost: getTorchCost(holesObject, index),
      description: data?.description.replace('{', bonus)
    }
  });
  return {
    bonuses,
    layer: holesObject?.extraCalculations?.[55] + 1,
    torches: holesObject?.extraCalculations?.[56]
  }
}

const getTorchCost = (holesObject, t) => {
  return 0 === t ? 3 * Math.pow(1.075, holesObject?.extraCalculations?.[57])
    + holesObject?.extraCalculations?.[57] : 1 === t
    ? Math.max(5, holesObject?.extraCalculations?.[56] / 4)
    : 10 * Math.pow(1.1, holesObject?.extraCalculations?.[59])
    + 2 * holesObject?.extraCalculations?.[59];
}

const getTorchBonus = (holesObject, t) => {
  return 0 === t
    ? 1 + (10 * holesObject?.extraCalculations[57]) / 100
    : 1 === t
      ? 0.05 * getTorchBonus(holesObject, 0)
      * Math.pow(0.7, holesObject?.extraCalculations[55]) * lavaLog2(Math.max(5, holesObject?.extraCalculations[56] / 4))
      : 5 * holesObject?.extraCalculations[59]
}

const getExtraTorches = (holesObject) => {
  return getBellBonus({ holesObject, t: 5 })
    + (getStudyBonus(holesObject, 14, 0) + getSchematicBonus({ holesObject, t: 77, i: 25 }));
}