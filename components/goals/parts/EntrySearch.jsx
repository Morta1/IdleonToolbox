import React, { useState } from 'react';
import { Autocomplete, Box, createFilterOptions, Paper, TextField, Typography } from '@mui/material';
import { capitalizeFirst } from '@utility/goals/registry/names';
import { formatNumber } from './format';
import { GoalIcon } from './GoalVisuals';

// The item catalog has thousands of rows; rendering every match makes typing lag
export const SHOWN_MATCHES = 250;
const filterOptions = createFilterOptions({ limit: SHOWN_MATCHES });
const allMatches = createFilterOptions();

const EntryIcon = ({ src, alt }) => <GoalIcon src={src} alt={alt} size={24}/>;

// The list paper with a footer saying the matches were cut
const HintPaper = ({ hint, children, ...props }) => (
  <Paper {...props}>
    {children}
    {hint ? (
      <Typography variant="caption" color="text.secondary" component="div" sx={{ px: 2, py: 1 }}
                  onMouseDown={(e) => e.preventDefault()}>
        {hint}
      </Typography>
    ) : null}
  </Paper>
);

// goalKeys: keys of the entries that already have a goal, marked in the list
const EntrySearch = ({ descriptor, rows, value, goalKeys, onChange }) => {
  const [input, setInput] = useState('');
  const [listOpen, setListOpen] = useState(false);
  const selected = rows.find((row) => String(descriptor.key(row)) === String(value)) ?? null;
  const getOptionLabel = (row) => String(descriptor.name(row) ?? '');
  // An untouched input still holding the picked entry's name lists everything, like the Autocomplete does
  const query = selected && input === getOptionLabel(selected) ? '' : input;
  // A full filter of a big catalog, so it runs only while the list (and its hint) is showing
  const matches = listOpen && rows.length > SHOWN_MATCHES ? allMatches(rows, { inputValue: query, getOptionLabel }).length : 0;
  const hint = matches > SHOWN_MATCHES ? `${SHOWN_MATCHES} of ${formatNumber(matches)}, type to filter` : null;
  return (
    <Autocomplete
      size="small"
      options={rows}
      open={listOpen}
      onOpen={() => setListOpen(true)}
      onClose={() => setListOpen(false)}
      filterOptions={filterOptions}
      value={selected}
      inputValue={input}
      onInputChange={(e, next) => setInput(next)}
      onChange={(e, row) => onChange(row ? descriptor.key(row) : null)}
      getOptionLabel={getOptionLabel}
      getOptionKey={(row) => String(descriptor.key(row))}
      isOptionEqualToValue={(a, b) => String(descriptor.key(a)) === String(descriptor.key(b))}
      slots={{ paper: HintPaper }}
      slotProps={{ paper: { hint } }}
      renderOption={({ key, ...props }, row) => (
        <Box component="li" key={key} {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EntryIcon src={descriptor.icon(row)} alt=""/>
          {descriptor.name(row)}
          {descriptor.entryTag?.(row) ? (
            <Typography component="span" variant="caption" color="text.secondary">{descriptor.entryTag(row)}</Typography>
          ) : null}
          {goalKeys?.has(String(descriptor.key(row))) ? (
            <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 'auto', flexShrink: 0 }}>
              Has a goal
            </Typography>
          ) : null}
        </Box>
      )}
      renderInput={(params) => (
        <TextField {...params} label={capitalizeFirst(descriptor.entryLabel)} slotProps={{
          input: {
            ...params.InputProps,
            startAdornment: selected ? <EntryIcon src={descriptor.icon(selected)} alt=""/> : null
          }
        }}/>
      )}
    />
  );
};

export default EntrySearch;
