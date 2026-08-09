import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getGrimoire } from '@parsers/class-specific/grimoire';
import { liveCount } from '@parsers/catalog';
import { grimoire } from '@website-data';
import { tryToParse } from '@utility/helpers';
import first from '../fixtures/first.json';
import second from '../fixtures/second.json';
import third from '../fixtures/third.json';
import fourth from '../fixtures/fourth.json';
import latest from '../fixtures/latest.json';

describe('getGrimoire', () => {
  it('returns every live upgrade when the save is missing', () => {
    const result = getGrimoire(undefined, [], {});
    expect(result.upgrades).toHaveLength(liveCount(grimoire));
    expect(result.upgrades.every((u) => u.level === 0)).toBe(true);
  });

  it('never crashes with no idleonData/account', () => {
    expect(() => getGrimoire(undefined, [], undefined)).not.toThrow();
  });

  it('populates bones as a neutral 4-entry array', () => {
    const result = getGrimoire(undefined, [], {});
    expect(result.bones).toHaveLength(4);
    expect(result.bones.every((b) => b === 0)).toBe(true);
  });

  it('carries catalog fields through', () => {
    const [first] = getGrimoire(undefined, [], {}).upgrades;
    expect(first.name).toBe('Wraith_Damage_製_(Tap_for_more_info)');
  });

  it('applies save levels at the right indexes (synthetic, unconditional)', () => {
    // Hand-built save: Grimoire is the upgrade-level array directly. Runs unconditionally because
    // most fixtures below have no Grimoire field at all.
    const idleonData = { Grimoire: [5, 3, 0, 0, 0] };
    const result = getGrimoire(idleonData, [], {});
    expect(result.upgrades[0].level).toBe(5);
    expect(result.upgrades[1].level).toBe(3);
    expect(result.upgrades[4].level).toBe(0);
    expect(result.upgrades).toHaveLength(liveCount(grimoire));
  });
});

const FIXTURES = [['first', first], ['second', second], ['third', third], ['fourth', fourth], ['latest', latest]];

// Only fixtures that actually carry a `Grimoire` field can prove index alignment against real save
// data - `first`-`fourth` are real pre-Grimoire saves and have no such field at all. Narrowed to
// avoid a vacuous `it.each` row that silently ran zero assertions for 4 of 5 fixtures while still
// reporting green; `latest` is the only one that currently qualifies. The unconditional, hand-built
// synthetic case above ('applies save levels at the right indexes') is what proves index alignment
// regardless of fixture content - this row is purely a real-data regression check.
const FIXTURES_WITH_GRIMOIRE = FIXTURES.filter(([, fixture]) => (fixture.data ?? fixture)?.Grimoire != null);

describe('getGrimoire fixture regression', () => {
  it.each(FIXTURES_WITH_GRIMOIRE)('%s: levels the save covers are unchanged at the same index', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const grimoireRaw = tryToParse(data?.Grimoire) || data?.Grimoire;
    const result = getGrimoire(data, [], {});

    expect(grimoireRaw?.length).toBeGreaterThan(0);
    grimoireRaw.forEach((level, index) => {
      if (index >= result.upgrades.length) return;
      expect(result.upgrades[index].level).toBe(level);
    });
  });

  it.each(FIXTURES)('%s: returns the full catalog length regardless of save', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const result = getGrimoire(data, [], {});
    expect(result.upgrades).toHaveLength(liveCount(grimoire));
  });

  it.each(FIXTURES)('%s: never throws', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    expect(() => getGrimoire(data, [], {})).not.toThrow();
  });
});
