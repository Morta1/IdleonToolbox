// @vitest-environment jsdom
import '../../polyfills';
import React, { useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
import { FOLD_NOTICE_KEY, MIGRATED_FLAG_KEY } from '@components/goals/useMaterialTrackerMigration';
import { handleDownload, notateNumber } from '@utility/helpers';

vi.mock('next/router', () => ({
  useRouter: () => ({ push: vi.fn(), query: {}, isReady: true, pathname: '/tools/material-tracker' })
}));
vi.mock('@utility/helpers', async (importOriginal) => ({ ...await importOriginal(), handleDownload: vi.fn() }));

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
  .map((li) => li.querySelector('[data-goal-name]').textContent);

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

  it('renders the greenstack card first, its entries one click away', () => {
    seed([
      createGoal({ system: 'item', key: first.rawName, metric: 'quantity', target: 10, createdAt: 1 }),
      createGoal({ system: 'greenstack', kind: 'all', metric: 'quantity', target: 'max', createdAt: 2 })
    ]);
    mount();
    expect(rowNames()).toEqual(['All greenstacks', item.name(first)]);
    expect(screen.queryByRole('list', { name: 'Entries still short' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /^Closest: | to go ›$/ }));
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
    fireEvent.change(screen.getByLabelText('Note'), { target: { value: 'Keep for the forge' } });
    fireEvent.click(screen.getByRole('button', { name: 'Track missing greenstacks' }));
    expect(api.goals.map(({ system, note }) => [system, note])).toEqual([['greenstack', '']]);
    fireEvent.click(screen.getByRole('button', { name: 'Track my greenstacks' }));
    const items = api.goals.filter(({ system }) => system === 'item');
    expect(items.length).toBeGreaterThan(0);
    expect(items.every(({ note }) => note === 'Keep for the forge')).toBe(true);
  });

  it('the bounds, note and near alert sit with "Track my greenstacks", one line tells item goals from slab goals', () => {
    mount();
    const mine = screen.getByRole('group', { name: 'Track my greenstacks' });
    expect(['Lower bound', 'Upper bound', 'Note'].map((label) => !!within(mine).queryByLabelText(label))).toEqual([true, true, true]);
    expect(within(mine).getByLabelText('Show an alert when value is near the bounds')).toBeTruthy();
    expect(within(mine).getByRole('button', { name: 'Track my greenstacks' })).toBeTruthy();
    const missing = screen.getByRole('group', { name: 'Track missing greenstacks' });
    expect(within(missing).queryByLabelText('Note')).toBeNull();
    expect(within(missing).getByRole('button', { name: 'Track missing greenstacks' })).toBeTruthy();
    // The site's standard contained button, as on the sibling tool pages
    expect(['Track my greenstacks', 'Track missing greenstacks']
      .map((name) => screen.getByRole('button', { name }).className.match(/MuiButton-contained(Primary|Secondary)/)?.[1]))
      .toEqual(['Primary', 'Primary']);
    expect(screen.getByText('Item goals track how many of an item you own. Slab goals, on the Slab page, track which items you have looted.')).toBeTruthy();
  });

  it('a lower and an upper goal on one item are one range row; removing it removes both and Undo restores them', () => {
    const lower = createGoal({ system: 'item', key: first.rawName, metric: 'quantity', target: 500000, createdAt: 1 });
    const upper = createGoal({ system: 'item', key: first.rawName, metric: 'quantity', op: '<=', target: 5000000, createdAt: 2 });
    seed([lower, upper]);
    mount();
    expect(rowNames()).toEqual([item.name(first)]);
    const [row] = within(goalList()).getAllByRole('listitem');
    expect(row.textContent).toContain(`${notateNumber(500000)} - ${notateNumber(5000000)}`);
    fireEvent.click(within(row).getByRole('button', { name: 'Remove goal' }));
    expect(api.goals).toEqual([]);
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(api.goals).toEqual([lower, upper]);
  });

  it('exports the item goals only and imports into item goals', async () => {
    const bubble = createGoal({ system: 'bubble', key: 'x', metric: 'level', target: 1, createdAt: 1 });
    const own = createGoal({ system: 'item', key: first.rawName, metric: 'quantity', target: 10, createdAt: 2 });
    seed([bubble, own]);
    const { container } = mount();
    fireEvent.click(screen.getByRole('button', { name: 'Export item goals' }));
    expect(vi.mocked(handleDownload).mock.calls.at(-1)[0].goals).toEqual([own]);
    const file = { text: () => Promise.resolve(JSON.stringify({ format: 'idleon-toolbox-goals', schema: 1, goals: [bubble, own] })) };
    fireEvent.change(container.querySelector('input[type="file"]'), { target: { files: [file] } });
    expect(await screen.findByText('1 goal: 1 account, 0 character')).toBeTruthy();
    expect(screen.getByLabelText('Replace my item goals')).toBeTruthy();
  });

  describe('greenstack fold notice', () => {
    const folded = getDescriptor('greenstack').list({ account, characters }).map((row) => row.itemRawName)
      .filter((key) => key !== second.rawName).slice(0, 3);
    const tracker = {
      ...Object.fromEntries(folded.map((key) => [key, { item: { rawName: key }, lowerBound: 1e7, upperBound: '', note: '' }])),
      [second.rawName]: { item: { rawName: second.rawName }, lowerBound: 5, upperBound: '', note: '' }
    };
    const migrate = () => {
      localStorage.removeItem(MIGRATED_FLAG_KEY);
      localStorage.setItem('material-tracker', JSON.stringify(tracker));
      return mount();
    };
    const label = '3 greenstack entries merged into All greenstacks';

    it('shows once with the merged count; "Keep as separate goals" swaps the greenstack goal for item goals', async () => {
      const view = migrate();
      expect(await screen.findByText(label)).toBeTruthy();
      expect(api.goals.map(({ system, key }) => key ?? system).sort()).toEqual([second.rawName, 'greenstack'].sort());
      fireEvent.click(screen.getByRole('button', { name: 'Keep as separate goals' }));
      expect(api.goals.filter(({ system }) => system === 'greenstack')).toEqual([]);
      expect(api.goals.filter(({ key }) => folded.includes(key)).map(({ key, op, target }) => [key, op, target]))
        .toEqual(folded.map((key) => [key, '>=', 1e7]));
      expect(api.goals).toHaveLength(folded.length + 1);
      expect(JSON.parse(localStorage.getItem('material-tracker'))).toEqual(tracker);
      await waitFor(() => expect(screen.queryByText(label)).toBeNull());
      expect(screen.getByText(`${folded.length} item goals added`)).toBeTruthy();
      view.unmount();
      mount();
      await act(async () => {});
      expect(screen.queryByText(label)).toBeNull();
    });

    it('closing it keeps the greenstack goal and never shows it again', async () => {
      const view = migrate();
      await screen.findByText(label);
      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      expect(JSON.parse(localStorage.getItem(FOLD_NOTICE_KEY))).toMatchObject({ count: 3, seen: true });
      expect(api.goals.some(({ system }) => system === 'greenstack')).toBe(true);
      view.unmount();
      mount();
      await act(async () => {});
      expect(screen.queryByText(label)).toBeNull();
    });
  });

  it('Undo after "Keep as separate goals" brings the greenstack goal back and drops the item goals', async () => {
    const [row] = getDescriptor('greenstack').list({ account, characters }).filter(({ itemRawName }) => itemRawName !== second.rawName);
    localStorage.removeItem(MIGRATED_FLAG_KEY);
    localStorage.setItem('material-tracker', JSON.stringify({
      [row.itemRawName]: { item: { rawName: row.itemRawName }, lowerBound: 1e7, upperBound: '', note: '' }
    }));
    mount();
    await screen.findByText('1 greenstack entry merged into All greenstacks');
    const merged = api.goals;
    fireEvent.click(screen.getByRole('button', { name: 'Keep as separate goals' }));
    expect(api.goals.map(({ system }) => system)).toEqual(['item']);
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(api.goals).toEqual(merged);
  });

  it('a result notice stacks beside a visible Undo without restarting it', () => {
    seed([createGoal({ system: 'item', key: first.rawName, metric: 'quantity', target: 10, createdAt: 1 })]);
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Remove goal' }));
    const undo = screen.getByRole('button', { name: 'Undo' });
    fireEvent.click(screen.getByRole('button', { name: 'Track missing greenstacks' }));
    expect(screen.getByText('Greenstack goal added')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Undo' })).toBe(undo);
    expect(screen.getByText('Greenstack goal added').closest('.MuiSnackbar-root').parentElement)
      .toBe(undo.closest('.MuiSnackbar-root').parentElement);
  });
});
