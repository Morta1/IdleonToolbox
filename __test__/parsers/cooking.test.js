import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getCooking } from '@parsers/world-4/cooking';
import { liveCount } from '@parsers/catalog';
import { cookingMenu } from '@website-data';
import { tryToParse } from '@utility/helpers';
import first from '../fixtures/first.json';
import second from '../fixtures/second.json';
import third from '../fixtures/third.json';
import fourth from '../fixtures/fourth.json';
import latest from '../fixtures/latest.json';

describe('getCooking', () => {
  it('returns every live meal when the save is missing', () => {
    const result = getCooking(undefined, {}, []);
    expect(result.meals).toHaveLength(liveCount(cookingMenu));
    expect(result.meals.every((m) => m.level === 0 && m.amount === 0)).toBe(true);
  });

  it('never emits placeholder entries', () => {
    const result = getCooking(undefined, {}, []);
    expect(result.meals.some((m) => m.name?.startsWith('Some_'))).toBe(false);
  });

  it('carries catalog fields through', () => {
    const [firstMeal] = getCooking(undefined, {}, []).meals;
    expect(firstMeal.name).toBe('Turkey_of_Thank');
    expect(firstMeal.rawName).toBe('CookingMB0');
  });

  it('applies save levels at the right indexes', () => {
    const result = getCooking({ Meals: [[5, 3, 0, 0, 0]] }, {}, []);
    expect(result.meals[0].level).toBe(5);
    expect(result.meals[1].level).toBe(3);
    expect(result.meals[4].level).toBe(0);
  });

  it('returns the full menu even when the save is shorter than the catalog', () => {
    // Regression: the save-driven version only returned as many meals as the save's level list had.
    const result = getCooking({ Meals: [[5, 3, 0, 0, 0]] }, {}, []);
    expect(result.meals).toHaveLength(liveCount(cookingMenu));
    expect(result.meals[73].level).toBe(0);
  });
});

const FIXTURES = [['first', first], ['second', second], ['third', third], ['fourth', fourth], ['latest', latest]];

describe('getCooking fixture regression', () => {
  it.each(FIXTURES)('%s: meal levels/amounts the save covers are unchanged at the same index', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const mealsRaw = tryToParse(data?.Meals) || data?.Meals;
    const levels = mealsRaw?.[0];
    const amounts = mealsRaw?.[2];
    const { meals } = getCooking(data, {}, []);

    levels?.forEach((level, index) => {
      if (index >= meals.length) return;
      expect(meals[index].level).toBe(level);
    });
    amounts?.forEach((amount, index) => {
      if (index >= meals.length) return;
      expect(meals[index].amount).toBe(parseFloat(amount) || 0);
    });
  });

  it.each(FIXTURES)('%s: returns the full catalog length regardless of save length', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const { meals } = getCooking(data, {}, []);
    expect(meals).toHaveLength(liveCount(cookingMenu));
  });
});
