import React from 'react';
import { Stack } from '@mui/material';
import { cleanUnderscore } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { boneNames } from '@parsers/class-specific/grimoire';
import { monsterSprite } from '@utility/spriteImages';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';

const MONSTERS_TOOLBAR = { bone: 'all' };

const Monsters = ({ monsters }) => {
  const [view, setView, resetView] = useToolbarState('grimoire-monsters', MONSTERS_TOOLBAR);
  // A failed grimoire section has no list: an empty catalog, not a crash
  const catalog = monsters ?? [];
  const shown = view?.bone === 'all' ? catalog : catalog.filter(({ boneType }) => `${boneType}` === view?.bone);
  return <Stack gap={3}>
    <Toolbar state={view} defaults={MONSTERS_TOOLBAR} onChange={setView} onReset={resetView}
             total={catalog.length} shown={shown.length} noun={'monsters'}>
      <Toolbar.Show name={'bone'} options={[['all', 'All bones', catalog.length],
        ...boneNames.map((name, index) => [`${index}`, name, catalog.filter(({ boneType }) => boneType === index).length])]}/>
    </Toolbar>
    {shown.length ? <CardGrid size={'s'}>
      {shown.map(({ Name, description, boneType, boneQuantity }, index) => <ItemCard
        key={`${Name}-${index}`} icon={monsterSprite(Name)} title={cleanUnderscore(Name ?? '')}
        meta={description ? cleanUnderscore(description) : undefined}>
        <ItemCard.Facts rows={[['Bones per kill', <Stack key={'bones'} component={'span'} direction={'row'} alignItems={'center'} gap={0.5}>
          {formatGame(boneQuantity ?? 0, 'Summoning.GrimoireBoneQTYbase')}
          <GameIcon src={`data/Bone${boneType}_x1.png`} size={16} alt={boneNames[boneType] ?? ''}/>
        </Stack>]]}/>
      </ItemCard>)}
    </CardGrid> : null}
  </Stack>;
};

export default Monsters;
