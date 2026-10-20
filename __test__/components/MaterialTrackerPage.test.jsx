// @vitest-environment jsdom
import '../../polyfills';
import React, { useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../styles/theme/darkTheme';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { AppContext } from '@components/common/context/AppProvider';
import { GoalsProvider, useGoals } from '@components/goals/GoalsProvider';
import { getDescriptor } from '@utility/goals/registry';
import { createGoal, GOALS_STORAGE_KEY } from '@utility/goals/store';
import { resolveGoal } from '@utility/goals/resolve';
import { formatNumber } from '@components/goals/parts/format';
import { MIGRATED_FLAG_KEY } from '@components/goals/useMaterialTrackerMigration';

vi.mock('next/router', () => ({
  useRouter: () => ({ push: vi.fn(), query: {}, isReady: true, pathname: '/tools/material-tracker' })
}));

const MaterialTracker = (await import('../../pages/tools/material-tracker')).default;

const { account, characters } = parseFixture(latest);
const ACCOUNT_KEY = 'uid-test';
const item = getDescriptor('item');
const [first, second] = item.list({ account, characters }).filter((row) => row.displayName === 'Copper_Ore' || row.displayName === 'Iron_Ore');

let api;
const Probe = () => {
  const value = useGoals();
  useEffect(() => {
    api = value;
  });
  return null;
};

const seed = (goals) => localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify({ schema: 1, accounts: { [ACCOUNT_KEY]: goals } }));

const mount = () => render(
  <ThemeProvider theme={darkTheme}>
    <AppContext.Provider value={{ state: { uid: ACCOUNT_KEY, account, characters, isLoading: false }, dispatch: vi.fn() }}>
      <GoalsProvider>
        <Probe/>
        <MaterialTracker/>
      </GoalsProvider>
    </AppContext.Provider>
  </ThemeProvider>
);

const goalList = () => screen.getByRole('list', { name: 'Item goals' });
const rowNames = () => within(goalList()).queryAllByRole('listitem')
  .filter((li) => li.parentElement === goalList())
  .map((li) => li.querySelector('a, p')?.textContent);

describe('material tracker page', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(MIGRATED_FLAG_KEY, 'true');
  });

  it('shows the empty state without item goals', () => {
    mount();
    expect(screen.getByText('Add item goals with the Add goal button')).toBeTruthy();
  });

  it('lists the account item goals', () => {
    seed([
      createGoal({ system: 'item', key: first.rawName, metric: 'quantity', target: 1e15, createdAt: 1 }),
      createGoal({ system: 'item', key: second.rawName, metric: 'quantity', op: '<=', target: 1, createdAt: 2 })
    ]);
    mount();
    expect(rowNames()).toEqual([item.name(first), item.name(second)]);
  });

  it('a watch goal shows the amount alone and a goal note shows under its name', () => {
    const watch = createGoal({ system: 'item', key: first.rawName, metric: 'quantity', target: 0, watch: true, createdAt: 1 });
    seed([watch, createGoal({ system: 'item', key: second.rawName, metric: 'quantity', target: 5, note: 'Keep some for the forge', createdAt: 2 })]);
    mount();
    const [watchRow] = within(goalList()).getAllByRole('listitem');
    expect(within(watchRow).getByText(formatNumber(resolveGoal(watch, { account, characters }).value))).toBeTruthy();
    expect(watchRow.textContent).not.toMatch(/ \/ /);
    expect(screen.getByText('Keep some for the forge')).toBeTruthy();
  });

  it('"Clear all item goals" sits with the goal list and confirms with the count', () => {
    seed([
      createGoal({ system: 'item', key: first.rawName, metric: 'quantity', target: 10, createdAt: 1 }),
      createGoal({ system: 'greenstack', kind: 'all', metric: 'quantity', target: 'max', createdAt: 2 }),
      createGoal({ system: 'bubble', key: 'x', metric: 'level', target: 1, createdAt: 3 })
    ]);
    mount();
    const clear = screen.getByRole('button', { name: 'Clear all item goals' });
    expect(clear.closest('[data-item-goals]')).toBeTruthy();
    fireEvent.click(clear);
    expect(screen.getByText('Remove all 2 item and greenstack goals?')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(api.goals.map(({ system }) => system)).toEqual(['bubble']);
  });

  it('"Track missing greenstacks" adds one greenstack goal, a second click adds nothing', () => {
    mount();
    const button = screen.getByRole('button', { name: 'Track missing greenstacks' });
    fireEvent.click(button);
    expect(screen.getByText('Greenstack goal added')).toBeTruthy();
    fireEvent.click(button);
    expect(screen.getByText('Already tracking your greenstacks')).toBeTruthy();
    expect(api.goals.map(({ system, kind }) => [system, kind])).toEqual([['greenstack', 'all']]);
  });

  it('renders the greenstack goal first and expanded', () => {
    seed([
      createGoal({ system: 'item', key: first.rawName, metric: 'quantity', target: 10, createdAt: 1 }),
      createGoal({ system: 'greenstack', kind: 'all', metric: 'quantity', target: 'max', createdAt: 2 })
    ]);
    mount();
    expect(rowNames()).toEqual(['All greenstacks', item.name(first)]);
    expect(screen.getByRole('list', { name: 'Entries still short' })).toBeTruthy();
  });

  it('"Track my greenstacks" adds watch goals for owned greenstacks when no bounds are typed', () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Track my greenstacks' }));
    const added = api.goals;
    expect(added.length).toBeGreaterThan(0);
    expect(added.every((g) => g.system === 'item' && g.watch === true)).toBe(true);
    expect(screen.getByText(`Added ${added.length} greenstack${added.length === 1 ? '' : 's'}`)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Track my greenstacks' }));
    expect(screen.getByText('All your greenstacks are already tracked')).toBeTruthy();
    expect(api.goals).toHaveLength(added.length);
  });

  it('the note goes on "Track my greenstacks" goals only, never on the greenstack goal', () => {
    mount();
    expect(screen.getByText('Track my greenstacks: one goal per greenstack you own, with the bounds and note above')).toBeTruthy();
    expect(screen.getByText('Track missing greenstacks: one goal for every greenstack you still need')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Note'), { target: { value: 'Keep for the forge' } });
    fireEvent.click(screen.getByRole('button', { name: 'Track missing greenstacks' }));
    expect(api.goals.map(({ system, note }) => [system, note])).toEqual([['greenstack', '']]);
    fireEvent.click(screen.getByRole('button', { name: 'Track my greenstacks' }));
    const items = api.goals.filter(({ system }) => system === 'item');
    expect(items.length).toBeGreaterThan(0);
    expect(items.every(({ note }) => note === 'Keep for the forge')).toBe(true);
  });
});
