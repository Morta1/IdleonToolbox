import React from 'react';
import { MenuItem, Stack, TextField } from '@mui/material';
import { DIRECTIONS, targetPlaceholder } from './format';

export const MAX_TARGET = 'max';
// The entry's own next threshold (metrics with nextStep): there is no number to type
export const NEXT_TARGET = 'next';

// Reads as a sentence ("Reach at least" [Target level]), so neither field carries a visible label
const TargetInput = ({ op, target, percent, metricLabel, nextStep, error, onOpChange, onTargetChange }) => {
  if (nextStep) {
    return <TextField size="small" fullWidth disabled value={metricLabel} slotProps={{ htmlInput: { 'aria-label': 'Target' } }}/>;
  }
  const placeholder = targetPlaceholder(metricLabel, percent);
  return (
    <Stack direction="row" gap={1} alignItems="flex-start">
      <TextField select size="small" value={op} onChange={(e) => onOpChange(e.target.value)}
                 slotProps={{ select: { SelectDisplayProps: { 'aria-label': 'Direction' } } }}
                 sx={{ width: 160, flexShrink: 0 }}>
        {DIRECTIONS.map(({ op: value, option }) => <MenuItem key={value} value={value}>{option}</MenuItem>)}
      </TextField>
      <TextField
        size="small"
        fullWidth
        placeholder={placeholder}
        value={target === MAX_TARGET ? 'Max' : target}
        error={!!error}
        helperText={error || null}
        slotProps={{ htmlInput: { inputMode: 'decimal', 'aria-label': placeholder } }}
        onChange={(e) => onTargetChange(e.target.value.replace(/[^\d.]/g, ''))}
      />
    </Stack>
  );
};

export default TargetInput;
