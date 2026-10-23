import React from 'react';
import { Box, MenuItem, TextField } from '@mui/material';
import { IconUsers } from '@tabler/icons-react';
import { prefix } from '@utility/helpers';
import { ALL_CHARS } from '@utility/goals/store';
import { ALL_CHARACTERS } from './format';

const ITEM_SX = { display: 'flex', alignItems: 'center', gap: 1 };

// All characters comes first: one goal over the same entry on every character
const CharacterPicker = ({ characters, value, onChange }) => (
  <TextField select size="small" fullWidth label="Character" value={value ?? ''}
             onChange={(e) => onChange(e.target.value)}
             sx={{ '& .MuiSelect-select': ITEM_SX }}>
    <MenuItem value={ALL_CHARS} sx={ITEM_SX}>
      <Box component="span" sx={{ display: 'inline-flex', width: 20, justifyContent: 'center' }}>
        <IconUsers size={18} aria-hidden/>
      </Box>
      {ALL_CHARACTERS}
    </MenuItem>
    {(characters ?? []).map(({ name, classIndex }) => (
      <MenuItem key={name} value={name} sx={ITEM_SX}>
        <Box component="img" src={`${prefix}data/ClassIcons${classIndex ?? 0}.png`} alt=""
             sx={{ width: 20, height: 20, objectFit: 'contain' }}/>
        {name}
      </MenuItem>
    ))}
  </TextField>
);

export default CharacterPicker;
