import { Box, IconButton, MenuItem, Stack, TextField } from '@mui/material';
import { IconArrowDown, IconArrowUp } from '@tabler/icons-react';
import { firstOrder } from './layout';

// A phone's way to sort a table whose columns it hides (Tables board): the table's sortable columns as a select, and once
// one is picked, the direction. The same sort state its headers write. Default is the table's own order.
const SortField = ({ columns, sort, onChange, sx }) => {
  const nameOf = (column) => (typeof column.label === 'string' ? column.label : column.key);
  const descending = sort?.order === 'desc';
  return <Stack direction="row" gap={0.5} alignItems="center" sx={sx}>
    <TextField
      select
      value={sort?.key ?? ''}
      onChange={(event) => {
        const column = columns.find(({ key }) => key === event.target.value);
        onChange?.(column ? { key: column.key, order: firstOrder(column) } : null);
      }}
      sx={{ flex: 1 }}
      slotProps={{
        select: {
          displayEmpty: true,
          renderValue: (key) => <>
            <Box component="span" sx={{ color: 'text.secondary', mr: 0.75 }}>Sort:</Box>
            {key ? nameOf(columns.find((column) => column.key === key) ?? { key }) : 'Default'}
          </>,
          SelectDisplayProps: { 'aria-label': 'Sort by' }
        }
      }}
    >
      <MenuItem value="">Default</MenuItem>
      {columns.map((column) => <MenuItem key={column.key} value={column.key}>{nameOf(column)}</MenuItem>)}
    </TextField>
    {sort ? <IconButton aria-label={descending ? 'Descending' : 'Ascending'} sx={{ width: 40, height: 40 }}
                        onClick={() => onChange?.({ key: sort?.key, order: descending ? 'asc' : 'desc' })}>
      {descending ? <IconArrowDown size={18}/> : <IconArrowUp size={18}/>}
    </IconButton> : null}
  </Stack>;
};

export default SortField;
