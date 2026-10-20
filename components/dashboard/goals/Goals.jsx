import React, { useContext, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Box, Button, Card, CardContent, Divider, Link as MuiLink, Stack, Typography } from '@mui/material';
import { AppContext } from '@components/common/context/AppProvider';
import { useGoals } from '@components/goals/GoalsProvider';
import { useMaterialTrackerMigration } from '@components/goals/useMaterialTrackerMigration';
import { getDescriptor } from '@utility/goals/registry';
import { GOAL_ROUTES } from '@utility/goals/routes';
import { openFirst, resolveGoals } from '@utility/goals/resolve';
import { isCharScope } from '@utility/goals/store';
import { sessionQuery } from '@utility/nav-query';
import { exportGoals } from '@utility/goals/importExport';
import { handleDownload } from '@utility/helpers';
import { trackEvent } from '@utility/analytics';
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

const Goals = () => {
  const router = useRouter();
  const { state } = useContext(AppContext);
  const { enabled, goals, remove, removeMany } = useGoals();
  const [editing, setEditing] = useState(null);
  const [importText, setImportText] = useState(null);
  const fileInput = useRef(null);
  const { overCap } = useMaterialTrackerMigration();
  if (!enabled) return null;

  const views = resolveGoals(goals, { account: state?.account, characters: state?.characters });
  const reached = views.filter(({ status }) => status === 'reached');
  const groups = groupViews(views);

  const onEdit = (view, anchorEl) => {
    const goal = goals.find(({ id }) => id === view.id);
    const descriptor = getDescriptor(view.system);
    if (goal && descriptor) setEditing({ anchorEl, goal, descriptor });
  };

  const onRemove = (view) => {
    remove(view.id);
    trackEvent('goal_removed', { system: view.system, kind: view.kind, source: 'dashboard' });
  };

  const clearReached = () => {
    removeMany(reached.map(({ id }) => id));
    reached.forEach(({ system, kind }) => trackEvent('goal_removed', { system, kind, source: 'dashboard' }));
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
    <Card sx={{ width: '100%', maxWidth: 760 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" gap={2} flexWrap="wrap" sx={{ mb: 1 }}>
          <Typography component="h2" variant="h6">Goals</Typography>
          {views.length ? (
            <Typography variant="body2" color="text.secondary">
              {`${reached.length} of ${views.length} reached`}
            </Typography>
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
          <Stack divider={<Divider/>} gap={1.5}>
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
          </Stack>
        )}
      </CardContent>
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
