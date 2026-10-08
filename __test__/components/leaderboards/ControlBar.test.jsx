// @vitest-environment jsdom
import '../../../polyfills';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import darkTheme from '../../../styles/theme/darkTheme';

const searchNames = vi.fn(async () => [{ mainChar: 'Baker333', rank: 75 }]);
vi.mock('../../../services/leaderboards', () => ({ searchNames }));
const bannerState = { isVisible: false };
vi.mock('@hooks/useProfileBannerState', () => ({ default: () => bannerState }));
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

afterEach(() => { bannerState.isVisible = false; cleanup(); vi.clearAllMocks(); });

describe('ControlBar', () => {
  it('suggests names after two characters and reports a typeahead pick', async () => {
    const onPlayer = vi.fn();
    renderBar({ onPlayer });
    const input = screen.getByLabelText('Find a player');
    fireEvent.change(input, { target: { value: 'ba' } });
    await waitFor(() => expect(searchNames).toHaveBeenCalledWith('ba'));
    fireEvent.click(await screen.findByRole('option', { name: /Baker333/ }));
    expect(onPlayer).toHaveBeenCalledWith('Baker333', 'typeahead');
  });

  it('shows the matched prefix in bold and the rank on the right of each name option', async () => {
    renderBar();
    fireEvent.change(screen.getByLabelText('Find a player'), { target: { value: 'ba' } });
    const option = await screen.findByRole('option', { name: /Baker333/ });
    await waitFor(() => expect(option.querySelector('b')?.textContent).toBe('Ba'));
    expect(option.textContent).toBe('Baker333#75');
  });

  it('leaves the rank out when the names API does not send one', async () => {
    searchNames.mockResolvedValueOnce([{ mainChar: 'Baker333' }]);
    renderBar();
    fireEvent.change(screen.getByLabelText('Find a player'), { target: { value: 'ba' } });
    const option = await screen.findByRole('option', { name: /Baker333/ });
    expect(option.textContent).toBe('Baker333');
  });

  it('labels the fields with placeholders and an aria-label rather than floating labels', () => {
    const { container } = renderBar();
    const search = screen.getByLabelText('Find a player');
    expect(search.getAttribute('placeholder')).toBe('Find a player or Anon# id');
    expect(search.getAttribute('aria-label')).toBe('Find a player');
    const jump = screen.getByLabelText('Jump to board');
    expect(jump.getAttribute('placeholder')).toBe('Jump to a board (1)');
    expect(jump.getAttribute('aria-label')).toBe('Jump to board');
    expect(container.querySelector('label.MuiInputLabel-root')).toBeNull();
    // The "/" shortcut hint sits in the jump field, and the jump has no popup arrow.
    expect(jump.closest('.MuiInputBase-root').textContent.replace(/​/g, '')).toBe('/');
    expect(container.querySelector('.MuiAutocomplete-popupIndicator')).toBeNull();
    // The Anon# hint lives in the placeholder: a helper line cost the sticky bar a row on phones.
    expect(screen.queryByText(/can be found by their Anon# id/)).toBeNull();
  });

  it('reports the same player again when picked twice', async () => {
    const onPlayer = vi.fn();
    renderBar({ onPlayer });
    const input = screen.getByLabelText('Find a player');
    for (let pick = 1; pick <= 2; pick++) {
      fireEvent.change(input, { target: { value: 'ba' } });
      fireEvent.click(await screen.findByRole('option', { name: /Baker333/ }));
      expect(onPlayer).toHaveBeenCalledTimes(pick);
    }
    expect(onPlayer).toHaveBeenNthCalledWith(2, 'Baker333', 'typeahead');
  });

  it('shows the status line in the bar below xl and in the phone menu', async () => {
    renderBar({ createdAt: Date.UTC(2026, 9, 8, 7, 31) });
    expect(await screen.findByText(/2,608 players · updated/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'More options' }));
    expect(await screen.findAllByText(/2,608 players · updated/)).toHaveLength(2);
  });

  it('sticks right below the navbar, and below the profile banner when it shows', () => {
    const stickyTop = ({ container }) => getComputedStyle(container.firstChild).top;
    expect(stickyTop(renderBar())).toBe('70px');
    cleanup();
    bannerState.isVisible = true;
    expect(stickyTop(renderBar())).toBe('110px');
  });

  it('picks the highlighted suggestion on Enter, so a partial name finds the player', async () => {
    const onPlayer = vi.fn();
    renderBar({ onPlayer });
    const input = screen.getByLabelText('Find a player');
    act(() => input.focus());
    fireEvent.change(input, { target: { value: 'bak' } });
    await screen.findByRole('option', { name: 'Baker333, rank 75' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onPlayer).toHaveBeenCalledWith('Baker333', 'typeahead');
    // A keyboard user keeps focus in the field (a touch screen blurs it to drop the keyboard).
    expect(document.activeElement).toBe(input);
  });

  it('says when no player starts with the typed text', async () => {
    searchNames.mockResolvedValueOnce([]);
    renderBar();
    const input = screen.getByLabelText('Find a player');
    act(() => input.focus());
    fireEvent.change(input, { target: { value: 'zzq' } });
    expect(await screen.findByText('No players start with "zzq"')).toBeTruthy();
  });

  it('holds the viewed player in the field, and its X stops viewing them', () => {
    const onClearPlayer = vi.fn();
    renderBar({ viewing: { name: 'Baker333', kind: 'searched' }, onClearPlayer });
    const input = screen.getByLabelText('Find a player');
    expect(input.value).toBe('Baker333');
    fireEvent.click(screen.getByRole('button', { name: 'Stop viewing Baker333' }));
    expect(onClearPlayer).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(input);
  });

  it('puts the viewed player back when the field is left half-typed', () => {
    renderBar({ viewing: { name: 'Baker333', kind: 'searched' } });
    const input = screen.getByLabelText('Find a player');
    act(() => input.focus());
    fireEvent.change(input, { target: { value: 'zz' } });
    expect(screen.getByRole('button', { name: 'Clear search' })).toBeTruthy();
    fireEvent.blur(input);
    expect(input.value).toBe('Baker333');
  });

  it('keeps the way out when the field is emptied over a viewed player, and Escape puts the name back', () => {
    const onClearPlayer = vi.fn();
    renderBar({ viewing: { name: 'Baker333', kind: 'searched' }, onClearPlayer });
    const input = screen.getByLabelText('Find a player');
    act(() => input.focus());
    fireEvent.change(input, { target: { value: '' } });
    expect(screen.getByRole('button', { name: 'Stop viewing Baker333' })).toBeTruthy();
    fireEvent.change(input, { target: { value: 'zz' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input.value).toBe('Baker333');
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Stop viewing Baker333' }));
    expect(onClearPlayer).toHaveBeenCalledTimes(1);
  });

  it('answers Enter on a no-match row with the typed text, not a silent first press', async () => {
    searchNames.mockResolvedValueOnce([]);
    const onPlayer = vi.fn();
    renderBar({ onPlayer });
    const input = screen.getByLabelText('Find a player');
    act(() => input.focus());
    fireEvent.change(input, { target: { value: 'zzq' } });
    await screen.findByText('No players start with "zzq"');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onPlayer).toHaveBeenCalledWith('zzq', 'enter');
  });

  it('keeps the typed text on Enter when nothing matches', async () => {
    searchNames.mockResolvedValueOnce([]);
    const onPlayer = vi.fn();
    renderBar({ onPlayer });
    const input = screen.getByLabelText('Find a player');
    act(() => input.focus());
    fireEvent.change(input, { target: { value: 'zzq' } });
    await screen.findByText('No players start with "zzq"');
    fireEvent.keyDown(input, { key: 'Enter' });
    // The page answers a miss with a message; the text stays for a quick fix.
    expect(input.value).toBe('zzq');
  });

  it('says what a partial Anon# id is missing', async () => {
    renderBar();
    const input = screen.getByLabelText('Find a player');
    act(() => input.focus());
    fireEvent.change(input, { target: { value: 'Anon#ab1' } });
    expect(await screen.findByText(/Type the full Anon# id/)).toBeTruthy();
    expect(searchNames).not.toHaveBeenCalled();
  });

  it('tells assistive tech the phone menu is a labelled dialog and whether it is open', () => {
    renderBar();
    const more = screen.getByRole('button', { name: 'More options' });
    expect(more.getAttribute('aria-haspopup')).toBe('dialog');
    expect(more.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(more);
    expect(more.getAttribute('aria-expanded')).toBe('true');
    const dialog = screen.getByRole('dialog', { name: 'More options' });
    expect(more.getAttribute('aria-controls')).toBe(dialog.id);
  });

  it('exposes Show anonymous as a switch', () => {
    renderBar();
    expect(screen.getByRole('switch', { name: 'Show anonymous' })).toBeTruthy();
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

  it('opens the first board match on Enter, matching words in any order and section names', async () => {
    const onMetric = vi.fn();
    const boards = buildMetaIndex({ categories: [{ category: 'misc', metrics: [
      { key: 'w5Colo', label: 'W5 Colosseum', section: 'Colosseum', notation: 'default' },
      { key: 'dkOrb', label: 'DK Orb Kills', section: 'Kills & Bosses', notation: 'default' }
    ] }] });
    renderBar({ index: boards, onMetric });
    const jump = screen.getByLabelText('Jump to board');
    act(() => jump.focus());
    fireEvent.change(jump, { target: { value: 'colosseum w5' } });
    await screen.findByRole('option', { name: 'W5 Colosseum' });
    fireEvent.keyDown(jump, { key: 'Enter' });
    expect(onMetric).toHaveBeenCalledWith('w5Colo');
    act(() => jump.focus());
    fireEvent.change(jump, { target: { value: 'bosses' } });
    expect(await screen.findByRole('option', { name: 'DK Orb Kills' })).toBeTruthy();
  });

  it('still takes "/" while the anonymous switch has focus', () => {
    renderBar();
    const toggle = screen.getByRole('switch', { name: 'Show anonymous' });
    act(() => toggle.focus());
    fireEvent.keyDown(toggle, { key: '/' });
    expect(document.activeElement).toBe(screen.getByLabelText('Jump to board'));
  });

  it('focuses the board jump on "/" unless typing', () => {
    renderBar();
    fireEvent.keyDown(document.body, { key: '/' });
    expect(document.activeElement).toBe(screen.getByLabelText('Jump to board'));
    const search = screen.getByLabelText('Find a player');
    act(() => search.focus());
    fireEvent.keyDown(search, { key: '/' });
    expect(document.activeElement).toBe(search);
  });

  it('has the desktop controls in the markup at first render, whatever the viewport', () => {
    // The export cannot know the viewport, so CSS (not a media query hook) picks the layout.
    const { container } = renderBar();
    expect(screen.getByLabelText('Jump to board')).toBeTruthy();
    expect(screen.getByLabelText('Show anonymous')).toBeTruthy();
    expect(screen.getByLabelText('Find a player')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'More options' })).toBeTruthy();
    expect(container.querySelectorAll('input[type="text"], input:not([type])')).toHaveLength(2);
  });

  it('mounts the phone options only while open, as a popover rather than a type-ahead menu', async () => {
    const onMetric = vi.fn();
    renderBar({ onMetric });
    expect(screen.getAllByLabelText('Jump to board')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'More options' }));
    expect(await screen.findAllByLabelText('Jump to board')).toHaveLength(2);
    expect(screen.queryByRole('menu')).toBeNull();
    const phoneJump = screen.getAllByLabelText('Jump to board')[1];
    fireEvent.change(phoneJump, { target: { value: 'Min' } });
    fireEvent.click(await screen.findByText('Mining'));
    expect(onMetric).toHaveBeenCalledWith('mining');
    await waitFor(() => expect(screen.getAllByLabelText('Jump to board')).toHaveLength(1));
  });
});
