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

describe('unbuilt shrines award nothing', () => {
  // Every fixture has the Crystal Shrine built, which is exactly why the bug this covers survived:
  // crystalShrineBonus read the level-0 bonus with no level check and fed it into shrine EXP.
  // A synthetic save is the only way to exercise it.
  const CRYSTAL_INDEX = 2;
  const build = (levels) => levels.map((level, index) => [index === 0 ? 0 : index * 10, 0, 0, level, 0]);

  it('gives a level-0 shrine no bonus', () => {
    const result = getShrines({ ShrineInfo: build([0, 0, 0, 0, 0, 0, 0, 0, 0]) }, {});
    expect(result.every((s) => s.bonus === 0)).toBe(true);
    expect(result.every((s) => s.crystalShrineBonus === 0)).toBe(true);
  });

  it('gives no crystalShrineBonus while the Crystal Shrine is unbuilt, but keeps the others', () => {
    const levels = [5, 5, 0, 5, 5, 5, 5, 5, 5];
    const result = getShrines({ ShrineInfo: build(levels) }, {});

    expect(result[CRYSTAL_INDEX].bonus).toBe(0);
    expect(result.every((s) => s.crystalShrineBonus === 0)).toBe(true);
    result.forEach((shrine, index) => {
      if (index === CRYSTAL_INDEX) return;
      expect(shrine.bonus).toBeGreaterThan(0);
    });
  });

  it('restores crystalShrineBonus once the Crystal Shrine is built', () => {
    const levels = [5, 5, 5, 5, 5, 5, 5, 5, 5];
    const result = getShrines({ ShrineInfo: build(levels) }, {});
    const onItsOwnMap = result[CRYSTAL_INDEX];
    expect(onItsOwnMap.crystalShrineBonus).toBeGreaterThan(0);
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
