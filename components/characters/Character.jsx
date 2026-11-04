import React from 'react';
import { Box, Grid, Stack } from '@mui/material';
import { prefix } from 'utility/helpers';
import ErrorBoundary from '@components/common/ErrorBoundary';
import GameIcon from '@components/common/GameIcon';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import Bags from './Bags';
import Talents from './Talents';
import EquippedCards from './EquippedCards';
import Skills from './Skills';
import Prayers from './Prayers';
import PostOffice from './PostOffice';
import ObolsView from '../account/Worlds/World2/ObolsView';
import Equipment from './Equipment';
import AnvilDetails from './AnvilDetails';
import PlayerStarSigns from './PlayerStarSigns';
import PlayerBubbles from './PlayerBubbles';
import Stats from './Stats';
import Inventory from './Inventory';
import Chips from '../account/Worlds/World4/Chips';
import Divinity from './Divinity';

const Character = ({
  character,
  account,
  lastUpdated,
  filters,
  cols,
  characters,
  showSkillsRankOneOnly,
  showUnmaxedBoxesOnly
}) => {
  const {
    name,
    classIndex,
    level,
    cards,
    skillsInfo,
    activePrayers,
    starSigns,
    postOffice,
    obols,
    equippedBubbles,
    equipment,
    tools,
    food,
    invBagsUsed,
    carryCapBags,
    flatTalents,
    flatStarTalents,
    cooldowns,
    afkTime,
    inventory,
    inventorySlots,
    playerId
  } = character;
  const views = [
    {
      component: <Stats
        statsFilter={filters?.['Stats']}
        character={character}
        characters={characters}
        account={account}
        lastUpdated={lastUpdated} />,
      filter: ['Stats']
    },
    { component: <ObolsView obols={obols} characters={characters} />, filter: 'Obols' },
    { component: <ObolsView obols={obols} obolStats characters={characters} account={account} />, filter: 'Obols Stats' },
    { component: <Bags {...{ bags: invBagsUsed, capBags: carryCapBags }} />, filter: 'Bags' },
    {
      component: <Talents {...character}
        selectedPreset={character?.selectedTalentPreset ?? 1}
        account={account}
      />,
      filter: 'Talents'
    },
    { component: <EquippedCards {...character} />, filter: 'Cards' },
    {
      component: <Skills skills={skillsInfo} account={account} characters={characters} character={character} charName={name} showSkillsRankOneOnly={showSkillsRankOneOnly} />,
      filter: 'Skills'
    },
    { component: <Prayers prayers={activePrayers} />, filter: 'Prayers' },
    { component: <PlayerStarSigns signs={starSigns} />, filter: 'Star Signs' },
    {
      component: <AnvilDetails characters={characters} character={character} account={account} />,
      filter: 'Anvil Details'
    },
    { component: <Inventory inventory={inventory} inventorySlots={inventorySlots} account={account} />, filter: 'Inventory' },
    { component: <PostOffice {...postOffice} showUnmaxedBoxesOnly={showUnmaxedBoxesOnly} />, filter: 'Post Office' },
    {
      component: <Chips playerLabLevel={skillsInfo?.laboratory?.level ?? 0}
        playerChips={account?.lab?.playersChips?.[playerId]} characters={characters}
        charactersPage />, filter: 'Chips'
    },
    {
      component: <Equipment {...{ charName: name, equipment, tools, food, character, characters, account }} />,
      filter: 'Equipment'
    },
    { component: <PlayerBubbles bubbles={equippedBubbles} />, filter: 'Equipped Bubbles' },
    { component: <Divinity character={character} account={account} />, filter: 'Divinity' }
  ];

  const trophy = equipment?.reduce((res, { rawName }) => (!res && rawName.includes('Trophy')
    ? rawName
    : res), '');

  return (
    <>
      <Grid item xs={12.5} md={Math.max(cols, 6)} lg={Math.max(cols, 4)} xl={cols}>
        <Stack gap={2}>
          <ItemCard size={'s'} icon={<GameIcon src={`data/ClassIcons${classIndex}.png`} size={32} alt={''}/>} title={name}
                    level={{ value: level ?? 0 }}
                    aside={trophy
                      ? <Box component={'img'} src={`${prefix}data/${trophy.replace('Replica', '')}disp.png`} alt={''}
                             sx={{ width: 102, height: 19, objectFit: 'contain', display: 'block' }}/>
                      : null}/>
          {/* Sections of very different heights flow down columns, each whole, and each fails alone */}
          <CardGrid size={'l'} flow>
            {views?.map((view, index) => {
              const shouldDisplay = [view.filter].flat().some((filter) => filters?.[filter]);
              return shouldDisplay ? <Box key={`${name}-${view?.filter}-${index}`}>
                <ErrorBoundary title={`${[view.filter].flat()[0]} didn't load`} resetKey={lastUpdated}>{view.component}</ErrorBoundary>
              </Box> : null;
            })}
          </CardGrid>
        </Stack>
      </Grid>
    </>
  );
};

export default Character;
