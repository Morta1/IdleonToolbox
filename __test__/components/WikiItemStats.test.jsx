// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import ItemStats from '@components/wiki/ItemStats';
import darkTheme from '../../styles/theme/darkTheme';

const draw = (node) => render(
  <ThemeProvider theme={darkTheme}><ItemStats node={node}/></ThemeProvider>
);

describe('ItemStats sell price', () => {
  // Most priced items are resources with no stats at all, so this is the case that used to render
  // nothing: 1,496 items carry a sellPrice and only the 128 stamps ever showed one.
  it('shows a price for an item that has no stats', () => {
    draw({ kind: 'item', rawName: 'Copper', category: 'MINING_ORE', sellPrice: 200 });
    expect(screen.getByText('Sell Price')).toBeDefined();
  });

  it('shows the price alongside the stats when an item has both', () => {
    draw({
      kind: 'item', rawName: 'Sword', category: 'WEAPON', sellPrice: 4000,
      stats: { Weapon_Power: 5, lvReqToEquip: 10 }
    });
    expect(screen.getByText('Sell Price')).toBeDefined();
    expect(screen.getByText('Level')).toBeDefined();
  });

  it('renders nothing when there is neither a price nor stats', () => {
    const { container } = draw({ kind: 'item', rawName: 'Quest1', category: 'QUEST' });
    expect(container.firstChild).toBeNull();
  });

  // Every node in the rail passes through here, and a monster's stats object matches none of the
  // equipment keys. It must not pick up a price it does not have.
  it('leaves a monster alone', () => {
    const { container } = draw({
      kind: 'monster', rawName: 'mushG', stats: { attack: 3, health: 25 }, sellPrice: 999
    });
    expect(container.firstChild).toBeNull();
  });
});
