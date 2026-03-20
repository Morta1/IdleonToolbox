import { tryToParse } from '@utility/helpers';
import { achievements } from '@website-data';
import type { IdleonData } from './types';

export interface Achievement {
  steamIndex?: number;
  completed: boolean;
  currentQuantity?: number;
  [key: string]: unknown;
}

export const getAchievements = (idleonData: IdleonData): Achievement[] | undefined => {
  const achievementsRaw = tryToParse(idleonData?.AchieveReg) || idleonData?.AchieveReg;
  const steamAchievementsRaw = tryToParse(idleonData?.SteamAchieve) || idleonData?.SteamAchieve;
  return parseAchievements(achievementsRaw, steamAchievementsRaw);
}

const parseAchievements = (achievementsRaw: any, steamAchievementsRaw: any): Achievement[] | undefined => {
  return achievements?.map((achievement, index) => {
    const { steamIndex } = achievement;
    const completed = steamIndex ? steamAchievementsRaw?.[steamIndex] === -1 : achievementsRaw?.[index] === -1;
    const currentQuantity = steamIndex ? steamAchievementsRaw?.[steamIndex] : achievementsRaw?.[index];
    return { ...achievement, completed, ...(currentQuantity >= 0 ? { currentQuantity } : {}) }
  });
}

export const getAchievementStatus = (achievements: Achievement[] | undefined, achievementIndex: number): number => {
  const achievement = achievements?.[achievementIndex];
  if (!achievement || !achievement.completed) return 0;

  switch (achievementIndex) {
    case 4:
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
    case 112:
      return 20;
    default:
      return 1;
  }
}


export const calcTotalAchievements = (achievements: Achievement[]): number => {
  return achievements.reduce((sum, { completed }) => completed ? sum + 1 : sum, 0);
}
