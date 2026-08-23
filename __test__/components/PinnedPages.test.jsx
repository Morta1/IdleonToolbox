// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../styles/theme/darkTheme';

// This project does not load jest-dom, so assertions use plain DOM properties.
vi.mock('next/router', () => ({ useRouter: () => ({ push: vi.fn(), query: {}, pathname: '/' }) }));

const handleDownload = vi.fn();
vi.mock('@utility/helpers', async (importOriginal) => ({
  ...(await importOriginal()),
  handleDownload: (...args) => handleDownload(...args)
}));

const { AppContext } = await import('@components/common/context/AppProvider');
const PinnedPages = (await import('@components/common/favorites/PinnedPages')).default;

const pins = [
  { name: 'stats', url: '/account/misc/stats' },
  { name: 'alchemy', url: '/account/worlds/alchemy', tab: 'Bubbles' }
];

const dispatch = vi.fn();

const renderPinned = (pinnedPages) => render(
  <ThemeProvider theme={darkTheme}>
    <AppContext.Provider value={{ state: { pinnedPages }, dispatch }}>
      <PinnedPages/>
    </AppContext.Provider>
  </ThemeProvider>
);

// The actions live inside the popover, so every test opens it first.
const openPopover = () => fireEvent.click(screen.getByText('Pinned Pages'));

const uploadFile = (contents) => {
  const input = document.querySelector('input[type="file"]');
  fireEvent.change(input, { target: { files: [new File([contents], 'pins.json', { type: 'application/json' })] } });
};

describe('PinnedPages export/import', () => {
  beforeEach(() => {
    localStorage.clear();
    dispatch.mockClear();
    handleDownload.mockClear();
  });

  it('exports the current pins as a json file', () => {
    renderPinned(pins);
    openPopover();
    fireEvent.click(screen.getByRole('button', { name: 'Export' }));
    expect(handleDownload).toHaveBeenCalledWith(pins, 'it-pinned-pages');
  });

  it('disables export when there is nothing pinned', () => {
    renderPinned([]);
    openPopover();
    expect(screen.getByRole('button', { name: 'Export' }).disabled).toBe(true);
  });

  it('imports pins from a file into state and localStorage', async () => {
    renderPinned([]);
    openPopover();
    uploadFile(JSON.stringify(pins));
    await waitFor(() => expect(dispatch).toHaveBeenCalledWith({ type: 'pinnedPages', data: pins }));
    expect(JSON.parse(localStorage.getItem('pinnedPages'))).toEqual(pins);
    expect(screen.getByText('Imported 2 pinned pages')).toBeTruthy();
  });

  // A dashboard config or any other json must not wipe the existing pins.
  it('rejects a file that is not a pinned pages export', async () => {
    renderPinned(pins);
    openPopover();
    uploadFile(JSON.stringify({ account: {}, characters: {} }));
    await waitFor(() => expect(screen.getByText('That file doesn\'t contain pinned pages')).toBeTruthy());
    expect(dispatch).not.toHaveBeenCalled();
    expect(localStorage.getItem('pinnedPages')).toBeNull();
  });
});
