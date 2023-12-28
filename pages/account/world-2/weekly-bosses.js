import React, { useContext, useMemo } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { getWeeklyBoss } from '@parsers/world-2/weeklyBosses';
import { Typography } from '@mui/material';
import Tabber from '@components/common/Tabber';
import WeeklyBoss from '@components/account/Worlds/World2/WeeklyBoss';
import { cleanUnderscore } from '@utility/helpers';

const WeeklyBosses = () => {
  const { state } = useContext(AppContext);

  const weeklyBosses = useMemo(() => getWeeklyBoss(state?.account, state?.characters), [state?.account,
    state?.characters]);

  return weeklyBosses?.length ? <>
    <Typography variant={'h2'} sx={{ mb: 3 }}>Weekly bosses</Typography>
    <Tabber tabs={weeklyBosses?.map(({ bossName }) => cleanUnderscore(bossName))}>
      {weeklyBosses?.map((boss, bossIndex) => <WeeklyBoss key={boss?.bossName + bossIndex}
                                                          {...boss}
                                                          bossIndex={bossIndex}
                                                          account={state?.account}
                                                          characters={state?.characters}/>)}
    </Tabber>
  </> : <div>There is no random event data</div>
};

export default WeeklyBosses;
