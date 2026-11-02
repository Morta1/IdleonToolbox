import { Box, LinearProgress, Typography } from '@mui/material';
import React from 'react';
import { NoteTrigger } from '@components/common/InfoButton';

// tooltipTitle is the bar's note ("x / y cap"): a hover previews it, a click or a tap pins it.
const ProgressBar = ({ percent, bgColor, label = true, labelText, sx, boxSx = {}, pre, tooltipTitle = '' }) => {
  const bar = <LinearProgress
    sx={{
      width: '100%',
      height: 10,
      borderRadius: 5,
      '& .MuiLinearProgress-bar': {
        backgroundColor: bgColor || ''
      },
      ...sx
    }}
    variant="determinate"
    value={percent > 100 ? 100 : percent}
  />;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', ...boxSx }}>
      {pre}
      <Box sx={{ width: '100%', mr: label ? 1 : 0 }}>
        {tooltipTitle
          ? <NoteTrigger note={tooltipTitle} label={typeof labelText === 'string' ? labelText : 'Progress'} block>{bar}</NoteTrigger>
          : bar}
      </Box>
      {label ? <Box>
        <Typography noWrap variant="body2">{labelText ?? `${Math.round(percent)}%`}</Typography>
      </Box> : null}
    </Box>
  );
};

export default ProgressBar;
