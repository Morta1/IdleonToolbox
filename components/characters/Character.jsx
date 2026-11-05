import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum, prefix, sections } from 'utility/helpers';
import ErrorBoundary from '@components/common/ErrorBoundary';
import GameIcon from '@components/common/GameIcon';
import Panel from '@components/common/cards/Panel';
import SheetContext from '@components/common/cards/SheetContext';
import { cardSurface } from '@components/common/cards/tokens';
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

// A section's title on the page, where it differs from the name it is stored under
const TITLES = { Cards: 'Equipped cards', 'Obols Stats': 'Obol stats', 'Star Signs': 'Star signs', 'Equipped Bubbles': 'Equipped bubbles', 'Anvil Details': 'Anvil details' };

const ONE_LINE_SX = { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };

// A character's name row: class sprite, name, class and level on one muted line, the trophy at the right
const NameRow = ({ character }) => {
  const { name, classIndex, class: className, level, equipment } = character;
  const trophy = equipment?.reduce((res, { rawName }) => (!res && rawName?.includes('Trophy') ? rawName : res), '');
  return <Stack direction={'row'} alignItems={'center'} gap={1.5} sx={{ px: 2, py: '12px', minHeight: 68, boxSizing: 'border-box' }}>
    <GameIcon src={`data/ClassIcons${classIndex}.png`} size={40} alt={''}/>
    <Stack sx={{ minWidth: 0, flex: 1 }}>
      <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'} gap={1} sx={{ minWidth: 0 }}>
        <Typography variant={'cardTitle'} component={'h2'} sx={ONE_LINE_SX}>{name}</Typography>
        {trophy ? <Box component={'img'} src={`${prefix}data/${trophy.replace('Replica', '')}disp.png`} alt={''}
                       sx={{ width: 102, height: 19, objectFit: 'contain', display: 'block', flexShrink: 0 }}/> : null}
      </Stack>
      <Typography color={'text.secondary'} component={'div'} sx={{ ...ONE_LINE_SX, fontSize: 13, lineHeight: '18px' }}>
        {cleanUnderscore(className ?? '')} · {formatNum(level ?? 0, 'level')}
      </Typography>
    </Stack>
  </Stack>;
};

// One card per character, its sections in the one order (helpers' sections), each failing alone and keeping its place.
// One character is a sheet: the card fills the page and its sections flow down columns, each whole.
const FLOW_SX = (theme) => ({
  columnWidth: 340,
  columnGap: 0,
  columnRule: `1px solid ${(theme.vars || theme).palette.divider}`
});
const SHEET = { side: false };

const Character = ({
  character,
  account,
  lastUpdated,
  filters,
  characters,
  showSkillsRankOneOnly,
  showUnmaxedBoxesOnly
}) => {
  const {
    name,
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
    inventory,
    inventorySlots,
    playerId
  } = character;
  const views = {
    Stats: <Stats statsFilter={filters?.['Stats']} character={character} characters={characters} account={account} lastUpdated={lastUpdated}/>,
    Talents: <Talents {...character} selectedPreset={character?.selectedTalentPreset ?? 1} account={account}/>,
    Cards: <EquippedCards {...character}/>,
    Skills: <Skills skills={skillsInfo} account={account} characters={characters} character={character} charName={name} showSkillsRankOneOnly={showSkillsRankOneOnly}/>,
    Equipment: <Equipment {...{ charName: name, equipment, tools, food, character, characters, account }}/>,
    Obols: <ObolsView obols={obols} characters={characters}/>,
    'Obols Stats': <ObolsView obols={obols} obolStats characters={characters} account={account}/>,
    Inventory: <Inventory inventory={inventory} inventorySlots={inventorySlots} account={account}/>,
    Bags: <Bags {...{ bags: invBagsUsed, capBags: carryCapBags }}/>,
    Prayers: <Prayers prayers={activePrayers}/>,
    'Star Signs': <PlayerStarSigns signs={starSigns}/>,
    'Equipped Bubbles': <PlayerBubbles bubbles={equippedBubbles}/>,
    // A Panel here, not in Chips: Console draws Chips too
    Chips: <Panel title={'Chips'}>
      <Chips playerLabLevel={skillsInfo?.laboratory?.level ?? 0} playerChips={account?.lab?.playersChips?.[playerId]}/>
    </Panel>,
    Divinity: <Divinity character={character} account={account}/>,
    'Anvil Details': <AnvilDetails characters={characters} character={character} account={account}/>,
    'Post Office': <PostOffice {...postOffice} showUnmaxedBoxesOnly={showUnmaxedBoxesOnly}/>
  };

  return <SheetContext value={SHEET}>
    <Box data-character-card sx={(theme) => cardSurface(theme)}>
      <NameRow character={character}/>
      <Box sx={FLOW_SX}>
        {sections.filter((section) => filters?.[section.name]).map((section) => {
          const title = TITLES[section.name] ?? section.name;
          return <Box key={section.name} sx={{ breakInside: 'avoid', minWidth: 0 }}>
            <ErrorBoundary note={`${title} didn't load.`} tone={'missing'} resetKey={lastUpdated}
                           wrap={(note) => <Panel title={title}>{note}</Panel>}>
              {views[section.name]}
            </ErrorBoundary>
          </Box>;
        })}
      </Box>
    </Box>
  </SheetContext>;
};

export default Character;
