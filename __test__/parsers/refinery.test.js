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
  it.each(FIXTURES)('%s: salt progress below the unlocked count is unchanged at the same index', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const refineryRaw = tryToParse(data?.Refinery) || data?.Refinery;
    const unlockedSaltCount = refineryRaw?.[0]?.[0] ?? 0;
    const result = getRefinery(data, [], {});
    const names = Object.keys(refinery);

    names.forEach((_name2, index) => {
      if (index >= unlockedSaltCount || index >= result.salts.length) return;
      const salt = refineryRaw?.[3 + index];
      if (!salt) return;
      const [refined = 0, rank = 0, , active = 0, autoRefinePercentage = 0] = salt;
      expect(result.salts[index].refined).toBe(refined);
      expect(result.salts[index].rank).toBe(rank);
      expect(result.salts[index].active).toBe(active);
      expect(result.salts[index].autoRefinePercentage).toBe(autoRefinePercentage);
      expect(result.salts[index].unlocked).toBe(true);
    });
  });

  it.each(FIXTURES)('%s: salts at or beyond the unlocked count are neutral, not the seeded rank-1 slot', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const refineryRaw = tryToParse(data?.Refinery) || data?.Refinery;
    const unlockedSaltCount = refineryRaw?.[0]?.[0] ?? 0;
    const result = getRefinery(data, [], {});

    result.salts.forEach((salt, index) => {
      if (index < unlockedSaltCount) return;
      expect(salt.unlocked).toBe(false);
      expect(salt.rank).toBe(0);
      expect(salt.refined).toBe(0);
      expect(salt.active).toBe(0);
      expect(salt.autoRefinePercentage).toBe(0);
    });
  });

  it('first: totalLevels only counts the 3 unlocked salts (7 + 4 + 2 = 13), not the 6 seeded rank-1 locked ones', () => {
    const data = first.data ?? first;
    const result = getRefinery(data, [], {});
    expect(result.totalLevels).toBe(13);
  });

  it.each(FIXTURES)('%s: returns the full catalog length regardless of save length', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const result = getRefinery(data, [], {});
    expect(result.salts).toHaveLength(liveCount(Object.values(refinery)));
  });
});
