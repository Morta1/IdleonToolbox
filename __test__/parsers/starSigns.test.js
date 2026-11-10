import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getStarSigns } from '@parsers/starSigns';
import { liveCount } from '@parsers/catalog';
import { starSigns } from '@website-data';
import { tryToParse } from '@utility/helpers';
import { FIXTURES, onEachFixture } from '../helpers/save-fixtures';

describe('getStarSigns', () => {
  it('returns every live star sign when the save is missing', () => {
    const result = getStarSigns(undefined, {});
    expect(result).toHaveLength(liveCount(starSigns));
    expect(result.every((s) => s.unlocked === false)).toBe(true);
    expect(result[0]).toMatchObject({ starName: 'The_Buff_Guy', tree: 'chronus' });
    expect(result.some((s) => s.starName?.toLowerCase().startsWith('filler'))).toBe(false);
  });

});

describe('getStarSigns fixture regression', () => {
  it('every save: unlocked flags read by star sign name, across the whole catalog', () => onEachFixture(FIXTURES, (fixture) => {
    const data = fixture.data ?? fixture;
    const starSignsRaw = tryToParse(data?.StarSg) || data?.StarSignsUnlocked;
    const result = getStarSigns(data, {});

    expect(result).toHaveLength(liveCount(starSigns));
    Object.keys(starSignsRaw || {}).forEach((starName) => {
      const entry = result.find((s) => s.starName === starName);
      if (!entry) return; // filtered as a placeholder catalog entry
      expect(entry.unlocked).toBe(!!starSignsRaw[starName]);
    });
  }));

});
