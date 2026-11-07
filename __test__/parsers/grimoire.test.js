import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getGrimoire } from '@parsers/class-specific/grimoire';
import { liveCount } from '@parsers/catalog';
import { grimoire } from '@website-data';
import { tryToParse } from '@utility/helpers';
import latest from '../fixtures/latest.json';

describe('getGrimoire', () => {
  it('returns every live upgrade when the save is missing', () => {
    const result = getGrimoire(undefined, [], {});
    expect(result.upgrades).toHaveLength(liveCount(grimoire));
    expect(result.upgrades.every((u) => u.level === 0)).toBe(true);
    expect(result.upgrades[0].name).toBe('Wraith_Damage');
    expect(getGrimoire(undefined, [], undefined).upgrades).toHaveLength(liveCount(grimoire));
  });

  it('populates bones as a neutral 4-entry array', () => {
    const result = getGrimoire(undefined, [], {});
    expect(result.bones).toHaveLength(4);
    expect(result.bones.every((b) => b === 0)).toBe(true);
  });

  it('applies save levels at the right indexes (synthetic, unconditional)', () => {
    const idleonData = { Grimoire: [5, 3, 0, 0, 0] };
    const result = getGrimoire(idleonData, [], {});
    expect(result.upgrades[0].level).toBe(5);
    expect(result.upgrades[1].level).toBe(3);
    expect(result.upgrades[4].level).toBe(0);
    expect(result.upgrades).toHaveLength(liveCount(grimoire));
  });
});

// The older saves carry no key at all, which is the missing-save path above
describe('getGrimoire on a real save', () => {
  it('reads every level at its index, across the whole catalog', () => {
    const raw = tryToParse(latest.data.Grimoire) || latest.data.Grimoire;
    const { upgrades } = getGrimoire(latest.data, [], {});
    expect(raw.length).toBeGreaterThan(0);
    expect(upgrades.map(({ level }) => level)).toEqual(Array.from({ length: liveCount(grimoire) }, (_, index) => raw[index] ?? 0));
  });
});
