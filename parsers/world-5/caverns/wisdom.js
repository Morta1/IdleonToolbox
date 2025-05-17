import {
  getMonumentAfkBonus,
  getMonumentAfkReq,
  getMonumentBonus,
  getMonumentHourBonus,
  getMonumentMultiReward
} from '@parsers/world-5/caverns/bravery';
import { lavaLog, notateNumber } from '@utility/helpers';
import { holesInfo } from '../../../data/website-data';
import { getStudyBonus } from '@parsers/world-5/hole';

export const getWisdom = (holesObject,  accountData) => {
  const opalChance = Math.min(0.5, Math.pow(0.5, holesObject?.opalsPerCavern?.[12])
    * (1 + getMonumentHourBonus({ holesObject, t: 2, i: 5 }) / 100));
  const rewardMulti = getMonumentMultiReward(holesObject, 2) || 0;
  const timeForNextFight = 72E3 * (1 - rewardMulti);
  const hours = holesObject?.braveryMonument?.[4] || 0;
  const hoursRewards = holesInfo?.[31]?.split(' ').slice(16);
  const hoursBreakpoints = holesInfo?.[30]?.split(' ').map((hours, index) => ({
    hours,
    reward: hoursRewards?.[index]
  }));
  const nextHourBreakpoint = hoursBreakpoints.find(({ hours: reqHours }) => hours < reqHours);
  const bonuses = holesInfo?.[32]?.split(' ')
    ?.slice(20)
    ?.filter((name) => !name.includes('Monument_'))
    .map((description, index) => {
      const level = holesObject?.braveryBonuses?.slice(20)?.[index];
      const bonus = getMonumentBonus({ holesObject, t: 2, i: index })
      return {
        description: description.replace(/_/g, ' ')
          .replace(/\|/g, ' ')
          .replace('{', Math.round(bonus))
          .replace('}', notateNumber(1 + bonus / 100, 'MultiplierInfo')),
        level,
        bonus
      }
    })
  const afkPercent = getMonumentAfkBonus(holesObject, accountData);
  return {
    rewardMulti,
    hours,
    hoursRewards,
    hoursBreakpoints,
    nextHourBreakpoint,
    bonuses,
    timeForNextFight,
    opalChance,
    afkPercent,
    attempts: getAttempts(holesObject),
    attemptsGainPerRound: getAttemptsGainPerRound(holesObject),
    timePerMatch: getTimePerMatch(),
    instantMatches: getInstantMatch(holesObject),
    monumentAfkReq: getMonumentAfkReq(afkPercent?.value, nextHourBreakpoint?.hours, hours)
  };
}

const getAttempts = (holesObject, t) => {
  return 1 === t
    ? 30 : Math.round(5 + getStudyBonus(holesObject, 12, 0)
      + (4 * getMonumentHourBonus({ holesObject, t: 2, i: 4 })
        + Math.floor(2 * lavaLog(holesObject?.braveryMonument?.[4]))));
}

const getAttemptsGainPerRound = (holesObject, t) => {
  return 1 === t
    ? 0 : Math.round(2 * getMonumentHourBonus({ holesObject, t: 2, i: 1 })
      + getMonumentHourBonus({ holesObject, t: 2, i: 6 }));
}

const getTimePerMatch = (t) => {
  return 1 === t ? 1e3 : 12.6;
}
const getInstantMatch = (holesObject, t) => {
  return 1 === t
    ? 0
    : Math.round(4 * getMonumentHourBonus({ holesObject, t: 2, i: 3 })
      + 5 * getMonumentHourBonus({ holesObject, t: 2, i: 7 }));
}