import React from 'react';
import { cleanUnderscore, getCoinsArray } from '@utility/helpers';
import { fillCeil } from '@utility/gameNotation';
import CoinDisplay from '@components/common/CoinDisplay';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

// The game's own fill: { is the bonus ceiled to hundredths, } the same of 1 + bonus / 100
const fillDescription = (description, bonus) => description
  .replace(/\{/g, String(fillCeil(bonus)))
  .replace(/\}/g, String(fillCeil(1 + bonus / 100)));

// The description's number alone ("+4.42%", "1.06x"), filled the same way, for the Next level and Max rows
const valueText = (description, bonus) => {
  const token = String(description ?? '').match(/[+-]?[{}][%x]?/)?.[0];
  return token ? fillDescription(token, bonus) : null;
};
// game: bonus = level / (100 + level) * x2, so it climbs toward x2 and never reaches it
const fishBonus = (level, x2) => level / (100 + level) * x2;

const Upgrades = ({ upgrades }) => <CardGrid size={'m'}>
  {upgrades?.map((upgrade, index) => <ItemCard key={upgrade?.name || index} icon={`etc/Advice_Fish_${index}.png`}
                                               title={cleanUnderscore(upgrade?.name)}
                                               level={{ value: upgrade?.level ?? 0 }}
                                               dimmed={!(upgrade?.level > 0)}
                                               footer={upgrade?.cost !== undefined ? <ItemCard.Facts rows={[
                                                 ['Next cost', <CoinDisplay key={'cost'} dense money={getCoinsArray(upgrade.cost)}/>]
                                               ]}/> : null}>
    {upgrade?.description ? <ItemCard.Desc text={fillDescription(upgrade.description, upgrade?.bonus ?? 0)}/> : null}
    {upgrade?.x2 > 0 && valueText(upgrade?.description, 0) ? <ItemCard.Facts rows={[
      ['Next level', valueText(upgrade.description, fishBonus((upgrade?.level ?? 0) + 1, upgrade.x2))],
      ['Max', valueText(upgrade.description, upgrade.x2)]
    ]}/> : null}
  </ItemCard>)}
</CardGrid>;

export default Upgrades;
