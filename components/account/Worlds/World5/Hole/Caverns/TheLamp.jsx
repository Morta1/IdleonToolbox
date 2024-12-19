import { CardTitleAndValue } from '@components/common/styles';
import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, commaNotation } from '@utility/helpers';
import React from 'react';
import InfoIcon from '@mui/icons-material/Info';
import Tooltip from '@components/Tooltip';

const TheLamp = ({ hole }) => {
  const { theLamp } = hole?.caverns;

  return <>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      <CardTitleAndValue title={'Wishes'}
                         value={theLamp?.currentWishes}/>
      <CardTitleAndValue title={'Wish per day'}
                         value={Math.round(100 * theLamp?.wishPerDay) / 100}/>
    </Stack>
    <Divider sx={{ my: 2 }}/>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      {theLamp?.wishes?.map(({ description, name, futureCosts, bonus, cost }, index) => {
        return <Card key={`bonus-${index}`}>
          <CardContent sx={{ width: 300, height: 250 }}>
            <Typography>{cleanUnderscore(name)}</Typography>
            <Typography mt={2}>{cleanUnderscore(description)}</Typography>
            <Stack direction={'row'} alignItems={'center'} mt={2} gap={1}>
              <Typography>Cost: {cost}</Typography>
              <Tooltip title={<Stack>
                <Typography variant={'body2'} style={{fontWeight:'bold'}}> Future costs</Typography>
                {futureCosts.map((futureCost, costIndex) => <div
                  key={`fc-${costIndex}`}>{commaNotation(futureCost)}</div>)}
              </Stack>}>
                <InfoIcon fontSize={'small'}/>
              </Tooltip>
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>;
};

export default TheLamp;
