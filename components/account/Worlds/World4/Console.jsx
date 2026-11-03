import { Typography } from '@mui/material';
import React from 'react';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import IconTile from '@components/common/cards/IconTile';
import Chips, { chipDetails, titleCase } from './Chips';

const Console = ({ chips, playersChips, characters }) => {
  return (
    <>
      <CardGrid size={'l'}>
        {playersChips?.map((playerChips, index) => {
          const playerLabLevel = characters?.[index]?.skillsInfo?.laboratory?.level ?? 0;
          return <ItemCard key={`player-${index}`} icon={`data/ClassIcons${characters?.[index]?.classIndex}.png`}
                           iconAlt={''} title={characters?.[index]?.name} level={{ value: playerLabLevel }}>
            <Chips playerLabLevel={playerLabLevel} playerChips={playerChips}/>
          </ItemCard>
        })}
      </CardGrid>
      {chips?.length ? <>
        <Typography variant={'sectionTitle'} component={'h2'} sx={{ mt: 4, mb: 1 }}>Chip repository</Typography>
        <CardGrid size={'icon'}>
          {chips.map((chip, index) => <IconTile key={`${chip?.name}-${index}`} icon={`data/ConsoleChip${index}.png`}
                                                alt={titleCase(chip?.name)} value={Math.max(0, chip?.repoAmount ?? 0)}
                                                kind={'amount'} details={chipDetails(chip)}/>)}
        </CardGrid>
      </> : null}
    </>
  );
};

export default Console;
