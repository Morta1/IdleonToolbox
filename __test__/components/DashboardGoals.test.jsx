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
import Goals from '@components/dashboard/goals/Goals';
import { getDescriptor } from '@utility/goals/registry';
import { closestGoal, resolveGoal, resolveGoals } from '@utility/goals/resolve';
import { formatNumber, goalName, statusText } from '@components/goals/parts/format';
import { createGoal, GOALS_STORAGE_KEY } from '@utility/goals/store';
import { notateProgress } from '@utility/helpers';

vi.mock('next/router', () => ({
  useRouter: () => ({ push: vi.fn(), query: { demo: 'true', t: 'tab' }, isReady: true, pathname: '/dashboard' })
}));
// The dashboard's other sections need a full alert config; the filter test only needs the toggles.
vi.mock('@components/dashboard/Account', () => ({ default: () => <section data-section="account"/> }));
vi.mock('@components/dashboard/Characters', () => ({ default: () => <section data-section="characters"/> }));
vi.mock('@components/dashboard/Etc', () => ({ default: () => <section data-section="timers"/> }));
vi.mock('@components/common/DashboardSettings', () => ({ default: () => null }));
vi.mock('@components/dashboard/settings/AlertQuickEdit', () => ({ default: () => null }));

const Dashboard = (await import('../../pages/dashboard')).default;

const { account, characters } = parseFixture(latest);
const ctx = { account, characters };
const ACCOUNT_KEY = 'uid-test';
const bubble = getDescriptor('bubble');
const stamp = getDescriptor('stamp');
const bubbleRows = bubble.list(ctx);
const levelled = bubbleRows.filter((row) => row.level > 0);
const stampRow = stamp.list(ctx)[0];
const item = getDescriptor('item');
const ownedItem = item.list(ctx).find((row) => item.metrics.quantity.value(row, ctx) > 0);

let api;
const Probe = () => {
  const value = useGoals();
  useEffect(() => {
    api = value;
  });
  return null;
};

const mount = (state = {}, ui = <Goals/>) => render(
  <ThemeProvider theme={darkTheme}>
    <AppContext.Provider value={{ state: { uid: ACCOUNT_KEY, account, characters, ...state }, dispatch: vi.fn() }}>
      <GoalsProvider>
        <Probe/>
        {ui}
      </GoalsProvider>
    </AppContext.Provider>
  </ThemeProvider>
);

let createdAt = 1;
const goal = (fields) => createGoal({ system: 'bubble', metric: 'level', createdAt: createdAt++, ...fields });
const seed = (...goals) => localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify({
  schema: 1,
  accounts: { [ACCOUNT_KEY]: goals }
}));

const reachedGoal = () => goal({ key: bubble.key(levelled[0]), target: 1 });
const openGoal = () => goal({ key: bubble.key(levelled[1]), target: levelled[1].level + 1000 });
// Every bubble is short of this, so the expanded list holds the whole catalog
const allGoal = () => goal({ kind: 'all', target: 1e9 });

const rows = (container) => [...container.querySelectorAll('[data-goal-status]')];
const expandedNames = () => within(screen.getByRole('list', { name: 'Entries still short' }))
  .getAllByRole('listitem').map((li) => li.querySelector('[data-entry-name]').textContent);

describe('Dashboard goals', () => {
  beforeEach(() => localStorage.clear());

  it('groups rows by system in registry order', async () => {
    seed(goal({ system: 'stamp', key: stamp.key(stampRow), target: 1e6 }), openGoal());
    mount();
    await screen.findByText(stamp.name(stampRow));
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['Bubbles', 'Stamps']);
  });

  it('reached goals sort after open goals, and the summary strip counts them and names the closest', async () => {
    const reached = reachedGoal();
    const open = openGoal();
    seed(reached, open);
    const { container } = mount();
    const near = closestGoal(resolveGoals([reached, open], ctx));
    await screen.findByText(`2 goals · 1 reached · closest: ${goalName(near)} ${Math.floor(near.progress * 100)}%`);
    expect(rows(container).map((row) => row.getAttribute('data-goal-status'))).toEqual(['ok', 'reached']);
  });

  it('rows state direction and unit, with a 4px bar and a percent', async () => {
    const open = openGoal();
    seed(open);
    const { container } = mount();
    const view = resolveGoal(open, ctx);
    const [row] = rows(container);
    expect(await within(row).findByText(statusText(view))).toBeTruthy();
    expect(statusText(view)).toBe(`At least Lv ${formatNumber(view.targetValue)} · ${formatNumber(view.value)}`);
    expect(within(row).getByText(`${Math.floor(view.progress * 100)}%`)).toBeTruthy();
    expect(getComputedStyle(within(row).getByRole('progressbar')).height).toBe('4px');
  });

  it('a lower and an upper item goal on one entry render one range row', async () => {
    const key = item.key(ownedItem);
    seed(
      goal({ system: 'item', key, metric: 'quantity', target: 5e5 }),
      goal({ system: 'item', key, metric: 'quantity', op: '<=', target: 5e6 })
    );
    const { container } = mount();
    await screen.findByText(new RegExp(`^500K - 5M · `));
    expect(rows(container)).toHaveLength(1);
  });

  it.each([
    ['Remove', (container) => fireEvent.click(within(rows(container)[0]).getByRole('button', { name: 'Remove goal' })), 'Goal removed'],
    ['Clear reached', () => fireEvent.click(screen.getByRole('button', { name: 'Clear reached' })), '1 reached goal cleared']
  ])('%s offers Undo that restores the same goals', async (_, act, label) => {
    const open = openGoal();
    const reached = reachedGoal();
    seed(open, reached);
    const { container } = mount();
    await screen.findByText(/^2 goals/);
    act(container);
    expect(api.goals).toHaveLength(1);
    const notice = await screen.findByRole('status');
    expect(within(notice).getByText(label)).toBeTruthy();
    fireEvent.click(within(notice).getByRole('button', { name: 'Undo' }));
    expect([...api.goals].sort((a, b) => a.createdAt - b.createdAt)).toEqual([open, reached]);
  });

  it('removing a range row removes both goals, and Undo brings both back', async () => {
    const key = item.key(ownedItem);
    const lower = goal({ system: 'item', key, metric: 'quantity', target: 5e5 });
    const upper = goal({ system: 'item', key, metric: 'quantity', op: '<=', target: 5e6 });
    seed(lower, upper);
    mount();
    fireEvent.click(await screen.findByRole('button', { name: 'Remove goal' }));
    expect(api.goals).toEqual([]);
    fireEvent.click(within(await screen.findByRole('status')).getByRole('button', { name: 'Undo' }));
    expect([...api.goals].sort((a, b) => a.createdAt - b.createdAt)).toEqual([lower, upper]);
  });

  it('a range row edits either of its goals from the Edit menu', async () => {
    const key = item.key(ownedItem);
    const lower = goal({ system: 'item', key, metric: 'quantity', target: 5e5 });
    const upper = goal({ system: 'item', key, metric: 'quantity', op: '<=', target: 5e6 });
    seed(lower, upper);
    mount();
    for (const [label, target] of [['At least 500K', '500000'], ['At most 5M', '5000000']]) {
      fireEvent.click(await screen.findByRole('button', { name: 'Edit goal' }));
      expect(screen.getAllByRole('menuitem').map((m) => m.textContent)).toEqual(['At least 500K', 'At most 5M']);
      fireEvent.click(screen.getByRole('menuitem', { name: label }));
      expect((await screen.findByLabelText(/^Target/)).value).toBe(target);
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    }
  });

  it('Clear reached removes every reached goal and one Undo brings them all back', async () => {
    const open = openGoal();
    const reachedA = goal({ key: bubble.key(levelled[0]), target: 1 });
    const reachedB = goal({ key: bubble.key(levelled[2]), target: 1 });
    seed(open, reachedA, reachedB);
    mount();
    fireEvent.click(await screen.findByRole('button', { name: 'Clear reached' }));
    expect(api.goals).toEqual([open]);
    const notice = await screen.findByRole('status');
    expect(within(notice).getByText('2 reached goals cleared')).toBeTruthy();
    fireEvent.click(within(notice).getByRole('button', { name: 'Undo' }));
    expect([...api.goals].sort((a, b) => a.createdAt - b.createdAt)).toEqual([open, reachedA, reachedB]);
  });

  it('Goals is the first dashboard section and toggle', () => {
    seed(openGoal());
    const { container } = mount({}, <Dashboard/>);
    expect(within(screen.getByRole('group')).getAllByRole('button').map((b) => b.textContent))
      .toEqual(['Goals', 'Account', 'Characters', 'Timers']);
    const sections = [...container.querySelectorAll('[data-section]')].map((el) => el.getAttribute('data-section'));
    expect(sections).toEqual(['goals', 'account', 'characters', 'timers']);
  });

  it('missing goals show No longer exists and only a remove action', async () => {
    seed(goal({ key: 'no-such-bubble', target: 5 }));
    mount();
    await screen.findByText('No longer exists');
    expect(screen.queryByText('no-such-bubble')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Edit goal' })).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Remove goal' }));
    expect(api.goals).toEqual([]);
  });

  it('Clear reached removes only reached goals', async () => {
    const open = openGoal();
    seed(reachedGoal(), open);
    mount();
    fireEvent.click(await screen.findByRole('button', { name: 'Clear reached' }));
    expect(api.goals).toEqual([open]);
  });

  it('a reached all row with nothing to expand still links its page', async () => {
    const reachedAll = goal({ kind: 'all', target: 0 });
    seed(reachedAll);
    mount();
    const view = resolveGoal(reachedAll, ctx);
    expect(view.status).toBe('reached');
    const link = await screen.findByRole('link', { name: view.name });
    expect(link.getAttribute('href')).toBe(`${bubble.route}?demo=true`);
    expect(screen.queryByRole('button', { name: 'Expand' })).toBeNull();
  });

  it('row links keep the demo query', async () => {
    seed(openGoal());
    mount();
    const link = await screen.findByRole('link', { name: bubble.name(levelled[1]) });
    expect(link.getAttribute('href')).toBe(`${bubble.route}?demo=true`);
  });

  it('the empty state links a few goal pages and keeps the demo query', () => {
    mount();
    expect(screen.getByText('Add goals from any page with the Add goal button')).toBeTruthy();
    const links = screen.getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual(['Bubbles', 'Stamps', 'Talents', 'Material tracker', 'Grimoire']);
    for (const link of links) expect(link.getAttribute('href')).toMatch(/\?demo=true$/);
  });

  it('renders nothing on a profile view', () => {
    seed(openGoal());
    const { container } = mount({ profile: true });
    expect(container.textContent).toBe('');
  });

  it('hiding the Goals filter survives a remount', () => {
    // A user from before goals: a saved filter list and no flag gets Goals added once
    localStorage.setItem('dashboard-filters', JSON.stringify(['account', 'characters', 'timers']));
    const first = mount({}, <Dashboard/>);
    const toggle = () => screen.getByRole('button', { name: 'Goals' });
    expect(toggle().getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(toggle());
    expect(toggle().getAttribute('aria-pressed')).toBe('false');
    first.unmount();
    mount({}, <Dashboard/>);
    expect(toggle().getAttribute('aria-pressed')).toBe('false');
    expect(JSON.parse(localStorage.getItem('dashboard-filters'))).toEqual(['account', 'characters', 'timers']);
  });

  it('an all-bubbles goal collapses to 5 closest and expands to every unmet bubble', async () => {
    const all = allGoal();
    seed(all);
    mount();
    const view = resolveGoal(all, ctx);
    expect(view.shortCount).toBeGreaterThan(50);
    const closest = view.closest.slice(0, 5).map(({ name, value }) => `${name} ${notateProgress(value)}`).join(', ');
    expect(await screen.findByText(`Closest: ${closest} · and ${view.shortCount - 5} more`)).toBeTruthy();
    expect(screen.queryByRole('list', { name: 'Entries still short' })).toBeNull();
    // The name of a group row expands it rather than leaving for the page
    expect(screen.queryByRole('link', { name: view.name })).toBeNull();

    fireEvent.click(screen.getByText(view.name));
    expect(expandedNames()).toEqual(view.short.slice(0, 50).map(({ name }) => name));
    const list = screen.getByRole('list', { name: 'Entries still short' });
    expect(getComputedStyle(list).overflowY).toBe('auto');
    expect(getComputedStyle(list).maxHeight).toBe('360px');
    expect(screen.getByRole('link', { name: 'Full list on the Bubbles page' }).getAttribute('href'))
      .toBe(`${bubble.route}?demo=true`);

    fireEvent.click(screen.getByRole('button', { name: 'Collapse' }));
    expect(screen.queryByRole('list', { name: 'Entries still short' })).toBeNull();
  });

  it('expanded search filters entries by name and Show 50 more pages through', async () => {
    const all = allGoal();
    seed(all);
    mount();
    const view = resolveGoal(all, ctx);
    fireEvent.click(await screen.findByRole('button', { name: 'Expand' }));

    const query = view.short[0].name.slice(0, 3).toLowerCase();
    fireEvent.change(screen.getByRole('textbox', { name: 'Search' }), { target: { value: query } });
    expect(expandedNames()).toEqual(view.short.filter(({ name }) => name.toLowerCase().includes(query))
      .slice(0, 50).map(({ name }) => name));

    fireEvent.change(screen.getByRole('textbox', { name: 'Search' }), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Show 50 more' }));
    expect(expandedNames()).toEqual(view.short.slice(0, 100).map(({ name }) => name));
  });

  it('promoting an entry from the expanded list creates its own goal', async () => {
    const all = allGoal();
    seed(all);
    mount();
    const view = resolveGoal(all, ctx);
    fireEvent.click(await screen.findByRole('button', { name: 'Expand' }));
    const first = within(screen.getByRole('list', { name: 'Entries still short' })).getAllByRole('listitem')[0];
    const promote = within(first).getByRole('button', { name: `Set goal for ${view.short[0].name}` });
    expect(promote.className).not.toMatch(/colorPrimary/);
    fireEvent.click(promote);
    fireEvent.change(await screen.findByLabelText(/^Target/), { target: { value: '5000' } });
    // The entry is already picked, so the popover is locked to it: no system select, no applies-to toggle
    expect(screen.queryByLabelText('System')).toBeNull();
    expect(['One', 'All', 'By category'].map((name) => screen.queryByRole('button', { name }))).toEqual([null, null, null]);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(api.goals).toMatchObject([
      { id: all.id },
      { kind: 'entry', system: 'bubble', key: view.short[0].key, target: 5000 }
    ]);
    // The click on the promote icon must not have collapsed the row
    expect(screen.getByRole('list', { name: 'Entries still short' })).toBeTruthy();
    expect(within(screen.getAllByRole('listitem').find((li) => li.querySelector('[data-entry-name]')?.textContent === view.short[0].name))
      .getByRole('button', { name: `Set goal for ${view.short[0].name}` }).className).toMatch(/colorPrimary/);
  });

  it('an all slab goal lists its entries without a single-item goal button', async () => {
    const slab = createGoal({ system: 'slab', kind: 'all', metric: 'obtained', target: 1 });
    seed(slab);
    mount();
    fireEvent.click(await screen.findByRole('button', { name: 'Expand' }));
    const rows = within(screen.getByRole('list', { name: 'Entries still short' })).getAllByRole('listitem');
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.flatMap((li) => within(li).queryAllByRole('button'))).toEqual([]);
  });

  it('shows the greenstack fold notice after the migration merged tracker entries', async () => {
    const greenstack = getDescriptor('greenstack');
    const [row] = greenstack.list(ctx);
    localStorage.setItem('material-tracker', JSON.stringify({
      [row.itemRawName]: { item: { rawName: row.itemRawName }, lowerBound: 1e7, upperBound: '', note: '' }
    }));
    mount();
    expect(await screen.findByText('1 greenstack entry merged into All greenstacks')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Keep as separate goals' })).toBeTruthy();
  });
});
