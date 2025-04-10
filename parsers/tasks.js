import { tryToParse } from '../utility/helpers';
import { merits, tasks, taskUnlocks as taskUnlocksData } from '../data/website-data';

export const getTasks = (idleonData) => {
  const tasksRaw = idleonData?.Tasks || [
    tryToParse(idleonData?.TaskZZ0),
    tryToParse(idleonData?.TaskZZ1),
    tryToParse(idleonData?.TaskZZ2),
    tryToParse(idleonData?.TaskZZ3),
    tryToParse(idleonData?.TaskZZ4),
    tryToParse(idleonData?.TaskZZ5),
    tryToParse(idleonData?.TaskZZ6)
  ];
  const tasksDescriptions = tasks?.map((worldTasks, worldIndex) => {
    return worldTasks?.map((task, taskIndex) => {
      const stat = tasksRaw?.[0]?.[worldIndex]?.[taskIndex];
      const level = tasksRaw?.[1]?.[worldIndex]?.[taskIndex];
      const meritReward = Math.round(1 + Math.floor(level / 5));
      let realTask = task;
      if (taskIndex === 8) {
        const randomTaskIndex = tasksRaw?.[5]?.[worldIndex];
        realTask = tasks?.[worldIndex]?.[8 + randomTaskIndex];
      }
      return {
        ...realTask,
        stat,
        level,
        meritReward
      }
    })
  })?.map((worldTasks) => worldTasks?.slice(0, 9));

  const meritsDescriptions = merits?.map((world, worldIndex) => {
    return world?.map((merit, meritIndex) => {
      const level = tasksRaw?.[2]?.[worldIndex]?.[meritIndex];
      return {
        ...merit,
        level
      }
    })
  });
  const taskUnlocksList = taskUnlocksData?.map((column, index) => {
    return column?.map((unlocks, ind) => {
      return {
        unlocks,
        unlocked: tasksRaw?.[3]?.[index]?.[ind]
      }
    })
  });
  const unlockedRecipes = tasksRaw?.[3]?.flat()?.reduce((sum, unlock) => sum + unlock, 0);
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

const parseTasks = (tasksRaw) => {
  return tasksRaw;
}

export const calcTotalTasks = (tasks) => {
  return tasks?.[1]?.reduce((sum, worldTasks) => {
    const worldSum = worldTasks.filter(((_, index) => index <= 7)).reduce((sum, amount) => sum + amount, 0);
    return sum + worldSum;
  }, 0);
}

const unlockPointsFormula = (index) => {
  return 9 * index + (2 * Math.max(0, index - 5) + (7 * Math.max(0, index - 12) + 11 * Math.max(0, index - 20))) + 1;
}

const getUnlockPointsOwned = (unlockPointsFormula, currentTaskValue) => {
  if (unlockPointsFormula(1) > currentTaskValue) return 0;

  let taskppNum2 = -10;
  let taskppNum = 0;

  for (let e = 0; e < 100; e++) {
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

const getPointsReq = (unlockPointsFormula, unlockPointsOwned, index) => {
  return 1 === index
    ? Math.round(unlockPointsFormula(unlockPointsOwned))
    : Math.round(unlockPointsFormula(Math.round(unlockPointsOwned + 1)));
}