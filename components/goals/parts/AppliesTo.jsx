import React from 'react';
import { MenuItem, Stack, TextField, ToggleButton, ToggleButtonGroup } from '@mui/material';

const AppliesTo = ({ descriptor, value, group, onChange, onGroupChange }) => {
  const { groups, entryLabel, label } = descriptor;
  const groupNames = groups ? Object.entries(groups.names ?? {}) : [];
  return (
    <Stack gap={1}>
      <ToggleButtonGroup size="small" exclusive fullWidth value={value}
                         onChange={(e, next) => next && onChange(next)}>
        <ToggleButton value="one">One {entryLabel}</ToggleButton>
        <ToggleButton value="all">All {label.toLowerCase()}</ToggleButton>
        {groups ? <ToggleButton value="group">By {groups.label.toLowerCase()}</ToggleButton> : null}
      </ToggleButtonGroup>
      {value === 'group' && groups ? (
        <TextField select size="small" fullWidth label={groups.label} value={group ?? ''}
                   onChange={(e) => onGroupChange(e.target.value)}>
          {groupNames.map(([id, name]) => <MenuItem key={id} value={id}>{name}</MenuItem>)}
        </TextField>
      ) : null}
    </Stack>
  );
};

export default AppliesTo;
