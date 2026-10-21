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
    // The game reads completion from AchieveReg alone (AchieveStatus, the achievements page, superbit 0). A
    // finished Steam achievement only adds 2 to its linked entry, which is not enough for Big Mobs Eek (5).
    const completed = achievementsRaw?.[index] === -1;
    // Most Steam-linked entries sit at 0 until the Steam side finishes, so the Steam counter is the useful progress
    const currentQuantity = steamIndex ? steamAchievementsRaw?.[steamIndex] : achievementsRaw?.[index];
    return { ...achievement, completed, ...(!completed && currentQuantity >= 0 ? { currentQuantity } : {}) }
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

// Every world reserves 70 slots, but the unused ones are fillers that the grid never renders.
const ACHIEVEMENTS_PER_WORLD = 70;
export const isRealAchievement = ({ name, visualIndex }: any): boolean => visualIndex !== -1 && !name?.includes('FILLER');

// A world's achievement slots in the grid's display order
export const getWorldAchievements = (achievements: Achievement[] | undefined, worldIndex: number): Achievement[] | undefined => {
  const start = worldIndex * ACHIEVEMENTS_PER_WORLD;
  return achievements?.slice(start, start + ACHIEVEMENTS_PER_WORLD)
    .sort((a: any, b: any) => a?.visualIndex - b?.visualIndex);
};

// The Achievements page header: completed / total per world that has any, then all worlds combined
export const getAchievementWorldTotals = (achievements: Achievement[] | undefined, worldNames: string[]) => {
  const worldTotals = worldNames.map((worldName, worldIndex) => {
    const list = getWorldAchievements(achievements, worldIndex)?.filter(isRealAchievement) ?? [];
    return {
      worldName,
      worldIndex,
      total: list.length,
      completed: list.filter(({ completed }) => completed).length
    };
  }).filter(({ total }) => total > 0);
  const combined = worldTotals.reduce((acc, { completed, total }) => ({
    completed: acc.completed + completed,
    total: acc.total + total
  }), { completed: 0, total: 0 });
  return { worldTotals, combined };
};
