import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getTesseract, getTachyonType, getTachyonQuantityBase } from '@parsers/class-specific/tesseract';
import { liveCount } from '@parsers/catalog';
import { tesseract } from '@website-data';
import { tryToParse } from '@utility/helpers';
import first from '../fixtures/first.json';
import second from '../fixtures/second.json';
import third from '../fixtures/third.json';
import fourth from '../fixtures/fourth.json';
import latest from '../fixtures/latest.json';

describe('getTesseract', () => {
  it('returns every live upgrade when the save is missing', () => {
    const result = getTesseract(undefined, [], {});
    expect(result.upgrades).toHaveLength(liveCount(tesseract));
    expect(result.upgrades.every((u) => u.level === 0)).toBe(true);
  });

  it('never crashes with no idleonData/account/characters', () => {
    expect(() => getTesseract(undefined, undefined, undefined)).not.toThrow();
  });

  it('populates tachyons as a neutral 6-entry array', () => {
    const result = getTesseract(undefined, [], {});
    expect(result.tachyons).toHaveLength(6);
    expect(result.tachyons.every((t) => t.value === 0)).toBe(true);
    expect(result.totalTachyons).toBe(0);
  });

  it('never produces NaN/Infinity drop chances with no save', () => {
    const result = getTesseract(undefined, [], {});
    expect(Number.isFinite(result.weaponDropChance)).toBe(true);
    expect(Number.isFinite(result.ringDropChance)).toBe(true);
  });

  it('carries catalog fields through', () => {
    const [first] = getTesseract(undefined, [], {}).upgrades;
    expect(first.name).toBe('Arcanist_Damage_製_(Tap_for_more_info)');
  });

  it('applies save levels at the right indexes (synthetic, unconditional)', () => {
    const idleonData = { Arcane: [5, 3, 0, 0, 0] };
    const result = getTesseract(idleonData, [], {});
    expect(result.upgrades[0].level).toBe(5);
    expect(result.upgrades[1].level).toBe(3);
    expect(result.upgrades[4].level).toBe(0);
    expect(result.upgrades).toHaveLength(liveCount(tesseract));
  });
});

const FIXTURES = [['first', first], ['second', second], ['third', third], ['fourth', fourth], ['latest', latest]];

const FIXTURES_WITH_ARCANE = FIXTURES.filter(([, fixture]) => (fixture.data ?? fixture)?.Arcane != null);

describe('getTesseract fixture regression', () => {
  it.each(FIXTURES_WITH_ARCANE)('%s: levels the save covers are unchanged at the same index', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const tesseractRaw = tryToParse(data?.Arcane) || [];
    const result = getTesseract(data, [], {});

    expect(tesseractRaw.length).toBeGreaterThan(0);
    tesseractRaw.forEach((level, index) => {
      if (index >= result.upgrades.length) return;
      expect(result.upgrades[index].level).toBe(level);
    });
  });

  it.each(FIXTURES)('%s: returns the full catalog length regardless of save', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const result = getTesseract(data, [], {});
    expect(result.upgrades).toHaveLength(liveCount(tesseract));
  });

  it.each(FIXTURES)('%s: never throws', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    expect(() => getTesseract(data, [], {})).not.toThrow();
  });
});

// The game hardcodes a dev-tuned tachyon tier per coin-quantity index before falling back to a
// generic curve (N.js `ArcaneTachyonType`). A missing entry silently falls through to the curve
// and shows the wrong colour and amount: 870 (snowball / Rollin' Tundra) was omitted and rendered
// as tier 0 at ~237 instead of tier 2 at ~17. Values below were read off the live game.
describe('getTachyonType special cases', () => {
  const SPECIAL_CASES = [
    [5e5, 5], [12500, 4], [4e5, 4], [2500, 3], [1850, 3],
    [770, 2], [870, 2], [1500, 2], [22e3, 2], [23e4, 2],
    [6e3, 1], [2e5, 1], [8500, 0], [17e3, 0], [175e3, 0]
  ];

  it.each(SPECIAL_CASES)('index %i is tier %i', (index, tier) => {
    expect(getTachyonType(index)).toBe(tier);
  });

  it('snowball (870) uses the tier 2 quantity curve, not the generic one', () => {
    expect(getTachyonQuantityBase(870)).toBeCloseTo(17.247390031976664, 9);
  });
});
