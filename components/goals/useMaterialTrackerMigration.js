import { useContext, useEffect, useRef, useState } from 'react';
import { readLocalStorageValue } from '@mantine/hooks';
import { AppContext, writeStored } from '@components/common/context/AppProvider';
import { useGoals } from '@components/goals/GoalsProvider';
import { getDescriptor } from '@utility/goals/registry';
import { GOALS_STORAGE_KEY, goalsOf, normalizeBlob } from '@utility/goals/store';
import { materialTrackerToGoals } from '@utility/goals/migrateMaterialTracker';
import { getValidTrackedMaterials } from '@utility/materialTracker';

const TRACKER_KEY = 'material-tracker';
export const MIGRATED_FLAG_KEY = 'goals-material-tracker-migrated';

// The old key is only ever read: it stays for two releases so a rollback keeps working.
// The tracker is global, so the flag is global too: the first real account to open it takes the entries.
export const useMaterialTrackerMigration = () => {
  const { state } = useContext(AppContext);
  const { enabled, loaded, accountKey, goals, saveMany } = useGoals();
  const [overCap, setOverCap] = useState(0);
  const doneFor = useRef(null);
  const ready = loaded && enabled && !state?.isLoading && !!state?.account && !!state?.characters?.length;

  useEffect(() => {
    if (!ready || doneFor.current === accountKey) return;
    doneFor.current = accountKey;
    if (readLocalStorageValue({ key: MIGRATED_FLAG_KEY })) return;
    const tracked = getValidTrackedMaterials(readLocalStorageValue({ key: TRACKER_KEY }));
    if (Object.keys(tracked).length === 0) return;
    const ctx = { account: state.account, characters: state.characters };
    const greenstack = getDescriptor('greenstack');
    const greenstackKeys = new Set(greenstack.list(ctx).map((row) => greenstack.key(row)));
    const result = saveMany(materialTrackerToGoals(tracked, { greenstackKeys }));
    // Runs once per account key (doneFor guard), so no render cascade
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOverCap(result.overCap);
    // useLocalStorage swallows QuotaExceededError, so confirm the write by reading it back; unset flag means retry next load
    const persisted = goalsOf(normalizeBlob(readLocalStorageValue({ key: GOALS_STORAGE_KEY })), accountKey);
    const landed = result.added === 0 || persisted.length >= goals.length + result.added;
    if (!landed) return;
    // The demo account gets a copy for the session but must not consume the real account's migration
    if (accountKey !== 'demo') writeStored(MIGRATED_FLAG_KEY, true);
    // saveMany and state are read once, at the moment the guard opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, accountKey]);

  return { overCap };
};
