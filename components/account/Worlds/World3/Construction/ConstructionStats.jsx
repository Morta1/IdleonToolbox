import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { notateNumber } from '@utility/helpers';

// These are the same three totals the game prints on the construction board itself.
const ROWS = [
  { key: 'totalBuildRate', label: 'Build rate' },
  { key: 'totalPlayerExpRate', label: 'Player XP rate' },
  { key: 'totalFlaggyRate', label: 'Flaggy rate' }
];

const Unit = ({ children }) => <Box component={'span'} sx={{ fontSize: '0.65em', color: 'text.secondary' }}>
  {children}
</Box>;

/**
 * One stat per cell, all the same shape: what the number is, what it becomes, and what it gains.
 * The value you end up with leads, because after optimizing that is the number being read - where it
 * came from is context and goes in the smaller line under it.
 */
const StatBlock = ({ label, current, optimized, suffix = '/HR' }) => {
  const value = optimized ?? current;
  const delta = optimized == null ? null : optimized - current;
  return <Stack gap={0.25} sx={{ minWidth: 0, pl: 2, borderLeft: '1px solid', borderColor: 'divider' }}>
    <Typography variant={'caption'} noWrap sx={{ color: 'text.secondary' }}>{label}</Typography>
    <Typography variant={'h6'} noWrap sx={{
      lineHeight: 1.25,
      color: optimized == null ? 'text.primary' : 'info.light'
    }}>
      {notateNumber(value)}<Unit>{suffix}</Unit>
    </Typography>
    {delta == null ? null : <Typography variant={'caption'} noWrap
                                        sx={{ color: delta >= 0 ? 'success.light' : 'error.light' }}>
      {/* notateNumber is a port of the game's own function, which only ever sees magnitudes - hand it
          one and put the sign back here, or a drop prints as raw digits. */}
      {delta >= 0 ? '+' : '-'}{notateNumber(Math.abs(delta))}
      <Box component={'span'} sx={{ color: 'text.secondary' }}> from {notateNumber(current)}</Box>
    </Typography>}
  </Stack>;
};

// A grid rather than a wrapping row: the columns come out equal and even, instead of three wide cells
// and a fourth orphaned onto a line of its own.
// Every cell carries its own left rule, and the grid is pulled left by exactly that rule plus its
// padding so the leading one falls outside and is clipped. That way the rule lands between columns on
// every row no matter how many columns the grid settles on, and the first column still lines up with
// everything else in the card.
const RULE_OFFSET = '-17px';

const ConstructionStats = ({ construction, optimized }) => <Box sx={{ overflow: 'hidden' }}>
  <Box sx={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(136px, 1fr))',
    rowGap: 2,
    ml: RULE_OFFSET
  }}>
    {ROWS.map(({ key, label }) => <StatBlock key={key}
                                             label={label}
                                             current={construction?.[key]}
                                             optimized={optimized?.[key]}/>)}
    <StatBlock label={'Player XP bonus'} current={construction?.totalExpRate} suffix={'%'}/>
  </Box>
</Box>;

export default ConstructionStats;
