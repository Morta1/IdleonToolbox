import React, { useId, useState } from 'react';
import { Box, Link, Stack, TableSortLabel, Typography } from '@mui/material';
import { numberWithCommas } from '@utility/helpers';
import { CELL, HEAD, HeadNote, NUM } from './parts';
import { ariaSort, columnDisplay, firstOrder, nextSort, primaryColumn, secondaryColumn, visibleRows } from './layout';
import useStickyHeader from './useStickyHeader';

// One table for rows of numbers people compare (Tables board). columns[0] is the row's name: always shown,
// left-aligned, `icon` beside it. The rest are data columns: `numeric` ones right-align in tabular figures.
// Each column renders its own cell (`render(row, { heading })`). The page sorts the rows; the header only
// reports the next sort. `bands` are runs of rows under a heading; `rows` alone is one unlabelled band.
// `linkOf(row)` gives the anchors a collapsed band still ships, so a crawler reaches every row; `rowLabel(row)`
// names a row for its phone Details button. `stickyTop` is where the page's sticky toolbar ends: a long
// table's header sticks there.

const cellStyle = (column) => ({ ...(column.numeric ? NUM : CELL), ...column.cellSx });

// A value that doesn't apply is a muted dash; a real 0 renders as 0 (Tables board).
const cellOf = (column, row, context) => {
  const content = column.render(row, context);
  return content == null ? <span className={'na'}>-</span> : content;
};

// Every cell's style, written once on the table rather than once per cell: the wiki's Items expanded is
// 2,405 rows, and a styled component per cell made "Show more" four times slower than the grid it replaced.
// Separate borders, always: a stuck header cell keeps its line, and the table looks the same before and after
// the header starts sticking.
const tableStyle = (data, primary, secondary, sx, stickyTop, expandable) => ({
  width: '100%',
  borderCollapse: 'separate',
  borderSpacing: 0,
  '& th.name': HEAD,
  '& td.name': CELL,
  '& .row-name': { display: 'flex', gap: 1, alignItems: 'center' },
  '& a.row-link': { typography: 'body2', color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } },
  '& .na': { color: 'text.muted' },
  // A phone row is a 48 px touch target; a row with hidden columns opens them under it (Tables board, on a phone).
  '& tr.row': { height: { xs: 48, md: 'auto' }, ...(expandable ? { cursor: { xs: 'pointer', md: 'auto' } } : {}) },
  ...(expandable ? {
    '& td.expand': { display: { xs: 'table-cell', md: 'none' }, width: 40, p: 0, borderBottom: '1px solid', borderColor: 'action.hover' },
    '& thead td.expand': { borderColor: 'divider' },
    // One plain button styled once, not an IconButton per row (2,400 rows on Items). Its chevron is two
    // borders of a square, turned down when closed and up when open.
    '& .expand-button': {
      display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, p: 0,
      border: 0, bgcolor: 'transparent', color: 'text.secondary', cursor: 'pointer',
      '&::before': {
        content: '""', width: 8, height: 8, borderRight: '2px solid', borderBottom: '2px solid',
        transform: 'translateY(-2px) rotate(45deg)'
      },
      '&[aria-expanded="true"]::before': { transform: 'translateY(2px) rotate(225deg)' }
    },
    '& tr.detail': { display: { xs: 'table-row', md: 'none' } },
    '& tr.detail > td': { ...CELL, pt: 0 },
    '& .detail-list': { m: 0, display: 'flex', flexDirection: 'column', gap: 0.5 },
    '& .detail-item': { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 2 },
    '& .detail-item dt': { m: 0, color: 'text.secondary' },
    '& .detail-item dd': { m: 0, textAlign: 'right', fontVariantNumeric: 'tabular-nums' },
    // sm shows the secondary column in the row.
    [`& .detail-${secondary}`]: { display: { xs: 'flex', sm: 'none' } }
  } : {}),
  ...sx,
  ...Object.fromEntries(data.flatMap((column, i) => {
    const display = columnDisplay(i, primary, secondary);
    return [
      [`& th.col-${i}`, { ...HEAD, ...(column.numeric ? { textAlign: 'right' } : {}), display }],
      [`& td.col-${i}`, { ...cellStyle(column), display }]
    ];
  })),
  // Under the toolbar (appBar - 1) and Tabber's strip (appBar - 2). The page color: the wiki's table sits on the page.
  ...(stickyTop != null ? {
    '& thead th, & thead td': { position: 'sticky', top: stickyTop, zIndex: (theme) => theme.zIndex.appBar - 3, bgcolor: 'background.default' }
  } : {})
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

const DataTable = ({ columns, rows, bands, rowKey, rowLabel, sort = null, onSortChange, linkOf, stickyTop = null, sx }) => {
  const [expanded, setExpanded] = useState({});
  const [openRows, setOpenRows] = useState({});
  const baseId = useId();
  const { boxRef, tableRef, sticky } = useStickyHeader(stickyTop);
  const [name, ...data] = columns;
  const primary = primaryColumn(data, sort);
  const secondary = secondaryColumn(data, primary);
  // A phone hides every data column but the primary: when that hides any, each row opens the rest under it.
  const expandable = data.length > (primary >= 0 ? 1 : 0);
  const span = columns.length + (expandable ? 1 : 0);
  const keyOf = typeof rowKey === 'function' ? rowKey : (row) => row[rowKey];
  const labelOf = rowLabel ?? ((row) => String(keyOf(row)));
  const groups = bands ?? [{ key: 'all', label: null, rows }];
  const hidden = [];
  const toggle = (key) => setOpenRows({ ...openRows, [key]: !openRows[key] });
  // A tap anywhere on a row opens it on a phone, except on the row's own link or button. The button is
  // display:none from md, which is how a desktop click knows to do nothing.
  const rowTap = (key) => (event) => {
    if (event.target.closest('a, button')) return;
    if (event.currentTarget.querySelector('.expand-button')?.offsetParent) toggle(key);
  };

  return <>
    <Box ref={boxRef} sx={{ overflowX: sticky ? 'visible' : 'auto' }}>
      <Box component={'table'} ref={tableRef} sx={tableStyle(data, primary, secondary, sx, sticky ? stickyTop : null, expandable)}>
        <thead>
        <tr>
          <th scope={'col'} className={'name'} aria-sort={ariaSort(name, sort)}>
            <HeadLabel column={name} sort={sort} onSortChange={onSortChange}/>
          </th>
          {data.map((column, i) => <th scope={'col'} key={column.key} className={`col-${i}`} aria-sort={ariaSort(column, sort)}>
            <HeadLabel column={column} sort={sort} onSortChange={onSortChange}/>
          </th>)}
          {expandable ? <td className={'expand'}/> : null}
        </tr>
        </thead>
        <tbody>
        {groups.map((band, bandIndex) => {
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
                  <Typography variant={'caption'} color={'text.muted'} sx={{ ml: 'auto' }}>
                    {numberWithCommas(band.rows.length)}
                  </Typography>
                </Stack>
              </Box>
            </Box> : null}
            {shown.map((row, rowIndex) => {
              const key = keyOf(row);
              const open = Boolean(openRows[key]);
              // Row keys can hold any character, so the id is built from positions.
              const detailId = `${baseId}-${bandIndex}-${rowIndex}`;
              return <React.Fragment key={key}>
                <tr className={'row'} onClick={expandable ? rowTap(key) : undefined}>
                  <td className={'name'}>
                    <div className={'row-name'}>
                      {name.icon ? name.icon(row) : null}
                      {name.render(row, { heading })}
                    </div>
                  </td>
                  {data.map((column, i) => <td key={column.key} className={`col-${i}`}>
                    {cellOf(column, row, { heading })}
                  </td>)}
                  {expandable ? <td className={'expand'}>
                    <button type={'button'} className={'expand-button'} aria-expanded={open}
                            aria-controls={open ? detailId : undefined} aria-label={`Details for ${labelOf(row)}`}
                            onClick={() => toggle(key)}/>
                  </td> : null}
                </tr>
                {open ? <tr className={'detail'} id={detailId}>
                  <td colSpan={span}>
                    <dl className={'detail-list'}>
                      {data.map((column, i) => (i === primary ? null : <div key={column.key} className={`detail-item detail-${i}`}>
                        <dt>{column.label}</dt>
                        <dd>{cellOf(column, row, { heading })}</dd>
                      </div>))}
                    </dl>
                  </td>
                </tr> : null}
              </React.Fragment>;
            })}
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
