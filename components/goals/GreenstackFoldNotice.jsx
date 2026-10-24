import React, { useContext, useState } from 'react';
import { readLocalStorageValue, useLocalStorage } from '@mantine/hooks';
import { Button, IconButton } from '@mui/material';
import { IconX } from '@tabler/icons-react';
import { AppContext } from '@components/common/context/AppProvider';
import { useGoals } from '@components/goals/GoalsProvider';
import { FOLD_NOTICE_KEY, TRACKER_KEY } from '@components/goals/useMaterialTrackerMigration';
import NoticeSnackbar from '@components/common/NoticeSnackbar';
import UndoSnackbar from '@components/dashboard/settings/UndoSnackbar';
import { getDescriptor } from '@utility/goals/registry';
import { unfoldedGreenstackGoals } from '@utility/goals/migrateMaterialTracker';

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

// Never null: React Compiler reads the fields a callback uses while memoizing it, before any null check runs
const NO_RESULT = { label: '', added: [], removed: [] };

const isFold = (goal) => goal.system === 'greenstack' && goal.kind === 'all' && goal.group == null;

// One-time notice after the migration merged old 10M tracker entries into the greenstack goal. The stored notice is read
// in an effect (useLocalStorage), so the first render matches the build. Rendered inside a NoticeStack.
const GreenstackFoldNotice = () => {
  const { state } = useContext(AppContext);
  const { loaded, accountKey, goals, saveMany, removeMany } = useGoals();
  const [notice, setNotice] = useLocalStorage({ key: FOLD_NOTICE_KEY });
  // The goals "Keep as separate goals" swapped, so Undo can swap them back
  const [result, setResult] = useState(NO_RESULT);

  const pending = loaded && notice?.count > 0 && !notice.seen && notice.accountKey === accountKey;
  const markSeen = () => setNotice({ ...notice, seen: true });

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
    setResult({ label, added: items, removed: folds });
  };

  const undoKeep = () => {
    // A duplicate of an existing goal was never saved under its own id, so removing every id leaves that goal alone
    removeMany(result.added.map(({ id }) => id));
    saveMany(result.removed);
    setResult(NO_RESULT);
  };

  if (result.label) {
    return <UndoSnackbar label={result.label} onUndo={undoKeep} onClose={() => setResult(NO_RESULT)} stacked/>;
  }
  if (!pending) return null;
  return (
    <NoticeSnackbar label={`${plural(notice.count, 'greenstack entry', 'greenstack entries')} merged into All greenstacks`}
                    autoHideDuration={null} onClose={markSeen} stacked
                    action={(
                      <>
                        <Button color="primary" size="small" sx={{ textTransform: 'none', minHeight: { xs: 44, sm: 'auto' } }}
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
