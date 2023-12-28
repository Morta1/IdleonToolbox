import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { getWeeklyBoss } from '../../../parsers/world-2/weeklyBosses';
import { Typography } from '@mui/material';
import Tabber from '../../../components/common/Tabber';
import WeeklyBoss from '../../../components/account/Worlds/World2/WeeklyBoss';
import { cleanUnderscore } from '@utility/helpers';

const WeeklyBosses = () => {
  const { state } = useContext(AppContext);

  const weeklyBosses = getWeeklyBoss(state?.account, state?.characters);
  console.log('weeklyBosses', weeklyBosses)

  return weeklyBosses?.length ? <>
    <Typography variant={'h2'} sx={{ mb: 3 }}>Weekly bosses</Typography>
    <Tabber tabs={weeklyBosses?.map(({ bossName }) => cleanUnderscore(bossName))}>
      {weeklyBosses?.map((boss, index) => <WeeklyBoss key={boss?.bossName + index} {...boss}
                                                      account={state?.account}
                                                      characters={state?.characters}/>)}
    </Tabber>
  </> : <div>There is no random event data</div>
};

export default WeeklyBosses;
