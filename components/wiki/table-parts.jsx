import React from 'react';
import { Stack } from '@mui/material';
import Tooltip from '@components/Tooltip';
import InfoIcon from '@mui/icons-material/Info';

// The wiki's table styles, shared by the relation tables and the listings so the two read as one design.

export const HEAD = {
  fontSize: 12,
  lineHeight: 1.66,
  letterSpacing: '0.03333em',
  fontWeight: 500,
  textTransform: 'uppercase',
  color: 'text.secondary',
  textAlign: 'left',
  py: 1,
  // Tighter below sm, with each table's column widths, so a table fits a phone.
  px: { xs: 0.75, sm: 1.5 },
  borderBottom: '1px solid',
  borderColor: 'divider'
};

export const CELL = {
  fontSize: 14,
  lineHeight: 1.43,
  py: 0.75,
  px: { xs: 0.75, sm: 1.5 },
  borderBottom: '1px solid',
  borderColor: 'action.hover'
};

// A column heading that needs a gloss carries an info icon, never the heading text itself: a
// tooltip nobody can see is a tooltip nobody reads. A column needs one when its value is not the
// one a reader assumes it is. Right-aligned by default, for a number column; a text column passes flex-start.
export const HeadNote = ({ note, children, justifyContent = 'flex-end' }) => <Stack
  direction={'row'}
  gap={0.5}
  alignItems={'center'}
  justifyContent={justifyContent}
  component={'span'}
>
  {children}
  <Tooltip title={note}>
    <InfoIcon sx={{ fontSize: 14, cursor: 'pointer' }}/>
  </Tooltip>
</Stack>;

// Right-aligned tabular figures, so a column of rates compares by eye down the page. This is the
// thing a list of inline captions cannot do at all.
export const NUM = { ...CELL, textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' };
