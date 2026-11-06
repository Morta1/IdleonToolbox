// components/guilds/TrendChart.jsx
import { useTheme } from '@mui/material';
import { format } from 'date-fns';
import ChartFrame from '@components/common/charts/ChartFrame';
import LineChart from '@components/common/charts/LineChart';
import Num from '@components/common/Num';
import { labelIndexes } from '@utility/chartScale';
import { seriesColors } from '@utility/chartTheme';

const DAY_MS = 24 * 3600 * 1000;

// Month names, so no date preference applies. A point is a UTC midnight, a day as the worker counts it: its label reads
// that UTC date on any clock, or west of UTC every label names the day before.
const dayLabel = (x) => {
  const day = new Date(x);
  return format(new Date(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()), 'MMM d');
};
// With no tick in the reply yet, today is the visitor's.
const clockNow = () => Date.now();

// `values` is GP gained per day (oldest to newest), the same series the
// leaderboard sparkline plots: it excludes the partial current day, so the
// last point is "yesterday". Each point's date is derived by counting back from
// the start of the latest tick's UTC day (matching how the worker buckets days).
// This assumes one point per consecutive day, as the sparkline does; for the
// hourly-snapshotted cohort every day has data so the dates line up.
export default function TrendChart({ values, lastUpdatedMs }) {
  const theme = useTheme();

  if (!values || values.length < 2) return null;

  const startOfToday = Math.floor((lastUpdatedMs ?? clockNow()) / DAY_MS) * DAY_MS;
  const n = values.length;
  // point i is startOfToday minus (n - i) days; i = n - 1 is yesterday.
  const data = values.map((y, i) => ({ x: startOfToday - (n - i) * DAY_MS, y }));

  return <ChartFrame table={{
    rows: data,
    rowKey: 'x',
    rowLabel: (row) => dayLabel(row.x),
    columns: [
      { key: 'x', label: 'Day', render: (row) => dayLabel(row.x) },
      { key: 'y', label: 'GP gained', numeric: true, phone: true, render: (row) => (row.y == null ? null : <Num value={row.y}/>) }
    ]
  }}>
    <LineChart label={'GP gained per day'}
               series={[{ id: 'Daily GP', label: 'GP gained', color: seriesColors(theme)[0], data }]}
               xTicks={labelIndexes(n, 4).map((i) => data[i].x)} formatX={dayLabel} tooltipTitle={dayLabel}/>
  </ChartFrame>;
}
