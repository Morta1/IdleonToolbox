import { Stack } from '@mui/material';
import { cleanUnderscore, commaNotation, formatNum } from '@utility/helpers';
import React from 'react';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import { opalsFoundTile } from '@components/account/Worlds/World5/Hole/commons';

const TORCH_ICON = 'data/HoleUIbuildUpg77.png';

// The temple panel prints millions past 1e7 and billions past billionsFrom (1e13 for the torch count, 1e10 for costs)
const torchNotation = (value, billionsFrom) => {
  if (value > 999999999999999.9) return '999999B';
  if (value > billionsFrom) return `${commaNotation(value / 1e9)}B`;
  if (value > 9999999.9) return `${commaNotation(value / 1e6)}M`;
  return commaNotation(value);
};

const TheTemple = ({ hole }) => {
  const temple = hole?.caverns?.theTemple;
  const torches = Math.floor(temple?.torches ?? 0);
  // The tile and its drawer read one text
  const chanceText = formatNum(temple?.extraTorchChance?.value ?? 0, 'pct');
  const chanceBreakdown = temple?.extraTorchChance?.breakdown;
  return <>
    <Stack direction={'row'} gap={1} flexWrap={'wrap'} mb={3}>
      <StatTile label={'Torches'} icon={TORCH_ICON} value={torchNotation(torches, 9999999999999.9)}/>
      <StatTile label={'Layer'} value={temple?.layer ?? 0} kind={'amount'}/>
      <StatTile label={'Extra torch chance'} value={chanceText}
                breakdown={chanceBreakdown ? { ...chanceBreakdown, totalValue: chanceText } : undefined}/>
      {opalsFoundTile(hole, 14)}
    </Stack>
    <CardGrid size={'m'}>
      {(temple?.bonuses ?? []).map(({ name, description, cost }, index) =>
        <ItemCard key={`bonus-${index}`} title={cleanUnderscore(name)}
                  footer={<ItemCard.Cost icon={TORCH_ICON} iconAlt={'Torches'} need={cost ?? 0} have={torches}
                                         format={(value) => torchNotation(value, 9999999999.9)}/>}>
          <ItemCard.Desc text={description}/>
        </ItemCard>)}
    </CardGrid>
  </>;
};

export default TheTemple;
