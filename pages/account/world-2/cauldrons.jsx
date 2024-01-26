import { Card, CardContent, Stack, Typography } from '@mui/material';
import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import ProgressBar from '../../../components/common/ProgressBar';
import { notateNumber, prefix } from '@utility/helpers';
import darkTheme from '../../../styles/theme/darkTheme';
import { PlayersList } from '@components/common/styles';
import Box from '@mui/material/Box';
import { NextSeo } from 'next-seo';

const cauldronsColors = [
  darkTheme.palette.warning.light,
  darkTheme.palette.success.light,
  '#b452ec',
  '#ecec31'
]

const liquidsColors = [
  '#61d5e8',
  '#34c6fd',
  '#2073ff',
  '#3e2027'
];

const MAX_LEVELS = {
  brewing: 170,
  liquidsRegen: 100,
  liquidsCapacity: 80,
  cauldronsSpeed: 150,
  cauldronsNewBubble: 125,
  cauldronsBoostReq: 100,
  vialsAttempts: 15,
  vialsRng: 45
}

const Cauldrons = () => {
  const { state } = useContext(AppContext);
  const { alchemy } = state?.account || {};
  return (
    <>
      <NextSeo
        title="Cauldrons | Idleon Toolbox"
        description="Cauldrons progression and stats"
      />
      <Typography variant={'h2'} textAlign={'center'} mb={3}>Cauldrons</Typography>
      <Typography variant={'h4'} mb={3}>Brewing</Typography>
      <Stack direction={'row'} flexWrap={'wrap'} gap={2}>
        {Object.entries(alchemy?.cauldrons)?.map(([name, stats], cauldronIndex) => {
          return <Card sx={{ width: { md: 450 } }} key={`${name}-${cauldronIndex}`}>
            <CardContent>
              <Stack direction={'row'} gap={1}>
                <Typography color={cauldronsColors[cauldronIndex]}>{name.capitalize()}</Typography>
                <PlayersList players={stats.players} characters={state?.characters}/>
              </Stack>
              <ProgressBar bgColor={cauldronsColors[cauldronIndex]}
                           percent={stats.progress / stats.req * 100}/>
              <Typography>{notateNumber(stats.progress, 'Big')} / {notateNumber(stats.req, 'Big')}</Typography>
              <Stack mt={1} direction={'row'} flexWrap={'wrap'} gap={2}>
                {Object.entries(stats.boosts)?.map(([statName, { level, progress, req }], statIndex) => {
                  return <Card sx={{
                    width: 200,
                    outline: level >= MAX_LEVELS.brewing ? '1px solid' : '',
                    outlineColor: (theme) => level >= MAX_LEVELS.brewing ? theme.palette.success.light : '',
                  }} variant={'outlined'} key={`${name}-${cauldronIndex}-${statIndex}`}>
                    <CardContent>
                      <Typography component={'span'}
                                  sx={{
                                    display: 'inline-block',
                                    width: 50,
                                    mr: 1
                                  }}>{statName.capitalize()}</Typography>
                      <Typography component={'span'}>Lv. {level} / {MAX_LEVELS.brewing}</Typography>
                      <ProgressBar bgColor={cauldronsColors[cauldronIndex]}
                                   percent={progress / req * 100}/>
                      <Typography>{notateNumber(progress, 'Big')} / {notateNumber(req, 'Big')}</Typography>
                    </CardContent>
                  </Card>
                })}
              </Stack>
            </CardContent>
          </Card>
        })}
      </Stack>

      <Typography my={3} variant={'h4'} mb={3}>Pay 2 Win</Typography>

      <Typography my={3} variant={'h5'} mb={3}>Liquids</Typography>
      <Stack direction={'row'} flexWrap={'wrap'} gap={2}>
        {alchemy?.p2w.liquids?.map((cauldron, index) => {
          const { name, regen, capacity, players } = cauldron;
          const { maxLiquid, decantCap, decantRate } = alchemy?.liquidCauldrons?.[index];
          const currentLiquid = alchemy?.liquids?.[index];
          return <Card key={`${name}-${index}`}>
            <CardContent>
              <Stack mb={1} direction={'row'} alignItems={'center'} gap={2}>
                <img src={`${prefix}data/aJarL${index}.png`} alt=""/>
                <Stack>
                  <Typography component={'span'}
                              sx={{
                                display: 'inline-block',
                                mr: 1
                              }}>{name.capitalize()}</Typography>
                  <PlayersList players={players} characters={state?.characters}/>
                </Stack>
              </Stack>
              <Typography variant={'caption'}>{Math.round(currentLiquid)} / {maxLiquid}</Typography>
              <ProgressBar bgColor={liquidsColors?.[index]}
                           pre={<img src={`${prefix}data/Liquid${index + 1}_x1.png`} alt=""/>}
                           percent={currentLiquid / maxLiquid * 100}/>
              <Stack mt={1} direction={'row'} gap={1} flexWrap={'wrap'}>
                <Card variant={'outlined'}>
                  <CardContent>
                    <Typography>Cap Lv.{decantCap?.level}</Typography>
                    <Typography>{notateNumber(decantCap?.progress)}/{notateNumber(decantCap?.req)}</Typography>
                  </CardContent>
                </Card>
                <Card variant={'outlined'}>
                  <CardContent>
                    <Typography>Rate Lv.{decantRate?.level}</Typography>
                    <Typography>{notateNumber(decantRate?.progress)}/{notateNumber(decantRate?.req)}</Typography>
                  </CardContent>
                </Card>
                <Card variant={'outlined'} sx={{
                  outline: regen >= MAX_LEVELS.liquidsRegen ? '1px solid' : '',
                  outlineColor: (theme) => regen >= MAX_LEVELS.liquidsRegen ? theme.palette.success.light : '',
                }}>
                  <CardContent>
                    <Typography>Regen</Typography>
                    <Typography>Lv. {regen} / {MAX_LEVELS.liquidsRegen}</Typography>
                  </CardContent>
                </Card>
                <Card variant={'outlined'} sx={{
                  outline: capacity >= MAX_LEVELS.liquidsCapacity ? '1px solid' : '',
                  outlineColor: (theme) => capacity >= MAX_LEVELS.liquidsCapacity ? theme.palette.success.light : '',
                }}>
                  <CardContent>
                    <Typography>Capacity</Typography>
                    <Typography>Lv. {capacity} / {MAX_LEVELS.liquidsCapacity}</Typography>
                  </CardContent>
                </Card>
              </Stack>
            </CardContent>
          </Card>
        })}
      </Stack>

      <Typography my={3} variant={'h5'} mb={3}>Cauldrons</Typography>
      <Stack direction={'row'} flexWrap={'wrap'} gap={2}>
        {alchemy?.p2w.cauldrons?.map((cauldron, index) => {
          const { name, speed, newBubble, boostReq } = cauldron;
          return <Card sx={{ width: { md: 485 } }} key={`${name}-${index}`}>
            <CardContent>
              <Stack mb={1} direction={'row'} alignItems={'center'} gap={2}>
                <img src={`${prefix}data/aJarB${index}.png`} alt=""/>
                <Typography component={'span'}
                            sx={{
                              display: 'inline-block',
                              mr: 1
                            }}>{name.capitalize()}</Typography>
              </Stack>
              <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
                <Card variant={'outlined'} sx={{
                  outline: speed >= MAX_LEVELS.cauldronsSpeed ? '1px solid' : '',
                  outlineColor: (theme) => speed >= MAX_LEVELS.cauldronsSpeed ? theme.palette.success.light : '',
                }}>
                  <CardContent>
                    <Typography>Speed</Typography>
                    <Typography>Lv. {speed} / {MAX_LEVELS.cauldronsSpeed}</Typography>
                  </CardContent>
                </Card>
                <Card variant={'outlined'} sx={{
                  outline: newBubble >= MAX_LEVELS.cauldronsNewBubble ? '1px solid' : '',
                  outlineColor: (theme) => newBubble >= MAX_LEVELS.cauldronsNewBubble
                    ? theme.palette.success.light
                    : '',
                }}>
                  <CardContent>
                    <Typography>New Bubble Chance</Typography>
                    <Typography>Lv. {newBubble} / {MAX_LEVELS.cauldronsNewBubble}</Typography>
                  </CardContent>
                </Card>
                <Card variant={'outlined'} sx={{
                  outline: boostReq >= MAX_LEVELS.cauldronsBoostReq ? '1px solid' : '',
                  outlineColor: (theme) => boostReq >= MAX_LEVELS.cauldronsBoostReq ? theme.palette.success.light : '',
                }}>
                  <CardContent>
                    <Typography>Boost Req</Typography>
                    <Typography>Lv. {boostReq} / {MAX_LEVELS.cauldronsBoostReq}</Typography>
                  </CardContent>
                </Card>
              </Stack>
            </CardContent>
          </Card>
        })}
      </Stack>
      <Stack direction={'row'} gap={3}>
        <Box>
          <Typography my={3} variant={'h5'} mb={3}>Player</Typography>
          <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
            <Section title={'Alch speed'} value={alchemy?.p2w?.player?.speed}/>
            <Section title={'Extra Exp'} value={alchemy?.p2w?.player?.extraExp}/>
          </Stack>
        </Box>
        <Box>
          <Typography my={3} variant={'h5'} mb={3}>Vials</Typography>
          <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
            <Section title={'Attemps'} maxLevel={MAX_LEVELS.vialsAttempts} value={alchemy?.p2w?.vials?.attempts}/>
            <Section title={'RNG'} maxLevel={MAX_LEVELS.vialsRng} value={alchemy?.p2w?.vials?.rng}/>
          </Stack>
        </Box>
      </Stack>
    </>
  );
};

const Section = ({ title, value, maxLevel }) => {
  return <Card sx={{
    outline: value >= maxLevel ? '1px solid' : '',
    outlineColor: (theme) => value >= maxLevel
      ? theme.palette.success.light
      : '',
  }}>
    <CardContent>
      <Typography>{title}</Typography>
      <Typography>Lv. {value}</Typography>
    </CardContent>
  </Card>;
}

export default Cauldrons;
