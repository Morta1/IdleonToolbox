import React from 'react';
import { Box, LinearProgress, Stack, Typography } from '@mui/material';
import { IconCheck } from '@tabler/icons-react';
import { prefix } from '@utility/helpers';
import { progressPercent, statusText } from './format';

export const GoalIcon = ({ src, alt, size = 28 }) => (
  <Box sx={{ width: size, height: size, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    {src ? <Box component="img" src={`${prefix}${src}.png`} alt={alt}
                sx={{ maxWidth: size, maxHeight: size, objectFit: 'contain' }}/> : null}
  </Box>
);

export const GoalBar = ({ progress, reached, sx }) => (
  <LinearProgress variant="determinate" value={Math.round((progress ?? 0) * 100)}
                  color={reached ? 'success' : 'primary'} sx={{ height: 4, borderRadius: 2, ...sx }}/>
);

// The thin bar with its percent beside it
export const GoalProgress = ({ view, sx }) => {
  const reached = view.status === 'reached';
  return (
    <Stack direction="row" alignItems="center" gap={1} sx={sx}>
      <GoalBar progress={view.progress} reached={reached} sx={{ flex: 1, minWidth: 40 }}/>
      <Typography variant="caption" color={reached ? 'success.main' : 'text.secondary'}
                  sx={{ minWidth: 36, textAlign: 'right' }}>
        {progressPercent(view)}
      </Typography>
    </Stack>
  );
};

// "At least Lv 100 · 38"; a reached goal gets a check
export const GoalStatus = ({ view, sx }) => {
  const reached = view.status === 'reached';
  let color = 'text.primary';
  if (reached) color = 'success.main';
  else if (view.status === 'missing') color = 'text.secondary';
  return (
    <Typography variant="body2" component="span" data-goal-text color={color}
                sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, ...sx }}>
      {reached ? <IconCheck size={16} aria-hidden style={{ flexShrink: 0 }}/> : null}
      {statusText(view)}
    </Typography>
  );
};
