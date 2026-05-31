// components/guilds/TrendChart.jsx
import { ResponsiveLine } from '@nivo/line';
import { Box, Typography, useTheme } from '@mui/material';
import { format } from 'date-fns';
import { numberWithCommas } from '@utility/helpers';
import { buildNivoTheme, computeNiceAxis, makeGpFormatter } from './WeeklyProgressChart';

const DAY_MS = 24 * 3600 * 1000;

// `values` is GP gained per day (oldest → newest), the same series the
// leaderboard sparkline plots — it excludes the partial current day, so the
// last point is "yesterday". Each point's date is derived by counting back from
// the start of the latest tick's UTC day (matching how the worker buckets days).
// This assumes one point per consecutive day, as the sparkline does; for the
// hourly-snapshotted cohort every day has data so the dates line up.
export default function TrendChart({ values, lastUpdatedMs }) {
  const muiTheme = useTheme();

  if (!values || values.length < 2) {
    return (
      <Box sx={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="text.secondary">
          No trend data yet — chart will populate as daily snapshots accumulate.
        </Typography>
      </Box>
    );
  }

  const startOfToday = Math.floor((lastUpdatedMs ?? Date.now()) / DAY_MS) * DAY_MS;
  const n = values.length;
  // point i → startOfToday − (n − i) days; i = n−1 maps to yesterday.
  const data = values.map((y, i) => ({ x: startOfToday - (n - i) * DAY_MS, y }));

  const ys = data.map(d => d.y);
  const dataMagnitude = Math.max(1, ...ys.map(Math.abs));
  const { yMin, yMax, ticks: yTicks, step: yStep } = computeNiceAxis(Math.min(...ys), Math.max(...ys));
  const formatYAxis = makeGpFormatter(yStep, dataMagnitude);

  // ~6 evenly spaced date ticks across the series.
  const tickCount = Math.min(6, n);
  const tickValues = Array.from({ length: tickCount }, (_, k) =>
    data[Math.round((k * (n - 1)) / (tickCount - 1))].x
  );

  return (
    <Box sx={{ height: 200 }}>
      <ResponsiveLine
        data={[{ id: 'Daily GP', data }]}
        theme={buildNivoTheme(muiTheme)}
        margin={{ top: 20, right: 30, bottom: 40, left: 60 }}
        xScale={{ type: 'linear', min: 'auto', max: 'auto' }}
        yScale={{ type: 'linear', min: yMin, max: yMax }}
        axisBottom={{ tickValues, format: (v) => format(new Date(v), 'MMM d') }}
        axisLeft={{ format: formatYAxis, tickValues: yTicks }}
        gridYValues={yTicks}
        enablePoints={false}
        curve="monotoneX"
        colors={[muiTheme.palette.primary.main]}
        lineWidth={2.5}
        useMesh
        tooltip={({ point }) => (
          <Box sx={{
            bgcolor: 'background.paper',
            color: 'text.primary',
            border: 1,
            borderColor: 'divider',
            px: 1.5, py: 1,
            minWidth: 160,
            borderRadius: 1,
            fontSize: 13,
            boxShadow: 3
          }}>
            <Box sx={{ color: 'text.secondary' }}>{format(new Date(point.data.x), 'MMM d')}</Box>
            <Box sx={{ fontWeight: 600 }}>{numberWithCommas(point.data.y)} GP gained</Box>
          </Box>
        )}
      />
    </Box>
  );
}
