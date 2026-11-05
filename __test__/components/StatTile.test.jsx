// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import StatTile from '@components/common/cards/StatTile';
import darkTheme from '../../styles/theme/darkTheme';

const renderCard = (ui) => render(<ThemeProvider theme={darkTheme}>{ui}</ThemeProvider>);

describe('StatTile', () => {
  it('renders a 0 alongside an icon', () => {
    renderCard(<StatTile label={'Opals invested'} value={0} icon={'data/Opal.png'}/>);
    expect(screen.getByText('0')).toBeDefined();
  });

  it('falls back to children when the value is genuinely absent', () => {
    for (const absent of [undefined, null, '']) {
      const { unmount } = renderCard(
        <StatTile label={'Reef Day Gains'} value={absent}><span>from children</span></StatTile>
      );
      expect(screen.getByText('from children')).toBeDefined();
      unmount();
    }
  });

  it('renders a 0 as "0" with its title, not children or an empty card', () => {
    renderCard(<StatTile label={'Level'} value={0}><span>from children</span></StatTile>);
    expect(screen.getByText('Level')).toBeDefined();
    expect(screen.queryByText('from children')).toBeNull();
    expect(screen.getByText('0')).toBeDefined();
  });

  it('shows the breakdown total when the tile has no value of its own', () => {
    renderCard(<StatTile label={'Enemy HP'} breakdown={{ statName: 'Enemy HP', totalValue: 'Lv. 1: 10', tree: [] }}/>);
    // The total is the breakdown's trigger, so it sits inside the one button on the tile.
    expect(screen.getByRole('button').textContent).toContain('Lv. 1: 10');
  });
});
