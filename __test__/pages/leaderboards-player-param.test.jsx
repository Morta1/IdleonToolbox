// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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

const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const renderPage = (state = {}) => {
  // A fresh element each call, or React bails out of the rerender: the router mock is a plain object.
  const page = () => (
    <QueryClientProvider client={client}>
      <ThemeProvider theme={darkTheme}>
        <AppContext.Provider value={{ state }}>
          <Leaderboards/>
        </AppContext.Provider>
      </ThemeProvider>
    </QueryClientProvider>
  );
  const utils = render(page());
  return { ...utils, rerender: () => utils.rerender(page()) };
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  routerState.query = {};
  routerState.push.mockReset();
  client.clear();
  localStorage.clear();
});

describe('leaderboards ?player= deep link', () => {
  it('loads the player once and shows them as the searched player', async () => {
    routerState.query = { player: 'Tester' };
    renderPage();
    const label = await screen.findByText('Searched player');
    expect(label.parentElement.textContent).toBe('Searched player · Tester');
    expect(fetchPlayer).toHaveBeenCalledTimes(1);
    expect(fetchPlayer).toHaveBeenCalledWith('Tester');
  });

  it('names the viewed player in the control bar, and clearing it drops ?player=', async () => {
    routerState.query = { player: 'Tester', t: 'Skills' };
    renderPage();
    const chips = await screen.findAllByRole('button', { name: 'Viewing Tester' });
    fireEvent.click(chips[0].querySelector('.MuiChip-deleteIcon'));
    expect(routerState.push).toHaveBeenLastCalledWith({ pathname: '/leaderboards', query: { t: 'Skills' } }, undefined, { shallow: true });
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

  it('decides the tab from the URL alone, so back to a URL without ?t= shows Overview', async () => {
    routerState.push.mockImplementation(({ query }) => { routerState.query = query; });
    const { rerender } = renderPage();
    expect(await screen.findByText('See where you stand')).toBeTruthy();
    fireEvent.click(await screen.findByRole('tab', { name: /Skills/ }));
    rerender();
    expect(await screen.findByText('Mining')).toBeTruthy();
    expect(fetchTab).toHaveBeenCalledTimes(1);

    routerState.query = {};
    rerender();
    expect(await screen.findByText('See where you stand')).toBeTruthy();
    expect(screen.queryByText('Mining')).toBeNull();
    expect(fetchTab).toHaveBeenCalledTimes(1);
  });

  it('puts the board count in its own span on the tab and the status line in the tab strip', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('tab', { name: /Skills/ }).querySelector('span')?.textContent).toBe('1'));
    expect(screen.getByRole('tab', { name: /Skills/ }).textContent).toBe('Skills1');
    const statuses = await screen.findAllByText(/10 players · updated/);
    const inStrip = statuses.find((status) => status.parentElement.parentElement.parentElement.querySelector('[role="tablist"]'));
    expect(inStrip).toBeTruthy();
    expect(inStrip.closest('.MuiTabs-root')).toBeNull();
  });

  it('keeps the logged-in treatment when you search your own name', async () => {
    routerState.query = { player: 'logged' };
    renderPage({ uid: 'u1', characters: [{ name: 'Logged' }] });
    expect(await screen.findByText('You')).toBeTruthy();
    expect(screen.queryByText('Searched player')).toBeNull();
  });

  it('offers a retry when a tab fails to load', async () => {
    fetchTab.mockRejectedValueOnce(new Error('boom'));
    routerState.query = { t: 'skills' };
    renderPage();
    expect(await screen.findByText('Could not load these boards')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Mining')).toBeTruthy();
    expect(fetchTab).toHaveBeenCalledTimes(2);
  });

  it('stores the anonymous switch value it is given', async () => {
    renderPage();
    const toggle = await screen.findByLabelText('Show anonymous');
    fireEvent.click(toggle);
    await waitFor(() => expect(localStorage.getItem('leaderboard:showAnonymous')).toBe('false'));
  });

  it('opens a category tile through the tab handling, dropping the open board', async () => {
    routerState.query = { m: 'mining' };
    renderPage({ uid: 'u1', characters: [{ name: 'Logged' }] });
    const tile = await screen.findByRole('link', { name: /Skills/, hidden: true });
    expect(tile.getAttribute('href')).toBe('?t=Skills');
    fireEvent.click(tile);
    expect(routerState.push).toHaveBeenCalledWith({ pathname: '/leaderboards', query: { t: 'Skills' } }, undefined, { shallow: true });
  });
});
