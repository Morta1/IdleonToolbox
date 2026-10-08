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

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('BoardDrawer', () => {
  it('shows Around you first when the player is below rank 15', async () => {
    fetchBoard.mockResolvedValue({ metric: 'mining', createdAt: 1, top, around: aroundAt(91) });
    renderDrawer();
    expect(await screen.findByText('Around you')).toBeTruthy();
    expect(screen.getByText('Top 100')).toBeTruthy();
    expect(fetchBoard).toHaveBeenCalledWith('mining', { around: 'me', publicOnly: false });
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
});
