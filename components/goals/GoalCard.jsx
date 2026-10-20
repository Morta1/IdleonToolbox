import React from 'react';
import { Button, IconButton, Stack, Typography } from '@mui/material';
import { IconArrowLeft } from '@tabler/icons-react';
import { getDescriptor } from '@utility/goals/registry';
import { capitalizeFirst } from '@utility/goals/registry/names';
import { goalName, progressText } from './parts/format';
import { GoalBar, GoalIcon } from './parts/GoalVisuals';

// "Bubble" for one entry, the system ("Bubbles") for an all or group goal
const entryLabelOf = (view) => {
  const descriptor = getDescriptor(view.system);
  if (view.kind === 'all') return view.label;
  return capitalizeFirst(String(descriptor?.entryLabel ?? view.label ?? ''));
};

const GoalCard = ({ view, onBack, onEdit, onRemove }) => {
  const missing = view.status === 'missing';
  const reached = view.status === 'reached';
  return (
    <Stack gap={1.5} data-testid="goal-card">
      <Stack direction="row" alignItems="center" gap={1}>
        <IconButton size="small" aria-label="Back" onClick={onBack} sx={{ ml: -1 }}>
          <IconArrowLeft size={18}/>
        </IconButton>
        <GoalIcon src={view.icon} alt="" size={32}/>
        <Stack sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" noWrap>{goalName(view)}</Typography>
          <Typography variant="caption" color="text.secondary">{entryLabelOf(view)}</Typography>
        </Stack>
      </Stack>
      {missing ? (
        <Typography variant="body2" color="text.secondary">No longer exists</Typography>
      ) : (
        <Stack gap={0.5}>
          <Stack direction="row" justifyContent="space-between" alignItems="baseline" gap={1}>
            <Typography variant="body2" color="text.secondary">{view.metricLabel}</Typography>
            <Typography variant="body2" color={reached ? 'success.main' : 'text.primary'} noWrap>
              {progressText(view)}
            </Typography>
          </Stack>
          {view.progress != null ? <GoalBar progress={view.progress} reached={reached}/> : null}
        </Stack>
      )}
      <Stack direction="row" gap={1} justifyContent="flex-end">
        {!missing ? <Button size="small" onClick={() => onEdit(view)}>Edit</Button> : null}
        <Button size="small" color="error" onClick={() => onRemove(view)}>Remove</Button>
      </Stack>
    </Stack>
  );
};

export default GoalCard;
