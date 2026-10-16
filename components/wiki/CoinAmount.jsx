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
// [coinIndex, quantity] for each denomination worth printing, highest first.
export const coinsOf = (amount) => getCoinsArray(amount).filter(([, quantity]) => quantity > 0);

// `inline` draws it inside a line of text (a cost line), so every box is a span.
const CoinAmount = ({ amount, size = 18, inline = false }) => {
  const coins = coinsOf(amount);
  if (coins.length === 0) return null;
  const box = inline ? 'span' : 'div';

  return <Stack component={box} direction={'row'} gap={0.75} alignItems={'center'} flexWrap={'wrap'}
                sx={inline ? { display: 'inline-flex', verticalAlign: 'middle' } : null}>
    {coins.map(([coinIndex, quantity]) => <Stack
      component={box} key={coinIndex} direction={'row'} gap={0.25} alignItems={'center'}
    >
      <img
        src={`${prefix}data/Coins${coinIndex}.png`}
        alt={''}
        width={size}
        height={size}
        style={{ objectFit: 'contain' }}
      />
      <Typography component={'span'} variant={'caption'} color={'text.secondary'}>{quantity.toLocaleString('en-US')}</Typography>
    </Stack>)}
  </Stack>;
};

export const isCoin = (node) => node?.rawName === 'COIN';

export default CoinAmount;
