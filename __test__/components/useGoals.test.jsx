// @vitest-environment jsdom
import React, { useEffect } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { act, render } from '@testing-library/react';
import { AppContext } from '@components/common/context/AppProvider';
import { GoalsProvider, useGoals } from '@components/goals/GoalsProvider';
import { createGoal, GOALS_STORAGE_KEY } from '@utility/goals/store';

let api;
const Probe = () => {
  const value = useGoals();
  useEffect(() => {
    api = value;
  });
  return <span data-testid="probe">{value.goals.length}</span>;
};

const mount = (state) => {
  const tree = (s) => (
    <AppContext.Provider value={{ state: s }}>
      <GoalsProvider>
        <Probe />
      </GoalsProvider>
    </AppContext.Provider>
  );
  const view = render(tree(state));
  return { ...view, setState: (s) => view.rerender(tree(s)) };
};

const own = (name = 'Alpha', extra = {}) => ({ uid: `uid-${name}`, characters: [{ name }], ...extra });
const goal = (fields) => createGoal({ system: 'bubble', key: '_0', metric: 'level', target: 10, ...fields });

describe('useGoals', () => {
  beforeEach(() => localStorage.clear());

  it('profile view is disabled and writes nothing', () => {
    mount(own('Alpha', { profile: true }));
    expect(api.enabled).toBe(false);
    expect(api.accountKey).toBeNull();
    act(() => {
      expect(api.save(goal())).toBeNull();
      expect(api.saveMany([goal()])).toEqual({ added: 0, duplicates: 0, overCap: 0 });
    });
    expect(api.goals).toEqual([]);
    expect(localStorage.getItem(GOALS_STORAGE_KEY)).toBeNull();
  });

  it('logged-out state writes nothing', () => {
    mount({ characters: [] });
    expect(api.enabled).toBe(false);
    expect(localStorage.getItem(GOALS_STORAGE_KEY)).toBeNull();
  });

  it('saves and reads back for the same account', async () => {
    const { unmount } = mount(own());
    expect(api.enabled).toBe(true);
    const g = goal();
    act(() => {
      api.save(g);
    });
    expect(api.goals.map((x) => x.id)).toEqual([g.id]);
    act(() => api.remove(g.id));
    expect(api.goals).toEqual([]);
    act(() => {
      api.saveMany([goal({ key: '_1' }), goal({ key: '_2' })]);
    });
    const ids = api.goals.map((x) => x.id);
    expect(ids).toHaveLength(2);
    act(() => api.removeMany(ids));
    expect(api.goals).toEqual([]);
    act(() => {
      api.save(g);
    });
    unmount();
    mount(own());
    expect(api.goals.map((x) => x.id)).toEqual([g.id]);
  });

  it('a second account does not see the first account goals', () => {
    const { setState } = mount(own('Alpha'));
    act(() => {
      api.save(goal());
    });
    expect(api.goals).toHaveLength(1);
    setState(own('Beta'));
    expect(api.goals).toEqual([]);
    setState(own('Alpha'));
    expect(api.goals).toHaveLength(1);
  });

  it('a garbage stored blob loads as empty', () => {
    localStorage.setItem('goals', JSON.stringify({ nope: 1 }));
    mount(own());
    expect(api.goals).toEqual([]);
  });

  it('a blob from a newer build is never overwritten', () => {
    const newer = JSON.stringify({ schema: 2, accounts: { 'uid-Alpha': [{ shape: 'from the future' }] } });
    localStorage.setItem(GOALS_STORAGE_KEY, newer);
    mount(own());
    act(() => {
      expect(api.save(goal())).toBe('newer');
      api.saveMany([goal({ key: '_1' })]);
      api.remove('x');
      api.removeMany(['x']);
    });
    expect(localStorage.getItem(GOALS_STORAGE_KEY)).toBe(newer);
  });

  it('findEntryGoal finds an entry goal by system, key and scope', () => {
    mount(own());
    const acc = goal();
    const char = goal({ key: '_0', scope: { char: 'Alpha' } });
    const watch = goal({ key: '_9', watch: true });
    act(() => {
      api.saveMany([acc, char, watch]);
    });
    expect(api.findEntryGoal('bubble', '_0')?.id).toBe(acc.id);
    expect(api.findEntryGoal('bubble', '_0', { char: 'Alpha' })?.id).toBe(char.id);
    expect(api.findEntryGoal('bubble', '_0', { char: 'Zed' })).toBeUndefined();
    expect(api.findEntryGoal('bubble', '_9')).toBeUndefined();
    expect(api.findEntryGoal('other', '_0')).toBeUndefined();
  });
});
