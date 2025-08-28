import { Stack } from '@mui/material';
import ObolsView from 'components/account/Worlds/World2/ObolsView';
import Currencies from 'components/account/Misc/Currencies';
import Shrines from '@components/account/Worlds/World3/Shrines';
import Statues from '@components/account/Worlds/World1/Statues';
import Highscores from 'components/account/Misc/Highscores';
import Totals from 'components/account/Misc/Totals';
import { AppContext } from 'components/common/context/AppProvider';
import React, { useContext } from 'react';
import { NextSeo } from 'next-seo';
import Box from '@mui/material/Box';

const General = () => {
  const { state } = useContext(AppContext);
  return <Box sx={{ width: '100%' }}>
    <NextSeo
      title="General | Idleon Toolbox"
      description="General account information"
    />
    <>
      <Stack sx={{ '& > div': { maxWidth: 300 } }} gap={4} justifyContent={'center'} direction={'row'} flexWrap={'wrap'}>
        <ObolsView obols={state?.account?.obols} type={'account'} characters={state?.characters}/>
        <Currencies {...(state?.account?.currencies || {})}/>
        <Shrines shrines={state?.account?.shrines} shrinesExpBonus={state?.account?.shrinesExpBonus}/>
        <Statues account={state?.account} characters={state?.characters}/>
        <Stack gap={1.5}>
          <Highscores title={'Colosseum'} highscore={state?.account?.highscores?.coloHighscores}/>
          <Highscores title={'Minigame'} highscore={state?.account?.highscores?.minigameHighscores}/>
        </Stack>
        <Totals account={state?.account} characters={state?.characters}/>
      </Stack>
    </>
  </Box>
};

export default General;
