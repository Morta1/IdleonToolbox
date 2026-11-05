import React from 'react';
import { Box, Button } from '@mui/material';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import StatusText from '@components/common/StatusText';
import { cleanUnderscore } from '@utility/helpers';
import { DRAWN_SLOTS, iconFor } from './slots';

// One card per slot the game draws (see slots.js DRAWN_SLOTS), its Change button opening the picker.
const SlotGrid = ({ loadout, unsupported = [], onSlotClick }) => <CardGrid size={'s'}>
  {DRAWN_SLOTS.map(({ label, slot }) => {
    const item = loadout[slot];
    const noArt = item && unsupported.includes(item.rawName);
    return <ItemCard key={slot}
                     icon={item ? iconFor(slot, item) : <Box sx={{ width: 32, height: 32, flexShrink: 0 }}/>}
                     title={item ? cleanUnderscore(item.displayName) : <Box component={'span'} sx={{ color: 'text.secondary' }}>None</Box>}
                     meta={label}
                     footer={<Box><Button size={'small'} aria-label={`${label} slot`} onClick={() => onSlotClick(slot)}>Change</Button></Box>}>
      {noArt ? <StatusText status={'locked'}>No art yet</StatusText> : null}
    </ItemCard>;
  })}
</CardGrid>;

export default SlotGrid;
