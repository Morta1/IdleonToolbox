import React from 'react';
import { Autocomplete, Box, Stack, TextField } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import AppDialog from '@components/common/Overlays/AppDialog';
import GameIcon from '@components/common/GameIcon';
import { DRAWN_SLOTS, iconFor, itemsForSlot } from './slots';

const MUTED_SX = { color: 'text.secondary', fontSize: 12 };

const ItemPickerDialog = ({ open, slot, value, onPick, onClose }) => {
  const options = slot ? itemsForSlot(slot) : [];
  const slotName = DRAWN_SLOTS.find((entry) => entry.slot === slot)?.label?.toLowerCase() ?? '';
  return <AppDialog open={open} onClose={onClose} size={'m'} title={`Pick a ${slotName}`}
                    actions={[{
                      label: 'Clear slot', onClick: () => {
                        onPick(null);
                        onClose();
                      }
                    }]}>
    <Autocomplete
      autoHighlight
      options={options}
      value={value ?? null}
      isOptionEqualToValue={(a, b) => a?.rawName === b?.rawName}
      getOptionLabel={(item) => cleanUnderscore(item?.displayName ?? '')}
      onChange={(_, item) => { onPick(item ?? null); onClose(); }}
      renderOption={(props, item) => <li {...props} key={item.rawName}>
        <Stack direction={'row'} alignItems={'center'} gap={1}>
          <GameIcon src={iconFor(slot, item)} size={24} alt={''}/>
          {cleanUnderscore(item.displayName)}
          {item.lvReqToEquip == null ? null : <Box component={'span'} sx={MUTED_SX}>{formatNum(item.lvReqToEquip, 'level')}</Box>}
          {item.Class && item.Class !== 'ALL'
            ? <Box component={'span'} sx={MUTED_SX}>{cleanUnderscore(item.Class.toLowerCase()).capitalize()}</Box>
            : null}
        </Stack>
      </li>}
      renderInput={(params) => <TextField {...params} autoFocus label={'Search'} sx={{ mt: 1 }}/>}
    />
  </AppDialog>;
};

export default ItemPickerDialog;
