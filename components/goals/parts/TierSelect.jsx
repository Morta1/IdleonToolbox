import React from 'react';
import { MenuItem, TextField } from '@mui/material';

const TierSelect = ({ tiers, value, error, onChange }) => (
  <TextField select size="small" fullWidth label="Target" value={value === '' ? '' : Number(value)}
             error={!!error} helperText={error || null} onChange={(e) => onChange(String(e.target.value))}>
    {tiers.map((name, index) => <MenuItem key={name} value={index}>{name}</MenuItem>)}
  </TextField>
);

export default TierSelect;
