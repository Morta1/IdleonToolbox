import { lampWishes } from '@website-data';
import { getCosmoBonus, getMeasurementBonus, getStudyBonus } from '@parsers/world-5/hole';
import { getBellBonus } from '@parsers/world-5/caverns/the-bell';
import { gameFill } from '@utility/helpers';
import { getMonumentBonus } from '@parsers/world-5/caverns/bravery';
import { getZenithBonus } from '@parsers/world-1/statues';
import { createBreakdown, flat } from '@parsers/breakdown';

// '|' is whichever option the player has selected in the wish UI, which the save doesn't say, so list them
const WISH_CHOICES: Record<number, string> = {
  1: 'Reset_Conjuror_PTS_Invested,_All_Opals_Invested,_Jar_Collectible_Enchantment_LVs_or_All_Summoning_Doublers',
  3: 'Bravery,_Justice_or_Wisdom_Monument'
};

export const getLamp = (holesObject: any, accountData: any, unlockedCaverns: any) => {
  const { value: wishPerDay, breakdown: wishPerDayBreakdown } = getWishPerDay(holesObject, accountData, unlockedCaverns);
  const currentWishes = holesObject?.extraCalculations?.[25];
  const wishes = lampWishes.map((wish, index) => {
    const timesWished = Number(holesObject?.wishesUsed?.[index]) || 0;
    const cost = getWishCost(holesObject?.wishesUsed?.[index], index);
    const futureCosts = getFutureWishCosts(holesObject?.wishesUsed?.[index] + 1, holesObject?.wishesUsed?.[index] + 6, index);
    let desc = wish?.description ?? '';
    if (WISH_CHOICES[index]) {
      desc = desc.replace('|', WISH_CHOICES[index]);
    }
    if (4 === index || 6 === index || 8 === index || 10 === index || 11 === index) {
      // game floors each bonus before printing it
      const t = Math.floor((index - 4 + Math.floor(index / 11)) / 2);
      const bonus = (i: number) => String(Math.floor(getLampBonus({ holesObject, t, i, account: accountData })));
      desc = desc.replace('{', bonus(0)).replace('}', bonus(1)).replace('~', bonus(2))
    }
    const resourceBonus = getLampBonus({ holesObject, t: 99, i: 0, account: accountData });
    desc = desc.replace('#', gameFill(1 + resourceBonus / 100, 'MultiplierInfo'))
      .replace('$', gameFill(1 + resourceBonus / 400, 'MultiplierInfo'));
    return { ...wish, timesWished, cost, futureCosts, description: desc, daysToAfford: getDaysToAfford(cost, currentWishes, wishPerDay) };
  });
  return { wishes, wishPerDay, wishPerDayBreakdown, currentWishes };
}

// game: "LampWishPerDay"
const getWishPerDay = (holesObject: any, accountData: any, unlockedCaverns: any) => {
  if (6 > unlockedCaverns) return { value: 0, breakdown: undefined };
  const measurement = getMeasurementBonus({ holesObject, accountData, t: 4 });
  const majik = getCosmoBonus({ majik: holesObject?.holeMajiks, t: 0, i: 2 });
  const bell = getBellBonus({ holesObject, t: 3 });
  const monument = getMonumentBonus({ holesObject, t: 1, i: 7 });
  const study = 100 * getStudyBonus(holesObject, 6, 0);
  const value = 1 + (measurement + (majik + (bell + (monument + study)))) / 100;
  const breakdown = createBreakdown('Wishes per day', value, [
    flat('Base', 1),
    flat('Measurement', measurement / 100),
    flat('Wishy Washy (Majik)', majik / 100),
    flat('The Bell', bell / 100),
    flat('Monument', monument / 100),
    flat('Study', study / 100)
  ], { combine: 'sum' });
  return { value, breakdown };
}

// game: each daily reset adds floor(LampWishPerDay + random) wishes, wishPerDay on average. 0 is affordable now,
// null never (no wishes per day)
const getDaysToAfford = (cost: number, held: number, wishPerDay: number) => {
  const missing = (Number(cost) || 0) - (Number(held) || 0);
  if (missing <= 0) return 0;
  return wishPerDay > 0 ? Math.ceil(missing / wishPerDay) : null;
}

const getFutureWishCosts = (curLevel: any, maxLevel: any, index: any) => {
  let costs: any[] = [];
  for (let i = curLevel; i < maxLevel; i++) {
    costs.push(getWishCost(i, index));
  }
  return costs ?? 0;
}

// game: "LampWishCost"
const getWishCost = (wishLevel: any, t: any) => {
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

// game: "LampBonuses"
export const getLampBonus = ({ holesObject, t, i, account }: any) => {
  const zenithBonus = 1 + getZenithBonus(account, 2) / 100;
  const raw = '25,10,8;15,40,10;20,35,12;5,1,1;2,2,2';
  return 99 === t
    ? 25 * (holesObject?.wishesUsed?.[7] ?? 0) * zenithBonus
    : (Number(raw.split(';')[t].split(',')[i])
      * (holesObject?.wishesUsed?.[Math.min(11, Math.round(4 + 2 * t))] ?? 0)) * zenithBonus;
}
