import React from 'react';
import { Stack, Typography } from '@mui/material';
import { prefix } from '@utility/helpers';

// Gems are not an item and have no node, so they cannot be a row like everything else on the page.
// Pet crystals get the same treatment as the buy-now bonus: the game has no separate icon for
// them either and draws the gem recoloured, which is what the pets page does too.
// `caption` is the smaller secondary text a listing card prints beside the art.
const GemCount = ({ amount, isGreen, isCrystal, size = 16, caption = false }) => {
  const text = amount.toLocaleString('en-US');
  return <Stack direction={'row'} gap={0.5} alignItems={'center'}>
    <img
      src={`${prefix}data/PremiumGem.png`}
      alt={''}
      width={size}
      height={size}
      style={{ objectFit: 'contain', filter: isGreen || isCrystal ? 'hue-rotate(280deg)' : 'unset' }}
    />
    {caption ? <Typography variant={'caption'} color={'text.secondary'}>{text}</Typography> : <span>{text}</span>}
  </Stack>;
};

export default GemCount;
