import React from 'react';
import { Stack } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

// Elixirs have no names in the data, so a card is its sprite and its sentence. The slot and duplicate caps have no
// data field, so they stay written in.
const Elixirs = ({ elixirs, ownedElixirs, ownedSlots, maxElixirDuplicates }) => <>
  <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={3}>
    <StatTile label={'Elixirs'} value={`${formatNum(ownedElixirs ?? 0)} / ${formatNum(elixirs?.length ?? 0)}`}/>
    <StatTile label={'Slots'} value={`${formatNum(ownedSlots ?? 0)} / 5`}/>
    <StatTile label={'Duplicates'} value={`${formatNum(maxElixirDuplicates ?? 0)} / 4`}/>
  </Stack>
  <CardGrid size={'s'}>
    {elixirs?.map((elixir, index) => (elixir ? <ItemCard key={index} icon={`data/CaveElix${index}.png`} iconAlt={`Elixir ${index + 1}`}
                                                         status={elixir.isInUse ? 'active' : undefined} statusLabel={'In use'}
                                                         dimmed={!elixir.acquired}
                                                         meta={elixir.timesUsed > 1 ? `In ${elixir.timesUsed} slots` : undefined}>
      <ItemCard.Desc text={cleanUnderscore(elixir.description).replace(/{/, elixir.bonus)}/>
    </ItemCard> : null))}
  </CardGrid>
</>;

export default Elixirs;
