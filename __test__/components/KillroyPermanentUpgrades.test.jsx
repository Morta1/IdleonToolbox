// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import PermanentUpgrades from '@components/account/Worlds/World2/Killroy/PermanentUpgrades';
import darkTheme from '../../styles/theme/darkTheme';

const killroy = {
  permanentUpgrades: [
    {
      description: 'Permanently_boosts_Artifact_Find_Chance!_Current_bonus_is_1.09x',
      level: 31,
      progress: 9.39,
      bonusDisplay: '1.09x',
      capDisplay: '2x',
      breakpoints: [
        { percent: 50, level: 300, bonusDisplay: '1.5x' },
        { percent: 75, level: 900, bonusDisplay: '1.75x' }
      ],
      nextBreakpoint: { percent: 50, level: 300, bonusDisplay: '1.5x' }
    },
    {
      description: 'Adds_1_nugget_to_your_Shovel_in_Gaming,_go_dig_it_up!',
      level: 0,
      progress: null,
      bonusDisplay: null,
      capDisplay: null,
      breakpoints: null,
      nextBreakpoint: null
    }
  ]
};

const renderUpgrades = () => render(<ThemeProvider theme={darkTheme}><PermanentUpgrades killroy={killroy}/></ThemeProvider>);

describe('Killroy permanent upgrades', () => {
  it('shows the next decay breakpoint level for a capped upgrade', () => {
    renderUpgrades();
    expect(screen.getByText(/Next breakpoint: Lv\. 300 \(1\.5x\)/)).toBeDefined();
  });

  it('renders flat unlocks without a breakpoint line', () => {
    renderUpgrades();
    expect(screen.getAllByText(/Next breakpoint/)).toHaveLength(1);
    expect(screen.getByText('Adds 1 nugget to your Shovel in Gaming, go dig it up!')).toBeDefined();
  });
});
