import React from 'react';
import { formatNum } from '@utility/helpers';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

// Decision 12: an obstruction's HP has no gameNotation key, so the amount kind
const Obstructions = ({ obstructions }) => {
  const released = obstructions?.filter(({ placeholder }) => !placeholder) ?? [];
  return <CardGrid size={'m'}>
    {released.map(({ index, name, description, defeated, hp, time }) => <ItemCard key={index} icon={`data/JellyOp${index}.png`}
                                                                               title={name} dimmed={!defeated}
                                                                               meta={`${formatNum(hp ?? 0)} HP · ${time}s`}>
      <ItemCard.Desc text={description?.replace(/\n/g, '@')}/>
    </ItemCard>)}
  </CardGrid>;
};

export default Obstructions;
