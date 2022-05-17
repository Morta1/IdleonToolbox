import { tryToParse } from "../utility/helpers";
import { achievements } from "../data/website-data";

export const getAchievements = (idleonData) => {
  const achievementsRaw = tryToParse(idleonData?.AchieveReg) || idleonData?.AchieveReg;
  const steamAchievementsRaw = tryToParse(idleonData?.SteamAchieve) || idleonData?.SteamAchieve;
  return parseAchievements(achievementsRaw, steamAchievementsRaw);
}

const parseAchievements = (achievementsRaw, steamAchievementsRaw) => {
  return achievements?.map((achievement, index) => {
    const { steamIndex } = achievement;
    const completed = steamIndex ? steamAchievementsRaw?.[steamIndex] === -1 : achievementsRaw?.[index] === -1;
    const currentQuantity = steamIndex ? steamAchievementsRaw?.[steamIndex] : achievementsRaw?.[index];
    return { ...achievement, completed, ...(currentQuantity >= 0 ? { currentQuantity } : {}) }
  });
}

export const getAchievementStatus = (achievements, achievementIndex) => {
  if (!achievements?.[achievementIndex]) return 0;
  switch (achievementIndex) {
    case 27:
    case 37:
    case 44:
    case 107:
    case 109:
    case 117:
      return 5;
    case 108:
      return 10;
    case 99:
    case 104:
    case 122:
      return 20;
    default:
      return achievements?.[achievementIndex]?.completed ? 1 : 0;
  }
}