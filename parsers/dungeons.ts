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
import type { IdleonData, Account } from './types';

export const getDungeons = (idleonData: IdleonData, accountOptions: any[]): Record<string, any> => {
  const dungeonUpgradesRaw = tryToParse(idleonData?.DungUpg);
  return parseDungeons(dungeonUpgradesRaw, accountOptions);
};

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
  const progress = opts[71] || 0;
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
  const taskArcadeBonus = (account as any)?.tasks?.[2]?.[1]?.[7] ?? 0;
  const stampArcadeBonus = Math.min(50, getStampsBonusByEffect(account, 'Arcade_Ball_recharge_rate'));
  return ballBonus + vialArcadeBonus + (5 * taskArcadeBonus) + stampArcadeBonus;
}

const SECONDS_IN_WEEK = 60 * 60 * 24 * 7;
const SECONDS_IN_HOUR = 60 * 60;

// `weekStart` is in seconds, not milliseconds. Each `HappyHours` entry is the second-of-week the
// happy hour *ends* on (the game attribute is literally named TimeToEndOfNextHappyHour), so the
// hour is subtracted to get the moment it starts, which is what the site displays.
const getHappyHourDates = (happyHours: number[], weekStart: number): number[] => {
  return happyHours?.map((time: number) => {
    return time + weekStart - SECONDS_IN_HOUR;
  });
}

export const calcHappyHours = (happyHours: number[]): number[] => {
  // The game picks the next happy hour with `GlobalTime - 604800 * floor(GlobalTime / 604800)`,
  // and the unix epoch fell on a Thursday, so that anchor is always Thursday 00:00 *UTC*.
  // Deriving it from browser-local dates instead (date-fns startOfToday/previousThursday plus a
  // hand-rolled getTimezoneOffset correction) put every timer an offset's worth of hours out for
  // anyone outside UTC, so keep this as plain UTC modulo arithmetic.
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const weekStart = Math.floor(nowInSeconds / SECONDS_IN_WEEK) * SECONDS_IN_WEEK;
  const upcoming = getHappyHourDates(happyHours, weekStart)?.filter((time: number) => time > nowInSeconds);
  if (upcoming?.length) {
    return upcoming.map((time: number) => time * 1000);
  }
  // Every happy hour this week is done: roll over to the first one of next week.
  return getHappyHourDates(happyHours, weekStart + SECONDS_IN_WEEK)?.map((time: number) => time * 1000);
};
