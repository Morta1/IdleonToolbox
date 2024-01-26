import React, { useContext, useMemo } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { getWeeklyBoss } from '@parsers/world-2/weeklyBosses';
import { IconButton, Stack, Typography } from '@mui/material';
import Tabber from '@components/common/Tabber';
import WeeklyBoss from '@components/account/Worlds/World2/WeeklyBoss';
import { cleanUnderscore } from '@utility/helpers';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Tooltip from '@components/Tooltip';

const WeeklyBosses = () => {
  const { state } = useContext(AppContext);
  const handleCopy = async (data) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    } catch (err) {
      console.error(err);
    }
  };

  const weeklyBosses = useMemo(() => getWeeklyBoss(state?.account, state?.characters), [state?.account,
    state?.characters]);
  return weeklyBosses?.length ? <>
    <Stack direction={'row'} gap={2} alignItems={'center'}>
      <Typography variant={'h2'} sx={{ mb: 3 }}>Weekly bosses</Typography>
      <Tooltip title={'Copy weekly bosses data'}>
        <IconButton onClick={() => handleCopy(weeklyBosses)}>
          <ContentCopyIcon/>
        </IconButton>
      </Tooltip>
    </Stack>
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
