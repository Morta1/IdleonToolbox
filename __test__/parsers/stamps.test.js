import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getStamps, stampsMapping } from '@parsers/world-1/stamps';
import { liveCount } from '@parsers/catalog';
import { stamps } from '@website-data';
import { tryToParse } from '@utility/helpers';
import { FIXTURES } from '../helpers/save-fixtures';

const CATEGORIES = ['combat', 'skills', 'misc'];
const emptyAccount = { storage: { list: [] } };

describe('getStamps', () => {
  it('returns every live stamp per category when the save is missing', () => {
    const result = getStamps(undefined, emptyAccount);
    for (const category of CATEGORIES) {
      expect(result[category]).toHaveLength(liveCount(Object.values(stamps[category])));
      expect(result[category].every((s) => s.level === 0)).toBe(true);
    }
    expect(result.combat[0]).toMatchObject({ displayName: 'Sword_Stamp', rawName: 'StampA1' });
  });

  it('applies save levels at the right indexes, keeping the full category past a short save', () => {
    const raw = { StampLv: [{ 0: 5, 1: 3 }, {}, {}] };
    const result = getStamps(raw, emptyAccount);
    expect(result.combat[0].level).toBe(5);
    expect(result.combat[1].level).toBe(3);
    expect(result.combat[2].level).toBe(0);
    expect(result.combat).toHaveLength(liveCount(Object.values(stamps.combat)));
  });
});

describe('getStamps fixture regression', () => {
  it.each(FIXTURES)('%s: levels read at their index, across every whole category', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const stampLevelsRaw = tryToParse(data?.StampLv) || data?.StampLevel;
    const result = getStamps(data, emptyAccount);

    CATEGORIES.forEach((category) => expect(result[category]).toHaveLength(liveCount(Object.values(stamps[category]))));
    Object.entries(stampsMapping).forEach(([catIndexStr, category]) => {
      const raw = stampLevelsRaw?.[Number(catIndexStr)];
      if (!raw) return;
      Object.keys(raw).forEach((key) => {
        if (key === 'length') return;
        const index = Number(key);
        if (index >= result[category].length) return;
        expect(result[category][index].level).toBe(parseFloat(raw[key]));
      });
    });
  });

});
