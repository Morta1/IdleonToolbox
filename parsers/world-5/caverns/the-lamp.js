import { lampWishes } from '../../../data/website-data';
import { getCosmoBonus, getMeasurementBonus, getStudyBonus } from '@parsers/world-5/hole';
import { getBellBonus } from '@parsers/world-5/caverns/the-bell';
import { notateNumber } from '@utility/helpers';
import { getMonumentBonus } from '@parsers/world-5/caverns/bravery';

export const getLamp = (holesObject, accountData, unlockedCaverns) => {
  const wishPerDay = getWishPerDay(holesObject, accountData, unlockedCaverns);
  const wishes = lampWishes.map((wish, index) => {
    const cost = getWishCost(holesObject?.wishesUsed?.[index], index);
    const futureCosts = getFutureWishCosts(holesObject?.wishesUsed?.[index] + 1, holesObject?.wishesUsed?.[index] + 6, index);
    let desc;
    if (4 === index || 6 === index || 8 === index || 10 === index || 11 === index) {
      desc = wish?.description.replace('{', getLampBonus({
        holesObject,
        t: Math.floor((index - 4 + Math.floor(index / 11)) / 2),
        i: 0
      }))
        .replace('}', getLampBonus({ holesObject, t: Math.floor((index - 4 + Math.floor(index / 11)) / 2), i: 1 }))
        .replace('~', getLampBonus({ holesObject, t: Math.floor((index - 4 + Math.floor(index / 11)) / 2), i: 2 }))
    } else {
      desc = wish?.description.replace('#', notateNumber(1 + getLampBonus({ holesObject, t: 99, i: 0 }) / 100))
    }
    return { ...wish, cost, futureCosts, description: desc };
  });
  const currentWishes = holesObject?.extraCalculations?.[25];
  return { wishes, wishPerDay, currentWishes };
}

const getWishPerDay = (holesObject, accountData, unlockedCaverns) => {
  return 6 > unlockedCaverns
    ? 0
    : 1 + (getMeasurementBonus({ holesObject, accountData, t: 4 })
    + (getCosmoBonus({ majik: holesObject?.holeMajiks, t: 0, i: 2 })
      + (getBellBonus({ holesObject, t: 3 })
        + (getMonumentBonus({ holesObject, t: 1, i: 7 })
          + 100 * getStudyBonus(holesObject, 6, 0))))) / 100;
}

const getFutureWishCosts = (curLevel, maxLevel, index) => {
  let costs = [];
  for (let i = curLevel; i < maxLevel; i++) {
    costs.push(getWishCost(i, index));
  }
  return costs ?? 0;
}

// 'LampWishCost'
const getWishCost = (wishLevel, t) => {
  return 0 === t
    ? 11 > (wishLevel)
      ? Math.floor(1 + (2 * (wishLevel)
        + Math.pow((wishLevel), 2)))
      : 999999
    : 2 === t
      ? Math.floor(1 + (2 * (wishLevel)
        + Math.pow((wishLevel), 1.7)))
      : Math.floor((wishLevel)
        * (lampWishes[t]?.x2)
        + (lampWishes[t]?.x1))
}

// 'LampBonuses'
export const getLampBonus = ({ holesObject, t, i }) => {
  const raw = '25,10,8;15,40,10;20,35,12;1,1,1;2,2,2';
  return 99 === t
    ? 25 * holesObject?.wishesUsed?.[7]
    : (raw.split(';')[t].split(',')[i]
      * holesObject?.wishesUsed?.[Math.min(11, Math.round(4 + 2 * t))])

}
