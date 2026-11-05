import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { classes, monsters } from '@website-data';
import { getVisualizationMap } from '@components/statistics/consts';
import { CLASSES, getBaseClass } from '@parsers/talents';

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

  it.each([
    ['keeps a sparse middle bucket, and the first five stay out', [[0, 900], [400, 900], [500, 3], [600, 2]], [['500', 3], ['600', 2]]],
    ['puts an omitted bucket back at 0', [[500, 3], [700, 4]], [['500', 3], ['600', 0], ['700', 4]]],
    ['walks the wider buckets to the open last one', [[800, 1], [2000, 5], ['18000+', 7]], null]
  ])('Total levels %s', (name, raw, expected) => {
    const rows = map.totalLevels.rows(raw.map(([_id, count]) => ({ _id, count }))).map((row) => [row.key, row.values.count]);
    if (expected) expect(rows).toEqual(expected);
    else {
      expect(rows.slice(3, 6)).toEqual([['800', 1], ['1000', 0], ['2000', 5]]);
      expect(rows.at(-1)).toEqual(['18000+', 7]);
    }
  });

  it('counts a slot\'s small class in its base class, and one with no base class in Other', () => {
    const mage = classes.findIndex((name) => getBaseClass(name) === CLASSES.Mage && name !== 'MAGE');
    const unknown = classes.length + 5;
    const [slot] = map.classDistributionPerSlot.rows([{ slot: 0, class: mage, count: 3 }, { slot: 0, class: unknown, count: 2 }]);
    expect(slot.values).toEqual({ [CLASSES.Mage]: 3, Other: 2 });
  });
});
