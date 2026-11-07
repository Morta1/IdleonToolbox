import { Stack, Typography } from '@mui/material';
import { cleanUnderscore } from '@utility/helpers';
import { isValid } from 'date-fns';
import React from 'react';
import useFormatDate from '@hooks/useFormatDate';
import GameIcon from '@components/common/GameIcon';

// The dashboard's random event note (the page draws its own cards): the sprite names the event, so its name takes the
// text color
const RandomEvent = ({ eventName, mapName, date }) => {
  const formatDate = useFormatDate();
  return <Stack gap={0.5}>
    <Stack direction={'row'} alignItems={'center'} gap={1}>
      <GameIcon src={`etc/${eventName}.png`} size={32} alt={''}/>
      <Typography variant={'cardTitle'} component={'div'}>{cleanUnderscore(eventName)}</Typography>
    </Stack>
    <Typography variant={'body2'}>{cleanUnderscore(mapName)}</Typography>
    {isValid(date) ? <Typography variant={'body2'} color={'text.secondary'}>{`Starts ${formatDate(date)}`}</Typography> : null}
  </Stack>;
};

export default RandomEvent;
