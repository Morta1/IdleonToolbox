import React from 'react';
import { MenuItem, Stack, TextField } from '@mui/material';
import { MAX_TARGET } from '@utility/goals/store';
import NumberField from '@components/common/NumberField';
import { DIRECTIONS, targetPlaceholder } from './format';

// Reads as a sentence ("Reach at least" [Target level]), so neither field carries a visible label
const TargetInput = ({ op, target, percent, metricLabel, nextStep, error, onOpChange, onTargetChange }) => {
  // the entry's own next threshold: there is no number to type
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
      <NumberField
        ariaLabel={placeholder}
        placeholder={target === MAX_TARGET ? 'Max' : placeholder}
        value={target === MAX_TARGET || target === '' ? null : Number(target)}
        // Every goal metric is a level, count, amount or percent, none of them below 0.
        min={0}
        error={error || null}
        help={false}
        // Targets run past a million, where a phone's number pad has no letters for 1.5B.
        inputMode="text"
        fullWidth
        onChange={(next) => onTargetChange(next == null ? '' : String(next))}
      />
    </Stack>
  );
};

export default TargetInput;
