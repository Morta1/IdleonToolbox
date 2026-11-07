// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import useToolbarState from '@hooks/useToolbarState';

const DEFAULTS = { search: '', show: 'all', hideMaxed: false, sort: null };
afterEach(() => localStorage.clear());

describe('useToolbarState', () => {
  it('stores only the edits under the page key, and Reset brings the defaults back', () => {
    const { result } = renderHook(() => useToolbarState('grimoire', DEFAULTS));
    act(() => result.current[1]({ hideMaxed: true, sort: { key: 'cost', order: 'desc' } }));
    act(() => result.current[1]({ hideMaxed: false }));
    const edited = { state: result.current[0], stored: JSON.parse(localStorage.getItem('toolbar:grimoire')) };
    act(() => result.current[2]());
    expect({ edited, reset: { state: result.current[0], stored: localStorage.getItem('toolbar:grimoire') } }).toEqual({
      edited: { state: { ...DEFAULTS, sort: { key: 'cost', order: 'desc' } }, stored: { sort: { key: 'cost', order: 'desc' } } },
      reset: { state: DEFAULTS, stored: null }
    });
  });

  it('reads a stored page with the defaults it never saw and without the keys it no longer has', () => {
    localStorage.setItem('toolbar:grimoire', JSON.stringify({ hideLocked: true, show: 'maxed' }));
    const { result } = renderHook(() => useToolbarState('grimoire', DEFAULTS));
    expect(result.current[0]).toEqual({ ...DEFAULTS, show: 'maxed' });
  });
});
