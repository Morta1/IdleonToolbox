import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getRefinery } from '@parsers/world-3/refinery';
import { liveCount } from '@parsers/catalog';
import { refinery } from '@website-data';
import { tryToParse } from '@utility/helpers';
import { FIXTURES, onEachFixture } from '../helpers/save-fixtures';
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
  it('every save: salts below the unlocked count read at their index, the rest are neutral, not the seeded rank-1 slot', () => onEachFixture(FIXTURES, (fixture) => {
    const data = fixture.data ?? fixture;
    const refineryRaw = tryToParse(data?.Refinery) || data?.Refinery;
    const unlockedSaltCount = refineryRaw?.[0]?.[0] ?? 0;
    const result = getRefinery(data, [], {});

    expect(result.salts).toHaveLength(liveCount(Object.values(refinery)));
    result.salts.forEach((salt, index) => {
      const saved = index < unlockedSaltCount ? refineryRaw?.[3 + index] : [];
      if (!saved) return;
      const [refined = 0, rank = 0, , active = 0, autoRefinePercentage = 0] = saved;
      expect({ ...salt, index }).toMatchObject({ index, refined, rank, active, autoRefinePercentage, unlocked: index < unlockedSaltCount });
    });
  }));

  it('first: totalLevels only counts the 3 unlocked salts (7 + 4 + 2 = 13), not the 6 seeded rank-1 locked ones', () => {
    const data = first.data ?? first;
    const result = getRefinery(data, [], {});
    expect(result.totalLevels).toBe(13);
  });

});
