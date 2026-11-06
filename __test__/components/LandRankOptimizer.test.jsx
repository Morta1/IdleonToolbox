// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import theme from '../../styles/theme/theme';
import { parseFixture } from '../helpers/parsed-fixtures';
import raw from '../../data/raw.json';

const { AppContext } = await import('@components/common/context/AppProvider');
const UpgradeOptimizer = (await import('@components/account/Worlds/World6/Farming/UpgradeOptimizer')).default;

const { characters, account } = parseFixture(raw);

const renderOptimizer = (state = { characters, account }) => render(
  <ThemeProvider theme={theme}>
    <AppContext.Provider value={{ state }}>
      <UpgradeOptimizer/>
    </AppContext.Provider>
  </ThemeProvider>
);

// The category's field reads the key it always had
const withGoal = (goal) => localStorage.setItem('landRankOptimizer:goal', JSON.stringify(goal));

const pickOption = (label, option) => {
  fireEvent.mouseDown(screen.getByLabelText(label));
  fireEvent.click(within(screen.getByRole('listbox')).getByText(option));
};

describe('Land rank upgrade optimizer', () => {
  afterEach(() => localStorage.clear());

  it('renders a plan for the default category', () => {
    renderOptimizer();
    expect(screen.getByText('Recommended Crop Evolution upgrade sequence')).toBeTruthy();
    // Evolution is the default category on first render.
    expect(screen.getByText(/Evolution Ultraboost/)).toBeTruthy();
    // 100 points, spread across the evolution upgrades by marginal gain rather than dumped in one.
    expect(screen.getByText('63 pts').previousSibling?.textContent).toBe('Total cost');
    expect(screen.getAllByText(/^Lv [\d,]+ → [\d,]+( \/ [\d,]+)?$/)[0].parentElement.textContent).toMatch(/ · 63 upgrades, #\d+ to #\d+$/);
  });

  it('switches the plan when the category changes', () => {
    withGoal('overgrowth');
    renderOptimizer();
    expect(screen.getByText(/Overgrowth Superboost/)).toBeTruthy();
    expect(screen.queryByText(/Evolution Ultraboost/)).toBeNull();
  });

  // The 5th column caps out, so a plan for it has to spread across several upgrades rather than
  // pouring every point into the single best one.
  it('spreads character stat points across several upgrades', () => {
    withGoal('character');
    renderOptimizer();
    expect(screen.getByText(/Seed of Loot/)).toBeTruthy();
    expect(screen.getByText(/Seed of Damage/)).toBeTruthy();
  });

  it('lists every point separately once grouping is off', () => {
    renderOptimizer();
    pickOption('Group', 'None');
    expect(screen.getAllByText('1 pt')).toHaveLength(100);
  });

  it('says why crop value has nothing to recommend once the plots are capped', () => {
    withGoal('cropValue');
    renderOptimizer();
    expect(screen.getByText(/already at the game's crop multiplier cap/)).toBeTruthy();
  });

  it('renders without an account instead of throwing', () => {
    renderOptimizer({});
    expect(screen.getByText(/Land Rank isn't unlocked on this account yet/)).toBeTruthy();
    expect(screen.queryByText(/No viable upgrades found/)).toBeNull();
  });
});
