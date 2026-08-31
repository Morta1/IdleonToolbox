import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getNoMealLeftBehindQueue } from '@parsers/world-4/cooking';

const account = { sneaking: { jadeEmporium: [{ name: 'No_Meal_Left_Behind', unlocked: true }] } };
const locked = { sneaking: { jadeEmporium: [{ name: 'No_Meal_Left_Behind', unlocked: false }] } };
const bundleOnly = { ...locked, bundles: [{ name: 'bun_s', owned: true }] };
const both = { ...account, bundles: [{ name: 'bun_s', owned: true }] };
const opts = { achievements: [], account, equinoxUpgrades: [], mealSpeed: 1 };

const meal = (index, level, amount = 0) => ({
  index,
  level,
  amount,
  cookReq: 1,
  name: `Meal_${index}`,
  rawName: `CookingMB${index}`
});

describe('getNoMealLeftBehindQueue', () => {
  it('returns nothing when neither the jade bonus nor the bundle is owned', () => {
    expect(getNoMealLeftBehindQueue([meal(0, 10)], 90, 5, { ...opts, account: locked })).toEqual([]);
  });

  it('procs off the Sacred Methods bundle alone, for 2 levels a time', () => {
    const queue = getNoMealLeftBehindQueue([meal(0, 10)], 90, 2, { ...opts, account: bundleOnly });
    expect(queue.map(({ fromLevel, toLevel }) => [fromLevel, toLevel])).toEqual([[10, 12], [12, 14]]);
  });

  it('stacks the bundle levels onto the jade level, all on the same meal', () => {
    // Without stacking, the second and third level would be re-picked onto meal 1.
    const queue = getNoMealLeftBehindQueue([meal(0, 10), meal(1, 11)], 90, 1, { ...opts, account: both });
    expect(queue.map(({ index, fromLevel, toLevel }) => [index, fromLevel, toLevel])).toEqual([[0, 10, 13]]);
  });

  it('clamps the last proc to the meal max level', () => {
    const queue = getNoMealLeftBehindQueue([meal(0, 88)], 90, 5, { ...opts, account: both });
    expect(queue.map(({ fromLevel, toLevel }) => [fromLevel, toLevel])).toEqual([[88, 90]]);
  });

  it('keeps procing the same meal until it catches up to the pack', () => {
    // alex_x90's account: two low meals, everything else at 111.
    const meals = [meal(0, 111), meal(1, 111), meal(40, 109), meal(41, 106)];
    const queue = getNoMealLeftBehindQueue(meals, 130, 8, opts);

    expect(queue.map(({ index, fromLevel }) => [index, fromLevel])).toEqual([
      [41, 106],
      [41, 107],
      [41, 108],
      [41, 109], // ties with 40 at 109, the higher index wins
      [40, 109],
      [41, 110],
      [40, 110],
      [41, 111] // caught up to the pack, and still first on the 111 tie
    ]);
    // The pack of 111s only starts getting procs once both stragglers have caught up.
    const longer = getNoMealLeftBehindQueue(meals, 130, 10, opts);
    expect(longer.slice(8).map(({ index }) => index)).toEqual([40, 1]);
  });

  it('breaks level ties towards the meal furthest down the book', () => {
    const queue = getNoMealLeftBehindQueue([meal(3, 20), meal(9, 20)], 90, 2, opts);
    expect(queue.map(({ index }) => index)).toEqual([9, 3]);
  });

  it('skips meals outside the level >= 2 and level < max window', () => {
    const meals = [meal(0, 1), meal(1, 90), meal(2, 40)];
    const queue = getNoMealLeftBehindQueue(meals, 90, 3, opts);
    expect(queue.every(({ index }) => index === 2)).toBe(true);
  });

  it('targets the low meals the game hits first', () => {
    const queue = getNoMealLeftBehindQueue([meal(0, 40), meal(1, 2)], 90, 1, opts);
    expect(queue.map(({ index }) => index)).toEqual([1]);
  });

  it('stops once every meal is capped', () => {
    const queue = getNoMealLeftBehindQueue([meal(0, 88)], 90, 10, opts);
    expect(queue).toHaveLength(2);
    expect(queue.map(({ fromLevel }) => fromLevel)).toEqual([88, 89]);
  });

  it('spends already-cooked amount on the first proc only', () => {
    const bare = getNoMealLeftBehindQueue([meal(0, 20)], 90, 2, opts);
    const stocked = getNoMealLeftBehindQueue([meal(0, 20, bare[0].ladles)], 90, 2, opts);

    expect(stocked[0].ladles).toBe(0);
    expect(stocked[1].ladles).toBe(bare[1].ladles);
  });

  it('scales ladle cost down by the overflowing ladle bonus', () => {
    const [plain] = getNoMealLeftBehindQueue([meal(0, 20)], 90, 1, opts);
    const [overflowed] = getNoMealLeftBehindQueue([meal(0, 20)], 90, 1, { ...opts, overflowMulti: 2 });
    expect(overflowed.ladles).toBeCloseTo(plain.ladles / 2);
  });

  it('does not mutate the meals it was given', () => {
    const meals = [meal(0, 20, 5)];
    getNoMealLeftBehindQueue(meals, 90, 5, opts);
    expect(meals[0]).toEqual({ index: 0, level: 20, amount: 5, cookReq: 1, name: 'Meal_0', rawName: 'CookingMB0' });
  });
});
