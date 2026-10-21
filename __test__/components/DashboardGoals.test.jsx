// @vitest-environment jsdom
import '../../polyfills';
import React, { useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../styles/theme/darkTheme';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { AppContext } from '@components/common/context/AppProvider';
import { GoalsProvider, useGoals } from '@components/goals/GoalsProvider';
import Goals from '@components/dashboard/goals/Goals';
import { getDescriptor } from '@utility/goals/registry';
import { resolveGoal } from '@utility/goals/resolve';
import { formatNumber } from '@components/goals/parts/format';
import { createGoal, GOALS_STORAGE_KEY } from '@utility/goals/store';

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
const item = getDescriptor('item');
// Owned but short of 500K, so a 500K - 5M range stays open
const ownedItem = item.list(ctx).find((row) => {
  const quantity = item.metrics.quantity.value(row, ctx);
  return quantity > 0 && quantity < 5e5;
});

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

const levelledStamp = stamp.list(ctx).find((row) => row.level > 0);

const grid = () => screen.getByRole('list', { name: 'Goals' });
const cards = (list = grid()) => within(list).queryAllByRole('listitem').filter((li) => li.parentElement === list);
const cardNames = (list) => cards(list).map((li) => li.querySelector('[data-goal-name]').textContent);
// The big amount and the target beside it
const cardValue = (card) => [card.querySelector('[data-goal-value]').textContent, card.querySelector('[data-goal-target]')?.textContent ?? ''];
const chip = (name) => screen.getByRole('button', { name });
const expandedNames = () => within(screen.getByRole('list', { name: 'Entries still short' }))
  .getAllByRole('listitem').map((li) => li.querySelector('[data-entry-name]').textContent);

describe('Dashboard goals', () => {
  beforeEach(() => localStorage.clear());

  it('the header counts goals and reached ones, with Export and Import', async () => {
    seed(reachedGoal(), openGoal());
    mount();
    expect(await screen.findByText('2 goals · 1 reached')).toBeTruthy();
    expect(['Export', 'Import'].map((name) => !!screen.queryByRole('button', { name }))).toEqual([true, true]);
  });

  it('an entry card shows its name, label, the amount you have, the target beside it and a 4px bar', async () => {
    const open = openGoal();
    seed(open);
    mount();
    const view = resolveGoal(open, ctx);
    await screen.findByText(view.name);
    const [card] = cards();
    expect(card.querySelector('[data-goal-label]').textContent).toBe('Bubble');
    expect(cardValue(card)).toEqual([`Lv ${formatNumber(view.value)}`, `of ${formatNumber(view.targetValue)}`]);
    expect(getComputedStyle(within(card).getByRole('progressbar')).height).toBe('4px');
  });

  it('a lower and an upper item goal on one entry render one range card', async () => {
    const key = item.key(ownedItem);
    seed(
      goal({ system: 'item', key, metric: 'quantity', target: 5e5 }),
      goal({ system: 'item', key, metric: 'quantity', op: '<=', target: 5e6 })
    );
    mount();
    await screen.findByText('1 goal · 0 reached');
    expect(cards()).toHaveLength(1);
    expect(cardValue(cards()[0])[1]).toBe('of 500K - 5M');
  });

  it('an all card shows met of total, what each entry needs, and links its closest entries', async () => {
    const all = allGoal();
    seed(all);
    mount();
    const view = resolveGoal(all, ctx);
    await screen.findByText(view.name);
    const [card] = cards();
    expect(cardValue(card)).toEqual([formatNumber(view.met), `of ${formatNumber(view.total)}`]);
    expect(card.querySelector('[data-goal-label]').textContent).toBe('Bubbles · At least Lv 1,000,000,000');
    const names = view.closest.slice(0, 3).map(({ name }) => name).join(', ');
    expect(within(card).getByRole('button', { name: `Closest: ${names} ›` })).toBeTruthy();
  });

  it('a missing goal is a dimmed card with No longer exists and a Remove button only', async () => {
    seed(goal({ key: 'no-such-bubble', target: 5 }));
    mount();
    await screen.findByText('No longer exists');
    const [card] = cards();
    expect(getComputedStyle(card).opacity).toBe('0.6');
    expect(screen.queryByText('no-such-bubble')).toBeNull();
    expect(within(card).getAllByRole('button').map((b) => b.textContent)).toEqual(['Remove']);
    expect(screen.queryByRole('link')).toBeNull();
    fireEvent.click(within(card).getByRole('button', { name: 'Remove' }));
    expect(api.goals).toEqual([]);
  });

  it('system chips filter the cards and All brings every goal back', async () => {
    seed(openGoal(), goal({ key: bubble.key(levelled[2]), target: levelled[2].level + 1000 }),
      goal({ system: 'stamp', key: stamp.key(levelledStamp), target: levelledStamp.level * 10 }));
    mount();
    await screen.findByText('3 goals · 0 reached');
    expect(chip('All 3').getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(chip('Stamps 1'));
    expect(cardNames()).toEqual([stamp.name(levelledStamp)]);
    expect(chip('Stamps 1').getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(chip('Bubbles 2'));
    expect(cardNames()).toHaveLength(2);
    fireEvent.click(chip('All 3'));
    expect(cardNames()).toHaveLength(3);
  });

  it('sorts closest first by default, then recently added or by system, and remembers the sort', async () => {
    const [a, b] = levelled.slice(1);
    const quarter = goal({ key: bubble.key(a), target: a.level * 4 });
    const tenth = goal({ system: 'stamp', key: stamp.key(levelledStamp), target: levelledStamp.level * 10 });
    const half = goal({ key: bubble.key(b), target: b.level * 2 });
    seed(quarter, tenth, half);
    const first = mount();
    await screen.findByText('3 goals · 0 reached');
    const [quarterName, tenthName, halfName] = [bubble.name(a), stamp.name(levelledStamp), bubble.name(b)];
    expect(cardNames()).toEqual([halfName, quarterName, tenthName]);
    const sortBy = (current, next) => {
      fireEvent.click(chip(current));
      fireEvent.click(screen.getByRole('menuitem', { name: next }));
    };
    sortBy('Closest first', 'Recently added');
    expect(cardNames()).toEqual([halfName, tenthName, quarterName]);
    sortBy('Recently added', 'System');
    expect(cardNames()).toEqual([quarterName, halfName, tenthName]);
    first.unmount();
    mount();
    expect(await screen.findByRole('button', { name: 'System' })).toBeTruthy();
  });

  it('reached goals wait in a collapsed Reached strip with Clear reached', async () => {
    seed(reachedGoal(), openGoal());
    mount();
    const strip = await screen.findByRole('button', { name: 'Reached (1)' });
    expect(cardNames()).toEqual([bubble.name(levelled[1])]);
    expect(strip.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('list', { name: 'Reached goals' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Clear reached' })).toBeTruthy();
    fireEvent.click(strip);
    expect(cardNames(screen.getByRole('list', { name: 'Reached goals' }))).toEqual([bubble.name(levelled[0])]);
  });

  it.each([
    ['Remove', () => fireEvent.click(within(cards()[0]).getByRole('button', { name: 'Remove goal' })), 'Goal removed'],
    ['Clear reached', () => fireEvent.click(screen.getByRole('button', { name: 'Clear reached' })), '1 reached goal cleared']
  ])('%s offers Undo that restores the same goals', async (_, act, label) => {
    const open = openGoal();
    const reached = reachedGoal();
    seed(open, reached);
    mount();
    await screen.findByText(/^2 goals/);
    act();
    expect(api.goals).toHaveLength(1);
    const notice = await screen.findByRole('status');
    expect(within(notice).getByText(label)).toBeTruthy();
    fireEvent.click(within(notice).getByRole('button', { name: 'Undo' }));
    expect([...api.goals].sort((x, y) => x.createdAt - y.createdAt)).toEqual([open, reached]);
  });

  it('on a touch screen the card actions sit in a tap menu', async () => {
    seed(openGoal());
    mount();
    await screen.findByText(bubble.name(levelled[1]));
    // Shown by a (hover: none) media query, which jsdom does not match, so it is found by its label
    const menuButton = cards()[0].querySelector('button[aria-label="Goal actions"]');
    expect(getComputedStyle(menuButton).display).toBe('none');
    fireEvent.click(menuButton);
    expect(screen.getAllByRole('menuitem').map((m) => m.textContent)).toEqual(['Edit', 'Open Bubbles page', 'Remove']);
    expect(screen.getByRole('menuitem', { name: 'Open Bubbles page' }).getAttribute('href')).toBe(`${bubble.route}?demo=true`);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Remove' }));
    expect(api.goals).toEqual([]);
  });

  it('removing a range card removes both goals, and Undo brings both back', async () => {
    const key = item.key(ownedItem);
    const lower = goal({ system: 'item', key, metric: 'quantity', target: 5e5 });
    const upper = goal({ system: 'item', key, metric: 'quantity', op: '<=', target: 5e6 });
    seed(lower, upper);
    mount();
    fireEvent.click(await screen.findByRole('button', { name: 'Remove goal' }));
    expect(api.goals).toEqual([]);
    fireEvent.click(within(await screen.findByRole('status')).getByRole('button', { name: 'Undo' }));
    expect([...api.goals].sort((x, y) => x.createdAt - y.createdAt)).toEqual([lower, upper]);
  });

  it('a range card edits either of its goals from the Edit menu', async () => {
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
    expect([...api.goals].sort((x, y) => x.createdAt - y.createdAt)).toEqual([open, reachedA, reachedB]);
  });

  it('Goals is the first dashboard section and toggle', () => {
    seed(openGoal());
    const { container } = mount({}, <Dashboard/>);
    expect(within(screen.getByRole('group')).getAllByRole('button').map((b) => b.textContent))
      .toEqual(['Goals', 'Account', 'Characters', 'Timers']);
    const sections = [...container.querySelectorAll('[data-section]')].map((el) => el.getAttribute('data-section'));
    expect(sections).toEqual(['goals', 'account', 'characters', 'timers']);
  });

  it('the open page action keeps the demo query', async () => {
    seed(openGoal());
    mount();
    const link = await screen.findByRole('link', { name: 'Open Bubbles page' });
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

  it('the closest link opens every unmet entry in a dialog, with search and paging', async () => {
    const all = allGoal();
    seed(all);
    mount();
    const view = resolveGoal(all, ctx);
    expect(view.shortCount).toBeGreaterThan(100);
    expect(screen.queryByRole('list', { name: 'Entries still short' })).toBeNull();
    fireEvent.click(await screen.findByRole('button', { name: /^Closest: / }));
    const dialog = screen.getByRole('dialog', { name: view.name });
    expect(expandedNames()).toEqual(view.short.slice(0, 50).map(({ name }) => name));
    const list = screen.getByRole('list', { name: 'Entries still short' });
    expect(getComputedStyle(list).overflowY).toBe('auto');
    expect(within(dialog).getByRole('link', { name: 'Full list on the Bubbles page' }).getAttribute('href'))
      .toBe(`${bubble.route}?demo=true`);

    const query = view.short[0].name.slice(0, 3).toLowerCase();
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Search' }), { target: { value: query } });
    expect(expandedNames()).toEqual(view.short.filter(({ name }) => name.toLowerCase().includes(query))
      .slice(0, 50).map(({ name }) => name));
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Search' }), { target: { value: '' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Show 50 more' }));
    expect(expandedNames()).toEqual(view.short.slice(0, 100).map(({ name }) => name));

    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('list', { name: 'Entries still short' })).toBeNull());
  });

  it('promoting an entry from the expanded list creates its own goal', async () => {
    const all = allGoal();
    seed(all);
    mount();
    const view = resolveGoal(all, ctx);
    fireEvent.click(await screen.findByRole('button', { name: /^Closest: / }));
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
    // Saving the entry goal keeps the list open
    const list = screen.getByRole('list', { name: 'Entries still short' });
    expect(within(within(list).getAllByRole('listitem').find((li) => li.querySelector('[data-entry-name]').textContent === view.short[0].name))
      .getByRole('button', { name: `Set goal for ${view.short[0].name}` }).className).toMatch(/colorPrimary/);
  });

  it('an all slab goal lists its entries without a single-item goal button', async () => {
    const slab = createGoal({ system: 'slab', kind: 'all', metric: 'obtained', target: 1 });
    seed(slab);
    mount();
    fireEvent.click(await screen.findByRole('button', { name: / to go ›$/ }));
    const entries = within(screen.getByRole('list', { name: 'Entries still short' })).getAllByRole('listitem');
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.flatMap((li) => within(li).queryAllByRole('button'))).toEqual([]);
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
