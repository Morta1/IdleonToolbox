import React, { useContext } from 'react';
import { AppContext } from '../../../components/common/context/AppProvider';
import {  getWeeklyBoss } from '../../../parsers/misc';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import WeeklyBoss from '../../../components/account/Misc/WeeklyBoss';

const WeeklyBosses = () => {
  const { state } = useContext(AppContext);

  const weeklyBosses = getWeeklyBoss(state?.account);

  return weeklyBosses?.length ? <>
    <Typography variant={'h1'} sx={{ mb: 3 }}>Weekly bosses</Typography>
    <Stack direction={'row'} flexWrap={'wrap'} gap={2}>
      {weeklyBosses?.map((boss, index) => {
        return <Card key={'events' + index} sx={{ width: 250 }}>
          <CardContent>
            <WeeklyBoss {...boss} />
          </CardContent>
        </Card>
      })}
    </Stack>
  </> : <div>There is no random event data</div>
};

export default WeeklyBosses;
