import React from 'react';
import { Box } from '@mui/material';
import { notateGame } from '@utility/wiki/notate';
import Tooltip from '@components/Tooltip';
import { formatAmount } from '@utility/wiki/effects.mjs';

// From a million up the digits stop being comparable at a glance, so an amount reads in the game's own notation
// ("45.5M", ceil-based like the game's) under a dotted underline whose tooltip is the exact amount.
const SHORT_FROM = 1e6;
// Exact digits only while they are exact: past 2^53 a float's digits are noise, so the tooltip goes scientific.
const EXACT_BELOW = Number.MAX_SAFE_INTEGER;
const exactText = (amount) => (Math.abs(amount) < EXACT_BELOW
  ? Math.round(amount).toLocaleString('en-US')
  : amount.toExponential(3).replace('e+', 'e'));

const ShortAmount = ({ amount }) => {
  const short = Number.isFinite(amount) && Math.abs(amount) >= SHORT_FROM ? notateGame(amount) : null;
  if (!short) return formatAmount(amount);
  return <Tooltip title={exactText(amount)}>
    {/* Focusable, so a keyboard reaches the exact amount the way a pointer does. */}
    <Box component={'span'} tabIndex={0} sx={{ textDecoration: 'underline dotted', textUnderlineOffset: 3, cursor: 'help' }}>{short}</Box>
  </Tooltip>;
};

export default ShortAmount;
