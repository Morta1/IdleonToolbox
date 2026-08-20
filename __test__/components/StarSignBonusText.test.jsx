// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render as rtlRender } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import PlayerStarSigns from '@components/characters/PlayerStarSigns';
import SamplingStarSigns from '@components/tools/sampling-companion/StarSigns';
import { formatStarSignBonus } from '@utility/helpers';
import { starSigns as rawStarSigns } from '@website-data';

const theme = createTheme();
const render = (ui) => rtlRender(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

// Decimal-valued star sign bonuses use the "{.{" token pair rather than a single "{", so a
// non-global single replace leaves a stray ".{" behind - the Blue Hedgehog report.
const blueHedgehog = Object.values(rawStarSigns).find(({ starName }) => starName === 'Blue_Hedgehog');

describe('formatStarSignBonus', () => {
  it('substitutes the "{.{" decimal token', () => {
    expect(formatStarSignBonus('+{.{%_Ring_Drop', 0.0001)).toBe('+0.0001%_Ring_Drop');
    expect(formatStarSignBonus('{.{x_Star_Sign_bonuses', 1.1)).toBe('1.1x_Star_Sign_bonuses');
  });

  it('still substitutes a lone "{"', () => {
    expect(formatStarSignBonus('+{%_Movement_Speed', 4)).toBe('+4%_Movement_Speed');
  });

  it('leaves no placeholder behind for any star sign in the game data', () => {
    Object.values(rawStarSigns).forEach(({ starName, bonuses }) => {
      bonuses?.forEach(({ rawName, bonus }) => {
        expect(formatStarSignBonus(rawName, bonus), starName).not.toMatch(/[{}]/);
      });
    });
  });
});

describe('PlayerStarSigns', () => {
  it('renders the Blue Hedgehog ring drop bonus without a stray ".{"', () => {
    const { container } = render(<PlayerStarSigns signs={[blueHedgehog]}/>);
    expect(container.textContent).toContain('+0.0001% Ring Drop');
    expect(container.textContent).not.toContain('.{');
  });
});

describe('sampling-companion StarSigns', () => {
  it('renders the Blue Hedgehog ring drop bonus without a stray ".{"', () => {
    const bonusIndex = 1;
    const { container } = render(<SamplingStarSigns
      starSigns={[{ starSign: blueHedgehog, bonusIndex, starSignIndex: 0 }]}
      account={{ starSigns: [blueHedgehog] }}
      character={{ starSigns: [blueHedgehog] }}
    />);
    expect(container.textContent).toContain('+0.0001% Ring Drop');
    expect(container.textContent).not.toContain('.{');
  });
});
