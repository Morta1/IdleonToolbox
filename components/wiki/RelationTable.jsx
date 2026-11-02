import React, { useState } from 'react';
import { Link, Stack, TextField, Typography } from '@mui/material';
import TagLine from '@components/common/TagLine';
import DataTable from '@components/common/DataTable';
import EntityIcon from './EntityIcon';
import CoinAmount, { isCoin } from './CoinAmount';
import Price from './Price';
import { entityName } from '@utility/wiki/names.mjs';
import { dropTalentLabel, oneInOrNothing, percentLabel } from '@utility/wiki/drops';
import { orderRows } from '@utility/wiki/relations';
import { navigateOnPlainClick } from './links';
import { formatNum } from '@utility/helpers';
import { notateAmount } from '@utility/wiki/notate';

// A flat list is right for the median entity, which has three relations. Silver Pen has 248, and
// there a list is a wall: nothing lines up, nothing sorts, and the same monster appears five times
// because it reaches the item through five drop tables. This is that section as a table, drawn by
// DataTable: its band preview caps a long group, and its hidden anchors reach the rows the cap hides.

// A filter box earns its height over Silver Pen's 198 rows and looks like furniture over eight. The
// short tables exist because a drop row needs columns, not because the section is long.
const FILTER_MIN = 15;

// The rate may break between "1 in" and the number on a phone, where it is the only number.
const RATE = { whiteSpace: { xs: 'normal', sm: 'nowrap' } };

const rowAmount = (row) => row.edge?.meta?.quantity ?? row.edge?.meta?.amount;

// The row's entity: a real anchor, so the export carries every link; its recipe tag and drop talent beside it.
const RowName = ({ row, hrefFor, onNavigate }) => {
  const href = hrefFor?.(row.otherId);
  const label = entityName(row.other);
  const talent = dropTalentLabel(row.edge?.meta);
  return <Stack direction={'row'} gap={1} alignItems={'center'} flexWrap={'wrap'} component={'span'}>
    {row.other.navigable === false
      ? <Typography variant={'body2'} component={'span'}>{label}</Typography>
      : <Link href={href} variant={'body2'} underline={'hover'} onClick={navigateOnPlainClick(onNavigate, row.otherId, Boolean(href))}>
        {label}
      </Link>}
    {row.edge?.meta?.recipe ? <TagLine tags={['Recipe']}/> : null}
    {talent ? <Typography variant={'caption'} color={'text.secondary'}>{talent}</Typography> : null}
  </Stack>;
};

// A section arrives as one or more groups: a monster's drops come pre-split into the game's drop
// tables, everything else is a single unlabelled group. Groups become bands inside ONE table rather
// than a table each, which is what lets a monster's 16 drops across 3 tiers read as one sorted thing
// instead of three short lists that each miss the threshold.
const RelationTable = ({ groups, index, onNavigate, hrefFor, showChance }) => {
  const [filter, setFilter] = useState('');

  const named = groups.map((group) => ({
    ...group,
    // Best odds first when there are odds to sort by, the game's order or the name otherwise (orderRows). A rate
    // column nobody ordered is just a column: the reason to tabulate is to see which row to act on.
    rows: orderRows(group.rows.map((row) => ({ ...row, other: index.byId[row.otherId] })).filter((row) => row.other), showChance)
  }));

  const needle = filter.trim().toLowerCase();
  const filtered = named
    .map((group) => ({
      ...group,
      rows: needle ? group.rows.filter((row) => entityName(row.other).toLowerCase().includes(needle)) : group.rows
    }))
    .filter((group) => group.rows.length > 0);

  const total = filtered.reduce((sum, group) => sum + group.rows.length, 0);

  // Only worth a column when at least one row actually merged several drop tables; on a section
  // where every row is a single path it would be a column of ones.
  const anyMerged = named.some((group) => group.rows.some((row) => row.paths > 1));
  // Same rule for quantity: most sections drop one of a thing, and a column of blanks is worse
  // than no column. Coins always earn it, since their amount IS the interesting part.
  const anyQuantity = named.some((group) => group.rows.some((row) => rowAmount(row) > 1 || isCoin(row.other)));
  // Only the shop sections carry a price, and there every row has one.
  const anyPrice = named.some((group) => group.rows.some((row) => row.edge?.meta?.price > 0));

  // Counted before filtering, so typing cannot make the box that is being typed into disappear.
  const searchable = named.reduce((sum, group) => sum + group.rows.length, 0) >= FILTER_MIN;

  const columns = [
    {
      key: 'name',
      label: 'Name',
      value: (row) => entityName(row.other),
      icon: (row) => <EntityIcon node={row.other} size={32}/>,
      render: (row) => <RowName row={row} hrefFor={hrefFor} onNavigate={onNavigate}/>
    },
    ...(anyQuantity ? [{
      key: 'qty',
      label: 'Qty',
      numeric: true,
      render: (row) => (isCoin(row.other)
        ? <Stack direction={'row'} justifyContent={'flex-end'} component={'span'}><CoinAmount amount={rowAmount(row)} size={16}/></Stack>
        : <Typography variant={'caption'} color={'text.secondary'}>{rowAmount(row) > 1 ? notateAmount(rowAmount(row)) : ''}</Typography>)
    }] : []),
    // A shop's price is what a phone keeps beside the name.
    ...(anyPrice ? [{
      key: 'price',
      label: 'Price',
      numeric: true,
      phone: true,
      render: (row) => <Stack direction={'row'} justifyContent={'flex-end'} component={'span'}>
        <Price price={row.edge?.meta?.price} currency={row.edge?.meta?.currency} size={16}/>
      </Stack>
    }] : []),
    ...(anyMerged ? [{
      key: 'tables',
      label: 'Tables',
      numeric: true,
      info: 'How many separate drop tables reach it. Each is its own roll.',
      render: (row) => <Typography variant={'caption'} color={row.paths > 1 ? 'text.primary' : 'text.muted'}>{row.paths}</Typography>
    }] : []),
    // Below sm this is the only number, so a chance that would round to "1 in 1" prints as itself.
    ...(showChance ? [{
      key: 'rate',
      label: anyMerged ? 'Per kill' : 'Rate',
      numeric: true,
      phone: true,
      cellSx: RATE,
      info: anyMerged ? 'The chance per kill of getting it from any of its tables, not from one of them.' : undefined,
      render: (row) => <Typography variant={'caption'} color={'text.secondary'}>
        {oneInOrNothing(row.combinedChance) || percentLabel(row.combinedChance)}
      </Typography>
    }, {
      // The odds twice, deliberately: "1 in 618" is what a player quotes, a percentage is what the game's own drop
      // tables are written in, and neither converts in the head. Below sm it goes: it repeats the rate beside it
      // (DataTable shows the column after the phone's from sm).
      key: 'chance',
      label: 'Chance',
      numeric: true,
      render: (row) => <Typography variant={'caption'} color={'text.muted'}>{percentLabel(row.combinedChance)}</Typography>
    }] : [])
  ];

  return <Stack gap={1} sx={{ mt: 1 }}>
    {searchable ? <Stack direction={'row'} gap={1} alignItems={'center'} flexWrap={'wrap'}>
      <TextField
        size={'small'}
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        label={'Filter'}
        sx={{ width: 240 }}
      />
      <Typography variant={'caption'} color={'text.secondary'}>{formatNum(total, 'amount')} total</Typography>
    </Stack> : null}

    <DataTable
      columns={columns}
      bands={filtered.map((group) => ({
        key: group.key,
        label: group.label || null,
        meta: group.odds ? `table rolls ${group.odds}` : null,
        rows: group.rows
      }))}
      rowKey={'key'}
      rowLabel={(row) => entityName(row.other)}
      // Rows past a band's preview render nothing, so these anchors are a crawler's only path to them.
      linkOf={(row) => {
        const href = hrefFor?.(row.otherId);
        return href && row.other.navigable !== false ? { href, label: entityName(row.other) } : null;
      }}
    />
  </Stack>;
};

export default RelationTable;
