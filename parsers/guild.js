import { growth, tryToParse } from '../utility/helpers';
import { guildBonuses, guildTasks } from '../data/website-data';

export const getGuild = (idleonData, guildData) => {
  if (!guildData) {
    return null;
  }
  const guildRaw = tryToParse(idleonData?.Guild) || idleonData?.GuildTasks;
  const guildTasks = parseGuildTasks(guildRaw);
  const updatedGuildBonuses = guildBonuses?.map((guildBonus, index) => ({
    ...guildBonus,
    level: guildData?.stats?.[0]?.[index] ?? 0
  }))
  if (guildData) {
    const totalPoints = getGuildTotalPoints(guildRaw, updatedGuildBonuses, guildData?.points)
    const level = getGuildLevel(totalPoints);
    const maxMembers = 30 + 4 * level;
    const levelReq = getGuildLevelReq(guildRaw, totalPoints)
    const members = parseGuildMembers(guildData, updatedGuildBonuses);
    const totalStatCost = updatedGuildBonuses?.reduce((sum, { level }, index) => sum + calculateGuildBonusCost(level,
      guildBonuses?.[index]?.gpBaseCost, guildBonuses?.[index]?.gpIncrease), 0);
    const totalGp = guildData?.points + totalStatCost;
    return {
      guildBonuses: updatedGuildBonuses,
      guildTasks,
      members,
      maxMembers,
      level,
      levelReq,
      totalGp
    }
  }
}

const getGuildTotalPoints = (guildRaw, guildBonuses, points) => {
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
const getGuildLevelReq = (guildRaw, points) => {
  for (let e = 0; 100 > e;) {
    const n = e++;
    if (!(points >= 100 * (n + 1) * Math.pow(1.21, n))) {
      return 100 * (n + 1) * Math.pow(1.21, n);
    }
  }
  return 0;
}

export const getGuildLevel = (points) => {
  for (let e = 0; 100 > e;) {
    const n = e++;
    if (!(points >= 100 * (n + 1) * Math.pow(1.21, n))) {
      return Math.min(n + 1, 45);
    }
  }
  return 1;
}

export const getGuildBonusBonus = (guildBonuses, bonusIndex) => {
  const guildBonus = guildBonuses?.[bonusIndex];
  if (!guildBonus) return 0;
  return growth(guildBonus.func, guildBonus.level, guildBonus.x1, guildBonus.x2, false) ?? 0;
}

const parseGuildMembers = (guildData, bonuses) => {
  return guildData?.members?.map(({ a, b, c, d, e, f, g }) => {
    return {
      name: a,
      level: d,
      gpEarned: e,
      wantedBonus: bonuses?.[f] || -1,
      rank: g
    }
  })
}

const parseGuildTasks = (guildRaw) => {
  const tasks = guildRaw?.slice(1)?.map(([index, , progress]) => {
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

export const calculateGuildBonusCost = (targetLvl, baseCost, costPerLvl) => {
  if (targetLvl === 0) return 0;
  let cost = baseCost;
  for (let i = 1; i < targetLvl; i++) cost += (baseCost + (i * costPerLvl));
  return cost;
};
