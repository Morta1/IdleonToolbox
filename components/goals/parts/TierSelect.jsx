import React from 'react';
import { MenuItem, TextField } from '@mui/material';

// The first tier is the not-started state (None / Locked), never a goal to aim for
const FIRST_TARGET_TIER = 1;

const TierSelect = ({ tiers, value, error, onChange }) => {
  const index = value === '' ? '' : Number(value);
  return (
    <TextField select size="small" fullWidth label="Target" value={index >= FIRST_TARGET_TIER ? index : ''}
               error={!!error} helperText={error || null} onChange={(e) => onChange(String(e.target.value))}>
      {tiers.map((name, i) => (i >= FIRST_TARGET_TIER ? <MenuItem key={name} value={i}>{name}</MenuItem> : null))}
    </TextField>
  );
};

export default TierSelect;
