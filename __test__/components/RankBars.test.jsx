// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../styles/theme/darkTheme';
import ChartFrame from '@components/common/charts/ChartFrame';
import RankBars from '@components/common/charts/RankBars';

// ChartFrame's scroll margin reads the page top (the bar, and the band while it shows), which reads the router.
vi.mock('next/router', () => ({ useRouter: () => ({ pathname: '/statistics', query: {} }) }));

const ROWS = [
  { key: 'a', name: 'Skilled Dimwit', value: 41329, tip: '41,329', detail: '41,329' },
  { key: 'b', name: 'Balance of Pain', value: 29732, tip: '29,732', detail: '29,732' }
];
const TABLE = {
  rows: ROWS,
  rowKey: 'key',
  columns: [
    { key: 'name', label: 'Prayer', render: (row) => row.name },
    { key: 'value', label: 'Players', numeric: true, render: (row) => row.detail }
  ]
};

describe('RankBars in a ChartFrame', () => {
  it('is one tab stop, moves with the arrows to the exact value, and swaps to its table', async () => {
    render(<ThemeProvider theme={darkTheme}>
      <ChartFrame table={TABLE}><RankBars label={'Top prayers'} rows={ROWS}/></ChartFrame>
    </ThemeProvider>);
    const bars = within(screen.getByRole('list', { name: 'Top prayers' })).getAllByRole('listitem');
    const before = { text: bars.map((bar) => bar.textContent), tabs: bars.map((bar) => bar.tabIndex) };
    bars[0].focus();
    fireEvent.keyDown(bars[0], { key: 'ArrowDown' });
    const moved = { focused: document.activeElement === bars[1], tabs: bars.map((bar) => bar.tabIndex) };
    const tooltip = (await screen.findByRole('tooltip')).textContent;
    fireEvent.click(screen.getByRole('button', { name: 'Show as table' }));
    const table = screen.getAllByRole('row').map((row) => row.textContent);
    expect({ before, moved, tooltip, table }).toEqual({
      before: { text: ['Skilled Dimwit41,329', 'Balance of Pain29,732'], tabs: [0, -1] },
      moved: { focused: true, tabs: [-1, 0] },
      tooltip: 'Balance of Pain29,732',
      table: ['PrayerPlayers', 'Skilled Dimwit41,329', 'Balance of Pain29,732']
    });
  });
});
