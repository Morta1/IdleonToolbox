import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getStarSigns } from '@parsers/starSigns';
import { liveCount } from '@parsers/catalog';
import { starSigns } from '@website-data';
import { tryToParse } from '@utility/helpers';
import first from '../fixtures/first.json';
import second from '../fixtures/second.json';
import third from '../fixtures/third.json';
import fourth from '../fixtures/fourth.json';
import latest from '../fixtures/latest.json';

describe('getStarSigns', () => {
  it('returns every live star sign when the save is missing', () => {
    const result = getStarSigns(undefined, {});
    expect(result).toHaveLength(liveCount(starSigns));
    expect(result.every((s) => s.unlocked === false)).toBe(true);
  });

  it('never emits placeholder entries', () => {
    const result = getStarSigns(undefined, {});
    expect(result.some((s) => s.starName?.toLowerCase().startsWith('filler'))).toBe(false);
  });

  it('carries catalog fields through', () => {
    const [firstSign] = getStarSigns(undefined, {});
    expect(firstSign.starName).toBeTruthy();
    expect(firstSign.tree).toBeTruthy();
  });
});

const FIXTURES = [['first', first], ['second', second], ['third', third], ['fourth', fourth], ['latest', latest]];

describe('getStarSigns fixture regression', () => {
  it.each(FIXTURES)('%s: unlocked flags the save covers are unchanged for the same star sign', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const starSignsRaw = tryToParse(data?.StarSg) || data?.StarSignsUnlocked;
    const result = getStarSigns(data, {});

    Object.keys(starSignsRaw || {}).forEach((starName) => {
      const entry = result.find((s) => s.starName === starName);
      if (!entry) return; // filtered as a placeholder catalog entry
      expect(entry.unlocked).toBe(!!starSignsRaw[starName]);
    });
  });

  it.each(FIXTURES)('%s: returns the full catalog length regardless of save length', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    expect(getStarSigns(data, {})).toHaveLength(liveCount(starSigns));
  });
});
