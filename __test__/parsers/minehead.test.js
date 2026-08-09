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

  it('applies save levels at the right indexes', () => {
    // Hand-built save: raw[8] is the upgrade-level list (raw[0-7] are unrelated minehead-state
    // slots this test doesn't touch). Unlike the fixture rows below, this runs unconditionally -
    // 4 of the 5 real fixtures have no `Research` field at all, so they can't be relied on alone
    // to prove index alignment.
    const research = [];
    research[8] = [5, 3, 0, 0, 0];
    const result = getMinehead({ Research: research }, {}, {});
    expect(result.upgrades[0].level).toBe(5);
    expect(result.upgrades[1].level).toBe(3);
    expect(result.upgrades[4].level).toBe(0);
  });

  it('returns the full upgrade list even when the save is shorter than the catalog', () => {
    const research = [];
    research[8] = [5, 3, 0, 0, 0];
    const result = getMinehead({ Research: research }, {}, {});
    expect(result.upgrades).toHaveLength(liveCount(mineheadUpgrades));
    expect(result.upgrades[29].level).toBe(0);
  });
});

const FIXTURES = [['first', first], ['second', second], ['third', third], ['fourth', fourth], ['latest', latest]];

describe('getMinehead fixture regression', () => {
  // NOTE: `first`-`fourth` have no `Research` field at all (real, pre-Minehead saves), so
  // `upgradeLevels` is undefined and this row makes no assertions for those 4 fixtures - that is
  // legitimate for them, not a gap, since there is nothing to check index alignment against. Only
  // `latest` actually exercises the check here. The unconditional, hand-built save case above
  // (`applies save levels at the right indexes`) is what proves index alignment regardless of
  // fixture content.
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
