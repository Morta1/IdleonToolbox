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
import { getDescriptor, getDescriptors } from '@utility/goals/registry';
import { resolveGoal } from '@utility/goals/resolve';
import { formatNumber, progressPercent } from '@components/goals/parts/format';
import { getCoinsArray, notateNumber } from '@utility/helpers';
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

const bribe = getDescriptor('bribe');
const bribeRows = bribe.list(ctx);
const unboughtBribe = bribeRows.find((row) => !row.done);
// Every fixture can afford its unbought bribe, so the purse is set below its price
const purse = Math.floor(unboughtBribe.price / 3);
const shortOfCoins = { account: { ...account, currencies: { ...account.currencies, rawMoney: purse } } };
const boughtBribe = bribeRows.find((row) => row.done);
const bribeGoal = (row) => goal({ system: 'bribe', key: bribe.key(row), metric: 'purchased', target: 1 });

const grid = (name = 'Goals') => screen.getByRole('list', { name });
const rows = (list = grid()) => within(list).queryAllByRole('listitem').filter((li) => li.parentElement === list);
const rowNames = (list) => rows(list).map((li) => li.querySelector('[data-goal-name]').textContent);
// The value slot, its caption and the percent (or tier step) beside the bar
const rowText = (row) => ['[data-goal-value]', '[data-goal-caption]', '[data-goal-aside]']
  .map((sel) => row.querySelector(sel)?.textContent ?? '');
const openRow = (row) => fireEvent.click(row.querySelector('[data-goal-row]'));
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

  it('an entry row: name, the value, a 4px bar and the percent in one 38px line', async () => {
    const open = openGoal();
    seed(open);
    mount();
    const view = resolveGoal(open, ctx);
    await screen.findByText(view.name);
    const [row] = rows();
    expect(rowText(row)).toEqual([`Lv ${formatNumber(view.value)} of ${formatNumber(view.targetValue)}`, '', progressPercent(view)]);
    expect(getComputedStyle(row.querySelector('[data-goal-row]')).height).toBe('38px');
    expect(getComputedStyle(within(row).getByRole('progressbar', { name: view.name })).height).toBe('4px');
  });

  it('a row keyboard focus draws an outline', async () => {
    seed(openGoal());
    mount();
    const [row] = rows(await screen.findByRole('list', { name: 'Goals' }));
    const button = row.querySelector('[data-goal-row]');
    button.classList.add('Mui-focusVisible');
    expect(getComputedStyle(button).outlineStyle).toBe('solid');
  });

  it('a lower and an upper item goal on one entry render one range row', async () => {
    const key = item.key(ownedItem);
    seed(
      goal({ system: 'item', key, metric: 'quantity', target: 5e5 }),
      goal({ system: 'item', key, metric: 'quantity', op: '<=', target: 5e6 })
    );
    mount();
    await screen.findByText('1 goal · 0 reached');
    expect(rows()).toHaveLength(1);
    expect(rowText(rows()[0])[0]).toMatch(/ of 500K - 5M$/);
  });

  it('an all row says what each entry needs in its name and counts entries done; the next one waits for the open row', async () => {
    const all = allGoal();
    seed(all);
    mount();
    const view = resolveGoal(all, ctx);
    const [row] = rows(await screen.findByRole('list', { name: 'Goals' }));
    const [next] = view.short;
    expect(row.querySelector('[data-goal-name]').textContent).toBe('All bubbles at least Lv 1,000,000,000');
    expect(rowText(row)).toEqual([`${formatNumber(view.met)} of ${formatNumber(view.total)} done`, '',
      progressPercent(view)]);
    expect(within(row).queryByText(next.name, { exact: false })).toBeNull();
    openRow(row);
    expect(within(row).getAllByText(next.name, { exact: false }).length).toBeGreaterThan(0);
  });

  it('a bribe row counts your coins toward its price in coin icons; a bought one reads Bought', async () => {
    seed(bribeGoal(unboughtBribe), bribeGoal(boughtBribe));
    mount(shortOfCoins);
    const view = resolveGoal(bribeGoal(unboughtBribe), { ...ctx, ...shortOfCoins });
    const [row] = rows(await screen.findByRole('list', { name: 'Goals' }));
    const [have] = getCoinsArray(purse);
    const [price] = getCoinsArray(unboughtBribe.price);
    // Read aloud as words; drawn as the top coin tier of each
    expect(within(row).getByText(`${notateNumber(purse)} of ${notateNumber(unboughtBribe.price)} coins`)).toBeTruthy();
    const coins = row.querySelector('[data-goal-cost]');
    expect([...coins.querySelectorAll('img')].map((img) => img.getAttribute('src').replace(/^.*\//, '')))
      .toEqual([`Coins${have[0]}.png`, `Coins${price[0]}.png`]);
    expect(coins.textContent).toBe(`${have[1]}of${price[1]}`);
    expect([rowText(row)[2], view.progress]).toEqual([progressPercent(view), purse / unboughtBribe.price]);
    fireEvent.click(screen.getByRole('button', { name: 'Reached (1)' }));
    const [bought] = rows(grid('Reached goals'));
    expect(rowText(bought)).toEqual(['Bought', '', '']);
    expect(within(bought).getByRole('img', { name: 'Reached' })).toBeTruthy();
  });

  it('a bribe you can afford reads Can buy now beside its price coin, with a full ready bar and no percent', async () => {
    seed(bribeGoal(unboughtBribe));
    const purse = unboughtBribe.price * 2;
    mount({ account: { ...account, currencies: { ...account.currencies, rawMoney: purse } } });
    const [row] = rows(await screen.findByRole('list', { name: 'Goals' }));
    const [price] = getCoinsArray(unboughtBribe.price);
    const coins = row.querySelector('[data-goal-cost]');
    expect([...coins.querySelectorAll('img')].map((img) => img.getAttribute('src').replace(/^.*\//, '')))
      .toEqual([`Coins${price[0]}.png`]);
    expect(coins.textContent).toBe(String(price[1]));
    expect(within(row).getByText('Can buy now')).toBeTruthy();
    expect(row.querySelector('[data-goal-value]').textContent).not.toMatch(/ of /);
    expect([rowText(row)[2], within(row).getByRole('progressbar').getAttribute('aria-valuenow')]).toEqual(['', '100']);
  });

  it('the entries of an all bribes goal draw their prices in coins', async () => {
    seed(goal({ system: 'bribe', kind: 'all', metric: 'purchased', target: 1 }));
    mount(shortOfCoins);
    const [row] = rows(await screen.findByRole('list', { name: 'Goals' }));
    openRow(row);
    const entries = within(screen.getByRole('list', { name: 'Entries still short' })).getAllByRole('listitem');
    expect(entries.every((li) => li.querySelector('[data-goal-cost] img'))).toBe(true);
  });

  it('a yes/no goal without a price reads by its verb, with no bar', async () => {
    const armorSet = getDescriptor('armorSet');
    const locked = armorSet.list(ctx).find((row) => !row.unlocked);
    seed(goal({ system: 'armorSet', key: armorSet.key(locked), metric: 'unlocked', target: 1 }));
    mount();
    const [row] = rows(await screen.findByRole('list', { name: 'Goals' }));
    expect(rowText(row)).toEqual(['Not unlocked yet', '', '']);
    expect(within(row).queryByRole('progressbar')).toBeNull();
  });

  it('a tier row shows the current tier and its step; the goal tier waits for the open row', async () => {
    const artifact = getDescriptor('artifact');
    const { tiers } = artifact.metrics.tier;
    const row = artifact.list(ctx).find((r) => artifact.metrics.tier.value(r, ctx) >= 1
      && artifact.metrics.tier.value(r, ctx) < tiers.length - 1);
    const current = artifact.metrics.tier.value(row, ctx);
    seed(goal({ system: 'artifact', key: artifact.key(row), metric: 'tier', target: current + 1 }));
    mount();
    await screen.findByText(artifact.name(row));
    const bare = (name) => name.replace(/^Tier \d+:\s*/, '');
    expect(bare(tiers[current])).not.toBe(tiers[current]);
    expect(rowText(rows()[0])).toEqual([bare(tiers[current]), '', `${current}/${current + 1}`]);
  });

  it('a missing goal is a dimmed row with No longer in the game and Remove, without opening', async () => {
    seed(goal({ key: 'no-such-bubble', target: 5 }));
    mount();
    await screen.findByText('No longer in the game');
    const [row] = rows();
    expect(getComputedStyle(row).opacity).toBe('0.6');
    expect(screen.queryByText('no-such-bubble')).toBeNull();
    expect(within(row).getAllByRole('button').map((b) => b.textContent)).toEqual(['Remove']);
    // a phone gets a 40px target around the one-line button
    expect(getComputedStyle(within(row).getByRole('button', { name: 'Remove' })).minHeight).toBe('40px');
    expect(screen.queryByRole('link')).toBeNull();
    fireEvent.click(within(row).getByRole('button', { name: 'Remove' }));
    expect(api.goals).toEqual([]);
  });

  it('a goal whose target no longer applies keeps its name and shows Edit and Remove, without opening', async () => {
    const manaStamp = stamp.list(ctx).find((row) => stamp.name(row) === 'Mana Stamp');
    const stale = goal({ system: 'stamp', key: stamp.key(manaStamp), target: 'max' });
    seed(stale);
    mount();
    const [row] = rows(await screen.findByRole('list', { name: 'Goals' }));
    expect(['[data-goal-name]', '[data-goal-value]', '[data-goal-caption]'].map((sel) => row.querySelector(sel).textContent))
      .toEqual(['Mana Stamp', 'Target no longer applies', `Lv ${formatNumber(manaStamp.level)}`]);
    expect(row.querySelector('img').getAttribute('src').endsWith(`${stamp.icon(manaStamp)}.png`)).toBe(true);
    // One line under the name, so a phone keeps the amount without crowding Edit and Remove
    expect(row.querySelector('[data-goal-reason]').textContent)
      .toBe(`Target no longer applies · Lv ${formatNumber(manaStamp.level)}`);
    expect(screen.queryByText('No longer in the game')).toBeNull();
    expect(within(row).getAllByRole('button').map((b) => b.textContent)).toEqual(['Edit', 'Remove']);
    fireEvent.click(within(row).getByRole('button', { name: 'Edit' }));
    // Stamps have no Max any more, so the target starts empty instead of the stale Max
    expect((await screen.findByLabelText(/^Target/)).value).toBe('');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cards' }));
    const cardButtons = within(rows()[0]).getAllByRole('button');
    expect(cardButtons.map((b) => [b.textContent, getComputedStyle(b).minHeight])).toEqual([['Edit', '40px'], ['Remove', '40px']]);
  });

  it('a tap opens the row in place with the goal, its note and Edit, Open page and Remove', async () => {
    const open = { ...openGoal(), note: 'Before the next event' };
    seed(open);
    mount();
    const view = resolveGoal(open, ctx);
    await screen.findByText(view.name);
    const [row] = rows();
    expect(row.querySelector('[data-goal-note]')).toBeNull();
    expect(within(row).getByRole('img', { name: 'Has a note' })).toBeTruthy();
    openRow(row);
    expect(row.querySelector('[data-goal-row]').getAttribute('aria-expanded')).toBe('true');
    expect(within(row).getByText(`Goal: At least Lv ${formatNumber(view.targetValue)}`)).toBeTruthy();
    expect(row.querySelector('[data-goal-note]').textContent).toBe('Before the next event');
    expect(within(row).getAllByRole('button').slice(2).map((b) => b.textContent)).toEqual(['Edit', 'Remove']);
    expect(within(row).getByRole('link', { name: 'Open Bubbles page' }).getAttribute('href')).toBe(`${bubble.route}?demo=true`);
    fireEvent.click(within(row).getByRole('button', { name: 'Edit' }));
    expect((await screen.findByLabelText(/^Target/)).value).toBe(String(view.targetValue));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    openRow(row);
    expect(row.querySelector('[data-goal-note]')).toBeNull();
  });

  it.each([
    ['short of the price', purse],
    ['able to buy it', unboughtBribe.price * 2]
  ])('an open bribe row shows up to five coin tiers of what you have and of the price: %s', async (_, coins) => {
    seed(bribeGoal(unboughtBribe));
    mount({ account: { ...account, currencies: { ...account.currencies, rawMoney: coins } } });
    const [row] = rows(await screen.findByRole('list', { name: 'Goals' }));
    openRow(row);
    const [, full] = row.querySelectorAll('[data-goal-cost]');
    const shown = (n) => Math.min(getCoinsArray(n).length, 5);
    expect(full.querySelectorAll('img')).toHaveLength(shown(coins) + shown(unboughtBribe.price));
  });

  it('a card keeps its title line to itself: the menu sits on the value line', async () => {
    seed(openGoal());
    mount();
    await screen.findByText('1 goal · 0 reached');
    fireEvent.click(screen.getByRole('button', { name: 'Cards' }));
    const [card] = rows();
    const menuSlot = within(card).getByRole('button', { name: 'Goal actions' }).parentElement;
    expect(getComputedStyle(menuSlot).gridRow).toBe('2');
  });

  it('system chips filter the rows and All brings every goal back', async () => {
    seed(openGoal(), goal({ key: bubble.key(levelled[2]), target: levelled[2].level + 1000 }),
      goal({ system: 'stamp', key: stamp.key(levelledStamp), target: levelledStamp.level * 10 }));
    mount();
    await screen.findByText('3 goals · 0 reached');
    expect(chip('All 3').getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(chip('Stamps 1'));
    expect(rowNames()).toEqual([stamp.name(levelledStamp)]);
    expect(chip('Stamps 1').getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(chip('Bubbles 2'));
    expect(rowNames()).toHaveLength(2);
    fireEvent.click(chip('All 3'));
    expect(rowNames()).toHaveLength(3);
  });

  it('past five systems the rest fold into a +k chip (never a +1) whose menu filters too', async () => {
    const systems = ['bubble', 'stamp', 'grimoire', 'slab', 'killroyKills', 'summonStone', 'bribe'];
    seed(...systems.map((system) => {
      const d = getDescriptor(system);
      return goal({ system, kind: 'all', metric: Object.keys(d.metrics)[0], target: 1 });
    }));
    mount();
    await screen.findByText('7 goals', { exact: false });
    const folded = getDescriptors().map(({ system }) => system).filter((system) => systems.includes(system))
      .slice(5).map((system) => `${getDescriptor(system).label} 1`);
    fireEvent.click(chip('More systems'));
    expect(screen.getAllByRole('menuitem').map((m) => m.textContent)).toEqual(folded);
    fireEvent.click(screen.getByRole('menuitem', { name: folded[1] }));
    expect(chip(folded[1]).getAttribute('aria-pressed')).toBe('true');
    expect(screen.queryByRole('button', { name: 'More systems' })).toBeTruthy();
  });

  it('Rows is the default layout; Cards keeps a fixed 78px card with its own actions slot, and the choice is remembered', async () => {
    seed({ ...openGoal(), note: 'Before the next event' });
    const first = mount();
    await screen.findByText('1 goal · 0 reached');
    const layout = (name) => screen.getByRole('button', { name });
    expect([layout('Rows'), layout('Cards')].map((b) => b.getAttribute('aria-pressed'))).toEqual(['true', 'false']);
    fireEvent.click(layout('Cards'));
    const [card] = rows();
    expect(card.querySelector('[data-goal-row]')).toBeNull();
    expect(getComputedStyle(card).height).toBe('78px');
    const actions = within(card).getByRole('button', { name: 'Goal actions' });
    expect(getComputedStyle(actions).position).not.toBe('absolute');
    // phone targets: a 40px actions button and 40px layout toggles
    expect([getComputedStyle(actions).width, getComputedStyle(actions).height, getComputedStyle(layout('Rows')).minHeight])
      .toEqual(['40px', '40px', '40px']);
    fireEvent.click(actions);
    // the note above the actions is not the first focus stop
    expect(document.activeElement.textContent).toBe('Edit');
    expect(screen.getByRole('menu').querySelector('[data-goal-note]').textContent).toBe('Before the next event');
    expect(screen.getAllByRole('menuitem').map((m) => m.textContent)).toEqual(['Edit', 'Open Bubbles page', 'Remove']);
    expect(screen.getByRole('menuitem', { name: 'Open Bubbles page' }).getAttribute('href')).toBe(`${bubble.route}?demo=true`);
    first.unmount();
    mount();
    await screen.findByText('1 goal · 0 reached');
    expect(layout('Cards').getAttribute('aria-pressed')).toBe('true');
  });

  it('a card shows the same value, caption and percent as its row', async () => {
    const all = allGoal();
    seed(all);
    mount();
    const [row] = rows(await screen.findByRole('list', { name: 'Goals' }));
    const text = rowText(row);
    fireEvent.click(screen.getByRole('button', { name: 'Cards' }));
    expect(rowText(rows()[0])).toEqual(text);
  });

  it('sorts closest first by default, then recently added, and remembers the sort', async () => {
    const [a, b] = levelled.slice(1);
    const quarter = goal({ key: bubble.key(a), target: a.level * 4 });
    const tenth = goal({ system: 'stamp', key: stamp.key(levelledStamp), target: levelledStamp.level * 10, pinned: true });
    const half = goal({ key: bubble.key(b), target: b.level * 2 });
    seed(quarter, tenth, half);
    const first = mount();
    await screen.findByText('3 goals · 0 reached');
    const [quarterName, tenthName, halfName] = [bubble.name(a), stamp.name(levelledStamp), bubble.name(b)];
    expect(rowNames()).toEqual([tenthName, halfName, quarterName]);
    const sortBy = (current, next) => {
      fireEvent.click(chip(current));
      fireEvent.click(screen.getByRole('menuitem', { name: next }));
    };
    sortBy('Closest first', 'Recently added');
    expect(rowNames()).toEqual([tenthName, halfName, quarterName]);
    fireEvent.click(screen.getByRole('button', { name: 'Unpin goal' }));
    expect(rowNames()).toEqual([halfName, tenthName, quarterName]);
    fireEvent.click(within(rows()[2]).getByRole('button', { name: 'Pin goal' }));
    expect(rowNames()).toEqual([quarterName, halfName, tenthName]);
    first.unmount();
    mount();
    expect(await screen.findByRole('button', { name: 'Recently added' })).toBeTruthy();
  });

  it('reached goals wait in a collapsed Reached strip with Clear reached', async () => {
    seed(reachedGoal(), openGoal());
    mount();
    const strip = await screen.findByRole('button', { name: 'Reached (1)' });
    expect(rowNames()).toEqual([bubble.name(levelled[1])]);
    expect(strip.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('list', { name: 'Reached goals' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Clear reached' })).toBeTruthy();
    fireEvent.click(strip);
    expect(rowNames(grid('Reached goals'))).toEqual([bubble.name(levelled[0])]);
  });

  it.each([
    ['Remove', () => {
      const [row] = rows();
      openRow(row);
      fireEvent.click(within(row).getByRole('button', { name: 'Remove' }));
    }, 'Goal removed'],
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

  it('removing a range row removes both goals, and Undo brings both back', async () => {
    const key = item.key(ownedItem);
    const lower = goal({ system: 'item', key, metric: 'quantity', target: 5e5 });
    const upper = goal({ system: 'item', key, metric: 'quantity', op: '<=', target: 5e6 });
    seed(lower, upper);
    mount();
    await screen.findByText('1 goal · 0 reached');
    const [row] = rows();
    openRow(row);
    fireEvent.click(within(row).getByRole('button', { name: 'Remove' }));
    expect(api.goals).toEqual([]);
    fireEvent.click(within(await screen.findByRole('status')).getByRole('button', { name: 'Undo' }));
    expect([...api.goals].sort((x, y) => x.createdAt - y.createdAt)).toEqual([lower, upper]);
  });

  it('an open range row edits either of its goals', async () => {
    const key = item.key(ownedItem);
    const lower = goal({ system: 'item', key, metric: 'quantity', target: 5e5 });
    const upper = goal({ system: 'item', key, metric: 'quantity', op: '<=', target: 5e6 });
    seed(lower, upper);
    mount();
    await screen.findByText('1 goal · 0 reached');
    const [row] = rows();
    openRow(row);
    for (const [label, target] of [['Edit at least 500K', '500000'], ['Edit at most 5M', '5000000']]) {
      fireEvent.click(within(row).getByRole('button', { name: label }));
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
    // The section toggles come before the goals layout toggle
    expect(within(screen.getAllByRole('group')[0]).getAllByRole('button').map((b) => b.textContent))
      .toEqual(['Goals', 'Account', 'Characters', 'Timers']);
    const sections = [...container.querySelectorAll('[data-section]')].map((el) => el.getAttribute('data-section'));
    expect(sections).toEqual(['goals', 'account', 'characters', 'timers']);
  });

  it('the empty state explains goals and links five systems, keeping the demo query', () => {
    mount();
    expect(screen.getByRole('heading', { name: 'Goals' })).toBeTruthy();
    expect(screen.getByText('Set your first goal')).toBeTruthy();
    expect(screen.getByText(
      "Pick something you're working toward, like a stamp level, all meals to Lv 100 or a bribe, and track it here."
    )).toBeTruthy();
    expect(screen.getByText('in the top bar of any page, or start with:', { exact: false })).toBeTruthy();
    // the replica of the header button is not interactive
    expect(screen.getByText('Add goal').closest('a,button')).toBeNull();
    const links = screen.getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual(['Stamps', 'Bubbles', 'Meals', 'Bribes', 'Talents']);
    expect(links.map((link) => link.getAttribute('href').split('?')[0])).toEqual([
      '/account/world-1/stamps', '/account/world-2/bubbles', '/account/world-4/cooking',
      '/account/world-1/bribes', '/characters'
    ]);
    for (const link of links) {
      expect(link.getAttribute('href').endsWith('?demo=true')).toBe(true);
      expect(link.querySelector('img')).toBeTruthy();
    }
    expect(screen.getByText('Items from the material tracker show up here automatically.')).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Material tracker' })).toBeNull();
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

  it('an open all row lists every unmet entry under Next up, with search and paging', async () => {
    const all = allGoal();
    seed(all);
    mount();
    const view = resolveGoal(all, ctx);
    expect(view.shortCount).toBeGreaterThan(100);
    const [row] = rows(await screen.findByRole('list', { name: 'Goals' }));
    expect(screen.queryByRole('list', { name: 'Entries still short' })).toBeNull();
    openRow(row);
    expect(within(row).getByRole('heading', { name: 'Next up' })).toBeTruthy();
    expect(expandedNames()).toEqual(view.short.slice(0, 50).map(({ name }) => name));
    expect(within(screen.getByRole('list', { name: 'Entries still short' })).getByRole('progressbar', { name: view.short[0].name }))
      .toBeTruthy();
    expect(getComputedStyle(screen.getByRole('list', { name: 'Entries still short' })).overflowY).toBe('auto');

    const query = view.short[0].name.slice(0, 3).toLowerCase();
    fireEvent.change(within(row).getByRole('textbox', { name: 'Search' }), { target: { value: query } });
    expect(expandedNames()).toEqual(view.short.filter(({ name }) => name.toLowerCase().includes(query))
      .slice(0, 50).map(({ name }) => name));
    fireEvent.change(within(row).getByRole('textbox', { name: 'Search' }), { target: { value: '' } });
    fireEvent.click(within(row).getByRole('button', { name: 'Show 50 more' }));
    expect(expandedNames()).toEqual(view.short.slice(0, 100).map(({ name }) => name));
  });

  it('a card opens the same Next up list in a dialog', async () => {
    const all = allGoal();
    seed(all);
    mount();
    const view = resolveGoal(all, ctx);
    fireEvent.click(await screen.findByRole('button', { name: 'Cards' }));
    fireEvent.click(within(rows()[0]).getByRole('button', { name: 'Goal actions' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Next up' }));
    const dialog = screen.getByRole('dialog', { name: 'All bubbles at least Lv 1,000,000,000' });
    expect(expandedNames()).toEqual(view.short.slice(0, 50).map(({ name }) => name));
    expect(within(dialog).getByRole('link', { name: 'Full list on the Bubbles page' }).getAttribute('href'))
      .toBe(`${bubble.route}?demo=true`);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('list', { name: 'Entries still short' })).toBeNull());
  });

  it('promoting an entry from the Next up list creates its own goal', async () => {
    const all = allGoal();
    seed(all);
    mount();
    const view = resolveGoal(all, ctx);
    openRow(rows(await screen.findByRole('list', { name: 'Goals' }))[0]);
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
    openRow(rows(await screen.findByRole('list', { name: 'Goals' }))[0]);
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