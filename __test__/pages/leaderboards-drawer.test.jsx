// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import darkTheme from '../../styles/theme/darkTheme';

Element.prototype.scrollIntoView = vi.fn();
const routerState = { isReady: true, query: {}, push: vi.fn(), replace: vi.fn(), back: vi.fn(), asPath: '/leaderboards', pathname: '/leaderboards' };
vi.mock('next/router', () => ({ useRouter: () => routerState }));
vi.mock('next-seo', () => ({ NextSeo: () => null }));

const defaultTab = async () => ({ totalUsers: 10, createdAt: 1, skills: { public: { mining: [] }, anonymous: { mining: [] } } });
const defaultMeta = async () => ({ createdAt: 1, totalPlayers: 10, categories: [{ category: 'skills', metrics: [{ key: 'mining', label: 'Mining', section: 'Skills', notation: 'default' }] }] });
const fetchTab = vi.fn(defaultTab);
const fetchMeta = vi.fn(defaultMeta);
const fetchPlayer = vi.fn(async () => null);
const fetchBoard = vi.fn(async () => ({ metric: 'mining', createdAt: 1, top: [], around: [] }));
const searchNames = vi.fn(async () => []);
vi.mock('../../services/leaderboards', () => ({ fetchMeta, fetchPlayer, fetchBoard, fetchTab, searchNames }));

const { AppContext } = await import('@components/common/context/AppProvider');
const Leaderboards = (await import('../../pages/leaderboards')).default;

const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const renderPage = (state = {}) => {
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
  routerState.replace.mockReset();
  routerState.back.mockReset();
  fetchTab.mockImplementation(defaultTab);
  fetchMeta.mockImplementation(defaultMeta);
  client.clear();
  localStorage.clear();
});

describe('leaderboards board drawer', () => {
  it('keeps the board it was showing while it closes', async () => {
    routerState.query = { t: 'skills', m: 'mining' };
    const { rerender } = renderPage();
    expect(await screen.findByRole('dialog', { name: 'Mining' })).toBeTruthy();

    routerState.query = { t: 'skills' };
    rerender();
    expect(screen.getByRole('heading', { level: 2, name: 'Mining', hidden: true })).toBeTruthy();
    expect(screen.queryByText('Global ranking')).toBeNull();
  });

  it('steps back over the entry an in-page open pushed', async () => {
    routerState.push.mockImplementation(({ query }) => { routerState.query = query; });
    routerState.query = { t: 'skills' };
    const { rerender } = renderPage();
    fireEvent.click(await screen.findByRole('link', { name: /Top 100/ }));
    expect(routerState.push).toHaveBeenCalledWith({ pathname: '/leaderboards', query: { t: 'skills', m: 'mining' } }, undefined, { shallow: true });
    rerender();
    fireEvent.click(await screen.findByRole('button', { name: 'Close' }));
    expect(routerState.back).toHaveBeenCalledTimes(1);
    expect(routerState.replace).not.toHaveBeenCalled();
  });

  it('replaces the URL when the board was opened from the URL', async () => {
    routerState.query = { t: 'skills', m: 'mining' };
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Close' }));
    expect(routerState.replace).toHaveBeenCalledWith({ pathname: '/leaderboards', query: { t: 'skills' } }, undefined, { shallow: true });
    expect(routerState.back).not.toHaveBeenCalled();
  });

  it('replaces when the URL moved on after the in-page open', async () => {
    routerState.push.mockImplementation(({ query }) => { routerState.query = query; });
    routerState.query = { t: 'skills' };
    const { rerender } = renderPage();
    fireEvent.click(await screen.findByRole('link', { name: /Top 100/ }));
    rerender();
    routerState.query = { t: 'skills', m: 'mining', player: 'Tester' };
    rerender();
    fireEvent.click(await screen.findByRole('button', { name: 'Close' }));
    expect(routerState.back).not.toHaveBeenCalled();
    expect(routerState.replace).toHaveBeenCalled();
  });

  it('opens nothing for a key that is not a board, even an inherited one', async () => {
    routerState.query = { t: 'skills', m: 'constructor' };
    renderPage();
    await waitFor(() => expect(fetchMeta).toHaveBeenCalled());
    expect(await screen.findByRole('link', { name: /Top 100/ })).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(fetchBoard).not.toHaveBeenCalled();
  });

  it('opens nothing for an unknown key once meta has loaded', async () => {
    routerState.query = { t: 'skills', m: 'nope' };
    renderPage();
    expect(await screen.findByRole('link', { name: /Top 100/ })).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(fetchBoard).not.toHaveBeenCalled();
  });

  it('still opens a board from a card when meta is down', async () => {
    fetchMeta.mockRejectedValueOnce(new Error('meta down'));
    routerState.push.mockImplementation(({ query }) => { routerState.query = query; });
    routerState.query = { t: 'skills' };
    const { rerender } = renderPage();
    fireEvent.click(await screen.findByRole('link', { name: /Top 100/ }));
    rerender();
    expect(await screen.findByRole('dialog', { name: 'Mining' })).toBeTruthy();
    await waitFor(() => expect(fetchBoard).toHaveBeenCalledWith('mining', expect.any(Object)));
  });

  it('does not carry a collapsed section over to another tab', async () => {
    const sectioned = { createdAt: 1, totalPlayers: 10, categories: ['skills', 'tasks'].map((category) => ({
      category, metrics: [
        { key: `${category}A`, label: `${category} A`, section: 'First', notation: 'default' },
        { key: `${category}B`, label: `${category} B`, section: 'Second', notation: 'default' }
      ]
    })) };
    fetchMeta.mockResolvedValue(sectioned);
    fetchTab.mockImplementation(async (tab) => {
      const lists = { [`${tab}A`]: [], [`${tab}B`]: [] };
      return { totalUsers: 10, createdAt: 1, [tab]: { public: lists, anonymous: lists } };
    });
    // Tasks is fetched first so that coming back to it is instant: a spinner in between would
    // unmount the tab and hide a leak.
    routerState.query = { t: 'tasks' };
    const { rerender } = renderPage();
    await screen.findByRole('button', { name: 'Collapse First' });
    routerState.query = { t: 'skills' };
    rerender();
    await waitFor(() => expect(fetchTab).toHaveBeenCalledWith('skills'));
    fireEvent.click(await screen.findByRole('button', { name: 'Collapse First' }));
    expect(screen.getByRole('button', { name: 'Expand First' }).getAttribute('aria-expanded')).toBe('false');

    routerState.query = { t: 'tasks' };
    rerender();
    expect(await screen.findByRole('button', { name: 'Collapse First' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Expand First' })).toBeNull();
  });

  it('keeps the podium query apart from the global board drawer', async () => {
    renderPage();
    await waitFor(() => expect(client.getQueryCache().find({ queryKey: ['lb-podium', false] })).toBeTruthy());
    expect(client.getQueryCache().find({ queryKey: ['lb-board', 'globalRanking', 'top10', false] })).toBeUndefined();
  });
});
