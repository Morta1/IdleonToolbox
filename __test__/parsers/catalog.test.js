import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { isPlaceholder, liveEntries, liveCount } from '@parsers/catalog';
import { prayers, legendTalents, achievements, classes, itemsArray, petGenes } from '@website-data';

describe('isPlaceholder', () => {
  it('flags engine filler entries', () => {
    expect(isPlaceholder({ name: 'Some_Prayer_Name0' })).toBe(true);
    expect(isPlaceholder({ name: 'filler' })).toBe(true);
    expect(isPlaceholder({ name: 'FILLERZZZ_ACH' })).toBe(true);
    expect(isPlaceholder({ name: 'Filler_bc_I_messed_up' })).toBe(true);
    expect(isPlaceholder('Filler')).toBe(true);
  });

  it('does not flag real entries that merely contain "filler"', () => {
    // petGenes has a legitimate entry named Refiller.
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

  it('returns [] for missing catalogs', () => {
    expect(liveEntries(undefined)).toEqual([]);
    expect(liveEntries(null)).toEqual([]);
  });

  it('matches the measured live counts of the real catalogs', () => {
    expect(liveCount(prayers)).toBe(19);        // 25 total, 6 placeholders
    expect(liveCount(legendTalents)).toBe(40);  // 50 total, 10 placeholders
    expect(liveCount(achievements)).toBe(268);  // 420 total, 152 placeholders
    expect(liveCount(classes)).toBe(55);        // 63 total, 8 placeholders
    expect(liveCount(itemsArray)).toBe(2426);   // 2431 total, 5 placeholders
    expect(liveCount(petGenes)).toBe(36);       // 36 total, 0 placeholders (Refiller is real)
  });
});
