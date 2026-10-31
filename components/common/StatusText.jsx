import { Typography } from '@mui/material';
import { IconCheck } from '@tabler/icons-react';
import { NOTICE_TONES } from '@components/common/Notice';

// Controls board, Status text: a state is a glyph and a word in its color, never a chip and never
// color alone. children replace the default word ("Purchased", "12 unspent"); the look stays.
// needs, locked and problem take Notice's glyph and color for the same tone (2c Decision 6), so a
// state never looks different from a notice of its tone.
const STATUS = {
  maxed: { color: 'text.success', glyph: <IconCheck size={14} stroke={3}/>, word: 'Maxed' },
  ready: { color: 'text.success', glyph: '●', word: 'Ready' },
  active: { color: 'text.success', glyph: '●', word: 'Active' },
  needs: { color: NOTICE_TONES.missing.color, glyph: <NOTICE_TONES.missing.Glyph size={14} stroke={2.2}/> },
  locked: { color: NOTICE_TONES.locked.color, glyph: <NOTICE_TONES.locked.Glyph size={14} stroke={2.2}/>, word: 'Locked' },
  problem: { color: NOTICE_TONES.error.color, glyph: <NOTICE_TONES.error.Glyph size={14} stroke={2.2}/> },
  selected: { color: 'primary.main' }
};

const StatusText = ({ status, children, wrap }) => {
  const { color, glyph, word } = STATUS[status] ?? {};
  const label = children ?? word;
  if (label === undefined || label === null || label === '') return null;
  return <Typography component={'span'} variant={'body2'} fontWeight={500} color={color}
                     sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, whiteSpace: wrap ? 'normal' : 'nowrap' }}>
    {glyph ? <span aria-hidden={'true'} style={{ display: 'inline-flex' }}>{glyph}</span> : null}
    {label}
  </Typography>;
};

export default StatusText;
