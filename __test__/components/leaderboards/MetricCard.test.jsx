// @vitest-environment jsdom
import '../../../polyfills';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../../styles/theme/darkTheme';
import MetricCard from '@components/leaderboards/MetricCard';

const renderCard = (props) => render(<ThemeProvider theme={darkTheme}><MetricCard highlight={{}} pinned={null} onOpen={() => {}} {...props}/></ThemeProvider>);
const mining = { key: 'mining', label: 'Mining', notation: 'default', maxed: false };
const row = (mainChar, mining, rank, globalRank = null) => ({ mainChar, mining, rank, globalRank });

afterEach(cleanup);

describe('MetricCard', () => {
  it('repeats the rank for a tie and gives trophies by rank', () => {
    renderCard({ meta: mining, entries: [row('A', 300, 1), row('B', 250, 2), row('C', 250, 2), row('D', 200, 4)] });
    expect(screen.getAllByAltText('Rank 2')).toHaveLength(2);
    expect(screen.queryByAltText('Rank 3')).toBeNull();
    expect(screen.getByText('4')).toBeTruthy();
  });

  it('shows real ranks with gaps when anonymous players are hidden', () => {
    renderCard({ meta: mining, entries: [row('A', 300, 1), row('B', 250, 2), row('D', 200, 4), row('E', 190, 5)] });
    expect(screen.getByText('4')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
    expect(screen.queryByText('3')).toBeNull();
  });

  it('renders a maxed board with the max line, plain #1s and global ranks', () => {
    const breed = { key: 'totalBreedabilityLevels', label: 'Total Breedability Levels', notation: 'default', maxed: true, top: 612, topTies: 146 };
    renderCard({ meta: breed, entries: [{ mainChar: 'Yosh', totalBreedabilityLevels: 612, rank: 1, globalRank: 1 }, { mainChar: 'Dragami', totalBreedabilityLevels: 612, rank: 1, globalRank: 2 }] });
    expect(screen.getByText('Maxed')).toBeTruthy();
    expect(screen.getByText(/is the max · 146 players have it, all tied at #1 · listed by global rank/)).toBeTruthy();
    expect(screen.queryByAltText('Rank 1')).toBeNull();
    expect(screen.getAllByText('1')).toHaveLength(2);
    expect(screen.getByText('global #2')).toBeTruthy();
  });

  it('pins the player under a maxed board with the max check, and without it below the max', () => {
    const breed = { key: 'totalBreedabilityLevels', label: 'Total Breedability Levels', notation: 'default', maxed: true, top: 612, topTies: 146 };
    const entries = [{ mainChar: 'Yosh', totalBreedabilityLevels: 612, rank: 1, globalRank: 1 }];
    renderCard({ meta: breed, entries, pinned: { mainChar: 'Baker333', kind: 'logged', globalRank: 91, entry: { r: 1, v: 612, p: 5.6, t: 146 } } });
    expect(screen.getByText('Baker333')).toBeTruthy();
    expect(screen.getByText('global #91')).toBeTruthy();
    expect(screen.getByLabelText('Has the max')).toBeTruthy();
    cleanup();
    renderCard({ meta: breed, entries, pinned: { mainChar: 'Baker333', kind: 'logged', globalRank: 91, entry: { r: 150, v: 600, p: 9, t: 2, nr: 1, nv: 612 } } });
    expect(screen.queryByLabelText('Has the max')).toBeNull();
    expect(screen.getByText('150')).toBeTruthy();
  });

  it('does not pin a player already in the list, and skips a player with no entry', () => {
    renderCard({ meta: mining, entries: [row('A', 300, 1), row('B', 250, 2)], highlight: { B: 'searched' }, pinned: { mainChar: 'B', kind: 'searched', globalRank: 5, entry: { r: 2, v: 250, p: 1, t: 1 } } });
    expect(screen.getAllByText('B')).toHaveLength(1);
    cleanup();
    renderCard({ meta: mining, entries: [row('A', 300, 1)], pinned: { mainChar: 'New', kind: 'logged', globalRank: 2000, entry: undefined } });
    expect(screen.queryByText('New')).toBeNull();
  });

  it('opens the board from Top 100', () => {
    const onOpen = vi.fn();
    renderCard({ meta: mining, entries: [row('A', 300, 1)], onOpen });
    fireEvent.click(screen.getByRole('button', { name: /Top 100/ }));
    expect(onOpen).toHaveBeenCalledWith('mining');
  });

  it('says so when a board is empty', () => {
    renderCard({ meta: mining, entries: [] });
    expect(screen.getByText('Nothing here yet')).toBeTruthy();
  });
});
