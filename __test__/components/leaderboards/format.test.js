import '../../../polyfills';
import { describe, expect, it, vi } from 'vitest';
import { notateNumber } from '@utility/helpers';
import { AGGREGATION_INTERVAL, buildMetaIndex, formatMetricValue, formatStep, metaOf, staleUntilNextRun } from '@components/leaderboards/format';

const meta = {
  createdAt: 100,
  totalPlayers: 2608,
  categories: [
    { category: 'general', metrics: [
      { key: 'totalMoney', label: 'Total Money', section: 'Account', notation: 'default' },
      { key: 'logSample', label: 'Log Sample', section: '3D Printer Samples', notation: 'default' },
      { key: 'bits', label: 'Bits', section: 'Account', notation: 'bits', maxed: false }
    ] },
    { category: 'skills', metrics: [{ key: 'mining', label: 'Mining', section: 'Skills', notation: 'default', top: 304, maxed: false }] }
  ]
};

describe('formatMetricValue', () => {
  it('applies each notation', () => {
    expect(formatMetricValue('points', 14901.02)).toBe('14,901 pts');
    expect(formatMetricValue('bits', 5e9)).toBe(notateNumber(5e9, 'bits'));
    expect(formatMetricValue('multiplier', 3.2)).toBe(notateNumber(3.2, 'MultiplierInfo'));
    expect(formatMetricValue('default', 240)).toBe(notateNumber(240));
    expect(formatMetricValue(undefined, 240)).toBe(notateNumber(240));
  });
});

describe('formatMetricValue below a million', () => {
  it('shows exact figures with commas, and notates from a million up', () => {
    expect(formatMetricValue('default', 1724)).toBe('1,724');
    expect(formatMetricValue('default', 20184.9)).toBe('20,184');
    expect(formatMetricValue('default', 999_999)).toBe('999,999');
    expect(formatMetricValue('default', 0)).toBe('0');
    expect(formatMetricValue('default', 1e6)).toBe(notateNumber(1e6));
    expect(formatMetricValue('default', 3.2e9)).toBe(notateNumber(3.2e9));
  });

  it('leaves bits and multipliers alone', () => {
    expect(formatMetricValue('bits', 5000)).toBe(notateNumber(5000, 'bits'));
    expect(formatMetricValue('multiplier', 1500)).toBe(notateNumber(1500, 'MultiplierInfo'));
  });
});

describe('formatStep', () => {
  it('keeps a small fractional step readable instead of rounding it to 0', () => {
    expect(formatStep('points', 1.8000000001)).toBe('1.8 pts');
    expect(formatStep('default', 0.42)).toBe('0.42');
    expect(formatStep('points', 120.4)).toBe('120 pts');
    expect(formatStep('default', 1)).toBe('1');
    expect(formatStep('default', 2.5e9)).toBe(formatMetricValue('default', 2.5e9));
  });
});

describe('buildMetaIndex', () => {
  it('finds only its own keys, never inherited ones', () => {
    const index = buildMetaIndex(meta);
    for (const key of ['constructor', '__proto__', 'toString', 'hasOwnProperty']) {
      expect(index.byKey[key]).toBeUndefined();
      expect(Object.hasOwn(index.byKey, key)).toBe(false);
    }
    expect(Object.hasOwn(index.byKey, 'mining')).toBe(true);
  });

  it('groups sections by first appearance and keeps board order', () => {
    const index = buildMetaIndex(meta);
    expect(index.categories.general.sections).toEqual([
      { name: 'Account', metrics: ['totalMoney', 'bits'] },
      { name: '3D Printer Samples', metrics: ['logSample'] }
    ]);
    expect(index.categories.general.metrics).toEqual(['totalMoney', 'logSample', 'bits']);
    expect(index.byKey.mining).toMatchObject({ category: 'skills', top: 304 });
    expect(index.byKey.globalRanking).toMatchObject({ label: 'Global ranking', notation: 'points' });
    expect(index.totalPlayers).toBe(2608);
  });

  it('is empty but usable without meta', () => {
    const index = buildMetaIndex(undefined);
    expect(index.categories).toEqual({});
    expect(metaOf(index, 'totalMoney')).toEqual({ key: 'totalMoney', label: 'Total Money', section: '', notation: 'default', category: null });
  });
});

describe('staleUntilNextRun', () => {
  it('stays fresh until 30 minutes after createdAt', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_000_000);
    expect(staleUntilNextRun({ state: { data: { createdAt: 1_000_000 - 60_000 } } })).toBe(AGGREGATION_INTERVAL - 60_000);
    expect(staleUntilNextRun({ state: { data: { createdAt: 0 } } })).toBe(AGGREGATION_INTERVAL);
    expect(staleUntilNextRun({ state: { data: null } })).toBe(AGGREGATION_INTERVAL);
    vi.restoreAllMocks();
  });
});
