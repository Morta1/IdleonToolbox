import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { holeCostIcon, holeResourceName, villagerTiles } from '@components/account/Worlds/World5/Hole/commons';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import Notice from '@components/common/Notice';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';
import { getHoleResourceIcon } from '@parsers/world-5/hole';

const SCHEMATICS_TOOLBAR = { show: 'todo' };
// The schematics a set holds: the ones still to create, every one, or the ones whose bonus grows with another Hole number
const IN_SET = {
  todo: (schematic) => !schematic?.unlocked,
  all: () => true,
  scaling: (schematic) => Boolean(schematic?.scaling)
};

const getUnlockLevelByIndex = (schematicIndex) => {
  let level = 1;
  let totalSchematics = 0;

  // Level 1 unlocks 4 schematics (indices 0, 1, 2, 3)
  if (schematicIndex <= 3) {
    return 1;  // If the index is 0–3, it's level 1.
  }

  totalSchematics = 4;  // Level 1 unlocks 4 schematics (index 0 to 3)

  // Start from level 2
  level = 2;

  // Loop through each level
  while (totalSchematics <= schematicIndex) {
    if (level % 5 === 0) {
      totalSchematics += 4; // Every 5th level unlocks 4 schematics
    } else {
      totalSchematics += 3; // Other levels unlock 3 schematics
    }
    level++;
  }

  return level - 1;
}

const Engineer = ({ hole }) => {
  const engineer = hole?.villagers?.[1];
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('hole-schematics', SCHEMATICS_TOOLBAR);
  // A schematic's place in the game's list says when it unlocks, so it is kept before the list is filtered
  const schematics = (hole?.engineerBonuses ?? []).map((schematic, order) => ({ ...schematic, order }));
  const count = (set) => schematics.filter(IN_SET[set]).length;
  const shown = schematics.filter(IN_SET[toolbar?.show] ?? IN_SET.todo);

  const schematicCard = ({ index, name, description, unlocked, owned, cost, x2, order }) => {
    const isLocked = (hole?.unlockedSchematics ?? 0) <= order;
    const resource = getHoleResourceIcon(x2);
    return <ItemCard key={`upgrade-${index}`} icon={`data/HoleUIbuildUpg${index}.png`} title={cleanUnderscore(name)}
                     status={unlocked ? 'active' : isLocked ? 'locked' : undefined}
                     statusLabel={unlocked ? 'Created' : undefined}
                     footer={unlocked ? null : isLocked
                       ? <Typography variant={'body2'} color={'text.secondary'}>
                         Unlocks at {formatNum(getUnlockLevelByIndex(order), 'level')}
                       </Typography>
                       : <ItemCard.Cost icon={holeCostIcon(resource)} iconAlt={holeResourceName(resource)} need={cost ?? 0}
                                        have={Math.max(0, owned ?? 0)} game={'Holes.BuildCost'}/>}>
      <ItemCard.Desc text={description}/>
    </ItemCard>;
  };

  return <>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={3}>
      {villagerTiles(engineer)}
      <StatTile label={'Unlocked schematics'}
                value={`${formatNum(hole?.unlockedSchematics ?? 0)} / ${formatNum(hole?.totalSchematics ?? 0)}`}/>
    </Stack>
    <Box>
      <Toolbar state={toolbar} defaults={SCHEMATICS_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}
               total={schematics.length} shown={shown.length} noun={'schematics'}>
        <Toolbar.Show options={[['todo', 'To create', count('todo')], ['all', 'All schematics', count('all')],
          ['scaling', 'Scaling schematics', count('scaling')]]}/>
      </Toolbar>
      {shown.length === 0 && (toolbar?.show ?? 'todo') === 'todo' ? <Notice>Every schematic is created.</Notice> : null}
      <CardGrid size={'m'}>{shown.map(schematicCard)}</CardGrid>
    </Box>
  </>;
};

export default Engineer;
