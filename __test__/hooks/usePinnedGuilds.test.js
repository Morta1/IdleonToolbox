// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePinnedGuilds } from '../../hooks/usePinnedGuilds';

const STORAGE_KEY = 'pinned-guilds';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe('usePinnedGuilds', () => {
  it('starts with an empty pin list when localStorage is empty', () => {
    const { result } = renderHook(() => usePinnedGuilds());
    expect(result.current.pinnedGuilds).toEqual([]);
  });

  it('togglePin adds a guild to the list and to localStorage, and isPinned knows it', () => {
    const { result } = renderHook(() => usePinnedGuilds());
    act(() => {
      result.current.togglePin('guild-a', 'Alpha Guild');
    });
    expect(result.current.pinnedGuilds).toEqual([{ id: 'guild-a', name: 'Alpha Guild' }]);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual([{ id: 'guild-a', name: 'Alpha Guild' }]);
    expect(result.current.isPinned('guild-a')).toBe(true);
    expect(result.current.isPinned('guild-b')).toBe(false);
  });

  it('togglePin removes a guild that is already pinned', () => {
    const { result } = renderHook(() => usePinnedGuilds());
    act(() => {
      result.current.togglePin('guild-a', 'Alpha Guild');
    });
    act(() => {
      result.current.togglePin('guild-a', 'Alpha Guild');
    });
    expect(result.current.pinnedGuilds).toHaveLength(0);
  });

  it('supports multiple pins (unbounded)', () => {
    const { result } = renderHook(() => usePinnedGuilds());
    act(() => {
      result.current.togglePin('g1', 'Guild One');
      result.current.togglePin('g2', 'Guild Two');
      result.current.togglePin('g3', 'Guild Three');
    });
    expect(result.current.pinnedGuilds).toHaveLength(3);
  });

  it('hydrates from localStorage on mount', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ id: 'guild-x', name: 'X Guild' }]));
    const { result } = renderHook(() => usePinnedGuilds());
    // @mantine/hooks reads from localStorage via useEffect after first render.
    // The initial render gets the default (empty); after effect it should update.
    // In jsdom / testing-library, effects run synchronously after render.
    expect(result.current.pinnedGuilds).toEqual([{ id: 'guild-x', name: 'X Guild' }]);
  });
});
