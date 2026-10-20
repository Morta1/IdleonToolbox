import React, { createContext, useContext, useRef } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { AppContext } from '@components/common/context/AppProvider';
import {
  accountKeyOf,
  GOALS_STORAGE_KEY,
  goalsOf,
  normalizeBlob,
  removeGoal,
  removeGoals,
  upsertGoal,
  upsertGoals
} from '@utility/goals/store';

// Loaded by _app on every page: keep it data-free (no parsers, @website-data or goal registry).
const GoalsContext = createContext(null);

const EMPTY_BLOB = normalizeBlob(null);
const EMPTY_RESULT = { added: 0, duplicates: 0, overCap: 0 };

const sameScope = (goalScope, scope) => {
  if (scope === 'account' || scope === undefined) return goalScope === 'account' || goalScope === undefined;
  return goalScope?.char !== undefined && goalScope.char === scope?.char;
};

export const GoalsProvider = ({ children }) => {
  const { state } = useContext(AppContext);
  const accountKey = accountKeyOf({
    uid: state?.uid,
    characters: state?.characters,
    demo: state?.demo,
    profile: state?.profile,
    emptyAccount: state?.emptyAccount
  });
  const enabled = accountKey !== null;

  // Default state renders on the server and on hydration; the stored blob arrives in an effect.
  const [stored, setStored] = useLocalStorage({ key: GOALS_STORAGE_KEY, defaultValue: EMPTY_BLOB });
  const blob = normalizeBlob(stored);

  // Two writes in one tick must build on each other, not on the same stale render.
  const latest = useRef(blob);
  latest.current = blob;
  const commit = (next) => {
    latest.current = next;
    setStored(next);
  };

  const goals = enabled ? goalsOf(blob, accountKey) : [];

  const save = (goal) => {
    if (!enabled) return null;
    const { blob: next, rejected } = upsertGoal(latest.current, accountKey, goal);
    if (rejected) return rejected;
    commit(next);
    return null;
  };

  const saveMany = (list) => {
    if (!enabled) return EMPTY_RESULT;
    const { blob: next, added, duplicates, overCap } = upsertGoals(latest.current, accountKey, list);
    commit(next);
    return { added, duplicates, overCap };
  };

  const remove = (id) => {
    if (enabled) commit(removeGoal(latest.current, accountKey, id));
  };

  const removeMany = (ids) => {
    if (enabled) commit(removeGoals(latest.current, accountKey, ids));
  };

  // Watch goals belong to the material tracker, so they never count as the entry's goal.
  const findEntryGoal = (system, key, scope = 'account') =>
    goals.find((g) => g.kind === 'entry' && !g.watch && g.system === system && g.key === key && sameScope(g.scope, scope));

  const value = { enabled, accountKey, goals, save, saveMany, remove, removeMany, findEntryGoal };
  return <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>;
};

export const useGoals = () => useContext(GoalsContext) ?? {
  enabled: false,
  accountKey: null,
  goals: [],
  save: () => null,
  saveMany: () => EMPTY_RESULT,
  remove: () => {},
  removeMany: () => {},
  findEntryGoal: () => undefined
};
