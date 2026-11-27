import { Box, Stack, useTheme } from '@mui/material';
import GameIcon from '@components/common/GameIcon';
import ChartFrame from '@components/common/charts/ChartFrame';
import ColumnChart from '@components/common/charts/ColumnChart';
import RankBars from '@components/common/charts/RankBars';
import Num from '@components/common/Num';
import { seriesColors } from '@utility/chartTheme';
import { chartNum, foldOther } from '@utility/chartScale';
import { formatNum } from '@utility/helpers';
import { OTHER_PART } from './charts';

// A share shows this many parts before the rest folds into Other; a list of shares of the whole count (prayers, each
// a share of every character) shows this many, highest first.
const SHARE_ROWS = 10;
const PCT_ROWS = 15;

const pct = (value) => formatNum(value, 'pct', { decimals: 1 });

// Highest first; the tip and the tooltip print the same text. A share's tip is its percent, and its tooltip the count
// and the percent. per: the count a 'pct' row is a share of (characters or players).
const barRows = (config, raw, per) => {
  const rows = config.rows(raw).filter((row) => row.value > 0).toSorted((a, b) => b.value - a.value);
  if (config.form === 'rank') return rows.slice(0, PCT_ROWS).map((row) => ({ ...row, tip: chartNum(row.value), detail: formatNum(row.value) }));
  if (config.form === 'pct') {
    return rows.slice(0, PCT_ROWS).map((row) => {
      const share = per ? (row.value / per) * 100 : 0;
      return { ...row, share, tip: pct(share), detail: `${formatNum(row.value)} · ${pct(share)}` };
    });
  }
  const sum = rows.reduce((total, row) => total + row.value, 0);
  return foldOther(rows, SHARE_ROWS).map((row) => {
    const share = sum ? (row.value / sum) * 100 : 0;
    return {
      ...row,
      name: row.other ? `Other (${row.count} ${config.otherNoun})` : row.name,
      share,
      tip: pct(share),
      detail: `${formatNum(row.value)} · ${pct(share)}`
    };
  });
};

const unitOf = (config) => config.unit ?? (/haracters$/.test(config.per) ? 'Characters' : 'Players');

const barTable = (config, rows) => ({
  rows,
  rowKey: 'key',
  rowLabel: (row) => row.name,
  columns: [
    // The row's sprite (or colour) beside its name, as the bars draw it
    {
      key: 'name', label: config.nameLabel, render: (row) => <Stack direction={'row'} alignItems={'center'} gap={1}>
        {row.icon ? <GameIcon src={row.icon} size={24} alt={''}/>
          : row.swatch ? <Box component={'span'} sx={{ width: 24, height: 24, flexShrink: 0, bgcolor: row.swatch, borderRadius: '4px', border: 1, borderColor: 'divider' }}/> : null}
        <span>{row.name}</span>
      </Stack>
    },
    ...(config.tagLabel ? [{ key: 'tag', label: config.tagLabel, render: (row) => row.tag ?? null }] : []),
    { key: 'value', label: unitOf(config), numeric: true, phone: true, render: (row) => <Num value={row.value}/> },
    // A share's bars print the percent, so a phone keeps it beside the count.
    ...(config.form !== 'rank' ? [{ key: 'share', label: 'Share', numeric: true, phone: true, render: (row) => pct(row.share) }] : [])
  ]
});

// One series: the bucket and its count. Stacked parts: a column per part, which a phone keeps (the chart draws the
// parts), then the total.
const columnTable = (config, columns, rows) => {
  const total = (row) => columns.reduce((sum, item) => sum + (row.values[item.key] ?? 0), 0);
  return {
    rows,
    rowKey: 'key',
    rowLabel: (row) => row.range,
    columns: [
      // The heading says "Slot", so a stacked table's row is its number: "Slot 1" took two lines and a column's room on a phone.
      { key: 'range', label: config.nameLabel, render: (row) => (config.form === 'stacked' ? row.label : row.range) },
      ...(columns.length === 1
        ? [{ key: columns[0].key, label: unitOf(config), numeric: true, phone: true, render: (row) => <Num value={row.values[columns[0].key]}/> }]
        : [
          // The rare part leaves room for the ones the chart is about: it opens under a row until the table has room for it.
          ...columns.map((item) => ({ key: item.key, label: item.label, numeric: true, ...(item.key === OTHER_PART ? { from: 1500 } : { phone: true }), render: (row) => <Num value={row.values[item.key] ?? 0}/> })),
          { key: 'total', label: 'Total', numeric: true, from: 1366, render: (row) => <Num value={total(row)}/> }
        ])
    ]
  };
};

// The rows a chart would draw, so the page can leave an empty chart out
export const chartRows = (config, raw, per) => (['rank', 'share', 'pct'].includes(config.form) ? barRows(config, raw, per) : config.rows(raw));

// One chart from its entry in the chart list and the band's raw rows.
const StatisticsChart = ({ config, title, rows }) => {
  const series = seriesColors(useTheme());

  if (['rank', 'share', 'pct'].includes(config.form)) {
    return <ChartFrame table={barTable(config, rows)}>
      <RankBars label={title} rows={rows}/>
    </ChartFrame>;
  }

  // A spread is one series; stacked parts take the series slots in order, never cycled. A part no row holds draws nothing.
  const columns = config.form === 'stacked'
    ? config.series.map((name, i) => ({ key: name, label: name, color: series[i] })).filter(({ key }) => rows.some((row) => row.values[key]))
    : [{ key: 'count', label: unitOf(config), color: series[0] }];
  return <ChartFrame legend={columns.map(({ label, color }) => ({ label, color }))} table={columnTable(config, columns, rows)}>
    <ColumnChart label={title} series={columns} rows={rows}/>
  </ChartFrame>;
};

export default StatisticsChart;
