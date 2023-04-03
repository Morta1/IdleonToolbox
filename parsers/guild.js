import { growth, tryToParse } from "../utility/helpers";
import { guildBonuses, guildTasks } from "../data/website-data";

export const getGuild = (idleonData, guildData) => {
  let guildBonuses;
  if (!guildData) {
    guildBonuses = {
      guildIconIndex: '',
      guildName: '',
      guildBonuses: []
    }
  }
  const guildRaw = tryToParse(idleonData?.Guild) || idleonData?.GuildTasks;
  const guildTasks = parseGuildTasks(guildRaw);
  const updatedGuildBonuses = guildBonuses?.map((guildBonus, index) => ({
    ...guildBonus,
    level: guildData?.stats?.[0]?.[index] ?? 0
  }))
  if (guildData) {
    guildBonuses = {
      iconIndex: guildData?.i ?? '',
      name: guildData?.n ?? '',
      bonuses: updatedGuildBonuses
    }
  }
  return {
    guildBonuses,
    guildTasks
  }
}

export const getGuildBonusBonus = (guildBonuses, bonusIndex) => {
  const guildBonus = guildBonuses?.[bonusIndex];
  if (!guildBonus) return 0;
  return growth(guildBonus.func, guildBonus.level, guildBonus.x1, guildBonus.x2, false) ?? 0;
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