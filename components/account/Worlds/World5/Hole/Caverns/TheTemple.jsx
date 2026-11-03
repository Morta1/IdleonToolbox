import { Stack } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import React from 'react';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import { opalsFoundTile } from '@components/account/Worlds/World5/Hole/commons';

const TORCH_ICON = 'data/HoleUIbuildUpg77.png';

const TheTemple = ({ hole }) => {
  const temple = hole?.caverns?.theTemple;
  const torches = Math.floor(temple?.torches ?? 0);
  // The tile and its drawer read one text
  const chanceText = formatNum(temple?.extraTorchChance?.value ?? 0, 'pct');
  const chanceBreakdown = temple?.extraTorchChance?.breakdown;
  return <>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={3}>
      <StatTile label={'Torches'} icon={TORCH_ICON} value={torches} kind={'amount'}/>
      <StatTile label={'Layer'} value={temple?.layer ?? 0} kind={'amount'}/>
      <StatTile label={'Extra torch chance'} value={chanceText}
                breakdown={chanceBreakdown ? { ...chanceBreakdown, totalValue: chanceText } : undefined}/>
      {opalsFoundTile(hole, 14)}
    </Stack>
    <CardGrid size={'m'}>
      {(temple?.bonuses ?? []).map(({ name, description, cost }, index) =>
        <ItemCard key={`bonus-${index}`} title={cleanUnderscore(name)}
                  footer={<ItemCard.Cost icon={TORCH_ICON} iconAlt={'Torches'} need={cost ?? 0} have={torches}
                                         game={'Holes.TempleTorchCost'}/>}>
          <ItemCard.Desc text={description}/>
        </ItemCard>)}
    </CardGrid>
  </>;
};

export default TheTemple;
