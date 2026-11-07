// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import theme from '../../styles/theme/theme';

vi.mock('next/router', () => ({ useRouter: () => ({ push: vi.fn(), query: {}, asPath: '/' }) }));

const Etc = (await import('@components/dashboard/Etc')).default;

const now = Date.now();
const DAY = 24 * 60 * 60;

// Feather Restart is 10 days off and Megafeather Restart is ready, so soonest first would put Megafeather on top.
const account = {
  accountOptions: { 253: 1 },
  owl: { feathers: 0, featherRate: 1, upgrades: { 4: { cost: 10 * DAY }, 8: { cost: 0 } } },
  timeAway: { GlobalTime: now / 1000 }
};
const trackers = {
  Clickers: { featherRestart: { checked: true }, megaFeatherRestart: { checked: true } },
  Etc: { bonusTimeLeft: { checked: true } }
};

afterEach(() => localStorage.clear());

describe('timers by world', () => {
  it('keeps each timer in its world\'s box in the alerts\' order, a ready one where it sits', async () => {
    localStorage.setItem('toolbar:dashboard-timers', JSON.stringify({ group: 'world' }));
    const { container } = render(<ThemeProvider theme={theme}>
      <Etc characters={[]} account={account} lastUpdated={now} trackers={trackers}/>
    </ThemeProvider>);
    const boxes = () => [...container.querySelectorAll('[aria-label="Timers"] > *')].map((box) => [
      box.querySelector('h2')?.textContent,
      [...box.querySelectorAll('a')].map(({ textContent }) => textContent.replace('›', '').trim())
    ]);
    await waitFor(() => expect(boxes()).toEqual([
      ['Clickers', ['Feather Restart', 'Megafeather Restart']],
      ['Vote', ['Vote bonus week']]
    ]));
  });
});
