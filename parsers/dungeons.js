import { growth, tryToParse } from '../utility/helpers';
import {
  ballsBonuses,
  dungeonCreditShop,
  dungeonFlurboStats,
  dungeonStats,
  dungeonTraits,
  randomList
} from '../data/website-data';
import { getStampsBonusByEffect } from './stamps';
import { getBribeBonus } from './bribes';
import { getVialsBonusByStat } from './alchemy';
import { getAchievementStatus } from './achievements';
import { isPast, isThursday, nextThursday, previousThursday, startOfToday } from 'date-fns';

export const getDungeons = (idleonData, accountOptions) => {
  const dungeonUpgradesRaw = tryToParse(idleonData?.DungUpg);
  return parseDungeons(dungeonUpgradesRaw, accountOptions);
};

const parseDungeons = (dungeonUpgrades, accountOptions) => {
  const rngItems = dungeonCreditShop?.map((item, index) => ({ ...item, level: dungeonUpgrades?.[0]?.[index] }));
  const dungeonUpgradesRaw = dungeonUpgrades?.[1];
  const statBoostsRaw = dungeonUpgrades?.[2];
  let counter = 0;
  const statBoosts = dungeonTraits?.map((trait) => ({
    ...trait, bonuses: trait?.bonuses?.map((bonus) => {
      const isActive = statBoostsRaw?.includes(counter);
      const bonusIndex = counter;
      counter++;
      return { bonus, isActive, bonusIndex }
    })
  }));
  const flurbosUpgradesRaw = dungeonUpgrades?.[5];
  const insideUpgrades = dungeonUpgradesRaw?.map((level, index) => ({ ...dungeonStats[index], level }));
  const upgrades = flurbosUpgradesRaw?.map((level, index) => ({ ...dungeonFlurboStats[index], level }));
  const credits = accountOptions?.[72] || 0;
  const flurbos = accountOptions?.[73] || 0;
  const boostedRuns = accountOptions?.[76] || 0;
  const dungeonLevels = randomList?.[29].split(' ');
  const progress = accountOptions[71];
  const rank =
    Number(
      dungeonLevels.reduce((rank, req, index, _) => {
        if (accountOptions[71] > Number(req)) {
          rank = index.toString();
        }
        return rank;
      }, '0')
    ) + 1;
  const rankReq = dungeonLevels?.[rank];
  return {
    upgrades,
    insideUpgrades,
    credits,
    flurbos,
    boostedRuns,
    progress,
    rankReq,
    rank,
    rngItems,
    statBoosts
  };
};

export const getDungeonStatBonus = (dungeonStats, statName) => {
  const stat = dungeonStats?.find(({ effect }) => effect === statName);
  if (!stat) return 0;
  return growth(stat?.func, stat?.level, stat?.x1, stat?.x2, false) ?? 0;
};

export const getDungeonFlurboStatBonus = (upgrades, effectName) => {
  const stat = upgrades?.find(({ effect }) => effect === effectName);
  if (!stat) return 0;
  return growth(stat?.func, stat?.level, stat?.x1, stat?.x2, false) ?? 0;
};

export const getMaxClaimTime = (account) => {
  return Math.ceil(3600 * (48 + Math.min(10, getStampsBonusByEffect(account, 'hr_Arcade_Ball_claim_max_time'))));
}

export const getSecPerBall = (account) => {
  return 4e3 / (1 + (getBallBonus(account) + getBribeBonus(account?.bribes, 'Weighted_Marbles')) / 100)
}

export const getBallBonus = (account) => {
  let ballBonus = 0;
  for (let i = 0; i < ballsBonuses.length; i++) {
    const [a, b] = ballsBonuses[i];
    if (getAchievementStatus(account?.achievements, a) === 1) {
      ballBonus += b;
    }
  }
  const vialArcadeBonus = getVialsBonusByStat(account?.alchemy?.vials, 'arcadeBALLZ');
  const taskArcadeBonus = account?.tasks?.[2]?.[1]?.[7];
  const stampArcadeBonus = Math.min(50, getStampsBonusByEffect(account, 'Arcade_Ball_recharge_rate'));
  return ballBonus + vialArcadeBonus + (5 * taskArcadeBonus) + stampArcadeBonus;
}

export const getHappyHourDates = (happyHours, thursday) => {
  const secondsInHour = 60 * 60;
  return happyHours?.map((time) => {
    return time + Math.round(thursday / 1000) - secondsInHour;
  });
}

export const calcHappyHours = (happyHours) => {
  let lastThursday
  if (isThursday(startOfToday())) {
    lastThursday = startOfToday();
  } else {
    lastThursday = previousThursday(startOfToday());
    lastThursday = lastThursday.getTime() - lastThursday.getTimezoneOffset() * 60 * 1000;
  }
  const hhDates = getHappyHourDates(happyHours, lastThursday);
  const nextHappyHours = hhDates?.filter((time) => !isPast(time * 1000)).map((time) => time * 1000);
  if (nextHappyHours?.length === 0) {
    let futureThursday = nextThursday(startOfToday());
    futureThursday = futureThursday.getTime() - futureThursday.getTimezoneOffset() * 60 * 1000;
    return getHappyHourDates(happyHours, futureThursday);
  } else {
    return nextHappyHours;
  }
};