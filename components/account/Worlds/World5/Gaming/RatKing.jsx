import React, { Fragment } from 'react';
import InfoButton from '@components/common/InfoButton';
import { formatGame } from '@utility/gameNotation';
import ItemCard from '@components/common/cards/ItemCard';
import ShopTable from './ShopTable';

// The King Rat import's panel: rat tokens read in the amount kind on both sides, the balance and the shop costs
const RatKing = ({ ratKing }) => {
  if (!ratKing) return null;
  const { crownsCount, kingRatUnlocked, ratBitMulti, ratCurrencyGain, ratCrownOneIn, shopUpgrades } = ratKing;
  return <>
    <ItemCard.Section label={'King Rat'}>
      <ItemCard.Facts rows={[
        ['Crowns', crownsCount ?? 0, 'amount'],
        ['Bit multi', `${formatGame(ratBitMulti ?? 1, 'GamingStatType.RatBitMulti')}x`],
        [<Fragment key={'crown'}>Crown chance <InfoButton label={'Crown chance'}>Royalty Boxes collected per new
          crown, on average, as the King Rat screen shows it. Rises with every crown you own.</InfoButton></Fragment>, `1 in ${formatGame(ratCrownOneIn ?? 0, 'GamingStatType.RatCrownOdds')}`],
        kingRatUnlocked ? ['Token gain', `${formatGame(ratCurrencyGain ?? 0, 'GamingStatType.RatCurrencyGain')}/hr`] : null
      ]}/>
    </ItemCard.Section>
    {shopUpgrades?.length ? <ItemCard.Section label={'King Rat Shop'}>
      <ShopTable rows={shopUpgrades} currency={'tokens'} withBonus/>
    </ItemCard.Section> : null}
  </>;
};

export default RatKing;
