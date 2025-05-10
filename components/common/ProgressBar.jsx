import { Box, LinearProgress, Typography } from '@mui/material';
import React from 'react';
import Tooltip from '@components/Tooltip';

const ProgressBar = ({ percent, bgColor, label = true, sx, boxSx = {}, pre, tooltipTitle = '' }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', ...boxSx }}>
      {pre}
      <Box sx={{ width: '100%', mr: label ? 1 : 0 }}>
        <Tooltip title={tooltipTitle}>
          <LinearProgress
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
          />
        </Tooltip>
      </Box>
      {label ? <Box>
        <Typography variant="body2">{`${Math.round(percent)}%`}</Typography>
      </Box> : null}
    </Box>
  );
};

export default ProgressBar;
