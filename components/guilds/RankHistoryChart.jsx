import { ResponsiveLine } from '@nivo/line';
import { Box, Typography, useTheme } from '@mui/material';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDateShort(ms) {
  const d = new Date(ms);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

function formatDateTime(ms) {
  const d = new Date(ms);
  const hour = d.getHours();
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${hour12}${period}`;
}

export function transformRankHistory(rankHistory) {
  if (!rankHistory) return [];
  return rankHistory
    .filter(p => p?.rank != null && p?.captured_at != null)
    .map(p => ({ x: new Date(p.captured_at), y: p.rank, ts: p.captured_at }));
}

export default function RankHistoryChart({ rankHistory }) {
  const muiTheme = useTheme();
  const data = transformRankHistory(rankHistory);

  if (data.length === 0) {
    return (
      <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="text.secondary">No rank history yet.</Typography>
      </Box>
    );
  }

  const ranks = data.map(p => p.y);
  const minRank = Math.min(...ranks);
  const maxRank = Math.max(...ranks);
  // Pad by ~1 rank on each side so the line isn't pinned to the edges.
  // Floor at 1 (no rank below 1). Guarantee a minimum span so a flat-line
  // chart doesn't render a dozen duplicate "#1" tick labels.
  const yMin = Math.max(1, minRank - 1);
  const yMax = Math.max(maxRank + 1, yMin + 4);

  // Explicit integer tick values — ranks are whole numbers, so let Nivo know.
  const yTicks = [];
  for (let v = yMin; v <= yMax; v++) yTicks.push(v);

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
    crosshair: { line: { stroke: muiTheme.palette.text.secondary } }
  };

  return (
    <Box sx={{ height: 200 }}>
      <ResponsiveLine
        data={[{ id: 'Rank', data }]}
        theme={nivoTheme}
        colors={[muiTheme.palette.primary.main]}
        margin={{ top: 16, right: 24, bottom: 32, left: 48 }}
        xScale={{ type: 'time', precision: 'hour' }}
        xFormat="time:%b %d, %I%p"
        yScale={{ type: 'linear', min: yMin, max: yMax, reverse: true }}
        axisBottom={{
          format: (v) => formatDateShort(v),
          tickValues: 6
        }}
        axisLeft={{
          tickValues: yTicks,
          format: (v) => `#${Math.round(v)}`
        }}
        gridYValues={yTicks}
        enablePoints={data.length <= 30}
        pointSize={5}
        curve="monotoneX"
        useMesh
        enableGridX={false}
        tooltip={({ point }) => (
          <Box sx={{
            bgcolor: 'background.paper',
            color: 'text.primary',
            border: 1,
            borderColor: 'divider',
            px: 1.5, py: 1,
            minWidth: 140,
            borderRadius: 1,
            fontSize: 13,
            boxShadow: 3
          }}>
            <Box sx={{ color: 'text.secondary' }}>{formatDateTime(point.data.ts)}</Box>
            <Box sx={{ fontWeight: 600 }}>Rank #{point.data.y}</Box>
          </Box>
        )}
      />
    </Box>
  );
}
