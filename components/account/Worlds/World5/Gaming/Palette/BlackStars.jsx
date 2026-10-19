import { Stack, Typography } from '@mui/material';
import { prefix } from '@utility/helpers';
import React from 'react';
import { DOUBLER_ICONS, getDoubledChanges } from '@components/account/Worlds/World7/Menagerie/menagerie.utils';

// The game draws its black star glyph once per Black Star placed on a palette colour
const BlackStars = ({ count, size = 16 }) => {
  if (!(count > 0)) return null;
  return <Stack direction={'row'} gap={.25} sx={{ position: 'relative', zIndex: 2, pointerEvents: 'none' }}>
    {Array.from({ length: count }, (_, index) => <img key={index} src={`${prefix}${DOUBLER_ICONS.blackStars}`} alt={'Black Star'}
                                                      width={size} height={size} style={{ objectFit: 'contain' }}/>)}
  </Stack>;
};

// One line under the description: "Black Stars: ★ 2.13x · ★★ 3.25x", only the values that change, shown once the
// account owns a star
export const BlackStarPreviews = ({ description, previews, owned, variant = 'body2', size = 16 }) => {
  if (!(owned > 0)) return null;
  const tiers = (previews ?? [])
    .map(({ stars, description: starred }) => ({ stars, changes: getDoubledChanges(description, starred) }))
    .filter(({ changes }) => changes.length);
  if (!tiers.length) return null;
  return <Stack direction={'row'} alignItems={'center'} columnGap={1} rowGap={.5} flexWrap={'wrap'}>
    <Typography variant={variant} color={'secondary'}>Black Stars:</Typography>
    {tiers.map(({ stars, changes }) => <Stack key={stars} direction={'row'} alignItems={'center'} gap={.5}>
      <BlackStars count={stars} size={size}/>
      <Typography variant={variant} color={'secondary'}>{changes.join(' · ')}</Typography>
    </Stack>)}
  </Stack>;
};

export default BlackStars;
