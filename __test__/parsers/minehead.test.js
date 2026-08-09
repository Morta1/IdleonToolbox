import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getMinehead } from '@parsers/world-7/minehead';
import { liveCount } from '@parsers/catalog';
import { mineheadUpgrades } from '@website-data';
import { tryToParse } from '@utility/helpers';
import first from '../fixtures/first.json';
import second from '../fixtures/second.json';
import third from '../fixtures/third.json';
import fourth from '../fixtures/fourth.json';
import latest from '../fixtures/latest.json';

// mineheadUpgrades is mapped directly (`(mineheadUpgrades ?? []).map(...)`), so the upgrade list was
// already catalog-driven before Task 6. This test locks that behavior in; no parser code changed.
describe('getMinehead', () => {
  it('returns every live upgrade when the save is missing', () => {
    const result = getMinehead(undefined, {}, {});
    expect(result.upgrades).toHaveLength(liveCount(mineheadUpgrades));
    expect(result.upgrades.every((u) => u.level === 0)).toBe(true);
  });

  it('carries catalog fields through', () => {
    const result = getMinehead(undefined, {}, {});
    expect(result.upgrades[0].name).toBe('Base_Damage_I');
  });
});

const FIXTURES = [['first', first], ['second', second], ['third', third], ['fourth', fourth], ['latest', latest]];

describe('getMinehead fixture regression', () => {
  it.each(FIXTURES)('%s: upgrade levels the save covers are unchanged at the same index', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const researchRaw = tryToParse(data?.Research) || data?.Research;
    const upgradeLevels = Array.isArray(researchRaw) ? researchRaw?.[8] : undefined;
    const result = getMinehead(data, {}, {});

    upgradeLevels?.forEach((level, index) => {
      if (index >= result.upgrades.length) return;
      expect(result.upgrades[index].level).toBe(Number(level) || 0);
    });
  });

  it.each(FIXTURES)('%s: returns the full catalog length regardless of save', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const result = getMinehead(data, {}, {});
    expect(result.upgrades).toHaveLength(liveCount(mineheadUpgrades));
  });
});
