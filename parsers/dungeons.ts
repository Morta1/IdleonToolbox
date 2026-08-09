import { growth, tryToParse } from '@utility/helpers';
import {
  ballsBonuses,
  dungeonCreditShop,
  dungeonFlurboStats,
  dungeonStats,
  dungeonTraits,
  randomList
} from '@website-data';
import { liveEntries } from '@parsers/catalog';
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

// Classification: CATALOG-BACKED. `dungeonCreditShop` (the RNG credit shop), `dungeonStats` (the
// "inside" trait upgrades) and `dungeonFlurboStats` (the flurbo shop) are website-data catalogs
// defining every upgrade/item that exists; the save only supplies each one's level via a handful of
// positional arrays inside `DungUpg`. A missing save means every level is 0, not a shorter list.
const parseDungeons = (dungeonUpgrades: any, accountOptions: any[] | undefined): Record<string, any> => {
  const opts = accountOptions ?? [];
  const rngItemsRaw = dungeonUpgrades?.[0];
  const insideUpgradesRaw = dungeonUpgrades?.[1];
  const statBoostsRaw = dungeonUpgrades?.[2];
  const flurbosUpgradesRaw = dungeonUpgrades?.[5];

  const rngItems = liveEntries<any>(dungeonCreditShop).map(({ entry, index }) => ({ ...entry, level: rngItemsRaw?.[index] ?? 0 }));
  let counter = 0;
  const statBoosts = dungeonTraits?.map((trait: any) => ({
    ...trait, bonuses: trait?.bonuses?.map((bonus: any) => {
      const isActive = statBoostsRaw?.includes(counter);
      const bonusIndex = counter;
      counter++;
      return { bonus, isActive, bonusIndex }
    })
  }));
  const insideUpgrades = liveEntries<any>(dungeonStats).map(({ entry, index }) => ({ ...entry, level: insideUpgradesRaw?.[index] ?? 0 }));
  const upgrades = liveEntries<any>(dungeonFlurboStats).map(({ entry, index }) => ({ ...entry, level: flurbosUpgradesRaw?.[index] ?? 0 }));
  const credits = opts?.[72] || 0;
  const flurbos = opts?.[73] || 0;
  const boostedRuns = opts?.[76] || 0;
  const dungeonLevels = randomList?.[29] ?? [];
  const progress = opts[71];
  const rank =
    Number(
      dungeonLevels.reduce((rank: string, req: string, index: number, _: any) => {
        if (opts[71] > Number(req)) {
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
