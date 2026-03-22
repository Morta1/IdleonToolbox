import React, { useContext, useState } from 'react';
import { NextSeo } from 'next-seo';
import { AppContext } from '@components/common/context/AppProvider';
import { getWeeklyBoss } from '@parsers/world-2/weeklyBosses';
import { Stack, Typography } from '@mui/material';
import Tabber from '@components/common/Tabber';
import WeeklyBoss from '@components/account/Worlds/World2/WeeklyBoss';
import { cleanUnderscore, numberWithCommas } from '@utility/helpers';
import Button from '@mui/material/Button';
import { format, isValid } from 'date-fns';
import { CardTitleAndValue } from '@components/common/styles';

const WeeklyBosses = () => {
  const { state } = useContext(AppContext);
  const [weeks, setWeeks] = useState(10);
  const handleCopy = async (data) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    } catch (err) {
      console.error(err);
    }
  };

  const weeklyBosses = getWeeklyBoss(state?.account, weeks);
  return weeklyBosses?.length ? <>
    <NextSeo
      title="Weekly Bosses | Idleon Toolbox"
      description="Track your weekly boss fights, trophies, and predicted boss schedules in Legends of Idleon"
    />
    <Stack direction={'row'} gap={2} mb={3} alignItems={'center'}>
      <CardTitleAndValue title={'Trophies'}
                         icon={'data/Trophie.png'}
                         imgStyle={{ width: 24, height: 24, objectFit: 'contain' }}
                         value={numberWithCommas(state?.account?.accountOptions?.[188])}/>
      <CardTitleAndValue title={'Options'}
                         value={<Button onClick={() => setWeeks((tempWeeks) => tempWeeks + 10)}>+ Add more
                           bosses</Button>}/>
    </Stack>
    <Tabber
      disableQuery
      forceScroll={weeks > 10}
      tabs={weeklyBosses?.map(({ bossName, date }, index) => cleanUnderscore(bossName))}
      components={weeklyBosses?.map(({ bossName, date }, index) => <Stack key={'boss-' + index}>
        <Typography variant={'body1'} sx={{ textTransform: 'none' }}>{cleanUnderscore(bossName)}</Typography>
        <Typography variant={'caption'} sx={{ textTransform: 'none' }}>{isValid(date)
          ? format(date, 'dd/MM/yyyy HH:mm:ss')
          : null}</Typography>
      </Stack>)}>
      {weeklyBosses?.map((boss, bossIndex) => <WeeklyBoss key={boss?.bossName + bossIndex}
                                                          {...boss}
                                                          bossIndex={bossIndex}
                                                          account={state?.account}
                                                          characters={state?.characters}/>)}
    </Tabber>
  </> : <div>There is no random event data</div>
};

export default WeeklyBosses;

