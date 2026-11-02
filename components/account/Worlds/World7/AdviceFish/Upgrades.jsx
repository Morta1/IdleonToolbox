import React from 'react';
import { cleanUnderscore, getCoinsArray } from '@utility/helpers';
import CoinDisplay from '@components/common/CoinDisplay';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

// The game's own fill: { is the bonus ceiled to hundredths, } the same of 1 + bonus / 100
const fillDescription = (description, bonus) => description
  .replace(/\{/g, String(Math.ceil(100 * bonus) / 100))
  .replace(/\}/g, String(Math.ceil(100 * (1 + bonus / 100)) / 100));

const Upgrades = ({ upgrades }) => <CardGrid size={'m'}>
  {upgrades?.map((upgrade, index) => <ItemCard key={upgrade?.name || index} icon={`etc/Advice_Fish_${index}.png`}
                                               title={cleanUnderscore(upgrade?.name)}
                                               level={{ value: upgrade?.level ?? 0 }}
                                               dimmed={!(upgrade?.level > 0)}
                                               footer={upgrade?.cost !== undefined ? <ItemCard.Facts rows={[
                                                 ['Next cost', <CoinDisplay key={'cost'} dense money={getCoinsArray(upgrade.cost)}/>]
                                               ]}/> : null}>
    {upgrade?.description ? <ItemCard.Desc text={fillDescription(upgrade.description, upgrade?.bonus ?? 0)}/> : null}
  </ItemCard>)}
</CardGrid>;

export default Upgrades;
