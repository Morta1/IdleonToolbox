import React from 'react';
import { Box, Button, IconButton, LinearProgress, Stack, Typography } from '@mui/material';
import { IconArrowLeft } from '@tabler/icons-react';
import { getDescriptor } from '@utility/goals/registry';
import { prefix } from '@utility/helpers';
import { progressText } from './parts/format';

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

export const isCharScope = (scope) => !!scope && typeof scope === 'object';

export const goalName = (view) => (isCharScope(view.scope) ? `${view.name} (${view.scope.char})` : view.name);

// "Bubble" for one entry, the system ("Bubbles") for an all or group goal
const entryLabelOf = (view) => {
  const descriptor = getDescriptor(view.system);
  if (view.kind === 'all') return view.label;
  return capitalize(String(descriptor?.entryLabel ?? view.label ?? ''));
};

export const GoalIcon = ({ src, alt, size = 28 }) => (
  <Box sx={{ width: size, height: size, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    {src ? <Box component="img" src={`${prefix}${src}.png`} alt={alt}
                sx={{ maxWidth: size, maxHeight: size, objectFit: 'contain' }}/> : null}
  </Box>
);

export const GoalBar = ({ progress, reached, sx }) => (
  <LinearProgress variant="determinate" value={Math.round((progress ?? 0) * 100)}
                  color={reached ? 'success' : 'primary'} sx={{ height: 6, borderRadius: 3, ...sx }}/>
);

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
