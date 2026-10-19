import React, { useState } from 'react';
import { Box, ButtonBase, IconButton, Link, Stack, Typography } from '@mui/material';
import { IconTrash } from '@tabler/icons-react';
import { cleanUnderscore, prefix } from 'utility/helpers';
import { openItemWikiPage } from '@utility/wiki/item-page';
import QuantityStepper from './QuantityStepper';
import ItemTooltip from './ItemTooltip';

const pluralItems = (count) => `${count} tracked item${count === 1 ? '' : 's'}`;

// On phones the list folds into one summary row, so the materials are not pushed below the fold;
// Edit opens it in place. From sm up it is always shown.
const TrackedItems = ({ items, onSetCount }) => {
  const [expanded, setExpanded] = useState(false);
  if (!items?.length) {
    return <Typography variant={'body2'} color={'text.secondary'}>Nothing tracked yet. Search an item above to start.</Typography>;
  }

  return <Stack gap={1}>
    <ButtonBase
      onClick={() => setExpanded(!expanded)}
      aria-expanded={expanded}
      sx={{
        display: { xs: 'flex', sm: 'none' },
        alignItems: 'center',
        gap: 1,
        minHeight: 56,
        px: 1.25,
        borderRadius: 2,
        bgcolor: 'action.hover',
        justifyContent: 'flex-start',
        textAlign: 'left'
      }}>
      <Box sx={{ display: 'flex' }}>
        {items.slice(0, 4).map(({ itemName, rawName }, index) => <Box key={itemName} component={'img'}
                                                                       src={`${prefix}data/${rawName}.png`} alt=""
                                                                       sx={{
                                                                         width: 36,
                                                                         height: 36,
                                                                         objectFit: 'contain',
                                                                         ml: index ? -1 : 0
                                                                       }}/>)}
      </Box>
      <Typography variant={'body2'} fontWeight={500} sx={{ flex: 1 }}>{pluralItems(items.length)}</Typography>
      <Typography variant={'body2'} fontWeight={500} color={'multiLight'} sx={{ px: 0.75 }}>
        {expanded ? 'Done' : 'Edit'}
      </Typography>
    </ButtonBase>
    <Stack gap={1} sx={{ display: { xs: expanded ? 'flex' : 'none', sm: 'flex' } }}>
      {items.map(({ itemName, rawName, itemQuantity, craftable }) => {
        const name = cleanUnderscore(itemName);
        return <Box key={itemName} sx={{
          display: 'grid',
          // Names wrap rather than truncate; on phones the controls drop to a second line
          gridTemplateColumns: { xs: '32px minmax(0, 1fr) auto', sm: '32px minmax(0, 1fr) auto auto' },
          rowGap: 0.5,
          alignItems: 'center',
          columnGap: 1,
          py: 0.75,
          pl: 1,
          pr: 0.5,
          borderRadius: 2,
          bgcolor: 'action.hover'
        }}>
          <ItemTooltip rawName={rawName}>
            <Box component={'img'} src={`${prefix}data/${rawName}.png`} alt=""
                 sx={{ width: 32, height: 32, objectFit: 'contain' }}/>
          </ItemTooltip>
          <Box sx={{ minWidth: 0, gridColumn: { xs: '2 / 4', sm: 'auto' } }}>
            <Link component={'button'} type={'button'} underline={'hover'} color={'multiLight'}
                  onClick={() => openItemWikiPage(rawName)}
                  sx={{ fontSize: 14, fontWeight: 500, textAlign: 'left', overflowWrap: 'anywhere' }}>
              {name}
            </Link>
            {craftable ? null : <Typography variant={'caption'} component={'div'} color={'text.disabled'}>
              No longer craftable
            </Typography>}
          </Box>
          <Box sx={{ gridColumn: { xs: 2, sm: 'auto' }, gridRow: { xs: 2, sm: 'auto' } }}>
            <QuantityStepper value={itemQuantity ?? 1} min={0} label={name}
                             onChange={(count) => onSetCount(itemName, count)}/>
          </Box>
          <IconButton aria-label={`Remove ${name}`} onClick={() => onSetCount(itemName, 0)}
                      sx={{ width: { xs: 44, sm: 36 }, height: { xs: 44, sm: 36 }, color: 'text.secondary',
                        gridColumn: { xs: 3, sm: 'auto' }, gridRow: { xs: 2, sm: 'auto' } }}>
            <IconTrash size={18}/>
          </IconButton>
        </Box>;
      })}
    </Stack>
  </Stack>;
};

export default TrackedItems;
