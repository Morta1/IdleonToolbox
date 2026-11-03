import React from 'react';
import { islands } from '@website-data';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import Num from '@components/common/Num';
import { formatSystem } from '@utility/gameNotation';

// Gold bars (SailT0) buy captains; SailT1 and up are the islands' treasures, two per island, which the game data does
// not name (Leftovers: z-processing)
export const treasureName = (index) => (index === 0 ? 'Gold bars' : `Treasure ${index}`);
export const treasureIndex = (rawName) => Number(String(rawName).replace('SailT', '')) || 0;

// Gold bars, then two treasures per island: the loot pile's length in a save (35 with 17 islands). An empty save has
// no pile (the parser maps the save), so the page counts the catalog itself.
const LOOT_COUNT = 1 + 2 * (islands?.length ?? 0);

const LootPile = ({ lootPile }) => <CardGrid size={'icon'}>
  {Array.from({ length: Math.max(LOOT_COUNT, lootPile?.length ?? 0) }, (_, index) => {
    const amount = lootPile?.[index]?.amount ?? 0;
    return <IconTile key={index} icon={`data/SailT${index}.png`} alt={treasureName(index)}
                     value={<Num value={amount} system={'Sailing'}/>} status={amount > 0 ? undefined : 'missing'}
                     details={`${treasureName(index)}: ${formatSystem(amount, 'amount', 'Sailing')}`}/>;
  })}
</CardGrid>;

export default LootPile;
