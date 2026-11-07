import React from 'react';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import Num from '@components/common/Num';
import { formatSystem } from '@utility/gameNotation';

// Gold bars (SailT0) buy captains; SailT1 and up are the islands' treasures, two per island, which the game data does
// not name (Leftovers: z-processing)
export const treasureName = (index) => (index === 0 ? 'Gold bars' : `Treasure ${index}`);
export const treasureIndex = (rawName) => Number(String(rawName).replace('SailT', '')) || 0;

const LootPile = ({ lootPile }) => <CardGrid size={'icon'}>
  {lootPile?.map(({ amount }, index) => {
    return <IconTile key={index} icon={`data/SailT${index}.png`} alt={treasureName(index)}
                     value={<Num value={amount} system={'Sailing'}/>} status={amount > 0 ? undefined : 'missing'}
                     details={`${treasureName(index)}: ${formatSystem(amount, 'amount', 'Sailing')}`}/>;
  })}
</CardGrid>;

export default LootPile;
