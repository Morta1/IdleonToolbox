// @vitest-environment jsdom
import '../../../polyfills';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import darkTheme from '../../../styles/theme/darkTheme';

const searchNames = vi.fn(async () => [{ mainChar: 'Baker333', rank: 75 }]);
vi.mock('../../../services/leaderboards', () => ({ searchNames }));
const ControlBar = (await import('@components/leaderboards/ControlBar')).default;
const { buildMetaIndex } = await import('@components/leaderboards/format');

const index = buildMetaIndex({ categories: [{ category: 'skills', metrics: [{ key: 'mining', label: 'Mining', section: 'Skills', notation: 'default' }] }] });
const renderBar = (props = {}) => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <ThemeProvider theme={darkTheme}>
      <ControlBar index={index} totalPlayers={2608} createdAt={null} showAnonymous onToggleAnonymous={() => {}} onPlayer={() => {}} onMetric={() => {}} {...props}/>
    </ThemeProvider>
  </QueryClientProvider>
);

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('ControlBar', () => {
  it('suggests names after two characters and reports a typeahead pick', async () => {
    const onPlayer = vi.fn();
    renderBar({ onPlayer });
    const input = screen.getByLabelText('Find a player');
    fireEvent.change(input, { target: { value: 'ba' } });
    await waitFor(() => expect(searchNames).toHaveBeenCalledWith('ba'));
    fireEvent.click(await screen.findByText('Baker333'));
    expect(onPlayer).toHaveBeenCalledWith('Baker333', 'typeahead');
  });

  it('searches free text on Enter, for Anon# ids', () => {
    const onPlayer = vi.fn();
    renderBar({ onPlayer });
    const input = screen.getByLabelText('Find a player');
    fireEvent.change(input, { target: { value: 'Anon#ab12cd' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onPlayer).toHaveBeenCalledWith('Anon#ab12cd', 'enter');
  });

  it('jumps to a board', async () => {
    const onMetric = vi.fn();
    renderBar({ onMetric });
    const jump = screen.getByLabelText('Jump to board');
    fireEvent.change(jump, { target: { value: 'Min' } });
    fireEvent.click(await screen.findByText('Mining'));
    expect(onMetric).toHaveBeenCalledWith('mining');
  });

  it('focuses the board jump on "/" unless typing', () => {
    renderBar();
    fireEvent.keyDown(document.body, { key: '/' });
    expect(document.activeElement).toBe(screen.getByLabelText('Jump to board'));
    const search = screen.getByLabelText('Find a player');
    search.focus();
    fireEvent.keyDown(search, { key: '/' });
    expect(document.activeElement).toBe(search);
  });
});
