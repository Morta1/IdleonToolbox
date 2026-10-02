// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import darkTheme from '../../styles/theme/darkTheme';

Element.prototype.scrollIntoView = vi.fn();
const routerState = { isReady: true, query: {}, push: vi.fn(), replace: vi.fn(), asPath: '/leaderboards', pathname: '/leaderboards' };
vi.mock('next/router', () => ({ useRouter: () => routerState }));
vi.mock('next-seo', () => ({ NextSeo: () => null }));

const globalData = {
  totalUsers: 10,
  createdAt: 1_700_000_000_000,
  global: {
    public: { globalRanking: [{ mainChar: 'Top', rank: 1, globalRanking: 900 }] },
    anonymous: { globalRanking: [{ mainChar: 'Top', rank: 1, globalRanking: 900 }] }
  },
  general: {
    public: { globalRanking: [{ mainChar: 'Top', rank: 1, globalRanking: 900 }] },
    anonymous: { globalRanking: [{ mainChar: 'Top', rank: 1, globalRanking: 900 }] }
  }
};
const fetchLeaderboard = vi.fn(async () => globalData);
const fetchUserLeaderboards = vi.fn(async (tab, name) => ({ globalRanking: [{ mainChar: name, rank: name === 'Tester' ? 7 : 8, globalRanking: 300 }] }));
vi.mock('../../services/profiles', () => ({ fetchLeaderboard, fetchUserLeaderboards }));

const { AppContext } = await import('@components/common/context/AppProvider');
const Leaderboards = (await import('../../pages/leaderboards')).default;

const page = (state = {}) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <ThemeProvider theme={darkTheme}>
      <AppContext.Provider value={{ state }}>
        <Leaderboards/>
      </AppContext.Provider>
    </ThemeProvider>
  </QueryClientProvider>
);
const renderPage = (state = {}) => render(page(state));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  routerState.query = {};
});

describe('leaderboards ?player= deep link', () => {
  it('fills the search field and searches the player once on the global tab', async () => {
    routerState.query = { player: 'Tester' };
    const { container } = renderPage();
    await waitFor(() => expect(fetchUserLeaderboards).toHaveBeenCalledWith('global', 'Tester'));
    await waitFor(() => expect(container.textContent).toContain('Tester'));
    await act(() => new Promise((r) => setTimeout(r, 50)));
    expect(fetchUserLeaderboards).toHaveBeenCalledTimes(1);
    expect(container.querySelector('input[type="text"]').value).toBe('Tester');
  });

  it('searches the deep-linked player once more when the user switches to another tab', async () => {
    routerState.query = { player: 'Tester' };
    const { rerender } = renderPage();
    await waitFor(() => expect(fetchUserLeaderboards).toHaveBeenCalledWith('global', 'Tester'));
    routerState.query = { player: 'Tester', t: 'General' };
    rerender(page());
    await waitFor(() => expect(fetchUserLeaderboards).toHaveBeenCalledWith('general', 'Tester'));
    await act(() => new Promise((r) => setTimeout(r, 50)));
    expect(fetchUserLeaderboards).toHaveBeenCalledTimes(2);
  });

  it('does not search without the parameter', async () => {
    renderPage();
    await waitFor(() => expect(fetchLeaderboard).toHaveBeenCalled());
    expect(fetchUserLeaderboards).not.toHaveBeenCalled();
  });
  it('keeps both the logged-in user row and the deep-linked row when their fetches race', async () => {
    routerState.query = { player: 'Tester' };
    // The logged user resolves last, so a stale-snapshot write would drop the searched row.
    // A re-run of the logged-user effect re-fetches and would self-heal later, so the first write is the one that must be right.
    let loggedCalls = 0;
    fetchUserLeaderboards.mockImplementation(async (tab, name) => {
      if (name === 'Logged') await new Promise((r) => setTimeout(r, ++loggedCalls === 1 ? 60 : 2000));
      return { globalRanking: [{ mainChar: name, rank: name === 'Tester' ? 7 : 8, globalRanking: 300 }] };
    });
    const { container } = renderPage({ characters: [{ name: 'Logged' }] });
    await waitFor(() => {
      expect(container.textContent).toContain('Logged');
      expect(container.textContent).toContain('Tester');
    });
  });
});
