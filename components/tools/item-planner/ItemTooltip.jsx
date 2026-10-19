import React from 'react';
import { Divider, Typography } from '@mui/material';
import { items } from '@website-data';
import Tooltip from 'components/Tooltip';
import ItemDisplay from 'components/common/ItemDisplay';
import { cleanUnderscore } from 'utility/helpers';

export const ownerName = (owner) => {
  const name = cleanUnderscore(owner);
  return name.charAt(0).toUpperCase() + name.slice(1);
};

// The item card used across the site, plus an optional line on where the item stands in this plan
const ItemTooltip = ({ rawName, owners, note, children }) => {
  const item = items[rawName];
  if (!item) return children;
  return <Tooltip title={<ItemDisplay
    {...item}
    owners={owners?.map(ownerName)}
    additionalInfo={note ? <>
      <Divider sx={{ my: 1 }}/>
      <Typography variant={'body2'} fontWeight={500}>{note}</Typography>
    </> : null}
  />}>
    {children}
  </Tooltip>;
};

export default ItemTooltip;
