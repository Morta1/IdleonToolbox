import { useTheme } from '@mui/material';
import ChartFrame from '@components/common/charts/ChartFrame';
import ColumnChart from '@components/common/charts/ColumnChart';
import RankBars from '@components/common/charts/RankBars';
import Num from '@components/common/Num';
import { seriesColors } from '@utility/chartTheme';
import { chartNum, foldOther } from '@utility/chartScale';
import { formatNum } from '@utility/helpers';

// A share shows this many parts before the rest folds into Other (Decision 6).
const SHARE_ROWS = 10;

// Highest first; the tip and the tooltip print the same text (Decision 3). A share's tip is its percent, and its
// tooltip the count and the percent.
const barRows = (config, raw) => {
  const rows = config.rows(raw).toSorted((a, b) => b.value - a.value);
  if (config.form !== 'share') return rows.map((row) => ({ ...row, tip: chartNum(row.value), detail: formatNum(row.value) }));
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  return foldOther(rows, SHARE_ROWS).map((row) => {
    const share = total ? (row.value / total) * 100 : 0;
    return {
      ...row,
      name: row.other ? `Other (${row.count} ${config.otherNoun})` : row.name,
      share,
      tip: formatNum(share, 'pct'),
      detail: `${formatNum(row.value)} · ${formatNum(share, 'pct')}`
    };
  });
};

const barTable = (config, rows) => ({
  rows,
  rowKey: 'key',
  rowLabel: (row) => row.name,
  columns: [
    { key: 'name', label: config.nameLabel, render: (row) => row.name },
    ...(config.tagLabel ? [{ key: 'tag', label: config.tagLabel, render: (row) => row.tag ?? null }] : []),
    { key: 'value', label: config.unit, numeric: true, phone: true, render: (row) => <Num value={row.value}/> },
    ...(config.form === 'share' ? [{ key: 'share', label: 'Share', numeric: true, render: (row) => <Num value={row.share} kind={'pct'}/> }] : [])
  ]
});

// One series: the bucket and its count. Stacked parts: a column per part, then the total, which a phone keeps.
const columnTable = (config, columns, rows) => {
  const total = (row) => columns.reduce((sum, item) => sum + (row.values[item.key] ?? 0), 0);
  return {
    rows,
    rowKey: 'key',
    rowLabel: (row) => row.range,
    columns: [
      { key: 'range', label: config.nameLabel, render: (row) => row.range },
      ...(columns.length === 1
        ? [{ key: columns[0].key, label: config.unit, numeric: true, phone: true, render: (row) => <Num value={row.values[columns[0].key]}/> }]
        : [
          ...columns.map((item) => ({ key: item.key, label: item.label, numeric: true, render: (row) => <Num value={row.values[item.key] ?? 0}/> })),
          { key: 'total', label: 'Total', numeric: true, phone: true, render: (row) => <Num value={total(row)}/> }
        ])
    ]
  };
};

// One chart from its entry in the statistics map and the API's raw answer for it.
const StatisticsChart = ({ config, raw }) => {
  const series = seriesColors(useTheme().palette.mode);

  if (config.form === 'rank' || config.form === 'share') {
    const rows = barRows(config, raw);
    return <ChartFrame table={barTable(config, rows)}>
      <RankBars label={config.title} rows={rows}/>
    </ChartFrame>;
  }

  // A spread is one series; stacked parts take the series slots in order, never cycled.
  const columns = config.form === 'stacked'
    ? config.series.map((name, i) => ({ key: name, label: name, color: series[i] }))
    : [{ key: 'count', label: config.unit, color: series[0] }];
  const rows = config.rows(raw);
  return <ChartFrame legend={columns.map(({ label, color }) => ({ label, color }))} table={columnTable(config, columns, rows)}>
    <ColumnChart label={config.title} series={columns} rows={rows}/>
  </ChartFrame>;
};

export default StatisticsChart;
