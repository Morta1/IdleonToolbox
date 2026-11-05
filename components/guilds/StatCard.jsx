import { Box, useTheme } from '@mui/material';
import StatTile from '@components/common/cards/StatTile';
import { formatNum } from '@utility/helpers';
import { seriesColors } from '@utility/chartTheme';
import { isFlat as neverMoved } from '@utility/chartScale';
import Sparkline from './Sparkline';

const deltaWords = (delta) => (delta === 0
  ? 'The same as last week'
  : `${formatNum(Math.abs(delta), 'whole')} ${delta > 0 ? 'more' : 'fewer'} than last week`);

// A tile on the Panel's card colour, filling its grid cell, its sparkline under the words.
const TILE_SX = { width: 'auto', height: '100%', boxSizing: 'border-box', alignItems: 'flex-start', bgcolor: 'background.default' };

// An ecosystem-level metric: its value, its change in words (the arrow and its colours went: the words carry it), a note
// on a visible i, and a sparkline drawn only when the number moved (Charts board, "One number"). delta null: no change shown.
export default function StatCard({ label, value, delta, history, caption, hint }) {
  const muiTheme = useTheme();
  const lines = [delta == null ? null : deltaWords(delta), caption].filter(Boolean);
  const moved = history?.length >= 2 && !neverMoved(history);
  return <StatTile
    label={label}
    value={formatNum(value, 'amount')}
    info={hint}
    cardSx={TILE_SX}
    sub={lines.length || moved ? <>
      {lines.map((line) => <div key={line}>{line}</div>)}
      {moved ? <Box sx={{ mt: 1 }}><Sparkline values={history} width={200} height={56} color={seriesColors(muiTheme.palette.mode)[0]}/></Box> : null}
    </> : undefined}/>;
}
