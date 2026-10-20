import React from 'react';
import { Box, MenuItem, TextField } from '@mui/material';
import { prefix } from '@utility/helpers';

const CharacterPicker = ({ characters, value, onChange }) => (
  <TextField select size="small" fullWidth label="Character" value={value ?? ''}
             onChange={(e) => onChange(e.target.value)}
             sx={{ '& .MuiSelect-select': { display: 'flex', alignItems: 'center', gap: 1 } }}>
    {(characters ?? []).map(({ name, classIndex }) => (
      <MenuItem key={name} value={name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box component="img" src={`${prefix}data/ClassIcons${classIndex ?? 0}.png`} alt=""
             sx={{ width: 20, height: 20, objectFit: 'contain' }}/>
        {name}
      </MenuItem>
    ))}
  </TextField>
);

export default CharacterPicker;
