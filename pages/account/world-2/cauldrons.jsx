import { Card, CardContent, Stack, Typography } from '@mui/material';
import { Breakdown as StatBreakdown } from '@components/common/Breakdown/Breakdown';
import React, { useContext, useState } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import ProgressBar from '../../../components/common/ProgressBar';
import { getCoinsArray, notateNumber, numberWithCommas, prefix } from '@utility/helpers';
import darkTheme from '../../../styles/theme/darkTheme';
import { PlayersList } from '@components/common/styles';
import Box from '@mui/material/Box';
import { NextSeo } from 'next-seo';
import CoinDisplay from '@components/common/CoinDisplay';
import { CAULDRONS_MAX_LEVELS, getBaseNewBubbleChance, getMaxCauldron } from '@parsers/world-2/alchemy';
import { NUMBERED_GROUP, createBreakdown, flat, info, listGroup, multiplier, productGroup } from '@parsers/breakdown';
import Tooltip from '@components/Tooltip';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import SetGoalButton from '@components/goals/SetGoalButton';
import { goalHostSx } from '@components/goals/goalHost';

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

const Cauldrons = () => {
  const { state } = useContext(AppContext);
  const { alchemy } = state?.account || {};
  const [goalOpenKey, setGoalOpenKey] = useState(null);

  return (
    <>
      <NextSeo
        title="Cauldrons | Idleon Toolbox"
        description="Track your alchemy cauldron levels, brewing speed, and liquid capacity in Legends of Idleon"
      />
      <Typography variant={'h5'} mb={3}>Brewing</Typography>
      <Stack direction={'row'} flexWrap={'wrap'} gap={2}>
        {Object.entries(alchemy?.cauldrons || {})?.map(([name, stats], cauldronIndex) => (
          <BrewingCard key={`${name}-${cauldronIndex}`} name={name} cauldron={stats}
                       color={cauldronsColors[cauldronIndex]} characters={state?.characters}/>
        ))}
      </Stack>

      <Typography my={3} variant={'h5'} mb={3}>Pay 2 Win</Typography>

      <Typography my={3} variant={'h5'} mb={3}>Liquids</Typography>
      <Stack direction={'row'} flexWrap={'wrap'} gap={2}>
        {alchemy?.p2w?.liquids?.map((cauldron, index) => {
          const { name, regen, capacity, players } = cauldron;
          const {
            maxLiquid,
            decantCap,
            decantRate,
            isDragonic,
            maxLiquidBreakdown
          } = alchemy?.liquidCauldrons?.[index] ?? {};
          const currentLiquid = alchemy?.liquids?.[index] ?? 0;
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
                  <Stack direction={'row'} alignItems={'center'} gap={1}>
                    {isDragonic ? <Tooltip title={'Dragonic cauldron'}>
                      <img style={{ width: 24, height: 24, objectFit: 'contain' }} src={`${prefix}data/GemP18.png`}
                           alt="Gem P18"/>
                    </Tooltip> : null}
                    <PlayersList players={players} characters={state?.characters}/>
                  </Stack>
                </Stack>
              </Stack>
              <Stack direction={'row'} gap={1} alignItems={'center'}>
                <Typography variant={'caption'}>{Math.round(currentLiquid)} / {maxLiquid}</Typography>
                <StatBreakdown data={maxLiquidBreakdown}>
                  <Stack alignContent={'center'}>
                    <IconInfoCircleFilled size={18}/>
                  </Stack>
                </StatBreakdown>
              </Stack>
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
                <CostTooltip shouldDisplay={regen?.level < CAULDRONS_MAX_LEVELS.liquidsRegen
                                       && goalOpenKey !== `liquid:${index}:regen`} cost={regen?.cost}
                             costToMax={regen?.costToMax}>
                  <Card variant={'outlined'} sx={{
                    ...goalHostSx,
                    outline: regen?.level >= CAULDRONS_MAX_LEVELS.liquidsRegen ? '1px solid' : '',
                    outlineColor: (theme) => regen?.level >= CAULDRONS_MAX_LEVELS.liquidsRegen
                      ? theme.palette.success.light
                      : ''
                  }}>
                    <CardContent>
                      <Typography>Regen</Typography>
                      <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'} gap={1}>
                        <Typography>Lv. {regen?.level} / {CAULDRONS_MAX_LEVELS.liquidsRegen}</Typography>
                        <SetGoalButton system="cauldronUpgrade" entryKey={`liquid:${index}:regen`}
                                       onOpenChange={(open) => setGoalOpenKey(open ? `liquid:${index}:regen` : null)}/>
                      </Stack>
                    </CardContent>
                  </Card>
                </CostTooltip>
                <CostTooltip shouldDisplay={capacity?.level < CAULDRONS_MAX_LEVELS.liquidsRegen
                                       && goalOpenKey !== `liquid:${index}:capacity`} cost={capacity?.cost}
                             costToMax={capacity?.costToMax}>
                  <Card variant={'outlined'} sx={{
                    ...goalHostSx,
                    outline: capacity?.level >= CAULDRONS_MAX_LEVELS.liquidsCapacity ? '1px solid' : '',
                    outlineColor: (theme) => capacity?.level >= CAULDRONS_MAX_LEVELS.liquidsCapacity
                      ? theme.palette.success.light
                      : ''
                  }}>
                    <CardContent>
                      <Typography>Capacity</Typography>
                      <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'} gap={1}>
                        <Typography>Lv. {capacity?.level} / {CAULDRONS_MAX_LEVELS.liquidsCapacity}</Typography>
                        <SetGoalButton system="cauldronUpgrade" entryKey={`liquid:${index}:capacity`}
                                       onOpenChange={(open) => setGoalOpenKey(open ? `liquid:${index}:capacity` : null)}/>
                      </Stack>
                    </CardContent>
                  </Card>
                </CostTooltip>
              </Stack>
            </CardContent>
          </Card>
        })}
      </Stack>

      <Typography my={3} variant={'h5'} mb={3}>Cauldrons</Typography>
      <Stack direction={'row'} flexWrap={'wrap'} gap={2}>
        {alchemy?.p2w?.cauldrons?.map((cauldron, index) => {
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
                <CostTooltip shouldDisplay={speed?.level < CAULDRONS_MAX_LEVELS.cauldronsSpeed
                                       && goalOpenKey !== `cauldron:${index}:speed`} cost={speed?.cost}
                             costToMax={speed?.costToMax}>
                  <Card variant={'outlined'} sx={{
                    ...goalHostSx,
                    outline: speed?.level >= CAULDRONS_MAX_LEVELS.cauldronsSpeed ? '1px solid' : '',
                    outlineColor: (theme) => speed?.level >= CAULDRONS_MAX_LEVELS.cauldronsSpeed
                      ? theme.palette.success.light
                      : ''
                  }}>
                    <CardContent>
                      <Typography>Speed</Typography>
                      <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'} gap={1}>
                        <Typography>Lv. {speed?.level} / {CAULDRONS_MAX_LEVELS.cauldronsSpeed}</Typography>
                        <SetGoalButton system="cauldronUpgrade" entryKey={`cauldron:${index}:speed`}
                                       onOpenChange={(open) => setGoalOpenKey(open ? `cauldron:${index}:speed` : null)}/>
                      </Stack>
                    </CardContent>
                  </Card>
                </CostTooltip>
                <CostTooltip shouldDisplay={newBubble?.level < CAULDRONS_MAX_LEVELS.cauldronsNewBubble
                                       && goalOpenKey !== `cauldron:${index}:newBubble`}
                             cost={newBubble?.cost} costToMax={newBubble?.costToMax}>
                  <Card variant={'outlined'} sx={{
                    ...goalHostSx,
                    outline: newBubble?.level >= CAULDRONS_MAX_LEVELS.cauldronsNewBubble ? '1px solid' : '',
                    outlineColor: (theme) => newBubble?.level >= CAULDRONS_MAX_LEVELS.cauldronsNewBubble
                      ? theme.palette.success.light
                      : ''
                  }}>
                    <CardContent>
                      <Typography>New Bubble Chance</Typography>
                      <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'} gap={1}>
                        <Typography>Lv. {newBubble?.level} / {CAULDRONS_MAX_LEVELS.cauldronsNewBubble}</Typography>
                        <SetGoalButton system="cauldronUpgrade" entryKey={`cauldron:${index}:newBubble`}
                                       onOpenChange={(open) => setGoalOpenKey(open ? `cauldron:${index}:newBubble` : null)}/>
                      </Stack>
                    </CardContent>
                  </Card>
                </CostTooltip>
                <CostTooltip shouldDisplay={boostReq?.level < CAULDRONS_MAX_LEVELS.cauldronsBoostReq
                                       && goalOpenKey !== `cauldron:${index}:boostReq`}
                             cost={boostReq?.cost} costToMax={boostReq?.costToMax}>
                  <Card variant={'outlined'} sx={{
                    ...goalHostSx,
                    outline: boostReq?.level >= CAULDRONS_MAX_LEVELS.cauldronsBoostReq ? '1px solid' : '',
                    outlineColor: (theme) => boostReq?.level >= CAULDRONS_MAX_LEVELS.cauldronsBoostReq
                      ? theme.palette.success.light
                      : ''
                  }}>
                    <CardContent>
                      <Typography>Boost Req</Typography>
                      <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'} gap={1}>
                        <Typography>Lv. {boostReq?.level} / {CAULDRONS_MAX_LEVELS.cauldronsBoostReq}</Typography>
                        <SetGoalButton system="cauldronUpgrade" entryKey={`cauldron:${index}:boostReq`}
                                       onOpenChange={(open) => setGoalOpenKey(open ? `cauldron:${index}:boostReq` : null)}/>
                      </Stack>
                    </CardContent>
                  </Card>
                </CostTooltip>
              </Stack>
            </CardContent>
          </Card>
        })}
      </Stack>
      <Stack direction={'row'} gap={3}>
        <Box>
          <Typography my={3} variant={'h5'} mb={3}>Player</Typography>
          <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
            <Section title={'Alch speed'} value={alchemy?.p2w?.player?.speedLv}/>
            <Section title={'Extra Exp'} value={alchemy?.p2w?.player?.extraExpLv}/>
          </Stack>
        </Box>
        <Box>
          <Typography my={3} variant={'h5'} mb={3}>Vials</Typography>
          <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
            <Section title={'Attempts'} maxLevel={CAULDRONS_MAX_LEVELS.vialsAttempts}
                     value={alchemy?.p2w?.vials?.attempts}/>
            <Section title={'RNG'} maxLevel={CAULDRONS_MAX_LEVELS.vialsRng} value={alchemy?.p2w?.vials?.rng}/>
          </Stack>
        </Box>
      </Stack>
    </>
  );
};

const NEXT_BUBBLES_SHOWN = 10;

// The game rounds this to 0.01%, which hides everything past the first few worlds.
const formatChance = (chance) => `${Math.min(chance, 100).toLocaleString('en-US', { maximumSignificantDigits: 3 })}%`;
const formatOdds = (chance) => chance >= 100 ? 'guaranteed' : `1 in ${notateNumber(100 / chance, 'Big')}`;

const BrewingCard = ({ name, cauldron, color, characters }) => {
  const { newBubble, brewSpeed, attempts = 0, progress = 0, req = 0, players = [], boosts = {} } = cauldron;
  const towardNext = req > 0 ? progress - attempts * req : 0;
  return <Card sx={{ width: { md: 450 } }}>
    <CardContent>
      <Stack direction={'row'} gap={1}>
        <Typography color={color}>{name.capitalize()}</Typography>
        <PlayersList players={players} characters={characters}/>
      </Stack>
      <ProgressBar bgColor={color} percent={req > 0 ? towardNext / req * 100 : 0}/>
      <Typography>{notateNumber(towardNext, 'Big')} / {notateNumber(req, 'Big')}</Typography>
      {brewSpeed ? <Stack direction={'row'} alignItems={'center'} gap={1}>
        <Typography variant={'body2'}>Brew speed {notateNumber(brewSpeed.value, 'Big')} / hr</Typography>
        <StatBreakdown data={brewSpeed.breakdown}>
          <IconInfoCircleFilled size={16}/>
        </StatBreakdown>
      </Stack> : null}
      {newBubble ? <Stack direction={'row'} alignItems={'center'} columnGap={1.5} flexWrap={'wrap'}>
        <Typography variant={'body2'}>
          New bubble {formatChance(newBubble.chance)} ({formatOdds(newBubble.chance)})
        </Typography>
        <Typography variant={'body2'} color={'text.secondary'}>
          {numberWithCommas(attempts)} attempts ready
          {attempts > 0 ? ` (~${newBubble.expectedBubbles.toLocaleString('en-US', { maximumFractionDigits: 1 })} bubbles)` : ''}
        </Typography>
        <StatBreakdown data={getNewBubbleBreakdown(name, cauldron)}>
          <IconInfoCircleFilled size={16}/>
        </StatBreakdown>
      </Stack> : null}
      <Stack mt={1} direction={'row'} flexWrap={'wrap'} gap={2}>
        {Object.entries(boosts).map(([statName, { level, progress, req }]) => {
          return <Card sx={{
            width: 200,
            outline: level >= CAULDRONS_MAX_LEVELS.brewing ? '1px solid' : '',
            outlineColor: (theme) => level >= CAULDRONS_MAX_LEVELS.brewing ? theme.palette.success.light : ''
          }} variant={'outlined'} key={`${name}-${statName}`}>
            <CardContent>
              <Typography component={'span'}
                          sx={{
                            display: 'inline-block',
                            width: 50,
                            mr: 1
                          }}>{statName.capitalize()}</Typography>
              <Typography component={'span'}>Lv. {level} / {CAULDRONS_MAX_LEVELS.brewing}</Typography>
              <ProgressBar bgColor={color} percent={progress / req * 100}/>
              <Typography>{notateNumber(progress, 'Big')} / {notateNumber(req, 'Big')}</Typography>
            </CardContent>
          </Card>
        })}
      </Stack>
    </CardContent>
  </Card>
}

const getNewBubbleBreakdown = (name, cauldron) => {
  const { newBubble, unlockedBubbles = 0 } = cauldron;
  const nextBubbles = Array.from({ length: NEXT_BUBBLES_SHOWN }, (_, offset) => {
    const unlocked = unlockedBubbles + offset;
    const bubble = unlocked + 1;
    const chance = getBaseNewBubbleChance(unlocked) * newBubble.multi;
    return info(`#${bubble} (W${Math.ceil(bubble / 5)}), ${notateNumber(getMaxCauldron(unlocked), 'Big')} per attempt`, chance,
      { formatted: formatChance(chance) });
  });
  const factors = newBubble.breakdown ?? [];
  const base = factors.find(({ name }) => name === 'Base')?.value ?? 0;
  return createBreakdown(`${name.capitalize()} new bubble chance`, formatChance(newBubble.chance), [
    flat('Base', base, { formatted: formatChance(base) }),
    productGroup(NUMBERED_GROUP, factors.filter(({ name }) => name !== 'Base')
      .map(({ name, value }) => multiplier(name, value))),
    listGroup('Next bubbles', nextBubbles)
  ]);
}

const CostTooltip = ({ children, shouldDisplay, cost, costToMax }) => {
  return shouldDisplay ? <Tooltip dark title={<Stack>
    <Typography variant={'body1'}>Cost</Typography>
    <CoinDisplay title={''} maxCoins={3} money={getCoinsArray(cost)}/>
    <Typography variant={'body1'} mt={2}>Cost To Max</Typography>
    <CoinDisplay title={''} maxCoins={3} money={getCoinsArray(costToMax)}/>
  </Stack>}>
    {children}
  </Tooltip> : children;
}

const Section = ({ title, value, maxLevel }) => {
  return <Card sx={{
    outline: value >= maxLevel ? '1px solid' : '',
    outlineColor: (theme) => value >= maxLevel
      ? theme.palette.success.light
      : ''
  }}>
    <CardContent>
      <Typography>{title}</Typography>
      <Typography>Lv. {value}</Typography>
    </CardContent>
  </Card>;
}

export default Cauldrons;
