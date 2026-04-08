import { Stack, Typography } from '@mui/material';
import { cleanUnderscore, prefix } from '@utility/helpers';
import { isValid } from 'date-fns';
import React from 'react';
import styled from '@emotion/styled';
import useFormatDate from '@hooks/useFormatDate';

const WeeklyBossSimple = ({ bossName, date }) => {
  const formatDate = useFormatDate();
  return <>
    <Stack sx={{ width: '100%' }} direction={'row'} alignItems={'center'} gap={2}>
      <IconImg src={`${prefix}etc/${bossName}.png`} alt="boss-icon"/>
      <Typography>{cleanUnderscore(bossName)}</Typography>
    </Stack>
    {isValid(date) ? formatDate(date) : null}
  </>
};


const IconImg = styled.img`
  width: 35px;
  height: 35px;
  object-fit: contain;
`;

export default WeeklyBossSimple;
