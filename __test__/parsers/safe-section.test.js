import '../../polyfills';
import { describe, expect, it, vi } from 'vitest';
import { safeSection } from '@parsers/safeSection';

describe('safeSection', () => {
  it('returns the parser result when it succeeds', () => {
    expect(safeSection('prayers', [], () => [{ name: 'Big_Brain_Time' }]))
      .toEqual([{ name: 'Big_Brain_Time' }]);
  });

  it('returns the fallback when the parser throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(safeSection('obols', { list: [] }, () => { throw new Error('boom'); }))
      .toEqual({ list: [] });
    spy.mockRestore();
  });

  it('names the failing section in the logged error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    safeSection('obols', null, () => { throw new Error('boom'); });
    expect(spy.mock.calls[0].join(' ')).toContain('obols');
    spy.mockRestore();
  });

  it('substitutes the fallback for undefined and null results', () => {
    expect(safeSection('prayers', [], () => undefined)).toEqual([]);
    expect(safeSection('prayers', [], () => null)).toEqual([]);
  });

  it('passes through falsy-but-valid results', () => {
    expect(safeSection('count', 99, () => 0)).toBe(0);
    expect(safeSection('flag', true, () => false)).toBe(false);
  });
});
