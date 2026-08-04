import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { prefix } from '@utility/helpers';
import { getCogDisplayName } from '@parsers/world-3/construction';

const cogIcon = (name) => `${prefix}data/${name}.png`;

const TYPE_COLOR = {
  build: 'warning.light',
  flaggy: 'success.light',
  constructionXp: 'info.light'
};

/**
 * Small cogs only fit the 24 side slots and their bonuses are a flat sum, so there is no arrangement
 * to optimize - the only thing worth surfacing is a stronger one going unused in the inventory.
 */
const ConstructionSmallCogs = ({ smallCogs }) => {
  const { upgrades = [], spares = [], freeSlots = 0 } = smallCogs || {};
  if (spares.length === 0) return null;

  return <Stack gap={1}>
    <Stack direction={'row'} alignItems={'baseline'} justifyContent={'space-between'} gap={2}>
      <Typography variant={'h6'}>Small cogs</Typography>
      <Typography variant={'body2'} sx={{ color: 'text.secondary' }}>
        {spares.length} in inventory{freeSlots > 0 ? `, ${freeSlots} free slot${freeSlots > 1 ? 's' : ''}` : ''}
      </Typography>
    </Stack>

    {upgrades.length === 0
      ? <Typography variant={'caption'} sx={{ color: 'text.secondary' }}>
        Nothing to gain - everything placed already beats what you are holding.
      </Typography>
      : <>
        <Typography variant={'caption'} sx={{ color: 'text.secondary' }}>
          Side slot swaps, best first. Position never matters for these, only which ones you place.
        </Typography>
        {/* Full width under the board, so these wrap across it rather than stacking into a column
            that pushes the page down. */}
        <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
          {upgrades.map((upgrade) => <Stack key={`${upgrade.originalIndex}-${upgrade.slotIndex}`}
                                            direction={'row'} alignItems={'center'} gap={1}
                                            sx={{
                                              px: 1, py: 0.5, borderRadius: 1,
                                              border: '1px solid', borderColor: 'divider',
                                              minWidth: 250, flex: '1 1 250px', maxWidth: 340
                                            }}>
            <Typography variant={'body2'} sx={{ color: 'text.secondary', minWidth: 56 }}>
              {upgrade.slotLabel}
            </Typography>
            {upgrade.replaces
              ? <>
                <Box component={'img'} src={cogIcon(upgrade.replaces.name)} alt={''}
                     sx={{ width: 26, height: 26, opacity: 0.5 }}/>
                <Typography variant={'body2'} sx={{ color: 'text.secondary' }}>&rarr;</Typography>
              </>
              : <Typography variant={'body2'} sx={{ color: 'text.secondary' }}>empty &rarr;</Typography>}
            <Box component={'img'} src={cogIcon(upgrade.name)} alt={''} sx={{ width: 26, height: 26 }}/>
            <Typography variant={'body2'} sx={{ flexGrow: 1, minWidth: 0 }} noWrap>
              {getCogDisplayName(upgrade.name)}
            </Typography>
            <Typography variant={'body2'} sx={{ color: TYPE_COLOR[upgrade.type] ?? 'text.primary' }}>
              +{upgrade.gainPercent.toFixed(1)}%
            </Typography>
          </Stack>)}
        </Stack>
      </>}
  </Stack>;
};

export default ConstructionSmallCogs;
