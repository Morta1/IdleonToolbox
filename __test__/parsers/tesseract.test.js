import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getTesseract } from '@parsers/class-specific/tesseract';
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
    // Hand-built save: Arcane is the upgrade-level array directly. Runs unconditionally because
    // most fixtures below have no Arcane field at all.
    const idleonData = { Arcane: [5, 3, 0, 0, 0] };
    const result = getTesseract(idleonData, [], {});
    expect(result.upgrades[0].level).toBe(5);
    expect(result.upgrades[1].level).toBe(3);
    expect(result.upgrades[4].level).toBe(0);
    expect(result.upgrades).toHaveLength(liveCount(tesseract));
  });
});

const FIXTURES = [['first', first], ['second', second], ['third', third], ['fourth', fourth], ['latest', latest]];

describe('getTesseract fixture regression', () => {
  it.each(FIXTURES)('%s: levels the save covers are unchanged at the same index', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const tesseractRaw = tryToParse(data?.Arcane) || [];
    const result = getTesseract(data, [], {});

    tesseractRaw?.forEach((level, index) => {
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
