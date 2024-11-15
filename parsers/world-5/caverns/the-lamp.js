import { lampWishes } from '../../../data/website-data';
import { getCosmoBonus, getMeasurementBonus } from '@parsers/world-5/hole';
import { getBellBonus } from '@parsers/world-5/caverns/the-bell';
import { notateNumber } from '@utility/helpers';

export const getLamp = (holesObject, accountData, unlockedCaverns) => {
  const wishPerDay = getWishPerDay(holesObject, accountData, unlockedCaverns);
  const wishes = lampWishes.map((wish, index) => {
    const cost = getWishCost(holesObject, index);
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
    return { ...wish, cost, description: desc };
  });
  return { wishes, wishPerDay };
}

const getWishPerDay = (holesObject, accountData, unlockedCaverns) => {
  return 6 > unlockedCaverns
    ? 0
    : 1 + (getMeasurementBonus({ holesObject, accountData, t: 4 })
    + (getCosmoBonus({ majik: holesObject?.holeMajiks, t: 0, i: 2 })
      + getBellBonus({ holesObject, t: 3 }))) / 100;
}

// 'LampWishCost'
const getWishCost = (holesObject, t) => {
  return 0 === t
    ? 11 > (holesObject?.wishesUsed?.[t])
      ? Math.floor(1 + (2 * (holesObject?.wishesUsed?.[t])
        + Math.pow((holesObject?.wishesUsed?.[t]), 2)))
      : 999999
    : 2 === t
      ? Math.floor(1 + (2 * (holesObject?.wishesUsed?.[t])
        + Math.pow((holesObject?.wishesUsed?.[t]), 1.7)))
      : Math.floor((holesObject?.wishesUsed?.[t])
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
