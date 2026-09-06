import React from 'react';
import { Autocomplete, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';
import { cleanUnderscore } from '@utility/helpers';
import { iconFor, itemsForSlot } from './slots';

const ItemPickerDialog = ({ open, slot, value, onPick, onClose }) => {
  const options = slot ? itemsForSlot(slot) : [];
  return <Dialog open={open} onClose={onClose} fullWidth maxWidth={'xs'}>
    <DialogTitle>Pick a {slot}</DialogTitle>
    <DialogContent>
      <Autocomplete
        autoHighlight
        options={options}
        value={value ?? null}
        isOptionEqualToValue={(a, b) => a?.rawName === b?.rawName}
        getOptionLabel={(item) => cleanUnderscore(item?.displayName ?? '')}
        onChange={(_, item) => { onPick(item ?? null); onClose(); }}
        renderOption={(props, item) => <li {...props} key={item.rawName}>
          <Stack direction={'row'} alignItems={'center'} gap={1}>
            <img width={28} height={28} style={{ objectFit: 'contain' }} src={iconFor(slot, item)} alt=""/>
            <Typography>{cleanUnderscore(item.displayName)}</Typography>
            {item.lvReqToEquip == null
              ? null
              : <Typography variant={'caption'} color={'text.secondary'}>lv {item.lvReqToEquip}</Typography>}
            {item.Class && item.Class !== 'ALL'
              ? <Typography variant={'caption'} color={'text.secondary'}>{cleanUnderscore(item.Class.toLowerCase())}</Typography>
              : null}
          </Stack>
        </li>}
        renderInput={(params) => <TextField {...params} autoFocus label={'Search'} sx={{ mt: 1 }}/>}
      />
    </DialogContent>
    <DialogActions>
      <Button onClick={() => { onPick(null); onClose(); }}>Clear slot</Button>
      <Button onClick={onClose}>Close</Button>
    </DialogActions>
  </Dialog>;
};

export default ItemPickerDialog;
