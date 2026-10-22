import React, { useContext, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useLocalStorage } from '@mantine/hooks';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Menu,
  MenuItem,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material';
import { IconArrowsSort, IconChevronDown, IconChevronRight, IconTargetArrow } from '@tabler/icons-react';
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
import { NoticeStack } from '@components/common/NoticeSnackbar';
import { goalsFileName, useGoalsFileImport, useGoalsUndo } from '@components/goals/goalListHelpers';

const GoalPopover = dynamic(() => import('@components/goals/GoalPopover'), { ssr: false });

// A few places to start; every page with goals has the Add goal button
const STARTER_PAGES = [
  ['Stamps', GOAL_ROUTES.stamp, 'data/StampA34'],
  ['Bubbles', GOAL_ROUTES.bubble, 'data/aBrewOptionA0'],
  ['Meals', GOAL_ROUTES.meal, 'data/CookingMB0'],
  ['Bribes', GOAL_ROUTES.bribe, 'etc/Bribe'],
  ['Talents', GOAL_ROUTES.talent, 'data/UISkillIcon1']
];

const SORTS = [
  { id: 'closest', label: 'Closest first' },
  { id: 'recent', label: 'Recently added' },
  { id: 'system', label: 'System' }
];
const SORT_KEY = 'goals-dashboard-sort';
const LAYOUTS = [
  { id: 'rows', label: 'Rows' },
  { id: 'cards', label: 'Cards' }
];
const LAYOUT_KEY = 'goals-dashboard-layout';
// a phone gets a 40px tap target
const LAYOUT_BUTTON_SX = (theme) => ({
  textTransform: 'none',
  py: 0,
  px: 1,
  fontSize: 13,
  minHeight: 40,
  [theme.breakpoints.up('sm')]: { minHeight: 'auto' }
});
// Stretches to the Rows / Cards toggle beside it, with its own padding and a gap after the icon
const SORT_CHIP_SX = {
  fontSize: 13,
  height: 'auto',
  minHeight: 'auto',
  px: '11px',
  py: '5px',
  '& .MuiChip-icon': { ml: 0, mr: '6px' },
  '& .MuiChip-label': { px: 0 }
};
// More systems than this fold into a "+k" chip
const SYSTEM_CHIPS = 5;

const CHIP_SX = { fontSize: 13 };

// Looks like the header button but does nothing: it only shows where to click
const AddGoalReplica = () => (
  <Box component="span" sx={{
    display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1, py: '2px', borderRadius: 1, color: 'primary.main',
    bgcolor: 'action.hover', verticalAlign: 'middle', fontSize: 13
  }}>
    <IconTargetArrow size={16}/>
    <span>Add goal</span>
  </Box>
);

const EmptyState = ({ query }) => (
  <Stack direction="row" gap={2} alignItems="flex-start">
    <Box sx={{
      width: 36, height: 36, borderRadius: 1.5, flexShrink: 0, display: 'flex', alignItems: 'center',
      justifyContent: 'center', bgcolor: 'action.selected', color: 'primary.main'
    }}>
      <IconTargetArrow size={22}/>
    </Box>
    <Stack gap={1} sx={{ minWidth: 0 }}>
      <Typography fontWeight={600}>Set your first goal</Typography>
      <Typography variant="body2" color="text.secondary">
        Pick something you&apos;re working toward, like a stamp level, all meals to Lv 100 or a bribe, and track it here.
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Use <AddGoalReplica/> in the top bar of any page, or start with:
      </Typography>
      <Stack direction="row" gap={1} flexWrap="wrap">
        {STARTER_PAGES.map(([label, route, icon]) => (
          <Chip key={route} component={Link} href={{ pathname: route, query: sessionQuery(query) }} clickable
                variant="outlined" label={label} sx={CHIP_SX}
                icon={<GoalIcon src={icon} alt="" size={20}/>}/>
        ))}
      </Stack>
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

const sortViews = (views, sort, createdAtOf) => {
  if (sort === 'recent') return stableSort(views, (a, b) => createdAtOf(b) - createdAtOf(a));
  if (sort === 'system') return views;
  return stableSort(views, (a, b) => closenessRank(a) - closenessRank(b) || (b.progress ?? 0) - (a.progress ?? 0));
};

// One chip per system in registry order, with its goal count
const systemsOf = (views) => {
  const systems = new Map();
  for (const view of views) {
    const entry = systems.get(view.system) ?? { system: view.system, label: view.label, count: 0 };
    entry.count += 1;
    systems.set(view.system, entry);
  }
  return [...systems.values()];
};

const Goals = () => {
  const router = useRouter();
  const { state } = useContext(AppContext);
  const { enabled, goals } = useGoals();
  const [editing, setEditing] = useState(null);
  const [systemFilter, setSystemFilter] = useState('');
  const [sortMenu, setSortMenu] = useState(null);
  const [moreMenu, setMoreMenu] = useState(null);
  const [reachedOpen, setReachedOpen] = useState(false);
  const [sort, setSort] = useLocalStorage({ key: SORT_KEY, defaultValue: 'closest' });
  const [layout, setLayout] = useLocalStorage({ key: LAYOUT_KEY, defaultValue: 'rows' });
  const { removeWithUndo: removeIds, undoSnackbar } = useGoalsUndo();
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
  const sortId = SORTS.some(({ id }) => id === sort) ? sort : SORTS[0].id;
  const open = sortViews(filtered.filter(({ status }) => status !== 'reached'), sortId, createdAtOf);
  const shownReached = sortViews(filtered.filter(({ status }) => status === 'reached'), sortId, createdAtOf);
  const layoutId = LAYOUTS.some(({ id }) => id === layout) ? layout : LAYOUTS[0].id;

  let shownSystems = systems.slice(0, SYSTEM_CHIPS);
  if (activeSystem && !shownSystems.some(({ system }) => system === activeSystem)) {
    shownSystems = [...systems.slice(0, SYSTEM_CHIPS - 1), systems.find(({ system }) => system === activeSystem)];
  }
  const hiddenSystems = systems.filter((entry) => !shownSystems.includes(entry));

  const onEdit = (view, anchorEl) => {
    const goal = goals.find(({ id }) => id === view.id);
    const descriptor = getDescriptor(view.system);
    if (goal && descriptor) setEditing({ anchorEl, goal, descriptor });
  };

  // A range view stands for two goals, so it removes both
  const removeWithUndo = (removedViews, label) => {
    removeIds(removedViews.flatMap((view) => view.goalIds ?? [view.id]), label);
    removedViews.forEach(({ system, kind }) => trackEvent('goal_removed', { system, kind, source: 'dashboard' }));
  };

  const onRemove = (view) => removeWithUndo([view], 'Goal removed');

  const clearReached = () => removeWithUndo(shownReached, `${plural(shownReached.length, 'reached goal')} cleared`);

  const onExport = () => handleDownload(exportGoals(goals, state?.characters), goalsFileName('idleon-goals'));

  const pickSystem = (system) => {
    setSystemFilter(system);
    setMoreMenu(null);
  };
  const systemChip = ({ system, label, count }) => (
    <Chip key={system} size="small" label={`${label} ${formatNumber(count)}`} onClick={() => pickSystem(system)}
          aria-pressed={activeSystem === system} color={activeSystem === system ? 'primary' : 'default'}
          variant={activeSystem === system ? 'filled' : 'outlined'} sx={CHIP_SX}/>
  );

  const goalList = (label, list) => (layoutId === 'cards' ? (
    <GoalGrid label={label}>
      {list.map((view) => <GoalTile key={view.id} view={view} onEdit={onEdit} onRemove={onRemove}/>)}
    </GoalGrid>
  ) : (
    <GoalRows label={label}>
      {list.map((view) => <GoalListRow key={view.id} view={view} onEdit={onEdit} onRemove={onRemove}/>)}
    </GoalRows>
  ));

  return (
    <Card data-section="goals" sx={{ width: '100%' }}>
      <CardContent>
        <Stack direction="row" alignItems="center" columnGap={2} rowGap={0.5} flexWrap="wrap" sx={{ mb: 1.5 }}>
          <Typography component="h2" variant="h6">Goals</Typography>
          {views.length ? (
            <Typography variant="body2" color="text.secondary">
              {`${plural(views.length, 'goal')} · ${formatNumber(reached.length)} reached`}
            </Typography>
          ) : null}
          <Stack direction="row" gap={1} sx={{ ml: 'auto' }}>
            {goals.length ? (
              <Button size="small" sx={{ textTransform: 'none' }} onClick={onExport}>Export</Button>
            ) : null}
            <Button size="small" sx={{ textTransform: 'none' }} onClick={fileImport.pick}>
              Import
            </Button>
            {fileImport.input}
          </Stack>
        </Stack>
        {overCap > 0 ? (
          <Typography variant="body2" color="warning.main" sx={{ mb: 1 }}>
            {`${overCap} tracked materials could not be added (goal limit)`}
          </Typography>
        ) : null}
        {views.length === 0 ? <EmptyState query={router.query}/> : (
          <>
            <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center" sx={{ mb: 1.5 }}>
              <Chip size="small" label={`All ${formatNumber(views.length)}`} onClick={() => pickSystem('')}
                    aria-pressed={!activeSystem} color={!activeSystem ? 'primary' : 'default'}
                    variant={!activeSystem ? 'filled' : 'outlined'} sx={CHIP_SX}/>
              {shownSystems.map(systemChip)}
              {hiddenSystems.length ? (
                <Chip size="small" variant="outlined" label={`+${hiddenSystems.length}`} aria-haspopup="menu"
                      aria-label="More systems"
                      onClick={(e) => setMoreMenu(e.currentTarget)} sx={CHIP_SX}/>
              ) : null}
              <Stack direction="row" gap={1} alignItems="stretch" sx={{ ml: { sm: 'auto' } }}>
                <Chip size="small" variant="outlined" icon={<IconArrowsSort size={14}/>} aria-haspopup="menu"
                      label={SORTS.find(({ id }) => id === sortId).label}
                      onClick={(e) => setSortMenu(e.currentTarget)} sx={SORT_CHIP_SX}/>
                <ToggleButtonGroup size="small" exclusive value={layoutId} aria-label="Goal layout"
                                   onChange={(_, next) => next && setLayout(next)}>
                  {LAYOUTS.map(({ id, label }) => (
                    <ToggleButton key={id} value={id} sx={LAYOUT_BUTTON_SX}>
                      {label}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Stack>
            </Stack>
            <Menu anchorEl={moreMenu} open={!!moreMenu} onClose={() => setMoreMenu(null)}>
              {hiddenSystems.map(({ system, label, count }) => (
                <MenuItem key={system} onClick={() => pickSystem(system)}>{`${label} ${formatNumber(count)}`}</MenuItem>
              ))}
            </Menu>
            <Menu anchorEl={sortMenu} open={!!sortMenu} onClose={() => setSortMenu(null)}>
              {SORTS.map(({ id, label }) => (
                <MenuItem key={id} selected={id === sortId} onClick={() => {
                  setSort(id);
                  setSortMenu(null);
                }}>
                  {label}
                </MenuItem>
              ))}
            </Menu>
            {open.length ? goalList('Goals', open) : (
              <Typography variant="body2" color="text.secondary">Every goal here is reached</Typography>
            )}
            {shownReached.length ? (
              <Box sx={{ mt: 1.5 }}>
                <Stack direction="row" alignItems="center" gap={1}>
                  <Button size="small" aria-expanded={reachedOpen} onClick={() => setReachedOpen(!reachedOpen)}
                          startIcon={reachedOpen ? <IconChevronDown size={16}/> : <IconChevronRight size={16}/>}
                          sx={{ textTransform: 'none' }}>
                    {`Reached (${formatNumber(shownReached.length)})`}
                  </Button>
                  <Button size="small" sx={{ textTransform: 'none' }} onClick={clearReached}>Clear reached</Button>
                </Stack>
                {reachedOpen ? (
                  <Box sx={{ mt: 1 }}>{goalList('Reached goals', shownReached)}</Box>
                ) : null}
              </Box>
            ) : null}
          </>
        )}
      </CardContent>
      <NoticeStack>
        <GreenstackFoldNotice/>
        {undoSnackbar}
      </NoticeStack>
      {fileImport.text !== null ? <ImportDialog text={fileImport.text} onClose={fileImport.close}/> : null}
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
