import React, { useState } from 'react';
import { Card, CardContent, IconButton, Slider, Stack, Typography } from '@mui/material';
import { commaNotation, notateNumber, prefix } from '@utility/helpers';
import { CardTitleAndValue } from '@components/common/styles';
import { IconArrowBackUp, IconInfoCircleFilled } from '@tabler/icons-react';
import Tooltip from 'components/Tooltip';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import { calcDailyRibbons, getRibbonBonus, getSmokyRibbonBonus } from '@parsers/world-4/cooking';

const RibbonIcon = ({ rank, size = 32 }) => <img style={{ width: size, height: size, objectFit: 'contain' }}
                                                 src={`${prefix}data/Ribbon${Math.max(0, rank - 1)}.png`}
                                                 alt={`ribbon-${rank}`}/>;

const SectionTitle = ({ title, tooltip }) => <Stack direction={'row'} alignItems={'center'} gap={1} sx={{ mt: 3 }}>
  <Typography variant={'h6'}>{title}</Typography>
  <Tooltip title={tooltip}>
    <IconInfoCircleFilled size={18} style={{ cursor: 'pointer', display: 'block' }}/>
  </Tooltip>
</Stack>;

const PreviewValue = ({ current, preview }) => {
  const changed = Math.abs(preview - current) > 1e-9;
  // Fixed width so the cards next to it don't shift while the preview changes.
  return <Typography component={'div'} sx={{ minWidth: 88, fontVariantNumeric: 'tabular-nums' }}>
    {notateNumber(current, 'Small')}
    {changed ? <Typography component={'span'} sx={{ color: preview > current ? 'success.light' : 'error.light' }}>
      {` → ${notateNumber(preview, 'Small')}`}
    </Typography> : null}
  </Typography>;
};

const DailyRibbons = ({ inputs }) => {
  const smoky = inputs?.smoky;
  const currentPoints = smoky?.points ?? 0;
  const maxPoints = Math.max(currentPoints, smoky?.allPoints ?? 0);
  const [previewPoints, setPreviewPoints] = useState(null);
  const smokyPoints = previewPoints ?? currentPoints;
  const isPreview = smokyPoints !== currentPoints;
  const smokyBonus = isPreview
    ? getSmokyRibbonBonus((smoky?.baseMulti ?? 0) * smokyPoints)
    : smoky?.bonus ?? 0;
  const current = calcDailyRibbons(inputs);
  const daily = isPreview ? calcDailyRibbons(inputs, smokyBonus) : current;
  // Every rank the slider can reach, so the odds row keeps its cards while previewing.
  const reachableRanks = [0, maxPoints]
    .map((points) => calcDailyRibbons(inputs, getSmokyRibbonBonus((smoky?.baseMulti ?? 0) * points)))
    .concat(current)
    .flatMap(({ rankChances: chances }) => chances.map((chance, rank) => chance >= 1e-6 ? rank : 0))
    .filter((rank) => rank > 0);
  const rankChances = [...new Set(reachableRanks)]
    .sort((a, b) => a - b)
    .map((rank) => ({ rank, chance: daily.rankChances[rank] ?? 0 }));

  return <>
    <SectionTitle
      title={'Daily ribbons'}
      tooltip={'Ribbons added to your shelf every day and the chance for each rank. When the shelf is full, a new ribbon combines with one of the same rank, otherwise it replaces a lower one. Move the Smoky slider to preview a different Cooking Mastery point split, your save is not changed.'}/>
    {!daily.unlocked ? <Typography sx={{ mt: 1 }}>Daily ribbons are unlocked via the Ribbon Winning Grimoire
      upgrade.</Typography> : <>
      <Stack direction={'row'} flexWrap={'wrap'} gap={3} mt={1} alignItems={'stretch'}>
        <CardTitleAndValue title={'Ribbons per day'}>
          <Stack direction={'row'} alignItems={'center'} gap={0.5}>
            <Typography component={'div'}>
              {notateNumber(daily.count.expected, 'Small')} ({daily.count.min === daily.count.max
              ? daily.count.min
              : `${daily.count.min}-${daily.count.max}`})
            </Typography>
            <Breakdown data={daily.countBreakdown}>
              <IconInfoCircleFilled size={18} style={{ cursor: 'pointer', display: 'block' }}/>
            </Breakdown>
          </Stack>
        </CardTitleAndValue>
        <CardTitleAndValue title={'Average rank'}>
          <Stack direction={'row'} alignItems={'center'} gap={0.5}>
            <PreviewValue current={current.expectedRank} preview={daily.expectedRank}/>
            <Breakdown data={daily.rankBreakdown}>
              <IconInfoCircleFilled size={18} style={{ cursor: 'pointer', display: 'block' }}/>
            </Breakdown>
          </Stack>
        </CardTitleAndValue>
        <CardTitleAndValue title={'Points in Smoky'}>
          <Stack direction={'row'} alignItems={'center'} gap={1.5}>
            <Slider size={'small'} min={0} max={maxPoints} step={1} value={smokyPoints}
                    disabled={!smoky?.unlocked || maxPoints === 0}
                    onChange={(_, value) => setPreviewPoints(value)}
                    marks={[{ value: currentPoints }]}
                    sx={{
                      width: 120,
                      '& .MuiSlider-mark': { width: 3, height: 14, borderRadius: 1, bgcolor: 'text.secondary', opacity: 1 },
                      '& .MuiSlider-markActive': { bgcolor: 'text.secondary', opacity: 1 }
                    }}/>
            <Typography component={'div'} noWrap sx={{ minWidth: 104, fontVariantNumeric: 'tabular-nums' }}>
              {smokyPoints}/{maxPoints}: {notateNumber(smokyBonus, 'Small')}%
            </Typography>
            <Tooltip title={'Back to your current points'}>
              <IconButton size={'small'} onClick={() => setPreviewPoints(null)}
                          sx={{ visibility: isPreview ? 'visible' : 'hidden', p: 0.25 }}>
                <IconArrowBackUp size={18}/>
              </IconButton>
            </Tooltip>
          </Stack>
          <Stack direction={'row'} alignItems={'center'} gap={0.75}>
            <Stack sx={{ width: 3, height: 12, borderRadius: 1, bgcolor: 'text.secondary' }}/>
            <Typography variant={'caption'} color={'text.secondary'} noWrap>
              Current: {currentPoints} {currentPoints === 1 ? 'pt' : 'pts'} ({notateNumber(smoky?.bonus ?? 0, 'Small')}%)
            </Typography>
          </Stack>
        </CardTitleAndValue>
      </Stack>
      <Stack direction={'row'} flexWrap={'wrap'} gap={1} mt={2}>
        {rankChances.map(({ rank, chance }) => <Card key={`daily-rank-${rank}`} sx={{ width: 78, opacity: chance > 0 ? 1 : .45 }}>
          <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
            <Stack alignItems={'center'}>
              <RibbonIcon rank={rank}/>
              <Typography variant={'caption'} noWrap>Rank {rank}</Typography>
              <Typography variant={'body2'} fontWeight={'bold'}>
                {chance <= 0 ? '-' : chance * 100 >= 0.01 ? `${notateNumber(chance * 100, 'Small')}%` : '<0.01%'}
              </Typography>
            </Stack>
          </CardContent>
        </Card>)}
      </Stack>
      {daily.rankChances[2] > 0 && rankChances.some(({ rank, chance }) => rank >= 18 && chance > 0) ?
        <Typography variant={'caption'} color={'text.secondary'} component={'p'} sx={{ mt: 1 }}>
          The game turns any daily roll above Rank 20 into a Rank 2 ribbon.
        </Typography> : null}
    </>}
  </>;
};

const Ribbons = ({ cookingMastery, account }) => {
  const ribbons = cookingMastery?.ribbons;
  if (!ribbons?.totalMeals) {
    return <Typography sx={{ mt: 3 }}>Ribbons are unlocked via the Grimoire, Cooking Mastery is unlocked via Rift
      61.</Typography>;
  }

  const legendRanks = Array.from({ length: ribbons?.maxRank ?? 0 }, (_, index) => index + 1);

  return <>
    <Stack direction={'row'} flexWrap={'wrap'} gap={3} mt={3} alignItems={'stretch'}>
      <CardTitleAndValue title={'Total ribbon ranks'} value={commaNotation(ribbons?.total)}
                         tooltipTitle={'Ranks are counted across your meals only, ribbons still on the shelf are not included. This is the total the Sour mastery category scales with.'}/>
      <CardTitleAndValue title={'Highest ribbon'} value={ribbons?.highest > 0
        ? `Rank ${ribbons?.highest} (${notateNumber(getRibbonBonus(account, ribbons?.highest), 'MultiplierInfo')}x)`
        : '-'}/>
      <CardTitleAndValue title={'Lowest ribbon'} value={ribbons?.lowest > 0
        ? `Rank ${ribbons?.lowest} (${notateNumber(getRibbonBonus(account, ribbons?.lowest), 'MultiplierInfo')}x)`
        : '-'}/>
      <CardTitleAndValue title={'Ribboned meals'} value={`${ribbons?.ribbonedMeals} / ${ribbons?.totalMeals}`}/>
      <CardTitleAndValue title={'Max rank'} value={ribbons?.maxRank}/>
    </Stack>

    {cookingMastery?.dailyRibbons ? <DailyRibbons inputs={cookingMastery.dailyRibbons}/> : null}

    <SectionTitle
      title={'Ribbon shelf'}
      tooltip={'Ribbons waiting on your shelf in-game. Drag one onto a meal to apply it permanently, or onto a duplicate rank to combine.'}/>
    <Stack direction={'row'} flexWrap={'wrap'} gap={1} mt={1}>
      {ribbons?.shelf?.map((shelfRank, index) => <Card key={`shelf-${index}`}
                                                       sx={{ width: 78, opacity: shelfRank > 0 ? 1 : .35 }}>
        <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
          <Stack alignItems={'center'} justifyContent={'center'} sx={{ height: 52 }}>
            {shelfRank > 0 ? <>
              <RibbonIcon rank={shelfRank}/>
              <Typography variant={'caption'} noWrap>Rank {shelfRank}</Typography>
            </> : <Typography variant={'caption'} color={'text.secondary'}>Empty</Typography>}
          </Stack>
        </CardContent>
      </Card>)}
    </Stack>

    <SectionTitle
      title={'Rank legend'}
      tooltip={'The meal bonus multiplier each ribbon rank gives, including your Emperor set and Equinox cloud bonuses. Ranks you already have on a meal are highlighted.'}/>
    <Stack direction={'row'} flexWrap={'wrap'} gap={1} mt={1}>
      {legendRanks.map((legendRank) => {
        const mealsAtRank = ribbons?.rankCounts?.[legendRank] ?? 0;
        return <Card key={`legend-${legendRank}`} sx={{ width: 90, opacity: mealsAtRank > 0 ? 1 : .55 }}>
          <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
            <Stack alignItems={'center'}>
              <RibbonIcon rank={legendRank}/>
              <Typography variant={'caption'} noWrap>Rank {legendRank}</Typography>
              <Typography variant={'body2'} fontWeight={'bold'}>
                {notateNumber(getRibbonBonus(account, legendRank), 'MultiplierInfo')}x
              </Typography>
              <Typography variant={'caption'} color={'text.secondary'}>
                {mealsAtRank > 0 ? `${mealsAtRank} meal${mealsAtRank > 1 ? 's' : ''}` : '-'}
              </Typography>
            </Stack>
          </CardContent>
        </Card>;
      })}
    </Stack>

  </>;
};

export default Ribbons;
