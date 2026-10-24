import React from 'react';
import { Button, Stack } from '@mui/material';

// steps: [{ label, target }], built by the popover from the metric and the selected entry
const QuickSteps = ({ steps, onPick }) => (
  <Stack direction="row" gap={1} flexWrap="wrap">
    {steps.map(({ label, target }) => (
      <Button key={label} size="small" variant="outlined" onClick={() => onPick(target)}>{label}</Button>
    ))}
  </Stack>
);

export default QuickSteps;
