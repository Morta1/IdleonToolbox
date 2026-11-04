import { Typography } from '@mui/material';
import { cleanUnderscore, formatNum, growth } from 'utility/helpers';
import { gameBonusText } from '@utility/gameNotation';
import React from 'react';
import Panel from '@components/common/cards/Panel';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';

const PostOffice = ({ boxes, totalPointsSpent, totalOrders, showUnmaxedBoxesOnly }) => {
  const spent = Math.floor(totalPointsSpent ?? 0);
  const orders = Math.floor(totalOrders ?? 0);
  return <Panel title={'Post Office'} meta={<>
    {`Points spent ${formatNum(spent)} / ${formatNum(orders)}`}
    {spent < orders ? ` · ${formatNum(orders - spent)} unspent` : ''}
  </>}>
    <CardGrid size={'icon'} fill sx={{ p: 1.5 }}>
      {boxes?.map((box, index) => {
        if (box?.name === 'Filler' || (showUnmaxedBoxesOnly && box?.level === box?.maxLevel)) return null;
        return <IconTile key={`${box?.name}-${index}`} icon={`data/UIboxUpg${index}.png`} alt={cleanUnderscore(box?.name ?? '')}
                         value={formatNum(box?.level ?? 0)} details={<BoxDetails {...box}/>}/>;
      })}
    </CardGrid>
  </Panel>;
};

// A box's second and third bonuses start at Lv 25 and Lv 100. The game rounds each before it draws "+N <bonus>" (N.js, the
// post office panel: the same rule as a bubble's).
const BONUS_START = [0, 25, 100];
const BoxDetails = ({ name, upgrades, level }) => <>
  <Typography variant={'cardTitle'} component={'div'}>{cleanUnderscore(name)}</Typography>
  {upgrades?.map(({ bonus, func, x1, x2 }, index) => <Typography key={`${bonus}-${index}`} variant={'body2'}>
    {`+${gameBonusText(Math.max(0, growth(func, level - BONUS_START[index], x1, x2)))}${cleanUnderscore(bonus)}`}
  </Typography>)}
</>;

export default PostOffice;
