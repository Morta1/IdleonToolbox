import { holesInfo } from '../../../data/website-data';
import { getCosmoBonus, getMeasurementBonus, getStudyBonus } from '@parsers/world-5/hole';
import { getSchematicBonus } from '@parsers/world-5/caverns/the-well';
import { fillArrayToLength, notateNumber } from '@utility/helpers';
import { getWinnerBonus } from '@parsers/world-6/summoning';
import { getJarBonus } from '@parsers/world-5/caverns/the-jars';
import { getArcadeBonus } from '@parsers/arcade';
import { getAchievementStatus } from '@parsers/achievements';

export const getBravery = (holesObject, accountData) => {
  const maxRethrow = getMaxRerolls(holesObject);
  const maxRetelling = getMonumentHourBonus({ holesObject, t: 0, i: 4 });
  const min = getBraveryMinDamage(holesObject, accountData);
  const max = getBraveryMaxDamage(holesObject, accountData);
  const rewardMulti = getMonumentMultiReward(holesObject, 0) || 0;
  const timeForNextFight = 72E3 * (1 - rewardMulti);
  const opalChance = Math.min(0.5, Math.pow(0.5, holesObject?.opalsPerCavern?.[3])
    * (1 + getMonumentBonus({ holesObject, t: 0, i: 5 }) / 100));
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

  const afkPercent = getMonumentAfkBonus(holesObject, accountData);
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
    rewardMulti,
    afkPercent,
    monumentAfkReq: getMonumentAfkReq(afkPercent?.value, nextHourBreakpoint?.hours, hours)
  };
}

export const getMonumentAfkBonus = (holesObject, accountData) => {
  const winBonus = getWinnerBonus(accountData, '+{% Monument AFK');
  const arcadeBonus = getArcadeBonus(accountData?.arcade?.shop, 'Monument_AFK')?.bonus;

  const afkPercent = getMonumentBonus({ holesObject, t: 0, i: 8 })
    + (getMonumentBonus({ holesObject, t: 1, i: 8 })
      + getMonumentBonus({ holesObject, t: 2, i: 8 })
      + (winBonus
        + (getJarBonus({ holesObject, i: 19 })
          / 1 + (getSchematicBonus({ holesObject, t: 81, i: 20 })
            + (getMeasurementBonus({ holesObject, accountData, t: 11 })
              + (arcadeBonus
                + 10 * getAchievementStatus(accountData?.achievements, 311)))))));

  return {
    value: afkPercent,
    breakdown: [
      {
        name: 'Monument', value: getMonumentBonus({ holesObject, t: 0, i: 8 })
          + getMonumentBonus({ holesObject, t: 1, i: 8 })
          + getMonumentBonus({ holesObject, t: 2, i: 8 })
      },
      { name: 'Summoning', value: winBonus },
      { name: 'Jar', value: getJarBonus({ holesObject, i: 19 }) },
      { name: 'Schematic', value: getSchematicBonus({ holesObject, t: 81, i: 20 }) },
      { name: 'Measurement', value: getMeasurementBonus({ holesObject, accountData, t: 11 }) },
      { name: 'Arcade', value: arcadeBonus || 0 },
      {
        name: 'Achievement',
        value: 10 * getAchievementStatus(accountData?.achievements, 311)
      }
    ],
    expression: `braveryAfkBonus
+ justiceAfkBonus
+ wisdomAfkBonus
+ winBonus
+ (
  minecraftGemBonus / 1
  + (
    rockSmartSchematicBonus
    + measurementBonus
    + arcadeBonus
    + 10 * achievementBonus
  )
)`
  }
}
export const getMonumentAfkReq = (afkPercent, requiredHours, ownedAfkHours = 0) => {
  if (!requiredHours) return null;
  const remainingHours = Math.max(0, requiredHours - ownedAfkHours);
  const realHoursNeeded = Math.ceil(remainingHours / (1 + afkPercent / 100));
  return Array.from({ length: 10 }, (_, index) => {
    const characters = index + 1;  // 1 to 10 characters
    const hoursPerCharacter = Math.ceil(realHoursNeeded / characters);  // Divide time between characters, round up
    return { name: `${characters} characters`, value: `${hoursPerCharacter} hrs` };  // Return object with character count and hours
  });
}

export const getMonumentMultiReward = (holesObject, t) => {
  const maxLinearTime = 1 === t ? 86400 * (2 +
    getSchematicBonus({ holesObject, t: 70, i: 2 })
    + 14 * getStudyBonus(holesObject, 9, 99))
    : 86400 * (2 + getSchematicBonus({ holesObject, t: 70, i: 2 }));
  return Math.min(holesObject?.extraCalculations?.[Math.round(11 + t)], maxLinearTime) / 72e3
    + (Math.pow(1 + Math.max(0, holesObject?.extraCalculations?.[Math.round(11 + t)] - maxLinearTime) / 72e3, 0.3) - 1);
}

const getBraveryMinDamage = (holesObject, accountData) => {
  return 3 + Math.floor(holesObject?.braveryMonument?.[0] / 6)
    * getSchematicBonus({ holesObject, t: 24, i: 1 })
    + (getStudyBonus(holesObject, 3, 0) / 100)
    * getBraveryMaxDamage(holesObject, accountData);
}

const getBraveryMaxDamage = (holesObject, accountData) => {
  return (25 + 10 * Math.floor(holesObject?.braveryMonument?.[0] / 6)
      * getSchematicBonus({ holesObject, t: 24, i: 1 }))
    * (1 + getMeasurementBonus({ holesObject, accountData, t: 1 }) / 100)
    * (1 + (getSchematicBonus({ holesObject, t: 40, i: 10 }) * 0) / 100) * (1 + (10 * 0) / 100);
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