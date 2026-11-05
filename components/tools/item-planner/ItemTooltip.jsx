import React, { useContext } from 'react';
import { Divider, Typography } from '@mui/material';
import { items } from '@website-data';
import ItemDisplay from 'components/common/ItemDisplay';
import { NoteTrigger } from '@components/common/InfoButton';
import { AppContext } from '@components/common/context/AppProvider';
import { cleanUnderscore } from 'utility/helpers';

// A character's name stays as its player typed it ("morta11"): only the parser's own words take a capital.
const WORD_OWNERS = { storage: 'Storage', account: 'Account' };
export const ownerName = (owner) => {
  const name = cleanUnderscore(owner);
  return WORD_OWNERS[name] ?? name;
};

// The item card used across the site, on a tap (a hover previews it), plus an optional line on where the item stands
// in this plan. note is that line, a node when it carries a state.
const ItemTooltip = ({ rawName, owners, note, children }) => {
  const { state } = useContext(AppContext);
  const item = items[rawName];
  if (!item) return children;
  return <NoteTrigger label={`${cleanUnderscore(item.displayName ?? rawName)} details`} note={<ItemDisplay
    {...item}
    account={state?.account}
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
