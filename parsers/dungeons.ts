import { growth, tryToParse } from '@utility/helpers';
import {
  ballsBonuses,
  dungeonCreditShop,
  dungeonFlurboStats,
  dungeonStats,
  dungeonTraits,
  randomList
} from '@website-data';
import { getStampsBonusByEffect } from './world-1/stamps';
import { getBribeBonus } from './world-1/bribes';
import { getVialsBonusByStat } from './world-2/alchemy';
import { getAchievementStatus } from './achievements';
import { isPast, isThursday, nextThursday, previousThursday, startOfToday } from 'date-fns';
import type { IdleonData, Account } from './types';

export const getDungeons = (idleonData: IdleonData, accountOptions: any[]): Record<string, any> => {
  const dungeonUpgradesRaw = tryToParse(idleonData?.DungUpg);
  return parseDungeons(dungeonUpgradesRaw, accountOptions);
};

const parseDungeons = (dungeonUpgrades: any, accountOptions: any[]): Record<string, any> => {
  const rngItems = dungeonCreditShop?.map((item: any, index: number) => ({ ...item, level: dungeonUpgrades?.[0]?.[index] }));
  const dungeonUpgradesRaw = dungeonUpgrades?.[1];
  const statBoostsRaw = dungeonUpgrades?.[2];
  let counter = 0;
  const statBoosts = dungeonTraits?.map((trait: any) => ({
    ...trait, bonuses: trait?.bonuses?.map((bonus: any) => {
      const isActive = statBoostsRaw?.includes(counter);
      const bonusIndex = counter;
      counter++;
      return { bonus, isActive, bonusIndex }
    })
  }));
  const flurbosUpgradesRaw = dungeonUpgrades?.[5];
  const insideUpgrades = dungeonUpgradesRaw?.map((level: any, index: number) => ({ ...dungeonStats[index], level }));
  const upgrades = flurbosUpgradesRaw?.map((level: any, index: number) => ({ ...dungeonFlurboStats[index], level }));
  const credits = accountOptions?.[72] || 0;
  const flurbos = accountOptions?.[73] || 0;
  const boostedRuns = accountOptions?.[76] || 0;
  const dungeonLevels = randomList?.[29];
  const progress = accountOptions[71];
  const rank =
    Number(
      dungeonLevels.reduce((rank: string, req: string, index: number, _: any) => {
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

export const getDungeonStatBonus = (dungeonStats: any[], statName: string): number => {
  const stat = dungeonStats?.find(({ effect }: any) => effect === statName);
  if (!stat) return 0;
  return growth(stat?.func, stat?.level, stat?.x1, stat?.x2, false) ?? 0;
};

export const getDungeonFlurboStatBonus = (upgrades: any[], effectName: string): number => {
  const stat = upgrades?.find(({ effect }: any) => effect === effectName);
  if (!stat) return 0;
  return growth(stat?.func, stat?.level, stat?.x1, stat?.x2, false) ?? 0;
};

export const getMaxClaimTime = (account: Account): number => {
  return Math.ceil(3600 * (48 + Math.min(10, getStampsBonusByEffect(account, 'hr_Arcade_Ball_claim_max_time'))));
}

export const getSecPerBall = (account: Account): number => {
  return 4e3 / (1 + (getBallBonus(account) + getBribeBonus((account as any)?.bribes, 'Weighted_Marbles')) / 100)
}

export const getBallBonus = (account: Account): number => {
  let ballBonus = 0;
  for (let i = 0; i < ballsBonuses.length; i++) {
    const [a, b] = ballsBonuses[i];
    if (getAchievementStatus((account as any)?.achievements, a) === 1) {
      ballBonus += b;
    }
  }
  const vialArcadeBonus = getVialsBonusByStat((account as any)?.alchemy?.vials, 'arcadeBALLZ');
  const taskArcadeBonus = (account as any)?.tasks?.[2]?.[1]?.[7];
  const stampArcadeBonus = Math.min(50, getStampsBonusByEffect(account, 'Arcade_Ball_recharge_rate'));
  return ballBonus + vialArcadeBonus + (5 * taskArcadeBonus) + stampArcadeBonus;
}

export const getHappyHourDates = (happyHours: number[], thursday: number): number[] => {
  const secondsInHour = 60 * 60;
  return happyHours?.map((time: number) => {
    return time + Math.round(thursday / 1000) - secondsInHour;
  });
}

export const calcHappyHours = (happyHours: number[]): number[] => {
  let lastThursday: any;
  if (isThursday(startOfToday())) {
    lastThursday = startOfToday();
  } else {
    lastThursday = previousThursday(startOfToday());
    lastThursday = lastThursday.getTime() - lastThursday.getTimezoneOffset() * 60 * 1000;
  }
  const hhDates = getHappyHourDates(happyHours, lastThursday);
  const nextHappyHours = hhDates?.filter((time: number) => !isPast(time * 1000)).map((time: number) => time * 1000);
  if (nextHappyHours?.length === 0) {
    let futureThursday: any = nextThursday(startOfToday());
    futureThursday = futureThursday.getTime() - futureThursday.getTimezoneOffset() * 60 * 1000;
    return getHappyHourDates(happyHours, futureThursday);
  } else {
    return nextHappyHours;
  }
};
