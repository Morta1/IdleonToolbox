import React from 'react';
import { MenuItem, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { GoalIcon } from './GoalVisuals';
import { firstGroupOf, groupingOf, groupingsOf } from '@utility/goals/groups';

const ICON_SIZE = 24;

// The system select and the entry search already name what is tracked, so the toggle stays short
const helperText = (value, { label, entryLabel, allOnly }, grouping) => {
  const reached = 'reached when all of them meet the target.';
  // A system without a single-entry goal points to the item goals that cover it
  const itemGoals = allOnly ? ' For a single item, add an item goal.' : '';
  if (value === 'all') return `Every entry in ${label}: ${reached}${itemGoals}`;
  if (value === 'group') return `Every entry in ${label} in the ${grouping.label.toLowerCase()} you pick: ${reached}${itemGoals}`;
  return `One ${entryLabel} you pick from the list.`;
};

// A descriptor can name its own group icon; otherwise the group shows its first entry's icon
export const groupIcon = (descriptor, rows, id) => {
  const grouping = groupingOf(descriptor, id);
  if (grouping.icon) return grouping.icon(id);
  const first = rows.find((row) => String(grouping.of(row)) === String(id));
  return first ? descriptor.icon(first) : null;
};

const sx = { display: 'flex', alignItems: 'center', gap: 1 };

// entryOnly: the goal is for one entry already picked (a page totals system, or an entry promoted from an all goal)
const AppliesTo = ({ descriptor, rows, value, group, onChange, onGroupChange, entryOnly = false }) => {
  const groupings = groupingsOf(descriptor);
  // A descriptor with several groupings (Pets: world, passive) gets a toggle each; the picked group says which is on
  const grouping = value === 'group' ? groupingOf(descriptor, group) : null;
  const groupNames = Object.entries(grouping?.names ?? {});
  const toggleValue = grouping ? `group-${groupings.indexOf(grouping)}` : value;
  const pick = (next) => {
    if (!next) return;
    if (!next.startsWith('group-')) return onChange(next);
    const picked = groupings[Number(next.slice('group-'.length))];
    if (picked !== grouping) onGroupChange(firstGroupOf(picked));
    onChange('group');
  };
  // Page totals are separate numbers, so a goal always picks one of them
  if (entryOnly || descriptor.entryOnly) return <Typography variant="body2" color="text.secondary">{helperText('one', descriptor)}</Typography>;
  return (
    <Stack gap={1}>
      <ToggleButtonGroup size="small" exclusive fullWidth value={toggleValue} onChange={(e, next) => pick(next)}>
        {descriptor.allOnly ? null : <ToggleButton value="one">One</ToggleButton>}
        <ToggleButton value="all">All</ToggleButton>
        {groupings.map(({ label }, index) => (
          <ToggleButton key={label} value={`group-${index}`}>By {label.toLowerCase()}</ToggleButton>
        ))}
      </ToggleButtonGroup>
      <Typography variant="body2" color="text.secondary">{helperText(value, descriptor, grouping)}</Typography>
      {grouping ? (
        <TextField select size="small" fullWidth label={grouping.label} value={group ?? ''}
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
