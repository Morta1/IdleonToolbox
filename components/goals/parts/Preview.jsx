import React from 'react';
import { Typography } from '@mui/material';
import { formatNumber } from './format';

const CLOSEST_SHOWN = 3;

// view: resolveGoal output for the draft 'all' goal
const Preview = ({ view }) => {
  if (!view?.total) return null;
  const closest = view.closest.slice(0, CLOSEST_SHOWN).map(({ name }) => name);
  const text = `${formatNumber(view.met)} of ${formatNumber(view.total)} already there.`;
  return (
    <Typography variant="body2" color="text.secondary">
      {closest.length ? `${text} Closest: ${closest.join(', ')}` : text}
    </Typography>
  );
};

export default Preview;
