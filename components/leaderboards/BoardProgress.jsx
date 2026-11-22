import { Stack, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import RankDelta from '@components/common/RankDelta';
import useRankHistory, { useBoardHistory } from '@hooks/useRankHistory';
import { formatChange, formatMetricValue, rankText } from './format';
import RankChart, { MIN_POINTS } from './RankChart';
import { ExactValue } from './RankRow';
import useWhen from './useWhen';

// The player's rank and value on one board on each recorded day ([recorded at, rank, value], oldest first), then where
// they stand now once a later run has ranked them again.
export const boardPoints = (series, nowAt, entry) => {
  const points = (series ?? []).map(([x, y, value]) => ({ x, y, value }));
  if (entry?.r && nowAt > (points.at(-1)?.x ?? 0)) points.push({ x: nowAt, y: entry.r, value: entry.v });
  return points;
};

const CHANGE_SX = { ml: 'auto', fontWeight: 500, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' };

// The signed-in player's own line on the opened board: the move against the standing the Overview compares with (range,
// or its default), then the rank on every recorded day. entry: their /player entry for the board ({ r, v }).
const BoardProgress = ({ name, metricKey, meta, entry, standingAt, range = null, heading }) => {
  const when = useWhen();
  const board = useBoardHistory(name, metricKey);
  const history = useRankHistory(name, range);
  if (!entry?.r || !board.data || board.data.tracked === false) return null;
  const points = boardPoints(board.data.series, standingAt, entry);
  if (!points.length) return null;
  const snapshot = history.data?.snapshot ?? null;
  const past = snapshot?.ranks?.[metricKey] ?? null;
  const since = snapshot ? (range ? `in ${range} days` : `since ${when(snapshot.at)}`) : '';
  const delta = past ? past[0] - entry.r : 0;
  const change = past ? formatChange(meta.notation, past[1], entry.v, { scale: meta.top }) : null;
  return <Box sx={{ pb: 2, mb: 0.25, borderBottom: 1, borderColor: 'divider' }}>
    {heading}
    <Box sx={{ px: 2.5 }}>
      {past ? <>
        <Stack direction="row" alignItems="baseline" columnGap={1.25} flexWrap="wrap">
          <Typography component="p" variant="heroValue">{rankText(entry.r)}</Typography>
          {delta ? <Typography variant="body1" component="span"><RankDelta delta={delta}/></Typography> : null}
          {change ? <Box component="span" sx={{ color: change.better ? 'text.success' : 'text.error', ...CHANGE_SX }}>
            <ExactValue text={change.text} exact={change.exact}/>
          </Box> : null}
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {delta ? `${rankText(past[0])} to ${rankText(entry.r)} ${since}` : `No change ${since}`}
        </Typography>
      </> : <Typography variant="body2">Tracking started {when(points[0].x, { time: false })}.</Typography>}
      {points.length >= MIN_POINTS
        ? <Box sx={{ mt: 1.5 }}>
          <RankChart points={points} label={`Your rank on ${meta.label} over time`} seriesLabel="Rank"
                     renderValue={(row) => formatMetricValue(meta.notation, row.value, { scale: meta.top })}/>
        </Box>
        : <Typography variant="body2" color="text.secondary" sx={{ mt: past ? 1 : 0.25 }}>A chart shows after 3 days of uploads.</Typography>}
    </Box>
  </Box>;
};

export default BoardProgress;
