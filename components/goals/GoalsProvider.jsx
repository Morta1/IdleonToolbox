import React, { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { AppContext } from '@components/common/context/AppProvider';
import {
  accountKeyOf,
  effectiveScope,
  GOALS_STORAGE_KEY,
  goalsOf,
  isNewerBlob,
  normalizeBlob,
  removeGoal,
  removeGoals,
  scopeKey,
  upsertGoal,
  upsertGoals
} from '@utility/goals/store';

// Loaded by _app on every page: keep it data-free (no parsers, @website-data or goal registry).
const GoalsContext = createContext(null);

const EMPTY_RESULT = { added: 0, duplicates: 0, overCap: 0 };

export const sameScope = (goalScope, scope) => scopeKey(goalScope) === scopeKey(scope);

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

  // No defaultValue: mantine would write it on mount, and a profile view or first visit must store nothing.
  // The stored blob arrives in an effect, so the first client render matches the build.
  const [stored, setStored] = useLocalStorage({ key: GOALS_STORAGE_KEY });
  const blob = normalizeBlob(stored);
  // Saving would replace goals this build cannot read, so a newer blob stays read-only
  const newer = isNewerBlob(stored);

  // Declared after useLocalStorage so its mount effect (which reads the stored blob) runs first and both batch.
  // Writes before this would build on an empty blob and overwrite the stored goals for good, so they are refused.
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoaded(true);
  }, []);

  // Two writes in one tick must build on each other, not on the same stale render.
  const latest = useRef(blob);
  // Layout phase, so a child effect in the same commit already sees the freshly loaded blob
  useLayoutEffect(() => {
    latest.current = blob;
  }, [blob]);
  const commit = (next) => {
    latest.current = next;
    setStored(next);
  };

  const goals = enabled ? goalsOf(blob, accountKey) : [];

  const save = (goal) => {
    if (!enabled || !loaded) return null;
    if (newer) return 'newer';
    const { blob: next, rejected } = upsertGoal(latest.current, accountKey, goal);
    if (rejected) return rejected;
    commit(next);
    return null;
  };

  const saveMany = (list) => {
    if (!enabled || !loaded || newer) return EMPTY_RESULT;
    const { blob: next, added, duplicates, overCap } = upsertGoals(latest.current, accountKey, list);
    if (added > 0 || duplicates > 0) commit(next);
    return { added, duplicates, overCap };
  };

  const remove = (id) => {
    if (enabled && loaded && !newer) commit(removeGoal(latest.current, accountKey, id));
  };

  const removeMany = (ids) => {
    if (enabled && loaded && !newer) commit(removeGoals(latest.current, accountKey, ids));
  };

  // Watch goals belong to the material tracker, so they never count as the entry's goal. A global entry's goal is the
  // account's whatever scope it was saved with
  const findEntryGoal = (system, key, scope = 'account') =>
    goals.find((g) => g.kind === 'entry' && !g.watch && g.system === system && g.key === key
      && sameScope(effectiveScope(g), effectiveScope({ system, key, scope })));

  const value = { enabled, loaded, accountKey, goals, save, saveMany, remove, removeMany, findEntryGoal };
  return <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>;
};

export const useGoals = () => useContext(GoalsContext) ?? {
  enabled: false,
  loaded: false,
  accountKey: null,
  goals: [],
  save: () => null,
  saveMany: () => EMPTY_RESULT,
  remove: () => {},
  removeMany: () => {},
  findEntryGoal: () => undefined
};
