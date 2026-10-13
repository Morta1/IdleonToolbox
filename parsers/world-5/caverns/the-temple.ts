import { lavaLog2, notateNumber, numberWithCommas } from '@utility/helpers';
import { getStudyBonus } from '@parsers/world-5/hole';
import { getSchematicBonus } from '@parsers/world-5/caverns/the-well';
import { getBellBonus } from '@parsers/world-5/caverns/the-bell';
import { createBreakdown, percent } from '@parsers/breakdown';

const bonusNames = [
  { name: 'Illuminate', description: '{x_chance_for_Search' },
  { name: 'Search', description: '{%_Chance_to_awaken_Centurion' },
  { name: 'Amplify', description: '{%_Faster_Golem_Respawn' }
];

export const getTheTemple = (holesObject: any) => {
  const bonuses = bonusNames.map((data, index) => {
    const rawBonus = getTorchBonus(holesObject, index);
    const bonus = index === 0 ? Math.round(100 * rawBonus) / 100 : index === 1
      ? notateNumber(100 * Math.min(1, rawBonus), 'Small')
      : Math.round(rawBonus);
    return {
      ...data,
      cost: getTorchCost(holesObject, index),
      description: data?.description.replace('{', String(bonus))
    }
  });
  return {
    bonuses,
    layer: holesObject?.extraCalculations?.[55] + 1,
    torches: holesObject?.extraCalculations?.[56],
    extraTorchChance: getExtraTorchChance(holesObject)
  }
}

const getTorchCost = (holesObject: any, t: any) => {
  return 0 === t ? 3 * Math.pow(1.075, holesObject?.extraCalculations?.[57])
    + holesObject?.extraCalculations?.[57] : 1 === t
    ? Math.max(5, holesObject?.extraCalculations?.[56] / 4)
    : 10 * Math.pow(1.1, holesObject?.extraCalculations?.[59])
    + 2 * holesObject?.extraCalculations?.[59];
}

// game: "TempleTorchBonuses"
export const getTorchBonus = (holesObject: any, t: any): any => {
  return 0 === t
    ? 1 + (10 * holesObject?.extraCalculations[57]) / 100
    : 1 === t
      ? 0.05 * getTorchBonus(holesObject, 0)
      * Math.pow(0.7, holesObject?.extraCalculations[55]) * lavaLog2(Math.max(5, holesObject?.extraCalculations[56] / 4))
      : 5 * holesObject?.extraCalculations[59]
}

const BELL_DOUBLE_TORCH_BONUS = 5;
const TEMPLE_STUDY = 14;
const ROARING_FLAME_SCHEMATIC = 77;
const ROARING_FLAME_BONUS = 25;

// game: "TempleExtraTorches", in percent. Each Ancient Golem torch pickup gives
// floor(1 + chance / 100 + random) times the drop, so 3975% means 40 or 41 torches.
export const getExtraTorchChance = (holesObject: any) => {
  const bell = getBellBonus({ holesObject, t: BELL_DOUBLE_TORCH_BONUS });
  const study = getStudyBonus(holesObject, TEMPLE_STUDY, 0);
  const schematic = getSchematicBonus({ holesObject, t: ROARING_FLAME_SCHEMATIC, i: ROARING_FLAME_BONUS });
  const value = (bell || 0) + (study || 0) + (schematic || 0);
  const breakdown = createBreakdown('Extra torch chance', `${numberWithCommas(value)}%`, [
    percent('The Bell', bell || 0),
    percent('Temple (Study)', study || 0),
    percent('Roaring Flame (Schematic)', schematic || 0)
  ], { combine: 'sum' });
  return { value, breakdown };
}
