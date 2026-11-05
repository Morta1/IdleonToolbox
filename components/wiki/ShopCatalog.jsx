import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import GameIcon from '@components/common/GameIcon';
import { cleanUnderscore, prefix } from '@utility/helpers';
import { notateAmount } from '@utility/wiki/notate';
import Price from './Price';

// The panel asks the same question the list answers, so it cannot draw while the empty state shows.
export const shopCatalogShows = (node) => node?.kind === 'shop' && node.catalog?.length > 0;

// The rows of a currency shop that are not items: boosts, upgrades, skins and deposits. They have
// no page to link to, so each is its art, the game's own text and the price.
const ShopCatalog = ({ node }) => {
  if (!shopCatalogShows(node)) return null;
  const rows = node.catalog;

  return <Stack sx={{ mt: 3 }} gap={0.5}>
    <Typography variant={'groupLabel'} component={'h3'} color={'text.secondary'}>
      Also sold
    </Typography>
    {rows.map((row, index) => <Stack key={`${row.text}-${index}`} direction={'row'} gap={1} alignItems={'center'}>
      {/* A UI skin is a long strip whose right end is the pattern alone, so that is the square shown: art GameIcon's box
          can't crop. The icon is rooted at /, and a slash after the prefix would read as a protocol-relative URL. */}
      {row.icon && row.iconFit === 'cover'
        ? <img src={`${prefix}${row.icon.replace(/^\//, '')}`} alt={''} width={24} height={24} loading={'lazy'}
               style={{ objectFit: 'cover', objectPosition: 'right center', flexShrink: 0 }}/>
        : row.icon ? <GameIcon src={row.icon.replace(/^\//, '')} size={24} alt={''} loading={'lazy'}/>
          : <Box sx={{ width: 24, flexShrink: 0 }}/>}
      <Typography variant={'body2'}>
        {cleanUnderscore(row.text)}
        {row.quantity > 1 ? <Typography component={'span'} variant={'caption'} color={'text.secondary'}>
          {` x${notateAmount(row.quantity)}`}
        </Typography> : null}
      </Typography>
      <Price price={row.price} currency={row.currency}/>
    </Stack>)}
  </Stack>;
};

export default ShopCatalog;
