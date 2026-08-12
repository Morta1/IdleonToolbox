import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getStamps, stampsMapping } from '@parsers/world-1/stamps';
import { liveCount } from '@parsers/catalog';
import { stamps } from '@website-data';
import { tryToParse } from '@utility/helpers';
import first from '../fixtures/first.json';
import second from '../fixtures/second.json';
import third from '../fixtures/third.json';
import fourth from '../fixtures/fourth.json';
import latest from '../fixtures/latest.json';

const CATEGORIES = ['combat', 'skills', 'misc'];
const emptyAccount = { storage: { list: [] } };

describe('getStamps', () => {
  it('returns every live stamp per category when the save is missing', () => {
    const result = getStamps(undefined, emptyAccount);
    for (const category of CATEGORIES) {
      expect(result[category]).toHaveLength(liveCount(Object.values(stamps[category])));
      expect(result[category].every((s) => s.level === 0)).toBe(true);
    }
  });

  it('carries catalog fields through', () => {
    const result = getStamps(undefined, emptyAccount);
    expect(result.combat[0].displayName).toBe('Sword_Stamp');
    expect(result.combat[0].rawName).toBe('StampA1');
  });

  it('applies save levels at the right indexes', () => {
    const raw = { StampLv: [{ 0: 5, 1: 3 }, {}, {}] };
    const result = getStamps(raw, emptyAccount);
    expect(result.combat[0].level).toBe(5);
    expect(result.combat[1].level).toBe(3);
    expect(result.combat[2].level).toBe(0);
  });

  it('returns the full category even when the save is shorter than the catalog', () => {
    const raw = { StampLv: [{ 0: 5 }, {}, {}] };
    const result = getStamps(raw, emptyAccount);
    expect(result.combat).toHaveLength(liveCount(Object.values(stamps.combat)));
  });
});

const FIXTURES = [['first', first], ['second', second], ['third', third], ['fourth', fourth], ['latest', latest]];

describe('getStamps fixture regression', () => {
  it.each(FIXTURES)('%s: levels the save covers are unchanged at the same index', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const stampLevelsRaw = tryToParse(data?.StampLv) || data?.StampLevel;
    const result = getStamps(data, emptyAccount);

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

  it.each(FIXTURES)('%s: returns the full catalog length per category regardless of save length', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const result = getStamps(data, emptyAccount);
    for (const category of CATEGORIES) {
      expect(result[category]).toHaveLength(liveCount(Object.values(stamps[category])));
    }
  });
});
