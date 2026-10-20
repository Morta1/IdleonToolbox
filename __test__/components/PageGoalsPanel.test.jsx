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
import { progressText } from '@components/goals/parts/format';

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
  });

  it('reads Add goal without page goals and opens the add popover', async () => {
    seed(stampGoal());
    mount();
    await openPanel('Add goal');
    expect(screen.getByRole('heading', { name: 'Add goal' })).toBeTruthy();
  });

  it('reads Goals reached/total for the page systems only', async () => {
    seed(reachedGoal(), openGoal(), stampGoal());
    mount();
    expect(await screen.findByRole('button', { name: 'Goals 1/2' })).toBeTruthy();
  });

  it('lists only the page goals, open before reached', async () => {
    const reached = reachedGoal();
    const open = openGoal();
    seed(reached, open, stampGoal());
    mount();
    await openPanel('Goals 1/2');
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
    await openPanel('Goals 0/2');
    expect(panelRows().map((li) => li.querySelector('[data-goal-name]').textContent).sort()).toEqual([
      `${skill.name(skillRowA)} (${charA.name})`,
      `${skill.name(skillRowB)} (${charB.name})`
    ].sort());
  });

  it('a row opens the goal card with current / target, and clicks never bubble', async () => {
    const open = openGoal();
    seed(open);
    mount();
    await openPanel('Goals 0/1');
    outerClick.mockClear();
    fireEvent.click(within(panelRows()[0]).getByText(bubble.name(levelled[1])));
    const card = screen.getByTestId('goal-card');
    const view = resolveGoal(open, ctx);
    expect(within(card).getByText(progressText(view))).toBeTruthy();
    expect(within(card).getByText('Bubble')).toBeTruthy();
    expect(within(card).getByText(view.metricLabel)).toBeTruthy();
    fireEvent.click(within(card).getByText(view.metricLabel));
    expect(outerClick).not.toHaveBeenCalled();
  });

  it('Edit opens the popover editing the goal and saving keeps one goal', async () => {
    const open = openGoal();
    seed(open);
    mount();
    await openPanel('Goals 0/1');
    fireEvent.click(within(panelRows()[0]).getByText(bubble.name(levelled[1])));
    outerClick.mockClear();
    fireEvent.click(within(screen.getByTestId('goal-card')).getByRole('button', { name: 'Edit' }));
    expect(await screen.findByRole('heading', { name: 'Edit goal' })).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/^Target/), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(api.goals).toHaveLength(1);
    expect(api.goals[0]).toMatchObject({ id: open.id, target: 1 });
    expect(outerClick).not.toHaveBeenCalled();
    expect(await screen.findByRole('button', { name: 'Goals 1/1' })).toBeTruthy();
  });

  it('Remove removes the goal and the label updates', async () => {
    seed(openGoal());
    mount();
    await openPanel('Goals 0/1');
    fireEvent.click(within(panelRows()[0]).getByText(bubble.name(levelled[1])));
    outerClick.mockClear();
    fireEvent.click(within(screen.getByTestId('goal-card')).getByRole('button', { name: 'Remove' }));
    expect(api.goals).toEqual([]);
    expect(outerClick).not.toHaveBeenCalled();
    expect(await screen.findByRole('button', { name: 'Add goal' })).toBeTruthy();
  });

  it('Add goal in the panel opens the add popover', async () => {
    seed(openGoal());
    mount();
    await openPanel('Goals 0/1');
    outerClick.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Add goal' }));
    expect(await screen.findByRole('heading', { name: 'Add goal' })).toBeTruthy();
    expect(outerClick).not.toHaveBeenCalled();
  });

  it('the dashboard link keeps the session query', async () => {
    seed(openGoal());
    mount();
    await openPanel('Goals 0/1');
    expect(screen.getByRole('link', { name: 'All goals on the dashboard' }).getAttribute('href'))
      .toBe('/dashboard?demo=true');
  });

  it('renders nothing on a profile view', () => {
    seed(openGoal());
    const { container } = mount({ profile: true });
    expect(container.textContent).toBe('');
  });
});
