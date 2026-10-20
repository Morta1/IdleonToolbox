import React, { useContext, useState } from 'react';
import dynamic from 'next/dynamic';
import { ButtonBase, Typography } from '@mui/material';
import { IconTarget, IconTargetArrow } from '@tabler/icons-react';
import { AppContext } from '@components/common/context/AppProvider';
import { useGoals } from '@components/goals/GoalsProvider';
import { getDescriptor } from '@utility/goals/registry';
import { resolveGoal } from '@utility/goals/resolve';
import { createGoal } from '@utility/goals/store';
import { trackEvent } from '@utility/analytics';
import { formatNumber } from './parts/format';

// Only loaded once someone opens it, so a page full of buttons pays nothing for the form.
const GoalPopover = dynamic(() => import('./GoalPopover'), { ssr: false });

// React events bubble through the popover's portal into the host (a card that opens a link on click)
const stop = (event) => event.stopPropagation();

const badgeText = (goal, view) => {
  if (view.tierName) return view.tierName;
  if (goal.target === 'max') return 'Max';
  if (goal.unit === 'percentOfMax') return `${goal.target}%`;
  return formatNumber(view.targetValue ?? goal.target);
};

const SetGoalButton = ({ system, entryKey, scope = 'account', onOpenChange }) => {
  const { state } = useContext(AppContext);
  const { enabled, findEntryGoal, save, remove } = useGoals();
  const [anchorEl, setAnchorEl] = useState(null);
  const [everOpened, setEverOpened] = useState(false);
  if (!enabled) return null;

  const descriptor = getDescriptor(system);
  if (!descriptor) return null;

  const goal = findEntryGoal(system, entryKey, scope);
  const metricId = Object.keys(descriptor.metrics)[0];
  const isBoolean = !!descriptor.metrics[metricId]?.boolean;
  const view = goal ? resolveGoal(goal, { account: state?.account, characters: state?.characters }) : null;
  const badge = !goal ? null : isBoolean ? 'Own it' : badgeText(goal, view);

  const close = () => {
    setAnchorEl(null);
    onOpenChange?.(false);
  };

  const onClick = (event) => {
    // Hosts such as the stamp card open a link on click
    event.stopPropagation();
    if (isBoolean) {
      if (goal) {
        remove(goal.id);
        trackEvent('goal_removed', { system, kind: goal.kind, source: 'entry' });
      } else {
        save(createGoal({ kind: 'entry', system, key: entryKey, scope, metric: metricId, unit: 'value', op: '>=', target: 1 }));
        trackEvent('goal_added', { system, kind: 'entry', source: 'entry' });
      }
      return;
    }
    setEverOpened(true);
    setAnchorEl(event.currentTarget);
    onOpenChange?.(true);
  };

  return (
    <>
      <ButtonBase className={`goal-set-btn${goal ? ' has-goal' : ''}`} onClick={onClick}
                  aria-label={goal ? 'Edit goal' : 'Set goal'}
                  sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, borderRadius: 1, p: 0.25, flexShrink: 0,
                        color: goal ? 'primary.main' : 'text.secondary' }}>
        {goal ? <IconTargetArrow size={16}/> : <IconTarget size={16}/>}
        {badge ? <Typography variant="caption" color="primary" sx={{ whiteSpace: 'nowrap', lineHeight: 1 }}>
          {`▶ ${badge}`}
        </Typography> : null}
      </ButtonBase>
      {everOpened ? <span style={{ display: 'contents' }} onClick={stop} onMouseDown={stop} onPointerDown={stop}>
        <GoalPopover anchorEl={anchorEl} open={!!anchorEl} onClose={close}
                                 systems={[descriptor]} initial={{ system, key: entryKey, scope }}
                                 source="entry"/>
      </span> : null}
    </>
  );
};

export default SetGoalButton;
