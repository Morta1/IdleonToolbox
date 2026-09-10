// @vitest-environment jsdom
import '../../polyfills';
import React, { useContext } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { act, render } from '@testing-library/react';

// isReady false keeps the init effect (and with it firebase) out of the picture: this file is
// about the first render and the storage merge, nothing else.
vi.mock('next/router', () => ({
  useRouter: () => ({ isReady: false, query: {}, pathname: '/wiki', push: vi.fn(), replace: vi.fn() })
}));

const { default: AppProvider, AppContext, ACTION_TYPES, DEFAULT_STATE, appReducer, readStoredState, removeStored } =
  await import('@components/common/context/AppProvider');

const Probe = () => {
  const { state } = useContext(AppContext);
  return <span data-testid="probe">{JSON.stringify({
    isLoading: state.isLoading,
    hydrated: state.storageHydrated,
    filters: state.filters ?? null,
    pinned: state.pinnedPages
  })}</span>;
};

describe('reducer', () => {
  it('HYDRATE_STORAGE merges stored values and flags hydration', () => {
    const next = appReducer(
      { isLoading: true, storageHydrated: false },
      { type: ACTION_TYPES.HYDRATE_STORAGE, data: { filters: { a: true } } }
    );
    expect(next).toEqual({ isLoading: true, storageHydrated: true, filters: { a: true } });
  });

  it('LOGOUT keeps storageHydrated so preferences still persist afterwards', () => {
    const next = appReducer(
      { storageHydrated: true, account: {}, filters: { a: true } },
      { type: ACTION_TYPES.LOGOUT }
    );
    expect(next.storageHydrated).toBe(true);
    expect(next.account).toBeUndefined();
    expect(next.filters).toEqual({ a: true });
  });
});

describe('readStoredState', () => {
  beforeEach(() => localStorage.clear());

  it('defaults pinnedPages and skips keys that do not parse', () => {
    localStorage.setItem('filters', JSON.stringify({ a: true }));
    localStorage.setItem('planner', '{not json');
    expect(readStoredState()).toEqual({ filters: { a: true }, pinnedPages: [] });
  });
});

describe('removeStored', () => {
  afterEach(() => vi.restoreAllMocks());

  it('swallows a throwing storage so logout still reaches loadEmptyAccount', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(() => removeStored('charactersData')).not.toThrow();
    expect(() => removeStored('rawJson', 'session')).not.toThrow();
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('clears the key it was given', () => {
    localStorage.setItem('charactersData', '1');
    sessionStorage.setItem('rawJson', '1');
    removeStored('charactersData');
    removeStored('rawJson', 'session');
    expect(localStorage.getItem('charactersData')).toBeNull();
    expect(sessionStorage.getItem('rawJson')).toBeNull();
  });
});

describe('first render', () => {
  beforeEach(() => localStorage.clear());

  it('starts from DEFAULT_STATE on the server even when storage has values', () => {
    localStorage.setItem('filters', JSON.stringify({ a: true }));
    const html = renderToString(<AppProvider><Probe/></AppProvider>);
    expect(html).toContain('&quot;isLoading&quot;:true');
    expect(html).toContain('&quot;hydrated&quot;:false');
    expect(html).toContain('&quot;filters&quot;:null');
    expect(DEFAULT_STATE.storageHydrated).toBe(false);
  });

  it('merges storage in an effect after the first client render', async () => {
    localStorage.setItem('filters', JSON.stringify({ a: true }));
    const { getByTestId } = render(<AppProvider><Probe/></AppProvider>);
    await act(async () => {});
    const probe = JSON.parse(getByTestId('probe').textContent);
    expect(probe.hydrated).toBe(true);
    expect(probe.filters).toEqual({ a: true });
    expect(probe.isLoading).toBe(true);
  });
});
