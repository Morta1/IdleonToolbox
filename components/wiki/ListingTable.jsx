import React from 'react';
import { Link, Typography } from '@mui/material';
import DataTable from '@components/common/DataTable';
import EntityIcon from './EntityIcon';
import GemCount from './GemCount';
import { coinsOf } from './CoinAmount';
import { CostAmount } from './LevelledEffect';
import { linkProps, navigateOnPlainClick } from './links';
import { formatNum, prefix } from '@utility/helpers';
import { formatAmount } from '@utility/wiki/effects.mjs';
import { notateAmount, notateGame } from '@utility/wiki/notate';
import { NAME_COLUMN, NO_MAX, isNumericColumn } from '@utility/wiki/listing-sort.mjs';

// What tells a same-name page from the others, printed after the name they share. Not under a band heading
// that already says it ("Trophy" over a trophy).
export const Disambig = ({ entry, band }) => (entry.disambig && entry.disambig !== band ? <>
  {' '}
  <Typography component={'span'} variant={'caption'} color={'text.secondary'}>{entry.disambig}</Typography>
</> : null);

// A cost's currency word can run long ("Summoning Essence"), so it wraps on a phone rather than push the page sideways.
const COST = { whiteSpace: { xs: 'normal', sm: 'nowrap' } };
const EFFECT = { color: 'text.secondary' };

// The wiki's own cell markup, styled once on the table like the rest.
const WIKI_CELLS = {
  '& .end': { display: 'flex', justifyContent: 'flex-end' },
  '& .coins': { display: 'flex', gap: 0.75, flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' },
  '& .coin': { display: 'flex', gap: 0.25, alignItems: 'center', typography: 'caption', color: 'text.secondary' }
};

// Inside a right-aligned cell, a flex child (coins, gems) needs pushing to the right edge itself.
const RightAligned = ({ children }) => <div className={'end'}>{children}</div>;

// CoinAmount's denominations as plain markup the table styles once: a coin column is 1,528 Item cells, and
// CoinAmount's styled stacks per cell were most of what an expanded Items list cost.
const Coins = ({ amount }) => <span className={'coins'}>
  {coinsOf(amount).map(([coinIndex, quantity]) => <span key={coinIndex} className={'coin'}>
    <img src={`${prefix}data/Coins${coinIndex}.png`} alt={''} width={16} height={16} style={{ objectFit: 'contain' }}/>
    {notateAmount(quantity)}
  </span>)}
</span>;

const formatted = (value, format) => {
  if (format === 'coins') return <Coins amount={value}/>;
  if (format === 'amount') return formatAmount(value);
  if (format === 'notate') return notateGame(value) ?? '';
  if (format === 'usd') return formatNum(value, 'price');
  // A field priced in a currency with art (a superbit's bits): the amount in the game's notation, the art left to the page.
  if (format === 'cost') return <CostAmount amount={value}/>;
  if (format === 'gems' || format === 'crystals') {
    return <RightAligned><GemCount amount={value} isCrystal={format === 'crystals'}/></RightAligned>;
  }
  return notateAmount(value);
};

// One currency per cost, every cost of the row: a pet upgrade pays two at once. A currency with art is drawn
// rather than named, the word kept as the image's alt text.
const costText = (costs) => costs.map((cost, i) => <React.Fragment key={i}>
  {i > 0 ? ' + ' : null}
  <CostAmount amount={cost.amount} currency={cost.currency} icon={cost.icon}/>
</React.Fragment>);

const cellContent = (column, value, labelOf) => {
  if (value == null) return null;
  if (column.type === 'facet') return labelOf(value);
  if (column.type === 'effect' || column.type === 'text') return value;
  if (column.type === 'cost') return costText(value);
  if (column.type === 'max') return value === NO_MAX ? 'No max' : notateAmount(value);
  return formatted(value, column.format);
};

// A row's name. A plain anchor the table styles once, the look of the wiki's Link, because a styled Link per row
// was a third of what expanding Items cost; a row with no page falls back to the Link button.
const RowLink = ({ entry, hrefFor, onNavigate, heading }) => {
  const href = hrefFor?.(entry.id);
  const name = <>{entry.label}<Disambig entry={entry} band={heading}/></>;
  if (!href) {
    return <Link {...linkProps(hrefFor, entry.id)} variant={'body2'} underline={'hover'} textAlign={'left'}
                 onClick={navigateOnPlainClick(onNavigate, entry.id, false)}>{name}</Link>;
  }
  return <a href={href} className={'row-link'} onClick={navigateOnPlainClick(onNavigate, entry.id, true)}>{name}</a>;
};

// A listing as one table: the bands become full-width rows inside it, so the columns line up across them,
// which is the pattern RelationTable uses for a monster's drop tables. The wiki's cell types live here;
// DataTable draws the table.
const ListingTable = ({ columns, bands, sorted, sort, onSortChange, hrefFor, onNavigate, labelOf, colourOf, stickyTop }) => {
  // A kind the game draws no art for (superbits, cove upgrades) keeps no empty icon slot on every row.
  const drawsIcons = bands.some((band) => band.entries.some((entry) => entry.node?.icon));
  const name = {
    ...NAME_COLUMN,
    icon: drawsIcons ? (entry) => <EntityIcon node={entry.node} size={32} loading={'lazy'}/> : undefined,
    render: (entry, { heading }) => <RowLink entry={entry} hrefFor={hrefFor} onNavigate={onNavigate} heading={heading}/>
  };
  const data = columns.map((column, i) => ({
    key: column.key,
    label: column.label,
    info: column.note,
    sortable: column.sortable,
    numeric: isNumericColumn(column),
    cellSx: column.type === 'cost' ? COST : column.type === 'effect' ? EFFECT : undefined,
    render: (entry) => cellContent(column, entry.cells?.[i] ?? null, labelOf)
  }));
  return <DataTable
    columns={[name, ...data]}
    bands={bands.map((band, bandIndex) => ({
      key: band.key,
      label: band.label && !sorted ? labelOf(band.label) : null,
      accent: colourOf(bandIndex),
      rows: band.entries
    }))}
    rowKey={(entry) => entry.id}
    rowLabel={(entry) => entry.label}
    sort={sort}
    onSortChange={onSortChange}
    linkOf={(entry) => {
      const href = hrefFor?.(entry.id);
      return href ? { href, label: entry.label } : null;
    }}
    stickyTop={stickyTop}
    sx={WIKI_CELLS}
  />;
};

export default ListingTable;
