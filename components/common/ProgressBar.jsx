import { Box, LinearProgress, Typography } from '@mui/material';
import React from 'react';
import { NoteTrigger } from '@components/common/InfoButton';

// The stat a game line names, without the amount it leads with: "+0% All Monument AFK Gain" is All Monument AFK Gain.
export const statNameOf = (text) => {
  const name = (text ?? '').replace(/^\S*[\d{}$]\S*\s+/, '');
  return name.charAt(0).toUpperCase() + name.slice(1);
};

// tooltipTitle is the bar's note ("x / y cap"): a hover previews it, a click or a tap pins it. noteLabel names that
// note's trigger for a screen reader: the upgrade, chapter or stat the bar measures.
const ProgressBar = ({ percent, bgColor, label = true, labelText, sx, boxSx = {}, pre, tooltipTitle = '', noteLabel }) => {
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
          ? <NoteTrigger note={tooltipTitle} label={noteLabel ?? (typeof labelText === 'string' ? labelText : 'Progress')} block>{bar}</NoteTrigger>
          : bar}
      </Box>
      {label ? <Box>
        <Typography noWrap variant="body2">{labelText ?? `${Math.round(percent)}%`}</Typography>
      </Box> : null}
    </Box>
  );
};

export default ProgressBar;
