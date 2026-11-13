import { cookingMenu, gameTables } from '@website-data';
import { tryToParse } from '@utility/helpers';
import type { IdleonData } from './types';

// game: the purchase panel prints "YOU_HAVE_BOUGHT: x/max" only below this; the rows at 100000 have no real cap
const UNLIMITED_FROM = 50000;
// game: MTXinfo[2][2][7], New Meal, which the purchase panel blocks once every meal is owned
const NEW_MEAL_INDEX = 126;
const { daily: DAILY_RESTOCK, weekly: WEEKLY_RESTOCK } = gameTables.gemShopRestocks;

export const isUnlimitedGemItem = (maxPurchases: number) => maxPurchases >= UNLIMITED_FROM;
export const isNewMeal = (globalIndex: number) => globalIndex === NEW_MEAL_INDEX;

// The game sets these items' bought count back to 0 every day or week, so their max is a period's stock
export const gemItemRestock = (globalIndex: number): 'day' | 'week' | null => DAILY_RESTOCK.includes(globalIndex)
  ? 'day'
  : WEEKLY_RESTOCK.includes(globalIndex) ? 'week' : null;

// game: the panel counts `Meals[0][e] >= 1` over every MealINFO row; null when the cooking section is missing
export const mealsLeftToUnlock = (account: any): number | null => {
  const meals = account?.cooking?.meals;
  if (!Array.isArray(meals)) return null;
  return Math.max(0, cookingMenu.length - meals.filter(({ level }: any) => level >= 1).length);
};

// The gems from `bought` to the cap, the nth purchase costing baseCost + n * costIncrement as the panel prices it
export const gemCostToMax = (baseCost: number, costIncrement: number, bought: number, maxPurchases: number) => {
  let total = 0;
  for (let i = bought; i < maxPurchases; i++) total += baseCost + i * costIncrement;
  return total;
};

export const getGemShop = (idleonData: IdleonData) => {
  const gemShopRaw = tryToParse(idleonData?.GemItemsPurchased) || idleonData?.GemItemsPurchased;
  return parseGemShop(gemShopRaw);
}

export const parseGemShop = (gemShopRaw: unknown) => {
  return gemShopRaw;
}
