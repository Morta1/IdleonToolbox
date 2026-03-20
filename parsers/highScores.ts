import type { IdleonData, Account } from './types';

const colosseumIndexMapping: Record<number, string> = { 0: 'dewdrop', 1: 'sandstone', 2: 'chillsnap', 3: 'astro', 4: 'molten', 5: 'whimsical' };
const minigameIndexMapping: Record<number, string> = { 0: 'chopping', 1: 'fishing', 2: 'catching', 3: 'mining' };

export interface HighscoreEntry {
  name: string;
  score: number;
  totalPoints?: number;
  upgrades?: MinigameUpgrade[];
}

export interface MinigameUpgrade {
  description: string;
  pointsToUnlock: number;
  level: number;
  unlocked: boolean;
  cost: number;
}

export interface Highscores {
  coloHighscores: HighscoreEntry[];
  minigameHighscores: HighscoreEntry[];
}

export const getHighscores = (idleonData: IdleonData, account: Account): Highscores => {
  const coloHighscores = (idleonData as any)?.FamilyValuesMap?.ColosseumHighscores || idleonData?.FamValColosseumHighscores;
  const minigameHighscores = (idleonData as any)?.FamilyValuesMap?.MinigameHiscores || idleonData?.FamValMinigameHiscores;

  return {
    coloHighscores: parseColosseum(coloHighscores as number[]),
    minigameHighscores: parseMinigame(minigameHighscores as number[]).concat([
      {
        name: 'pen pals',
        score: (account?.accountOptions as any)?.[99] || 0
      }, {
        name: 'poing',
        score: (account?.gaming as any)?.poingHighscore
      },
      {
        name: 'hoops',
        score: (account?.accountOptions as any)?.[242] || 0,
        ...getHoopsData(account)
      },
      {
        name: 'darts',
        score: (account?.accountOptions as any)?.[442] || 0,
        ...getDartsData(account)
      },
      {
        name: 'spiketrap',
        score: (account?.accountOptions as any)?.[201] || 0,
      }
    ])
  }
}

const parseColosseum = (coloHighscores: number[]): HighscoreEntry[] => {
  return coloHighscores.slice(1)
    .filter((_, index) => colosseumIndexMapping[index])
    .map((score, index) => ({ name: colosseumIndexMapping[index], score: parseFloat(String(score)) }));
}

const parseMinigame = (coloHighscores: number[]): HighscoreEntry[] => {
  return coloHighscores
    .filter((_, index) => minigameIndexMapping[index])
    .map((score, index) => ({ name: minigameIndexMapping[index], score }));
}

export const calcColoTotalScore = (colo: HighscoreEntry[] | undefined): number => {
  return colo?.reduce((res, { score }) => res + score, 0) ?? 0;
}

export const calcMinigameTotalScore = (colo: HighscoreEntry[] | undefined): number => {
  return colo?.reduce((res, { score }, index) => res + (index < 5 ? score : 0), 0) ?? 0;
}

export const getDartsData = (account: Account): { totalPoints: number; upgrades: MinigameUpgrade[] } => {
  const upgradeTexts = ["+{%_Extra_Damage_against_Monsters!", "+{_Talent_PTS_for_the_first_page!", "All_Vault_upgrades_are_}x_Cheaper!", "+{%_Movement_Speed,_so_you_can_run_faster!"];
  const upgradeReqs = [0, 40, 150, 250];
  const points = (account?.accountOptions as any)?.slice(435, 439) ?? [0, 0, 0, 0];
  const totalPoints = points.reduce((res: number, point: number) => res + point, 0);
  const upgrades = upgradeTexts.map((text, index) => ({
    description: text.replace('{', points[index]),
    pointsToUnlock: upgradeReqs[index],
    level: points[index],
    unlocked: points[index] > 0,
    cost: 1 == index ? Math.floor(3 + points[index] / 0.25) : 3 == index ? Math.floor(5 + points[index] / 0.05) : Math.floor(2 + points[index] / 12)
  }));

  return {
    totalPoints,
    upgrades
  }
}

export const getHoopsData = (account: Account): { totalPoints: number; upgrades: MinigameUpgrade[] } => {
  const upgradeTexts = ["+{%_Damage_to_Monsters", "+{%_Coins_dropped_by_monsters", "+{%_Class_EXP_when_killing_monsters", "+{%_Efficiency_for_all_Skills,_like_Mining_and_Choppin!"];
  const upgradeReqs = [0, 12, 80, 200];
  const points = (account?.accountOptions as any)?.slice(419, 423) ?? [0, 0, 0, 0];
  const totalPoints = points.reduce((res: number, point: number) => res + point, 0);
  const upgrades = upgradeTexts.map((text, index) => ({
    description: text.replace('{', points[index]),
    pointsToUnlock: upgradeReqs[index],
    level: points[index],
    unlocked: points[index] > 0,
    cost: 1 == index ? Math.floor(3 + points[index] / 0.25) : 3 == index ? Math.floor(5 + points[index] / 0.05) : Math.floor(2 + points[index] / 12)
  }));

  return {
    totalPoints,
    upgrades
  }
}
