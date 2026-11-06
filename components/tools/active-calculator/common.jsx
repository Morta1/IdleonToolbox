import { Stack, Typography } from '@mui/material';
import React from 'react';
import DataTable from '@components/common/DataTable';
import GameIcon from '@components/common/GameIcon';
import InfoButton from '@components/common/InfoButton';
import Panel from '@components/common/cards/Panel';
import { formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';

// One section of the calculator: a Panel, its note on an i, its meta a line under its title.
export const Section = ({ title, info, meta, children }) => <Panel title={title} meta={meta}
                                                                   aside={info ? <InfoButton label={title}>{info}</InfoButton> : null}>
  {children}
</Panel>;

// A labelled block of a section's own (an item grid), under the group heading.
export const SectionGroup = ({ label, children }) => <Stack gap={1} sx={{ flex: '1 1 320px', minWidth: 0 }}>
  <Typography variant={'groupLabel'} component={'h3'} color={'text.secondary'}>{label}</Typography>
  {children}
</Stack>;

// The hours from the snapshot to the last save, which every rate divides by: none until the save is the newer one.
export const elapsedHours = (lastUpdated, snapshotTime) => {
  const hours = (lastUpdated - snapshotTime) / 3600000;
  return hours > 0 ? hours : null;
};

const finite = (value) => (Number.isFinite(value) ? value : null);

// A counter's row: a number the save does not hold (a failed section, an older snapshot) reads "-", and so does what it
// feeds. kind: how its amounts read, whole by default (kills, orbs, bones). game: a balance the game has its own rule for,
// which takes the amounts' place of kind. noRate: a counter with no rate (a level).
export const counter = (label, snapshot, now, options = {}) => {
  const before = finite(snapshot);
  const after = finite(now);
  return { key: label, label, snapshot: before, now: after, gained: before !== null && after !== null ? after - before : null, ...options };
};

const inKind = (row, value) => (value === null || value === undefined ? null
  : row.game ? formatGame(value, row.game, { whole: true }) : formatNum(value, row.kind ?? 'whole'));
const gainedText = (row) => (row.gained === null || row.gained === undefined ? null
  : row.game ? inKind(row, row.gained) : formatNum(row.gained, row.kind === 'level' ? 'whole' : row.kind ?? 'whole'));
const rateText = (row, hours, per) => {
  if (row.noRate || !hours || row.gained === null || row.gained === undefined) return null;
  const perHour = row.gained / hours;
  return formatNum(per === 'min' ? perHour / 60 : per === 'day' ? perHour * 24 : perHour, 'rate', { per });
};

// A section's counters: Snapshot, Now, Gained and their rates, one number format per column's kind. resultsOnly drops the
// first two; a phone keeps Gained beside the name and opens the rest under it.
export const CounterTable = ({ rows, bands, hours, resultsOnly, perMinute }) => {
  const allRows = rows ?? bands?.flatMap((band) => band.rows) ?? [];
  const iconned = allRows.some((row) => row.icon);
  const columns = [
    {
      key: 'label', label: 'Counter', value: (row) => row.label,
      ...(iconned ? { icon: (row) => (row.icon ? <GameIcon src={row.icon} size={24} alt={''}/> : null) } : {})
    },
    ...(resultsOnly ? [] : [
      { key: 'snapshot', label: 'Snapshot', numeric: true, value: (row) => row.snapshot, render: (row) => inKind(row, row.snapshot) },
      { key: 'now', label: 'Now', numeric: true, value: (row) => row.now, render: (row) => inKind(row, row.now) }
    ]),
    { key: 'gained', label: 'Gained', numeric: true, phone: true, value: (row) => row.gained, render: gainedText },
    ...(perMinute ? [{ key: 'minute', label: 'Per min', numeric: true, render: (row) => rateText(row, hours, 'min') }] : []),
    { key: 'hour', label: 'Per hour', numeric: true, render: (row) => rateText(row, hours, 'hr') },
    { key: 'day', label: 'Per day', numeric: true, render: (row) => rateText(row, hours, 'day') }
  ];
  return <DataTable columns={columns} rows={rows} bands={bands} rowKey={'key'} rowLabel={(row) => row.label}/>;
};
