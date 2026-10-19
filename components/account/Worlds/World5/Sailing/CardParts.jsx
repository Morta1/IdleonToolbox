import React from 'react';
import { Stack, Typography } from '@mui/material';

export const SectionLabel = ({ children }) => <Typography variant={'caption'} component={'p'} color={'text.secondary'}
                                                    mb={0.5}>{children}</Typography>;

export const Row = ({ label, value, info, secondary }) => {
  return <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'} gap={1}>
    <Typography variant={'body2'} color={secondary ? 'text.secondary' : 'text.primary'}>{label}</Typography>
    <Stack direction={'row'} alignItems={'center'} gap={0.5}>
      <Typography variant={'body2'} color={secondary ? 'text.secondary' : 'text.primary'}>{value}</Typography>
      {info}
    </Stack>
  </Stack>
}
