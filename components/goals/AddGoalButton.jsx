import React, { useContext, useState } from 'react';
import { useRouter } from 'next/router';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import useMediaQuery from '@mui/material/useMediaQuery';
import AppDialog from '@components/common/Overlays/AppDialog';
import { IconPlus, IconTargetArrow } from '@tabler/icons-react';
import { AppContext } from '@components/common/context/AppProvider';
import { useGoals } from '@components/goals/GoalsProvider';
import { descriptorsForRoute, getDescriptor } from '@utility/goals/registry';
import { openFirst, pairRanges, resolveGoals } from '@utility/goals/resolve';
import { sessionQuery } from '@utility/nav-query';
import { systemForTab } from '@utility/goals/tabs';
import { trackEvent } from '@utility/analytics';
import { notify } from '@components/common/Overlays/notify';
import GoalPopover from './GoalPopover';
import PageGoalsPanel from './PageGoalsPanel';
import GoalCard from './GoalCard';
import { headerActionSx, headerIconActionSx } from '@components/common/NavBar/headerAction';

const stop = (event) => event.stopPropagation();

// Popovers portal out of the NavBar, but React still bubbles their clicks up the component tree
const Contained = ({ children }) => (
  <span style={{ display: 'contents' }} onClick={stop} onMouseDown={stop} onPointerDown={stop}>{children}</span>
);

// Loaded through next/dynamic from the NavBar, only on routes that have goals.
const AddGoalButton = () => {
  const router = useRouter();
  const { state } = useContext(AppContext);
  const { enabled, loaded, goals, removeMany, saveMany } = useGoals();
  const [anchorEl, setAnchorEl] = useState(null);
  // null | 'panel' | 'add' | { edit: goal }
  const [open, setOpen] = useState(null);
  const [cardId, setCardId] = useState(null);
  const isPhone = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const systems = descriptorsForRoute(router?.pathname);
  // Before the stored goals arrive the label would flash Add goal
  if (!enabled || !loaded || !systems.length) return null;

  // Watch goals belong to the material tracker list, not to the page's goals
  const wanted = new Set(systems.map(({ system }) => system));
  const pageGoals = goals.filter((goal) => wanted.has(goal.system) && !goal.watch);
  // resolve orders by system first, which mixes reached goals in with open ones
  const views = openFirst(pairRanges(resolveGoals(pageGoals, { account: state?.account, characters: state?.characters })));
  const reached = views.filter(({ status }) => status === 'reached').length;
  const card = cardId ? views.find(({ id }) => id === cardId) : null;

  const close = () => {
    setOpen(null);
    setCardId(null);
  };

  const onEdit = (view) => {
    const goal = goals.find(({ id }) => id === view.id);
    setCardId(null);
    setOpen(goal ? { edit: goal } : null);
  };

  const dashboardHref = { pathname: '/dashboard', query: sessionQuery(router.query) };
  const onSaved = () => notify('Goal saved', { action: { label: 'View on dashboard', href: dashboardHref } });

  const onRemove = (view) => {
    const ids = new Set(view.goalIds ?? [view.id]);
    // Restored as they were (ids and createdAt kept)
    const removed = goals.filter(({ id }) => ids.has(id));
    removeMany([...ids]);
    notify('Goal removed', { undo: () => saveMany(removed) });
    trackEvent('goal_removed', { system: view.system, kind: view.kind, source: 'header' });
    setCardId(null);
    if (views.length <= 1) setOpen(null);
  };

  const editing = open?.edit;
  const editDescriptor = editing ? getDescriptor(editing.system) : null;
  // The add popover opens on the system of the page tab in view
  const tabSystem = systemForTab(router?.pathname, router?.isReady ? router.query : {}, systems);
  const openAdd = () => setOpen('add');
  // Opening the form swaps the panel for it (never a dialog from a dialog)
  const panel = card ? (
    <GoalCard view={card} onBack={() => setCardId(null)} onEdit={onEdit} onRemove={onRemove}/>
  ) : (
    <PageGoalsPanel views={views} onAdd={openAdd} onOpen={(view) => setCardId(view.id)} onLeave={close}
                    dashboardHref={dashboardHref} titled={!isPhone}/>
  );

  return (
    <>
      <Button sx={headerActionSx}
              startIcon={<IconTargetArrow size={20}/>}
              onClick={(e) => {
                setAnchorEl(e.currentTarget);
                setOpen(views.length ? 'panel' : 'add');
              }}>
        {views.length ? `Goals · ${reached} of ${views.length} reached` : 'Add goal'}
      </Button>
      {views.length ? (
        <IconButton aria-label="Add goal" color="primary" onClick={openAdd} sx={headerIconActionSx}>
          <IconPlus size={20}/>
        </IconButton>
      ) : null}
      <Contained>
        {isPhone ? <AppDialog open={open === 'panel'} onClose={close} size="s" title="Goals on this page">{panel}</AppDialog>
          : <Popover open={open === 'panel'} anchorEl={anchorEl} onClose={close}
                     anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                     transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                     slotProps={{ paper: { sx: { p: 2, width: 380, maxWidth: 'calc(100vw - 32px)' } } }}>
            {panel}
          </Popover>}
        {open === 'add' ? (
          <GoalPopover open onClose={close} onSaved={onSaved} systems={systems} initial={{ system: tabSystem }} source="header"/>
        ) : null}
        {editing && editDescriptor ? (
          <GoalPopover open onClose={close} onSaved={onSaved} systems={[editDescriptor]} initial={{ goal: editing }} source="header"/>
        ) : null}
      </Contained>
    </>
  );
};

export default AddGoalButton;
