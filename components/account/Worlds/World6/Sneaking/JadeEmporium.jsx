import { cleanUnderscore } from '@utility/helpers';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

// Rows the game ships as placeholders until their bonus is released
const PLACEHOLDER_NAME = 'UNDER_CONSTRUCTION';

const JadeEmporium = ({ upgrades, jadeCoins }) => {
  // The save keeps the coins as text past 1e21
  const owned = Number(jadeCoins ?? 0);
  return <CardGrid size={'m'}>
    {upgrades?.filter(({ name }) => name !== PLACEHOLDER_NAME)?.map(({ name, description, unlocked, cost, x3 }, index) => {
      return <ItemCard key={name + index} icon={`data/NjJupg${x3}.png`} iconSize={56} title={cleanUnderscore(name)}
                       status={unlocked ? 'active' : undefined} statusLabel={'Purchased'}
                       footer={unlocked ? null : <ItemCard.Cost icon={'etc/jade_coin.png'} iconAlt={'Jade coins'} need={cost}
                                                                have={owned} game={'Ninja.EmporiumCost'}/>}>
        <ItemCard.Desc text={description}/>
      </ItemCard>
    })}
  </CardGrid>
};

export default JadeEmporium;
