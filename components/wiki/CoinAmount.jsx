import React from 'react';
import { Stack, Typography } from '@mui/material';
import { getCoinsArray, prefix } from '@utility/helpers';

// Coins are stored in the smallest denomination, 100 to the next one up, so a quest paying
// 1,500,000,000 pays 15 dementia coins and a monster dropping 610 drops 6 silver 10 copper.
// Printing the raw number is not a big number, it is the wrong number, and it is what the wiki
// shows as an icon and a count.
//
// getCoinsArray already returns highest denomination first, and pads the ones below with zeroes:
// 1,500,000,000 comes back as 15 dementia then four zeroes. Only the non-zero ones are worth ink.
const CoinAmount = ({ amount, size = 18 }) => {
  const coins = getCoinsArray(amount).filter(([, quantity]) => quantity > 0);
  if (coins.length === 0) return null;

  return <Stack direction={'row'} gap={0.75} alignItems={'center'} flexWrap={'wrap'}>
    {coins.map(([coinIndex, quantity]) => <Stack
      key={coinIndex} direction={'row'} gap={0.25} alignItems={'center'}
    >
      <img
        src={`${prefix}data/Coins${coinIndex}.png`}
        alt={''}
        width={size}
        height={size}
        style={{ objectFit: 'contain' }}
      />
      <Typography variant={'caption'} color={'text.secondary'}>{quantity.toLocaleString('en-US')}</Typography>
    </Stack>)}
  </Stack>;
};

export const isCoin = (node) => node?.rawName === 'COIN';

export default CoinAmount;
