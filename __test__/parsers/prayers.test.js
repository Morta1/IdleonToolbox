import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getPrayers } from '@parsers/world-3/prayers';
import { liveCount } from '@parsers/catalog';
import { prayers } from '@website-data';
import { tryToParse } from '@utility/helpers';
import first from '../fixtures/first.json';
import second from '../fixtures/second.json';
import third from '../fixtures/third.json';
import fourth from '../fixtures/fourth.json';
import latest from '../fixtures/latest.json';

describe('getPrayers', () => {
  it('returns every live prayer when the save is missing', () => {
    const result = getPrayers(undefined, []);
    expect(result).toHaveLength(liveCount(prayers));
    expect(result.every((p) => p.level === 0)).toBe(true);
  });

  it('never emits placeholder entries', () => {
    const result = getPrayers(undefined, []);
    expect(result.some((p) => p.name?.startsWith('Some_'))).toBe(false);
  });

  it('carries catalog fields through', () => {
    const [first] = getPrayers(undefined, []);
    expect(first.name).toBe('Big_Brain_Time');
    expect(first.maxLevel).toBe(50);
    expect(first.soul).toBe('Soul1');
  });

  it('applies save levels at the right indexes', () => {
    const result = getPrayers({ PrayersUnlocked: [5, 3, 0, 0, 0] }, []);
    expect(result[0].level).toBe(5);
    expect(result[1].level).toBe(3);
    expect(result[4].level).toBe(0);
  });

  it('returns the full list even when the save is shorter than the catalog', () => {
    const result = getPrayers({ PrayersUnlocked: [5, 3, 0, 0, 0] }, []);
    expect(result).toHaveLength(liveCount(prayers));
    expect(result[18].level).toBe(0);
  });
});

const FIXTURES = [['first', first], ['second', second], ['third', third], ['fourth', fourth], ['latest', latest]];

describe('getPrayers fixture regression', () => {
  it.each(FIXTURES)('%s: levels the save covers are unchanged', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const raw = data?.PrayersUnlocked || tryToParse(data?.PrayOwned) || [];
    const result = getPrayers(data, []);

    raw.slice(0, result.length).forEach((level, index) => {
      expect(result[index].level).toBe(level);
    });
  });

  it.each(FIXTURES)('%s: returns the full catalog length regardless of save length', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    expect(getPrayers(data, [])).toHaveLength(liveCount(prayers));
  });
});
