import React, { useContext } from 'react';
import { readLocalStorageValue, useLocalStorage } from '@mantine/hooks';
import { AppContext } from '@components/common/context/AppProvider';
import { useGoals } from '@components/goals/GoalsProvider';
import { FOLD_NOTICE_KEY, TRACKER_KEY } from '@components/goals/useMaterialTrackerMigration';
import Notice from '@components/common/Notice';
import { notify } from '@components/common/Overlays/notify';
import { getDescriptor } from '@utility/goals/registry';
import { unfoldedGreenstackGoals } from '@utility/goals/migrateMaterialTracker';

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

const isFold = (goal) => goal.system === 'greenstack' && goal.kind === 'all' && goal.group == null;

// One-time notice after the migration merged old 10M tracker entries into the greenstack goal. The stored notice is read
// in an effect (useLocalStorage), so the first render matches the build. Rendered where the goals are: the dashboard's
// Goals card and the material tracker.
const GreenstackFoldNotice = ({ sx }) => {
  const { state } = useContext(AppContext);
  const { loaded, accountKey, goals, saveMany, removeMany } = useGoals();
  const [notice, setNotice] = useLocalStorage({ key: FOLD_NOTICE_KEY });

  const pending = loaded && notice?.count > 0 && !notice.seen && notice.accountKey === accountKey;
  const markSeen = () => setNotice({ ...notice, seen: true });

  // Swaps back what "Keep as separate goals" swapped, and offers the split again
  const undoKeep = (added, removed) => {
    // A duplicate of an existing goal was never saved under its own id, so removing every id leaves that goal alone
    removeMany(added.map(({ id }) => id));
    saveMany(removed);
    setNotice({ ...notice, seen: false });
  };

  // Rebuilt from the old tracker key, which the migration only ever reads
  const keepSeparate = () => {
    const greenstack = getDescriptor('greenstack');
    const ctx = { account: state?.account, characters: state?.characters };
    const greenstackKeys = new Set(greenstack.list(ctx).map((row) => greenstack.key(row)));
    const items = unfoldedGreenstackGoals(readLocalStorageValue({ key: TRACKER_KEY }), { greenstackKeys });
    const folds = goals.filter(isFold);
    removeMany(folds.map(({ id }) => id));
    const { added, overCap } = saveMany(items);
    markSeen();
    const label = `${plural(added, 'item goal', 'item goals')} added${overCap > 0 ? `, ${overCap} left out (goal limit)` : ''}`;
    notify(label, { undo: () => undoKeep(items, folds) });
  };

  if (!pending) return null;
  return <Notice sx={sx} action={{ label: 'Keep as separate goals', onClick: keepSeparate }}
                 onDismiss={markSeen}>
    {`${plural(notice.count, 'greenstack entry', 'greenstack entries')} merged into All greenstacks.`}
  </Notice>;
};

export default GreenstackFoldNotice;
