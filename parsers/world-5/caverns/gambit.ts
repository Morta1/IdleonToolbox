import { getMeasurementBonus, getStudyBonus } from '@parsers/world-5/hole';
import { getSchematicBonus } from '@parsers/world-5/caverns/the-well';
import { holesBuildings, holesInfo } from '@website-data';
import { GAME_LN10, cleanUnderscore, gameFill, lavaLog, lavaLog2, titleCaseName } from '@utility/helpers';
import { getMonumentBonus } from '@parsers/world-5/caverns/bravery';
import { getEventShopBonus } from '@parsers/misc';
import { getTesseractBonus } from '@parsers/class-specific/tesseract';
import { getJarBonus } from '@parsers/world-5/caverns/the-jars';
import { createBreakdown, percent } from '@parsers/breakdown';

// Event shop purchase that grants extra summoning doublers
const EVENT_SHOP_DOUBLERS_INDEX = 15;
const EVENT_SHOP_DOUBLERS = 10;
// game: "GambitPts" sums Gambit_0 to 5, Holes[11][65] to [70]
export const GAMBIT_RUNS = 6;
// game: GambitChallengeUnlocked: run 0 is always open, run t needs schematic 88 + t
const RUN_SCHEMATIC_OFFSET = 88;

export const getGambit = (holesObject: any, accountData: any) => {
  const { value: pointsMulti, breakdown: pointsMultiBreakdown } = getPointsMultiSources(holesObject, accountData);
  const basePoints = getPoints(holesObject, accountData, 99);
  const points = getPoints(holesObject, accountData, 777);
  const bonuses = holesInfo?.[71]?.map((bonusRaw: any, index: any) => {
    const [x0, x1, description, name] = bonusRaw?.split('|');
    const pointsReq = getPointReq(index);
    const bonus = getLocalGambitBonus({ index, x0: parseFloat(x0), x1: parseFloat(x1), points, pointsReq });
    return {
      description,
      bonus,
      pointsReq,
      name: name.replace('{', Math.floor(bonus)).replace('}', bonus
        ? `${gameFill(1 + Math.floor(bonus) / 100, 'MultiplierInfo')}x`
        : 0).replace(/[梦而]/g, '').replace('(TAP_ME)', '').replace(/_+$/, '')
    }
  })
  const nextUnlock = bonuses?.find(({ pointsReq }: any) => points < pointsReq);
  // game: "Gambit_SummoningDoublersLeft" = first bonus + event shop doublers - every appointed slot
  const totalDoublers = (bonuses?.[0]?.bonus ?? 0) + EVENT_SHOP_DOUBLERS * getEventShopBonus(accountData, EVENT_SHOP_DOUBLERS_INDEX);
  const appointedDoublers = (holesObject?.gambitStuff ?? []).reduce((sum: any, val: any) => {
    return sum + (val !== -1 ? 1 : 0)
  }, 0);
  const times = Array.from({ length: GAMBIT_RUNS }, (_, run) => holesObject?.extraCalculations?.[65 + run]);
  const runs = times.map((time, run) => {
    const schematic = RUN_SCHEMATIC_OFFSET + run;
    return {
      time,
      unlocked: run === 0 || Boolean(holesObject?.engineerSchematics?.[schematic]),
      schematicName: run === 0 ? '' : holesBuildings?.[schematic]?.name ?? ''
    };
  });
  // game: on entering the cavern, an opal for each step floor(getLOG(points)) has climbed past Holes[7][13]
  const opalsGiven = Number(holesObject?.opalsPerCavern?.[13]) || 0;
  const nextOpalPoints = Math.exp(GAME_LN10 * (opalsGiven + 1));
  const totalTime = times.reduce((sum: any, time: any) => sum + time, 0);
  return {
    pointsMulti,
    pointsMultiBreakdown,
    basePoints,
    points,
    bonuses,
    nextUnlock,
    times,
    totalTime,
    runs,
    nextOpalPoints,
    summoningDoublers: {
      appointed: appointedDoublers,
      total: totalDoublers
    }
  }
}


const getPointReq = (index: any) => {
  return 2e3 + 1e3 * (index + 1) * (1 + index / 5) * Math.pow(1.26, index);
}

const collectibleName = (i: number) => titleCaseName(cleanUnderscore(holesInfo?.[67]?.[i]?.split('|')?.[0] ?? 'Collectible'));

// game: "GambitPTSmulti"
const getPointsMultiSources = (holesObject: any, accountData: any) => {
  const measurement = getMeasurementBonus({ holesObject, accountData, t: 13 });
  const study = getStudyBonus(holesObject, 13, 0);
  const schematic = getSchematicBonus({ holesObject: accountData?.hole?.holesObject, t: 78, i: 10 });
  const monument = getMonumentBonus({ holesObject, t: 2, i: 7 });
  const jar23 = getJarBonus({ holesObject, i: 23, account: accountData });
  const jar30 = getJarBonus({ holesObject, i: 30, account: accountData });
  const arcane = getTesseractBonus(accountData, 47);
  const value = 1 + (measurement + study + schematic + monument + jar23 + jar30 + arcane) / 100;
  const breakdown = createBreakdown('Points multi', value, [
    percent('Measurement', measurement),
    percent('Study', study),
    percent(`${titleCaseName(cleanUnderscore(holesBuildings?.[78]?.name ?? 'Schematic'))} (Schematic)`, schematic),
    percent('Monument', monument),
    percent(collectibleName(23), jar23),
    percent(collectibleName(30), jar30),
    percent('Arcane', arcane)
  ], { combine: 'additive' });
  return { value, breakdown };
}

const getPointsMulti = (holesObject: any, accountData: any) => getPointsMultiSources(holesObject, accountData).value;

const getPoints = (holesObject: any, accountData: any, t: any): any => {
  const base = holesObject?.extraCalculations[Math.round(t + 65)]
    + (3 * Math.floor(holesObject?.extraCalculations[Math.round(t + 65)] / 10)
      + 10 * Math.floor(holesObject?.extraCalculations[Math.round(t + 65)] / 60));
  return 99 === t
    ? getPoints(holesObject, accountData, 0) + (getPoints(holesObject, accountData, 1)
    + (getPoints(holesObject, accountData, 2) + (getPoints(holesObject, accountData, 3)
      + (getPoints(holesObject, accountData, 4) + getPoints(holesObject, accountData, 5)))))
    : 777 === t ? getPoints(holesObject, accountData, 99) * getPointsMulti(holesObject, accountData) :
      0 === t ? 100 * base : 200 * base;
}

export const getGambitBonus = (account: any, index: any) => {
  return account?.hole?.caverns?.gambit?.bonuses?.[index]?.bonus || 0;
}

const getLocalGambitBonus = ({ index, x0, x1, points, pointsReq }: any) => {
  const logPoints = lavaLog(points);
  const log2Points = lavaLog2(points);

  if (points < pointsReq) {
    return 0;
  }

  if (index === 0) {
    return Math.max(1, Math.ceil(log2Points - 8 + (logPoints - 1)));
  }

  return x1 === 1 ? x0 * logPoints : x0;
}