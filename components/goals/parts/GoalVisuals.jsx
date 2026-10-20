import React from 'react';
import { Box, LinearProgress } from '@mui/material';
import { prefix } from '@utility/helpers';

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
