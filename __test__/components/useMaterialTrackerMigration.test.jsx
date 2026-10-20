// @vitest-environment jsdom
import '../../polyfills';
import React, { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { AppContext } from '@components/common/context/AppProvider';
import { GoalsProvider, useGoals } from '@components/goals/GoalsProvider';
import { MIGRATED_FLAG_KEY, useMaterialTrackerMigration } from '@components/goals/useMaterialTrackerMigration';
import { getDescriptor } from '@utility/goals/registry';
import { createGoal, GOALS_STORAGE_KEY, MAX_ITEM_GOALS } from '@utility/goals/store';

const { account, characters } = parseFixture(latest);
const TRACKER = 'material-tracker';

let goalsApi;
let migration;
const Probe = () => {
  const goals = useGoals();
  const result = useMaterialTrackerMigration();
  useEffect(() => {
    goalsApi = goals;
    migration = result;
  });
  return null;
};

const mount = (extra = {}) =>
  render(
    <AppContext.Provider value={{ state: { uid: 'uid-a', account, characters, isLoading: false, ...extra } }}>
      <GoalsProvider>
        <Probe />
      </GoalsProvider>
    </AppContext.Provider>
  );

const entries = (n, fields) =>
  Object.fromEntries(
    Array.from({ length: n }, (_, i) => [`Item${i}`, { item: { rawName: `Item${i}`, displayName: `Item ${i}` }, ...fields }])
  );
const setTracker = (value) => localStorage.setItem(TRACKER, JSON.stringify(value));
const stored = (key = 'uid-a') => JSON.parse(localStorage.getItem(GOALS_STORAGE_KEY) ?? 'null')?.accounts?.[key] ?? [];

describe('useMaterialTrackerMigration', () => {
  beforeEach(() => localStorage.clear());

  it('migrates once: a deleted migrated goal stays deleted after remount', () => {
    setTracker(entries(2, { lowerBound: 10 }));
    const first = mount();
    expect(goalsApi.goals).toHaveLength(2);
    expect(localStorage.getItem(MIGRATED_FLAG_KEY)).toBe('true');
    act(() => goalsApi.remove(goalsApi.goals[0].id));
    first.unmount();
    mount();
    expect(goalsApi.goals).toHaveLength(1);
    expect(localStorage.getItem(TRACKER)).not.toBeNull();
  });

  it('two callers (dashboard alerts and the Goals section) migrate once', () => {
    setTracker(entries(2, { lowerBound: 10 }));
    const Twice = () => {
      useMaterialTrackerMigration();
      return <Probe/>;
    };
    render(
      <AppContext.Provider value={{ state: { uid: 'uid-a', account, characters, isLoading: false } }}>
        <GoalsProvider><Twice/></GoalsProvider>
      </AppContext.Provider>
    );
    expect(goalsApi.goals).toHaveLength(2);
    expect(stored()).toHaveLength(2);
  });

  it('demo account migrates but leaves the flag unset', () => {
    setTracker(entries(1, { lowerBound: 10 }));
    mount({ uid: undefined, demo: true });
    expect(goalsApi.accountKey).toBe('demo');
    expect(goalsApi.goals).toHaveLength(1);
    expect(localStorage.getItem(MIGRATED_FLAG_KEY)).toBeNull();
  });

  it('does nothing without a tracker key', () => {
    mount();
    expect(localStorage.getItem(GOALS_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(MIGRATED_FLAG_KEY)).toBeNull();
  });

  it('waits for the account to finish loading', () => {
    setTracker(entries(1, { lowerBound: 10 }));
    mount({ isLoading: true });
    expect(goalsApi.goals).toHaveLength(0);
    expect(localStorage.getItem(MIGRATED_FLAG_KEY)).toBeNull();
  });

  it('250 entries with both bounds become 500 item goals', () => {
    setTracker(entries(250, { lowerBound: 10, upperBound: 99 }));
    mount();
    expect(goalsApi.goals).toHaveLength(500);
    expect(migration.overCap).toBe(0);
  });

  it('reports overCap when the item pool is nearly full (blob pre-filled with 1900 item goals)', () => {
    const filler = Array.from({ length: MAX_ITEM_GOALS - 100 }, (_, i) =>
      createGoal({ system: 'item', key: `Filler${i}`, metric: 'quantity', target: 1 })
    );
    localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify({ schema: 1, accounts: { 'uid-a': filler } }));
    setTracker(entries(250, { lowerBound: 10, upperBound: 99 }));
    mount();
    expect(stored()).toHaveLength(MAX_ITEM_GOALS);
    expect(migration.overCap).toBe(400);
  });

  it('folds missing-greenstack entries into one greenstack goal', () => {
    const rows = getDescriptor('greenstack').list({ account, characters }).slice(0, 3);
    const tracked = Object.fromEntries(
      rows.map((row) => [row.itemRawName, { item: { rawName: row.itemRawName }, lowerBound: 1e7, upperBound: '', note: '' }])
    );
    setTracker(tracked);
    mount();
    expect(goalsApi.goals.map((g) => g.system)).toEqual(['greenstack']);
  });

  it('a child effect saving in the mount commit does not wipe pre-seeded goals', () => {
    const seeded = [createGoal({ system: 'item', key: 'Seeded', metric: 'quantity', target: 1 })];
    localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify({ schema: 1, accounts: { 'uid-a': seeded } }));
    const Eager = () => {
      const { saveMany } = useGoals();
      useEffect(() => {
        saveMany([createGoal({ system: 'item', key: 'Eager', metric: 'quantity', target: 2 })]);
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);
      return null;
    };
    render(
      <AppContext.Provider value={{ state: { uid: 'uid-a', account, characters, isLoading: false } }}>
        <GoalsProvider>
          <Eager />
          <Probe />
        </GoalsProvider>
      </AppContext.Provider>
    );
    expect(stored().map((g) => g.key)).toEqual(['Seeded']);
    expect(goalsApi.goals.map((g) => g.key)).toEqual(['Seeded']);
  });

  describe('when the goals write does not land', () => {
    afterEach(() => vi.restoreAllMocks());

    it('leaves the flag unset so the next load retries', () => {
      setTracker(entries(2, { lowerBound: 10 }));
      const realSet = Storage.prototype.setItem;
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (key, value) {
        if (key === GOALS_STORAGE_KEY) throw new DOMException('full', 'QuotaExceededError');
        return realSet.call(this, key, value);
      });
      mount();
      expect(localStorage.getItem(GOALS_STORAGE_KEY)).toBeNull();
      expect(localStorage.getItem(MIGRATED_FLAG_KEY)).toBeNull();
    });
  });
});
