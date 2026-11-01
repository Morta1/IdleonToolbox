import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { classes, monsters } from '@website-data';
import { getVisualizationMap } from '@components/statistics/consts';

const map = getVisualizationMap(classes);
const mapsOf = (pick) => Object.keys(monsters).filter((key) => pick(monsters[key]?.AFKtype));

describe('statistics rows', () => {
  it('adds up every map of an activity and leaves the null buckets out', () => {
    const [fighting, alsoFighting] = mapsOf((type) => type === 'FIGHTING');
    const [other] = mapsOf((type) => type && type !== 'FIGHTING');
    const activities = map.topActivities.rows([
      { activity: fighting, count: 5 }, { activity: alsoFighting, count: 7 }, { activity: other, count: 3 }
    ]).map(({ key, value }) => [key, value]);
    expect({
      activities,
      ages: map.accountAge.rows([{ _id: null, count: 2 }, { _id: 1, count: 5 }, { _id: 0, count: 9 }]).map((row) => row.key),
      worlds: map.worldDistribution.rows([{ _id: '2', count: 4 }, { _id: '0', count: 2 }, { _id: '1', count: 3 }]).map((row) => row.key)
    }).toEqual({
      activities: [['FIGHTING', 12], [monsters[other].AFKtype, 3]],
      ages: ['0', '1'],
      worlds: ['1', '2']
    });
  });
});
