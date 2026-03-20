import { growth, tryToParse } from '@utility/helpers';
import { guildBonuses, guildTasks } from '@website-data';
import type { IdleonData, GuildData } from './types';

export interface GuildBonusEntry {
  level: number;
  func?: string;
  x1?: number;
  x2?: number;
  gpBaseCost?: number;
  gpIncrease?: number;
  [key: string]: unknown;
}

export interface GuildMemberParsed {
  name: string;
  level: number;
  gpEarned: number;
  wantedBonus: GuildBonusEntry | number;
  rank: number;
}

export interface GuildTaskEntry {
  progress: number;
  [key: string]: unknown;
}

export interface GuildResult {
  guildBonuses: GuildBonusEntry[];
  guildTasks: { daily: GuildTaskEntry[] | undefined; weekly: GuildTaskEntry[] | undefined };
  members: GuildMemberParsed[] | undefined;
  maxMembers: number;
  level: number;
  levelReq: number;
  totalGp: number;
}

export const getGuild = (idleonData: IdleonData, guildData: GuildData | null): GuildResult | null => {
  if (!guildData) {
    return null;
  }
  const guildRaw = tryToParse(idleonData?.Guild) || (idleonData as any)?.GuildTasks;
  const parsedGuildTasks = parseGuildTasks(guildRaw);
  const updatedGuildBonuses = guildBonuses?.map((guildBonus: any, index: number) => ({
    ...guildBonus,
    level: guildData?.stats?.[0]?.[index] ?? 0
  }))
  if (guildData) {
    const totalPoints = getGuildTotalPoints(guildRaw, updatedGuildBonuses, guildData?.points ?? 0)
    const level = getGuildLevel(totalPoints);
    const maxMembers = 30 + 4 * level;
    const levelReq = getGuildLevelReq(guildRaw, totalPoints)
    const members = parseGuildMembers(guildData, updatedGuildBonuses);
    const totalStatCost = updatedGuildBonuses?.reduce((sum: number, { level }: any, index: number) => sum + calculateGuildBonusCost(level,
      guildBonuses?.[index]?.gpBaseCost, guildBonuses?.[index]?.gpIncrease), 0);
    const totalGp = (guildData?.points ?? 0) + totalStatCost;
    return {
      guildBonuses: updatedGuildBonuses,
      guildTasks: parsedGuildTasks,
      members,
      maxMembers,
      level,
      levelReq,
      totalGp
    }
  }
  return null;
}

const getGuildTotalPoints = (guildRaw: any, guildBonuses: any[], points: number): number => {
  let guildPoints = points;
  for (let e = 0; 18 > e;) {
    const t = e++;
    const gp = guildRaw?.[0]?.[t] || 0
    0 !== gp && (guildPoints +=
      Math.round((((guildBonuses?.[t]?.gpBaseCost + guildBonuses?.[t]?.gpIncrease) / guildBonuses?.[t]?.gpIncrease + 0.5 * (gp - 1)) /
        (guildBonuses?.[t]?.gpBaseCost / guildBonuses?.[t]?.gpIncrease)) * gp * guildBonuses?.[t]?.gpBaseCost - guildBonuses?.[t]?.gpIncrease * gp))
  }
  return guildPoints;
}
const getGuildLevelReq = (guildRaw: any, points: number): number => {
  for (let e = 0; 100 > e;) {
    const n = e++;
    if (!(points >= 100 * (n + 1) * Math.pow(1.21, n))) {
      return 100 * (n + 1) * Math.pow(1.21, n);
    }
  }
  return 0;
}

export const getGuildLevel = (points: number): number => {
  for (let e = 0; 100 > e;) {
    const n = e++;
    if (!(points >= 100 * (n + 1) * Math.pow(1.21, n))) {
      return Math.min(n + 1, 45);
    }
  }
  return 1;
}

export const getGuildBonusBonus = (guildBonuses: GuildBonusEntry[] | undefined, bonusIndex: number): number => {
  const guildBonus = guildBonuses?.[bonusIndex];
  if (!guildBonus) return 0;
  return growth(guildBonus.func, guildBonus.level, guildBonus.x1, guildBonus.x2, false) ?? 0;
}

const parseGuildMembers = (guildData: GuildData, bonuses: any[]): GuildMemberParsed[] | undefined => {
  return guildData?.members?.map(({ a, b, c, d, e, f, g }: any) => {
    return {
      name: a,
      level: d,
      gpEarned: e,
      wantedBonus: bonuses?.[f] || -1,
      rank: g
    }
  })
}

const parseGuildTasks = (guildRaw: any) => {
  const tasks = guildRaw?.slice(1)?.map(([index, , progress]: any) => {
    return {
      ...guildTasks?.[index],
      progress,
    }
  })
  return {
    daily: tasks?.slice(0, 5),
    weekly: tasks?.slice(5)
  };
}

export const calculateGuildBonusCost = (targetLvl: number, baseCost: number, costPerLvl: number): number => {
  if (targetLvl === 0) return 0;
  let cost = baseCost;
  for (let i = 1; i < targetLvl; i++) cost += (baseCost + (i * costPerLvl));
  return cost;
};
