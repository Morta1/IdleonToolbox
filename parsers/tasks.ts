import { tryToParse } from '@utility/helpers';
import { merits, tasks, taskUnlocks as taskUnlocksData } from '@website-data';
import type { IdleonData } from './types';

// Task slot 8 is the daily task: TaskDescriptions[w][8 + Tasks[5][w]]
const DAILY_TASK_INDEX = 8;

// game TaskStuff("MeritsGiven", level): merits paid for ranking a task up from `level`
const getMeritsGiven = (level: number): number => Math.round(1 + Math.floor(level / 5));

// The merit shop panel's first line (TaskShopDesc draw): on a row with options every `}` becomes the option for the
// level, then every `{` becomes the per-level bonus times the level. Blank420q marks a row with no options.
export const getMeritDescription = (merit: any, level: number): string => {
  const line = String(merit?.descLine1 ?? '');
  const withOption = merit?.extraStr && merit.extraStr !== 'Blank420q'
    ? line.split('}').join(merit.extraStr.split('|')[level] ?? '')
    : line;
  return withOption.split('{').join(String((merit?.bonusPerLevel ?? 0) * level));
};

export const getTasks = (idleonData: IdleonData): {
  tasks: any;
  tasksDescriptions: any;
  meritsDescriptions: any;
  unlockedRecipes: number;
  taskUnlocks: any;
} => {
  const tasksRaw: any = idleonData?.Tasks || [
    tryToParse(idleonData?.TaskZZ0),
    tryToParse(idleonData?.TaskZZ1),
    tryToParse(idleonData?.TaskZZ2),
    tryToParse(idleonData?.TaskZZ3),
    tryToParse(idleonData?.TaskZZ4),
    tryToParse(idleonData?.TaskZZ5),
    tryToParse(idleonData?.TaskZZ6)
  ];
  const tasksDescriptions = tasks?.map((worldTasks: any[], worldIndex: number) => {
    return worldTasks?.map((task: any, taskIndex: number) => {
      const stat = tasksRaw?.[0]?.[worldIndex]?.[taskIndex] ?? 0;
      const level = tasksRaw?.[1]?.[worldIndex]?.[taskIndex] ?? 0;
      const isDailyTask = taskIndex === DAILY_TASK_INDEX;
      let realTask = task;
      if (isDailyTask) {
        const randomTaskIndex = tasksRaw?.[5]?.[worldIndex] ?? 0;
        realTask = tasks?.[worldIndex]?.[DAILY_TASK_INDEX + randomTaskIndex];
      }
      const breakpoints = realTask?.breakpoints ?? [];
      // The daily task has one breakpoint and pays no merits; the rest rank up once per breakpoint
      const maxLevel = isDailyTask ? 1 : breakpoints.length;
      const requirement = isDailyTask
        ? Number(breakpoints[0] ?? 0)
        : level < maxLevel ? Number(breakpoints[level]) : null;
      return {
        ...realTask,
        stat,
        level,
        maxLevel,
        requirement,
        meritReward: isDailyTask ? 0 : getMeritsGiven(level)
      }
    })
  })?.map((worldTasks: any[]) => worldTasks?.slice(0, DAILY_TASK_INDEX + 1));

  const meritsDescriptions = merits?.map((world: any[], worldIndex: number) => {
    return world?.map((merit: any, meritIndex: number) => {
      const level = tasksRaw?.[2]?.[worldIndex]?.[meritIndex] ?? 0;
      return {
        ...merit,
        level,
        description: getMeritDescription(merit, level)
      }
    })
  });
  const taskUnlocksList = (taskUnlocksData as any[])?.map((column: any[], index: number) => {
    return column?.map((unlocks: any, ind: number) => {
      return {
        unlocks,
        unlocked: tasksRaw?.[3]?.[index]?.[ind]
      }
    })
  });
  const unlockedRecipes = tasksRaw?.[3]?.flat()?.reduce((sum: number, unlock: number) => sum + unlock, 0) ?? 0;
  const unlockPointsOwned = getUnlockPointsOwned(unlockPointsFormula, tasksRaw?.[4]?.[0]) ?? 0;
  const pointsReq = getPointsReq(unlockPointsFormula, unlockPointsOwned, 0) ?? 0;
  const taskUnlocks = {
    taskUnlocksList,
    unlockedRecipes,
    unlockPointsOwned,
    currentPoints: tasksRaw?.[4]?.[0] ?? 0,
    pointsReq
  }
  return { tasks: parseTasks(tasksRaw), tasksDescriptions, meritsDescriptions, unlockedRecipes, taskUnlocks };
}

const parseTasks = (tasksRaw: any): any => {
  return tasksRaw;
}

export const calcTotalTasks = (tasks: any): number => {
  return tasks?.[1]?.reduce((sum: number, worldTasks: number[]) => {
    const worldSum = worldTasks.filter(((_, index) => index <= 7)).reduce((sum: number, amount: number) => sum + amount, 0);
    return sum + worldSum;
  }, 0);
}

const unlockPointsFormula = (index: number): number => {
  return 9 * index + (2 * Math.max(0, index - 5) + (7 * Math.max(0, index - 12) + 11 * Math.max(0, index - 20))) + 1;
}

// game TaskStuff("UnlockPtsOwned") scans 150 blocks of 10 unlock levels
const UNLOCK_POINTS_SEARCH_STEPS = 150;

const getUnlockPointsOwned = (unlockPointsFormula: (index: number) => number, currentTaskValue: number): number => {
  if (unlockPointsFormula(1) > currentTaskValue) return 0;

  let taskppNum2 = -10;
  let taskppNum = 0;

  for (let e = 0; e < UNLOCK_POINTS_SEARCH_STEPS; e++) {
    taskppNum = 10 * (e + 1);

    if (unlockPointsFormula(taskppNum) > currentTaskValue) {
      for (let t = 0; t < 10; t++) {
        const offset = taskppNum - (t + 1);

        if (unlockPointsFormula(offset) <= currentTaskValue) {
          taskppNum2 = offset;
          break;
        }
      }
    }

    if (taskppNum2 > -1) break;
  }

  return taskppNum2;
}

const getPointsReq = (unlockPointsFormula: (index: number) => number, unlockPointsOwned: number, index: number): number => {
  return 1 === index
    ? Math.round(unlockPointsFormula(unlockPointsOwned))
    : Math.round(unlockPointsFormula(Math.round(unlockPointsOwned + 1)));
}
