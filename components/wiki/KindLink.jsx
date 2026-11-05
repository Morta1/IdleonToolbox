import React from 'react';
import { ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
import ItemCard from '@components/common/cards/ItemCard';
import { kindLabel } from '@utility/wiki/kind-labels.mjs';
import { listingHref } from '@utility/wiki/kinds.mjs';
import { KindArt } from './kind-art';
import { formatNum } from '@utility/helpers';

export { kindLabel };

// One category row, shared by the rail and the home's index. The home passes `count` and `compact`, which drops the
// text's vertical margin so its panel stays dense. `go(event, href)` gets the listing URL the row links to.
export const KindLink = ({ kind, label, current, go, inset, count, compact = false }) => <ListItemButton
  component={'a'}
  href={listingHref(kind)}
  selected={kind === current}
  onClick={(event) => go(event, listingHref(kind))}
  sx={inset ? { pl: 4 } : null}>
  <ListItemIcon sx={{ minWidth: 34 }}>
    <KindArt kind={kind} size={24}/>
  </ListItemIcon>
  <ListItemText primary={label || kindLabel(kind)} sx={{ minWidth: 0, ...(compact ? { my: 0 } : null) }}/>
  {count == null ? null : <Typography variant={'caption'} color={'text.secondary'} sx={{ flexShrink: 0, pl: 1 }}>
    {formatNum(count, 'whole')}
  </Typography>}
</ListItemButton>;

// One category as a card: the home's Encyclopedia tiles and a system page's kinds, on a CardGrid.
export const KindTile = ({ kind, label, count, go }) => <ItemCard
  href={listingHref(kind)} onClick={(event) => go(event, listingHref(kind))} prefetch={false}
  icon={<KindArt kind={kind}/>} title={label || kindLabel(kind)} meta={formatNum(count, 'whole')}/>;
