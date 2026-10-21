import React, { useContext, useState } from 'react';
import { useRouter } from 'next/router';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MuiLink from '@mui/material/Link';
import Popover from '@mui/material/Popover';
import Snackbar from '@mui/material/Snackbar';
import Link from 'next/link';
import { IconPlus, IconTargetArrow } from '@tabler/icons-react';
import { AppContext } from '@components/common/context/AppProvider';
import { useGoals } from '@components/goals/GoalsProvider';
import { descriptorsForRoute, getDescriptor } from '@utility/goals/registry';
import { openFirst, resolveGoals } from '@utility/goals/resolve';
import { sessionQuery } from '@utility/nav-query';
import { systemForTab } from '@utility/goals/tabs';
import { trackEvent } from '@utility/analytics';
import GoalPopover from './GoalPopover';
import PageGoalsPanel from './PageGoalsPanel';
import GoalCard from './GoalCard';

const stop = (event) => event.stopPropagation();

// Popovers portal out of the NavBar, but React still bubbles their clicks up the component tree
const Contained = ({ children }) => (
  <span style={{ display: 'contents' }} onClick={stop} onMouseDown={stop} onPointerDown={stop}>{children}</span>
);

// Loaded through next/dynamic from the NavBar, only on routes that have goals.
const AddGoalButton = () => {
  const router = useRouter();
  const { state } = useContext(AppContext);
  const { enabled, loaded, goals, remove } = useGoals();
  const [anchorEl, setAnchorEl] = useState(null);
  // null | 'panel' | 'add' | { edit: goal }
  const [open, setOpen] = useState(null);
  const [cardId, setCardId] = useState(null);
  const [savedNotice, setSavedNotice] = useState(false);
  const systems = descriptorsForRoute(router?.pathname);
  // Before the stored goals arrive the label would flash Add goal
  if (!enabled || !loaded || !systems.length) return null;

  // Watch goals belong to the material tracker list, not to the page's goals
  const wanted = new Set(systems.map(({ system }) => system));
  const pageGoals = goals.filter((goal) => wanted.has(goal.system) && !goal.watch);
  // resolve orders by system first, which mixes reached goals in with open ones
  const views = openFirst(resolveGoals(pageGoals, { account: state?.account, characters: state?.characters }));
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

  const onRemove = (view) => {
    remove(view.id);
    trackEvent('goal_removed', { system: view.system, kind: view.kind, source: 'header' });
    setCardId(null);
    if (views.length <= 1) setOpen(null);
  };

  const editing = open?.edit;
  const editDescriptor = editing ? getDescriptor(editing.system) : null;
  const dashboardHref = { pathname: '/dashboard', query: sessionQuery(router.query) };
  // The add popover opens on the system of the page tab in view
  const tabSystem = systemForTab(router?.pathname, router?.isReady ? router.query : {}, systems);
  const openAdd = (e) => {
    setAnchorEl(e.currentTarget);
    setOpen('add');
  };

  return (
    <>
      <Button sx={{ textTransform: 'none' }} startIcon={<IconTargetArrow/>}
              onClick={(e) => {
                setAnchorEl(e.currentTarget);
                setOpen(views.length ? 'panel' : 'add');
              }}>
        {views.length ? `Goals ${reached}/${views.length}` : 'Add goal'}
      </Button>
      {views.length ? (
        <IconButton aria-label="Add goal" color="primary" onClick={openAdd}>
          <IconPlus size={20}/>
        </IconButton>
      ) : null}
      <Contained>
        <Popover open={open === 'panel'} anchorEl={anchorEl} onClose={close}
                 anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                 transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                 slotProps={{ paper: { sx: { p: 2, width: 380, maxWidth: 'calc(100vw - 32px)' } } }}>
          {card ? (
            <GoalCard view={card} onBack={() => setCardId(null)} onEdit={onEdit} onRemove={onRemove}/>
          ) : (
            <PageGoalsPanel views={views} onAdd={() => setOpen('add')} onOpen={(view) => setCardId(view.id)}
                            onLeave={close}
                            dashboardHref={dashboardHref}/>
          )}
        </Popover>
        {open === 'add' ? (
          <GoalPopover anchorEl={anchorEl} open onClose={close} onSaved={() => setSavedNotice(true)} systems={systems}
                       initial={{ system: tabSystem }} source="header" align="right"/>
        ) : null}
        {editing && editDescriptor ? (
          <GoalPopover anchorEl={anchorEl} open onClose={close} onSaved={() => setSavedNotice(true)}
                       systems={[editDescriptor]} initial={{ goal: editing }} source="header" align="right"/>
        ) : null}
        <Snackbar open={savedNotice} autoHideDuration={6000} message="Goal saved"
                  onClose={(e, reason) => {
                    if (reason !== 'clickaway') setSavedNotice(false);
                  }}
                  ContentProps={{ role: 'status', sx: { bgcolor: 'grey.800', color: 'common.white' } }}
                  action={(
                    <MuiLink component={Link} href={dashboardHref} underline="hover" sx={{ px: 1 }}
                             onClick={() => setSavedNotice(false)}>
                      View on dashboard
                    </MuiLink>
                  )}/>
      </Contained>
    </>
  );
};

export default AddGoalButton;
