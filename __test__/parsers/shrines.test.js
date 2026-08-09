import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getShrines } from '@parsers/world-3/shrines';
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
