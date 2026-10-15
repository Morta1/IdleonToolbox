import React, { useState } from 'react';
import { Box, Link, Stack, TableSortLabel, Typography } from '@mui/material';
import EntityIcon from './EntityIcon';
import GemCount from './GemCount';
import CoinAmount from './CoinAmount';
import { CurrencyIcon } from './LevelledEffect';
import { CELL, HEAD, HeadNote, NUM } from './table-parts';
import { linkProps, navigateOnPlainClick } from './links';
import { cleanUnderscore } from '@utility/helpers';
import { formatAmount } from '@utility/wiki/effects.mjs';
import { notateGame } from '@utility/wiki/notate';
import { NO_MAX } from '@utility/wiki/listing.mjs';
import { nextSort } from '@utility/wiki/listing-sort.mjs';

// Bands replace paging. A band is a page: the whole category renders, but broken into runs a
// reader can place themselves in, which is what the flat 100-per-page list never gave them.
// Items is 2,431 rows, so a band past this size collapses until asked for rather than putting
// every image on the page at once.
export const BAND_PREVIEW = 60;

// How far past the preview a band may run before collapsing is worth it. World 1's achievements are
// 63, which hid three of them behind a "Show 3 more" link: the link cost more attention than the
// three rows it saved. A band only collapses when doing so actually shortens the page.
export const BAND_SLACK = 20;

// The rows a band shows: all of them once expanded, or when collapsing would not shorten the page.
export const visibleRows = (entries, expanded) => (expanded || entries.length <= BAND_PREVIEW + BAND_SLACK
  ? entries
  : entries.slice(0, BAND_PREVIEW));

// What tells a same-name page from the others, printed after the name they share. Not under a band heading
// that already says it ("Trophy" over a trophy).
export const Disambig = ({ entry, band }) => (entry.disambig && entry.disambig !== band ? <>
  {' '}
  <Typography component={'span'} variant={'caption'} color={'text.secondary'}>{entry.disambig}</Typography>
</> : null);

const NUMERIC_TYPES = new Set(['number', 'cost', 'max']);
const isNumeric = (column) => NUMERIC_TYPES.has(column.type);

// The column a phone keeps beside the name: the one the reader sorted by, else the first number. -1 for none,
// which is the plain name list.
const primaryColumn = (columns, sort) => {
  const sorted = sort ? columns.findIndex((column) => column.key === sort.key) : -1;
  return sorted >= 0 ? sorted : columns.findIndex(isNumeric);
};

// The one more column sm has room for: the next after the primary, else the one before it.
const secondaryColumn = (columns, primary) => {
  if (primary < 0) return columns.length ? 0 : -1;
  if (primary + 1 < columns.length) return primary + 1;
  return primary - 1;
};

// The phone gets the name and the one number the reader sorted by; the hidden headers are reachable through
// the sort select. CSS only, so the first render is the same at every width.
export const columnDisplay = (index, primary, secondary) => {
  if (index === primary) return 'table-cell';
  if (index === secondary) return { xs: 'none', sm: 'table-cell' };
  return { xs: 'none', md: 'table-cell' };
};

// A cost's currency word can run long ("Summoning Essence"), so it wraps on a phone rather than push the page sideways.
const COST = { ...NUM, whiteSpace: { xs: 'normal', sm: 'nowrap' } };

// Inside a right-aligned cell, a flex child (coins, gems) needs pushing to the right edge itself.
const RightAligned = ({ children }) => <Stack direction={'row'} justifyContent={'flex-end'}>{children}</Stack>;

const formatted = (value, format) => {
  if (format === 'coins') return <RightAligned><CoinAmount amount={value} size={16}/></RightAligned>;
  if (format === 'amount') return formatAmount(value);
  if (format === 'notate') return notateGame(value) ?? '';
  if (format === 'usd') return `$${value.toFixed(2)}`;
  if (format === 'gems' || format === 'crystals') {
    return <RightAligned><GemCount amount={value} isCrystal={format === 'crystals'}/></RightAligned>;
  }
  return value.toLocaleString('en-US');
};

// One currency per cost, every cost of the row: a pet upgrade pays two at once.
const costText = (costs) => costs.map((cost, i) => <React.Fragment key={i}>
  {i > 0 ? ' + ' : null}
  {`${formatAmount(cost.amount)} ${cleanUnderscore(cost.currency)}`}
  <CurrencyIcon icon={cost.icon}/>
</React.Fragment>);

const cellContent = (column, value, labelOf) => {
  if (value == null) return null;
  if (column.type === 'facet') return labelOf(value);
  if (column.type === 'effect' || column.type === 'text') {
    return <Typography variant={'body2'} color={column.type === 'effect' ? 'text.secondary' : undefined}>{value}</Typography>;
  }
  if (column.type === 'cost') return costText(value);
  if (column.type === 'max') return value === NO_MAX ? 'No max' : value.toLocaleString('en-US');
  return formatted(value, column.format);
};

const cellStyle = (column) => {
  if (column.type === 'cost') return COST;
  return isNumeric(column) ? NUM : CELL;
};

const HeadLabel = ({ column, sort, onSortChange }) => {
  const label = column.note ? <HeadNote note={column.note} justifyContent={isNumeric(column) ? 'flex-end' : 'flex-start'}>
    {column.label}
  </HeadNote> : column.label;
  if (!column.sortable) return label;
  const active = sort?.key === column.key;
  return <TableSortLabel
    active={active}
    direction={active ? sort.order : 'asc'}
    onClick={() => onSortChange?.(nextSort(sort, column.key))}
    // The arrow goes on the inner side, so a number heading lines up with the figures under it.
    sx={isNumeric(column) ? { flexDirection: 'row-reverse' } : undefined}
  >
    {label}
  </TableSortLabel>;
};

const NAME = { key: 'name', label: 'Name', type: 'name', sortable: true };

// A listing as one table: the bands become full-width rows inside it, so the columns line up across them,
// which is the pattern RelationTable uses for a monster's drop tables.
const ListingTable = ({ columns, bands, sorted, sort, onSortChange, hrefFor, onNavigate, labelOf, colourOf }) => {
  const [expanded, setExpanded] = useState({});
  const primary = primaryColumn(columns, sort);
  const secondary = secondaryColumn(columns, primary);
  const span = columns.length + 1;
  const hidden = [];

  return <>
    <Box sx={{ overflowX: 'auto' }}>
      <Box component={'table'} sx={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
        <Box component={'tr'}>
          <Box component={'th'} scope={'col'} sx={HEAD}>
            <HeadLabel column={NAME} sort={sort} onSortChange={onSortChange}/>
          </Box>
          {columns.map((column, i) => <Box
            component={'th'}
            scope={'col'}
            key={column.key}
            sx={{ ...HEAD, ...(isNumeric(column) ? { textAlign: 'right' } : {}), display: columnDisplay(i, primary, secondary) }}
          >
            <HeadLabel column={column} sort={sort} onSortChange={onSortChange}/>
          </Box>)}
        </Box>
        </thead>
        <tbody>
        {bands.map((band, bandIndex) => {
          const rows = visibleRows(band.entries, expanded[band.key]);
          const more = band.entries.length - rows.length;
          hidden.push(...band.entries.slice(rows.length));
          const heading = band.label && !sorted ? labelOf(band.label) : null;
          return <React.Fragment key={band.key}>
            {heading ? <Box component={'tr'}>
              <Box
                component={'th'}
                scope={'rowgroup'}
                colSpan={span}
                sx={{ ...CELL, textAlign: 'left', bgcolor: 'action.hover', borderLeft: '3px solid', borderLeftColor: colourOf(bandIndex) }}
              >
                <Stack direction={'row'} gap={1.5} alignItems={'baseline'} flexWrap={'wrap'}>
                  <Typography variant={'body2'} fontWeight={600}>{heading}</Typography>
                  <Typography variant={'caption'} color={'text.disabled'} sx={{ ml: 'auto' }}>
                    {band.entries.length.toLocaleString('en-US')}
                  </Typography>
                </Stack>
              </Box>
            </Box> : null}
            {rows.map((entry) => <Box component={'tr'} key={entry.id}>
              <Box component={'td'} sx={CELL}>
                <Stack direction={'row'} gap={1} alignItems={'center'}>
                  <EntityIcon node={entry.node} size={32} loading={'lazy'}/>
                  <Link
                    {...linkProps(hrefFor, entry.id)}
                    variant={'body2'}
                    underline={'hover'}
                    textAlign={'left'}
                    onClick={navigateOnPlainClick(onNavigate, entry.id, Boolean(hrefFor?.(entry.id)))}
                  >
                    {entry.label}<Disambig entry={entry} band={heading}/>
                  </Link>
                </Stack>
              </Box>
              {columns.map((column, i) => <Box
                component={'td'}
                key={column.key}
                sx={{ ...cellStyle(column), display: columnDisplay(i, primary, secondary) }}
              >
                {cellContent(column, entry.cells?.[i] ?? null, labelOf)}
              </Box>)}
            </Box>)}
            {more > 0 ? <Box component={'tr'}>
              <Box component={'td'} colSpan={span} sx={CELL}>
                <Link
                  component={'button'}
                  type={'button'}
                  variant={'body2'}
                  underline={'hover'}
                  onClick={() => setExpanded({ ...expanded, [band.key]: true })}
                >
                  Show {more.toLocaleString('en-US')} more{heading ? ` in ${heading}` : ''}
                </Link>
              </Box>
            </Box> : null}
          </React.Fragment>;
        })}
        </tbody>
      </Box>
    </Box>

    {/* The rows the collapsed bands hide are only reachable to a crawler through here. Text-only
        anchors, or a 2,400-row category requests 2,400 images for a block nobody sees. */}
    {hidden.length > 0 ? <Box component={'nav'} aria-hidden sx={{ display: 'none' }}>
      {hidden.map((entry) => {
        const href = hrefFor?.(entry.id);
        return href ? <a key={entry.id} href={href}>{entry.label}</a> : null;
      })}
    </Box> : null}
  </>;
};

export default ListingTable;
