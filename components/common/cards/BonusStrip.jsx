import React from 'react';
import { Stack, Typography } from '@mui/material';

// A page's account-wide bonuses as StatTiles in wrapping rows, Slab's way, under a small heading: a panel of one bonus a
// row put each name a column's width from its value and took most of a screen beside an empty half (Tome, Worship's MSA
// Totalizer). meta: a line beside the heading (what unlocks a locked bonus). bare: the children laid out as given (a
// clicker's Mega tiles, an icon grid and its next-bonus line), under the same heading instead of a Panel's box.
const BonusStrip = ({ title, meta, bare, sx, children }) => <Stack gap={1} component={'section'} aria-label={title} sx={sx}>
  <Stack direction={'row'} gap={1} alignItems={'baseline'} flexWrap={'wrap'}>
    <Typography variant={'groupLabel'} component={'h2'} color={'text.secondary'}>{title}</Typography>
    {meta ? <Typography variant={'caption'} color={'text.secondary'}>{meta}</Typography> : null}
  </Stack>
  {bare ? children : <Stack direction={'row'} flexWrap={'wrap'} gap={1}>{children}</Stack>}
</Stack>;

export default BonusStrip;
