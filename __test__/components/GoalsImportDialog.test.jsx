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
import Goals from '@components/dashboard/goals/Goals';
import ImportDialog, { READ_ERROR } from '@components/dashboard/goals/ImportDialog';
import { exportGoals, isItemGoal } from '@utility/goals/importExport';
import { createGoal, GOALS_STORAGE_KEY } from '@utility/goals/store';
import { trackEvent } from '@utility/analytics';

vi.mock('next/router', () => ({ useRouter: () => ({ push: vi.fn(), query: {}, isReady: true, pathname: '/dashboard' }) }));
vi.mock('@utility/analytics', () => ({ trackEvent: vi.fn() }));

const { account, characters } = parseFixture(latest);
const KEY = 'uid-test';
const bubble = (key, fields) => createGoal({ system: 'bubble', metric: 'level', key, target: 5, ...fields });
const fileText = (goals) => JSON.stringify(exportGoals(goals, characters));

let api;
const Probe = () => {
  const value = useGoals();
  useEffect(() => {
    api = value;
  });
  return null;
};
const mount = (ui) => render(
  <ThemeProvider theme={darkTheme}>
    <AppContext.Provider value={{ state: { uid: KEY, account, characters }, dispatch: vi.fn() }}>
      <GoalsProvider><Probe/>{ui}</GoalsProvider>
    </AppContext.Provider>
  </ThemeProvider>
);
const seed = (...goals) => localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify({ schema: 1, accounts: { [KEY]: goals } }));
const stored = () => JSON.parse(localStorage.getItem(GOALS_STORAGE_KEY)).accounts[KEY];

describe('Goals import dialog', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(trackEvent).mockClear();
  });

  it('merge adds new goals, reports duplicates and tracks once', async () => {
    seed(bubble('a'));
    mount(<ImportDialog text={fileText([bubble('a'), bubble('b'), bubble('c', { scope: { char: 'Gone', classIndex: -5 } })])} onClose={vi.fn()}/>);
    expect(screen.getByText('3 goals: 2 account, 1 character')).toBeTruthy();
    await waitFor(() => expect(api.loaded).toBe(true));
    fireEvent.click(screen.getByRole('button', { name: 'Import' }));
    expect(await screen.findByText('Imported 1. 1 already there. 1 skipped.')).toBeTruthy();
    expect(stored().map((g) => g.key)).toEqual(['a', 'b']);
    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith('goal_added', { source: 'import', count: 1 });
  });

  it('replace swaps the current goals for the file', async () => {
    seed(bubble('old'));
    mount(<ImportDialog text={fileText([bubble('new')])} onClose={vi.fn()}/>);
    await waitFor(() => expect(api.loaded).toBe(true));
    expect(screen.queryByText('This removes your 1 current goal')).toBeNull();
    fireEvent.click(screen.getByLabelText('Replace my goals'));
    expect(screen.getByText('This removes your 1 current goal')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Import' }));
    await screen.findByText('Imported 1.');
    expect(stored().map((g) => g.key)).toEqual(['new']);
  });

  it('lists each exported character once, with its goal count and a select of whose goals they become', async () => {
    const [a, b] = characters;
    mount(<ImportDialog text={fileText([
      bubble('x', { scope: { char: a.name } }), bubble('y', { scope: { char: a.name } }), bubble('z', { scope: { char: b.name } })
    ])} onClose={vi.fn()}/>);
    expect(screen.getByText(`${a.name}: 2 goals`)).toBeTruthy();
    expect(screen.getByText(`${b.name}: 1 goal`)).toBeTruthy();
    expect(screen.getAllByRole('combobox').map((el) => el.textContent)).toEqual([a.name, b.name]);
    expect(screen.getAllByLabelText('Import as')).toEqual(screen.getAllByRole('combobox'));
  });

  it.each([
    ['not json', 'This file is not a goals export'],
    [JSON.stringify({ format: 'idleon-toolbox-goals', schema: 9, goals: [] }), 'This file is from a newer version of the site'],
    [READ_ERROR, 'This file could not be read']
  ])('shows the error for %s', (text, message) => {
    mount(<ImportDialog text={text} onClose={vi.fn()}/>);
    expect(screen.getByText(message)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Import' })).toBeNull();
  });

  it('the section header picks a file and opens the dialog', async () => {
    seed(bubble('a'));
    const { container } = mount(<Goals/>);
    const input = container.querySelector('input[type="file"]');
    const file = { text: () => Promise.resolve(fileText([bubble('z')])) };
    fireEvent.change(input, { target: { files: [file] } });
    expect(await screen.findByText('1 goal: 1 account, 0 character')).toBeTruthy();
  });

  it('scoped to item goals: imports only item goals and replace keeps the other goals', async () => {
    const item = (key) => createGoal({ system: 'item', metric: 'quantity', key, target: 5 });
    seed(bubble('keep'), item('Old'));
    mount(<ImportDialog text={fileText([item('New'), bubble('skip')])} onClose={vi.fn()} only={isItemGoal} noun="item goal"/>);
    await waitFor(() => expect(api.loaded).toBe(true));
    expect(screen.getByText('1 goal: 1 account, 0 character')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Replace my item goals'));
    expect(screen.getByText('This removes your 1 current item goal')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Import' }));
    await screen.findByText('Imported 1.');
    expect(stored().map((g) => g.key)).toEqual(['keep', 'New']);
  });
});
