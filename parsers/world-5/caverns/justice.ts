import { lavaLog2, notateNumber } from '@utility/helpers';
import { getSchematicBonus } from '@parsers/world-5/caverns/the-well';
import {
  getMonumentAfkBonus,
  getMonumentAfkReq,
  getMonumentBonus,
  getMonumentHourBonus,
  getMonumentMultiReward,
  getMonumentMultiplier
} from '@parsers/world-5/caverns/bravery';
import { holesInfo } from '@website-data';
import { getStudyBonus } from '@parsers/world-5/hole';

export const getJustice = (holesObject: any, accountData: any) => {

  const rewardMulti = getMonumentMultiReward(holesObject, 1, accountData) || 0;
  const timeForNextFight = 72E3 * (1 - rewardMulti);
  const hours = holesObject?.braveryMonument?.[2] || 0;
  const hoursRewards = holesInfo?.[31]?.split(' ').slice(8, 16);
  const hoursBreakpoints = holesInfo?.[30]?.split(' ').map((hours: any, index: any) => ({
    hours,
    reward: hoursRewards?.[index]
  }));
  const nextHourBreakpoint = hoursBreakpoints.find(({ hours: reqHours }: any) => hours < reqHours);
  const multiplier = getMonumentMultiplier({ holesObject, t: 1 });
  const bonuses = holesInfo?.[32]?.split(' ')
    ?.slice(10, 20)
    ?.filter((name: any) => !name.includes('Monument_'))
    .map((description: any, index: any) => {
      const level = holesObject?.braveryBonuses?.slice(10)?.[index];
      const bonus = getMonumentBonus({ holesObject, t: 1, i: index });
      const scalingValue = parseFloat(holesInfo?.[37]?.split(' ')?.[10 + index]);
      const isSoftCap = scalingValue >= 30;
      const capMultiplier = index === 9 ? 1 : multiplier;
      const effectiveCap = isSoftCap ? scalingValue * capMultiplier : null;
      return {
        description: description.replace(/_/g, ' ')
          .replace(/\|/g, ' ')
          .replace('{', Math.round(bonus))
          .replace('}', notateNumber(1 + bonus / 100, 'MultiplierInfo')),
        level,
        bonus,
        scalingValue,
        cap: effectiveCap,
        progression: isSoftCap ? (bonus / effectiveCap!) * 100 : null,
        levelToReachCap: isSoftCap ? Math.ceil(250 * (10 * scalingValue * capMultiplier - 1)) : null
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

const getStartCoins = (holesObject: any) => {
  return Math.round((5 +
      lavaLog2(holesObject?.braveryMonument?.[2])
      * getSchematicBonus({ holesObject, t: 61, i: 1 }))
    * (0.5 * getMonumentHourBonus({ holesObject, t: 1, i: 3 })
      + 1.5 * getMonumentHourBonus({ holesObject, t: 1, i: 7 }) + 1));
}

const getPopularity = (holesObject: any) => {
  return Math.round(3 + 7 * getMonumentHourBonus({ holesObject, t: 1, i: 5 }))
}

const getDismissals = (holesObject: any) => {
  return Math.round(getMonumentHourBonus({ holesObject, t: 1, i: 2 })
    + (getMonumentHourBonus({ holesObject, t: 1, i: 4 })
      + 2 * getMonumentHourBonus({ holesObject, t: 1, i: 7 })))
}

const getStartHealth = (holesObject: any) => {
  return Math.round(1 + (getMonumentHourBonus({ holesObject, t: 1, i: 1 })
    + (getMonumentHourBonus({ holesObject, t: 1, i: 4 })
      + 2 * getMonumentHourBonus({ holesObject, t: 1, i: 7 }))));
}

const getOpalChance = (holesObject: any) => {
  return Math.min(0.5, Math.pow(0.5, holesObject?.opalsPerCavern?.[9])
    * (1 + getMonumentBonus({ holesObject, t: 1, i: 5 }) / 100)
    * (1 + getStudyBonus(holesObject, 9, 0) / 100));
}