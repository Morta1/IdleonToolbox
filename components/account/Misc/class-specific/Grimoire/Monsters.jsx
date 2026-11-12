import React from 'react';
import { Stack } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { boneNames } from '@parsers/class-specific/grimoire';
import { monsterSprite } from '@utility/spriteImages';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';

const MONSTERS_TOOLBAR = { search: '', bone: 'all' };

// short: a multiplied amount in the summary's short notation (20.81M), which the base's game notation is not
const BoneAmount = ({ value, boneType, short }) => <Stack component={'span'} direction={'row'} alignItems={'center'} gap={0.5}>
  {short ? formatNum(value ?? 0) : formatGame(value ?? 0, 'Summoning.GrimoireBoneQTYbase')}
  <GameIcon src={`data/Bone${boneType}_x1.png`} size={16} alt={boneNames[boneType] ?? ''}/>
</Stack>;

// game: a kill drops 1 or 2 bone drops, each base quantity x Extra bones (GrimoireBonesDropDEC); the game's label is
// "Bones per drop". extraBones: the page's own multiplier, none on a failed section
const Monsters = ({ monsters, extraBones }) => {
  const [view, setView, resetView] = useToolbarState('grimoire-monsters', MONSTERS_TOOLBAR);
  // A failed grimoire section has no list: an empty catalog, not a crash
  const catalog = monsters ?? [];
  const search = (view?.search ?? '').trim().toLowerCase();
  // Search reads the monster and the map it is farmed on
  const shown = catalog.filter(({ boneType, Name, mapName }) => (view?.bone === 'all' || `${boneType}` === view?.bone)
    && (!search || cleanUnderscore(`${Name ?? ''} ${mapName ?? ''}`).toLowerCase().includes(search)));
  return <Stack gap={3}>
    <Toolbar state={view} defaults={MONSTERS_TOOLBAR} onChange={setView} onReset={resetView}
             total={catalog.length} shown={shown.length} noun={'monsters'}>
      <Toolbar.Search placeholder={'Search monsters or maps'}/>
      <Toolbar.Show name={'bone'} options={[['all', 'All bones', catalog.length],
        ...boneNames.map((name, index) => [`${index}`, name, catalog.filter(({ boneType }) => boneType === index).length])]}/>
    </Toolbar>
    {shown.length ? <CardGrid size={'s'}>
      {shown.map(({ Name, mapName, boneType, boneQuantity }, index) => <ItemCard
        key={`${Name}-${index}`} icon={monsterSprite(Name)} title={cleanUnderscore(Name ?? '')}
        meta={mapName ? cleanUnderscore(mapName) : undefined}>
        <ItemCard.Facts rows={[
          ['Bones per drop', <BoneAmount key={'base'} value={boneQuantity} boneType={boneType}/>],
          extraBones > 1 ? ['With Extra bones', <BoneAmount key={'extra'} value={(boneQuantity ?? 0) * extraBones} boneType={boneType} short/>] : null
        ]}/>
      </ItemCard>)}
    </CardGrid> : null}
  </Stack>;
};

export default Monsters;
