// components/guilds/WeeklyProgressChart.jsx
import { ResponsiveLine } from '@nivo/line';
import { Box, Typography, useTheme } from '@mui/material';
import { numberWithCommas } from '@utility/helpers';

// The reporting week runs Saturday 21:00 UTC → the next Saturday 21:00 UTC,
// so hour-0 of the week is Saturday 21:00 (= 21 hours into Saturday).
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
  return timeseries.map(p => ({
    x: (p.captured_at - start) / HOUR_MS,
    y: p.total_gp
  }));
}

function weekStartMs(ms) {
  return ms - ((ms - WEEK_ANCHOR_MS) % WEEK_MS);
}

function formatGp(v) {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000)     return `${(v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 1)}M`;
  if (v >= 1_000)         return `${(v / 1_000).toFixed(v >= 10_000 ? 0 : 1)}K`;
  return String(v);
}

// d3-style "nice" step: rounds a rough step to the nearest 1, 2, or 5 × 10^N.
function niceStep(roughStep) {
  if (roughStep <= 0) return 1;
  const exp = Math.floor(Math.log10(roughStep));
  const base = Math.pow(10, exp);
  const fraction = roughStep / base;
  let nice;
  if (fraction < 1.5) nice = 1;
  else if (fraction < 3) nice = 2;
  else if (fraction < 7) nice = 5;
  else nice = 10;
  return nice * base;
}

// Mirrors d3's nice() + ticks(): finds a clean step, floors min and ceils max
// to multiples of step, and enumerates the resulting tick values. Gives a
// tight zoom on the data (no forced 0-anchor) like poe.ninja's chart.
function computeNiceAxis(dataMin, dataMax, tickCount = 5) {
  if (dataMin === dataMax) {
    const pad = Math.max(1, Math.abs(dataMax) * 0.05);
    return { yMin: dataMin - pad, yMax: dataMax + pad, ticks: [dataMin - pad, dataMin, dataMin + pad] };
  }
  const step = niceStep((dataMax - dataMin) / tickCount);
  const yMin = Math.floor(dataMin / step) * step;
  const yMax = Math.ceil(dataMax / step) * step;
  const ticks = [];
  for (let v = yMin; v <= yMax + step * 1e-9; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
  return { yMin, yMax, ticks, step };
}

function makeGpFormatter(step, magnitude) {
  // Pick unit by magnitude, but downgrade if the step would force too many decimals.
  let divisor, suffix;
  if (magnitude >= 1_000_000 && step >= 10_000) { divisor = 1_000_000; suffix = 'M'; }
  else if (magnitude >= 1_000) { divisor = 1_000; suffix = 'K'; }
  else { divisor = 1; suffix = ''; }
  const stepInUnit = step / divisor;
  let decimals;
  if (stepInUnit >= 1) decimals = 0;
  else if (stepInUnit >= 0.1) decimals = 1;
  else if (stepInUnit >= 0.01) decimals = 2;
  else decimals = 3;
  return (v) => {
    if (v === 0) return '0';
    return `${(v / divisor).toFixed(decimals)}${suffix}`;
  };
}

export default function WeeklyProgressChart({ detail }) {
  const muiTheme = useTheme();
  const series = transformForChart(detail).filter(s => s.data.length > 0);
  const hasAnyData = series.length > 0;

  if (!hasAnyData) {
    return (
      <Box sx={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="text.secondary">
          No timeseries data yet — chart will populate as hourly snapshots accumulate.
        </Typography>
      </Box>
    );
  }

  const allY = series.flatMap(s => s.data.map(d => d.y)).filter(v => v != null);
  const dataMagnitude = Math.max(...allY.map(Math.abs));
  const { yMin, yMax, ticks: yTicks, step: yStep } = computeNiceAxis(Math.min(...allY), Math.max(...allY));
  const formatYAxis = makeGpFormatter(yStep, dataMagnitude);

  const nivoTheme = {
    text: { fill: muiTheme.palette.text.primary },
    axis: {
      ticks: {
        text: { fill: muiTheme.palette.text.secondary, fontSize: 11 },
        line: { stroke: muiTheme.palette.divider }
      },
      domain: { line: { stroke: muiTheme.palette.divider } }
    },
    grid: { line: { stroke: muiTheme.palette.divider, strokeOpacity: 0.5 } },
    legends: { text: { fill: muiTheme.palette.text.primary, fontSize: 12 } },
    crosshair: { line: { stroke: muiTheme.palette.text.secondary } },
    tooltip: {
      container: {
        background: muiTheme.palette.background.paper,
        color: muiTheme.palette.text.primary
      }
    }
  };

  // "Last week" is ghosted (de-emphasised) so "this week" reads as the primary curve.
  const seriesColor = (s) => s.id === 'This week'
    ? muiTheme.palette.primary.main
    : muiTheme.palette.text.disabled;
  const seriesLineWidth = (s) => s.id === 'This week' ? 2.5 : 1.5;

  return (
    <Box sx={{ height: 320 }}>
      <ResponsiveLine
        data={series}
        theme={nivoTheme}
        margin={{ top: 20, right: 110, bottom: 40, left: 60 }}
        xScale={{ type: 'linear', min: 0, max: 168 }}
        yScale={{ type: 'linear', min: yMin, max: yMax }}
        axisBottom={{
          // Evenly spaced across the 0-168h week; each tick marks 21:00 UTC of
          // that day (the week is anchored to Saturday 21:00 UTC).
          tickValues: [0, 24, 48, 72, 96, 120, 144, 168],
          format: (v) => ['Sat','Sun','Mon','Tue','Wed','Thu','Fri','Sat'][v / 24]
        }}
        axisLeft={{ format: formatYAxis, tickValues: yTicks }}
        gridYValues={yTicks}
        enablePoints={false}
        curve="monotoneX"
        colors={seriesColor}
        lineWidth={seriesLineWidth}
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
            <Box sx={{ color: 'text.secondary' }}>{formatHourInWeek(point.data.x)}</Box>
            <Box sx={{ fontWeight: 600 }}>{numberWithCommas(point.data.y)} GP</Box>
          </Box>
        )}
        legends={[{
          anchor: 'top-right', direction: 'column', translateX: 100,
          itemWidth: 90, itemHeight: 18, symbolSize: 12,
          itemOpacity: 1
        }]}
      />
    </Box>
  );
}
