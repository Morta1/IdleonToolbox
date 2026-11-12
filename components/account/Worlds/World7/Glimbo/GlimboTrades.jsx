import React from 'react';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

// The cost is the next trade's: each trade raises the price. owned maps an item's raw name to how many the account holds.
const GlimboTrades = ({ glimbo, owned }) => <CardGrid size={'m'}>
  {glimbo?.map((trade, index) => {
    const { itemName, rawItemName, trades, cost, vaultIdx, upgradeName, currentMaxLevel, nextBonusGain } = trade ?? {};
    return <ItemCard key={trade?.index ?? index} icon={`data/VaultUpg${vaultIdx}.png`} title={cleanUnderscore(upgradeName)}
                     meta={`Traded ${formatNum(trades ?? 0)} times`}
                     footer={<ItemCard.Cost icon={`data/${rawItemName}.png`} iconAlt={cleanUnderscore(itemName)}
                                            need={Math.ceil(cost ?? 0)} have={owned?.[rawItemName] ?? 0}
                                            game={'Minehead.Glimbo_Cost'}/>}>
      <ItemCard.Facts rows={[
        ['Max LV', formatNum(currentMaxLevel ?? 0)],
        ['Next trade', `+${formatNum(nextBonusGain ?? 0)} max LV`]
      ]}/>
    </ItemCard>;
  })}
</CardGrid>;

export default GlimboTrades;
