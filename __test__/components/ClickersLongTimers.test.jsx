// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../styles/theme/darkTheme';

vi.mock('next/router', () => ({ useRouter: () => ({ push: vi.fn(), query: {}, asPath: '/' }) }));

const Etc = (await import('@components/dashboard/Etc')).default;

const now = new Date('2026-01-01T00:00:00.000Z').getTime();
const DAY = 24 * 60 * 60 * 1000;

// The five Clickers timers used to disagree about how far out a countdown may run before it
// collapses to "A long time": feather/fisheroo rendered a raw countdown at any distance while the
// other three cut off at 365 days. `days` here is how far the upgrade sits from `lastUpdated`.
const buildAccount = (days) => {
  // Rates are per second for the owl and per minute for the kangaroo/bubba, matching the parsers.
  const featherRate = 1;
  const fishRate = 1;
  return {
    accountOptions: { 253: 1 },
    owl: {
      feathers: 0,
      featherRate,
      upgrades: {
        4: { cost: days * DAY / 1000 * featherRate },
        8: { cost: days * DAY / 1000 * featherRate }
      }
    },
    // The kangaroo rows only render once the account has banked at least one fish.
    kangaroo: {
      totalFish: 1,
      fishRate,
      upgrades: {
        6: { cost: days * DAY / 60000 * fishRate + 1 },
        11: { cost: days * DAY / 60000 * fishRate + 1 }
      }
    }
  };
};

const trackers = {
  Clickers: {
    featherRestart: { checked: true },
    megaFeatherRestart: { checked: true },
    fisherooReset: { checked: true },
    greatestCatch: { checked: true }
  }
};

const renderClickers = (days) => render(<ThemeProvider theme={darkTheme}>
  <Etc characters={[]} account={buildAccount(days)} lastUpdated={now} trackers={trackers}/>
</ThemeProvider>);

const longTimeCount = (container) => Array.from(container.querySelectorAll('p'))
  .filter(({ textContent }) => textContent === 'A long time').length;

describe('dashboard Clickers long duration cutoff', () => {
  it('collapses every Clickers timer past 365 days to "A long time"', () => {
    const { container } = renderClickers(400);
    expect(longTimeCount(container)).toBe(4);
  });

  it('keeps the countdown on every Clickers timer within 365 days', () => {
    const { container } = renderClickers(100);
    expect(longTimeCount(container)).toBe(0);
  });
});
