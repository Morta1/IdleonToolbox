import { Stack, Typography } from '@mui/material';
import { cleanUnderscore, prefix } from '@utility/helpers';
import { format, isValid } from 'date-fns';
import React from 'react';
import styled from '@emotion/styled';

const WeeklyBossSimple = ({ bossName, date }) => {
  return <>
    <Stack sx={{ width: '100%' }} direction={'row'} alignItems={'center'} gap={2}>
      <IconImg src={`${prefix}etc/${bossName}.png`} alt="boss-icon"/>
      <Typography>{cleanUnderscore(bossName)}</Typography>
    </Stack>
    {isValid(date) ? format(date, 'dd/MM/yyyy HH:mm:ss') : null}
  </>
};


const IconImg = styled.img`
  width: 35px;
  height: 35px;
  object-fit: contain;
`;

export default WeeklyBossSimple;
