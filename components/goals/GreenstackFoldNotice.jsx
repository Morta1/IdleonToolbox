import React, { useContext, useState } from 'react';
import { useLocalStorage, readLocalStorageValue } from '@mantine/hooks';
import { Button, IconButton } from '@mui/material';
import { IconX } from '@tabler/icons-react';
import { AppContext } from '@components/common/context/AppProvider';
import { useGoals } from '@components/goals/GoalsProvider';
import { FOLD_NOTICE_KEY, TRACKER_KEY } from '@components/goals/useMaterialTrackerMigration';
import NoticeSnackbar from '@components/common/NoticeSnackbar';
import { getDescriptor } from '@utility/goals/registry';
import { unfoldedGreenstackGoals } from '@utility/goals/migrateMaterialTracker';

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

// One-time notice after the migration merged old 10M tracker entries into the greenstack goal. The stored notice is read
// in an effect (useLocalStorage), so the first render matches the build.
const GreenstackFoldNotice = () => {
  const { state } = useContext(AppContext);
  const { loaded, accountKey, goals, saveMany, removeMany } = useGoals();
  const [notice, setNotice] = useLocalStorage({ key: FOLD_NOTICE_KEY });
  const [result, setResult] = useState(null);

  const pending = loaded && notice?.count > 0 && !notice.seen && notice.accountKey === accountKey;
  const markSeen = () => setNotice({ ...notice, seen: true });

  // Rebuilt from the old tracker key, which the migration only ever reads
  const keepSeparate = () => {
    const greenstack = getDescriptor('greenstack');
    const ctx = { account: state?.account, characters: state?.characters };
    const greenstackKeys = new Set(greenstack.list(ctx).map((row) => greenstack.key(row)));
    const items = unfoldedGreenstackGoals(readLocalStorageValue({ key: TRACKER_KEY }), { greenstackKeys });
    const folds = goals.filter((goal) => goal.system === 'greenstack' && goal.kind === 'all' && goal.group == null);
    removeMany(folds.map(({ id }) => id));
    const { added, overCap } = saveMany(items);
    markSeen();
    setResult(overCap > 0
      ? `${plural(added, 'item goal', 'item goals')} added, ${overCap} left out (goal limit)`
      : `${plural(added, 'item goal', 'item goals')} added`);
  };

  if (result) return <NoticeSnackbar label={result} onClose={() => setResult(null)}/>;
  if (!pending) return null;
  return (
    <NoticeSnackbar label={`${plural(notice.count, 'greenstack entry', 'greenstack entries')} merged into All greenstacks`}
                    autoHideDuration={null} onClose={markSeen}
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
