import React from 'react';
import { Skeleton, Stack, Typography } from '@mui/material';
import { WIDEST } from './DataAge';

// The signed-in bar's right end while the session loads, at its loaded size: the account button, then the name over the
// data's age, whose line always takes its widest form's width.
const AuthSkeleton = () => {
  return (
    <Stack direction="row" alignItems="center" sx={{ ml: 1, minWidth: 0 }}>
      <Skeleton variant="rounded" width={34} height={32} sx={{ flexShrink: 0, borderRadius: '16px' }}/>
      <Stack sx={{ px: 1, minWidth: 0 }}>
        <Typography variant={'body2'} component={'div'}><Skeleton width={90}/></Typography>
        <Typography variant={'caption'} component={'div'}><Skeleton sx={{ maxWidth: '100%' }}><span>{WIDEST}</span></Skeleton></Typography>
      </Stack>
    </Stack>
  );
};

export default AuthSkeleton;
