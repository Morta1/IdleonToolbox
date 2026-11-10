import { Stack } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import React from 'react';
import { createBreakdown, flatLines } from '@parsers/breakdown';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import { opalsFoundTile } from '@components/account/Worlds/World5/Hole/commons';

// The first wish's cost past level 10 (LampWishCost): the game's "no more wishes"
const NO_MORE_WISHES = 999999;

const TheLamp = ({ hole }) => {
  const theLamp = hole?.caverns?.theLamp;

  return <>
    <Stack direction={'row'} gap={1} flexWrap={'wrap'} mb={3}>
      <StatTile label={'Wishes'} value={theLamp?.currentWishes ?? 0} kind={{ game: 'Save.LampWishes' }}/>
      <StatTile label={'Wishes per day'} value={formatNum(theLamp?.wishPerDay ?? 0, 'amount', { precise: true })}/>
      {opalsFoundTile(hole, 6)}
    </Stack>
    <CardGrid size={'m'}>
      {(theLamp?.wishes ?? []).map(({ description, name, futureCosts, cost, timesWished }, index) => {
        const maxed = index === 0 && cost === NO_MORE_WISHES;
        // futureCosts holds the five wishes after the next one; the first wish stops at the game's "no more"
        const costs = [cost, ...(futureCosts ?? [])].filter((value) => !(index === 0 && value === NO_MORE_WISHES));
        // Info 5: the next wishes' costs, a list inside a hover note before, in a drawer named by its row as the Well's
        // ("Another Try cost")
        const nextCosts = createBreakdown(`${cleanUnderscore(name)} cost`, formatNum(cost ?? 0, 'whole'), flatLines(costs.map((value, step) => ({
          name: step ? `Wish ${step + 1}` : 'Next wish', value, formatted: formatNum(value ?? 0, 'whole')
        }))), { combine: 'list' });
        return <ItemCard key={`wish-${index}`} title={cleanUnderscore(name)} status={maxed ? 'maxed' : undefined}
                         footer={<ItemCard.Facts rows={[
                           ['Times wished', formatNum(timesWished ?? 0, 'whole')],
                           ['Cost', <Breakdown key={'cost'} asValue data={nextCosts}>
                             {formatNum(cost ?? 0, 'whole')}
                           </Breakdown>]
                         ]}/>}>
          <ItemCard.Desc text={description}/>
        </ItemCard>;
      })}
    </CardGrid>
  </>;
};

export default TheLamp;
