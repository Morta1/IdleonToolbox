import { growth } from "../utility/helpers";
import { guildBonuses } from "../data/website-data";

export const getGuild = (guildData) => {
  if (!guildData) return {
    guildIconIndex: '',
    guildName: '',
    guildBonuses: []
  }

  const updatedGuildBonuses = guildBonuses?.map((guildBonus, index) => ({
    ...guildBonus,
    level: guildData?.stats?.[0]?.[index] ?? 0
  }))
  return {
    guildIconIndex: guildData?.i ?? '',
    guildName: guildData?.n ?? '',
    guildBonuses: updatedGuildBonuses
  }
}

export const getGuildBonusBonus = (guildBonuses, bonusIndex) => {
  const guildBonus = guildBonuses?.[bonusIndex];
  if (!guildBonus) return 0;
  return growth(guildBonus.func, guildBonus.level, guildBonus.x1, guildBonus.x2, false) ?? 0;
}