import React from 'react';
import { Box, Skeleton, Stack } from '@mui/material';

const AuthSkeleton = () => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        
        {/* User avatar skeleton */}
        <Skeleton variant="circular" width={32} height={32}/>
        
        {/* Name and time skeleton */}
        <Stack>
          <Skeleton variant="text" width={90} height={18}/>
          <Skeleton variant="text" width={70} height={14}/>
        </Stack>
      </Stack>
    </Box>
  );
};

export default AuthSkeleton; 