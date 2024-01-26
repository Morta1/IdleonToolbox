import { Box, LinearProgress, Typography } from '@mui/material';
import React from 'react';

const ProgressBar = ({ percent, bgColor, label = true, sx, boxSx = {}, pre }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', ...boxSx }}>
      {pre}
      <Box sx={{ width: '100%', mr: label ? 1 : 0 }}>
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
      </Box>
      {label ? <Box>
        <Typography variant="body2" color="text.secondary">{`${Math.round(percent)}%`}</Typography>
      </Box> : null}
    </Box>
  );
};

export default ProgressBar;
