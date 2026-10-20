import React from 'react';
import { Autocomplete, Box, createFilterOptions, TextField } from '@mui/material';
import { prefix } from '@utility/helpers';
import { capitalizeFirst } from '@utility/goals/registry/names';

// The item catalog has thousands of rows; rendering every match makes typing lag
const filterOptions = createFilterOptions({ limit: 250 });

const EntryIcon = ({ src, alt }) => (
  <Box component="img" src={`${prefix}${src}.png`} alt={alt} sx={{ width: 24, height: 24, objectFit: 'contain' }}/>
);

const EntrySearch = ({ descriptor, rows, value, onChange }) => {
  const selected = rows.find((row) => String(descriptor.key(row)) === String(value)) ?? null;
  return (
    <Autocomplete
      size="small"
      options={rows}
      filterOptions={filterOptions}
      value={selected}
      onChange={(e, row) => onChange(row ? descriptor.key(row) : null)}
      getOptionLabel={(row) => String(descriptor.name(row) ?? '')}
      getOptionKey={(row) => String(descriptor.key(row))}
      isOptionEqualToValue={(a, b) => String(descriptor.key(a)) === String(descriptor.key(b))}
      renderOption={({ key, ...props }, row) => (
        <Box component="li" key={key} {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EntryIcon src={descriptor.icon(row)} alt=""/>
          {descriptor.name(row)}
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
