// components/guilds/WeeklyProgressChart.jsx
import { Box, Typography, useTheme } from '@mui/material';
import ChartFrame from '@components/common/charts/ChartFrame';
import LineChart from '@components/common/charts/LineChart';
import Num from '@components/common/Num';
import { seriesColors } from '@utility/chartTheme';

// The reporting week runs Saturday 21:00 UTC to the next Saturday 21:00 UTC,
// so hour 0 of the week is Saturday 21:00 (21 hours into Saturday).
const DAY_NAMES = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEK_START_HOUR = 21;

function formatHourInWeek(hoursInWeek) {
  const hoursFromSaturdayMidnight = WEEK_START_HOUR + hoursInWeek;
  const dayIndex = Math.min(7, Math.floor(hoursFromSaturdayMidnight / 24));
  const day = DAY_NAMES[dayIndex];
  const hourOfDay = Math.floor(hoursFromSaturdayMidnight % 24);
  const period = hourOfDay >= 12 ? 'PM' : 'AM';
  const hour12 = hourOfDay % 12 || 12;
  return `${day} ${hour12}${period} UTC`;
}

const WEEK_MS = 7 * 24 * 3600 * 1000;
const HOUR_MS = 3600 * 1000;
// Saturday 21:00 UTC is 69 hours after the Unix epoch (a Thursday 00:00 UTC).
const WEEK_ANCHOR_MS = (2 * 24 + 21) * HOUR_MS;

export function transformForChart(detail) {
  return [
    { id: 'This week', data: pointsForSeries(detail.current_week?.timeseries) },
    { id: 'Last week', data: pointsForSeries(detail.last_week?.timeseries) }
  ];
}

function pointsForSeries(timeseries) {
  if (!timeseries || timeseries.length === 0) return [];
  const start = weekStartMs(timeseries[0].captured_at);
  // Snapshots land a few seconds past the hour, so both weeks meet at one x and one tooltip lists them.
  return timeseries.map(p => ({
    x: Math.round((p.captured_at - start) / HOUR_MS),
    y: p.total_gp
  }));
}

function weekStartMs(ms) {
  return ms - ((ms - WEEK_ANCHOR_MS) % WEEK_MS);
}

// The empty state, as tall as the chart's card body was.
const EmptyChart = ({ children }) => <Box sx={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
  <Typography color="text.secondary">{children}</Typography>
</Box>;

export default function WeeklyProgressChart({ detail }) {
  const theme = useTheme();
  const [thisWeek, lastWeek] = transformForChart(detail);
  const series = [
    { ...thisWeek, label: 'This week', color: seriesColors(theme.palette.mode)[0] },
    // The earlier period in grey behind it (Charts board, "Change over time").
    { ...lastWeek, label: 'Last week', color: theme.palette.text.muted }
  ].filter((item) => item.data.length > 0);
  if (series.length === 0) return <EmptyChart>No hourly snapshots yet: the chart fills in as they arrive.</EmptyChart>;
  const hours = [...new Set(series.flatMap((item) => item.data.map((point) => point.x)))].toSorted((a, b) => a - b);
  const at = (week, x) => week.data.find((point) => point.x === x)?.y ?? null;
  return <ChartFrame
    legend={series.map(({ label, color }) => ({ label, color, mark: 'line' }))}
    table={{
      rows: hours.map((x) => ({ x, thisWeek: at(thisWeek, x), lastWeek: at(lastWeek, x) })),
      rowKey: 'x',
      rowLabel: (row) => formatHourInWeek(row.x),
      columns: [
        { key: 'x', label: 'Time', render: (row) => formatHourInWeek(row.x) },
        { key: 'thisWeek', label: 'This week', numeric: true, phone: true, render: (row) => (row.thisWeek == null ? null : <Num value={row.thisWeek}/>) },
        { key: 'lastWeek', label: 'Last week', numeric: true, render: (row) => (row.lastWeek == null ? null : <Num value={row.lastWeek}/>) }
      ]
    }}
  >
    <LineChart label="This week's progress" series={series} xDomain={{ min: 0, max: 168 }}
               xTicks={[0, 24, 48, 72, 96, 120, 144, 168]} formatX={(x) => DAY_NAMES[x / 24]}
               tooltipTitle={formatHourInWeek}/>
  </ChartFrame>;
}
