// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useBarMenu } from '@components/common/NavBar/NavMenu';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const hoverOpen = (result, menu) => {
  act(() => result.current.restOn(menu));
  act(() => vi.advanceTimersByTime(200));
};

describe('the bar menus: hover opens, a click pins', () => {
  it.each([
    [199, null],
    [200, 'worlds']
  ])('a mouse resting %i ms on Worlds leaves the open menu at %s', (rest, expected) => {
    const { result } = renderHook(() => useBarMenu());
    act(() => result.current.restOn('worlds'));
    act(() => vi.advanceTimersByTime(rest));
    expect(result.current.openMenu).toBe(expected);
  });

  it.each([
    ['leaves for good', false, null],
    ['comes back into the panel', true, 'worlds']
  ])('a menu the mouse opened, when the mouse %s, ends at %s', (_, comesBack, expected) => {
    const { result } = renderHook(() => useBarMenu());
    hoverOpen(result, 'worlds');
    act(() => result.current.leave());
    act(() => vi.advanceTimersByTime(100));
    if (comesBack) act(() => result.current.stayOpen());
    act(() => vi.advanceTimersByTime(300));
    expect(result.current.openMenu).toBe(expected);
  });

  it.each([
    [599, 'worlds'],
    [600, null]
  ])('a mouse click %i ms after the rest opened Worlds leaves the open menu at %s', (after, expected) => {
    const { result } = renderHook(() => useBarMenu());
    hoverOpen(result, 'worlds');
    act(() => vi.advanceTimersByTime(after));
    act(() => result.current.toggleMenu('worlds', null, true));
    expect(result.current.openMenu).toBe(expected);
  });

  it('a mouse click opens a menu at once, and the mouse leaving closes it', () => {
    const { result } = renderHook(() => useBarMenu());
    act(() => result.current.toggleMenu('worlds', null, true));
    expect(result.current.openMenu).toBe('worlds');
    act(() => result.current.leave());
    act(() => vi.advanceTimersByTime(300));
    expect(result.current.openMenu).toBe(null);
  });

  it('a tap or Enter opens a menu to stay past a leave, and the same press closes it', () => {
    const { result } = renderHook(() => useBarMenu());
    act(() => result.current.toggleMenu('worlds'));
    act(() => result.current.leave());
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.openMenu).toBe('worlds');
    act(() => result.current.toggleMenu('worlds'));
    expect(result.current.openMenu).toBe(null);
  });
});
