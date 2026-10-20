import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { materialTrackerToGoals } from '@utility/goals/migrateMaterialTracker';

const entry = (rawName, fields = {}) => ({ item: { rawName, displayName: rawName }, ...fields });
const convert = (fields, opts) => materialTrackerToGoals({ Copper: entry('Copper', fields) }, opts);
const shape = (goals) => goals.map((g) => (g.watch ? 'watch' : [g.op, g.target]));

describe('materialTrackerToGoals', () => {
  it.each([
    [{ lowerBound: 100 }, [['>=', 100]]],
    [{ upperBound: 900 }, [['<=', 900]]],
    [{ lowerBound: 100, upperBound: 900 }, [['>=', 100], ['<=', 900]]],
    [{ lowerBound: '', upperBound: '' }, ['watch']],
    [{ lowerBound: '0' }, ['watch']],
    [{ lowerBound: '100' }, [['>=', 100]]]
  ])('bounds %j become %j', (fields, expected) => {
    const goals = convert(fields);
    expect(shape(goals)).toEqual(expected);
    goals.forEach((g) => expect(g).toMatchObject({ system: 'item', kind: 'entry', key: 'Copper', metric: 'quantity' }));
  });

  it('note and includeNearly carry over', () => {
    const goals = convert({ lowerBound: 5, upperBound: 9, note: 'for forge', includeNearly: true });
    expect(goals).toHaveLength(2);
    goals.forEach((g) => expect(g).toMatchObject({ note: 'for forge', nearAlert: true }));
    expect(convert({ lowerBound: 5 })[0].nearAlert).toBe(false);
  });

  it('invalid entries are skipped', () => {
    expect(materialTrackerToGoals({ A: { lowerBound: 5 }, B: null, C: entry('C', { lowerBound: 5 }) })).toHaveLength(1);
    expect(materialTrackerToGoals(null)).toEqual([]);
    expect(materialTrackerToGoals([entry('A', { lowerBound: 1 })])).toEqual([]);
  });

  it('missing-greenstack entries fold into one greenstack goal', () => {
    const tracked = {};
    const greenstackKeys = new Set();
    for (let i = 0; i < 300; i++) {
      tracked[`G${i}`] = entry(`G${i}`, { lowerBound: 1e7, upperBound: '', note: '' });
      greenstackKeys.add(`G${i}`);
    }
    const goals = materialTrackerToGoals(tracked, { greenstackKeys });
    expect(goals).toHaveLength(1);
    expect(goals[0]).toMatchObject({ system: 'greenstack', kind: 'all', metric: 'quantity', target: 'max' });
  });

  it.each([
    ['a note', { lowerBound: 1e7, note: 'keep' }, new Set(['Copper']), [['>=', 1e7]]],
    ['an upper bound', { lowerBound: 1e7, upperBound: 2e7 }, new Set(['Copper']), [['>=', 1e7], ['<=', 2e7]]],
    ['a non-greenstackable item', { lowerBound: 1e7 }, new Set(), [['>=', 1e7]]]
  ])('a 1e7 entry with %s does not fold', (_, fields, greenstackKeys, expected) => {
    const goals = convert(fields, { greenstackKeys });
    expect(shape(goals)).toEqual(expected);
    expect(goals.map((g) => g.system)).toEqual(expected.map(() => 'item'));
  });
});
