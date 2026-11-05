// components/guilds/WeeklyProgressChart.jsx
import { Typography, useTheme } from '@mui/material';
import { addDays, format, startOfDay } from 'date-fns';
import ChartFrame from '@components/common/charts/ChartFrame';
import LineChart from '@components/common/charts/LineChart';
import Notice from '@components/common/Notice';
import Num from '@components/common/Num';
import useFormatDate from '@hooks/useFormatDate';
import { seriesColors } from '@utility/chartTheme';

// The reporting week runs Saturday 21:00 UTC to the next Saturday 21:00 UTC. The chart reads the visitor's clock: x is
// hours into this guild week, and every day's name marks that day's midnight where the visitor is.
const dayTicks = (weekStart) => Array.from({ length: 7 }, (_, day) => {
  const midnight = startOfDay(addDays(new Date(weekStart), day + 1));
  return { x: (midnight.getTime() - weekStart) / HOUR_MS, name: format(midnight, 'EEE') };
});

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

export default function WeeklyProgressChart({ detail }) {
  const theme = useTheme();
  const formatDate = useFormatDate();
  const [thisWeek, lastWeek] = transformForChart(detail);
  const series = [
    { ...thisWeek, label: 'This week', color: seriesColors(theme.palette.mode)[0] },
    // The earlier period in grey behind it (Charts board, "Change over time").
    { ...lastWeek, label: 'Last week', color: theme.palette.text.muted }
  ].filter((item) => item.data.length > 0);
  if (series.length === 0) return <Notice tone={'info'}>No hourly snapshots yet: the chart fills in as they arrive.</Notice>;
  // Last week's hours land on this week's clock: the chart compares the same hour of the week.
  const firstThis = detail.current_week?.timeseries?.[0]?.captured_at;
  const weekStart = firstThis != null ? weekStartMs(firstThis) : weekStartMs(detail.last_week?.timeseries?.[0]?.captured_at) + WEEK_MS;
  const ticks = dayTicks(weekStart);
  const hourLabel = (x) => {
    const date = weekStart + x * HOUR_MS;
    return `${format(date, 'EEE')} ${formatDate(date, { timeOnly: true, showSeconds: false })}`;
  };
  const hours = [...new Set(series.flatMap((item) => item.data.map((point) => point.x)))].toSorted((a, b) => a - b);
  const at = (week, x) => week.data.find((point) => point.x === x)?.y ?? null;
  return <><ChartFrame
    legend={series.map(({ label, color }) => ({ label, color, mark: 'line' }))}
    table={{
      rows: hours.map((x) => ({ x, thisWeek: at(thisWeek, x), lastWeek: at(lastWeek, x) })),
      rowKey: 'x',
      rowLabel: (row) => hourLabel(row.x),
      columns: [
        { key: 'x', label: 'Time', render: (row) => hourLabel(row.x) },
        { key: 'thisWeek', label: 'This week', numeric: true, phone: true, render: (row) => (row.thisWeek == null ? null : <Num value={row.thisWeek}/>) },
        // Both weeks on a phone too: the chart compares them.
        { key: 'lastWeek', label: 'Last week', numeric: true, phone: true, render: (row) => (row.lastWeek == null ? null : <Num value={row.lastWeek}/>) }
      ]
    }}
  >
    <LineChart label="This week's progress" series={series} xDomain={{ min: 0, max: 168 }}
               xTicks={ticks.map(({ x }) => x)} formatX={(x) => ticks.find((tick) => tick.x === x)?.name ?? ''}
               tooltipTitle={hourLabel}/>
  </ChartFrame>
    <Typography variant={'caption'} color={'text.secondary'} component={'p'} sx={{ mt: 1 }}>The guild week resets Saturday 21:00 UTC.</Typography>
  </>;
}
