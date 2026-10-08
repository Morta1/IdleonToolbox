// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import darkTheme from '../../styles/theme/darkTheme';

Element.prototype.scrollIntoView = vi.fn();
const routerState = { isReady: true, query: {}, push: vi.fn(), replace: vi.fn(), asPath: '/leaderboards', pathname: '/leaderboards' };
vi.mock('next/router', () => ({ useRouter: () => routerState }));
vi.mock('next-seo', () => ({ NextSeo: () => null }));

const playerData = (name) => ({
  createdAt: 1, ranks: { mining: { r: 3, v: 240, p: 0.2, t: 1, nr: 2, nv: 250 } },
  player: { mainChar: name, rank: 7, compositeScore: 300, totalUsers: 10, bestMetrics: [] }
});
const fetchTab = vi.fn(async () => ({ totalUsers: 10, createdAt: 1, skills: { public: { mining: [] }, anonymous: { mining: [] } } }));
const fetchMeta = vi.fn(async () => ({ createdAt: 1, totalPlayers: 10, categories: [{ category: 'skills', metrics: [{ key: 'mining', label: 'Mining', section: 'Skills', notation: 'default' }] }] }));
const fetchPlayer = vi.fn(async (name) => (name === 'Ghost' ? null : playerData(name)));
const fetchBoard = vi.fn(async () => ({ metric: 'globalRanking', createdAt: 1, top: [], around: [] }));
const searchNames = vi.fn(async () => []);
vi.mock('../../services/leaderboards', () => ({ fetchMeta, fetchPlayer, fetchBoard, fetchTab, searchNames }));

const { AppContext } = await import('@components/common/context/AppProvider');
const Leaderboards = (await import('../../pages/leaderboards')).default;

const renderPage = (state = {}) => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <ThemeProvider theme={darkTheme}>
      <AppContext.Provider value={{ state }}>
        <Leaderboards/>
      </AppContext.Provider>
    </ThemeProvider>
  </QueryClientProvider>
);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  routerState.query = {};
});

describe('leaderboards ?player= deep link', () => {
  it('loads the player once and shows them as the searched player', async () => {
    routerState.query = { player: 'Tester' };
    renderPage();
    expect(await screen.findByText('Searched player')).toBeTruthy();
    expect(screen.getByText('Tester')).toBeTruthy();
    expect(fetchPlayer).toHaveBeenCalledTimes(1);
    expect(fetchPlayer).toHaveBeenCalledWith('Tester');
  });

  it('drops an unknown player from the URL with a toast', async () => {
    routerState.query = { player: 'Ghost', t: 'Skills' };
    renderPage();
    expect(await screen.findByText(/No player named Ghost/)).toBeTruthy();
    expect(routerState.replace).toHaveBeenCalledWith({ pathname: '/leaderboards', query: { t: 'Skills' } }, undefined, { shallow: true });
  });

  it('loads the logged-in player when there is no parameter', async () => {
    renderPage({ uid: 'u1', characters: [{ name: 'Logged' }] });
    await waitFor(() => expect(fetchPlayer).toHaveBeenCalledWith('Logged'));
    expect(await screen.findByText('You')).toBeTruthy();
  });

  it('fetches no player for an anonymous visitor', async () => {
    renderPage();
    expect(await screen.findByText('See where you stand')).toBeTruthy();
    expect(fetchPlayer).not.toHaveBeenCalled();
  });

  it('reads ?t= case-insensitively and fetches that tab', async () => {
    routerState.query = { t: 'skills' };
    renderPage();
    await waitFor(() => expect(fetchTab).toHaveBeenCalledWith('skills'));
    expect(await screen.findByText('Mining')).toBeTruthy();
  });

  it('treats ?t=global as the Overview', async () => {
    routerState.query = { t: 'global' };
    renderPage();
    await waitFor(() => expect(fetchBoard).toHaveBeenCalled());
    expect(fetchTab).not.toHaveBeenCalled();
  });
});
