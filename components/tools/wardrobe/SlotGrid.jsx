import React from 'react';
import { Box, Card, CardActionArea, CardContent, Chip, Stack, Typography } from '@mui/material';
import { cleanUnderscore } from '@utility/helpers';
import { DRAWN_SLOTS, iconFor } from './slots';

// One card per slot the game draws (see slots.js DRAWN_SLOTS). Each card is a button that
// opens the picker; CardActionArea gives keyboard focus and Enter/Space for free.
const SlotGrid = ({ loadout, unsupported = [], onSlotClick }) => {
  return <Stack gap={1}>
    <Typography variant={'h6'}>Wardrobe</Typography>
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 1 }}>
      {DRAWN_SLOTS.map(({ label, slot }) => {
        const item = loadout[slot];
        const noArt = item && unsupported.includes(item.rawName);
        return <Card key={slot} variant={'outlined'}>
          <CardActionArea aria-label={`${label} slot`} onClick={() => onSlotClick(slot)} sx={{ minHeight: 64 }}>
            <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
              <Stack direction={'row'} alignItems={'center'} gap={1.5}>
                <Box sx={{ width: 40, height: 40, display: 'grid', placeItems: 'center' }}>
                  {item
                    ? <img width={40} height={40} style={{ objectFit: 'contain' }} src={iconFor(slot, item)} alt=""/>
                    : null}
                </Box>
                <Stack sx={{ minWidth: 0 }}>
                  <Typography variant={'caption'} color={'text.secondary'}>{label}</Typography>
                  <Typography variant={'body2'} noWrap color={item ? 'text.primary' : 'text.secondary'}>
                    {item ? cleanUnderscore(item.displayName) : 'None'}
                  </Typography>
                  {noArt ? <Chip size={'small'} label={'no art yet'} color={'warning'} sx={{ height: 16, fontSize: 10, alignSelf: 'flex-start' }}/> : null}
                </Stack>
              </Stack>
            </CardContent>
          </CardActionArea>
        </Card>;
      })}
    </Box>
  </Stack>;
};

export default SlotGrid;
