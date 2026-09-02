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
    // monster or resource the map is known for.
    expect(screen.getByText(/W1 Spore Meadows \(10 PTS\)/)).toBeTruthy();
    expect(screen.getByText('Green Mushroom')).toBeTruthy();
    // Mining maps resolve off the same lookup and name the ore instead.
    expect(screen.getByText(/W1 The Ol' Straightaway \(12 PTS\)/)).toBeTruthy();
    expect(screen.getByText('Plat')).toBeTruthy();
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

    const owlPerch = await screen.findByText(/W1 Grand Owl Perch \(11 PTS\)/);
    // No monster means no trailing label at all, rather than an empty one.
    expect(owlPerch.querySelectorAll('img').length).toBe(0);
  });
});
