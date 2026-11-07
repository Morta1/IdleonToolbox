import React from 'react';
import { formatNum } from '@utility/helpers';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

// The DPS is the game's cell card, as the Layout's note reads it. A cell's EXP has no print in the game: the whole kind
const Cells = ({ cells }) => <CardGrid size={'s'}>
  {cells?.map(({ index, name, unlocked, level, expReq, dps, passive, effect }) => <ItemCard
    key={index} icon={`data/JellyUnit${index}.png`} title={name}
    level={unlocked ? { value: level ?? 0 } : undefined} status={unlocked ? undefined : 'locked'}>
    <ItemCard.Facts rows={[
      ['DPS', dps ?? 0, { game: 'JellyOperation.CellDPS' }],
      passive ? ['Passive', passive] : null,
      ['Next level', `${formatNum(expReq ?? 0, 'whole')} EXP`]
    ]}/>
    {effect ? <ItemCard.Desc text={effect}/> : null}
  </ItemCard>)}
</CardGrid>;

export default Cells;
