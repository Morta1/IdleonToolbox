// @vitest-environment jsdom
import '../../../polyfills';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import darkTheme from '../../../styles/theme/darkTheme';

const fetchBoard = vi.fn();
vi.mock('../../../services/leaderboards', () => ({ fetchBoard }));
const BoardDrawer = (await import('@components/leaderboards/BoardDrawer')).default;
const { buildMetaIndex } = await import('@components/leaderboards/format');

const index = buildMetaIndex({ categories: [{ category: 'skills', metrics: [{ key: 'mining', label: 'Mining', section: 'Skills', notation: 'default', top: 304, players: 2100, maxed: false }] }] });
const top = Array.from({ length: 20 }, (_, i) => ({ mainChar: `T${i}`, value: 304 - i, rank: i + 1, globalRank: i + 1 }));
const aroundAt = (rank) => Array.from({ length: 11 }, (_, i) => ({ mainChar: i === 5 ? 'Me' : `N${i}`, value: 100 - i, rank: rank - 5 + i }));

const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const renderDrawer = (props = {}) => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <ThemeProvider theme={darkTheme}>
      <BoardDrawer open metricKey="mining" index={index} player="me" kind="logged" showAnonymous onClose={() => {}} {...props}/>
    </ThemeProvider>
  </QueryClientProvider>
);

afterEach(() => { cleanup(); client.clear(); vi.clearAllMocks(); });

describe('BoardDrawer', () => {
  it('shows Around you first when the player is below rank 15', async () => {
    fetchBoard.mockResolvedValue({ metric: 'mining', createdAt: 1, top, around: aroundAt(91) });
    renderDrawer();
    expect(await screen.findByText('Around you')).toBeTruthy();
    expect(screen.getByText('Top 100')).toBeTruthy();
    expect(fetchBoard).toHaveBeenCalledWith('mining', { around: 'me', publicOnly: false });
  });

  it('names a searched player instead of saying you', async () => {
    fetchBoard.mockResolvedValue({ metric: 'mining', createdAt: 1, top, around: aroundAt(91) });
    renderDrawer({ kind: 'searched' });
    const heading = await screen.findByText(/^Around/);
    // The row's own spelling, not the searched text.
    expect(heading.textContent).toBe('Around Me');
    expect(screen.queryByText('Around you')).toBeNull();
  });

  it('skips Around you at rank 15 or better', async () => {
    fetchBoard.mockResolvedValue({ metric: 'mining', createdAt: 1, top, around: aroundAt(12) });
    renderDrawer();
    await screen.findByText('Top 100');
    expect(screen.queryByText('Around you')).toBeNull();
  });

  it('hides anonymous neighbours when Show anonymous is off, but never the player', async () => {
    fetchBoard.mockResolvedValue({ metric: 'mining', createdAt: 1, top, around: [
      { mainChar: 'Anon#aaaaaa', value: 120, rank: 90 }, { mainChar: 'Me', value: 110, rank: 91 }, { mainChar: 'Z', value: 100, rank: 92 }
    ] });
    renderDrawer({ showAnonymous: false });
    await screen.findByText('Around you');
    expect(screen.queryByText('Anon#aaaaaa')).toBeNull();
    expect(screen.getByText('Me')).toBeTruthy();
    expect(fetchBoard).toHaveBeenCalledWith('mining', { around: 'me', publicOnly: true });
  });

  it('shows an error with a retry', async () => {
    fetchBoard.mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce({ metric: 'mining', createdAt: 1, top, around: [] });
    renderDrawer();
    fireEvent.click(await screen.findByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(fetchBoard).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('Top 100')).toBeTruthy();
  });

  it('does not fetch while closed', () => {
    renderDrawer({ open: false });
    expect(fetchBoard).not.toHaveBeenCalled();
  });

  it('keeps the last board title while it closes', async () => {
    fetchBoard.mockResolvedValue({ metric: 'mining', createdAt: 1, top, around: [] });
    const tree = (open) => (
      <QueryClientProvider client={client}>
        <ThemeProvider theme={darkTheme}>
          <BoardDrawer open={open} metricKey="mining" index={index} player="me" kind="logged" showAnonymous onClose={() => {}}/>
        </ThemeProvider>
      </QueryClientProvider>
    );
    const { rerender } = render(tree(true));
    expect(await screen.findByRole('heading', { name: 'Mining' })).toBeTruthy();
    rerender(tree(false));
    expect(screen.getByRole('heading', { name: 'Mining', hidden: true })).toBeTruthy();
    expect(screen.queryByText('Global ranking')).toBeNull();
  });

  it('is a dialog labelled by the board title', async () => {
    fetchBoard.mockResolvedValue({ metric: 'mining', createdAt: 1, top, around: [] });
    renderDrawer();
    const dialog = await screen.findByRole('dialog', { name: 'Mining' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
  });

  it('keeps the rows on screen while a deep link asks again with the player', async () => {
    fetchBoard.mockResolvedValueOnce({ metric: 'mining', createdAt: 1, top, around: [] });
    fetchBoard.mockReturnValueOnce(new Promise(() => {}));
    const tree = (player) => (
      <QueryClientProvider client={client}>
        <ThemeProvider theme={darkTheme}>
          <BoardDrawer open metricKey="mining" index={index} player={player} kind="logged" showAnonymous onClose={() => {}}/>
        </ThemeProvider>
      </QueryClientProvider>
    );
    const { rerender } = render(tree(null));
    expect(await screen.findByText('Top 100')).toBeTruthy();
    rerender(tree('me'));
    await waitFor(() => expect(fetchBoard).toHaveBeenCalledTimes(2));
    expect(screen.getByText('Top 100')).toBeTruthy();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('shows a spinner, not the old board, when another board opens', async () => {
    fetchBoard.mockResolvedValueOnce({ metric: 'mining', createdAt: 1, top, around: [] });
    fetchBoard.mockReturnValueOnce(new Promise(() => {}));
    const tree = (metricKey) => (
      <QueryClientProvider client={client}>
        <ThemeProvider theme={darkTheme}>
          <BoardDrawer open metricKey={metricKey} index={index} player="me" kind="logged" showAnonymous onClose={() => {}}/>
        </ThemeProvider>
      </QueryClientProvider>
    );
    const { rerender } = render(tree('mining'));
    expect(await screen.findByText('Top 100')).toBeTruthy();
    rerender(tree('farming'));
    await waitFor(() => expect(fetchBoard).toHaveBeenCalledTimes(2));
    expect(screen.queryByText('Top 100')).toBeNull();
    expect(screen.getByRole('progressbar')).toBeTruthy();
  });
});

describe('BoardDrawer header and steps', () => {
  it('puts the leader and the player count in the meta line', async () => {
    fetchBoard.mockResolvedValue({ metric: 'mining', createdAt: 1, top, around: [] });
    renderDrawer();
    expect(await screen.findByText('#1 T0 · 304')).toBeTruthy();
    expect(screen.getByText('2,100 players')).toBeTruthy();
  });

  it('gives the Global ranking drawer a meta line from the account total', async () => {
    const globalIndex = buildMetaIndex({ totalPlayers: 2616, categories: [] });
    const points = [{ mainChar: 'Yosh6400', value: 16683.4, rank: 1 }, { mainChar: 'Dragami', value: 16559, rank: 2 }];
    fetchBoard.mockResolvedValue({ metric: 'globalRanking', createdAt: 1, top: points, around: [] });
    renderDrawer({ metricKey: 'globalRanking', index: globalIndex });
    expect(await screen.findByText('#1 Yosh6400 · 16,683.4 pts')).toBeTruthy();
    expect(screen.getByText('2,616 players')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Global ranking' })).toBeTruthy();
  });

  it('shows only the player count while the leader is unknown', () => {
    fetchBoard.mockReturnValue(new Promise(() => {}));
    renderDrawer();
    expect(screen.getByText('2,100 players')).toBeTruthy();
    expect(screen.queryByText(/#1 /)).toBeNull();
  });

  it('names the nearest rank above you and the step to reach it', async () => {
    fetchBoard.mockResolvedValue({ metric: 'mining', createdAt: 1, top, around: aroundAt(91) });
    renderDrawer();
    expect(await screen.findByText('+1 to reach N4 (#90)')).toBeTruthy();
  });

  it('keeps a fractional points step above zero and skips tied neighbours', async () => {
    const globalIndex = buildMetaIndex({ totalPlayers: 2616, categories: [] });
    fetchBoard.mockResolvedValue({ metric: 'globalRanking', createdAt: 1, top, around: [
      { mainChar: 'Far', value: 15400, rank: 88 }, { mainChar: 'Crezar', value: 15315.8, rank: 90 },
      { mainChar: 'Tied', value: 15314, rank: 91 }, { mainChar: 'Me', value: 15314, rank: 91 }
    ] });
    renderDrawer({ metricKey: 'globalRanking', index: globalIndex });
    expect(await screen.findByText('+1.8 pts to reach Crezar (#90)')).toBeTruthy();
  });

  it('shows no step without a row above you', async () => {
    fetchBoard.mockResolvedValue({ metric: 'mining', createdAt: 1, top, around: [{ mainChar: 'Me', value: 100, rank: 91 }, { mainChar: 'Z', value: 90, rank: 92 }] });
    renderDrawer();
    await screen.findByText('Around you');
    expect(screen.queryByText(/to reach/)).toBeNull();
  });

  it('outlines your row in the Around you list and no other', async () => {
    fetchBoard.mockResolvedValue({ metric: 'mining', createdAt: 1, top, around: aroundAt(91) });
    renderDrawer();
    const rowOf = (name) => screen.getByText(name).closest('[data-testid="rank-row"]');
    await screen.findByText('Me');
    expect(getComputedStyle(rowOf('Me')).borderTopColor).toBe('rgb(0, 126, 133)');
    expect(getComputedStyle(rowOf('N0')).borderTopColor).not.toBe('rgb(0, 126, 133)');
  });
});
