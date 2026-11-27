import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { classes, monsters } from '@website-data';
import { chartsFor, counted } from '@components/statistics/charts';
import { CLASSES, getBaseClass } from '@parsers/talents';

const chartOf = (key, data = {}, band = null, classId = null) => chartsFor(data, band, classId).find((entry) => entry.key === key);
const rowsOf = (key, raw) => chartOf(key).chart.rows(raw);
const mapsOf = (pick) => Object.keys(monsters).filter((key) => pick(monsters[key]?.AFKtype));

describe('statistics rows', () => {
  it('adds up every map of an activity across bands, and leaves the null buckets out', () => {
    const [fighting, alsoFighting] = mapsOf((type) => type === 'FIGHTING');
    const [other] = mapsOf((type) => type && type !== 'FIGHTING' && type !== 'error');
    const activities = rowsOf('activities', [
      { b: 1, k: fighting, n: 5 }, { b: 2, k: alsoFighting, n: 7 }, { b: 1, k: other, n: 3 }
    ]).map(({ key, value }) => [key, value]);
    expect({
      activities,
      ages: rowsOf('accountAge', [{ b: 1, k: null, n: 2 }, { b: 1, k: 1, n: 5 }, { b: 2, k: 0, n: 9 }]).map((row) => row.key),
      worlds: rowsOf('worlds', [{ b: 1, k: 2, n: 4 }, { b: 1, k: 0, n: 2 }, { b: 3, k: 1, n: 3 }]).map((row) => row.key)
    }).toEqual({
      activities: [['FIGHTING', 12], [monsters[other].AFKtype, 3]],
      ages: ['0', '1'],
      worlds: ['1', '2']
    });
  });

  it.each([
    ['keeps a sparse middle bucket, and the first five stay out', [[0, 900], [400, 900], [500, 3], [600, 2]], [['500', 3], ['600', 2]]],
    ['puts an omitted bucket back at 0', [[500, 3], [700, 4]], [['500', 3], ['600', 0], ['700', 4]]],
    ['walks the wider buckets to the open last one', [[800, 1], [2000, 5], [18000, 7]], null]
  ])('Total levels %s', (name, raw, expected) => {
    const rows = rowsOf('totalLevels', raw.map(([k, n]) => ({ b: 1, k, n }))).map((row) => [row.key, row.values.count]);
    if (expected) expect(rows.slice(0, expected.length)).toEqual(expected);
    else {
      expect(rows.slice(0, 3)).toEqual([['800', 1], ['1000', 0], ['2000', 5]]);
      expect(rows.at(-1)).toEqual(['18000', 7]);
    }
  });

  it('counts a slot\'s small class in its base class, and one with no base class in Other', () => {
    const mage = classes.findIndex((name) => getBaseClass(name) === CLASSES.Mage && name !== 'MAGE');
    const unknown = classes.length + 5;
    const [slot] = rowsOf('slots', [{ b: 1, c: mage, k: 0, n: 3 }, { b: 2, c: unknown, k: 0, n: 2 }]);
    expect(slot.values).toEqual({ [CLASSES.Mage]: 3, Other: 2 });
  });

  it('names every doubler kind\'s picks and shares them out of the players who placed any', () => {
    const picks = { b: 1, k: 1, n: 3 };
    const data = Object.fromEntries(['mineheadDoublers', 'sushiDoublers', 'jellyDoublers', 'organicLabels', 'omnijade'].map((kind) => [kind, [picks]]));
    const charts = chartsFor({ ...data, doublerPlayers: [{ b: 1, k: 'omnijade', n: 6 }] }, 1, null);
    for (const kind of Object.keys(data)) {
      const [row] = charts.find((entry) => entry.key === kind).chart.rows(data[kind]);
      expect(row.name, kind).toMatch(/\w/);
      expect(row.icon, kind).toMatch(/^data\/\w+\.png$/);
    }
    expect(counted({ doublerPlayers: [{ b: 1, k: 'omnijade', n: 6 }] }, 1, null).omnijade).toBe(6);
  });

  it('counts one band and one class', () => {
    const data = { classes: [{ b: 1, c: 7, n: 30, lv: 90 }, { b: 2, c: 7, n: 5 }, { b: 1, c: 9, n: 20 }], players: [{ b: 1, n: 40 }, { b: 2, n: 4 }], minGroup: 10 };
    expect(counted(data, 1, 7)).toMatchObject({ characters: 30, players: 40, medianLevel: 90, tooFew: false });
    expect(counted(data, 2, 7)).toMatchObject({ characters: 5, tooFew: true });
    expect(counted(data, null, null)).toMatchObject({ characters: 55, players: 44 });
  });
});
