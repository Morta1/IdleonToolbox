import React from 'react';
import { MenuItem, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { GoalIcon } from './GoalVisuals';

const ICON_SIZE = 20;

// The system select and the entry search already name what is tracked, so the toggle stays short
const helperText = (value, { label, entryLabel, groups, allOnly }) => {
  const reached = 'reached when all of them meet the target.';
  // A system without a single-entry goal points to the item goals that cover it
  const itemGoals = allOnly ? ' For a single item, add an item goal.' : '';
  if (value === 'all') return `Every entry in ${label}: ${reached}${itemGoals}`;
  if (value === 'group') return `Every entry in ${label} in the ${groups.label.toLowerCase()} you pick: ${reached}${itemGoals}`;
  return `One ${entryLabel} you pick from the list.`;
};

// A descriptor can name its own group icon; otherwise the group shows its first entry's icon
export const groupIcon = (descriptor, rows, id) => {
  const { groups } = descriptor;
  if (groups.icon) return groups.icon(id);
  const first = rows.find((row) => String(groups.of(row)) === String(id));
  return first ? descriptor.icon(first) : null;
};

const sx = { display: 'flex', alignItems: 'center', gap: 1 };

// entryOnly: the goal is for one entry already picked (a page totals system, or an entry promoted from an all goal)
const AppliesTo = ({ descriptor, rows, value, group, onChange, onGroupChange, entryOnly = false }) => {
  const { groups } = descriptor;
  const groupNames = groups ? Object.entries(groups.names ?? {}) : [];
  // Page totals are separate numbers, so a goal always picks one of them
  if (entryOnly || descriptor.entryOnly) return <Typography variant="body2" color="text.secondary">{helperText('one', descriptor)}</Typography>;
  return (
    <Stack gap={1}>
      <ToggleButtonGroup size="small" exclusive fullWidth value={value}
                         onChange={(e, next) => next && onChange(next)}>
        {descriptor.allOnly ? null : <ToggleButton value="one">One</ToggleButton>}
        <ToggleButton value="all">All</ToggleButton>
        {groups ? <ToggleButton value="group">By {groups.label.toLowerCase()}</ToggleButton> : null}
      </ToggleButtonGroup>
      <Typography variant="body2" color="text.secondary">{helperText(value, descriptor)}</Typography>
      {value === 'group' && groups ? (
        <TextField select size="small" fullWidth label={groups.label} value={group ?? ''}
                   onChange={(e) => onGroupChange(e.target.value)} sx={{ '& .MuiSelect-select': sx }}>
          {groupNames.map(([id, name]) => (
            <MenuItem key={id} value={id} sx={sx}>
              <GoalIcon src={groupIcon(descriptor, rows, id)} alt="" size={ICON_SIZE}/>
              {name}
            </MenuItem>
          ))}
        </TextField>
      ) : null}
    </Stack>
  );
};

export default AppliesTo;
