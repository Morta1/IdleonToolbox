import React from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';

export const PERCENT_LABEL = '% of max';

// One option per metric, plus a percent option for each metric that can express its value as % of max
export const metricOptions = (descriptor) => Object.entries(descriptor?.metrics ?? {}).flatMap(([id, metric]) => [
  { id: `${id}:value`, metric: id, unit: 'value', label: metric.label },
  ...(metric.percentOfMax ? [{ id: `${id}:percentOfMax`, metric: id, unit: 'percentOfMax', label: PERCENT_LABEL }] : [])
]);

const MetricChips = ({ options, metric, unit, onChange }) => (
  <ToggleButtonGroup size="small" exclusive fullWidth value={`${metric}:${unit}`}
                     onChange={(e, next) => {
                       const option = options.find(({ id }) => id === next);
                       if (option) onChange(option);
                     }}>
    {options.map(({ id, label }) => <ToggleButton key={id} value={id}>{label}</ToggleButton>)}
  </ToggleButtonGroup>
);

export default MetricChips;
