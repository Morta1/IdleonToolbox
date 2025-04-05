import React from 'react';
import { Box, CircularProgress, Typography, Stack } from '@mui/material';
import { prefix } from '../../utility/helpers';

/**
 * A simple centered loader with an optional message
 */
const SimpleLoader = ({ message = 'Loading data...' }) => {
  return (
    <Box 
      sx={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '300px'
      }}
    >
      <Stack spacing={2} alignItems="center">
        <img src={`${prefix}etc/Coins.gif`} width={40} height={40} alt="" />
        <Typography variant="body1" color="text.secondary">
          {message}
        </Typography>
      </Stack>
    </Box>
  );
};

export default SimpleLoader; 