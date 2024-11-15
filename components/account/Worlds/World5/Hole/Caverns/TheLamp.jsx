import { CardTitleAndValue } from '@components/common/styles';
import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore } from '@utility/helpers';
import React from 'react';

const TheLamp = ({ hole }) => {
  const { theLamp } = hole?.caverns;

  return <>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      <CardTitleAndValue title={'Wish per day'}
                         value={Math.round(100 * theLamp?.wishPerDay) / 100}/>
    </Stack>
    <Divider sx={{ my: 2 }}/>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      {theLamp?.wishes?.map(({ description, name, bonus, cost }, index) => {
        return <Card key={`bonus-${index}`}>
          <CardContent sx={{ width: 300, height: 250 }}>
            <Typography>{cleanUnderscore(name)}</Typography>
            <Typography mt={2}>{cleanUnderscore(description)}</Typography>
            <Typography mt={2}>Cost: {cost}</Typography>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>;
};

export default TheLamp;
