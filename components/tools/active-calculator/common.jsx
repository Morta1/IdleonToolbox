import { Box, Divider, Stack, Typography, useMediaQuery } from '@mui/material';
import Tooltip from '@components/Tooltip';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import React from 'react';

export const Section = ({ title, tooltip, extra, children, topDivider = true }) => {
  const isMd = useMediaQuery((theme) => theme.breakpoints.down('lg'), { noSsr: true });

  return <>
    {topDivider ? <Divider sx={{ my: 2 }}/> : null}
    <Stack direction={'row'} alignItems={'center'} gap={1} mb={2}>
      <Typography variant={'h6'}>{title}</Typography>
      {tooltip ? <Tooltip
        title={tooltip}>
        <IconInfoCircleFilled/>
      </Tooltip> : null}
    </Stack>
    {extra ? <Box my={1}>
      {extra}
    </Box> : null}
    <Stack direction={isMd ? 'column' : 'row'} gap={1} flexWrap={'wrap'}
           divider={isMd ? null : <Divider flexItem orientation={'vertical'} sx={{ mx: 2 }}/>}>
      {children}
    </Stack>
  </>
};