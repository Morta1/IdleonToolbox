// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../styles/theme/darkTheme';
import { parseFixture } from '../helpers/parsed-fixtures';
import raw from '../../data/raw.json';

const { AppContext } = await import('@components/common/context/AppProvider');
const UpgradeOptimizer = (await import('@components/account/Worlds/World6/Farming/UpgradeOptimizer')).default;

const { characters, account } = parseFixture(raw);

const renderOptimizer = (state = { characters, account }) => render(
  <ThemeProvider theme={darkTheme}>
    <AppContext.Provider value={{ state }}>
      <UpgradeOptimizer/>
    </AppContext.Provider>
  </ThemeProvider>
);

const pickOption = (label, option) => {
  fireEvent.mouseDown(screen.getByLabelText(label));
  fireEvent.click(within(screen.getByRole('listbox')).getByText(option));
};

describe('Land rank upgrade optimizer', () => {
  it('renders a plan for the default category', () => {
    renderOptimizer();
    expect(screen.getByText('Recommended Upgrade Sequence')).toBeTruthy();
    // Evolution is the default category on first render.
    expect(screen.getByText(/Evolution Ultraboost/)).toBeTruthy();
    // 100 points, spread across the evolution upgrades by marginal gain rather than dumped in one.
    expect(screen.getByText('Total Cost: 63 pts')).toBeTruthy();
    expect(screen.getByText('33 points across the plan')).toBeTruthy();
  });

  it('switches the plan when the category changes', () => {
    renderOptimizer();
    pickOption('Optimization Category', 'Overgrowth');
    expect(screen.getByText(/Overgrowth Superboost/)).toBeTruthy();
    expect(screen.queryByText(/Evolution Ultraboost/)).toBeNull();
  });

  // The 5th column caps out, so a plan for it has to spread across several upgrades rather than
  // pouring every point into the single best one.
  it('spreads character stat points across several upgrades', () => {
    renderOptimizer();
    pickOption('Optimization Category', 'Character Stats');
    expect(screen.getByText(/Seed of Loot/)).toBeTruthy();
    expect(screen.getByText(/Seed of Damage/)).toBeTruthy();
  });

  it('lists every point separately once grouping is off', () => {
    renderOptimizer();
    pickOption('Group mode', 'None');
    expect(screen.getAllByText(/Cost: 1 pts/)).toHaveLength(100);
  });

  it('says why crop value has nothing to recommend once the plots are capped', () => {
    renderOptimizer();
    pickOption('Optimization Category', 'Crop Value');
    expect(screen.getByText(/already at the game's crop multiplier cap/)).toBeTruthy();
  });

  it('renders without an account instead of throwing', () => {
    renderOptimizer({});
    expect(screen.getByText(/Land Rank isn't unlocked on this account yet/)).toBeTruthy();
    expect(screen.getByText(/No viable upgrades found/)).toBeTruthy();
  });
});
