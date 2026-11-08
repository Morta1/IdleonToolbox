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
import { sectionSummary } from './sectionSummary';

// A section's title on the page, where it differs from the name it is stored under
const TITLES = { Cards: 'Equipped cards', 'Obols Stats': 'Obol stats', 'Star Signs': 'Star signs', 'Equipped Bubbles': 'Equipped bubbles', 'Anvil Details': 'Anvil details' };

const ONE_LINE_SX = { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };

const SIDE_NAME_HEIGHT = 64;

// Side by side, the name stays in view. A sticky item sticks only inside its grid area, so it spans every row of the card,
// with a spacer holding its room in the first one. Its line sits on the first section's own, 1 px down, drawn over the
// page color so the two never add up; while pinned it's the only line under the name. A phone doesn't pin.
const pinnedNameSx = (pinTop) => ({
  gridRow: '1 / -1',
  gridColumn: 1,
  alignSelf: 'start',
  height: SIDE_NAME_HEIGHT + 1,
  mb: '-1px',
  borderBottom: 1,
  borderColor: 'divider',
  bgcolor: 'background.paper',
  borderRadius: '8px 8px 0 0',
  zIndex: (theme) => theme.zIndex.appBar - 2,
  position: { xs: 'static', sm: 'sticky' },
  top: pinTop,
  '@media (max-height: 500px)': { position: 'static' }
});

// One character's sheet: the line under the name runs the card's width. The sections' own top lines stopped at the last
// full column, so with one or two sections on the name read cut off from its trophy at the right (Hαlf). The columns sit
// 1 px up, so each column's first line lands on this one.
const SHEET_NAME_SX = { px: 2, py: '12px', minHeight: 68, borderBottom: 1, borderColor: 'divider' };

// A character's name row: class sprite, name, class and level on one muted line, the trophy at the right
const NameRow = ({ character, side, pinTop }) => {
  const { name, classIndex, class: className, level, equipment, hasData } = character;
  const trophy = equipment?.reduce((res, { rawName }) => (!res && rawName?.includes('Trophy') ? rawName : res), '');
  return <Stack direction={'row'} alignItems={'center'} gap={1.5} sx={[
    { boxSizing: 'border-box' },
    side ? { px: '12px', py: '10px', ...pinnedNameSx(pinTop) } : SHEET_NAME_SX
  ]}>
    <GameIcon src={`data/ClassIcons${classIndex}.png`} size={40} alt={''}/>
    <Stack sx={{ minWidth: 0, flex: 1 }}>
      <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'} gap={1} sx={{ minWidth: 0 }}>
        <Typography variant={'cardTitle'} component={'h2'} sx={ONE_LINE_SX}>{name}</Typography>
        {/* A long name wins: the trophy takes nearly all of any shortfall (a name that lost a fraction of a pixel would still draw its ellipsis), down to 64 px */}
        {trophy ? <Box component={'img'} src={`${prefix}data/${trophy.replace('Replica', '')}disp.png`} alt={''}
                       sx={{ flex: '0 10000 102px', minWidth: 64, height: 19, objectFit: 'contain', objectPosition: 'right', display: 'block' }}/> : null}
      </Stack>
      <Typography color={'text.secondary'} component={'div'} sx={{ ...ONE_LINE_SX, fontSize: 13, lineHeight: '18px' }}>
        {hasData ? `${cleanUnderscore(className)} · ${formatNum(level, 'level')}` : formatNum(0, 'level')}
      </Typography>
    </Stack>
  </Stack>;
};

// One card per character, its sections in the one order (helpers' sections), each failing alone and keeping its place.
// One character is a sheet: the card fills the page and its sections flow down columns, each whole. Side by side, the card
// takes its rows from the page's grid (SIDE_BY_SIDE_SX there), and each section keeps its row by its index.
const FLOW_SX = (theme) => ({
  mt: '-1px',
  columnWidth: 340,
  columnGap: 0,
  columnRule: `1px solid ${(theme.vars || theme).palette.divider}`
});
const sideCardSx = (rows) => ({
  gridRow: `span ${rows}`,
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  gridTemplateRows: 'subgrid',
  minWidth: 0,
  // A character past a row's columns starts a new row, and a phone stacks them: the row gap stays 0, so the lines stay shared
  mb: 2
});
// Stats opens first; the rest are remembered per section name, for every character (the page's openSections).
export const isSectionOpen = (openSections, name) => openSections?.[name] ?? name === 'Stats';

const Character = ({
  character,
  account,
  lastUpdated,
  filters,
  characters,
  side,
  obolStatOrder,
  pinTop,
  openSections,
  onToggleSection,
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
    'Obols Stats': <ObolsView obols={obols} obolStats statOrder={obolStatOrder} characters={characters} account={account}/>,
    Inventory: <Inventory inventory={inventory} inventorySlots={inventorySlots} account={account}/>,
    Bags: <Bags {...{ bags: invBagsUsed, capBags: carryCapBags }}/>,
    Prayers: <Prayers prayers={activePrayers}/>,
    'Star Signs': <PlayerStarSigns signs={starSigns}/>,
    'Equipped Bubbles': <PlayerBubbles bubbles={equippedBubbles}/>,
    // A Panel here, not in Chips: Console draws Chips too
    Chips: <Panel title={'Chips'}>
      {account?.lab?.playersChips?.[playerId]?.length
        ? <Chips playerLabLevel={skillsInfo?.laboratory?.level ?? 0} playerChips={account?.lab?.playersChips?.[playerId]}/>
        : <Typography variant={'body2'} color={'text.secondary'}>No chips to show</Typography>}
    </Panel>,
    Divinity: <Divinity character={character} account={account}/>,
    'Anvil Details': <AnvilDetails characters={characters} character={character} account={account}/>,
    'Post Office': <PostOffice {...postOffice} showUnmaxedBoxesOnly={showUnmaxedBoxesOnly}/>
  };

  const shown = sections.filter((section) => filters?.[section.name]);

  return <Box data-character-card sx={[(theme) => cardSurface(theme), side && sideCardSx(shown.length + 1)]}>
    {side ? <Box sx={{ gridRow: 1, gridColumn: 1, height: SIDE_NAME_HEIGHT }}/> : null}
    <NameRow character={character} side={side} pinTop={pinTop}/>
    <Box sx={side ? { display: 'contents' } : FLOW_SX}>
      {shown.map((section, index) => {
        const title = TITLES[section.name] ?? section.name;
        const fold = {
          open: isSectionOpen(openSections, section.name),
          onToggle: () => onToggleSection?.(section.name),
          summary: sectionSummary(section.name, character, account)
        };
        return <Box key={section.name} sx={side ? { gridRow: index + 2, gridColumn: 1, minWidth: 0 } : { breakInside: 'avoid', minWidth: 0 }}>
          <SheetContext value={{ side: Boolean(side), fold }}>
            <ErrorBoundary note={`${title} didn't load.`} tone={'missing'} resetKey={lastUpdated}
                           wrap={(note) => <SheetContext value={{ side: Boolean(side), fold: { ...fold, summary: null } }}><Panel title={title}>{note}</Panel></SheetContext>}>
              {views[section.name]}
            </ErrorBoundary>
          </SheetContext>
        </Box>;
      })}
    </Box>
  </Box>;
};

export default Character;
