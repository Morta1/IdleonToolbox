import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { cleanUnderscore, prefix } from '@utility/helpers';
import Price from './Price';

// The panel asks the same question the list answers, so it cannot draw while the empty state shows.
export const shopCatalogShows = (node) => node?.kind === 'shop' && node.catalog?.length > 0;

// The rows of a currency shop that are not items: boosts, upgrades, skins and deposits. They have
// no page to link to, so each is its art, the game's own text and the price.
const ShopCatalog = ({ node }) => {
  if (!shopCatalogShows(node)) return null;
  const rows = node.catalog;

  return <Stack sx={{ mt: 3 }} gap={0.5}>
    <Typography variant={'subtitle2'} color={'text.secondary'} textTransform={'uppercase'} letterSpacing={0.5}>
      Also sold
    </Typography>
    {rows.map((row, index) => <Stack key={`${row.text}-${index}`} direction={'row'} gap={1} alignItems={'center'}>
      {row.icon ? <img
        // The icon is rooted at `/`, and a slash after the prefix would read as a protocol-relative URL.
        src={`${prefix}${row.icon.replace(/^\//, '')}`}
        alt={''}
        width={24}
        height={24}
        loading={'lazy'}
        // A UI skin is a long strip: its right end is the pattern alone, so that is the square shown.
        style={{ objectFit: row.iconFit ?? 'contain', objectPosition: row.iconFit === 'cover' ? 'right center' : undefined, flexShrink: 0 }}
      /> : <Box sx={{ width: 24, flexShrink: 0 }}/>}
      <Typography variant={'body2'}>
        {cleanUnderscore(row.text)}
        {row.quantity > 1 ? <Typography component={'span'} variant={'caption'} color={'text.secondary'}>
          {` x${row.quantity.toLocaleString('en-US')}`}
        </Typography> : null}
      </Typography>
      <Price price={row.price} currency={row.currency} size={16}/>
    </Stack>)}
  </Stack>;
};

export default ShopCatalog;
