import React from 'react';
import { cleanUnderscore } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

// The clam upgrades have no art of their own; the pearl is the cost's
const Upgrades = ({ upgrades, ownedPearls }) => <CardGrid size={'m'}>
  {upgrades?.map((upgrade, index) => <ItemCard key={upgrade?.name || index} title={cleanUnderscore(upgrade?.name)}
                                               level={{ value: upgrade?.level ?? 0 }}
                                               status={upgrade?.unlocked ? undefined : 'locked'}
                                               footer={upgrade?.cost > 0
                                                 ? <ItemCard.Cost icon={'data/ClamPearl0.png'} iconAlt={'Pearls'}
                                                                  need={upgrade.cost} have={ownedPearls}
                                                                  game={'Thingies.Clam_Cost'}/>
                                                 : null}>
    {upgrade?.description ? <ItemCard.Desc text={upgrade.description}/> : null}
    {!upgrade?.unlocked && index > 0 && upgrade?.requiredPearls > 0
      ? <ItemCard.Facts rows={[['Pearls to unlock', formatGame(upgrade.requiredPearls, 'Thingies.Clam_PearlUpgReq')]]}/>
      : null}
  </ItemCard>)}
</CardGrid>;

export default Upgrades;
