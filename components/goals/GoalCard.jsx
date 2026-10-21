import React from 'react';
import { Button, IconButton, Stack, Typography } from '@mui/material';
import { IconArrowLeft } from '@tabler/icons-react';
import { getDescriptor } from '@utility/goals/registry';
import { capitalizeFirst } from '@utility/goals/registry/names';
import { goalName, rangeBoundText } from './parts/format';
import { GoalIcon, GoalProgress, GoalStatus } from './parts/GoalVisuals';

// "Bubble" for one entry, the system ("Bubbles") for an all or group goal
const entryLabelOf = (view) => {
  const descriptor = getDescriptor(view.system);
  if (view.kind === 'all') return view.label;
  return capitalizeFirst(String(descriptor?.entryLabel ?? view.label ?? ''));
};

const GoalCard = ({ view, onBack, onEdit, onRemove }) => {
  const missing = view.status === 'missing';
  // A range row edits either of its two goals
  const editable = view.range ? [view.range.lower, view.range.upper] : [view];
  // "Edit at least 500K": only the direction word drops its capital, the amount keeps its K / M
  const editLabel = (part) => {
    if (!view.range) return 'Edit';
    const bound = rangeBoundText(part);
    return `Edit ${bound[0].toLowerCase()}${bound.slice(1)}`;
  };
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
      <Stack gap={0.5}>
        <GoalStatus view={view}/>
        {!missing && view.progress != null ? <GoalProgress view={view}/> : null}
      </Stack>
      <Stack direction="row" gap={1} justifyContent="flex-end" flexWrap="wrap">
        {!missing ? editable.map((part) => (
          <Button key={part.id} size="small" sx={{ textTransform: 'none' }} onClick={() => onEdit(part)}>
            {editLabel(part)}
          </Button>
        )) : null}
        <Button size="small" color="error" onClick={() => onRemove(view)}>Remove</Button>
      </Stack>
    </Stack>
  );
};

export default GoalCard;
