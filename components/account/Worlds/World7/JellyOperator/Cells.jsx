import React from 'react';
import { formatNum } from '@utility/helpers';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

// Decision 12: a cell's DPS and EXP have no gameNotation key, so the amount kind, as the Layout's note reads them
const Cells = ({ cells }) => <CardGrid size={'s'}>
  {cells?.map(({ index, name, unlocked, level, expReq, dps, passive, effect }) => <ItemCard
    key={index} icon={`data/JellyUnit${index}.png`} title={name}
    level={unlocked ? { value: level ?? 0 } : undefined} status={unlocked ? undefined : 'locked'}>
    <ItemCard.Facts rows={[
      ['DPS', formatNum(dps ?? 0)],
      passive ? ['Passive', passive] : null,
      ['Next level', `${formatNum(expReq ?? 0)} EXP`]
    ]}/>
    {effect ? <ItemCard.Desc text={effect}/> : null}
  </ItemCard>)}
</CardGrid>;

export default Cells;
