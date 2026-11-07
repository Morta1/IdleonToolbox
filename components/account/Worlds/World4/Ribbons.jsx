import React, { useState } from 'react';
import { Box, Button, Slider, Stack, Typography } from '@mui/material';
import { formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { calcDailyRibbons, getRibbonBonus, getSmokyRibbonBonus } from '@parsers/world-4/cooking';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import InfoButton from '@components/common/InfoButton';
import Notice from '@components/common/Notice';
import { cookingMasteryRiftText, isCookingMasteryUnlocked } from './CookingMastery';

const ribbonIcon = (rank) => `data/Ribbon${Math.max(0, rank - 1)}.png`;
const ribbonMulti = (account, rank) => `${formatGame(getRibbonBonus(account, rank), 'Summoning.RibbonBonus')}x`;
// A rank's daily chance, "<0.01%" for a real chance too small to print
const chanceText = (chance) => (chance <= 0 ? '-' : chance * 100 >= 0.01 ? formatNum(chance * 100, 'pct') : '<0.01%');

// A section's h2 with its note on a visible i
const sectionTitle = (title, note) => <Stack direction={'row'} alignItems={'center'} gap={0.5} sx={{ mt: 3, mb: 1 }}>
  <Typography variant={'sectionTitle'} component={'h2'}>{title}</Typography>
  <InfoButton label={title}>{note}</InfoButton>
</Stack>;

// The current value and, while the slider previews another split, the preview after an arrow. widest is the text it
// keeps room for (both numbers at their widest), so the tiles beside it never move while the slider drags.
const previewValue = (current, preview, widest) => {
  const changed = Math.abs(preview - current) > 1e-9;
  return <Box component={'span'} sx={{ display: 'inline-grid', fontVariantNumeric: 'tabular-nums', '& > *': { gridArea: '1 / 1' } }}>
    <span>
      {formatNum(current, 'amount', { precise: true })}
      {changed ? ` → ${formatNum(preview, 'amount', { precise: true })}` : null}
    </span>
    {widest ? <Box component={'span'} aria-hidden sx={{ visibility: 'hidden' }}>{widest}</Box> : null}
  </Box>;
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
  // The slider's two ends: every rank it can reach, so the odds row keeps its tiles while previewing, and the widest
  // average rank, so its tile keeps that room
  const ends = [0, maxPoints].map((points) => calcDailyRibbons(inputs, getSmokyRibbonBonus((smoky?.baseMulti ?? 0) * points)));
  const reachableRanks = [...ends, current]
    .flatMap(({ rankChances: chances }) => chances.map((chance, rank) => chance >= 1e-6 ? rank : 0))
    .filter((rank) => rank > 0);
  const rankChances = [...new Set(reachableRanks)]
    .toSorted((a, b) => a - b)
    .map((rank) => ({ rank, chance: daily.rankChances[rank] ?? 0 }));
  const { expected, min, max } = daily?.count ?? {};
  const perDayText = `${formatNum(expected ?? 0, 'amount', { precise: true })} (${min === max
    ? formatNum(min ?? 0)
    : `${formatNum(min ?? 0)} to ${formatNum(max ?? 0)}`})`;
  const rankText = formatNum(daily?.expectedRank ?? 0, 'amount', { precise: true });
  // Both numbers at three decimals, the longest of the two ends and the current one (tabular digits: same width)
  const canPreview = Boolean(smoky?.unlocked) && maxPoints > 0;
  const widestRank = [...ends, current].map(({ expectedRank }) => formatNum(expectedRank ?? 0, 'amount', { decimals: 3 }))
    .reduce((longest, text) => (text.length > longest.length ? text : longest));

  return <>
    {sectionTitle('Daily ribbons', 'Ribbons added to your shelf every day and the chance for each rank. When the shelf is full, a new ribbon combines with one of the same rank, otherwise it replaces a lower one. Move the Smoky slider to preview a different Cooking Mastery point split, your save is not changed.')}
    {!daily.unlocked ? <Notice tone={'locked'}>Daily ribbons unlock from the Ribbon Winning Grimoire upgrade.</Notice> : <>
      <Stack direction={'row'} flexWrap={'wrap'} gap={1} alignItems={'stretch'}>
        <StatTile label={'Ribbons per day'} value={perDayText} breakdownTitle={'Ribbons per day'}
                  breakdown={daily.countBreakdown ? { ...daily.countBreakdown, totalValue: perDayText } : undefined}/>
        <StatTile label={'Average rank'} value={previewValue(current.expectedRank, daily.expectedRank,
                    canPreview ? `${widestRank} → ${widestRank}` : null)}
                  breakdownTitle={'Average rank'}
                  breakdown={daily.rankBreakdown ? { ...daily.rankBreakdown, totalValue: rankText } : undefined}/>
        <StatTile label={'Points in Smoky'}>
          <Stack direction={'row'} alignItems={'center'} gap={1.5}>
            <Slider size={'small'} min={0} max={maxPoints} step={1} value={smokyPoints}
                    aria-label={'Points in Smoky'}
                    disabled={!smoky?.unlocked || maxPoints === 0}
                    onChange={(_, value) => setPreviewPoints(value)}
                    marks={[{ value: currentPoints }]}
                    sx={{
                      width: 120,
                      '& .MuiSlider-mark': { width: 3, height: 14, borderRadius: 1, bgcolor: 'text.secondary', opacity: 1 },
                      '& .MuiSlider-markActive': { bgcolor: 'text.secondary', opacity: 1 }
                    }}/>
            <Typography variant={'body2'} component={'div'} noWrap sx={{ minWidth: 104, fontVariantNumeric: 'tabular-nums' }}>
              {`${formatNum(smokyPoints)} / ${formatNum(maxPoints)}: ${formatNum(smokyBonus, 'pct')}`}
            </Typography>
            {/* Its room is kept while hidden, so the tile does not change width */}
            <Button size={'small'} onClick={() => setPreviewPoints(null)}
                    sx={{ visibility: isPreview ? 'visible' : 'hidden' }}>Reset</Button>
          </Stack>
          <Stack direction={'row'} alignItems={'center'} gap={0.75}>
            <Box sx={{ width: 3, height: 12, borderRadius: 1, bgcolor: 'text.secondary' }}/>
            <Typography variant={'caption'} color={'text.secondary'} noWrap>
              {`${formatNum(currentPoints)} ${currentPoints === 1 ? 'pt' : 'pts'} now (${formatNum(smoky?.bonus ?? 0, 'pct')})`}
            </Typography>
          </Stack>
        </StatTile>
      </Stack>
      <CardGrid size={'icon'} sx={{ mt: 2 }}>
        {rankChances.map(({ rank, chance }) => <IconTile key={`daily-rank-${rank}`} icon={ribbonIcon(rank)}
                                                         alt={`Rank ${rank}`} value={chanceText(chance)}
                                                         status={chance > 0 ? undefined : 'missing'}
                                                         details={`Rank ${rank}: ${chanceText(chance)} chance per ribbon`}/>)}
      </CardGrid>
      {daily.rankChances[2] > 0 && rankChances.some(({ rank, chance }) => rank >= 18 && chance > 0) ?
        <Typography variant={'caption'} color={'text.secondary'} component={'p'} sx={{ mt: 1 }}>
          The game turns any daily roll above Rank 20 into a Rank 2 ribbon.
        </Typography> : null}
    </>}
  </>;
};

// In a failed section the page's note says why there are none
const Ribbons = ({ cookingMastery, account, sectionFailed }) => {
  const ribbons = cookingMastery?.ribbons;
  if (!ribbons?.totalMeals) {
    return sectionFailed ? null : <Notice tone={'locked'} sx={{ mt: 1 }}>{isCookingMasteryUnlocked(account)
      ? 'Ribbons unlock from the Grimoire.'
      : `Ribbons unlock from the Grimoire, and Cooking Mastery at ${cookingMasteryRiftText}.`}</Notice>;
  }

  const legendRanks = Array.from({ length: ribbons?.maxRank ?? 0 }, (_, index) => index + 1);

  return <>
    <Stack direction={'row'} flexWrap={'wrap'} gap={1} mb={3} alignItems={'stretch'}>
      <StatTile label={'Total ribbon ranks'} value={ribbons?.total ?? 0} kind={'amount'}
                info={'Ranks are counted across your meals only, ribbons still on the shelf are not included. This is the total the Sour mastery category scales with.'}/>
      <StatTile label={'Highest ribbon'} value={ribbons?.highest > 0 ? `Rank ${formatNum(ribbons.highest)}` : '-'}
                sub={ribbons?.highest > 0 ? ribbonMulti(account, ribbons.highest) : undefined}/>
      <StatTile label={'Lowest ribbon'} value={ribbons?.lowest > 0 ? `Rank ${formatNum(ribbons.lowest)}` : '-'}
                sub={ribbons?.lowest > 0 ? ribbonMulti(account, ribbons.lowest) : undefined}/>
      <StatTile label={'Ribboned meals'}
                value={`${formatNum(ribbons?.ribbonedMeals ?? 0)} / ${formatNum(ribbons?.totalMeals ?? 0)}`}/>
      <StatTile label={'Max rank'} value={ribbons?.maxRank ?? 0} kind={'amount'}/>
    </Stack>

    {cookingMastery?.dailyRibbons ? <DailyRibbons inputs={cookingMastery.dailyRibbons}/> : null}

    {sectionTitle('Ribbon shelf', 'Ribbons waiting on your shelf in-game. Drag one onto a meal to apply it permanently, or onto a duplicate rank to combine.')}
    <CardGrid size={'icon'}>
      {ribbons?.shelf?.map((shelfRank, index) => shelfRank > 0
        ? <IconTile key={`shelf-${index}`} icon={ribbonIcon(shelfRank)} alt={`Rank ${shelfRank}`} value={shelfRank}
                    kind={'amount'} details={`Rank ${shelfRank} ribbon`}/>
        : <IconTile key={`shelf-${index}`} status={'empty'}/>)}
    </CardGrid>

    {sectionTitle('Rank legend', 'The meal bonus multiplier each ribbon rank gives, including your Emperor set and Equinox cloud bonuses. Ranks you already have on a meal are highlighted.')}
    <CardGrid size={'icon'}>
      {legendRanks.map((legendRank) => {
        const mealsAtRank = ribbons?.rankCounts?.[legendRank] ?? 0;
        const multi = ribbonMulti(account, legendRank);
        return <IconTile key={`legend-${legendRank}`} icon={ribbonIcon(legendRank)} alt={`Rank ${legendRank}`} value={multi}
                         status={mealsAtRank > 0 ? undefined : 'missing'}
                         details={`Rank ${legendRank}: ${multi} meal bonus, on ${formatNum(mealsAtRank)} meal${mealsAtRank === 1 ? '' : 's'}`}/>;
      })}
    </CardGrid>
  </>;
};

export default Ribbons;
