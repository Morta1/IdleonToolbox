// @vitest-environment jsdom
import '../../../polyfills';
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../../styles/theme/darkTheme';
import CategoryTab from '@components/leaderboards/CategoryTab';
import { buildMetaIndex } from '@components/leaderboards/format';

const index = buildMetaIndex({ categories: [
  { category: 'general', metrics: [
    { key: 'totalMoney', label: 'Total Money', section: 'Account', notation: 'default' },
    { key: 'logSample', label: 'Log Sample', section: '3D Printer Samples', notation: 'default' }
  ] },
  { category: 'skills', metrics: [{ key: 'mining', label: 'Mining', section: 'Skills', notation: 'default' }] }
] });
const lists = { totalMoney: [{ mainChar: 'A', totalMoney: 5, rank: 1 }], logSample: [{ mainChar: 'B', logSample: 2, rank: 1 }], mining: [] };
const renderTab = (props) => render(<ThemeProvider theme={darkTheme}>
  <CategoryTab index={index} lists={lists} ranks={undefined} highlight={{}} pinnedBase={null} onOpen={() => {}} {...props}/>
</ThemeProvider>);

afterEach(cleanup);

describe('CategoryTab', () => {
  it('renders section headings with counts and the player best', () => {
    renderTab({ category: 'general', ranks: { totalMoney: { r: 40, v: 5, p: 2, t: 1 } }, pinnedBase: { mainChar: 'Me', kind: 'logged', globalRank: 9 } });
    expect(screen.getByRole('heading', { name: 'Account' })).toBeTruthy();
    expect(screen.getByText('1 board · your best: Total Money #40')).toBeTruthy();
    expect(screen.getByRole('heading', { name: '3D Printer Samples' })).toBeTruthy();
  });

  it('collapses a section', () => {
    renderTab({ category: 'general' });
    fireEvent.click(screen.getByRole('button', { name: 'Collapse Account' }));
    expect(screen.getByRole('button', { name: 'Expand Account' }).getAttribute('aria-expanded')).toBe('false');
  });

  it('renders no heading for a single-section tab', () => {
    renderTab({ category: 'skills' });
    expect(screen.queryByRole('heading', { level: 2 })).toBeNull();
    expect(screen.getByText('Mining')).toBeTruthy();
  });

  it('falls back to the list keys without meta', () => {
    renderTab({ category: 'general', index: buildMetaIndex(undefined) });
    expect(screen.getByText('Total Money')).toBeTruthy();
    expect(screen.getByText('Log Sample')).toBeTruthy();
  });
});

describe('CategoryTab controls', () => {
  it('collapses and expands every section at once', () => {
    renderTab({ category: 'general' });
    expect(screen.getByRole('button', { name: 'Expand all' }).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Collapse all' }));
    expect(screen.getByRole('button', { name: 'Expand Account' }).getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByRole('button', { name: 'Expand 3D Printer Samples' }).getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByRole('button', { name: 'Collapse all' }).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Expand all' }));
    expect(screen.getByRole('button', { name: 'Collapse Account' }).getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('button', { name: 'Collapse 3D Printer Samples' }).getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('button', { name: 'Expand all' }).disabled).toBe(true);
  });

  it('enables both buttons when only some sections are open', () => {
    renderTab({ category: 'general' });
    fireEvent.click(screen.getByRole('button', { name: 'Collapse Account' }));
    expect(screen.getByRole('button', { name: 'Expand all' }).disabled).toBe(false);
    expect(screen.getByRole('button', { name: 'Collapse all' }).disabled).toBe(false);
  });

  it('has no bulk buttons on a single-section tab', () => {
    renderTab({ category: 'skills' });
    expect(screen.queryByRole('button', { name: 'Expand all' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Collapse all' })).toBeNull();
  });

  it('says anonymous players are hidden only when Show anonymous is off', () => {
    const notice = 'Anonymous players hidden. Ranks still count everyone, so numbers can skip.';
    renderTab({ category: 'general', showAnonymous: false });
    expect(screen.getByText(notice)).toBeTruthy();
    cleanup();
    renderTab({ category: 'general', showAnonymous: true });
    expect(screen.queryByText(notice)).toBeNull();
  });

  it('counts the boards where the viewed player holds the max', () => {
    const maxedIndex = buildMetaIndex({ categories: [{ category: 'general', metrics: [
      { key: 'logBook', label: 'Log Book', section: 'Account', notation: 'default', maxed: true, top: 100, topTies: 5 },
      { key: 'totalMoney', label: 'Total Money', section: 'Account', notation: 'default' },
      { key: 'logSample', label: 'Log Sample', section: 'Samples', notation: 'default' }
    ] }] });
    renderTab({
      category: 'general', index: maxedIndex, pinnedBase: { mainChar: 'Me', kind: 'logged', globalRank: 9 },
      ranks: { logBook: { r: 1, v: 100, p: 5, t: 5 }, totalMoney: { r: 40, v: 5, p: 2, t: 1 } }
    });
    expect(screen.getByText('2 boards · your best: Total Money #40 · 1 at the max')).toBeTruthy();
    expect(screen.getByText('1 board')).toBeTruthy();
  });
});
