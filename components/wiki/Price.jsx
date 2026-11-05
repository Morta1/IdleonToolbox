import React from 'react';
import { Stack, Typography } from '@mui/material';
import GameIcon from '@components/common/GameIcon';
import CoinAmount from './CoinAmount';
import { notateAmount } from '@utility/wiki/notate';

// Not every shop takes coins. The nine town shops do, and their price goes through CoinAmount so it
// reads in the game's denominations; the gem shop, Killroy's and the weekly boss shop each take
// their own currency, where the number is already the number and only wants its icon beside it.
const CURRENCY_ART = {
  gem: 'data/PremiumGem.png',
  skull: 'etc/Killroy_Skull.png',
  token: 'data/Trophie.png'
};

const Price = ({ price, currency }) => {
  if (!(price > 0)) return null;
  if (!currency) return <CoinAmount amount={price}/>;

  const art = CURRENCY_ART[currency];
  return <Stack direction={'row'} gap={0.25} alignItems={'center'}>
    {art ? <GameIcon src={art} size={16} alt={''}/> : null}
    <Typography variant={'caption'} color={'text.secondary'}>{notateAmount(price)}</Typography>
  </Stack>;
};

export default Price;
