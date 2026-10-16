import React from 'react';
import { Card, CardActionArea, ListItemButton, ListItemIcon, ListItemText, Stack, Typography } from '@mui/material';
import { kindLabel } from '@utility/wiki/kind-labels.mjs';
import { listingHref } from '@utility/wiki/kinds.mjs';
import { KIND_ART, KindArt } from './kind-art';
import { prefix } from '@utility/helpers';

export { kindLabel };

// One category row, shared by the rail, the home's index and the system pages. The home passes `count`,
// a smaller art size and `compact`, which drops the text's vertical margin so its card stays dense.
// `go(event, href)` gets the listing URL the row links to.
export const KindLink = ({ kind, label, current, go, inset, count, artSize = 24, compact = false }) => <ListItemButton
  component={'a'}
  href={listingHref(kind)}
  selected={kind === current}
  onClick={(event) => go(event, listingHref(kind))}
  sx={inset ? { pl: 4 } : null}>
  <ListItemIcon sx={{ minWidth: artSize + 10 }}>
    <img src={`${prefix}${KIND_ART[kind]}`} alt="" width={artSize} height={artSize}
         style={{ objectFit: 'contain' }}/>
  </ListItemIcon>
  <ListItemText primary={label || kindLabel(kind)} sx={{ minWidth: 0, ...(compact ? { my: 0 } : null) }}/>
  {count == null ? null : <Typography variant={'caption'} color={'text.secondary'} sx={{ flexShrink: 0, pl: 1 }}>
    {count.toLocaleString('en-US')}
  </Typography>}
</ListItemButton>;

// One category as a card: the home's Encyclopedia tiles and a system page's kinds, in a TILE_GRID.
export const TILE_GRID = { display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' }, gap: 1.5 };

export const KindTile = ({ kind, label, count, go }) => <Card variant={'outlined'}>
  <CardActionArea component={'a'} href={listingHref(kind)} onClick={(event) => go(event, listingHref(kind))} sx={{ p: 1.5, height: '100%' }}>
    <Stack direction={'row'} gap={1.5} alignItems={'center'}>
      <KindArt kind={kind}/>
      <Stack gap={0.25} sx={{ minWidth: 0 }}>
        <Typography fontWeight={600}>{label || kindLabel(kind)}</Typography>
        <Typography variant={'caption'} color={'text.secondary'}>
          {count.toLocaleString('en-US')}
        </Typography>
      </Stack>
    </Stack>
  </CardActionArea>
</Card>;
