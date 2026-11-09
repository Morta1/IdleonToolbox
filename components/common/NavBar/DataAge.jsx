import { Box, Typography } from '@mui/material';
import useNow from '@hooks/useNow';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const UNITS = [[365 * DAY, 'year'], [30 * DAY, 'month'], [7 * DAY, 'week'], [DAY, 'day']];

// When the game last saved the data. state.savedAt is Firestore's commit time for the cloud save (the game writes no
// time of its own with it). A profile or a pasted save has none, so they fall back on TimeAway.GlobalTime, the
// game's clock at the save (server time at login, then ticked locally). state.lastUpdated is when the toolbox
// received the data, a fresh "now" on every load and live update, so it only stands in when both are missing.
export const getSavedAt = (state) => {
  if (state?.savedAt > 0) return state.savedAt;
  const gameTime = state?.account?.timeAway?.GlobalTime;
  return Number.isFinite(gameTime) ? gameTime * 1000 : state?.lastUpdated;
};

// How old the data is, in its largest whole unit
export const dataAge = (time, now) => {
  const age = now - time;
  if (age < MINUTE) return 'just now';
  if (age < HOUR) return `${Math.floor(age / MINUTE)} min ago`;
  if (age < DAY) return `${Math.floor(age / HOUR)} h ago`;
  const [unit, name] = UNITS.find(([size]) => age >= size);
  const count = Math.floor(age / unit);
  return `${count} ${name}${count === 1 ? '' : 's'} ago`;
};

// The widest the line gets, held in the same cell so the bar never moves as the minutes tick
export const WIDEST = 'Updated 00 months ago';
const CELL_SX = { gridArea: '1 / 1', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };

// The bar's line under the name: how old the data is, live (the exact time is in the account menu). It mounts only once
// a save has loaded, after hydration, so the clock's real reading is its first.
const DataAge = ({ time }) => {
  const now = useNow(30 * 1000);
  return <Typography variant={'caption'} sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)' }}>
    <Box component={'span'} sx={CELL_SX}>Updated {dataAge(time, now)}</Box>
    <Box component={'span'} aria-hidden sx={{ ...CELL_SX, visibility: 'hidden' }}>{WIDEST}</Box>
  </Typography>;
};

export default DataAge;
