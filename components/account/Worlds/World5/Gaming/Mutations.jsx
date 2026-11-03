import { Stack } from '@mui/material';
import { formatNum, getBitIndex } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import React from 'react';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import { createBreakdown, flatLines } from '@parsers/breakdown';

const Mutations = ({ gaming }) => {
  const {
    mutations,
    unlockedMutations,
    dna,
    mutationCost,
    newMutationChance,
    mutationChanceBreakpoints
  } = gaming ?? {};
  const chanceText = formatNum(newMutationChance ?? 0, 'pct');
  // Info 5: the chance per DNA amount was a hover list on the DNA tile; it is the chance's own list
  const chanceBreakdown = mutationChanceBreakpoints?.length
    ? createBreakdown('New mutation chance', chanceText, flatLines(mutationChanceBreakpoints.map(({ value, chance }) => ({
      name: `${formatNum(value)} DNA`, value: chance, formatted: formatNum(chance ?? 0, 'pct')
    }))), { combine: 'list' })
    : undefined;

  return <>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={3}>
      <StatTile label={'DNA'} icon={'etc/DNA.png'} value={dna ?? 0} kind={'amount'}/>
      <StatTile label={'New mutation chance'} value={chanceText} breakdown={chanceBreakdown}/>
      <StatTile label={'Mutation cost'} icon={`etc/Bits_${getBitIndex(mutationCost ?? 0)}.png`}
                value={formatGame(mutationCost ?? 0, 'GamingStatType.MutateUpgCosts')}/>
    </Stack>
    <CardGrid size={'m'}>
      {mutations?.map(({ name, description }, index) => {
        const unlocked = index < (unlockedMutations ?? 0);
        return <ItemCard key={name} icon={`etc/Mutation_${index}.png`} title={name} dimmed={!unlocked}
                         status={unlocked ? 'done' : undefined} statusLabel={unlocked ? 'Unlocked' : undefined}>
          {/* The mutation text's own break, a sentence on one line */}
          <ItemCard.Desc text={description?.replaceAll('|', ' ')}/>
        </ItemCard>;
      })}
    </CardGrid>
  </>;
};

export default Mutations;
