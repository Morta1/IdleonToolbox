import React, { useId, useRef, useState } from 'react';
import { Box, Link, Stack, TableSortLabel, Typography } from '@mui/material';
import { formatNum, numberWithCommas } from '@utility/helpers';
import InfoButton from '@components/common/InfoButton';
import { CARD_RADIUS, DIM, cardSurface } from '@components/common/cards/tokens';
import { CELL, HEAD, NUM } from './parts';
import {
  BAND_PREVIEW,
  ariaSort,
  bandRows,
  changeTone,
  columnDisplay,
  detailsUntil,
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
// overrides that color. `bands` are runs of rows under a heading (`label`, `accent`, `icon`, `meta`), or a function
// naming each row's band; `rows` alone is one unlabelled band. `rankOf(row)` leads every row with a narrow # cell,
// at every width: a list whose order is the point (an optimizer's plan, a guild's rank).
// A page that passes onSortChange orders its own rows; any other table sorts itself from `defaultSort`, by each
// column's `sortValue` or `value`. `muted(row)` dims a row (locked); a string also replaces its values with that
// word. `surface="card"` draws the table on the card surface. `linkOf(row)` gives the anchors a collapsed band
// still ships, so a crawler reaches every row; `rowLabel(row)` names a row for its phone Details button. `fits` is
// a small table that fits a phone as it is (a note's): every column at every width, no chevron. `detail(row)` is
// content under an opened row at every width (a per-row calculator), after the columns the phone hides; a column
// with `details: false` stays out of that list (the detail slot already says it).
// `stickyTop` is where the page's sticky toolbar ends: a long table's header sticks there.

// A small table (fits) keeps the phone's tighter padding at every width: it often sits inside a 260 px note.
const TIGHT = { px: 0.75 };
const cellStyle = (column, fits) => ({ ...(column.numeric ? NUM : CELL), ...(fits ? TIGHT : {}), ...column.cellSx });

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
const dataCell = (column, i, row, context, mute, wordAt) => {
  // A locked row says so once, in the first column a phone keeps (the word in a column it hides was only a dash
  // there), and has nothing else to show.
  if (typeof mute === 'string') return { content: i === wordAt ? mute : <span className={'na'}>-</span>, tone: null };
  return { content: cellOf(column, row, context), tone: mute ? null : toneOf(column, row) };
};

// Every cell's style, written once on the table rather than once per cell: the wiki's Items expanded is
// 2,405 rows, and a styled component per cell made "Show more" four times slower than the grid it replaced.
// Separate borders, always: a stuck header cell keeps its line, and the table looks the same before and after
// the header starts sticking.
const tableStyle = (data, primary, secondary, sx, stickyTop, expandable, until, surface, fits, withDetail) => ({
  width: '100%',
  borderCollapse: 'separate',
  borderSpacing: 0,
  '& th.name': fits ? { ...HEAD, ...TIGHT } : HEAD,
  '& td.name': fits ? { ...CELL, ...TIGHT } : CELL,
  '& .row-name': { display: 'flex', gap: 1, alignItems: 'center' },
  '& a.row-link': { typography: 'body2', color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } },
  '& .na': { color: 'text.muted' },
  // A phone row is a 48 px touch target; a row with hidden columns opens them under it (Tables board, on a phone).
  // With a detail slot every row opens at every width; otherwise only where the phone hides columns.
  '& tr.row': {
    height: { xs: 48, md: 'auto' },
    ...(expandable ? { cursor: withDetail ? 'pointer' : { xs: 'pointer', [until]: 'auto' } } : {})
  },
  ...(expandable ? {
    '& td.expand': { display: withDetail ? 'table-cell' : { xs: 'table-cell', [until]: 'none' }, width: 40, p: 0, borderBottom: '1px solid', borderColor: 'action.hover' },
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
    '& tr.detail': { display: withDetail ? 'table-row' : { xs: 'table-row', [until]: 'none' } },
    '& tr.detail > td': { ...CELL, pt: 0 },
    '& .detail-list': { m: 0, display: 'flex', flexDirection: 'column', gap: 0.5 },
    // The hidden columns' list, still only where they hide (the detail slot opens at every width).
    '& .detail-item': {
      display: withDetail ? { xs: 'flex', [until]: 'none' } : 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 2
    },
    '& .detail-item dt': { m: 0, color: 'text.secondary' },
    '& .detail-item dd': { m: 0, textAlign: 'right', fontVariantNumeric: 'tabular-nums' },
    // sm shows the secondary column in the row.
    [`& .detail-${secondary}`]: { display: { xs: 'flex', sm: 'none' } }
  } : {}),
  // A heading and its i side by side; inside a right-aligned th the inline box stays right-aligned.
  // Middle-aligned, or a sortable heading with a note sits 3 px above its neighbours.
  '& .head-note': { display: 'inline-flex', alignItems: 'center', gap: 0.5, verticalAlign: 'middle' },
  // The order is the point, so # shows at every width, as narrow as its numbers.
  '& th.rank': { ...HEAD, textAlign: 'right', width: '1%' },
  '& td.rank': { ...NUM, color: 'text.secondary', width: '1%' },
  // Color never alone: the sign or the word beside it says the same (Tables board).
  '& td.good, & dd.good': { color: 'text.success' },
  '& td.bad, & dd.bad': { color: 'text.error' },
  // Locked, not found, not reached: the Cards board's one look for it.
  '& tr.muted > td': { opacity: DIM },
  // The first row a Show more brings in takes the focus from the link it replaces.
  '& tr.row:focus-visible': { outline: '2px solid var(--mui-palette-primary-main)', outlineOffset: -2 },
  ...sx,
  ...Object.fromEntries(data.flatMap((column, i) => {
    // A table that fits a phone as it is shows every column at every width.
    const display = fits ? 'table-cell' : columnDisplay(i, primary, secondary, column);
    // A number heading stays on one line, like the figures under it ("TOTAL GP" on a phone); a text heading may wrap.
    return [
      [`& th.col-${i}`, { ...HEAD, ...(fits ? TIGHT : {}), ...(column.numeric ? { textAlign: 'right', whiteSpace: 'nowrap' } : {}), display }],
      [`& td.col-${i}`, { ...cellStyle(column, fits), display }]
    ];
  })),
  // Under the toolbar (appBar - 1) and Tabber's strip (appBar - 2), and under the strip's height while a Tabber pins
  // it on a phone (--page-tabs-pinned, 0 elsewhere). The page color for a table on the page (the wiki's); a card's
  // own color on a card, whose box cannot clip a sticky header, so the outer cells round their own corners.
  ...(stickyTop != null ? {
    '& thead th, & thead td': {
      position: 'sticky',
      top: `calc(${stickyTop}px + var(--page-tabs-pinned, 0px))`,
      zIndex: (theme) => theme.zIndex.appBar - 3,
      bgcolor: surface === 'card' ? 'background.paper' : 'background.default'
    },
    ...(surface === 'card' ? {
      '& thead tr > :first-of-type': { borderTopLeftRadius: `${CARD_RADIUS}px` },
      '& thead tr > :last-of-type': { borderTopRightRadius: `${CARD_RADIUS}px` }
    } : {})
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
                     rankOf,
                     linkOf,
                     stickyTop = null,
                     surface = 'page',
                     fits = false,
                     detail,
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
  const expandable = !fits && (Boolean(detail) || data.some((column, i) => !phoneKeeps(column, i, primary)));
  const until = detailsUntil(data, primary, secondary);
  // Where a locked row's word goes: the first data column a phone shows.
  const wordAt = Math.max(0, data.findIndex((column, i) => phoneKeeps(column, i, primary)));
  // The band whose Show more was just used: its first new row takes the focus once it mounts.
  const focusBand = useRef(null);
  const takeFocus = (bandKey) => (element) => {
    if (!element || focusBand.current !== bandKey) return;
    focusBand.current = null;
    element.focus();
  };
  const span = columns.length + (rankOf ? 1 : 0) + (expandable ? 1 : 0);
  const keyOf = typeof rowKey === 'function' ? rowKey : (row) => row[rowKey];
  const labelOf = rowLabel ?? ((row) => String(keyOf(row)));
  const groups = typeof bands === 'function'
    ? bandRows(ordered(rows ?? []), bands)
    : (bands ?? [{ key: 'all', label: null, rows: rows ?? [] }]).map((band) => ({ ...band, rows: ordered(band.rows) }));
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
      <Box component={'table'} ref={tableRef} sx={tableStyle(data, primary, secondary, sx, sticky ? stickyTop : null, expandable, until, surface, fits, Boolean(detail))}>
        <thead>
        <tr>
          {rankOf ? <th scope={'col'} className={'rank'}>#</th> : null}
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
                // The accent is the band's own color (a world's); a band without one draws no edge.
                sx={{ ...CELL, textAlign: 'left', bgcolor: 'action.hover', ...(band.accent ? { borderLeft: '3px solid', borderLeftColor: band.accent } : {}) }}
              >
                <Stack direction={'row'} gap={1.5} alignItems={band.icon ? 'center' : 'baseline'} flexWrap={'wrap'}>
                  {band.icon ?? null}
                  <Typography variant={'body2'} fontWeight={600}>{heading}</Typography>
                  {band.meta ? <Typography variant={'body2'} color={'text.secondary'}>{band.meta}</Typography> : null}
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
              const firstShownMore = Boolean(expanded[band.key]) && rowIndex === BAND_PREVIEW;
              // Row keys can hold any character, so the id is built from positions.
              const detailId = `${baseId}-${bandIndex}-${rowIndex}`;
              return <React.Fragment key={key}>
                <tr className={mute ? 'row muted' : 'row'} onClick={expandable ? rowTap(key) : undefined}
                    tabIndex={firstShownMore ? -1 : undefined} ref={firstShownMore ? takeFocus(band.key) : undefined}>
                  {rankOf ? <td className={'rank'}>{rankOf(row) ?? <span className={'na'}>-</span>}</td> : null}
                  <td className={'name'}>
                    <div className={'row-name'}>
                      {name.icon ? name.icon(row) : null}
                      {name.render(row, { heading })}
                    </div>
                  </td>
                  {data.map((column, i) => {
                    const { content, tone } = dataCell(column, i, row, { heading }, mute, wordAt);
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
                        if (phoneKeeps(column, i, primary) || column.details === false) return null;
                        const { content, tone } = dataCell(column, i, row, { heading }, mute, wordAt);
                        return <div key={column.key} className={`detail-item detail-${i}`}>
                          {/* The column's note travels with its label: the heading that carries it is hidden here */}
                          <dt>{column.info ? <span className={'head-note'}>
                            {column.label}
                            <InfoButton label={headName(column)}>{column.info}</InfoButton>
                          </span> : column.label}</dt>
                          <dd className={tone ?? undefined}>{content}</dd>
                        </div>;
                      })}
                    </dl>
                    {detail ? detail(row) : null}
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
                  onClick={() => {
                    focusBand.current = band.key;
                    setExpanded({ ...expanded, [band.key]: true });
                  }}
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
