import { describe, expect, it } from 'vitest';
import {
  SUPER_TALENT_MAX_POINTS,
  collectSuperTalents,
  isSuperTalentEligible
} from '@utility/builds/superTalents';
import { hydrate } from '@utility/builds/hydrate';
import { compactPayload } from '@utility/builds/compact';

const CLASS = { class: 'Warrior', subclass: 'Barbarian' };

describe('isSuperTalentEligible', () => {
  it('accepts a normal class talent', () => {
    expect(isSuperTalentEligible(15)).toBe(true);
    expect(isSuperTalentEligible(0)).toBe(true);
    expect(isSuperTalentEligible(614)).toBe(true);
  });

  it('rejects the indices the game bans from added levels', () => {
    [49, 55, 59, 149, 374, 505, 539, 615, 900].forEach((index) => {
      expect(isSuperTalentEligible(index)).toBe(false);
    });
  });

  it('rejects junk', () => {
    [null, undefined, -1, 1.5, 'abc'].forEach((index) => {
      expect(isSuperTalentEligible(index)).toBe(false);
    });
  });
});

describe('collectSuperTalents', () => {
  const tabOf = (talents) => ({ talents });

  it('gathers starred indices across every tab', () => {
    const tabs = [
      tabOf([{ skillIndex: 1, isSuperTalent: true }, { skillIndex: 2 }]),
      tabOf([{ skillIndex: 30, isSuperTalent: true }])
    ];
    expect(collectSuperTalents(tabs)).toEqual([1, 30]);
  });

  it('drops banned indices and caps at the point limit', () => {
    const tabs = [
      tabOf([
        { skillIndex: 49, isSuperTalent: true },
        ...Array.from({ length: 25 }, (_, i) => ({ skillIndex: 100 + i, isSuperTalent: true }))
      ])
    ];
    const result = collectSuperTalents(tabs);
    expect(result).toHaveLength(SUPER_TALENT_MAX_POINTS);
    expect(result).not.toContain(49);
  });

  it('handles missing input', () => {
    expect(collectSuperTalents(undefined)).toEqual([]);
    expect(collectSuperTalents([null, {}])).toEqual([]);
  });
});

describe('super talent round trip', () => {
  it('survives hydrate → compact → hydrate', () => {
    const empty = hydrate({ ...CLASS, payload: { v: 1, tabs: [] } });
    expect(empty.tabs.length).toBeGreaterThan(0);

    const starred = empty.tabs[0].talents[0];
    const tabs = empty.tabs.map((tab, i) =>
      i === 0
        ? {
          ...tab,
          talents: tab.talents.map((t, j) => (j === 0 ? { ...t, level: 100, isSuperTalent: true } : t))
        }
        : tab
    );

    const payload = compactPayload({ tabs });
    expect(payload.super).toEqual([starred.skillIndex]);

    const rehydrated = hydrate({ ...CLASS, payload });
    expect(rehydrated.tabs[0].talents[0].isSuperTalent).toBe(true);
    expect(rehydrated.tabs[0].talents[1].isSuperTalent).toBe(false);
  });

  it('omits the key entirely when nothing is starred', () => {
    const empty = hydrate({ ...CLASS, payload: { v: 1, tabs: [] } });
    expect(compactPayload({ tabs: empty.tabs })).not.toHaveProperty('super');
  });

  it('ignores a stored index the game would ban', () => {
    const hydrated = hydrate({ ...CLASS, payload: { v: 1, tabs: [], super: [49] } });
    const starred = hydrated.tabs.flatMap((tab) => tab.talents).filter((t) => t.isSuperTalent);
    expect(starred).toEqual([]);
  });

  it('marks active talents so the border variant can differ', () => {
    const hydrated = hydrate({ ...CLASS, payload: { v: 1, tabs: [] } });
    const all = hydrated.tabs.flatMap((tab) => tab.talents);
    expect(all.some((t) => t.isActiveTalent)).toBe(true);
    expect(all.some((t) => !t.isActiveTalent)).toBe(true);
  });
});
