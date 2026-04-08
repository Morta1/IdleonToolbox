import { Stack, Typography } from '@mui/material';
import { cleanUnderscore, eventsColors, prefix } from '@utility/helpers';
import { isValid } from 'date-fns';
import React from 'react';
import styled from '@emotion/styled';
import useFormatDate from '@hooks/useFormatDate';

const RandomEvent = ({ eventName, mapName, date }) => {
  const formatDate = useFormatDate();
  return <>
    <Stack direction={'row'} alignItems={'center'} gap={2}>
      <IconImg src={`${prefix}etc/${eventName}.png`} alt="random-event-icon"/>
      <Typography color={eventsColors?.[eventName]}>{cleanUnderscore(eventName)}</Typography>
    </Stack>
    <Typography>{cleanUnderscore(mapName)}</Typography>
    {isValid(date) ? <Typography variant={'body2'}>Starts: {formatDate(date)}</Typography> : null}
  </>
};


const IconImg = styled.img`
  width: 35px;
  height: 35px;
  object-fit: contain;
`;

export default RandomEvent;
