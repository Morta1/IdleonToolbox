import React from 'react';
import { Box } from '@mui/material';
import { formatDuration, formatNum } from '@utility/helpers';

// Same-width digits, so 1.48T and 56.3M line up down a column (Numbers board, "Lining up").
const NUMBER_SX = { fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' };

// A number a page prints, by its kind (formatNum). The text inherits its size and color from where it sits.
const Num = ({ value, kind = 'amount', signed, precise, max, next, per }) => (
  <Box component="span" sx={NUMBER_SX}>{formatNum(value, kind, { signed, precise, max, next, per })}</Box>
);

// Time left in seconds: two units, Ready at zero.
export const Duration = ({ seconds }) => <Box component="span" sx={NUMBER_SX}>{formatDuration(seconds)}</Box>;

export default Num;
