import React, { useState } from 'react';
import { MenuItem, TextField, Typography } from '@mui/material';
import { GoalIcon } from './GoalVisuals';
import { formatNumber } from './format';

const sx = { display: 'flex', alignItems: 'center', gap: 1 };

// Never null: React Compiler reads the fields a callback uses while memoizing it, before any null check runs
const NOT_LISTED = { options: [] };

// current: the selected system's option. listOptions() lists every system ([{ system, label, icon, count }]); it is
// costly, so it runs once each time the menu opens
const SystemSelect = ({ current, listOptions, value, onChange }) => {
  const [listed, setListed] = useState(NOT_LISTED);
  // The closed select only needs the selected system; the last listing stays while the menu fades out, with the
  // selected system always current (the character picker changes its count)
  const options = listed.options.length
    ? listed.options.map((option) => (option.system === current.system ? current : option))
    : [current];
  return (
    <TextField select size="small" fullWidth label="System" value={value} onChange={(e) => onChange(e.target.value)}
               slotProps={{ select: { onOpen: () => setListed({ options: listOptions() }) } }}
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
};

export default SystemSelect;
