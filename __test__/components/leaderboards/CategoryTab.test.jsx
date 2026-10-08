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
