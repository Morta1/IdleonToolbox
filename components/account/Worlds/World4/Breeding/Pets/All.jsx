import React, { useContext } from 'react';
import { Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { AppContext } from '@components/common/context/AppProvider';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import StatTile from '@components/common/cards/StatTile';
import ItemCard from '@components/common/cards/ItemCard';
import { petIcon } from './Other';

// Each world's cells, then its pets: the level as the value, the gene as the tile's mark, both abilities in its details
const All = ({ pets }) => {
  const { state } = useContext(AppContext);
  const genetics = state?.account?.breeding?.genetics;

  return <Stack gap={3}>
    {pets?.map((list, worldIndex) => <Stack key={`world-${worldIndex}`} gap={1}>
      <Stack direction={'row'} alignItems={'center'} gap={1} flexWrap={'wrap'}>
        <Typography variant={'sectionTitle'} component={'h2'}>World {worldIndex + 1}</Typography>
        <StatTile label={'Cells'} icon={`data/Genetic${worldIndex}.png`}
                  value={formatGame(genetics?.[worldIndex] ?? 0, 'Breeding.GeneticCost', { whole: true })}/>
      </Stack>
      <CardGrid size={'icon'}>
        {list?.map((pet) => <IconTile key={pet?.monsterName} icon={petIcon(pet)} alt={cleanUnderscore(pet?.monsterName)}
                                      value={pet?.level ?? 0} kind={'amount'} status={pet?.unlocked ? undefined : 'missing'}
                                      mark={pet?.gene ? `data/GeneReady${pet.gene.index}.png` : undefined}
                                      markAlt={cleanUnderscore(pet?.gene?.name)}
                                      details={<ItemCard.Desc text={[`${cleanUnderscore(pet?.monsterName)}: Lv ${formatNum(pet?.level ?? 0)}`,
                                        `${cleanUnderscore(pet?.gene?.name)} gene`, `Combat: ${cleanUnderscore(pet?.gene?.combatAbility)}`,
                                        `Bonus: ${cleanUnderscore(pet?.gene?.bonusAbility)}`]}/>}/>)}
      </CardGrid>
    </Stack>)}
  </Stack>
};

export default All;
