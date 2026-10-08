// @vitest-environment jsdom
import '../../../polyfills';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { HIGHLIGHT_DURATION, useHighlightTarget } from '@components/dashboard/settings/useHighlightTarget';

describe('useHighlightTarget', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('tints when it becomes the target, fades, and re-fires on a new key', () => {
    const view = renderHook(({ active, key }) => useHighlightTarget(active, key), { initialProps: { active: false, key: null } });
    expect(view.result.current[1]).toBe(false);
    const first = {};
    view.rerender({ active: true, key: first });
    expect(view.result.current[1]).toBe(true);
    act(() => vi.advanceTimersByTime(HIGHLIGHT_DURATION));
    expect(view.result.current[1]).toBe(false);
    view.rerender({ active: true, key: {} });
    expect(view.result.current[1]).toBe(true);
  });

  it('drops the tint when it stops being the target', () => {
    const view = renderHook(({ active }) => useHighlightTarget(active), { initialProps: { active: true } });
    expect(view.result.current[1]).toBe(true);
    view.rerender({ active: false });
    expect(view.result.current[1]).toBe(false);
  });
});
