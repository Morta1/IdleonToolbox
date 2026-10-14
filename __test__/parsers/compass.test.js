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
    expect(result.upgrades[0].name).toBe('Pathfinder');
    expect(getCompass(undefined, [], undefined, undefined).upgrades).toHaveLength(liveCount(compass));
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

  it('applies save levels at the right indexes (synthetic, unconditional)', () => {
    const compassRaw = [[5, 3, 0, 0, 0]];
    const idleonData = { Compass: JSON.stringify(compassRaw) };
    const result = getCompass(idleonData, [], {}, {});
    expect(result.upgrades[0].level).toBe(5);
    expect(result.upgrades[1].level).toBe(3);
    expect(result.upgrades[4].level).toBe(0);
    expect(result.upgrades).toHaveLength(liveCount(compass));
  });

  it('prints bonuses below 0.9 per level with NotateNumber "Small", the rest with CommaNotation', () => {
    // game: the compass panel fills `{` with NotateNumber(CompassBonus, "Small") when x5 < 0.9,
    // else CommaNotation; "Small" rounds to hundredths below 1 and to tenths below 100
    const levels = [];
    levels[43] = 3; // Moon of Print, x5 0.02 -> 0.06
    levels[57] = 7; // Moon of Sleep, x5 0.2 -> 1.4
    levels[1] = 3; // Elemental Path, x5 1 -> 3
    const idleonData = { Compass: JSON.stringify([levels]) };
    const byIndex = (result, index) => result.upgrades.find((u) => u.index === index);
    const result = getCompass(idleonData, [], {}, {});
    expect(byIndex(result, 43).description).toBe('3d_Printer_Samples_grow_by_+0.06%_every_day_for_100_days');
    expect(byIndex(result, 57).description).toBe('+1.4%_AFK_Gains_for_all_characters');
    expect(byIndex(result, 1).description).toBe(compass[1].description.replace(/{/g, '3'));
  });
});

const FIXTURES = [['first', first], ['second', second], ['third', third], ['fourth', fourth], ['latest', latest]];

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
});
