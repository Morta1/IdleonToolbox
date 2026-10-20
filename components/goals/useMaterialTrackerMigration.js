import { useContext, useEffect, useRef, useState } from 'react';
import { readLocalStorageValue } from '@mantine/hooks';
import { AppContext, writeStored } from '@components/common/context/AppProvider';
import { useGoals } from '@components/goals/GoalsProvider';
import { getDescriptor } from '@utility/goals/registry';
import { materialTrackerToGoals } from '@utility/goals/migrateMaterialTracker';
import { getValidTrackedMaterials } from '@utility/materialTracker';

const TRACKER_KEY = 'material-tracker';
export const MIGRATED_FLAG_KEY = 'goals-material-tracker-migrated';

// The old key is only ever read: it stays for two releases so a rollback keeps working.
// The tracker is global, so the flag is global too: the first real account to open it takes the entries.
export const useMaterialTrackerMigration = () => {
  const { state } = useContext(AppContext);
  const { enabled, accountKey, saveMany } = useGoals();
  const [overCap, setOverCap] = useState(0);
  const doneFor = useRef(null);
  // The stored goals arrive in the provider's mount effect: saving before the next render would overwrite them
  const [stable, setStable] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStable(true);
  }, []);
  const ready = stable && enabled && !state?.isLoading && !!state?.account && !!state?.characters?.length;

  useEffect(() => {
    if (!ready || doneFor.current === accountKey) return;
    doneFor.current = accountKey;
    if (readLocalStorageValue({ key: MIGRATED_FLAG_KEY })) return;
    const tracked = getValidTrackedMaterials(readLocalStorageValue({ key: TRACKER_KEY }));
    if (Object.keys(tracked).length === 0) return;
    const ctx = { account: state.account, characters: state.characters };
    const greenstackKeys = new Set(getDescriptor('greenstack').list(ctx).map((row) => getDescriptor('greenstack').key(row)));
    const result = saveMany(materialTrackerToGoals(tracked, { greenstackKeys }));
    // Runs once per account key (doneFor guard), so no render cascade
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOverCap(result.overCap);
    // The demo account gets a copy for the session but must not consume the real account's migration
    if (accountKey !== 'demo') writeStored(MIGRATED_FLAG_KEY, true);
    // saveMany and state are read once, at the moment the guard opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, accountKey]);

  return { overCap };
};
