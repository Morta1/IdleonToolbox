// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../styles/theme/darkTheme';
import Characters from '@components/dashboard/Characters';

const trackers = {
  bags: { checked: true, options: [{ name: 'unmaxedBags', checked: true }] }
};

const character = {
  name: 'TestChar',
  playerId: 0,
  classIndex: 1,
  afkTime: 0,
  afkTarget: 'Nothing',
  maxCarryCap: {
    Mining: 250, Chopping: 35000, Foods: 35000, bCraft: 35000,
    Fishing: 35000, Bugs: 35000, Critters: 35000, Souls: 35000,
    Quests: 10, fillerz: 10, Statues: 10
  }
};

describe('dashboard unmaxed bags alert', () => {
  it('shows the bag alert icon when a carry bag is below max tier', () => {
    render(<ThemeProvider theme={darkTheme}>
      <Characters characters={[character]} account={{}} lastUpdated={0} trackers={trackers}/>
    </ThemeProvider>);
    const icons = document.querySelectorAll('img[src*="MaxCapBag"]');
    expect(icons.length).toBe(1);
  });

  it('shows no bag alert when every carry bag is maxed', () => {
    const maxedChar = { ...character, maxCarryCap: { ...character.maxCarryCap, Mining: 35000 } };
    render(<ThemeProvider theme={darkTheme}>
      <Characters characters={[maxedChar]} account={{}} lastUpdated={0} trackers={trackers}/>
    </ThemeProvider>);
    expect(document.querySelectorAll('img[src*="MaxCapBag"]').length).toBe(0);
  });
});
