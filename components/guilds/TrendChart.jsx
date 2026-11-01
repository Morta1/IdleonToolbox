// components/guilds/TrendChart.jsx
import { Box, Typography, useTheme } from '@mui/material';
import { format } from 'date-fns';
import ChartFrame from '@components/common/charts/ChartFrame';
import LineChart from '@components/common/charts/LineChart';
import Num from '@components/common/Num';
import { labelIndexes } from '@utility/chartScale';
import { seriesColors } from '@utility/chartTheme';

const DAY_MS = 24 * 3600 * 1000;

// Month names, so no date preference applies.
const dayLabel = (x) => format(new Date(x), 'MMM d');

// `values` is GP gained per day (oldest to newest), the same series the
// leaderboard sparkline plots: it excludes the partial current day, so the
// last point is "yesterday". Each point's date is derived by counting back from
// the start of the latest tick's UTC day (matching how the worker buckets days).
// This assumes one point per consecutive day, as the sparkline does; for the
// hourly-snapshotted cohort every day has data so the dates line up.
export default function TrendChart({ values, lastUpdatedMs }) {
  const { mode } = useTheme().palette;

  if (!values || values.length < 2) {
    return (
      <Box sx={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="text.secondary">
          No daily snapshots yet: the chart fills in as they arrive.
        </Typography>
      </Box>
    );
  }

  const startOfToday = Math.floor((lastUpdatedMs ?? Date.now()) / DAY_MS) * DAY_MS;
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
               series={[{ id: 'Daily GP', label: 'GP gained', color: seriesColors(mode)[0], data }]}
               xTicks={labelIndexes(n, 4).map((i) => data[i].x)} formatX={dayLabel} tooltipTitle={dayLabel}/>
  </ChartFrame>;
}
