// @vitest-environment jsdom
import '../../../polyfills';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import darkTheme from '../../../styles/theme/darkTheme';

const fetchBoard = vi.fn(async () => ({ metric: 'globalRanking', createdAt: 1, around: [],
  top: Array.from({ length: 10 }, (_, i) => ({ mainChar: `G${i + 1}`, value: 20000 - i, rank: i + 1, globalRank: i + 1 })) }));
vi.mock('../../../services/leaderboards', () => ({ fetchBoard }));
const Overview = (await import('@components/leaderboards/Overview')).default;
const { buildMetaIndex } = await import('@components/leaderboards/format');

const index = buildMetaIndex({ categories: [{ category: 'skills', metrics: [
  { key: 'mining', label: 'Mining', section: 'Skills', notation: 'default' },
  { key: 'farming', label: 'Farming', section: 'Skills', notation: 'default' }
] }] });
const data = {
  createdAt: 1,
  player: { mainChar: 'Baker333', rank: 75, compositeScore: 14901.02, totalUsers: 2608, bestMetrics: [{ metric: 'mining', value: 240, rank: 3, topPercent: 0.2 }] },
  ranks: { mining: { r: 3, v: 240, p: 0.2, t: 1, nr: 2, nv: 250 }, farming: { r: 1, v: 9, p: 0.1, t: 1 } }
};
const self = { name: null, signedIn: false, participation: null, lastUpload: null };
const renderOverview = (props) => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <ThemeProvider theme={darkTheme}>
      <Overview index={index} showAnonymous highlight={{}} self={self} onOpen={() => {}} {...props}/>
    </ThemeProvider>
  </QueryClientProvider>
);

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('Overview', () => {
  it('shows the podium and opens the global top 100', async () => {
    const onOpen = vi.fn();
    renderOverview({ player: { context: null }, onOpen });
    expect(await screen.findByText('G1')).toBeTruthy();
    expect(screen.getByText('G10')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Full top 100/ }));
    expect(onOpen).toHaveBeenCalledWith('globalRanking', 'overview');
  });

  it('gives trophies by rank, not position, when public ranks have gaps', async () => {
    fetchBoard.mockResolvedValueOnce({ metric: 'globalRanking', createdAt: 1, around: [],
      top: [2, 3, 5, 6, 7, 8, 9, 10, 11, 12].map((rank) => ({ mainChar: `P${rank}`, value: 1000 - rank, rank, globalRank: rank })) });
    renderOverview({ player: { context: null } });
    expect(await screen.findByText('P2')).toBeTruthy();
    expect(screen.getByAltText('Rank 2')).toBeTruthy();
    expect(screen.getByAltText('Rank 3')).toBeTruthy();
    expect(screen.queryByAltText('Rank 1')).toBeNull();
    expect(screen.queryByAltText('Rank 5')).toBeNull();
    expect(screen.getByText('#5')).toBeTruthy();
  });

  it('shows a trophy for each tied first place', async () => {
    fetchBoard.mockResolvedValueOnce({ metric: 'globalRanking', createdAt: 1, around: [],
      top: [1, 1, 3, 4, 5, 6, 7, 8, 9, 10].map((rank, i) => ({ mainChar: `T${i}`, value: 1000 - i, rank, globalRank: rank })) });
    renderOverview({ player: { context: null } });
    expect(await screen.findByText('T0')).toBeTruthy();
    expect(screen.getAllByAltText('Rank 1')).toHaveLength(2);
    expect(screen.getAllByAltText('Rank 3')).toHaveLength(1);
  });

  it('asks a visitor with no player to log in or search', async () => {
    renderOverview({ player: { context: null } });
    expect(await screen.findByText('See where you stand')).toBeTruthy();
  });

  it('shows the player card, highlights and within reach', async () => {
    const onOpen = vi.fn();
    renderOverview({ player: { context: { name: 'Baker333', kind: 'searched' }, data }, onOpen });
    expect(await screen.findByText('Searched player')).toBeTruthy();
    expect(screen.getByText('#75')).toBeTruthy();
    expect(screen.getByText('Highlights')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Mining · #3/ }));
    expect(onOpen).toHaveBeenCalledWith('mining', 'within_reach');
  });

  it('tells a signed-in player who turned leaderboards off', async () => {
    renderOverview({ player: { context: { name: 'Me', kind: 'logged' }, data: null }, self: { ...self, name: 'Me', signedIn: true, participation: 'off' } });
    expect(await screen.findByText('You are not on the leaderboards')).toBeTruthy();
  });

  it('offers a retry when the player fetch fails', async () => {
    const refetch = vi.fn();
    renderOverview({ player: { context: { name: 'Me', kind: 'logged' }, isError: true, refetch } });
    expect(await screen.findByText('Could not load your standing')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalled();
  });
});
