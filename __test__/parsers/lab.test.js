import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getLab } from '@parsers/world-4/lab';
import { liveCount } from '@parsers/catalog';
import { chips, jewels, labBonuses } from '@website-data';
import { tryToParse } from '@utility/helpers';
import first from '../fixtures/first.json';
import second from '../fixtures/second.json';
import third from '../fixtures/third.json';
import fourth from '../fixtures/fourth.json';
import latest from '../fixtures/latest.json';

describe('getLab', () => {
  it('returns every live chip/jewel/labBonus when the save is missing', () => {
    const result = getLab(undefined, [], {});
    expect(result.chips).toHaveLength(liveCount(chips));
    expect(result.jewels).toHaveLength(liveCount(jewels));
    expect(result.labBonuses).toHaveLength(liveCount(labBonuses));
    expect(result.chips.every((c) => c.amount === 0 && c.repoAmount === 0 && c.totalAmount === 0)).toBe(true);
    expect(result.jewels.every((j) => j.acquired === false && j.active === false)).toBe(true);
    expect(result.labBonuses.every((b) => b.active === false)).toBe(true);
  });

  it('carries catalog fields through', () => {
    const result = getLab(undefined, [], {});
    expect(result.chips[0].name).toBe('Grounded_Nanochip');
    expect(result.jewels[0].name).toBe('Amethyst_Rhinestone');
    expect(result.labBonuses[0].name).toBe('Animal_Farm');
  });
});

const FIXTURES = [['first', first], ['second', second], ['third', third], ['fourth', fourth], ['latest', latest]];

describe('getLab fixture regression', () => {
  it.each(FIXTURES)('%s: jewel acquisition the save covers is unchanged at the same index', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const labRaw = tryToParse(data?.Lab) || data?.Lab;
    const jewelsRaw = labRaw?.[14];
    const result = getLab(data, [], {});

    jewelsRaw?.forEach((flag, index) => {
      if (!jewels[index]) return; // beyond the catalog's live jewel count, filtered out by the real path
      expect(result.jewels[index].acquired).toBe(flag === 1);
    });
  });

  it.each(FIXTURES)('%s: chip/labBonus catalog length is unaffected by save length', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const result = getLab(data, [], {});
    expect(result.chips).toHaveLength(liveCount(chips));
    expect(result.labBonuses).toHaveLength(liveCount(labBonuses));
  });
});
