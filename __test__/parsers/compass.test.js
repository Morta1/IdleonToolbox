import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getCompass } from '@parsers/class-specific/compass';
import { liveCount } from '@parsers/catalog';
import { compass } from '@website-data';
import { tryToParse } from '@utility/helpers';
import latest from '../fixtures/latest.json';

describe('getCompass', () => {
  it('returns every live upgrade when the save is missing', () => {
    const result = getCompass(undefined, [], {}, {});
    expect(result.upgrades).toHaveLength(liveCount(compass));
    expect(result.upgrades.every((u) => u.level === 0)).toBe(true);
    expect(result.upgrades[0].name).toBe('Pathfinder');
    expect(getCompass(undefined, [], undefined, undefined).upgrades).toHaveLength(liveCount(compass));
  });

  it('populates dusts as a neutral 5-entry array', () => {
    const result = getCompass(undefined, [], {}, {});
    expect(result.dusts).toHaveLength(5);
    expect(result.dusts.every((d) => d.value === 0)).toBe(true);
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

// The older saves carry no key at all, which is the missing-save path above
describe('getCompass on a real save', () => {
  it('reads every level at its index, across the whole catalog', () => {
    const raw = tryToParse(latest.data.Compass)[0];
    const { upgrades } = getCompass(latest.data, [], {}, {});
    expect(raw.length).toBeGreaterThan(0);
    expect(upgrades.map(({ level }) => level)).toEqual(Array.from({ length: liveCount(compass) }, (_, index) => raw[index] ?? 0));
  });
});
