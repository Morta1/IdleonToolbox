import React, { useContext, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Box, Button, Card, CardContent, Link as MuiLink, Stack, Typography } from '@mui/material';
import { AppContext } from '@components/common/context/AppProvider';
import { useGoals } from '@components/goals/GoalsProvider';
import { useMaterialTrackerMigration } from '@components/goals/useMaterialTrackerMigration';
import { getDescriptor } from '@utility/goals/registry';
import { GOAL_ROUTES } from '@utility/goals/routes';
import { closestGoal, openFirst, pairRanges, resolveGoals } from '@utility/goals/resolve';
import { isCharScope } from '@utility/goals/store';
import { sessionQuery } from '@utility/nav-query';
import { exportGoals } from '@utility/goals/importExport';
import { handleDownload } from '@utility/helpers';
import { trackEvent } from '@utility/analytics';
import { formatNumber, goalName, progressPercent } from '@components/goals/parts/format';
import UndoSnackbar from '@components/dashboard/settings/UndoSnackbar';
import GoalRow from './GoalRow';
import ImportDialog, { READ_ERROR } from './ImportDialog';

const GoalPopover = dynamic(() => import('@components/goals/GoalPopover'), { ssr: false });

const groupViews = (views) => {
  const groups = [];
  const byTitle = new Map();
  for (const view of views) {
    const title = isCharScope(view.scope) ? String(view.scope.char) : view.label;
    if (!byTitle.has(title)) {
      const group = { title, views: [] };
      byTitle.set(title, group);
      groups.push(group);
    }
    byTitle.get(title).views.push(view);
  }
  // a character group mixes systems, so resolve's order alone would mix reached goals in
  for (const group of groups) group.views = openFirst(group.views);
  return groups;
};

// A few places to start; every page with goals has the Add goal button
const STARTER_PAGES = [
  ['Bubbles', GOAL_ROUTES.bubble],
  ['Stamps', GOAL_ROUTES.stamp],
  ['Talents', GOAL_ROUTES.talent],
  ['Material tracker', GOAL_ROUTES.item],
  ['Grimoire', GOAL_ROUTES.grimoire]
];

const EmptyState = ({ query }) => (
  <Stack gap={1}>
    <Typography color="text.secondary">Add goals from any page with the Add goal button</Typography>
    <Stack direction="row" gap={2} flexWrap="wrap">
      {STARTER_PAGES.map(([label, route]) => (
        <MuiLink key={route} component={Link} href={{ pathname: route, query: sessionQuery(query) }}
                 underline="hover">
          {label}
        </MuiLink>
      ))}
    </Stack>
  </Stack>
);

// Never null: React Compiler reads the fields a callback uses while memoizing it, before any null check runs
const NO_UNDO = { label: '', goals: [] };

const plural = (n, word) => `${formatNumber(n)} ${word}${n === 1 ? '' : 's'}`;

// "3 goals · 1 reached · closest: Roid Ragin 80%"
const summaryText = (views, reachedCount) => {
  const parts = [plural(views.length, 'goal'), `${formatNumber(reachedCount)} reached`];
  const closest = closestGoal(views);
  if (closest) parts.push(`closest: ${goalName(closest)} ${progressPercent(closest)}`);
  return parts.join(' · ');
};

const Goals = () => {
  const router = useRouter();
  const { state } = useContext(AppContext);
  const { enabled, goals, removeMany, saveMany } = useGoals();
  const [editing, setEditing] = useState(null);
  // The removed goals, restored as they were (ids and createdAt kept)
  const [undo, setUndo] = useState(NO_UNDO);
  // Keys the snackbar so a second removal restarts its timer
  const [undoCount, setUndoCount] = useState(0);
  const [importText, setImportText] = useState(null);
  const fileInput = useRef(null);
  const { overCap } = useMaterialTrackerMigration();
  if (!enabled) return null;

  const views = pairRanges(resolveGoals(goals, { account: state?.account, characters: state?.characters }));
  const reached = views.filter(({ status }) => status === 'reached');
  const groups = groupViews(views);

  const onEdit = (view, anchorEl) => {
    const goal = goals.find(({ id }) => id === view.id);
    const descriptor = getDescriptor(view.system);
    if (goal && descriptor) setEditing({ anchorEl, goal, descriptor });
  };

  const removeWithUndo = (removedViews, label) => {
    const ids = new Set(removedViews.flatMap((view) => view.goalIds ?? [view.id]));
    removeMany([...ids]);
    removedViews.forEach(({ system, kind }) => trackEvent('goal_removed', { system, kind, source: 'dashboard' }));
    setUndo({ label, goals: goals.filter(({ id }) => ids.has(id)) });
    setUndoCount(undoCount + 1);
  };

  const onRemove = (view) => removeWithUndo([view], 'Goal removed');

  const clearReached = () => removeWithUndo(reached, `${plural(reached.length, 'reached goal')} cleared`);

  const onUndo = () => {
    saveMany(undo.goals);
    setUndo(NO_UNDO);
  };

  const onExport = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    handleDownload(exportGoals(goals, state?.characters), `idleon-goals-${stamp}`);
  };

  const onFile = (event) => {
    const [file] = event.target.files;
    // Cleared so picking the same file again still fires onChange
    event.target.value = '';
    if (!file) return;
    file.text().then(setImportText, () => setImportText(READ_ERROR));
  };

  return (
    <Card data-section="goals" sx={{ width: '100%' }}>
      <CardContent>
        <Stack direction="row" alignItems="center" gap={2} flexWrap="wrap" sx={{ mb: 1 }}>
          <Typography component="h2" variant="h6">Goals</Typography>
          {views.length ? (
            <Typography variant="body2" color="text.secondary">{summaryText(views, reached.length)}</Typography>
          ) : null}
          <Stack direction="row" gap={1} flexWrap="wrap" sx={{ ml: 'auto' }}>
            {reached.length ? (
              <Button size="small" sx={{ textTransform: 'none' }} onClick={clearReached}>
                Clear reached
              </Button>
            ) : null}
            {goals.length ? (
              <Button size="small" sx={{ textTransform: 'none' }} onClick={onExport}>Export</Button>
            ) : null}
            <Button size="small" sx={{ textTransform: 'none' }} onClick={() => fileInput.current?.click()}>
              Import
            </Button>
            <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={onFile}
                   aria-label="Goals file"/>
          </Stack>
        </Stack>
        {overCap > 0 ? (
          <Typography variant="body2" color="warning.main" sx={{ mb: 1 }}>
            {`${overCap} tracked materials could not be added (goal limit)`}
          </Typography>
        ) : null}
        {views.length === 0 ? <EmptyState query={router.query}/> : (
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: groups.length > 1 ? 'repeat(2, minmax(0, 1fr))' : 'minmax(0, 1fr)' },
            columnGap: 4,
            rowGap: 2,
            alignItems: 'start'
          }}>
            {groups.map(({ title, views: rows }) => (
              <Box key={title}>
                <Typography component="h3" variant="subtitle2" color="text.secondary">{title}</Typography>
                <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
                  {rows.map((view) => (
                    <GoalRow key={view.id} view={view} onEdit={onEdit} onRemove={onRemove}/>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
      {undo.goals.length ? (
        <UndoSnackbar key={undoCount} label={undo.label} onUndo={onUndo} onClose={() => setUndo(NO_UNDO)}/>
      ) : null}
      {importText !== null ? <ImportDialog text={importText} onClose={() => setImportText(null)}/> : null}
      {editing ? (
        <GoalPopover anchorEl={editing.anchorEl} open onClose={() => setEditing(null)}
                     systems={[editing.descriptor]}
                     initial={{ system: editing.goal.system, key: editing.goal.key, scope: editing.goal.scope, goal: editing.goal }}
                     source="dashboard"/>
      ) : null}
    </Card>
  );
};

export default Goals;
