import { Stack } from '@mui/material';
import { prefix } from '@utility/helpers';
import React from 'react';
import { DOUBLER_ICONS } from '@components/account/Worlds/World7/Menagerie/menagerie.utils';

// The game draws its black star glyph once per Black Star placed on a palette colour
const BlackStars = ({ count, size = 16 }) => {
  if (!(count > 0)) return null;
  return <Stack direction={'row'} gap={.25} sx={{ position: 'relative', zIndex: 2, pointerEvents: 'none' }}>
    {Array.from({ length: count }, (_, index) => <img key={index} src={`${prefix}${DOUBLER_ICONS.blackStars}`} alt={'Black Star'}
                                                      width={size} height={size} style={{ objectFit: 'contain' }}/>)}
  </Stack>;
};

export default BlackStars;
