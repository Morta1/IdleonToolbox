import React, { useState } from 'react';
import { Box, Link, Stack, TableSortLabel, Typography } from '@mui/material';
import { numberWithCommas } from '@utility/helpers';
import { CELL, HEAD, HeadNote, NUM } from './parts';
import { ariaSort, columnDisplay, firstOrder, nextSort, primaryColumn, secondaryColumn, visibleRows } from './layout';

// One table for rows of numbers people compare (Tables board). columns[0] is the row's name: always shown,
// left-aligned, `icon` beside it. The rest are data columns: `numeric` ones right-align in tabular figures.
// Each column renders its own cell (`render(row, { heading })`). The page sorts the rows; the header only
// reports the next sort. `bands` are runs of rows under a heading; `rows` alone is one unlabelled band.
// `linkOf(row)` gives the anchors a collapsed band still ships, so a crawler reaches every row.

const cellStyle = (column) => ({ ...(column.numeric ? NUM : CELL), ...column.cellSx });

// A value that doesn't apply is a muted dash; a real 0 renders as 0 (Tables board).
const cellOf = (column, row, context) => {
  const content = column.render(row, context);
  return content == null ? <span className={'na'}>-</span> : content;
};

// Every cell's style, written once on the table rather than once per cell: the wiki's Items expanded is
// 2,405 rows, and a styled component per cell made "Show more" four times slower than the grid it replaced.
const tableStyle = (data, primary, secondary, sx) => ({
  width: '100%',
  borderCollapse: 'collapse',
  '& th.name': HEAD,
  '& td.name': CELL,
  '& .row-name': { display: 'flex', gap: 1, alignItems: 'center' },
  '& a.row-link': { typography: 'body2', color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } },
  '& .na': { color: 'text.muted' },
  ...sx,
  ...Object.fromEntries(data.flatMap((column, i) => {
    const display = columnDisplay(i, primary, secondary);
    return [
      [`& th.col-${i}`, { ...HEAD, ...(column.numeric ? { textAlign: 'right' } : {}), display }],
      [`& td.col-${i}`, { ...cellStyle(column), display }]
    ];
  }))
});

const HeadLabel = ({ column, sort, onSortChange }) => {
  const label = column.info ? <HeadNote note={column.info} justifyContent={column.numeric ? 'flex-end' : 'flex-start'}>
    {column.label}
  </HeadNote> : column.label;
  if (!column.sortable) return label;
  const active = sort?.key === column.key;
  return <TableSortLabel
    active={active}
    direction={active ? sort.order : firstOrder(column)}
    onClick={() => onSortChange?.(nextSort(sort, column))}
    // The arrow goes on the inner side, so a number heading lines up with the figures under it.
    sx={column.numeric ? { flexDirection: 'row-reverse' } : undefined}
  >
    {label}
  </TableSortLabel>;
};

const DataTable = ({ columns, rows, bands, rowKey, sort = null, onSortChange, linkOf, sx }) => {
  const [expanded, setExpanded] = useState({});
  const [name, ...data] = columns;
  const primary = primaryColumn(data, sort);
  const secondary = secondaryColumn(data, primary);
  const span = columns.length;
  const keyOf = typeof rowKey === 'function' ? rowKey : (row) => row[rowKey];
  const groups = bands ?? [{ key: 'all', label: null, rows }];
  const hidden = [];

  return <>
    <Box sx={{ overflowX: 'auto' }}>
      <Box component={'table'} sx={tableStyle(data, primary, secondary, sx)}>
        <thead>
        <tr>
          <th scope={'col'} className={'name'} aria-sort={ariaSort(name, sort)}>
            <HeadLabel column={name} sort={sort} onSortChange={onSortChange}/>
          </th>
          {data.map((column, i) => <th scope={'col'} key={column.key} className={`col-${i}`} aria-sort={ariaSort(column, sort)}>
            <HeadLabel column={column} sort={sort} onSortChange={onSortChange}/>
          </th>)}
        </tr>
        </thead>
        <tbody>
        {groups.map((band) => {
          const shown = visibleRows(band.rows, expanded[band.key]);
          const more = band.rows.length - shown.length;
          hidden.push(...band.rows.slice(shown.length));
          const heading = band.label || null;
          return <React.Fragment key={band.key}>
            {heading ? <Box component={'tr'}>
              <Box
                component={'th'}
                scope={'rowgroup'}
                colSpan={span}
                sx={{ ...CELL, textAlign: 'left', bgcolor: 'action.hover', borderLeft: '3px solid', borderLeftColor: band.accent }}
              >
                <Stack direction={'row'} gap={1.5} alignItems={'baseline'} flexWrap={'wrap'}>
                  <Typography variant={'body2'} fontWeight={600}>{heading}</Typography>
                  <Typography variant={'caption'} color={'text.disabled'} sx={{ ml: 'auto' }}>
                    {numberWithCommas(band.rows.length)}
                  </Typography>
                </Stack>
              </Box>
            </Box> : null}
            {shown.map((row) => <tr key={keyOf(row)}>
              <td className={'name'}>
                <div className={'row-name'}>
                  {name.icon ? name.icon(row) : null}
                  {name.render(row, { heading })}
                </div>
              </td>
              {data.map((column, i) => <td key={column.key} className={`col-${i}`}>
                {cellOf(column, row, { heading })}
              </td>)}
            </tr>)}
            {more > 0 ? <Box component={'tr'}>
              <Box component={'td'} colSpan={span} sx={CELL}>
                <Link
                  component={'button'}
                  type={'button'}
                  variant={'body2'}
                  underline={'hover'}
                  onClick={() => setExpanded({ ...expanded, [band.key]: true })}
                >
                  Show {numberWithCommas(more)} more{heading ? ` in ${heading}` : ''}
                </Link>
              </Box>
            </Box> : null}
          </React.Fragment>;
        })}
        </tbody>
      </Box>
    </Box>

    {/* The rows the collapsed bands hide reach a crawler only through here. Text-only anchors, or a
        2,400-row list requests 2,400 images for a block nobody sees. */}
    {hidden.length > 0 && linkOf ? <Box component={'nav'} aria-hidden sx={{ display: 'none' }}>
      {hidden.map((row) => {
        const link = linkOf(row);
        return link ? <a key={keyOf(row)} href={link.href}>{link.label}</a> : null;
      })}
    </Box> : null}
  </>;
};

export default DataTable;
