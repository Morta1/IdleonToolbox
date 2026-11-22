import { useTheme } from '@mui/material';
import { format } from 'date-fns';
import ChartFrame from '@components/common/charts/ChartFrame';
import LineChart from '@components/common/charts/LineChart';
import useFormatDate from '@hooks/useFormatDate';
import { labelIndexes, valueTicks } from '@utility/chartScale';
import { seriesColors } from '@utility/chartTheme';
import { rankText } from './format';

// A line needs a shape: two points only repeat the rank change the card already shows.
export const MIN_POINTS = 3;

// The player's global rank on each day the server recorded ([recorded at, rank], oldest first), then their rank now
// once a later run has ranked them again: other players move a rank between a player's own uploads.
export const rankPoints = (series, nowAt, nowRank) => {
  const points = (series ?? []).map(([x, y]) => ({ x, y }));
  if (nowRank && nowAt > (points.at(-1)?.x ?? 0)) points.push({ x: nowAt, y: nowRank });
  return points;
};

// renderValue: a board's own value beside each rank, as a column of the table twin.
const RankChart = ({ points, label = 'Your global rank over time', seriesLabel = 'Global rank', renderValue = null }) => {
  const theme = useTheme();
  const formatDate = useFormatDate();
  const ranks = points.map((point) => point.y);
  const ticks = valueTicks(Math.min(...ranks), Math.max(...ranks), { integer: true });
  // No rank above #1: the axis starts there.
  const axis = { min: Math.max(1, ticks.min), max: ticks.max, ticks: ticks.ticks.filter((tick) => tick >= 1) };
  const when = (ms) => formatDate(ms, { showSeconds: false });
  return <ChartFrame table={{
    rows: points,
    rowKey: 'x',
    rowLabel: (row) => when(row.x),
    columns: [
      { key: 'x', label: 'Date', render: (row) => when(row.x) },
      { key: 'y', label: 'Rank', numeric: true, phone: true, render: (row) => rankText(row.y) },
      ...(renderValue ? [{ key: 'value', label: 'Value', numeric: true, phone: true, render: renderValue }] : [])
    ]
  }}>
    <LineChart label={label} series={[{ id: 'Rank', label: seriesLabel, color: seriesColors(theme)[0], data: points }]}
               reverse dots axis={axis} formatTick={rankText} formatValue={rankText} height={180}
               xTicks={labelIndexes(points.length, 4).map((i) => points[i].x)} formatX={(x) => format(new Date(x), 'MMM d')}
               tooltipTitle={when}/>
  </ChartFrame>;
};

export default RankChart;
