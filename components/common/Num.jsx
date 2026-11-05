import React from 'react';
import { Box } from '@mui/material';
import { formatDuration, formatNum } from '@utility/helpers';
import { formatGame, formatSystem } from '@utility/gameNotation';
import StatusText from '@components/common/StatusText';

// Same-width digits, so 1.48T and 56.3M line up down a column (Numbers board, "Lining up").
const NUMBER_SX = { fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' };

// A number by its kind (formatNum), or, with `game`, by the game's own rule for that stat, or, with `system`, a
// system's own mode for its keyless amounts (SYSTEM_MODES). The game draws its units outside the notation, so a lane A
// number takes its unit from the page: <Num value={lootMulti} game="Sailing.LootMulti" unit="x"/>. whole: a cost, a
// requirement or a count, which never shows a fraction (notes above formatNum).
// The text inherits its size and color from where it sits. Every other prop is a formatNum option, passed on whole
// (as DataTable passes a column's format), so a <Num> and a table cell with the same options read the same.
const Num = ({ value, kind = 'amount', game, system, unit = '', whole = false, ...options }) => {
  const gameText = game ? formatGame(value, game, { whole }) : null;
  const text = game ? (gameText === '-' ? gameText : `${gameText}${unit}`)
    : system ? formatSystem(value, kind, system, options) : formatNum(value, whole ? 'whole' : kind, options);
  return <Box component="span" sx={NUMBER_SX}>{text}</Box>;
};

// A card row's or a tile's value: a kind prints by its kind, { game, unit, whole } by the game's rule, anything else as it comes.
export const numOrNode = (value, how) => (typeof value !== 'number' || !how ? value
  : typeof how === 'string' ? <Num value={value} kind={how}/> : <Num value={value} {...how}/>);

// Time left in seconds: two units, and at zero the Ready state.
export const Duration = ({ seconds }) => seconds <= 0
  ? <StatusText status={'ready'}/>
  : <Box component="span" sx={NUMBER_SX}>{formatDuration(seconds)}</Box>;

export default Num;
