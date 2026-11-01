import React, { useContext } from 'react';
import { readLocalStorageValue, useLocalStorage } from '@mantine/hooks';
import { Button, IconButton } from '@mui/material';
import { IconX } from '@tabler/icons-react';
import { AppContext } from '@components/common/context/AppProvider';
import { useGoals } from '@components/goals/GoalsProvider';
import { FOLD_NOTICE_KEY, TRACKER_KEY } from '@components/goals/useMaterialTrackerMigration';
import NoticeSnackbar from '@components/common/NoticeSnackbar';
import { notify } from '@components/common/Overlays/notify';
import { getDescriptor } from '@utility/goals/registry';
import { unfoldedGreenstackGoals } from '@utility/goals/migrateMaterialTracker';

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

const isFold = (goal) => goal.system === 'greenstack' && goal.kind === 'all' && goal.group == null;

// One-time notice after the migration merged old 10M tracker entries into the greenstack goal. The stored notice is read
// in an effect (useLocalStorage), so the first render matches the build. Rendered inside a NoticeStack.
const GreenstackFoldNotice = () => {
  const { state } = useContext(AppContext);
  const { loaded, accountKey, goals, saveMany, removeMany } = useGoals();
  const [notice, setNotice] = useLocalStorage({ key: FOLD_NOTICE_KEY });

  const pending = loaded && notice?.count > 0 && !notice.seen && notice.accountKey === accountKey;
  const markSeen = () => setNotice({ ...notice, seen: true });

  // Swaps back what "Keep as separate goals" swapped
  const undoKeep = (added, removed) => {
    // A duplicate of an existing goal was never saved under its own id, so removing every id leaves that goal alone
    removeMany(added.map(({ id }) => id));
    saveMany(removed);
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
  return (
    <NoticeSnackbar label={`${plural(notice.count, 'greenstack entry', 'greenstack entries')} merged into All greenstacks`}
                    autoHideDuration={null} onClose={markSeen} stacked
                    action={(
                      <>
                        <Button color="primary" size="small" sx={{ minHeight: { xs: 44, sm: 'auto' } }}
                                onClick={keepSeparate}>
                          Keep as separate goals
                        </Button>
                        <IconButton size="small" aria-label="Close" sx={{ color: 'inherit' }} onClick={markSeen}>
                          <IconX size={16}/>
                        </IconButton>
                      </>
                    )}/>
  );
};

export default GreenstackFoldNotice;
