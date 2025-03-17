import { holesInfo } from '../../../data/website-data';
import { getCosmoBonus, getStudyBonus } from '@parsers/world-5/hole';
import { getBucketBonus } from '@parsers/world-5/caverns/the-well';
import { fillArrayToLength, notateNumber } from '@utility/helpers';

export const getBravery = (holesObject) => {
  const maxRethrow = getMaxRerolls(holesObject);
  const maxRetelling = getMonumentHourBonus({ holesObject, t: 0, i: 4 });
  const min = getBraveryMinDamage(holesObject);
  const max = getBraveryMaxDamage(holesObject);
  const rewardMulti = getMonumentMultiReward(holesObject, 0);
  const timeForNextFight = 72E3 * (1 - rewardMulti);
  const opalChance = Math.min(0.5, Math.pow(0.5, holesObject?.opalsPerCavern?.[3]) * (1 + getMonumentHourBonus({
    holesObject,
    t: 0,
    i: 5
  }) / 100));
  const ownedSwords = Math.round(Math.min(9, 3 + (2 * getMonumentHourBonus({ holesObject, t: 0, i: 1 })
    + (getMonumentHourBonus({ holesObject, t: 0, i: 3 })
      + (getMonumentHourBonus({ holesObject, t: 0, i: 5 })
        + getMonumentHourBonus({ holesObject, t: 0, i: 7 }))))));
  const hps = fillArrayToLength(50).map((_, index) => {
    return {
      name: `Level ${index + 1}`,
      value: (10 + 15 * index) * Math.pow(1.3, index)
    }
  }).filter((_, index) => (index + 1) % 5 === 0);
  const bonuses = holesInfo?.[32]?.split(' ')
    ?.slice(0, 10)
    ?.filter((name) => !name.includes('Monument_'))
    .map((description, index) => {
      const level = holesObject?.braveryBonuses?.[index];
      const bonus = getMonumentBonus({ holesObject, t: 0, i: index })
      return {
        description: description.replace(/_/g, ' ').replace(/\|/g, ' ').replace('{', Math.round(bonus)).replace('}', notateNumber(1 + bonus / 100, 'MultiplierInfo')),
        level,
        bonus
      }
    })
  const hours = holesObject?.braveryMonument?.[0] || 0;
  const hoursRewards = holesInfo?.[31]?.split(' ').slice(0, 8);
  const hoursBreakpoints = holesInfo?.[30]?.split(' ').map((hours, index) => ({
    hours,
    reward: hoursRewards?.[index]
  }));
  const nextHourBreakpoint = hoursBreakpoints.find(({ hours: reqHours }) => hours < reqHours);

  return {
    damage: { min, max },
    ownedSwords,
    maxRethrow,
    maxRetelling,
    opalChance,
    hps,
    bonuses,
    hours,
    nextHourBreakpoint,
    timeForNextFight,
    rewardMulti
  };
}

export const getMonumentMultiReward = (holesObject, t) => {
  const maxLinearTime = 1 === t ? 86400 * (2 +
    getBucketBonus({ ...holesObject, t: 70, i: 2 })
    + 14 * getStudyBonus(holesObject, 9, 99))
    : 86400 * (2 + getBucketBonus({ ...holesObject, t: 70, i: 2 }));
  return Math.min(holesObject?.extraCalculations?.[Math.round(11 + t)], maxLinearTime) / 72e3
    + (Math.pow(1 + Math.max(0, holesObject?.extraCalculations?.[Math.round(11 + t)] - maxLinearTime) / 72e3, 0.3) - 1);
}

const getBraveryMinDamage = (holesObject) => {
  return 3 + Math.floor(holesObject?.braveryMonument?.[0] / 6)
    * getBucketBonus({ ...holesObject, t: 24, i: 1 })
    + (getStudyBonus(holesObject, 3, 0) / 100)
    * getBraveryMaxDamage(holesObject)
}
const getBraveryMaxDamage = (holesObject) => {
  return (25 + 10 * Math.floor(holesObject?.braveryMonument?.[0] / 6)
    * getBucketBonus({ ...holesObject, t: 24, i: 1 }))
}

export const getMonumentHourBonus = ({ holesObject, t, i }) => {
  return holesObject?.braveryMonument?.[Math.round(1 + 2 * t)] > i ? 1 : 0;
}

const getMaxRerolls = (holesObject) => {
  return Math.round(5 * getMonumentHourBonus({ holesObject, t: 0, i: 2 }) + 10 * getMonumentHourBonus({
    holesObject,
    t: 0,
    i: 6
  }));
}

// 'MonumentROGbonuses' == e
export const getMonumentBonus = ({ holesObject, t, i }) => {
  let result = 1;

  if (i !== 9) {
    result = 1 + getMonumentBonus({ holesObject, t, i: 9 }) / 100;
    result += getCosmoBonus({ majik: holesObject?.holeMajiks, t: 0, i: 0 }) / 100;
  }
  let holesInfoValue = (holesInfo[37]?.split(' ')[Math.round(10 * t + i)]);
  let holesValue = (holesObject?.braveryBonuses?.[Math.round(10 * t + i)]);
  let finalResult = Math.max(1, result);

  if (holesInfoValue < 30) {
    return holesValue * holesInfoValue * finalResult;
  } else {
    return 0.1 * Math.ceil((holesValue / (250 + holesValue)) * 10 * holesInfoValue * finalResult);
  }
}