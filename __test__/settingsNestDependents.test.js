import { describe, expect, it } from 'vitest';
import '../polyfills';
import { nestDependents } from '@utility/dashboard/settingsModel';

const shape = (rows) => rows.map(({ option, depth }) => `${option.name}:${depth}`);

describe('nestDependents', () => {
  it('moves a child right under its parent and indents it', () => {
    const options = [
      { name: 'vials', group: 'Vials' },
      { name: 'vialAttempts', group: 'Vials' },
      { name: 'subtractGreenStacks', group: 'Vials', dependsOn: 'vials' }
    ];
    expect(shape(nestDependents(options))).toEqual(['vials:0', 'subtractGreenStacks:1', 'vialAttempts:0']);
  });

  it('nests a chain one level per parent', () => {
    const options = [
      { name: 'meals' },
      { name: 'mealLadleCost' },
      { name: 'alertOnlyCookedMeal', dependsOn: 'meals' },
      { name: 'includeOverflowingLadle', dependsOn: 'mealLadleCost' },
      { name: 'deeper', dependsOn: 'includeOverflowingLadle' }
    ];
    expect(shape(nestDependents(options))).toEqual([
      'meals:0', 'alertOnlyCookedMeal:1', 'mealLadleCost:0', 'includeOverflowingLadle:1', 'deeper:2'
    ]);
  });

  it('leaves a child in place when its parent is not listed or sits in another group', () => {
    const options = [
      { name: 'a' },
      { name: 'b', dependsOn: 'inlineNumber' },
      { name: 'c', group: 'Other', dependsOn: 'a' }
    ];
    expect(shape(nestDependents(options))).toEqual(['a:0', 'b:0', 'c:0']);
  });
});
