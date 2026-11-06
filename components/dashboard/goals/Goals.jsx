import React, { useContext, useState } from 'react';
import dynamic from 'next/dynamic';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useLocalStorage } from '@mantine/hooks';
import { Box, Button, Link, Stack, Typography } from '@mui/material';
import { IconChevronDown, IconChevronRight, IconTargetArrow } from '@tabler/icons-react';
import Panel from '@components/common/cards/Panel';
import Toolbar from '@components/common/Toolbar';
import { AppContext } from '@components/common/context/AppProvider';
import { useGoals } from '@components/goals/GoalsProvider';
import { useMaterialTrackerMigration } from '@components/goals/useMaterialTrackerMigration';
import { getDescriptor } from '@utility/goals/registry';
import { GOAL_ROUTES } from '@utility/goals/routes';
import { isUnresolved, pairRanges, resolveGoals } from '@utility/goals/resolve';
import { sessionQuery } from '@utility/nav-query';
import { exportGoals } from '@utility/goals/importExport';
import { handleDownload } from '@utility/helpers';
import { trackEvent } from '@utility/analytics';
import { formatNumber } from '@components/goals/parts/format';
import { GoalIcon } from '@components/goals/parts/GoalVisuals';
import GreenstackFoldNotice from '@components/goals/GreenstackFoldNotice';
import GoalTile, { GoalGrid } from '@components/goals/GoalTile';
import GoalListRow, { GoalRows } from '@components/goals/GoalListRow';
import ImportDialog from './ImportDialog';
import Notice from '@components/common/Notice';
import { goalsFileName, useGoalsFileImport, useGoalsUndo } from '@components/goals/goalListHelpers';

const GoalPopover = dynamic(() => import('@components/goals/GoalPopover'), { ssr: false });

// A few places to start; every page with goals has the Add goal button. The fourth names the system a page with several
// opens Add goal on
const STARTER_PAGES = [
  ['Stamps', GOAL_ROUTES.stamp, 'data/StampA34'],
  ['Bubbles', GOAL_ROUTES.bubble, 'data/aUpgradesG0'],
  ['Meals', GOAL_ROUTES.meal, 'data/ClassIcons51'],
  ['Bribes', GOAL_ROUTES.bribe, 'etc/Bribe'],
  ['Talents', GOAL_ROUTES.talent, 'data/UISkillIcon1', 'talent']
];

const SORTS = [
  ['closest', 'Closest first', 'desc', ['Furthest first', 'Closest first']],
  ['recent', 'Recently added', 'desc', ['Oldest first', 'Newest first']]
];
const DEFAULT_SORT = { key: 'closest', order: 'desc' };
const SORT_KEY = 'goals-dashboard-sort';
const LAYOUTS = [
  ['rows', 'Rows'],
  ['cards', 'Cards']
];
const LAYOUT_KEY = 'goals-dashboard-layout';
// The dashboard leads with the goals closest to done; the rest wait behind Show all so the alerts stay in reach
const SHOWN_GOALS = 8;
const SHOW_ALL_KEY = 'goals-dashboard-show-all';
// Looks like the header button but does nothing: it only shows where to click
const AddGoalReplica = () => (
  <Box component="span" sx={{
    display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1, py: '2px', borderRadius: 1, color: 'primary.main',
    bgcolor: 'action.hover', verticalAlign: 'middle', typography: 'caption'
  }}>
    <IconTargetArrow size={16}/>
    <span>Add goal</span>
  </Box>
);

const StarterLinks = ({ query }) => (
  <Stack direction="row" columnGap={2} rowGap={1} flexWrap="wrap" alignItems="center">
    {STARTER_PAGES.map(([label, route, icon, goal]) => (
      <Link key={route} component={NextLink} href={{ pathname: route, query: { ...sessionQuery(query), ...(goal ? { goal } : {}) } }} variant="body2"
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, minHeight: { xs: 44, sm: 'auto' } }}>
        <GoalIcon src={icon} alt="" size={24}/>{label}
      </Link>
    ))}
  </Stack>
);

// The first-run block: what goals are and where to start.
const FirstGoalIntro = ({ query }) => (
  <Stack direction="row">
    <Stack gap={1} sx={{ minWidth: 0 }}>
      <Typography variant="cardTitle" component="h3">Set your first goal</Typography>
      <Typography variant="body2" color="text.secondary">
        Pick something you&apos;re working toward, like a stamp level, all meals to Lv 100 or a bribe, and track it here.
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Use <AddGoalReplica/> beside a page&apos;s title, or start with:
      </Typography>
      <StarterLinks query={query}/>
      <Typography variant="caption" color="text.secondary">
        Items from the material tracker show up here automatically.
      </Typography>
    </Stack>
  </Stack>
);

const plural = (n, word) => `${formatNumber(n)} ${word}${n === 1 ? '' : 's'}`;

// Keeps the given order for ties
const stableSort = (views, compare) => views
  .map((view, index) => ({ view, index }))
  .sort((a, b) => compare(a.view, b.view) || a.index - b.index)
  .map(({ view }) => view);

// Nearest its target first; goals without a bar (watch) and missing ones after
const closenessRank = (view) => {
  if (isUnresolved(view)) return 2;
  return view.progress == null ? 1 : 0;
};

const sortViews = (views, { key, order }, createdAtOf) => {
  const sign = order === 'asc' ? -1 : 1;
  const sorted = key === 'recent'
    ? stableSort(views, (a, b) => sign * (createdAtOf(b) - createdAtOf(a)))
    : stableSort(views, (a, b) => closenessRank(a) - closenessRank(b) || sign * ((b.progress ?? 0) - (a.progress ?? 0)));
  // Pinned goals lead under either sort, ahead of the cap on how many show
  return stableSort(sorted, (a, b) => Number(b.pinned) - Number(a.pinned));
};

// One option per system with its goal count, the most tracked first
const systemsOf = (views) => {
  const systems = new Map();
  for (const view of views) {
    const entry = systems.get(view.system) ?? { system: view.system, label: view.label, count: 0 };
    entry.count += 1;
    systems.set(view.system, entry);
  }
  return stableSort([...systems.values()], (a, b) => b.count - a.count);
};

const Goals = () => {
  const router = useRouter();
  const { state } = useContext(AppContext);
  const { enabled, goals, saveMany } = useGoals();
  const [editing, setEditing] = useState(null);
  const [systemFilter, setSystemFilter] = useState('');
  const [reachedOpen, setReachedOpen] = useState(false);
  const [showAll, setShowAll] = useLocalStorage({ key: SHOW_ALL_KEY, defaultValue: false });
  // Saved before the direction existed as the sort's name alone: that sort, in its one direction
  const [sort, setSort] = useLocalStorage({ key: SORT_KEY, defaultValue: 'closest' });
  const [layout, setLayout] = useLocalStorage({ key: LAYOUT_KEY, defaultValue: 'rows' });
  const { removeWithUndo: removeIds } = useGoalsUndo();
  const fileImport = useGoalsFileImport();
  const { overCap } = useMaterialTrackerMigration();
  if (!enabled) return null;

  const views = pairRanges(resolveGoals(goals, { account: state?.account, characters: state?.characters }));
  const reached = views.filter(({ status }) => status === 'reached');
  const systems = systemsOf(views);
  // A filter on a system whose goals are all gone falls back to All
  const activeSystem = systems.some(({ system }) => system === systemFilter) ? systemFilter : '';
  const filtered = activeSystem ? views.filter(({ system }) => system === activeSystem) : views;
  const createdAt = new Map(goals.map(({ id, createdAt: at }) => [id, at ?? 0]));
  const createdAtOf = (view) => Math.max(...(view.goalIds ?? [view.id]).map((id) => createdAt.get(id) ?? 0));
  const sortKey = typeof sort === 'string' ? sort : sort?.key;
  const shownSort = SORTS.some(([key]) => key === sortKey)
    ? { key: sortKey, order: sort?.order === 'asc' ? 'asc' : 'desc' } : DEFAULT_SORT;
  const open = sortViews(filtered.filter(({ status }) => status !== 'reached'), shownSort, createdAtOf);
  const shownReached = sortViews(filtered.filter(({ status }) => status === 'reached'), shownSort, createdAtOf);
  const layoutId = LAYOUTS.some(([key]) => key === layout) ? layout : LAYOUTS[0][0];
  const cardsShown = layoutId === 'cards';

  const onEdit = (view) => {
    const goal = goals.find(({ id }) => id === view.id);
    const descriptor = getDescriptor(view.system);
    if (goal && descriptor) setEditing({ goal, descriptor });
  };

  // A range view stands for two goals, so pinning it pins both
  const onTogglePin = (view) => {
    const ids = view.goalIds ?? [view.id];
    saveMany(goals.filter(({ id }) => ids.includes(id)).map((goal) => ({ ...goal, pinned: !view.pinned })));
  };

  // A range view stands for two goals, so it removes both
  const removeWithUndo = (removedViews, label) => {
    removeIds(removedViews.flatMap((view) => view.goalIds ?? [view.id]), label);
    removedViews.forEach(({ system, kind }) => trackEvent('goal_removed', { system, kind, source: 'dashboard' }));
  };

  const onRemove = (view) => removeWithUndo([view], 'Goal removed');

  const clearReached = () => removeWithUndo(shownReached, `${plural(shownReached.length, 'reached goal')} cleared`);

  const onExport = () => handleDownload(exportGoals(goals, state?.characters), goalsFileName('idleon-goals'));

  const rows = (label, list) => (
    <GoalRows label={label} lined>
      {list.map((view) => <GoalListRow key={view.id} view={view} onEdit={onEdit} onRemove={onRemove} onTogglePin={onTogglePin}/>)}
    </GoalRows>
  );
  const goalList = (label, list) => (cardsShown ? (
    <Box sx={{ p: 2 }}>
      <GoalGrid label={label}>
        {list.map((view) => <GoalTile key={view.id} view={view} onEdit={onEdit} onRemove={onRemove} onTogglePin={onTogglePin}/>)}
      </GoalGrid>
    </Box>
  ) : rows(label, list));

  return (
    <Box data-section="goals" data-tour="goals">
      <Panel icon={<Box component="span" sx={{ display: 'inline-flex', color: 'primary.main' }}><IconTargetArrow size={24}/></Box>}
             title={'Goals'} meta={views.length ? `${plural(views.length, 'goal')} · ${formatNumber(reached.length)} reached` : undefined}
             asideOwnRow
             aside={<Stack direction="row" gap={1}>
               {goals.length ? <Button size="small" onClick={onExport}>Export</Button> : null}
               <Button size="small" onClick={fileImport.pick}>Import</Button>
               {fileImport.input}
             </Stack>}>
      {/* One box, so the Toolbar pins over the list it controls and leaves with it */}
      <Box>
        {/* The material tracker migration's two messages, together, as notes */}
        <GreenstackFoldNotice sx={{ m: 2 }}/>
        {overCap > 0 ? (
          <Notice tone={'missing'} sx={{ m: 2 }}>{`${overCap} tracked materials could not be added (goal limit).`}</Notice>
        ) : null}
        {views.length === 0 ? <Box sx={{ p: 2 }}><FirstGoalIntro query={router.query}/></Box> : (
          <>
            <Toolbar inPanel state={{ show: activeSystem, sort: shownSort, view: layoutId }}
                     defaults={{ show: '', sort: DEFAULT_SORT, view: LAYOUTS[0][0] }}
                     onChange={({ show, sort: nextSort, view }) => {
                       if (show !== undefined) setSystemFilter(show);
                       if (nextSort !== undefined) setSort(nextSort ?? DEFAULT_SORT);
                       if (view) setLayout(view);
                     }}
                     onReset={() => {
                       setSystemFilter('');
                       setSort(DEFAULT_SORT);
                     }} total={views.length} shown={filtered.length} noun={'goals'}>
              <Toolbar.Show options={[['', 'All', views.length], ...systems.map(({ system, label, count }) => [system, label, count])]}/>
              <Toolbar.Sort options={SORTS}/>
              <Toolbar.View options={LAYOUTS}/>
            </Toolbar>
            {showAll && open.length > SHOWN_GOALS ? (
              <Stack direction="row" alignItems="center" gap={0.5} sx={{ px: 2, py: 0.5, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary">
                  {`Showing all ${formatNumber(open.length)}`}
                </Typography>
                <Typography variant="body2" color="text.secondary" aria-hidden>·</Typography>
                <Button size="small" aria-expanded onClick={() => setShowAll(false)}
                        sx={{ minWidth: 0, py: 0 }}>
                  Show fewer
                </Button>
              </Stack>
            ) : null}
            {open.length ? goalList('Goals', showAll ? open : open.slice(0, SHOWN_GOALS)) : (
              <Notice tone={'info'} sx={{ m: 2 }}>Every goal here is reached: clear them under Reached.</Notice>
            )}
            {open.length > SHOWN_GOALS ? (
              <Box sx={{ px: 1, py: 0.5, borderTop: 1, borderColor: 'divider' }}>
                <Button size="small" aria-expanded={!!showAll} onClick={() => setShowAll(!showAll)}>
                  {showAll ? 'Show fewer' : `Show all ${formatNumber(open.length)} goals`}
                </Button>
              </Box>
            ) : null}
            {shownReached.length ? (
              <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
                <Stack direction="row" alignItems="center" gap={1} sx={{ px: 1, py: 0.5 }}>
                  <Button size="small" aria-expanded={reachedOpen} onClick={() => setReachedOpen(!reachedOpen)}
                          startIcon={reachedOpen ? <IconChevronDown size={16}/> : <IconChevronRight size={16}/>}
                         >
                    {`Reached (${formatNumber(shownReached.length)})`}
                  </Button>
                  <Button size="small" onClick={clearReached}>Clear reached</Button>
                </Stack>
                {reachedOpen ? (
                  <Box sx={{ borderTop: 1, borderColor: 'divider' }}>{goalList('Reached goals', shownReached)}</Box>
                ) : null}
              </Box>
            ) : null}
          </>
        )}
      </Box>
      </Panel>
      {fileImport.text !== null ? <ImportDialog text={fileImport.text} onClose={fileImport.close}/> : null}
      {editing ? (
        <GoalPopover open onClose={() => setEditing(null)}
                     systems={[editing.descriptor]}
                     initial={{ system: editing.goal.system, key: editing.goal.key, scope: editing.goal.scope, goal: editing.goal }}
                     source="dashboard"/>
      ) : null}
    </Box>
  );
};

export default Goals;
