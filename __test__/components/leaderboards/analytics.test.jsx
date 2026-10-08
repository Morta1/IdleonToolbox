// @vitest-environment jsdom
import '../../../polyfills';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import darkTheme from '../../../styles/theme/darkTheme';

const routerState = { isReady: true, query: {}, push: vi.fn(), replace: vi.fn(), asPath: '/leaderboards', pathname: '/leaderboards' };
vi.mock('next/router', () => ({ useRouter: () => routerState }));
vi.mock('next-seo', () => ({ NextSeo: () => null }));
const meta = { createdAt: 1, totalPlayers: 10, categories: [{ category: 'skills', metrics: [{ key: 'mining', label: 'Mining', section: 'Skills', notation: 'default' }] }] };
// jsdom runs on localhost, where the real guard sends nothing: pass straight through instead.
vi.mock('@components/leaderboards/analytics', async () => {
  const { trackEvent } = await import('@utility/analytics');
  return { trackLeaderboardEvent: trackEvent };
});
vi.mock('../../../services/leaderboards', () => ({
  fetchTab: vi.fn(async () => ({ totalUsers: 10, createdAt: 1, skills: { public: { mining: [{ mainChar: 'A', mining: 5, rank: 1 }] }, anonymous: { mining: [{ mainChar: 'A', mining: 5, rank: 1 }] } } })),
  fetchMeta: vi.fn(async () => meta),
  fetchPlayer: vi.fn(async (name) => (name === 'Ghost' ? null : { createdAt: 1, ranks: {}, player: { mainChar: 'Tester', rank: 7, compositeScore: 300, totalUsers: 10, bestMetrics: [] } })),
  fetchBoard: vi.fn(async () => ({ metric: 'mining', createdAt: 1, top: [], around: [] })),
  searchNames: vi.fn(async () => [])
}));

const { AppContext } = await import('@components/common/context/AppProvider');
const Leaderboards = (await import('../../../pages/leaderboards')).default;

const renderPage = () => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <ThemeProvider theme={darkTheme}><AppContext.Provider value={{ state: {} }}><Leaderboards/></AppContext.Provider></ThemeProvider>
  </QueryClientProvider>
);
const events = (name) => (window.dataLayer ?? []).map((args) => Array.from(args)).filter(([kind, event]) => kind === 'event' && event === name).map(([, , params]) => params);

beforeEach(() => { delete window.dataLayer; });
afterEach(() => { cleanup(); vi.clearAllMocks(); routerState.query = {}; });

describe('leaderboards analytics', () => {
  it('fires lb_board_open once for a board link', async () => {
    routerState.query = { t: 'Skills', m: 'mining' };
    renderPage();
    await waitFor(() => expect(events('lb_board_open')).toEqual([{ metric: 'mining', source: 'url' }]));
  });

  it('fires lb_board_open with source card from a card', async () => {
    routerState.query = { t: 'Skills' };
    renderPage();
    fireEvent.click(await screen.findByRole('link', { name: /Top 100/ }));
    expect(events('lb_board_open')).toEqual([{ metric: 'mining', source: 'card' }]);
  });

  it('fires lb_player_search for a deep-linked player without the name', async () => {
    routerState.query = { player: 'Tester' };
    renderPage();
    await waitFor(() => expect(events('lb_player_search')).toEqual([{ result: 'found', via: 'url' }]));
    expect(JSON.stringify(window.dataLayer)).not.toContain('Tester');
  });

  it('reports not_found for an unknown deep-linked player', async () => {
    routerState.query = { player: 'Ghost' };
    renderPage();
    await waitFor(() => expect(events('lb_player_search')).toEqual([{ result: 'not_found', via: 'url' }]));
    expect(JSON.stringify(window.dataLayer)).not.toContain('Ghost');
  });

  it('fires lb_player_search with via enter from the search box', async () => {
    renderPage();
    const input = screen.getByLabelText('Find a player');
    fireEvent.change(input, { target: { value: 'Tester' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(events('lb_player_search')).toEqual([{ result: 'found', via: 'enter' }]));
    expect(routerState.push).toHaveBeenCalledWith({ pathname: '/leaderboards', query: { player: 'Tester' } }, undefined, { shallow: true });
  });
});
