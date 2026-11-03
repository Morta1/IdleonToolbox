import React from 'react';
import { Stack } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import Notice from '@components/common/Notice';
import { Duration } from '@components/common/Num';

// In a failed section the page's note says why there is none
const CookingMastery = ({ cookingMastery, sectionFailed }) => {
  if (!cookingMastery) {
    return sectionFailed ? null : <Notice tone={'locked'} sx={{ mt: 1 }}>Cooking Mastery unlocks at Rift 61.</Notice>;
  }

  const {
    level,
    exp,
    expReq,
    expRate,
    rank,
    points,
    categories,
    expRateBreakdown
  } = cookingMastery;

  const hoursToLevel = expRate > 0 ? Math.max(0, expReq - exp) / expRate : null;
  const rateText = `${formatGame(expRate ?? 0, 'Summoning2.ExpRateCook')}/hr`;
  const pointsPair = (spent, left, key) => `${formatGame(spent ?? 0, key)} / ${formatGame((spent ?? 0) + (left ?? 0), key)}`;

  return <>
    <Stack direction={'row'} flexWrap={'wrap'} gap={2} mb={3} alignItems={'stretch'}>
      <StatTile label={'Mastery level'} value={level ?? 0} kind={'amount'}/>
      <StatTile label={'EXP'}
                value={`${formatGame(exp ?? 0, 'Summoning2.ExpReqCook')} / ${formatGame(expReq ?? 0, 'Summoning2.ExpReqCook')}`}/>
      <StatTile label={'EXP rate'} value={rateText} breakdownTitle={'EXP rate'}
                breakdown={expRateBreakdown ? { ...expRateBreakdown, totalValue: rateText } : undefined}/>
      <StatTile label={'Time to level'} value={hoursToLevel !== null ? <Duration seconds={hoursToLevel * 3600}/> : '-'}/>
      <StatTile label={'Rank'} value={rank ?? 0} kind={'amount'}/>
      <StatTile label={'Purple points'} value={pointsPair(points?.categorySpent, points?.categoryLeft, 'Summoning2.PtsLeftCook_P')}/>
      <StatTile label={'Yellow points'} value={pointsPair(points?.nodeSpent, points?.nodeLeft, 'Summoning2.PtsLeftCook_Y')}/>
    </Stack>

    <CardGrid size={'m'}>
      {categories?.map((category) => {
        const locked = !category?.unlocked;
        return <ItemCard key={`category-${category?.index}`}
                         title={cleanUnderscore(category?.name?.toLowerCase?.()?.capitalize?.() ?? category?.name)}
                         level={{ value: category?.points ?? 0 }} dimmed={locked} status={locked ? 'locked' : undefined}
                         meta={locked ? `Unlocks at Cooking Mastery Lv ${formatNum(category?.unlockLevel ?? 0)}` : category?.label}>
          <ItemCard.Desc text={category?.description}/>
          <ItemCard.Facts rows={[[category?.isExpBoost ? 'Total bonus' : 'Total chance',
            `+${formatGame(category?.bonusAmount ?? 0, 'Summoning2.BonusAmountcook')}%${category?.isExpBoost ? ' EXP' : ''}`]]}/>
        </ItemCard>;
      })}
    </CardGrid>
  </>;
};

export default CookingMastery;
