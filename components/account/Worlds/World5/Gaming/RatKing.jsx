import React from 'react';
import { formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import ItemCard from '@components/common/cards/ItemCard';
import ShopTable from './ShopTable';

// The King Rat import's panel: rat tokens read in the amount kind on both sides, the balance and the shop costs
const RatKing = ({ ratKing }) => {
  if (!ratKing) return null;
  const { crownsCount, kingRatUnlocked, ratBitMulti, ratCurrencyGain, ratCrownOdds, shopUpgrades } = ratKing;
  return <>
    <ItemCard.Section label={'King Rat'}>
      <ItemCard.Facts rows={[
        ['Crowns', crownsCount ?? 0, 'amount'],
        ['Bit multi', `${formatGame(ratBitMulti ?? 1, 'GamingStatType.RatBitMulti')}x`],
        ['Crown odds', formatNum((ratCrownOdds ?? 0) * 100, 'pct')],
        kingRatUnlocked ? ['Token gain', `${formatGame(ratCurrencyGain ?? 0, 'GamingStatType.RatCurrencyGain')}/hr`] : null
      ]}/>
    </ItemCard.Section>
    {shopUpgrades?.length ? <ItemCard.Section label={'King Rat Shop'}>
      <ShopTable rows={shopUpgrades} currency={'tokens'} withBonus/>
    </ItemCard.Section> : null}
  </>;
};

export default RatKing;
