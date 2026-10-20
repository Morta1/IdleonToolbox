// @vitest-environment jsdom
import '../../polyfills';
import React, { useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../styles/theme/darkTheme';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { AppContext } from '@components/common/context/AppProvider';
import { GoalsProvider, useGoals } from '@components/goals/GoalsProvider';
import SetGoalButton from '@components/goals/SetGoalButton';
import { goalHostSx } from '@components/goals/goalHost';
import { getDescriptor, withDescriptors } from '@utility/goals/registry';
import { hasGoals } from '@utility/goals/routes';
import { createGoal, GOALS_STORAGE_KEY } from '@utility/goals/store';
import { numberWithCommas } from '@utility/helpers';

const { account, characters } = parseFixture(latest);
const bubble = getDescriptor('bubble');
const row = bubble.list({ account, characters })[0];
const key = bubble.key(row);

let api;
const Probe = () => {
  const value = useGoals();
  useEffect(() => {
    api = value;
  });
  return null;
};

const mount = (state, ui = <SetGoalButton system="bubble" entryKey={key}/>) => render(
  <ThemeProvider theme={darkTheme}>
    <AppContext.Provider value={{ state: { account, characters, ...state } }}>
      <GoalsProvider>
        <Probe/>
        {ui}
      </GoalsProvider>
    </AppContext.Provider>
  </ThemeProvider>
);

const seed = (goal) => localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify({
  schema: 1,
  accounts: { 'uid-test': [createGoal({ system: 'bubble', key, metric: 'level', ...goal })] }
}));

describe('SetGoalButton', () => {
  beforeEach(() => localStorage.clear());

  it('renders nothing on a profile view', () => {
    const { container } = mount({ uid: 'uid-test', profile: true });
    expect(container.querySelector('.goal-set-btn')).toBeNull();
  });

  it('has-goal class only when a goal exists', async () => {
    seed({ target: 6930 });
    const { container, unmount } = mount({ uid: 'uid-test' });
    await screen.findByText(/▶/);
    expect(container.querySelector('.goal-set-btn.has-goal')).not.toBeNull();
    unmount();
    localStorage.clear();
    const empty = mount({ uid: 'uid-test' });
    const btn = empty.container.querySelector('.goal-set-btn');
    expect(btn).not.toBeNull();
    expect(btn.classList.contains('has-goal')).toBe(false);
  });

  it.each([
    ['a number', { target: 6930 }, `▶ ${numberWithCommas(6930)}`],
    ['max', { target: 'max' }, '▶ Max'],
    ['a percent', { unit: 'percentOfMax', target: 90 }, '▶ 90%']
  ])('shows a badge for %s', async (_, fields, text) => {
    seed(fields);
    mount({ uid: 'uid-test' });
    expect(await screen.findByText(text)).toBeTruthy();
  });

  it('a boolean metric toggles an own-it goal on click', async () => {
    const owned = { ...bubble, system: 'owned', metrics: { owned: { label: 'Owned', boolean: true, value: () => 0 } } };
    await withDescriptors([owned], async () => {
      mount({ uid: 'uid-test' }, <SetGoalButton system="owned" entryKey="k"/>);
      fireEvent.click(screen.getByRole('button', { name: 'Set goal' }));
      expect(api.goals).toMatchObject([{ system: 'owned', key: 'k', metric: 'owned', target: 1 }]);
      fireEvent.click(await screen.findByRole('button', { name: 'Edit goal' }));
      expect(api.goals).toEqual([]);
    });
  });

  it('clicks inside the popover never reach the host onClick', async () => {
    const spy = vi.fn();
    mount({ uid: 'uid-test' }, <div onClick={spy}><SetGoalButton system="bubble" entryKey={key}/></div>);
    fireEvent.click(screen.getByRole('button', { name: 'Set goal' }));
    expect(spy).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByText('Add goal'));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(spy).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByText('Add goal')).toBeNull());
  });

  it('reports open and close through onOpenChange', async () => {
    const calls = [];
    mount({ uid: 'uid-test' }, <SetGoalButton system="bubble" entryKey={key} onOpenChange={(o) => calls.push(o)}/>);
    fireEvent.click(screen.getByRole('button', { name: 'Set goal' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    expect(calls).toEqual([true, false]);
  });

  it('hasGoals is true for the six routes and false for forge and wiki', () => {
    for (const route of ['/account/world-2/bubbles', '/account/world-1/stamps', '/account/class-specific/grimoire',
      '/account/class-specific/compass', '/account/class-specific/tesseract', '/account/class-specific/royal-armory']) {
      expect(hasGoals(route)).toBe(true);
    }
    expect(hasGoals('/account/world-1/forge')).toBe(false);
    expect(hasGoals('/wiki')).toBe(false);
  });

  it('goalHostSx keeps the button visible when a goal exists or hover is unavailable', () => {
    expect(goalHostSx['& .goal-set-btn.has-goal'].opacity).toBe(1);
    expect(goalHostSx['@media (hover: none)']['& .goal-set-btn'].opacity).toBe(0.6);
  });
});
