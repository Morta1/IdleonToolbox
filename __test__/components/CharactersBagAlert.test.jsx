// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import theme from '../../styles/theme/theme';
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
    render(<ThemeProvider theme={theme}>
      <Characters characters={[character]} account={{}} lastUpdated={0} trackers={trackers}/>
    </ThemeProvider>);
    const icons = document.querySelectorAll('img[src*="MaxCapBag"]');
    expect(icons.length).toBe(1);
  });

  it('shows nothing for an alert whose switch is off, even with its options on', () => {
    const { container } = render(<ThemeProvider theme={theme}>
      <Characters characters={[character]} account={{}} lastUpdated={0}
                  trackers={{ bags: { ...trackers.bags, checked: false } }}/>
    </ThemeProvider>);
    expect(container.querySelectorAll('img[src*="MaxCapBag"]').length).toBe(0);
  });

  it('says all caught up, with a way back, when hiding characters without alerts hides every card', () => {
    const onHideAlertless = vi.fn();
    const { container, getByText } = render(<ThemeProvider theme={theme}>
      <Characters characters={[character]} account={{}} lastUpdated={0} hideAlertless onHideAlertless={onHideAlertless}
                  trackers={{ bags: { ...trackers.bags, checked: false } }}/>
    </ThemeProvider>);
    expect(container.querySelector('[data-cy="character-TestChar"]')).toBeNull();
    getByText('Show all').click();
    expect(onHideAlertless).toHaveBeenCalledWith(false);
  });
});
