import { lavaLog2, notateNumber } from '@utility/helpers';
import { getSchematicBonus } from '@parsers/world-5/caverns/the-well';
import {
  getMonumentAfkBonus,
  getMonumentAfkReq,
  getMonumentBonus,
  getMonumentHourBonus,
  getMonumentMultiReward
} from '@parsers/world-5/caverns/bravery';
import { holesInfo } from '../../../data/website-data';
import { getStudyBonus } from '@parsers/world-5/hole';

export const getJustice = (holesObject, accountData) => {

  const rewardMulti = getMonumentMultiReward(holesObject, 1) || 0;
  const timeForNextFight = 72E3 * (1 - rewardMulti);
  const hours = holesObject?.braveryMonument?.[2] || 0;
  const hoursRewards = holesInfo?.[31]?.split(' ').slice(8, 16);
  const hoursBreakpoints = holesInfo?.[30]?.split(' ').map((hours, index) => ({
    hours,
    reward: hoursRewards?.[index]
  }));
  const nextHourBreakpoint = hoursBreakpoints.find(({ hours: reqHours }) => hours < reqHours);
  const bonuses = holesInfo?.[32]?.split(' ')
    ?.slice(10, 20)
    ?.filter((name) => !name.includes('Monument_'))
    .map((description, index) => {
      const level = holesObject?.braveryBonuses?.slice(10)?.[index];
      const bonus = getMonumentBonus({ holesObject, t: 1, i: index })
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
    coins: getStartCoins(holesObject),
    health: getStartHealth(holesObject),
    popularity: getPopularity(holesObject),
    dismissals: getDismissals(holesObject),
    opalChance: getOpalChance(holesObject),
    monumentAfkReq: getMonumentAfkReq(afkPercent?.value, nextHourBreakpoint?.hours, hours)
  }
}

const getStartCoins = (holesObject) => {
  return Math.round((5 +
      lavaLog2(holesObject?.braveryMonument?.[2])
      * getSchematicBonus({ holesObject, t: 61, i: 1 }))
    * (0.5 * getMonumentHourBonus({ holesObject, t: 1, i: 3 })
      + 1.5 * getMonumentHourBonus({ holesObject, t: 1, i: 7 }) + 1));
}

const getPopularity = (holesObject) => {
  return Math.round(3 + 7 * getMonumentHourBonus({ holesObject, t: 1, i: 5 }))
}

const getDismissals = (holesObject) => {
  return Math.round(getMonumentHourBonus({ holesObject, t: 1, i: 2 })
    + (getMonumentHourBonus({ holesObject, t: 1, i: 4 })
      + 2 * getMonumentHourBonus({ holesObject, t: 1, i: 7 })))
}

const getStartHealth = (holesObject) => {
  return Math.round(1 + (getMonumentHourBonus({ holesObject, t: 1, i: 1 })
    + (getMonumentHourBonus({ holesObject, t: 1, i: 4 })
      + 2 * getMonumentHourBonus({ holesObject, t: 1, i: 7 }))));
}

const getOpalChance = (holesObject) => {
  return Math.min(0.5, Math.pow(0.5, holesObject?.opalsPerCavern?.[9])
    * (1 + getMonumentBonus({ holesObject, t: 1, i: 5 }) / 100)
    * (1 + getStudyBonus(holesObject, 9, 0) / 100));
}