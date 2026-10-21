import React from 'react';
import { MenuItem, Stack, TextField } from '@mui/material';

export const MAX_TARGET = 'max';

export const DIRECTIONS = [
  { op: '>=', label: 'At least' },
  { op: '<=', label: 'At most' }
];

const TargetInput = ({ op, target, percent, error, onOpChange, onTargetChange }) => (
  <Stack direction="row" gap={1} alignItems="flex-start">
    <TextField select size="small" label="Direction" value={op} onChange={(e) => onOpChange(e.target.value)}
               sx={{ width: 128, flexShrink: 0 }}>
      {DIRECTIONS.map(({ op: value, label }) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
    </TextField>
    <TextField
      size="small"
      fullWidth
      label={percent ? 'Target %' : 'Target'}
      value={target === MAX_TARGET ? 'Max' : target}
      error={!!error}
      helperText={error || null}
      slotProps={{ htmlInput: { inputMode: 'decimal' } }}
      onChange={(e) => onTargetChange(e.target.value.replace(/[^\d.]/g, ''))}
    />
  </Stack>
);

export default TargetInput;
