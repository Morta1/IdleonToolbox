import React from 'react';
import { Box, Typography } from '@mui/material';

// A short line of labels that are not states (a kind, a category, a count, a pet's tags): text, never a chip. The
// only pill on the site is a filter you press (Controls board). Items are split by a muted dot, as Notice splits its
// actions. A tag is a string, or { label, color } when one carries a meaning of its own (a simulated pet).
const TagLine = ({ tags, variant = 'caption', sx }) => {
  const shown = tags.filter(Boolean).map((tag) => (typeof tag === 'string' ? { label: tag } : tag));
  if (!shown.length) return null;
  return <Typography component={'span'} variant={variant} color={'text.secondary'}
                     sx={{ display: 'inline-flex', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 0.75, ...sx }}>
    {shown.map(({ label, color }, index) => <React.Fragment key={`${index}-${label}`}>
      {index > 0 ? <Box component={'span'} aria-hidden sx={{ color: 'text.muted' }}>·</Box> : null}
      <Box component={'span'} data-tag sx={color ? { color } : undefined}>{label}</Box>
    </React.Fragment>)}
  </Typography>;
};

export default TagLine;
