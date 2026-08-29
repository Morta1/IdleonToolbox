import React from 'react';
import { Stack, Typography } from '@mui/material';
import CoinAmount from './CoinAmount';
import { prefix } from '@utility/helpers';

// Not every shop takes coins. The nine town shops do, and their price goes through CoinAmount so it
// reads in the game's denominations; the gem shop, Killroy's and the weekly boss shop each take
// their own currency, where the number is already the number and only wants its icon beside it.
const CURRENCY_ART = {
  gem: 'data/PremiumGem.png',
  skull: 'etc/Killroy_Skull.png',
  token: 'data/Weekly.png'
};

const Price = ({ price, currency, size = 16 }) => {
  if (!(price > 0)) return null;
  if (!currency) return <CoinAmount amount={price} size={size}/>;

  const art = CURRENCY_ART[currency];
  return <Stack direction={'row'} gap={0.25} alignItems={'center'}>
    {art ? <img
      src={`${prefix}${art}`}
      alt={''}
      width={size}
      height={size}
      style={{ objectFit: 'contain' }}
    /> : null}
    <Typography variant={'caption'} color={'text.secondary'}>{price.toLocaleString('en-US')}</Typography>
  </Stack>;
};

export default Price;
