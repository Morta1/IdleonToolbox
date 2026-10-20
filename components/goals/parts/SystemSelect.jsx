import React from 'react';
import { MenuItem, TextField } from '@mui/material';

const SystemSelect = ({ systems, value, onChange }) => (
  <TextField select size="small" fullWidth label="System" value={value} onChange={(e) => onChange(e.target.value)}>
    {systems.map(({ system, label }) => <MenuItem key={system} value={system}>{label}</MenuItem>)}
  </TextField>
);

export default SystemSelect;
