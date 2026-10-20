import React from 'react';
import { Stack, TextField, ToggleButton, ToggleButtonGroup } from '@mui/material';

export const MAX_TARGET = 'max';

const TargetInput = ({ op, target, percent, error, onOpChange, onTargetChange }) => (
  <Stack direction="row" gap={1} alignItems="flex-start">
    <ToggleButtonGroup size="small" exclusive value={op} onChange={(e, next) => next && onOpChange(next)}>
      <ToggleButton value=">=" aria-label="At least">&ge;</ToggleButton>
      <ToggleButton value="<=" aria-label="At most">&le;</ToggleButton>
    </ToggleButtonGroup>
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
