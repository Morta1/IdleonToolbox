import React from 'react';
import { MenuItem, TextField, Typography } from '@mui/material';
import { GoalIcon } from './GoalVisuals';
import { formatNumber } from './format';

const sx = { display: 'flex', alignItems: 'center', gap: 1 };

// options: [{ system, label, icon, count }]
const SystemSelect = ({ options, value, onChange }) => (
  <TextField select size="small" fullWidth label="System" value={value} onChange={(e) => onChange(e.target.value)}
             sx={{ '& .MuiSelect-select': sx }}>
    {options.map(({ system, label, icon, count }) => (
      <MenuItem key={system} value={system} sx={sx}>
        <GoalIcon src={icon} alt="" size={20}/>
        {label}
        <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
          {formatNumber(count)}
        </Typography>
      </MenuItem>
    ))}
  </TextField>
);

export default SystemSelect;
