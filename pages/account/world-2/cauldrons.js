import { Card, CardContent, Stack, Typography } from "@mui/material";
import React, { useContext } from "react";
import { AppContext } from "../../../components/common/context/AppProvider";
import ProgressBar from "../../../components/common/ProgressBar";
import { notateNumber, prefix } from "../../../utility/helpers";
import darkTheme from "../../../styles/theme/darkTheme";
import { PlayersList } from "../../../components/common/styles";
import Box from "@mui/material/Box";

const cauldronsColors = [
  darkTheme.palette.warning.light,
  darkTheme.palette.success.light,
  '#b452ec',
  '#ecec31'
]

const Cauldrons = () => {
  const { state } = useContext(AppContext);
  const { alchemy } = state?.account || {};
  return (
    <>
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
              <Stack direction={'row'} flexWrap={'wrap'} gap={2}>
                {Object.entries(stats.boosts)?.map(([statName, { level, progress, req }], statIndex) => {
                  return <Card sx={{ width: 200 }} variant={'outlined'} key={`${name}-${cauldronIndex}-${statIndex}`}>
                    <CardContent>
                      <Typography component={'span'}
                                  sx={{
                                    display: 'inline-block',
                                    width: 50,
                                    mr: 1
                                  }}>{statName.capitalize()}</Typography>
                      <Typography component={'span'}>({level})</Typography>
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
              <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
                <Card variant={'outlined'}>
                  <CardContent>
                    <Typography>Regen</Typography>
                    <Typography>Lv. {regen} / 100</Typography>
                  </CardContent>
                </Card>
                <Card variant={'outlined'}>
                  <CardContent>
                    <Typography>Capacity</Typography>
                    <Typography>Lv. {capacity} / 80</Typography>
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
                <Card variant={'outlined'}>
                  <CardContent>
                    <Typography>Speed</Typography>
                    <Typography>Lv. {speed} / 150</Typography>
                  </CardContent>
                </Card>
                <Card variant={'outlined'}>
                  <CardContent>
                    <Typography>New Bubble Chance</Typography>
                    <Typography>Lv. {newBubble} / 125</Typography>
                  </CardContent>
                </Card>
                <Card variant={'outlined'}>
                  <CardContent>
                    <Typography>Boost Req</Typography>
                    <Typography>Lv. {boostReq} / 100</Typography>
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
            <Section title={'Attemps'} value={alchemy?.p2w?.vials?.attempts}/>
            <Section title={'RNG'} value={alchemy?.p2w?.vials?.rng}/>
          </Stack>
        </Box>
      </Stack>
    </>
  );
};

const Section = ({ title, value }) => {
  return <Card>
    <CardContent>
      <Typography>{title}</Typography>
      <Typography>Lv. {value}</Typography>
    </CardContent>
  </Card>;
}

export default Cauldrons;
