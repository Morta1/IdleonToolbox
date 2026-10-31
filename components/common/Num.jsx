import React from 'react';
import { Box } from '@mui/material';
import { formatDuration, formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';

// Same-width digits, so 1.48T and 56.3M line up down a column (Numbers board, "Lining up").
const NUMBER_SX = { fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' };

// A number by its kind (formatNum), or, with `game`, by the game's own rule for that stat. The game draws its units
// outside the notation, so a lane A number takes its unit from the page: <Num value={lootMulti} game="Sailing.LootMulti" unit="x"/>.
// The text inherits its size and color from where it sits.
const Num = ({ value, kind = 'amount', game, unit = '', signed, precise, max, next, per }) => {
  const gameText = game ? formatGame(value, game) : null;
  const text = game ? (gameText === '-' ? gameText : `${gameText}${unit}`) : formatNum(value, kind, { signed, precise, max, next, per });
  return <Box component="span" sx={NUMBER_SX}>{text}</Box>;
};

// Time left in seconds: two units, Ready at zero.
export const Duration = ({ seconds }) => <Box component="span" sx={NUMBER_SX}>{formatDuration(seconds)}</Box>;

export default Num;
