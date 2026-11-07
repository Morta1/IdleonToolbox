import React from 'react';
import { Typography } from '@mui/material';
import { notateNumber } from '@utility/helpers';

// Typed values need a ceiling: totals are summed one level at a time and some upgrades (Royal
// Armory past 999, Menagerie boosts) have no cap.
export const MAX_LEVELS_AHEAD = 1000;

// Far enough ahead, some cost curves (Compass within a few hundred levels) sum past the largest
// number JS can hold, and notateNumber renders Infinity as "NaNEInfinity".
export const formatLevelsAheadCost = (cost) => Number.isFinite(cost) ? notateNumber(cost, 'Big') : '∞';

// The "Lv N: cost" line under a card's cost row, for when the picker reaches past the next level. Like ItemCard.Cost
// above it: green when the owned amount covers it, amber and "need X more" when not, so it never rests on color alone.
// indent lines it up with the cost text, past the currency icon.
export const LevelsAheadCaption = ({ targetLevel, targetCost, owned, format = formatLevelsAheadCost, indent = 44 }) => {
  const short = owned < targetCost;
  return <Typography variant="caption" color="text.secondary" sx={{ pl: `${indent}px` }}>
    {'Lv '}{targetLevel}{': '}
    <Typography component="span" variant="caption" fontWeight={600} color={short ? 'text.warning' : 'text.success'}>
      {Number.isFinite(targetCost) ? format(targetCost) : '∞'}
    </Typography>
    {short ? <>{' · need '}{Number.isFinite(targetCost) ? format(targetCost - owned) : '∞'}{' more'}</> : null}
  </Typography>;
};
