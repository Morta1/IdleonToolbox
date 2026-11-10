import React from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';

export const PERCENT_LABEL = '% of max';

// One option per metric, plus a percent option for each metric that can express its value as % of max
export const metricOptions = (descriptor) => Object.entries(descriptor?.metrics ?? {}).flatMap(([id, metric]) => [
  { id: `${id}:value`, metric: id, unit: 'value', label: metric.label },
  ...(metric.percentOfMax ? [{ id: `${id}:percentOfMax`, metric: id, unit: 'percentOfMax', label: PERCENT_LABEL }] : [])
]);

const MetricChips = ({ options, metric, unit, onChange }) => (
  // wraps so a system with many metrics (Outposts has nine) stays inside the dialog
  <ToggleButtonGroup size="small" exclusive fullWidth value={`${metric}:${unit}`}
                     sx={{
                       flexWrap: 'wrap',
                       gap: 0.5,
                       // the joined-group borders break where a row wraps, so every button keeps its own
                       '& .MuiToggleButtonGroup-grouped.MuiToggleButton-root': {
                         flex: '1 0 auto',
                         width: 'auto',
                         m: 0,
                         border: 1,
                         borderColor: 'divider',
                         borderRadius: 1
                       }
                     }}
                     onChange={(e, next) => {
                       const option = options.find(({ id }) => id === next);
                       if (option) onChange(option);
                     }}>
    {options.map(({ id, label }) => <ToggleButton key={id} value={id}>{label}</ToggleButton>)}
  </ToggleButtonGroup>
);

export default MetricChips;
