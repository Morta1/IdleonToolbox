import React, { useMemo } from 'react';
import { Box, Grid, Stack, Typography } from '@mui/material';
import { prefix } from 'utility/helpers';
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
import styled from '@emotion/styled';
import ActiveSkillsCD from './ActiveSkillsCD';
import Inventory from './Inventory';
import Chips from '../account/Worlds/World4/Chips';

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
      component: <Stats activityFilter={filters?.['Activity']}
                        statsFilter={filters?.['Stats']}
                        character={character}
                        characters={characters}
                        account={account}
                        lastUpdated={lastUpdated}/>,
      filter: ['Stats', 'Activity']
    },
    { component: <ObolsView obols={obols} characters={characters}/>, filter: 'Obols' },
    { component: <ObolsView obols={obols} obolStats characters={characters}/>, filter: 'Obols Stats' },
    { component: <Bags {...{ bags: invBagsUsed, capBags: carryCapBags }} />, filter: 'Bags' },
    {
      component: <Talents {...character}
                          selectedPreset={character?.selectedTalentPreset ?? 1}
                          account={account}
      />,
      filter: 'Talents'
    },
    { component: <EquippedCards {...character}/>, filter: 'Cards' },
    {
      component: <Skills skills={skillsInfo} account={account} characters={characters} character={character} charName={name} showSkillsRankOneOnly={showSkillsRankOneOnly}/>,
      filter: 'Skills'
    },
    { component: <Prayers prayers={activePrayers}/>, filter: 'Prayers' },
    { component: <PlayerStarSigns signs={starSigns}/>, filter: 'Star Signs' },
    {
      component: <AnvilDetails characters={characters} character={character} account={account}/>,
      filter: 'Anvil Details'
    },
    { component: <Inventory inventory={inventory} inventorySlots={inventorySlots}/>, filter: 'Inventory' },
    { component: <PostOffice {...postOffice} showUnmaxedBoxesOnly={showUnmaxedBoxesOnly}/>, filter: 'Post Office' },
    {
      component: <Chips playerLabLevel={skillsInfo?.laboratory?.level ?? 0}
                        playerChips={account?.lab?.playersChips?.[playerId]} characters={characters}
                        charactersPage/>, filter: 'Chips'
    },
    {
      component: <Equipment {...{ charName: name, equipment, tools, food, character, account }} />,
      filter: 'Equipment'
    },
    { component: <PlayerBubbles bubbles={equippedBubbles}/>, filter: 'Equipped Bubbles' },
    {
      component: <ActiveSkillsCD postOffice={postOffice} cooldowns={cooldowns} lastUpdated={lastUpdated}
                                 talents={[...(flatTalents || []), ...(flatStarTalents || [])]} afkTime={afkTime}/>,
      filter: 'Active Skills CD'
    }
  ];

  const trophy = useMemo(() => equipment?.reduce((res, { rawName }) => (!res && rawName.includes('Trophy')
    ? rawName
    : res), ''), [character]);
  return (
    <>
      <Grid item xl={cols}>
        <Stack gap={2}>
          <Stack direction={'row'} alignItems={'center'} gap={2}>
            <Box sx={{ display: { sm: 'none', md: 'block' } }}><img src={`${prefix}data/ClassIcons${classIndex}.png`}
                                                                    alt=""/></Box>
            <Stack>
              <Typography sx={{ typography: { xs: 'body2', sm: 'body1' } }}>
                {name} ({level})
              </Typography>
              {trophy ?
                <TrophyIcon src={`${prefix}data/${trophy}disp.png`} style={{ width: 102, height: 19 }} alt=""/> : <Box
                  sx={{ width: 102, height: 19 }}></Box>}
            </Stack>
          </Stack>
          <Stack direction={'row'} flexWrap={'wrap'} gap={4}>
            {views?.map((view, index) => {
              let shouldDisplay = filters?.[view.filter];
              if (Array.isArray(view.filter)) {
                shouldDisplay = view.filter.some((v) => filters?.[v]);
              }
              return shouldDisplay ?
                <React.Fragment key={`${name}-${view?.filter}-${index}`}>{view.component}</React.Fragment> : null;
            })}
          </Stack>
        </Stack>
      </Grid>
    </>
  );
};

const TrophyIcon = styled.img`
  width: 104px;
  object-fit: contain;
`;

export default Character;
