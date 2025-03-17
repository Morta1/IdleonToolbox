import { getMeasurementBonus, getStudyBonus } from '@parsers/world-5/hole';
import { getSchematicBonus } from '@parsers/world-5/caverns/the-well';
import { holesInfo } from '../../../data/website-data';
import { lavaLog, lavaLog2, notateNumber } from '@utility/helpers';

export const getGambit = (holesObject, accountData) => {
  const pointsMulti = getPointsMulti(holesObject, accountData);
  const basePoints = getPoints(holesObject, accountData, 99);
  const points = getPoints(holesObject, accountData, 777);
  const bonuses = holesInfo?.[71]?.split(' ')?.map((bonusRaw, index) => {
    const [x0, x1, description, name] = bonusRaw?.split('|');
    const pointsReq = getPointReq(index);
    const bonus = getLocalGambitBonus({ index, x0: parseFloat(x0), x1: parseFloat(x1), points, pointsReq });
    return {
      description,
      bonus,
      pointsReq,
      name: name.replace('{', Math.floor(bonus)).replace('}', bonus
        ? notateNumber(1 + Math.floor(bonus) / 100, 'MultiplierInfo')
        : 0).replace(/[梦而]/g, '').replace('(TAP ME)', '')
    }
  })
  const nextUnlock = bonuses?.find(({ pointsReq }) => points < pointsReq);
  const appointedDoublers = holesObject?.gambitStuff?.slice(0, bonuses?.[0]?.bonus)?.reduce((sum, val) => {
    return sum + (val !== -1 ? 1 : 0)
  }, 0);
  const times = holesObject?.extraCalculations.slice(65, 71);
  return {
    pointsMulti,
    basePoints,
    points,
    bonuses,
    nextUnlock,
    times,
    summoningDoublers: {
      appointed: appointedDoublers,
      total: bonuses?.[0]?.bonus
    }
  }
}


const getPointReq = (index) => {
  return 2e3 + 1e3 * (index + 1) * (1 + index / 5) * Math.pow(1.26, index);
}

const getPointsMulti = (holesObject, accountData) => {
  return 1 + (getMeasurementBonus({ holesObject, accountData, t: 13 })
    + getStudyBonus(holesObject, 13, 0)
    + getSchematicBonus({ holesObject: accountData?.hole?.holesObject, t: 78, i: 10 })) / 100;
}

const getPoints = (holesObject, accountData, t) => {
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

export const getGambitBonus = (account, index) => {
  return account?.hole?.caverns?.gambit?.bonuses?.[index]?.bonus || 0;
}

const getLocalGambitBonus = ({ index, x0, x1, points, pointsReq }) => {
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