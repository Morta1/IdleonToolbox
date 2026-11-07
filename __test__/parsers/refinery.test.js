import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getRefinery } from '@parsers/world-3/refinery';
import { liveCount } from '@parsers/catalog';
import { refinery } from '@website-data';
import { tryToParse } from '@utility/helpers';
import { FIXTURES } from '../helpers/save-fixtures';
import first from '../fixtures/first.json';

describe('getRefinery', () => {
  it('returns every live salt when the save is missing', () => {
    const result = getRefinery(undefined, [], {});
    expect(result.salts).toHaveLength(liveCount(Object.values(refinery)));
    expect(result.salts.every((s) => s.rank === 0)).toBe(true);
    expect(result.salts[0]).toMatchObject({ rawName: 'Refinery1', saltName: 'Redox_Salts' });
    expect(result.salts.some((s) => s.saltName?.startsWith('Some_'))).toBe(false);
  });

});

describe('getRefinery fixture regression', () => {
  it.each(FIXTURES)('%s: salt progress below the unlocked count reads at its index, across the whole catalog', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const refineryRaw = tryToParse(data?.Refinery) || data?.Refinery;
    const unlockedSaltCount = refineryRaw?.[0]?.[0] ?? 0;
    const result = getRefinery(data, [], {});
    const names = Object.keys(refinery);

    expect(result.salts).toHaveLength(liveCount(Object.values(refinery)));
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

});
