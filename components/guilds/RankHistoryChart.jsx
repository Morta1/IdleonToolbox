import { useTheme } from '@mui/material';
import { format } from 'date-fns';
import ChartFrame from '@components/common/charts/ChartFrame';
import LineChart from '@components/common/charts/LineChart';
import Notice from '@components/common/Notice';
import { rankText } from '@components/leaderboards/format';
import useFormatDate from '@hooks/useFormatDate';
import { labelIndexes, valueTicks } from '@utility/chartScale';
import { seriesColors } from '@utility/chartTheme';
import { transformRankHistory } from './rankHistory';

export default function RankHistoryChart({ rankHistory }) {
  const { mode } = useTheme().palette;
  // The player's date and time preference.
  const formatDate = useFormatDate();
  const data = transformRankHistory(rankHistory).map((point) => ({ x: point.ts, y: point.y }));

  if (data.length === 0) return <Notice tone={'info'}>No rank history yet.</Notice>;

  const ranks = data.map((point) => point.y);
  const ticks = valueTicks(Math.min(...ranks), Math.max(...ranks), { integer: true });
  // No rank above #1: the axis starts there.
  const axis = { min: Math.max(1, ticks.min), max: ticks.max, ticks: ticks.ticks.filter((tick) => tick >= 1) };
  const when = (ms) => formatDate(ms, { showSeconds: false });

  return <ChartFrame table={{
    rows: data,
    rowKey: 'x',
    rowLabel: (row) => when(row.x),
    columns: [
      { key: 'x', label: 'Date', render: (row) => when(row.x) },
      { key: 'y', label: 'Rank', numeric: true, phone: true, render: (row) => rankText(row.y) }
    ]
  }}>
    <LineChart label={'Rank history'} series={[{ id: 'Rank', label: 'Rank', color: seriesColors(mode)[0], data }]}
               reverse axis={axis} formatTick={rankText} formatValue={rankText}
               xTicks={labelIndexes(data.length, 4).map((i) => data[i].x)} formatX={(x) => format(new Date(x), 'MMM d')}
               tooltipTitle={when}/>
  </ChartFrame>;
}
