import type { Account } from '../types';
import { weeklyBosses, weeklyBossesActions, weeklyBossesShop, weeklyBossesTasks } from '@website-data';
import LavaRand from '../../utility/lavaRand';
import { lavaLog } from '@utility/helpers';
import { getMaxDamage } from '../damage';
import { getAllCap } from '../misc';
import { getStampsBonusByEffect } from '../world-1/stamps';
import { getStarSignBonus } from '../starSigns';
import { getTalentBonus } from '../talents';
import { OPT } from '@parsers/accountOptions';

const getBossId = (seed: number): number => {
  return Math.max(0, Math.min(weeklyBosses?.length - 1, Math.floor((seed / 1e3) * weeklyBosses?.length)))
}

const getBossMaxHp = (account: Account, bossId: number): number => {
  return weeklyBosses[bossId].x4 * Math.pow(weeklyBosses[bossId].x5, (account as any)?.accountOptions?.[OPT.weeklyBossSkullTier]);
}

const getTasksIds = (bossId: number, seed: number): any[] => {
  const tasksIds: any[] = [];
  for (let i = 0; i < 15; i++) {
    const taskRng = new LavaRand(Math.round(seed + 3 * i));
    const taskRandom = Math.max(0, Math.min(2, Math.floor(3 * taskRng.rand())));
    const taskId = weeklyBosses[bossId];
    tasksIds.push((taskId as Record<string, any>)?.[`x${taskRandom + 1}`]);
  }
  return tasksIds;
}

const getShopItems = (seed: number): { shopItems: any[]; extraSeed: number } => {
  const firstRng = new LavaRand(Math.round(seed + 36));
  const firstRandom = Math.max(0, Math.min((weeklyBossesShop as any[][])[0].length - 1, Math.floor(firstRng.rand() * (weeklyBossesShop as any[][])[0].length)));
  let secondRng = new LavaRand(Math.round(seed + 72));
  let secondRandom = Math.max(0, Math.min((weeklyBossesShop as any[][])[0].length - 1, Math.floor(secondRng.rand() * (weeklyBossesShop as any[][])[0].length)));
  let l = 0;
  while (firstRandom === secondRandom && l < 100) {
    l += 1;
    secondRng = new LavaRand(seed + l);
    secondRandom = Math.max(0, Math.min((weeklyBossesShop as any[][])[0].length - 1, Math.floor(secondRng.rand() * (weeklyBossesShop as any[][])[0].length)));
  }
  const thirdRng = new LavaRand(Math.round(seed + 10));
  const thirdRandom = Math.max(0, Math.min((weeklyBossesShop as any[][])[1].length - 1, Math.floor(thirdRng.rand() * (weeklyBossesShop as any[][])[1].length)));
  let fourthRng = new LavaRand(Math.round(seed + 20));
  let fourthRandom = Math.max(0, Math.min((weeklyBossesShop as any[][])[1].length - 1, Math.floor(fourthRng.rand() * (weeklyBossesShop as any[][])[1].length)));
  let k = 0;
  while (thirdRandom === fourthRandom && k < 710) {
    k += 71;
    fourthRng = new LavaRand(seed + k);
    fourthRandom = Math.max(0, Math.min((weeklyBossesShop as any[][])[1].length - 1, Math.floor(fourthRng.rand() * (weeklyBossesShop as any[][])[1].length)));
  }
  return {
    shopItems: [(weeklyBossesShop as any[][])?.[0]?.[firstRandom], (weeklyBossesShop as any[][])?.[0]?.[secondRandom],
      (weeklyBossesShop as any[][])?.[1]?.[thirdRandom], (weeklyBossesShop as any[][])?.[1]?.[fourthRandom]],
    extraSeed: k
  }
}

const MAX_ACCUMULATOR_SIZE = 9;
export const getWeeklyBoss = (account: Account, weeks: number = 10) => {
  if (!account) return [];
  const seed = Math.round(Math.floor((account as any)?.timeAway?.GlobalTime / 604800));
  const weeklyBossesList: any[] = [];
  for (let i = 0; i < weeks; i++) {
    const rng = new LavaRand(seed + i);
    const random = Math.floor(rng.rand() * 1e3);
    const { shopItems, extraSeed } = getShopItems(random);
    const bossId = getBossId(random);
    const tasks = getTasksIds(bossId, random)?.map((taskIndex: number) => ({
      ...weeklyBossesTasks?.[taskIndex],
      taskIndex
    }));
    const { bossName } = weeklyBosses?.[bossId] || {};
    let currentSeed = extraSeed;
    let triplets: any[] = [], accumulator: number[] = [];
    for (let j = 0; j < 15; j++) {
      const triplet: number[] = [];
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
    triplets = triplets.map((triplet: number[], index: number) => ({
      actions: triplet.map((index: number) => weeklyBossesActions?.[index]),
      task: tasks?.[index]
    }));
    weeklyBossesList.push({ bossName, shopItems, triplets, date: new Date(dateInMs) });
  }
  return weeklyBossesList;
}

// game: MaxCapacity("HardCappy")
const CARRY_CAP_HARD_CAP = 205e7;
// Gem shop item 58 (Carry Capacity): +25% per purchase
const GEM_SHOP_CARRY_CAP_INDEX = 58;

// game: MaxCapacity("bCraftOtherPlayer"), the weekly boss "material bag size" task. Unlike the material
// bag on the item page it skips AllCapBASE (Upgrade Vault + the carry cap bundles) and counts the turn
// character's base Extra Bags level only. The star sign and AllCapBonuses come from the character the
// game is logged in as, so `loggedInCharacter` defaults to the turn character (what the game shows
// once that character is logged in).
export const getWeeklyBossCarryCap = (character: any, account: Account, loggedInCharacter: any = character): number => {
  const materialStamps = getStampsBonusByEffect(account, 'Carrying_Capacity_for_Material_Items', loggedInCharacter);
  const allCarryStamps = getStampsBonusByEffect(account, 'Carry_Capacity_for_ALL_item_types!');
  const gemShop = (account as any)?.gemShopPurchases?.[GEM_SHOP_CARRY_CAP_INDEX] ?? 0;
  const starSign = getStarSignBonus(loggedInCharacter, account, 'Carry_Cap');
  const extraBags = getTalentBonus(character?.flatTalents, 'EXTRA_BAGS', false, false, character?.addedLevels);
  const allCap = getAllCap(loggedInCharacter, account, false)?.value ?? 1;
  return Math.floor(Math.min(CARRY_CAP_HARD_CAP, (character?.maxCarryCap?.bCraft ?? 0)
    * (1 + materialStamps / 100)
    * (1 + (25 * gemShop) / 100)
    * (1 + (allCarryStamps + starSign) / 100)
    * (1 + extraBags / 100)
    * allCap));
};

// game: WeeklyBoss("TaskQTY"), for the character whose turn it is. HP, MP, accuracy, defence, speed and
// max damage are the logged-in character's in the game, so these read as if the turn character were
// logged in. The game draws the number rounded.
export const getTaskQuantity = (turn: number, bossId: number, account: Account, characters: any[]): number => {
  if (turn >= characters?.length) return 0;
  const character = characters?.[turn];
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
  if (bossId === 15) return getWeeklyBossCarryCap(character, account);
  // Unlike its neighbours this one isn't per character - the game reads the account-wide unique
  // quest count, so every character's turn contributes the same number.
  if (bossId === 16) return account?.totalQuestsCompleted;
  if (bossId === 17) return Math.ceil(lavaLog(character?.kills?.[53]));
  if (bossId === 18) return character?.level;
  if (bossId === 19) return Math.ceil(lavaLog(character?.kills?.[1]));
  if (bossId === 20) return Math.ceil(lavaLog(character?.kills?.[116]));
  if (bossId === 21) return Math.ceil(lavaLog(character?.kills?.[205]));
  if (bossId === 23) return Math.ceil(lavaLog(character?.kills?.[158]));
  if (bossId < 10 || bossId > 22) return 0;
  const playerInfo: any = getMaxDamage(character, characters, account);
  if (bossId === 10) return playerInfo?.maxHp;
  if (bossId === 11) return playerInfo?.maxMp;
  if (bossId === 12) return playerInfo?.accuracy;
  if (bossId === 13) return playerInfo?.defence?.value;
  // getPlayerSpeedBonus already returns the percent the game draws: round(100 x PlayerSpeedBonus)
  if (bossId === 14) return playerInfo?.movementSpeed;
  if (bossId === 22) return Math.ceil(lavaLog(playerInfo?.maxDamage));
  return 0;
}
