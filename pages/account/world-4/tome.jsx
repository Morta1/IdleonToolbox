import React, { useContext, useMemo } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, commaNotation, getRealDateInMs, notateNumber } from '@utility/helpers';
import { CardTitleAndValue, TitleAndValue } from '@components/common/styles';
import Tooltip from '@components/Tooltip';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import useCheckbox from '@components/common/useCheckbox';
import Timer from '@components/common/Timer';

const ranks = ['0.1%', '0.5%', '1%', '5%', '10%', '25%', '50%', '60%', '70%', '80%', '90%', '95%']
const getFormattedQuantity = ({ x2, x4 }, quantity) => quantity > 1e9 && x2 === 1
  ? notateNumber(quantity, 'Big')
  : x4 === 1
    ? Math.round(100 * quantity) / 100
    : commaNotation(quantity);

const Tome = () => {
  const { state } = useContext(AppContext);
  const [CheckboxEl, showThresholds] = useCheckbox('Show quantity thresholds');
  const [CheckboxHideMaxedEl, hideMaxed] = useCheckbox('Hide capped');

  // Calculate countdown to next tome nametag reset and next 10 resets
  const { nextResetTime, nextResetTimes } = useMemo(() => {
    const PERIOD_SECONDS = 2628000; // ~30 days 10 hours
    const currentUnixTime = Math.floor(Date.now() / 1000);
    const currentPeriod = Math.floor(currentUnixTime / PERIOD_SECONDS);
    const nextPeriod = currentPeriod + 1;
    const nextResetUnixTime = nextPeriod * PERIOD_SECONDS;
    // Convert to milliseconds for Date object
    const firstReset = nextResetUnixTime * 1000;

    // Calculate next 10 resets
    const resets = [];
    for (let i = 0; i < 10; i++) {
      const period = nextPeriod + i;
      const resetUnixTime = period * PERIOD_SECONDS;
      resets.push(resetUnixTime * 1000);
    }

    return { nextResetTime: firstReset, nextResetTimes: resets };
  }, []);

  return <>
    <NextSeo
      title="Tome | Idleon Toolbox"
      description="Keep track of your tome bonuses and highscores"
    />
    {/*<Typography variant={'caption'}>* Bubble bonus might be inaccurate because it is determined by your active*/}
    {/*  character.</Typography>*/}
    <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
      <CardTitleAndValue title={'Total Points'} value={commaNotation(state?.account?.tome?.totalPoints)} />
      <CardTitleAndValue title={'Rank'} value={!state?.account?.tome?.tops ? '' : <Tooltip title={<Stack gap={1}>
        {state?.account?.tome?.tops?.map((score, index) => <Stack direction={'row'} gap={1}
          key={'rank' + ranks?.[index]}
          divider={<>-</>}>
          <Typography sx={{ width: 40 }}>{ranks?.[index]}</Typography>
          <Typography>{commaNotation(score)}</Typography>
        </Stack>)}
      </Stack>}>
        <IconInfoCircleFilled size={18} />
      </Tooltip>} icon={`data/TomeTop${state?.account?.tome?.top}.png`} />
      <CardTitleAndValue title={'Nametag Reward Reset'} value={
        <Stack direction={'row'} alignItems={'center'} gap={1}>
          <Timer type="countdown" date={nextResetTime} lastUpdated={state?.lastUpdated || Date.now()} />
          <Tooltip title={<Stack gap={1}>
            <Typography variant='body1' color='text.secondary'>Next resets</Typography>
            {nextResetTimes.map((resetTime, index) => (
              <Typography variant='body2' key={`reset-${index}`}>
                {getRealDateInMs(resetTime)}
              </Typography>
            ))}
          </Stack>}>
            <IconInfoCircleFilled size={18} />
          </Tooltip>
        </Stack>
      } />
      <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
        {state?.account?.tome?.bonuses?.map(({ name, bonus, isMulti, icon }, index) => {
          const formatted = isMulti ? notateNumber(1 + bonus / 100, 'MultiplierInfo') : notateNumber(bonus, 'Big');
          return <CardTitleAndValue key={name} title={cleanUnderscore(name)} value={`${formatted}${isMulti ? 'x' : '%'}`}
            icon={icon || `etc/Tome_${index}.png`}>
          </CardTitleAndValue>
        })}
        {state?.account?.spelunking?.loreBonuses?.map((upgrade) => {
          if (upgrade?.name === 'filler') return null;
          return <CardTitleAndValue key={upgrade?.name} title={upgrade?.name} value={`${notateNumber(upgrade?.isMulti ? 1 + upgrade?.bonus / 100 : upgrade?.bonus, 'MultiplierInfo')}${upgrade?.isMulti ? 'x' : '%'}`}
            icon={`etc/Tome_${upgrade?.index + 6}.png`}>
          </CardTitleAndValue>
        })}
      </Stack>
    </Stack>
    <CheckboxEl />
    <CheckboxHideMaxedEl />

    <Stack direction={'row'} flexWrap={'wrap'} gap={2}>
      {state?.account?.tome?.tome?.map((bonus, rIndex) => {
        const {
          name,
          color,
          tomeLvReq,
          quantity,
          index,
          points,
          requiredQuantities
        } = bonus;
        const formattedQuantity = getFormattedQuantity(bonus, quantity);
        if (hideMaxed && color === '#56ccff') return null;
        return <Card key={'tome-bonus' + index} sx={{ width: 300 }}>
          <CardContent sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            opacity: state?.account?.accountLevel < tomeLvReq ? .5 : 1
          }}>
            <Stack mb={1} direction={'row'} alignItems={'center'} gap={1} justifyContent={'space-between'}>
              <Typography variant={'body1'}>{cleanUnderscore(name.replace('(Tap_for_more_info)', ''))}</Typography>
              {rIndex === 19
                ? <Tooltip
                  title={'Affected by your currently active character'}><IconInfoCircleFilled size={16} /></Tooltip>
                : null}
            </Stack>
            <Stack mt={'auto'} justifyContent="space-between" direction={'row'}>
              <Stack direction={'row'} alignItems={'center'} gap={1}>
                <Typography>{formattedQuantity}</Typography>
                {showThresholds ? <Tooltip title={<Stack>
                  {Object.entries(requiredQuantities).map(([key, value]) => (
                    <TitleAndValue stackStyle={{ justifyContent: 'space-between' }} key={name + key}
                      title={key.capitalize()} value={getFormattedQuantity(bonus, value)} />
                  ))}
                </Stack>}>
                  <IconInfoCircleFilled size={16} />
                </Tooltip> : null}
              </Stack>
              {/*<Stack direction={'row'} alignItems={'center'} gap={1}>*/}
              {/*  <Tooltip title={<Stack>*/}
              {/*    {Object.entries(requiredQuantities).map(([key, value]) => (*/}
              {/*      <TitleAndValue stackStyle={{ justifyContent: 'space-between' }} key={name + key}*/}
              {/*                     title={key.capitalize()} value={getFormattedQuantity(bonus, value)}/>*/}
              {/*    ))}*/}
              {/*  </Stack>}>*/}
              {/*    <IconInfoCircleFilled size={16}/>*/}
              {/*  </Tooltip>*/}
              <Typography color={color}>{commaNotation(points)} PTS</Typography>
              {/*</Stack>*/}
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

export default Tome;
