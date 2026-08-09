import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getShrines, isLiveShrineEntry } from '@parsers/world-3/shrines';
import { liveCount } from '@parsers/catalog';
import { shrines } from '@website-data';
import { tryToParse } from '@utility/helpers';
import first from '../fixtures/first.json';
import second from '../fixtures/second.json';
import third from '../fixtures/third.json';
import fourth from '../fixtures/fourth.json';
import latest from '../fixtures/latest.json';

describe('getShrines', () => {
  it('returns every live shrine when the save is missing', () => {
    const result = getShrines(undefined, {});
    expect(result).toHaveLength(liveCount(Object.values(shrines)));
    expect(result.every((s) => s.shrineLevel === 0)).toBe(true);
  });

  it('carries catalog fields through', () => {
    const [firstShrine] = getShrines(undefined, {});
    expect(firstShrine.name).toBe('Woodular_Shrine');
    expect(firstShrine.rawName).toBe('ConTowerB18');
  });
});

/**
 * The original save-driven parser filtered `shrineName !== 'Unknown'` before emitting a row.
 * isPlaceholder's regex only matches filler/some_-prefixed names, not the literal 'Unknown', so
 * parseShrines restores the guard itself via isLiveShrineEntry. No shrine in the current catalog
 * has this name (dormant against real data), and `shrines` is a module-level import rather than a
 * parameter of getShrines/parseShrines, so there is no way to inject a synthetic 'Unknown' catalog
 * entry through the public functions without changing their signature. Testing the extracted
 * predicate directly is the smallest piece that proves the filter exists and behaves correctly.
 */
describe('isLiveShrineEntry', () => {
  it('excludes an Unknown-named shrine entry', () => {
    expect(isLiveShrineEntry({ shrineName: 'Unknown' })).toBe(false);
  });

  it('keeps a normally-named shrine entry', () => {
    expect(isLiveShrineEntry({ shrineName: 'Woodular_Shrine' })).toBe(true);
  });

  it('treats a missing shrineName as real so nothing is silently dropped', () => {
    expect(isLiveShrineEntry({})).toBe(true);
    expect(isLiveShrineEntry(undefined)).toBe(true);
  });
});

const FIXTURES = [['first', first], ['second', second], ['third', third], ['fourth', fourth], ['latest', latest]];

describe('getShrines fixture regression', () => {
  it.each(FIXTURES)('%s: shrine levels the save covers are unchanged at the same index', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const shrinesRaw = data?.ShrineInfo || tryToParse(data?.Shrine);
    const result = getShrines(data, {});

    shrinesRaw?.forEach((item, index) => {
      if (index >= result.length) return;
      const [mapId, , , shrineLevel] = item;
      expect(result[index].shrineLevel).toBe(shrineLevel);
      expect(result[index].mapId).toBe(mapId);
    });
  });

  it.each(FIXTURES)('%s: returns the full catalog length regardless of save length', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    expect(getShrines(data, {})).toHaveLength(liveCount(Object.values(shrines)));
  });
});
