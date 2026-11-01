import React from 'react';
import { IconButton, MenuItem, Stack, TextField } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { NAME_COLUMN, isNumericColumn } from '@utility/wiki/listing-sort.mjs';
import { firstOrder } from '@components/common/DataTable/layout';

// The sort without the headers: a phone hides every column but one, and bundle cards have no headers at all.
const ListingSortControl = ({ columns, sort, onSortChange, sx }) => {
  const options = [NAME_COLUMN, ...columns.filter((column) => column.sortable)];
  const descending = sort?.order === 'desc';
  return <Stack direction={'row'} gap={0.5} alignItems={'center'} sx={sx}>
    <TextField
      size={'small'}
      select
      value={sort?.key ?? ''}
      // The same first order a header click picks.
      onChange={(event) => {
        const column = options.find((option) => option.key === event.target.value);
        onSortChange?.(column ? { key: column.key, order: firstOrder({ numeric: isNumericColumn(column) }) } : null);
      }}
      label={'Sort by'}
      sx={{ width: 200 }}
    >
      <MenuItem value={''}>Default order</MenuItem>
      {options.map((column) => <MenuItem key={column.key} value={column.key}>{column.label}</MenuItem>)}
    </TextField>
    <IconButton
      size={'small'}
      aria-label={descending ? 'Descending' : 'Ascending'}
      disabled={!sort}
      onClick={() => onSortChange?.({ key: sort.key, order: descending ? 'asc' : 'desc' })}
    >
      {descending ? <ArrowDownwardIcon fontSize={'small'}/> : <ArrowUpwardIcon fontSize={'small'}/>}
    </IconButton>
  </Stack>;
};

export default ListingSortControl;
