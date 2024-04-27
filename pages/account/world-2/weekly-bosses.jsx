import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { getWeeklyBoss } from '@parsers/world-2/weeklyBosses';
import { IconButton, Stack, Typography } from '@mui/material';
import Tabber from '@components/common/Tabber';
import WeeklyBoss from '@components/account/Worlds/World2/WeeklyBoss';
import { cleanUnderscore } from '@utility/helpers';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Tooltip from '@components/Tooltip';
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

  const weeklyBosses = useMemo(() => getWeeklyBoss(state?.account, weeks), [state?.account, weeks]);
  return weeklyBosses?.length ? <>
    <Stack direction={'row'} gap={2} mb={3} alignItems={'center'}>
      <Button onClick={() => handleCopy(weeklyBosses)}><ContentCopyIcon sx={{mr: 1}}/> Copy boss data</Button>
      <Button onClick={() => setWeeks((tempWeeks) => tempWeeks + 10)}>+ Add more bosses</Button>
    </Stack>
    <Tabber forceScroll={weeks > 10} tabs={weeklyBosses?.map(({ bossName, date }) => <Stack>
      <Typography variant={'body1'} sx={{textTransform:'none'}}>{cleanUnderscore(bossName)}</Typography>
      <Typography variant={'caption'} sx={{textTransform:'none'}}>{isValid(date) ? format(date, 'dd/MM/yyyy HH:mm:ss') : null}</Typography>
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
