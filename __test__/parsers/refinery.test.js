import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getRefinery } from '@parsers/world-3/refinery';
import { liveCount } from '@parsers/catalog';
import { refinery } from '@website-data';
import { tryToParse } from '@utility/helpers';
import first from '../fixtures/first.json';
import second from '../fixtures/second.json';
import third from '../fixtures/third.json';
import fourth from '../fixtures/fourth.json';
import latest from '../fixtures/latest.json';

describe('getRefinery', () => {
  it('returns every live salt when the save is missing', () => {
    const result = getRefinery(undefined, [], {});
    expect(result.salts).toHaveLength(liveCount(Object.values(refinery)));
    expect(result.salts.every((s) => s.rank === 0)).toBe(true);
  });

  it('never emits placeholder entries', () => {
    const result = getRefinery(undefined, [], {});
    expect(result.salts.some((s) => s.saltName?.startsWith('Some_'))).toBe(false);
  });

  it('carries catalog fields through', () => {
    const result = getRefinery(undefined, [], {});
    expect(result.salts[0].rawName).toBe('Refinery1');
    expect(result.salts[0].saltName).toBe('Redox_Salts');
  });
});

const FIXTURES = [['first', first], ['second', second], ['third', third], ['fourth', fourth], ['latest', latest]];

describe('getRefinery fixture regression', () => {
  it.each(FIXTURES)('%s: salt progress the save covers is unchanged at the same index', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const refineryRaw = tryToParse(data?.Refinery) || data?.Refinery;
    const result = getRefinery(data, [], {});
    const names = Object.keys(refinery);

    names.forEach((_name2, index) => {
      const salt = refineryRaw?.[3 + index];
      if (!salt || index >= result.salts.length) return;
      const [refined = 0, rank = 0, , active = 0, autoRefinePercentage = 0] = salt;
      expect(result.salts[index].refined).toBe(refined);
      expect(result.salts[index].rank).toBe(rank);
      expect(result.salts[index].active).toBe(active);
      expect(result.salts[index].autoRefinePercentage).toBe(autoRefinePercentage);
    });
  });

  it.each(FIXTURES)('%s: returns the full catalog length regardless of save length', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const result = getRefinery(data, [], {});
    expect(result.salts).toHaveLength(liveCount(Object.values(refinery)));
  });
});
