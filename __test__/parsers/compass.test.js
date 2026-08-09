import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getCompass } from '@parsers/class-specific/compass';
import { liveCount } from '@parsers/catalog';
import { compass, abominations } from '@website-data';
import { tryToParse } from '@utility/helpers';
import first from '../fixtures/first.json';
import second from '../fixtures/second.json';
import third from '../fixtures/third.json';
import fourth from '../fixtures/fourth.json';
import latest from '../fixtures/latest.json';

describe('getCompass', () => {
  it('returns every live upgrade when the save is missing', () => {
    const result = getCompass(undefined, [], {}, {});
    expect(result.upgrades).toHaveLength(liveCount(compass));
    expect(result.upgrades.every((u) => u.level === 0)).toBe(true);
  });

  it('never crashes with no idleonData/accountData/serverVars', () => {
    expect(() => getCompass(undefined, [], undefined, undefined)).not.toThrow();
  });

  it('returns every abomination', () => {
    const result = getCompass(undefined, [], {}, {});
    expect(result.abominations).toHaveLength(abominations.length);
  });

  it('populates dusts as a neutral 5-entry array', () => {
    const result = getCompass(undefined, [], {}, {});
    expect(result.dusts).toHaveLength(5);
    expect(result.dusts.every((d) => d.value === 0)).toBe(true);
  });

  it('carries catalog fields through', () => {
    const [first] = getCompass(undefined, [], {}, {}).upgrades;
    expect(first.name).toBe('Pathfinder');
  });

  it('applies save levels at the right indexes (synthetic, unconditional)', () => {
    // Hand-built save: Compass[0] is the upgrade-level array. Runs unconditionally because most
    // fixtures below have no Compass field at all.
    const compassRaw = [[5, 3, 0, 0, 0]];
    const idleonData = { Compass: JSON.stringify(compassRaw) };
    const result = getCompass(idleonData, [], {}, {});
    expect(result.upgrades[0].level).toBe(5);
    expect(result.upgrades[1].level).toBe(3);
    expect(result.upgrades[4].level).toBe(0);
    expect(result.upgrades).toHaveLength(liveCount(compass));
  });
});

const FIXTURES = [['first', first], ['second', second], ['third', third], ['fourth', fourth], ['latest', latest]];

// Only fixtures that actually carry a `Compass` field can prove index alignment against real save
// data - `first`-`fourth` are real pre-Compass saves and have no such field at all. Narrowed to
// avoid a vacuous `it.each` row that silently ran zero assertions for 4 of 5 fixtures while still
// reporting green; `latest` is the only one that currently qualifies. The unconditional, hand-built
// synthetic case above ('applies save levels at the right indexes') is what proves index alignment
// regardless of fixture content - this row is purely a real-data regression check.
const FIXTURES_WITH_COMPASS = FIXTURES.filter(([, fixture]) => (fixture.data ?? fixture)?.Compass != null);

describe('getCompass fixture regression', () => {
  it.each(FIXTURES_WITH_COMPASS)('%s: levels the save covers are unchanged at the same index', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const compassRaw = tryToParse(data?.Compass);
    const [upgradesLevels] = compassRaw || [];
    const result = getCompass(data, [], {}, {});

    expect(upgradesLevels?.length).toBeGreaterThan(0);
    upgradesLevels.forEach((level, index) => {
      if (index >= result.upgrades.length) return;
      expect(result.upgrades[index].level).toBe(level);
    });
  });

  it.each(FIXTURES)('%s: returns the full catalog length regardless of save', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const result = getCompass(data, [], {}, {});
    expect(result.upgrades).toHaveLength(liveCount(compass));
  });

  it.each(FIXTURES)('%s: never throws', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    expect(() => getCompass(data, [], {}, {})).not.toThrow();
  });
});
