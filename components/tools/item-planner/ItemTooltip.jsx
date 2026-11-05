import React from 'react';
import { Divider, Typography } from '@mui/material';
import { items } from '@website-data';
import ItemDisplay from 'components/common/ItemDisplay';
import { NoteTrigger } from '@components/common/InfoButton';
import { cleanUnderscore } from 'utility/helpers';

export const ownerName = (owner) => {
  const name = cleanUnderscore(owner);
  return name.charAt(0).toUpperCase() + name.slice(1);
};

// The item card used across the site, on a tap (a hover previews it), plus an optional line on where the item stands
// in this plan. note is that line, a node when it carries a state.
const ItemTooltip = ({ rawName, owners, note, children }) => {
  const item = items[rawName];
  if (!item) return children;
  return <NoteTrigger label={`${cleanUnderscore(item.displayName ?? rawName)} details`} note={<ItemDisplay
    {...item}
    owners={owners?.map(ownerName)}
    additionalInfo={note ? <>
      <Divider sx={{ my: 1 }}/>
      <Typography variant={'body2'} component={'div'}>{note}</Typography>
    </> : null}
  />}>
    {children}
  </NoteTrigger>;
};

export default ItemTooltip;
