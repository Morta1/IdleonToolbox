// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../styles/theme/darkTheme';
import graph from '../../data/entity-graph.json';
import SneakFloorInfo from '@components/wiki/SneakFloorInfo';
import { registryInfoShows } from '@components/wiki/RegistryInfo';

const floor = graph.nodes['sneakfloor:SneakFloor4'];
const index = { byId: graph.nodes };
const renderFloor = () => render(<ThemeProvider theme={darkTheme}>
  <SneakFloorInfo node={floor} index={index} hrefFor={(id) => `/wiki/${id}`} onNavigate={() => {}}/>
</ThemeProvider>);

const tables = (container) => [...container.querySelectorAll('table')].map((table) => [...table.querySelectorAll('tbody tr')]
  .map((row) => [...row.querySelectorAll('th, td')].map((cell) => cell.textContent)));

describe('SneakFloorInfo', () => {
  // The stats and the loot follow one Ninja Mastery field; the rail no longer repeats them.
  it('lays the floor out as a stats table and a loot table', () => {
    const { container } = renderFloor();
    const [stats, loot] = tables(container);
    expect({
      stats: stats.map(([label]) => label),
      door: stats[0][1],
      loot,
      rail: registryInfoShows(floor)
    }).toEqual({
      stats: ['Door HP', 'Stealth for 0% detection', 'Base Jade Coins per action', 'Base EXP per action'],
      door: '25,000',
      loot: [
        ['Spirited Mane', '1 in 33', '3.00%'],
        ['Fiery Mane', '1 in 103', '0.970%'],
        ['Gold Eye', '1 in 6.1', '16.3%'],
        ['Silk Veil', '1 in 6.3', '15.9%'],
        ['Jagged Kunai', '1 in 1.6', '63.8%']
      ],
      rail: false
    });
  });

  // The export is the Mastery 0 page, so the items a later mastery adds are named and linked under the table.
  it('links the items each later Ninja Mastery adds', () => {
    const { container } = renderFloor();
    const added = [...container.querySelectorAll('[data-mastery-adds]')].map((line) => [
      line.textContent,
      [...line.querySelectorAll('a')].map((link) => link.getAttribute('href'))
    ]);
    expect(added).toEqual([
      ['Ninja Mastery 1 adds: Emerald (needs a Wind Walker)', ['/wiki/ninjaitem:NjGem6']],
      ['Ninja Mastery 2 adds: Gold Star', ['/wiki/ninjaitem:NjTr21']]
    ]);
  });

  it('moves the loot with the mastery, the class-locked item marked', () => {
    const { container } = renderFloor();
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '2' } });
    const [, loot] = tables(container);
    expect(loot.map(([item]) => item)).toEqual(['Spirited Mane', 'Fiery Mane', 'Gold Eye', 'Silk Veil', 'EmeraldNeeds a Wind Walker', 'Gold Star', 'Jagged Kunai']);
  });
});
