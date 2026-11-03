import React from 'react';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import ItemCard from '@components/common/cards/ItemCard';

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
      <ItemCard.Facts rows={shopUpgrades.map(({ name, level, bonus, cost }) => [cleanUnderscore(name),
        `Lv ${formatNum(level ?? 0)} · ${formatNum(bonus ?? 0, 'pct', { signed: true })} · ${formatNum(cost ?? 0)} ${cost === 1 ? 'token' : 'tokens'}`])}/>
    </ItemCard.Section> : null}
  </>;
};

export default RatKing;
