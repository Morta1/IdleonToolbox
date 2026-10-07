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

const { routeNeedsAccount } = await import('@utility/account-routes');
const { default: AppProvider, AppContext } = await import('@components/common/context/AppProvider');
const { default: usePageDataLoading } = await import('@hooks/usePageDataLoading');

describe('routeNeedsAccount', () => {
  it.each([
    '/', '/wiki', '/wiki/[kind]', '/wiki/[kind]/[slug]', '/wiki/changelog', '/tools/builds', '/tools/builds/[slug]',
    '/patch-notes', '/privacy-policy', '/404', '/guilds', '/leaderboards', '/statistics'
  ])('%s renders without a parsed account', (pathname) => {
    expect(routeNeedsAccount(pathname)).toBe(false);
  });

  // Anything not audited keeps the old behaviour: a page added later can't silently lose its data.
  it.each([
    '/dashboard', '/characters', '/settings', '/account/world-3/printer', '/tools/card-search', '/tools/builds/edit',
    '/tools/builds/my-builds', '/guilds/detail', '/some-future-page'
  ])('%s still gets a parsed account', (pathname) => {
    expect(routeNeedsAccount(pathname)).toBe(true);
  });
});

describe('usePageDataLoading for an anonymous visitor', () => {
  const withState = (state) => ({ children }) => (
    <AppContext.Provider value={{ state, dispatch: () => {} }}>{children}</AppContext.Provider>
  );

  it.each(['/dashboard', '/characters'])('%s waits for the parsed empty account', (pathname) => {
    router.pathname = pathname;
    const flagsOnly = { isLoading: false, signedIn: false, emptyAccount: true };
    expect(renderHook(usePageDataLoading, { wrapper: withState(flagsOnly) }).result.current.loading).toBe(true);

    const parsed = { ...flagsOnly, account: { empty: true }, characters: [] };
    expect(renderHook(usePageDataLoading, { wrapper: withState(parsed) }).result.current.loading).toBe(false);
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
});
