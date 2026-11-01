import dynamic from 'next/dynamic';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import ChartFrame from '@components/common/charts/ChartFrame';
import RankBars from '@components/common/charts/RankBars';
import Num from '@components/common/Num';
import { seriesColors } from '@utility/chartTheme';
import { chartNum } from '@utility/chartScale';
import { formatNum } from '@utility/helpers';

// Not moved yet (Tasks 3 to 5): the nivo charts, as the page drew them.
const BarVisualization = dynamic(() => import('./BarVisualization'), { ssr: false });
const PieVisualization = dynamic(() => import('./PieVisualization'), { ssr: false });

// Highest first; the tip and the tooltip print the same text (Decision 3).
const barRows = (config, raw) => config.rows(raw)
  .toSorted((a, b) => b.value - a.value)
  .map((row) => ({ ...row, tip: chartNum(row.value), detail: formatNum(row.value) }));

const barTable = (config, rows) => ({
  rows,
  rowKey: 'key',
  rowLabel: (row) => row.name,
  columns: [
    { key: 'name', label: config.nameLabel, render: (row) => row.name },
    ...(config.tagLabel ? [{ key: 'tag', label: config.tagLabel, render: (row) => row.tag ?? null }] : []),
    { key: 'value', label: config.unit, numeric: true, phone: true, render: (row) => <Num value={row.value}/> }
  ]
});

// One chart from its entry in the statistics map and the API's raw answer for it.
const StatisticsChart = ({ config, raw }) => {
  const series = seriesColors(useTheme().palette.mode);
  const isMd = useMediaQuery((theme) => theme.breakpoints.down('lg'));
  const isSm = useMediaQuery((theme) => theme.breakpoints.down('sm'));

  if (config.form === 'rank') {
    const rows = barRows(config, raw);
    return <ChartFrame table={barTable(config, rows)}>
      <RankBars label={config.title} rows={rows}/>
    </ChartFrame>;
  }

  const chartData = config.getData(raw);
  if (!Array.isArray(chartData)) return null;
  const chartKeys = config.getKeys ? config.getKeys(chartData) : null;
  const label = config.props?.label || config.title;
  return <Box sx={{ height: { xs: 330, sm: 340 }, display: 'flex', flexDirection: 'column' }}>
    {config.type === 'bar' ? <BarVisualization
      keys={chartKeys || config.keys}
      data={chartData.map((item) => ({ ...item, _id: item._id, count: item.count }))}
      indexKey={'_id'}
      label={label}
      color={series[0]}
      colors={config.getColors}
      {...config.props}
    /> : null}
    {config.type === 'pie' ? <PieVisualization
      data={chartData.map((item) => ({ id: item._id, value: item.count, label: item._id, color: series[0] }))}
      colors={series}
      isMd={isMd}
      isSm={isSm}
      {...config.props}
    /> : null}
  </Box>;
};

export default StatisticsChart;
