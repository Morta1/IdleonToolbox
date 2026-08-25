import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { prefix } from '@utility/helpers';

// The star images get wider as the tier climbs (Star6 draws six stars), and 'Base' is text rather
// than an image. Without a fixed cell width and a fixed-height header row the numbers underneath
// drift out of line with each other.
const CELL_WIDTH = 42;
const HEADER_HEIGHT = 18;

const StarLadder = ({ values, startTier = 0 }) => <Stack direction={'row'} flexWrap={'wrap'}>
  {values.map((value, index) => {
    const tier = startTier + index;
    return <Stack key={tier} alignItems={'center'} sx={{ width: CELL_WIDTH }}>
      <Box sx={{
        height: HEADER_HEIGHT,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {tier === 0
          ? <Typography variant={'caption'} color={'text.secondary'} lineHeight={1}>Base</Typography>
          : <Box
            component={'img'}
            src={`${prefix}etc/Star${tier}.png`}
            alt={`${tier} star`}
            sx={{ maxWidth: '100%', maxHeight: 14, objectFit: 'contain' }}
          />}
      </Box>
      <Typography variant={'caption'} fontWeight={600} lineHeight={1.4}>{value}</Typography>
    </Stack>;
  })}
</Stack>;

export default StarLadder;
