import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { isPlaceholder, liveEntries, liveCount } from '@parsers/catalog';
import { prayers, petGenes } from '@website-data';

describe('isPlaceholder', () => {
  it('flags engine filler entries', () => {
    expect(isPlaceholder({ name: 'Some_Prayer_Name0' })).toBe(true);
    expect(isPlaceholder({ name: 'filler' })).toBe(true);
    expect(isPlaceholder({ name: 'FILLERZZZ_ACH' })).toBe(true);
    expect(isPlaceholder({ name: 'Filler_bc_I_messed_up' })).toBe(true);
    expect(isPlaceholder('Filler')).toBe(true);
  });

  it('does not flag real entries that merely contain "filler"', () => {
    expect(isPlaceholder({ name: 'Refiller' })).toBe(false);
    expect(isPlaceholder({ name: 'Big_Brain_Time' })).toBe(false);
  });

  it('reads name, displayName, or rawName', () => {
    expect(isPlaceholder({ displayName: 'Filler' })).toBe(true);
    expect(isPlaceholder({ rawName: 'Filler' })).toBe(true);
  });

  it('treats non-entries as real so nothing is silently dropped', () => {
    expect(isPlaceholder(null)).toBe(false);
    expect(isPlaceholder(undefined)).toBe(false);
    expect(isPlaceholder(42)).toBe(false);
  });
});

describe('liveEntries', () => {
  it('preserves the original catalog index across holes', () => {
    const catalog = [{ name: 'A' }, { name: 'Filler' }, { name: 'B' }];
    expect(liveEntries(catalog)).toEqual([
      { entry: { name: 'A' }, index: 0 },
      { entry: { name: 'B' }, index: 2 }
    ]);
  });

  it('drops the filler rows of a real catalog and keeps one that has none whole', () => {
    expect(liveCount(prayers)).toBeLessThan(prayers.length);
    // Refiller is a real gene
    expect(liveCount(petGenes)).toBe(petGenes.length);
  });

  it('returns [] for missing catalogs', () => {
    expect(liveEntries(undefined)).toEqual([]);
    expect(liveEntries(null)).toEqual([]);
  });

});
