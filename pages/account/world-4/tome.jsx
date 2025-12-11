import React, { useContext, useMemo } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, commaNotation, getRealDateInMs, notateNumber } from '@utility/helpers';
import { CardTitleAndValue, TitleAndValue } from '@components/common/styles';
import Tooltip from '@components/Tooltip';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import useCheckbox from '@components/common/useCheckbox';
import Timer from '@components/common/Timer';
import { segmentColors } from '@parsers/world-4/tome';

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
  const [CheckboxProgressBarsEl, showProgressBars] = useCheckbox('Show progress bars');

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
    <CheckboxProgressBarsEl />

    <Stack direction={'row'} flexWrap={'wrap'} gap={2}>
      {state?.account?.tome?.tome?.map((bonus, rIndex) => {
        const {
          name,
          color,
          tomeLvReq,
          quantity,
          maxPoints,
          index,
          points,
          requiredQuantities
        } = bonus;
        const silverReq = requiredQuantities?.silver || null;
        const goldReq = requiredQuantities?.gold || null;
        const blueReq = requiredQuantities?.blue || null;

        const tiers = ['silver', 'gold', 'blue'];
        let activeTier = 'silver';
        let activeProgress = 0;

        if (silverReq && quantity < silverReq) {
          activeTier = 'silver';
          activeProgress = Math.max(0, Math.min(1, quantity / silverReq));
        } else if (goldReq && quantity < goldReq) {
          activeTier = 'gold';
          const start = silverReq || 0;
          const span = goldReq - start || goldReq;
          activeProgress = Math.max(0, Math.min(1, (quantity - start) / span));
        } else if (blueReq) {
          activeTier = 'blue';
          if (quantity < blueReq && goldReq) {
            const span = blueReq - goldReq || blueReq;
            activeProgress = Math.max(0, Math.min(1, (quantity - goldReq) / span));
          } else {
            activeProgress = 1;
          }
        }

        const fillColor = segmentColors[activeTier];
        const segments = tiers.map((tier, idx) => {
          const activeIdx = tiers.indexOf(activeTier);
          const progress = idx < activeIdx
            ? 1
            : idx === activeIdx
              ? activeProgress
              : 0;
          const requirement = requiredQuantities?.[tier] ?? null;
          const cumulativePct = requirement ? Math.min(1, quantity / requirement) : 0;
          return {
            tier,
            progress,
            fillColor,
            requirement,
            current: quantity,
            cumulativePct
          };
        });
        const formattedQuantity = getFormattedQuantity(bonus, quantity);
        const pointsProgress = Math.min(1, maxPoints ? points / maxPoints : 0);
        if (hideMaxed && points >= maxPoints) return null;
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
            <Stack mt={'auto'} mb={1} justifyContent="space-between" direction={'row'}>
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
              <Typography color={color}>{commaNotation(points)} PTS</Typography>
            </Stack>
            <TomeProgressBar segments={segments} show={showProgressBars} />
            {showProgressBars
              ? <PointsProgressBar progress={pointsProgress} points={points} maxPoints={maxPoints} />
              : null}
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

const TomeProgressBar = ({ segments, show }) => {
  if (!show) return null;
  return (
    <Stack gap={0.25} mb={1}>
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="caption" color="text.secondary">Tier progress</Typography>
      </Stack>
      <Stack direction={'row'} gap={0.5}>
      {segments.map(({ tier, progress, fillColor, requirement, current, cumulativePct }) => {
        const currentFormatted = getFormattedQuantity({ x2: 0 }, current);
        const requirementFormatted = requirement ? getFormattedQuantity({ x2: 0 }, requirement) : 'N/A';
        const tooltipContent = (
          <Stack gap={0.5}>
            <Typography variant="body1" color="text.secondary">{tier.capitalize()} tier</Typography>
            {current < requirement ? <Typography variant="body2" color="text.secondary">{currentFormatted} / {requirementFormatted}</Typography> :
              <Typography variant="body2" color="text.secondary">{requirementFormatted}</Typography>}
          </Stack>
        );
        return (
          <Tooltip key={tier} title={tooltipContent}>
            <Box sx={{
              position: 'relative',
              flex: 1,
              height: 8,
              borderRadius: tier === 'silver' ? '4px 0 0 4px' : tier === 'blue' ? '0 4px 4px 0' : 0,
              overflow: 'hidden',
              bgcolor: (theme) => theme.palette.action.hover
            }}>
              <Box sx={{
                position: 'absolute',
                inset: 0,
                width: `${progress * 100}%`,
                bgcolor: fillColor
              }} />
            </Box>
          </Tooltip>
        );
      })}
      </Stack>
    </Stack>
  );
};

const PointsProgressBar = ({ progress, points, maxPoints }) => {
  if (!maxPoints) return null;
  const clamped = Math.max(0, Math.min(1, progress || 0));
  return (
    <Stack gap={0.25}>
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="caption" color="text.secondary">PTS progress</Typography>
        <Typography variant="caption" color="text.secondary">{commaNotation(points)} / {commaNotation(maxPoints)}</Typography>
      </Stack>
      <Box sx={{
        position: 'relative',
        width: '100%',
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
        bgcolor: (theme) => theme.palette.action.hover
      }}>
        <Box sx={{
          position: 'absolute',
          inset: 0,
          width: `${clamped * 100}%`,
          bgcolor: 'success.light'
        }} />
      </Box>
    </Stack>
  );
}

export default Tome;
