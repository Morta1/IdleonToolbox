import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { classes, monsters } from '@website-data';
import { getVisualizationMap } from '@components/statistics/consts';

const map = getVisualizationMap(classes);
const mapsOf = (pick) => Object.keys(monsters).filter((key) => pick(monsters[key]?.AFKtype));

describe('statistics rows', () => {
  it('adds up every map of an activity', () => {
    const [fighting, alsoFighting] = mapsOf((type) => type === 'FIGHTING');
    const [other] = mapsOf((type) => type && type !== 'FIGHTING');
    const activities = map.topActivities.rows([
      { activity: fighting, count: 5 }, { activity: alsoFighting, count: 7 }, { activity: other, count: 3 }
    ]).map(({ key, value }) => [key, value]);
    expect({ activities }).toEqual({ activities: [['FIGHTING', 12], [monsters[other].AFKtype, 3]] });
  });
});
