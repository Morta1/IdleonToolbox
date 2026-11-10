// @vitest-environment jsdom
import '../../polyfills';
import React, { useContext } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, renderHook, waitFor } from '@testing-library/react';

// One router object the tests steer, standing in for client-side navigation.
const router = vi.hoisted(() => ({ isReady: true, query: {}, pathname: '/wiki/[kind]/[slug]', push: () => {}, replace: () => {} }));
vi.mock('next/router', () => ({ useRouter: () => router }));

// The parse every anonymous visitor used to pay for. Spied so a test can say it never ran.
const parseData = vi.hoisted(() => vi.fn(() => ({ account: { empty: true }, characters: [] })));
vi.mock('@parsers/index', () => ({ parseData }));

// A session firebase finds, whose save never lands here. The anonymous tests never ask: their hint skips firebase.
vi.mock('../../firebase/lazy', () => ({
  firebaseRequested: () => false,
  loadFirebase: async () => ({ checkUserStatus: async () => ({ uid: 'a', accessToken: 'b' }), subscribe: async () => () => {} })
}));

const { BAND_SLOT_ATTR } = await import('@utility/band-slot');
const { routeNeedsAccount } = await import('@utility/account-routes');
const { default: AppProvider, AppContext } = await import('@components/common/context/AppProvider');
const { default: usePageDataLoading } = await import('@hooks/usePageDataLoading');

describe('routeNeedsAccount', () => {
  // Anything not audited keeps the old behaviour: a page added later can't silently lose its data.
  it('skips the parsed account on an audited route only', () => {
    expect(['/wiki/[kind]/[slug]', '/dashboard', '/some-future-page'].map(routeNeedsAccount)).toEqual([false, true, true]);
  });
});

describe('usePageDataLoading for an anonymous visitor', () => {
  const withState = (state) => ({ children }) => (
    <AppContext.Provider value={{ state, dispatch: () => {} }}>{children}</AppContext.Provider>
  );

  it('a data route waits for the parsed empty account', () => {
    router.pathname = '/dashboard';
    const flagsOnly = { isLoading: false, signedIn: false, emptyAccount: true };
    expect(renderHook(usePageDataLoading, { wrapper: withState(flagsOnly) }).result.current.loading).toBe(true);

    const parsed = { ...flagsOnly, account: { empty: true }, characters: [] };
    expect(renderHook(usePageDataLoading, { wrapper: withState(parsed) }).result.current.loading).toBe(false);
  });

  // No account ever comes there, so waiting for one would be a loader that never ends.
  it('an audited route waits for nothing', () => {
    router.pathname = '/tools/active-exp-calculator';
    const flagsOnly = { isLoading: false, signedIn: false, emptyAccount: true };
    expect(renderHook(usePageDataLoading, { wrapper: withState(flagsOnly) }).result.current.loading).toBe(false);
  });
});

describe('AppProvider anonymous visitor', () => {
  const seen = { current: null };
  const Probe = () => {
    seen.current = useContext(AppContext).state;
    return null;
  };

  beforeEach(() => {
    localStorage.clear();
    // A returning anonymous visitor: the hint lets AppProvider skip firebase entirely.
    localStorage.setItem('authHint', 'no');
    parseData.mockClear();
    router.pathname = '/wiki/[kind]/[slug]';
  });

  it('settles a static page without importing the parsers', async () => {
    render(<AppProvider><Probe/></AppProvider>);
    await waitFor(() => expect(seen.current.isLoading).toBe(false));
    expect(seen.current).toMatchObject({ signedIn: false, emptyAccount: true });
    expect(seen.current.account).toBeUndefined();
    expect(parseData).not.toHaveBeenCalled();
  });

  it('parses the empty account once the visitor navigates to a data page', async () => {
    const view = render(<AppProvider><Probe/></AppProvider>);
    await waitFor(() => expect(seen.current.isLoading).toBe(false));

    router.pathname = '/dashboard';
    await act(async () => view.rerender(<AppProvider><Probe/></AppProvider>));
    await waitFor(() => expect(seen.current.account).toEqual({ empty: true }));
    expect(parseData).toHaveBeenCalledTimes(1);

    // Moving between data pages reuses it.
    router.pathname = '/characters';
    await act(async () => view.rerender(<AppProvider><Probe/></AppProvider>));
    expect(parseData).toHaveBeenCalledTimes(1);
  });

  it('parses up front when the visitor lands on a data page', async () => {
    router.pathname = '/account/world-3/printer';
    render(<AppProvider><Probe/></AppProvider>);
    await waitFor(() => expect(seen.current.account).toEqual({ empty: true }));
    expect(parseData).toHaveBeenCalledTimes(1);
  });

  // Over the loader it moves a little. In the save's commit the page's whole height moves with it, a shift ten times the size.
  it('closes a held band slot when firebase finds a session the hint did not know, before the save lands', async () => {
    localStorage.removeItem('authHint');
    document.documentElement.setAttribute(BAND_SLOT_ATTR, '');
    render(<AppProvider><Probe/></AppProvider>);
    await waitFor(() => expect(localStorage.getItem('authHint')).toBe('yes'));
    expect(document.documentElement.hasAttribute(BAND_SLOT_ATTR)).toBe(false);
    expect(seen.current.isLoading).toBe(true);
  });
});
