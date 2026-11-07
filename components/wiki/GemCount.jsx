import React from 'react';
import { Stack, Typography } from '@mui/material';
import GameIcon from '@components/common/GameIcon';
import { notateAmount } from '@utility/wiki/notate';

// The sprite's own tint: the game has no separate icon for a pet crystal and draws the gem recoloured.
const TINT = { display: 'inline-flex', filter: 'hue-rotate(280deg)' };

// Gems are not an item and have no node, so they cannot be a row like everything else on the page.
// Pet crystals get the same treatment as the buy-now bonus: the game has no separate icon for
// them either and draws the gem recoloured, which is what the pets page does too.
// `caption` is the smaller secondary text a listing card prints beside the art.
const GemCount = ({ amount, isGreen, isCrystal, caption = false }) => {
  const text = notateAmount(amount);
  const gem = <GameIcon src={'data/PremiumGem.png'} size={16} alt={''}/>;
  return <Stack direction={'row'} gap={0.5} alignItems={'center'}>
    {isGreen || isCrystal ? <span style={TINT}>{gem}</span> : gem}
    {caption ? <Typography variant={'caption'} color={'text.secondary'}>{text}</Typography> : <span>{text}</span>}
  </Stack>;
};

export default GemCount;
