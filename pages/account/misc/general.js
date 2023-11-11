import { Divider, Stack } from '@mui/material';
import ObolsView from 'components/account/Worlds/World2/ObolsView';
import Currencies from 'components/account/Misc/Currencies';
import Shrines from 'components/account/Worlds/World3/Shrines';
import Statues from 'components/account/Worlds/World1/Statues';
import Highscores from 'components/account/Misc/Highscores';
import Totals from 'components/account/Misc/Totals';
import { AppContext } from 'components/common/context/AppProvider';
import React, { useContext } from 'react';
import { NextSeo } from 'next-seo';
import Box from '@mui/material/Box'; // Grid version 2

const dividerSx = { marginTop: 4, display: { xs: "flex", sm: "none" } };

const General = () => {
  const { state } = useContext(AppContext);
  return <Box sx={{ width: '100%' }}>
    <NextSeo
      title="Idleon Toolbox | General"
      description="General account information"
    />
    <Stack sx={{ '& > div': { maxWidth: 300 } }} gap={2} justifyContent={'center'} direction={'row'} flexWrap={'wrap'}>
      <ObolsView obols={state?.account?.obols} type={'account'}/>
      <Currencies {...(state?.account?.currencies || {})}/>
      <Shrines shrines={state?.account?.shrines}/>
      <Statues statues={state?.account?.statues} characters={state?.characters}/>
      <Stack gap={1.5}>
        <Highscores title={'Colosseum Highscores'} highscore={state?.account?.highscores?.coloHighscores}/>
        <Divider sx={dividerSx}/>
        <Highscores title={'Minigames Highscores'} highscore={state?.account?.highscores?.minigameHighscores}/>
        <Divider sx={dividerSx}/>
      </Stack>
      <Totals account={state?.account}/>
    </Stack>
    {/*<Grid container justifyContent={'center'} gap={5} columns={{ md: 8, lg: 12, xl: 16 }}>*/}
    {/*  <Grid xs={12} sm={12} md={5}>*/}
    {/*    <ObolsView obols={state?.account?.obols} type={'account'}/>*/}
    {/*    <Divider sx={dividerSx}/>*/}
    {/*  </Grid>*/}
    {/*  <Grid xs={3}>*/}
    {/*    <Currencies {...(state?.account?.currencies || {})}/>*/}
    {/*    <Divider sx={dividerSx}/>*/}
    {/*  </Grid>*/}
    {/*  <Grid xs={3}>*/}
    {/*    <Shrines shrines={state?.account?.shrines}/>*/}
    {/*    <Divider sx={dividerSx}/>*/}
    {/*  </Grid>*/}
    {/*  <Grid xs={3}>*/}
    {/*    <Statues statues={state?.account?.statues}/>*/}
    {/*    <Divider sx={dividerSx}/>*/}
    {/*  </Grid>*/}
    {/*  <Grid xs={3}>*/}
    {/*    <Stack gap={1.5}>*/}
    {/*      <Highscores title={'Colosseum Highscores'} highscore={state?.account?.highscores?.coloHighscores}/>*/}
    {/*      <Divider sx={dividerSx}/>*/}
    {/*      <Highscores title={'Minigames Highscores'} highscore={state?.account?.highscores?.minigameHighscores}/>*/}
    {/*      <Divider sx={dividerSx}/>*/}
    {/*    </Stack>*/}
    {/*  </Grid>*/}
    {/*  <Grid xs={3}>*/}
    {/*    <Totals account={state?.account}/>*/}
    {/*  </Grid>*/}
    {/*</Grid>*/}
  </Box>
};


export default General;
