import { weeklyBosses, weeklyBossesActions, weeklyBossesShop, weeklyBossesTasks } from '../../data/website-data';
import LavaRand from '../../utility/lavaRand';
import { lavaLog } from '@utility/helpers';
import { getMaxDamage } from '../damage';

const getBossId = (seed) => {
  return Math.max(0, Math.min(weeklyBosses?.length - 1, Math.floor((seed / 1e3) * weeklyBosses?.length)))
}

const getBossMaxHp = (account, bossId) => {
  return weeklyBosses[bossId].x4 * Math.pow(weeklyBosses[bossId].x5, account?.accountOptions?.[187]);
}

const getTasksIds = (bossId, seed) => {
  const tasksIds = [];
  for (let i = 0; i < 15; i++) {
    const taskRng = new LavaRand(Math.round(seed + 3 * i));
    const taskRandom = Math.max(0, Math.min(2, Math.floor(3 * taskRng.rand())));
    const taskId = weeklyBosses[bossId];
    tasksIds.push(taskId?.[`x${taskRandom + 1}`]);
  }
  return tasksIds;
}

const getShopItems = (seed) => {
  const firstRng = new LavaRand(Math.round(seed + 36));
  const firstRandom = Math.max(0, Math.min(weeklyBossesShop[0].length - 1, Math.floor(firstRng.rand() * weeklyBossesShop[0].length)));
  let secondRng = new LavaRand(Math.round(seed + 72));
  let secondRandom = Math.max(0, Math.min(weeklyBossesShop[0].length - 1, Math.floor(secondRng.rand() * weeklyBossesShop[0].length)));
  let l = 0;
  while (firstRandom === secondRandom && l < 100) {
    l += 1;
    secondRng = new LavaRand(seed + l);
    secondRandom = Math.max(0, Math.min(weeklyBossesShop[0].length - 1, Math.floor(secondRng.rand() * weeklyBossesShop[0].length)));
  }
  const thirdRng = new LavaRand(Math.round(seed + 10));
  const thirdRandom = Math.max(0, Math.min(weeklyBossesShop[1].length - 1, Math.floor(thirdRng.rand() * weeklyBossesShop[1].length)));
  let fourthRng = new LavaRand(Math.round(seed + 20));
  let fourthRandom = Math.max(0, Math.min(weeklyBossesShop[1].length - 1, Math.floor(fourthRng.rand() * weeklyBossesShop[1].length)));
  let k = 0;
  while (thirdRandom === fourthRandom && k < 710) {
    k += 71;
    fourthRng = new LavaRand(seed + k);
    fourthRandom = Math.max(0, Math.min(weeklyBossesShop[1].length - 1, Math.floor(fourthRng.rand() * weeklyBossesShop[1].length)));
  }
  return {
    shopItems: [weeklyBossesShop?.[0]?.[firstRandom], weeklyBossesShop?.[0]?.[secondRandom],
      weeklyBossesShop?.[1]?.[thirdRandom], weeklyBossesShop?.[1]?.[fourthRandom]],
    extraSeed: l + k
  }
}

const MAX_ACCUMULATOR_SIZE = 9;
export const getWeeklyBoss = (account) => {
  if (!account) return [];
  const seed = Math.round(Math.floor(account?.timeAway?.GlobalTime / 604800));
  const weeklyBossesList = [];
  for (let i = 0; i < 10; i++) {
    const rng = new LavaRand(seed + i);
    const random = Math.floor(rng.rand() * 1e3);
    const { shopItems, extraSeed } = getShopItems(random);
    const bossId = getBossId(random);
    const tasks = getTasksIds(bossId, random)?.map((taskIndex) => ({
      ...weeklyBossesTasks?.[taskIndex],
      taskIndex
    }));
    const { bossName } = weeklyBosses?.[bossId] || {};
    let currentSeed = extraSeed;
    let triplets = [], accumulator = [];
    for (let j = 0; j < 15; j++) {
      const triplet = [];
      for (let k = 0; k < 3; k++) {
        currentSeed += 1e3;
        let anotherRng = new LavaRand(random + currentSeed);
        let anotherRandom = Math.max(0, Math.min(weeklyBossesActions?.length - 1, Math.floor(anotherRng.rand() * weeklyBossesActions?.length)));
        if (accumulator.includes(anotherRandom)) {
          let l = 0;
          while (accumulator.includes(anotherRandom) && l < 100) {
            currentSeed += 1e3;
            anotherRng = new LavaRand(random + currentSeed);
            anotherRandom = Math.max(0, Math.min(weeklyBossesActions?.length - 1, Math.floor(anotherRng.rand() * weeklyBossesActions?.length)));
            l++;
          }
        }
        triplet.push(anotherRandom);
        accumulator.unshift(anotherRandom);

        if (accumulator.length > MAX_ACCUMULATOR_SIZE) {
          accumulator.pop();
        }
      }
      triplets.push(triplet);
    }
    const dateInMs = Math.floor((seed + i) * 604800 * 1000);
    triplets = triplets.map((triplet, index) => ({
      actions: triplet.map((index) => weeklyBossesActions?.[index]),
      task: tasks?.[index]
    }));
    weeklyBossesList.push({ bossName, shopItems, triplets, date: new Date(dateInMs) });
  }
  return weeklyBossesList;
}

export const getTaskQuantity = (turn, bossId, account, characters) => {
  if (turn >= characters?.length) return 0;
  const character = characters?.[turn];
  const playerInfo = getMaxDamage(character, characters, account);
  if (bossId === 0) return character?.skillsInfo?.mining?.level;
  if (bossId === 1) return character?.skillsInfo?.fishing?.level;
  if (bossId === 2) return character?.skillsInfo?.chopping?.level;
  if (bossId === 3) return character?.skillsInfo?.worship?.level;
  if (bossId === 4) return character?.skillsInfo?.alchemy?.level;
  if (bossId === 5) return character?.skillsInfo?.catching?.level;
  if (bossId === 6) return character?.skillsInfo?.trapping?.level;
  if (bossId === 7) return character?.skillsInfo?.cooking?.level;
  if (bossId === 8) return character?.skillsInfo?.laboratory?.level;
  if (bossId === 9) return character?.skillsInfo?.divinity?.level;
  if (bossId === 24) return character?.skillsInfo?.construction?.level;
  if (bossId === 10) return character?.maxHp;
  if (bossId === 11) return character?.maxMp;
  if (bossId === 12) return character?.accuracy;
  if (bossId === 13) return character?.defence?.value;
  if (bossId === 14) return 100 * character?.movementSpeed;
  if (bossId === 15) return character?.carryCapBags?.[0]?.capacityPerSlot;
  if (bossId === 16) return character?.questCompleted;
  if (bossId === 17) {
    return Math.ceil(lavaLog(character?.kills?.[53]));
  }
  return bossId === 18
    ? character?.level
    : bossId === 19
      ? Math.ceil(lavaLog(character?.kills?.[1]))
      : bossId === 20
        ? Math.ceil(lavaLog(character?.kills?.[116]))
        : bossId === 21
          ? Math.ceil(lavaLog(character?.kills?.[205]))
          : bossId === 22
            ? Math.ceil(lavaLog(playerInfo?.maxDamage))
            : bossId === 23
              ? Math.ceil(lavaLog(character?.kills?.[158]))
              : 0;
}