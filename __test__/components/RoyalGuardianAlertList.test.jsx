// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../styles/theme/darkTheme';
import Account from '@components/dashboard/Account';

// useAlerts keys trackers by dashboard section, then by tracker within it.
const trackers = {
  'World 7': {
    royalGuardian: {
      checked: true,
      options: [{ name: 'unspentPts', checked: true, props: { value: 10 } }]
    }
  }
};

// Spore Meadows is a fighting map and The Ol' Straightaway a mining one, so the pair covers both
// shapes the alert has to name. Grand Owl Perch has no AFK target at all.
const outpost = (mapIndex, name, world, monsterRawName, monsterName, ptsLeft) => ({
  mapIndex,
  name,
  world,
  monsterRawName,
  monsterName,
  ptsLeft,
  mode: 0
});

const account = {
  finishedWorlds: { World6: true },
  royalGuardian: {
    unlocked: true,
    outposts: [
      outpost(1, 'Spore Meadows', 1, 'mushG', 'Green Mushroom', 10),
      outpost(10, "The Ol' Straightaway", 1, 'Plat', 'Plat', 12),
      outpost(42, 'Grand Owl Perch', 1, null, null, 11)
    ],
    clearingMaps: []
  }
};

const renderDashboard = () => render(<ThemeProvider theme={darkTheme}>
  <Account account={account} characters={[]} lastUpdated={0} trackers={trackers}/>
</ThemeProvider>);

describe('royal guardian alert list', () => {
  it('names the world and the map monster next to every outpost', async () => {
    renderDashboard();
    fireEvent.mouseOver(document.querySelector('img[src*="Royal_Cost"]'));
    await screen.findByText(/W1 Spore Meadows/);

    // A bare map name places nothing for most players, so each line carries its world and the
    // monster or resource the map is known for. The PTS count sits in its own column rather
    // than inside the name.
    expect(screen.getByText('W1 Spore Meadows')).toBeTruthy();
    expect(screen.getByText('Green Mushroom')).toBeTruthy();
    expect(screen.getByText('10 PTS')).toBeTruthy();
    // Mining maps resolve off the same lookup and name the ore instead.
    expect(screen.getByText("W1 The Ol' Straightaway")).toBeTruthy();
    expect(screen.getByText('Plat')).toBeTruthy();
    expect(screen.getByText('12 PTS')).toBeTruthy();
  });

  it('draws the monster sprite alongside the name', async () => {
    renderDashboard();
    fireEvent.mouseOver(document.querySelector('img[src*="Royal_Cost"]'));
    await screen.findByText(/W1 Spore Meadows/);

    const sprites = [...document.querySelectorAll('img')]
      .map((img) => img.getAttribute('src'))
      .filter((src) => /mushG|Plat/.test(src));
    expect(sprites.length).toBe(2);
  });

  it('falls back to the plain map name where the map has no AFK target', async () => {
    renderDashboard();
    fireEvent.mouseOver(document.querySelector('img[src*="Royal_Cost"]'));

    const owlPerch = await screen.findByText('W1 Grand Owl Perch');
    // No monster means no trailing label at all, rather than an empty one.
    expect(owlPerch.closest('li').querySelectorAll('img').length).toBe(0);
    expect(screen.getByText('11 PTS')).toBeTruthy();
  });
});

describe('royal guardian unit alerts', () => {
  const bar = (rank, units = 0) => ({ rank, units, unlocked: true, expPerUnit: 10 });
  const unitAccount = {
    finishedWorlds: { World6: true },
    royalGuardian: {
      unlocked: true,
      clearingMaps: [],
      outpostStats: { guardRangeBonus: 25, barsUnlocked: [true, true, true, true, false] },
      outposts: [
        {
          // Two Guards, but one already reaches the only (spent) node; nothing fresh in reach.
          ...outpost(1, 'Spore Meadows', 1, 'mushG', 'Green Mushroom', 0),
          freshNodeInReach: false,
          unitSlots: [2, 2],
          rangeUncapped: 130,
          connectedNodes: [{ exhausted: true }],
          links: [{ distance: 100, slack: 15, live: false }],
          rankBars: [bar(0), bar(0), bar(6, 2), bar(0)]
        }
      ]
    }
  };
  const unitTrackers = {
    'World 7': {
      royalGuardian: {
        checked: true,
        options: [
          { name: 'idleGuards', checked: true },
          { name: 'commandRank', checked: true, props: { value: 6 } }
        ]
      }
    }
  };
  const renderUnits = () => render(<ThemeProvider theme={darkTheme}>
    <Account account={unitAccount} characters={[]} lastUpdated={0} trackers={unitTrackers}/>
  </ThemeProvider>);

  it('splits spare Guards from the ones only reaching an empty resource', async () => {
    renderUnits();
    fireEvent.mouseOver(document.querySelector('img[src*="RGunit2"]'));

    expect(await screen.findByText(/Guards whose range it does not need - Traders or Surveyors/)).toBeTruthy();
    expect(screen.getByText(/rewire it after the daily reset/)).toBeTruthy();
    expect(screen.getByText('1 spare Guard, 1 Guard on an empty resource')).toBeTruthy();
  });

  it('names the rank reached and the units still on it', async () => {
    renderUnits();
    fireEvent.mouseOver(document.querySelector('img[src*="RGmilitia"]'));

    expect(await screen.findByText(/reached Command rank 6 with units still on it/)).toBeTruthy();
    expect(screen.getByText('Rank 6, 2 units')).toBeTruthy();
  });
});
