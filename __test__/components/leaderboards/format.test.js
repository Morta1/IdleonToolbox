import '../../../polyfills';
import { describe, expect, it, vi } from 'vitest';
import { AGGREGATION_INTERVAL, buildMetaIndex, formatDistinctValues, formatExactValue, formatMetricValue, formatStep, metaOf, rankText, staleUntilNextRun, untilNextRun } from '@components/leaderboards/format';

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
    expect(formatMetricValue('points', 14901.02)).toBe('14,901.02 pts');
    expect(formatMetricValue('multiplier', 3.2)).toBe('3.20');
    expect(formatMetricValue('default', 240)).toBe('240');
    expect(formatMetricValue(undefined, 240)).toBe('240');
  });

  it('shows exact figures with commas below a million on a board that stays below it', () => {
    expect(formatMetricValue('default', 1724, { scale: 900_000 })).toBe('1,724');
    expect(formatMetricValue('default', 20184.9, { scale: 900_000 })).toBe('20,185');
    expect(formatMetricValue('default', 999_999)).toBe('999,999');
    expect(formatMetricValue('default', 0)).toBe('0');
    expect(formatMetricValue('multiplier', 870329.134, { scale: 900_000 })).toBe('870,329.13');
  });

  it('shows every value short on a board that reaches a million', () => {
    expect(formatMetricValue('multiplier', 3_009_320_000, { scale: 3.01e9 })).toBe('3.01B');
    expect(formatMetricValue('multiplier', 870329.134, { scale: 3.01e9 })).toBe('870K');
    expect(formatMetricValue('multiplier', 400.66, { scale: 3.01e9 })).toBe('400.66');
    expect(formatMetricValue('default', 990_882, { scale: 1.23e6 })).toBe('991K');
    expect(formatMetricValue('default', 4200, { scale: 1.57e25 })).toBe('4.20K');
    expect(formatMetricValue('default', 999, { scale: 1.57e25 })).toBe('999');
  });

  it('treats bits as plain numbers', () => {
    expect(formatMetricValue('bits', 2.7576e119, { scale: 2.7576e119 })).toBe('2.76E119');
    expect(formatExactValue('bits', 2.7576e119)).toBe('2.75760E119');
  });

  it('shows a dash for a missing value', () => {
    expect(formatMetricValue('default', undefined)).toBe('-');
  });
});

describe('formatMetricValue short form', () => {
  it('rounds to the nearest with three significant figures, trailing zeros kept', () => {
    expect(formatMetricValue('default', 56_831_731)).toBe('56.8M');
    expect(formatMetricValue('default', 96_517_910)).toBe('96.5M');
    expect(formatMetricValue('default', 35_000_000)).toBe('35.0M');
    expect(formatMetricValue('default', 1e6)).toBe('1.00M');
    expect(formatMetricValue('default', 4.9047e18)).toBe('4.90QQ');
    expect(formatMetricValue('default', 1.3176e62)).toBe('1.32E62');
    expect(formatMetricValue('default', 6.9e36)).toBe('6.90E36');
    expect(formatMetricValue('default', 9.996e62)).toBe('1.00E63');
  });

  it('moves to the next suffix when rounding reaches 1000', () => {
    expect(formatMetricValue('default', 999_600_000)).toBe('1.00B');
    expect(formatMetricValue('default', 999_700, { scale: 2e6 })).toBe('1.00M');
    expect(formatMetricValue('default', 999.7e18)).toBe('1.00E21');
  });

  it('keeps one notation across a board that reaches E notation', () => {
    expect(formatMetricValue('default', 5.11e19)).toBe('51.1QQ');
    expect(formatMetricValue('default', 5.11e19, { scale: 1.57e25 })).toBe('5.11E19');
  });
});

describe('formatExactValue', () => {
  it('gives full precision where the short form would hide the gap', () => {
    expect(formatExactValue('default', 93_912_345)).toBe('93,912,345');
    // Fractional scores keep two decimals, so a 0.21 gap is visible.
    expect(formatExactValue('default', 498506.8800000001)).toBe('498,506.88');
    expect(formatExactValue('default', 498506.66799999983)).toBe('498,506.67');
    expect(formatExactValue('default', 100.0000001)).toBe('100');
    // Past a trillion a double has no real decimals.
    expect(formatExactValue('default', 980059689370745.6)).toBe('980,059,689,370,746');
    expect(formatExactValue('points', 16278.42)).toBe('16,278.42 pts');
    expect(formatExactValue('default', 1.3176090741400986e62)).toBe('1.31761E62');
  });
});

describe('rankText', () => {
  it('groups thousands', () => {
    expect(rankText(1220)).toBe('#1,220');
    expect(rankText(5)).toBe('#5');
    expect(rankText(null)).toBe('#-');
  });
});

describe('formatStep', () => {
  it('keeps a small fractional step readable instead of rounding it to 0', () => {
    expect(formatStep('points', 1.8000000001)).toBe('1.80 pts');
    expect(formatStep('default', 0.42)).toBe('0.42');
    expect(formatStep('default', 0.001)).toBe('0.001');
    // Never +0.00, and rounded up so it reaches.
    expect(formatStep('multiplier', 0.000278)).toBe('0.00028');
    expect(formatStep('default', 0.212)).toBe('0.22');
    expect(formatStep('default', 0.0113)).toBe('0.012');
    expect(formatStep('default', 30_546_577, { scale: 1e9 })).toBe('30.6M');
    expect(formatStep('default', 6.0038e12, { scale: 1e14 })).toBe('6.01T');
    expect(formatStep('multiplier', 14.9016)).toBe('14.91');
    expect(formatStep('points', 2.311)).toBe('2.32 pts');
    expect(formatStep('points', 120.4)).toBe('120.40 pts');
    // A step that really reaches: +117 would fall short of a 117.32 gap.
    expect(formatStep('default', 117.32)).toBe('118');
    expect(formatStep('default', 117.00000000001)).toBe('117');
    expect(formatStep('multiplier', 380.07)).toBe('380.07');
    expect(formatStep('default', 2333, { scale: 1e8 })).toBe('2,333');
    expect(formatStep('default', 1)).toBe('1');
    expect(formatStep('default', 2.5e9)).toBe('2.50B');
    expect(formatStep('default', 2333, { scale: 1e8 })).toBe('2,333');
    expect(formatStep('bits', 5.69e20, { scale: 2.7e119 })).toBe('5.69E20');
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

describe('untilNextRun', () => {
  it('waits for the next run plus a grace, then polls every two minutes, and never without data', () => {
    const now = Date.UTC(2026, 9, 8, 20, 0);
    vi.useFakeTimers({ now });
    const at = (createdAt) => untilNextRun({ state: { data: createdAt == null ? undefined : { createdAt } } });
    expect(at(now)).toBe(AGGREGATION_INTERVAL + 2 * 60 * 1000);
    expect(at(now - AGGREGATION_INTERVAL - 10 * 60 * 1000)).toBe(2 * 60 * 1000);
    expect(at(null)).toBe(false);
    vi.useRealTimers();
  });
});

describe('formatDistinctValues', () => {
  it('keeps the board style with just enough figures to tell neighbours apart', () => {
    expect(formatDistinctValues('default', [94_681_382.33, 94_653_886.83, 94_600_000], { scale: 2.04e8 })).toEqual(['94.68M', '94.65M', '94.60M']);
    expect(formatDistinctValues('default', [7.05237e15, 6.8258e15], { scale: 2.34e17 })).toEqual(['7.05Q', '6.83Q']);
    expect(formatDistinctValues('multiplier', [385_382.06, 369_925.85], { scale: 3.01e9 })).toEqual(['385K', '370K']);
  });

  it('treats float noise as the same value, so a group still aligns', () => {
    // 11,370.6 and 11,370.8 both round to 11,371, so every row gets decimals, the noisy 11,445 included.
    expect(formatDistinctValues('default', [11483.3, 11444.999999996, 11445, 11370.8, 11370.6], { scale: 11_666 }))
      .toEqual(['11,483.30', '11,445.00', '11,445.00', '11,370.80', '11,370.60']);
  });

  it('falls back to the exact figure when only decimals differ', () => {
    expect(formatDistinctValues('default', [498506.88, 498506.668], { scale: 541_225 })).toEqual(['498,506.88', '498,506.67']);
  });

  it('lets equal values read the same', () => {
    expect(formatDistinctValues('default', [500, 500, 400], { scale: 900 })).toEqual(['500', '500', '400']);
  });
});

describe('round 4 value rules', () => {
  it('rounds an exact half up on its own digits', () => {
    expect(formatMetricValue('default', 2295, { scale: 1e8 })).toBe('2.30K');
    expect(formatMetricValue('default', 5225, { scale: 1e8 })).toBe('5.23K');
  });

  it('keeps two decimals on small values that are not whole', () => {
    expect(formatMetricValue('default', 1.3, { scale: 1.47e6 })).toBe('1.30');
    expect(formatMetricValue('default', 3, { scale: 1.47e6 })).toBe('3');
    expect(formatExactValue('multiplier', 8.6708)).toBe('8.6708');
  });

  it('separates small multipliers with more decimals and keeps a column aligned', () => {
    expect(formatDistinctValues('multiplier', [8.6708, 8.6656, 8.8313], { scale: 3.01e9 })).toEqual(['8.671', '8.666', '8.831']);
    expect(formatDistinctValues('default', [8488, 8487.6, 8475.8], { scale: 11_666 })).toEqual(['8,488.00', '8,487.60', '8,475.80']);
  });
});
