import React, { useId, useState } from 'react';
import { Box, Link, Stack, TableSortLabel, Typography } from '@mui/material';
import { formatNum, numberWithCommas } from '@utility/helpers';
import InfoButton from '@components/common/InfoButton';
import { DIM, cardSurface } from '@components/common/cards/tokens';
import { CELL, HEAD, NUM } from './parts';
import {
  ariaSort,
  changeTone,
  columnDisplay,
  firstOrder,
  nextSort,
  phoneKeeps,
  primaryColumn,
  secondaryColumn,
  sortRows,
  visibleRows
} from './layout';
import useStickyHeader from './useStickyHeader';

// One table for rows of numbers people compare (Tables board). columns[0] is the row's name: always shown,
// left-aligned, `icon` beside it. The rest are data columns: `numeric` ones right-align in tabular figures.
// Each column renders its own cell (`render(row, { heading })`), or prints its `value(row)`, formatted by its
// `kind` (Numbers board). `change` ('higher' or 'lower', the good way) signs and colors a change; `tone(row)`
// overrides that color. `bands` are runs of rows under a heading; `rows` alone is one unlabelled band.
// A page that passes onSortChange orders its own rows; any other table sorts itself from `defaultSort`, by each
// column's `sortValue` or `value`. `muted(row)` dims a row (locked); a string also replaces its values with that
// word. `surface="card"` draws the table on the card surface. `linkOf(row)` gives the anchors a collapsed band
// still ships, so a crawler reaches every row; `rowLabel(row)` names a row for its phone Details button.
// `stickyTop` is where the page's sticky toolbar ends: a long table's header sticks there.

const cellStyle = (column) => ({ ...(column.numeric ? NUM : CELL), ...column.cellSx });

// A kind column (Numbers board) is a number column whose cell formats its value; a change always carries its sign.
// A column with a value and no render prints the value. Null is the muted dash.
const prepare = (column) => ({
  ...(column.kind ? { numeric: true } : {}),
  render: column.kind
    ? (row) => {
      const value = column.value(row);
      return value == null ? null : formatNum(value, column.kind, { ...column.format, signed: Boolean(column.change) });
    }
    : (row) => column.value?.(row) ?? null,
  ...column
});

// tone(row) overrides the sign's verdict: 'good', 'bad' or null for no color (a salt nothing consumes).
const toneOf = (column, row) => (column.tone ? column.tone(row) : changeTone(column, column.value?.(row)));

// A value that doesn't apply is a muted dash; a real 0 renders as 0 (Tables board). wrap(row, content) puts the
// value inside a trigger (withBreakdown), so DataTable itself never loads what the trigger opens.
const cellOf = (column, row, context) => {
  const content = column.render(row, context);
  if (content == null) return <span className={'na'}>-</span>;
  return column.wrap ? column.wrap(row, content) : content;
};

// A data cell's content and color, the same in the row and in the phone's detail list.
const dataCell = (column, i, row, context, mute) => {
  // A locked row says so once, in its first data column, and has nothing else to show.
  if (typeof mute === 'string') return { content: i === 0 ? mute : <span className={'na'}>-</span>, tone: null };
  return { content: cellOf(column, row, context), tone: mute ? null : toneOf(column, row) };
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
  // A heading and its i side by side; inside a right-aligned th the inline box stays right-aligned.
  // Middle-aligned, or a sortable heading with a note sits 3 px above its neighbours.
  '& .head-note': { display: 'inline-flex', alignItems: 'center', gap: 0.5, verticalAlign: 'middle' },
  // Color never alone: the sign or the word beside it says the same (Tables board).
  '& td.good, & dd.good': { color: 'text.success' },
  '& td.bad, & dd.bad': { color: 'text.error' },
  // Locked, not found, not reached: the Cards board's one look for it.
  '& tr.muted > td': { opacity: DIM },
  ...sx,
  ...Object.fromEntries(data.flatMap((column, i) => {
    const display = columnDisplay(i, primary, secondary, column);
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

// A heading's name for the note's label: its words, or its key when the heading is art (a miniboss sprite).
const headName = (column) => (typeof column.label === 'string' ? column.label : column.key);

// A sortable heading is a button, and its note a second button beside it, never inside: nested, a screen reader
// hears one control and a click on the i sorts the column.
const HeadLabel = ({ column, sort, onSortChange }) => {
  const label = column.sortable ? <TableSortLabel
    active={sort?.key === column.key}
    direction={sort?.key === column.key ? sort?.order : firstOrder(column)}
    onClick={() => onSortChange?.(nextSort(sort, column))}
    // The arrow goes on the inner side, so a number heading lines up with the figures under it.
    sx={column.numeric ? { flexDirection: 'row-reverse' } : undefined}
  >
    {column.label}
  </TableSortLabel> : column.label;
  if (!column.info) return label;
  return <span className={'head-note'}>
    {label}
    <InfoButton label={headName(column)}>{column.info}</InfoButton>
  </span>;
};

const DataTable = ({
                     columns: rawColumns,
                     rows,
                     bands,
                     rowKey,
                     rowLabel,
                     sort: sortProp = null,
                     defaultSort = null,
                     onSortChange,
                     muted,
                     linkOf,
                     stickyTop = null,
                     surface = 'page',
                     sx
                   }) => {
  const [expanded, setExpanded] = useState({});
  const [openRows, setOpenRows] = useState({});
  const [ownSort, setOwnSort] = useState(defaultSort);
  const baseId = useId();
  const { boxRef, tableRef, sticky } = useStickyHeader(stickyTop);
  const columns = rawColumns.map(prepare);
  // A page that passes onSortChange orders its own rows (the wiki keeps its sort in the URL); any other table sorts
  // itself, band by band.
  const controlled = onSortChange !== undefined;
  const sort = controlled ? sortProp : ownSort;
  const changeSort = controlled ? onSortChange : setOwnSort;
  const ordered = (list) => (controlled ? list : sortRows(list, columns, sort, muted));
  const [name, ...data] = columns;
  const primary = primaryColumn(data, sort);
  const secondary = secondaryColumn(data, primary);
  // A phone hides every data column but the ones it keeps: when that hides any, each row opens the rest under it.
  const expandable = data.some((column, i) => !phoneKeeps(column, i, primary));
  const span = columns.length + (expandable ? 1 : 0);
  const keyOf = typeof rowKey === 'function' ? rowKey : (row) => row[rowKey];
  const labelOf = rowLabel ?? ((row) => String(keyOf(row)));
  const groups = (bands ?? [{ key: 'all', label: null, rows: rows ?? [] }]).map((band) => ({ ...band, rows: ordered(band.rows) }));
  const hidden = [];
  const toggle = (key) => setOpenRows({ ...openRows, [key]: !openRows[key] });
  // A tap anywhere on a row opens it on a phone, except on the row's own link or button. The button is
  // display:none from md, which is how a desktop click knows to do nothing. A click from a portal (a pinned note,
  // the breakdown drawer) bubbles here through React, and a note's trigger is a span with the button role.
  const rowTap = (key) => (event) => {
    if (!event.currentTarget.contains(event.target) || event.target.closest('a, button, [role="button"]')) return;
    if (event.currentTarget.querySelector('.expand-button')?.offsetParent) toggle(key);
  };

  return <>
    <Box ref={boxRef} sx={[{ overflowX: sticky ? 'visible' : 'auto' }, surface === 'card' ? cardSurface : null]}>
      <Box component={'table'} ref={tableRef} sx={tableStyle(data, primary, secondary, sx, sticky ? stickyTop : null, expandable)}>
        <thead>
        <tr>
          <th scope={'col'} className={'name'} aria-sort={ariaSort(name, sort)}>
            <HeadLabel column={name} sort={sort} onSortChange={changeSort}/>
          </th>
          {data.map((column, i) => <th scope={'col'} key={column.key} className={`col-${i}`} aria-sort={ariaSort(column, sort)}>
            <HeadLabel column={column} sort={sort} onSortChange={changeSort}/>
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
              const mute = muted?.(row);
              // Row keys can hold any character, so the id is built from positions.
              const detailId = `${baseId}-${bandIndex}-${rowIndex}`;
              return <React.Fragment key={key}>
                <tr className={mute ? 'row muted' : 'row'} onClick={expandable ? rowTap(key) : undefined}>
                  <td className={'name'}>
                    <div className={'row-name'}>
                      {name.icon ? name.icon(row) : null}
                      {name.render(row, { heading })}
                    </div>
                  </td>
                  {data.map((column, i) => {
                    const { content, tone } = dataCell(column, i, row, { heading }, mute);
                    return <td key={column.key} className={tone ? `col-${i} ${tone}` : `col-${i}`}>{content}</td>;
                  })}
                  {expandable ? <td className={'expand'}>
                    <button type={'button'} className={'expand-button'} aria-expanded={open}
                            aria-controls={open ? detailId : undefined} aria-label={`Details for ${labelOf(row)}`}
                            onClick={() => toggle(key)}/>
                  </td> : null}
                </tr>
                {open ? <tr className={'detail'} id={detailId}>
                  <td colSpan={span}>
                    <dl className={'detail-list'}>
                      {data.map((column, i) => {
                        if (phoneKeeps(column, i, primary)) return null;
                        const { content, tone } = dataCell(column, i, row, { heading }, mute);
                        return <div key={column.key} className={`detail-item detail-${i}`}>
                          <dt>{column.label}</dt>
                          <dd className={tone ?? undefined}>{content}</dd>
                        </div>;
                      })}
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
