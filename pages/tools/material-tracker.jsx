import {
  Box,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControlLabel,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import React, { useContext, useState } from 'react';
import dynamic from 'next/dynamic';
import Button from '@mui/material/Button';
import { handleDownload, numberWithCommas } from '@utility/helpers';
import { itemsArray } from '@website-data';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import StructuredData, { createHowToData } from '@components/common/StructuredData';
import { CardTitleAndValue } from '@components/common/styles';
import { IconTrash } from '@tabler/icons-react';
import { useGoals } from '@components/goals/GoalsProvider';
import { useMaterialTrackerMigration } from '@components/goals/useMaterialTrackerMigration';
import GreenstackFoldNotice from '@components/goals/GreenstackFoldNotice';
import GoalRow from '@components/dashboard/goals/GoalRow';
import ImportDialog from '@components/dashboard/goals/ImportDialog';
import NoticeSnackbar, { NoticeStack } from '@components/common/NoticeSnackbar';
import { goalsFileName, useGoalsFileImport, useGoalsUndo } from '@components/goals/goalListHelpers';
import { getDescriptor } from '@utility/goals/registry';
import { GREENSTACK_AMOUNT, greenstackGoal } from '@utility/goals/registry/greenstack';
import { pairRanges, resolveGoal, resolveGoals } from '@utility/goals/resolve';
import { materialTrackerToGoals } from '@utility/goals/migrateMaterialTracker';
import { exportItemGoals, isItemGoal } from '@utility/goals/importExport';
import { MAX_GOALS } from '@utility/goals/store';
import { ownedItemsOf } from '@utility/goals/registry/ownedItems';
import { isTrackableItem } from '@utility/materialTracker';
import { trackEvent } from '@utility/analytics';

const GoalPopover = dynamic(() => import('@components/goals/GoalPopover'), { ssr: false });

const SOURCE = 'material-tracker';

const MaterialTracker = () => {
  const { state } = useContext(AppContext);
  const { enabled, goals, save, saveMany } = useGoals();
  const { overCap } = useMaterialTrackerMigration();
  const [includeNearly, setIncludeNearly] = useState(false);
  const [bounds, setBounds] = useState({ lowerBound: '', upperBound: '' });
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState({ lowerBound: false, upperBound: false });
  const [result, setResult] = useState(null);
  // Keys the result notice so a second one restarts its timer (the Undo snackbar keeps its own)
  const [noticeCount, setNoticeCount] = useState(0);
  const [confirmClear, setConfirmClear] = useState(false);
  const [editing, setEditing] = useState(null);
  const { removeWithUndo, undoSnackbar } = useGoalsUndo();
  const fileImport = useGoalsFileImport();

  const ctx = { account: state?.account, characters: state?.characters };
  const itemGoals = goals.filter(({ system }) => system === 'item');
  const greenstack = goals.find(({ system }) => system === 'greenstack');
  const greenstackView = greenstack ? resolveGoal(greenstack, ctx) : null;
  // A lower and an upper goal on one item read as one range row
  const itemViews = pairRanges(resolveGoals(itemGoals, ctx));
  const pageGoals = goals.filter(isItemGoal);

  const notify = (next) => {
    setResult(next);
    setNoticeCount(noticeCount + 1);
  };

  const handleTrackMissing = () => {
    if (greenstack) {
      notify({ severity: 'info', message: 'Already tracking your greenstacks' });
      return;
    }
    const goal = greenstackGoal();
    if (save(goal) === 'cap') {
      notify({ severity: 'error', message: `You have ${MAX_GOALS} goals. Remove some first.` });
      return;
    }
    trackEvent('goal_added', { system: goal.system, kind: goal.kind, source: SOURCE });
    notify({ severity: 'success', message: 'Greenstack goal added' });
  };

  const handleTrackOwned = () => {
    const totalOwnedItems = ownedItemsOf(ctx);
    // A greenstack stays registered after the stack drops below 10M, so the game's registry is the
    // source; 10M+ owned covers stacks the game hasn't registered yet
    const ownedGreenStacks = new Set([
      ...(state?.account?.looty?.greenStacks || []),
      ...totalOwnedItems.filter(({ amount }) => amount >= GREENSTACK_AMOUNT).map(({ rawName }) => rawName)
    ]);
    const tracked = new Set(itemGoals.map(({ key }) => key));
    const untracked = itemsArray.filter((item) => isTrackableItem(item)
      && ownedGreenStacks.has(item.rawName) && !tracked.has(item.rawName));
    if (untracked.length === 0) {
      notify({ severity: 'info', message: 'All your greenstacks are already tracked' });
      return;
    }
    const lowerBound = bounds.lowerBound.replace(/,/g, '');
    const upperBound = bounds.upperBound.replace(/,/g, '');
    if (lowerBound && upperBound && lowerBound === upperBound) {
      setErrors({ lowerBound: true, upperBound: true });
      return;
    }
    const entries = Object.fromEntries(untracked.map(({ rawName }) => [rawName, {
      item: { rawName },
      lowerBound,
      upperBound,
      includeNearly,
      note
    }]));
    const { added, overCap: rejected } = saveMany(materialTrackerToGoals(entries));
    if (added > 0) trackEvent('goal_added', { system: 'item', kind: 'entry', source: SOURCE });
    notify(rejected > 0
      ? { severity: 'error', message: `${rejected} greenstack goals could not be added (goal limit)` }
      : { severity: 'success', message: `Added ${untracked.length} greenstack${untracked.length === 1 ? '' : 's'}` });
    setBounds({ lowerBound: '', upperBound: '' });
    setNote('');
  };

  const onEdit = (view, anchorEl) => {
    const goal = goals.find(({ id }) => id === view.id);
    const descriptor = getDescriptor(view.system);
    if (goal && descriptor) setEditing({ anchorEl, goal, descriptor });
  };

  // A range row stands for two goals, so it removes both
  const onRemove = (view) => {
    removeWithUndo(view.goalIds ?? [view.id], 'Goal removed');
    trackEvent('goal_removed', { system: view.system, kind: view.kind, source: SOURCE });
  };

  const onExport = () => handleDownload(exportItemGoals(goals), goalsFileName('idleon-item-goals'));

  const boundField = (field, label) => (
    <TextField size={'small'} error={errors[field]} value={bounds[field]} label={label}
               onChange={({ target }) => {
                 setBounds({ ...bounds, [field]: numberWithCommas(target.value.replace(/,/g, '')) });
                 setErrors({ ...errors, [field]: false });
               }}/>
  );

  return (<>
    <NextSeo
      title="Material Tracker | Idleon Toolbox"
      description="Add a material, set your own threshold and keep track of your inventory."
    />
    <StructuredData data={createHowToData(
      'How to track materials in Legends of Idleon',
      'Use the Material Tracker to monitor your inventory and get alerts when materials reach your target.',
      [
        'Add an item goal with the Add goal button and set the amount you want',
        'Use a lower bound goal to be alerted when you have less, an upper bound goal when you have more',
        'View your current inventory counts updated from your account data',
        'Track your missing greenstacks as one goal'
      ]
    )}/>
    <Stack gap={0.5} sx={{ mb: 2 }}>
      <Typography variant={'body2'} color={'text.secondary'}>
        Item goals show on your dashboard and raise the material tracker alert. Add single items with the Add goal
        button.
      </Typography>
      <Typography variant={'body2'} color={'text.secondary'}>
        Item goals track how many of an item you own. Slab goals, on the Slab page, track which items you have looted.
      </Typography>
    </Stack>
    {enabled ? <>
      <CardTitleAndValue title={'Greenstacks'} cardSx={{ mb: 3 }}>
        <Stack sx={{ mt: 1 }} gap={2} direction={{ xs: 'column', md: 'row' }}
               divider={<Divider orientation={'vertical'} flexItem sx={{ display: { xs: 'none', md: 'block' } }}/>}>
          <Stack role={'group'} aria-label={'Track my greenstacks'} gap={1.5} sx={{ flex: 1, minWidth: 0 }}>
            <Button onClick={handleTrackOwned} variant={'contained'} color={'secondary'} sx={{ alignSelf: 'flex-start' }}>
              Track my greenstacks
            </Button>
            <Typography variant={'caption'} color={'text.secondary'}>
              One goal per greenstack you own, with the bounds and note below. No bounds: the dashboard always shows
              the amount.
            </Typography>
            <Stack direction={'row'} gap={2} alignItems={'center'} flexWrap={'wrap'}>
              {boundField('lowerBound', 'Lower bound')}
              {boundField('upperBound', 'Upper bound')}
              <TextField size={'small'} value={note} onChange={({ target }) => setNote(target.value)} label="Note"/>
            </Stack>
            <FormControlLabel
              sx={{ width: 'fit-content' }}
              control={<Checkbox checked={includeNearly} onChange={() => setIncludeNearly(!includeNearly)}/>}
              label="Show an alert when value is near the bounds"
            />
          </Stack>
          <Stack role={'group'} aria-label={'Track missing greenstacks'} gap={1.5} sx={{ flex: { md: '0 0 240px' } }}>
            <Button onClick={handleTrackMissing} variant={'contained'} color={'secondary'}
                    sx={{ alignSelf: 'flex-start' }}>
              Track missing greenstacks
            </Button>
            <Typography variant={'caption'} color={'text.secondary'}>
              One goal for every greenstack you still need.
            </Typography>
          </Stack>
        </Stack>
      </CardTitleAndValue>
      {overCap > 0 ? (
        <Typography variant="body2" color="warning.main" sx={{ mb: 1 }}>
          {`${overCap} tracked materials could not be added (goal limit)`}
        </Typography>
      ) : null}
      <Stack data-item-goals gap={1} sx={{ maxWidth: 760 }}>
        <Stack direction={'row'} gap={1} flexWrap={'wrap'} justifyContent={'flex-end'}>
          {pageGoals.length ? (
            <Button size={'small'} sx={{ textTransform: 'none' }} onClick={onExport}>Export item goals</Button>
          ) : null}
          <Button size={'small'} sx={{ textTransform: 'none' }} onClick={fileImport.pick}>Import</Button>
          {fileImport.input}
          {pageGoals.length ? (
            <Button onClick={() => setConfirmClear(true)} variant={'outlined'} color={'error'} size={'small'}
                    startIcon={<IconTrash size={18}/>} sx={{ textTransform: 'none' }}>
              Clear all item goals
            </Button>
          ) : null}
        </Stack>
        {greenstackView || itemViews.length > 0 ? (
          <Box component="ul" aria-label="Item goals" sx={{ listStyle: 'none', m: 0, p: 0 }}>
            {greenstackView ? (
              <GoalRow key={greenstackView.id} view={greenstackView} onEdit={onEdit} onRemove={onRemove}/>
            ) : null}
            {itemViews.map((view) => <GoalRow key={view.id} view={view} onEdit={onEdit} onRemove={onRemove}/>)}
          </Box>
        ) : <Typography color={'text.secondary'}>Add item goals with the Add goal button</Typography>}
      </Stack>
    </> : null}
    {editing ? (
      <GoalPopover anchorEl={editing.anchorEl} open onClose={() => setEditing(null)}
                   systems={[editing.descriptor]}
                   initial={{ system: editing.goal.system, key: editing.goal.key, scope: editing.goal.scope, goal: editing.goal }}
                   source={SOURCE}/>
    ) : null}
    <Dialog open={confirmClear} onClose={() => setConfirmClear(false)}>
      <DialogTitle>Clear all item goals</DialogTitle>
      <DialogContent>
        <DialogContentText>{`Remove all ${pageGoals.length} item and greenstack goals?`}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setConfirmClear(false)}>Cancel</Button>
        <Button color={'error'} onClick={() => {
          removeWithUndo(pageGoals.map(({ id }) => id), 'Item goals cleared');
          setConfirmClear(false);
        }} autoFocus>Confirm</Button>
      </DialogActions>
    </Dialog>
    {fileImport.text !== null ? (
      <ImportDialog text={fileImport.text} onClose={fileImport.close} only={isItemGoal} noun="item goal"/>
    ) : null}
    <NoticeStack>
      {enabled ? <GreenstackFoldNotice/> : null}
      {undoSnackbar}
      {result ? (
        <NoticeSnackbar key={noticeCount} label={result.message} stacked
                        autoHideDuration={result.severity === 'error' ? 10000 : 4000} onClose={() => setResult(null)}/>
      ) : null}
    </NoticeStack>
  </>);
};

export default MaterialTracker;
