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
import AddGoalButton from '@components/goals/AddGoalButton';
import { getDescriptor } from '@utility/goals/registry';
import { resolveGoal } from '@utility/goals/resolve';
import { createGoal, GOALS_STORAGE_KEY } from '@utility/goals/store';
import { formatNumber, statusText } from '@components/goals/parts/format';
import NoticeSnackbar, { NoticeStack, NoticeStackProvider } from '@components/common/NoticeSnackbar';

const router = { pathname: '/account/world-2/bubbles', query: { demo: 'true', t: 'tab' }, isReady: true, push: vi.fn() };
vi.mock('next/router', () => ({ useRouter: () => router }));

const { account, characters } = parseFixture(latest);
const ctx = { account, characters };
const ACCOUNT_KEY = 'uid-test';
const bubble = getDescriptor('bubble');
const stamp = getDescriptor('stamp');
const skill = getDescriptor('skill');
const levelled = bubble.list(ctx).filter((row) => row.level > 0);
const stampRow = stamp.list(ctx)[0];
const [charA, charB] = characters;
const skillRowA = skill.list({ ...ctx, character: charA })[0];
const skillRowB = skill.list({ ...ctx, character: charB })[1];

let api;
const Probe = () => {
  const value = useGoals();
  useEffect(() => {
    api = value;
  });
  return null;
};

const outerClick = vi.fn();
const mount = (state = {}) => render(
  <ThemeProvider theme={darkTheme}>
    <AppContext.Provider value={{ state: { uid: ACCOUNT_KEY, account, characters, ...state }, dispatch: vi.fn() }}>
      <GoalsProvider>
        <Probe/>
        <div onClick={outerClick}>
          <AddGoalButton/>
        </div>
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
const stampGoal = () => goal({ system: 'stamp', key: stamp.key(stampRow), target: 1e6 });

const panel = () => screen.getByRole('list', { name: 'Goals on this page' });
const panelRows = () => within(panel()).getAllByRole('listitem');
const openPanel = async (label) => fireEvent.click(await screen.findByRole('button', { name: label }));

describe('Header page goals', () => {
  beforeEach(() => {
    localStorage.clear();
    outerClick.mockClear();
    router.pathname = '/account/world-2/bubbles';
    router.query = { demo: 'true', t: 'tab' };
  });

  it('reads Add goal without page goals and opens the add popover', async () => {
    seed(stampGoal());
    mount();
    await openPanel('Add goal');
    expect(screen.getByRole('heading', { name: 'Add goal' })).toBeTruthy();
  });

  it('reads Goals with reached of total for the page systems only', async () => {
    seed(reachedGoal(), openGoal(), stampGoal());
    mount();
    expect(await screen.findByRole('button', { name: 'Goals · 1 of 2 reached' })).toBeTruthy();
  });

  it('lists only the page goals, open before reached', async () => {
    const reached = reachedGoal();
    const open = openGoal();
    seed(reached, open, stampGoal());
    mount();
    await openPanel('Goals · 1 of 2 reached');
    expect(screen.getByText('Goals on this page')).toBeTruthy();
    expect(panelRows().map((li) => li.getAttribute('data-goal-status'))).toEqual(['ok', 'reached']);
    expect(panelRows().map((li) => li.querySelector('[data-goal-name]').textContent))
      .toEqual([bubble.name(levelled[1]), bubble.name(levelled[0])]);
  });

  it('character goals show the character name', async () => {
    router.pathname = '/characters';
    seed(
      goal({ system: 'skill', scope: { char: charA.name }, key: skill.key(skillRowA), target: 1e6 }),
      goal({ system: 'skill', scope: { char: charB.name }, key: skill.key(skillRowB), target: 1e6 })
    );
    mount();
    await openPanel('Goals · 0 of 2 reached');
    expect(panelRows().map((li) => li.querySelector('[data-goal-name]').textContent).sort()).toEqual([
      `${skill.name(skillRowA)} (${charA.name})`,
      `${skill.name(skillRowB)} (${charB.name})`
    ].sort());
  });

  it('a row opens the goal card with the goal text, and clicks never bubble', async () => {
    const open = openGoal();
    seed(open);
    mount();
    await openPanel('Goals · 0 of 1 reached');
    outerClick.mockClear();
    fireEvent.click(within(panelRows()[0]).getByText(bubble.name(levelled[1])));
    const card = screen.getByTestId('goal-card');
    const view = resolveGoal(open, ctx);
    expect(within(card).getByText(statusText(view))).toBeTruthy();
    expect(within(card).getByText('Bubble')).toBeTruthy();
    fireEvent.click(within(card).getByText(statusText(view)));
    expect(outerClick).not.toHaveBeenCalled();
  });

  it('Edit opens the popover editing the goal and saving keeps one goal', async () => {
    const open = openGoal();
    seed(open);
    mount();
    await openPanel('Goals · 0 of 1 reached');
    fireEvent.click(within(panelRows()[0]).getByText(bubble.name(levelled[1])));
    outerClick.mockClear();
    fireEvent.click(within(screen.getByTestId('goal-card')).getByRole('button', { name: 'Edit' }));
    expect(await screen.findByRole('heading', { name: 'Edit goal' })).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/^Target/), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(api.goals).toHaveLength(1);
    expect(api.goals[0]).toMatchObject({ id: open.id, target: 1 });
    expect(outerClick).not.toHaveBeenCalled();
    expect(await screen.findByRole('button', { name: 'Goals · 1 of 1 reached' })).toBeTruthy();
  });

  it('Remove removes the goal, the label updates, and Undo restores it', async () => {
    const open = openGoal();
    seed(open);
    mount();
    await openPanel('Goals · 0 of 1 reached');
    fireEvent.click(within(panelRows()[0]).getByText(bubble.name(levelled[1])));
    outerClick.mockClear();
    fireEvent.click(within(screen.getByTestId('goal-card')).getByRole('button', { name: 'Remove' }));
    expect(api.goals).toEqual([]);
    expect(outerClick).not.toHaveBeenCalled();
    expect(await screen.findByRole('button', { name: 'Add goal' })).toBeTruthy();
    const notice = screen.getByRole('status');
    expect(within(notice).getByText('Goal removed')).toBeTruthy();
    fireEvent.click(within(notice).getByRole('button', { name: 'Undo' }));
    expect(api.goals).toEqual([open]);
    expect(outerClick).not.toHaveBeenCalled();
  });

  it('a range card offers one edit per bound, each opening its own goal', async () => {
    router.pathname = '/tools/material-tracker';
    const item = getDescriptor('item');
    const key = item.key(item.list(ctx).find((row) => item.metrics.quantity.value(row, ctx) > 0));
    seed(
      goal({ system: 'item', key, metric: 'quantity', target: 5e5 }),
      goal({ system: 'item', key, metric: 'quantity', op: '<=', target: 5e6 })
    );
    mount();
    fireEvent.click(await screen.findByRole('button', { name: /^Goals · \d of 1 reached$/ }));
    fireEvent.click(within(panelRows()[0]).getByText(/of 500K - 5M$/));
    const card = screen.getByTestId('goal-card');
    expect(within(card).getAllByRole('button').map((b) => b.textContent).filter((t) => t.startsWith('Edit')))
      .toEqual(['Edit at least 500K', 'Edit at most 5M']);
    fireEvent.click(within(card).getByRole('button', { name: 'Edit at most 5M' }));
    expect((await screen.findByLabelText(/^Target/)).value).toBe('5000000');
    expect(screen.getByLabelText('Direction').textContent).toBe('Stay at or below');
  });

  it('a panel row keyboard focus draws an outline', async () => {
    seed(openGoal());
    mount();
    await openPanel('Goals · 0 of 1 reached');
    const button = panelRows()[0].querySelector('.MuiButtonBase-root');
    button.classList.add('Mui-focusVisible');
    expect(getComputedStyle(button).outlineStyle).toBe('solid');
  });

  it('panel rows use the dashboard card wording', async () => {
    const open = openGoal();
    seed(open);
    mount();
    await openPanel('Goals · 0 of 1 reached');
    const view = resolveGoal(open, ctx);
    expect(statusText(view)).toBe(`Lv ${formatNumber(view.value)} of ${formatNumber(view.targetValue)}`);
    expect(within(panelRows()[0]).getByText(statusText(view))).toBeTruthy();
  });

  it('an all goal row is titled like the dashboard row, with what each entry needs', async () => {
    seed(goal({ kind: 'all', target: 1000 }));
    mount();
    await openPanel('Goals · 0 of 1 reached');
    expect(panelRows()[0].querySelector('[data-goal-name]').textContent).toBe('All bubbles at least Lv 1,000');
  });

  it('a yes/no panel row reads by its verb with no bar, like the dashboard row', async () => {
    const armorSet = getDescriptor('armorSet');
    const locked = armorSet.list(ctx).find((row) => !row.unlocked);
    router.pathname = armorSet.route;
    seed(goal({ system: 'armorSet', key: armorSet.key(locked), metric: 'unlocked', target: 1 }));
    mount();
    await openPanel('Goals · 0 of 1 reached');
    const [row] = panelRows();
    expect(row.querySelector('[data-goal-text]').textContent).toBe('Not unlocked yet');
    expect(within(row).queryByRole('progressbar')).toBeNull();
  });

  it('Add goal in the panel opens the add popover', async () => {
    seed(openGoal());
    mount();
    await openPanel('Goals · 0 of 1 reached');
    outerClick.mockClear();
    const panelHeader = screen.getByRole('heading', { name: 'Goals on this page' }).parentElement;
    fireEvent.click(within(panelHeader).getByRole('button', { name: 'Add goal' }));
    expect(await screen.findByRole('heading', { name: 'Add goal' })).toBeTruthy();
    expect(outerClick).not.toHaveBeenCalled();
  });

  it('keeps an Add goal action beside the goals count', async () => {
    seed(openGoal());
    mount();
    const count = await screen.findByRole('button', { name: 'Goals · 0 of 1 reached' });
    const add = screen.getByRole('button', { name: 'Add goal' });
    expect(count.nextElementSibling).toBe(add);
    fireEvent.click(add);
    expect(await screen.findByRole('heading', { name: 'Add goal' })).toBeTruthy();
  });

  it('saving shows Goal saved with a dashboard link', async () => {
    mount();
    await openPanel('Add goal');
    const row = levelled[1];
    fireEvent.change(screen.getByLabelText('Bubble'), { target: { value: bubble.name(row) } });
    fireEvent.click(screen.getByRole('option', { name: bubble.name(row) }));
    fireEvent.change(screen.getByLabelText(/^Target/), { target: { value: String(row.level + 1) } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(api.goals).toHaveLength(1);
    const notice = await screen.findByRole('status');
    expect(within(notice).getByText('Goal saved')).toBeTruthy();
    expect(within(notice).getByRole('link', { name: 'View on dashboard' }).getAttribute('href')).toBe('/dashboard?demo=true');
  });

  it('Goal saved stacks with a page notice in the one shared notice column', async () => {
    render(
      <ThemeProvider theme={darkTheme}>
        <AppContext.Provider value={{ state: { uid: ACCOUNT_KEY, account, characters }, dispatch: vi.fn() }}>
          <GoalsProvider>
            <NoticeStackProvider>
              <AddGoalButton/>
              <NoticeStack>
                <NoticeSnackbar label="Page notice" onClose={() => {}} stacked/>
              </NoticeStack>
            </NoticeStackProvider>
          </GoalsProvider>
        </AppContext.Provider>
      </ThemeProvider>
    );
    await openPanel('Add goal');
    const row = levelled[1];
    fireEvent.change(screen.getByLabelText('Bubble'), { target: { value: bubble.name(row) } });
    fireEvent.click(screen.getByRole('option', { name: bubble.name(row) }));
    fireEvent.change(screen.getByLabelText(/^Target/), { target: { value: String(row.level + 1) } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await screen.findByText('Goal saved');
    const [first, second] = screen.getAllByRole('status').map((status) => status.parentElement);
    expect(first.parentElement).toBe(second.parentElement);
    expect(first.parentElement.getAttribute('data-notice-stack')).toBe('');
  });

  it.each([
    ['Measure', 'Measurements'],
    ['Study', 'Studies'],
    ['Not a tab', 'Villagers'],
    [undefined, 'Villagers']
  ])('the Hole tab %s preselects %s', async (tab, label) => {
    router.pathname = '/account/world-5/hole';
    router.query = { demo: 'true', ...(tab ? { t: tab } : {}) };
    mount();
    await openPanel('Add goal');
    expect(screen.getByLabelText('System').textContent).toMatch(new RegExp(`^${label}`));
  });

  it('the dashboard link keeps the session query', async () => {
    seed(openGoal());
    mount();
    await openPanel('Goals · 0 of 1 reached');
    expect(screen.getByRole('link', { name: 'All goals on the dashboard' }).getAttribute('href'))
      .toBe('/dashboard?demo=true');
  });

  it('renders nothing on a profile view', () => {
    seed(openGoal());
    const { container } = mount({ profile: true });
    expect(container.textContent).toBe('');
  });
});
